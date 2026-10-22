import { prisma } from "../database/prisma.js";
import { InvalidPaginationError } from "../errorHandler/PaginationError.js";
import { ProductModerationError } from "../errorHandler/ProductError.js";
import { ProductImageError } from "../errorHandler/ProductImageError.js";
import type { Prisma } from "../generated/prisma/index.js";
import type { GetProductQueryParam, GetProductStoreQueryParam, Product, ProductBuyer, ProductInput, ProductModerationStatus, ProductSpecs, ProductStoreSummary, ProductSummary, ProductVariant } from "../types/product.js";

export class ProductRepository {

    async createProductImage(productId: string, storeId: string, path: string, isDefault: boolean) {
        return prisma.$transaction(async (tx) => {
            const product = await tx.product.findFirst({
                where: { id: productId, storeId, deletedAt: null },
                select: { id: true },
            });
            if (!product) return null;

            const currentImageCount = await tx.productImage.count({ where: { productId } });
            if (currentImageCount >= 10) {
                throw new ProductImageError("A product can have at most 10 images", 400);
            }

            if (isDefault) {
                await tx.productImage.updateMany({
                    where: { productId, isDefault: true },
                    data: { isDefault: false },
                });
            }

            return tx.productImage.create({
                data: {
                    productId,
                    path,
                    isDefault: isDefault || currentImageCount === 0,
                    sortOrder: currentImageCount,
                },
            });
        });
    }

    async findProductByIdAndStoreId(productId:string, storeId: string){
        const product = await prisma.product.findUnique({
            where:{id:productId,storeId}
        })

        return product
    }

    async getProductsForGrpc(productIds: string[]) {
        if (productIds.length === 0) return [];

        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds },
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                price: true,
                rating: true,
                reviewsCount: true,
                storeId: true,
                storeName: true,
                images: {
                    where: { isDefault: true },
                    orderBy: { sortOrder: "asc" },
                    select: { path: true },
                    take: 1,
                },
                inventory: {
                    select: { stock: true },
                },
            },
        });

        const productsById = new Map(products.map((product) => [product.id, product]));
        return productIds.flatMap((productId) => {
            const product = productsById.get(productId);
            if (!product) return [];

            return [{
                productId: product.id,
                name: product.name,
                image: product.images[0]?.path ?? "",
                price: Number(product.price),
                sellerId: product.storeId,
                sellerName: product.storeName,
                stock: product.inventory?.stock ?? 0,
                rating: Number(product.rating),
                reviewCount: product.reviewsCount,
                storeId: product.storeId,
                storeName: product.storeName,
            }];
        });
    }
    
    async getProductsBySellerId(
        sellerId: string,
        params: GetProductStoreQueryParam,
        inventoryProductIds?: string[],
    ): Promise<{
        data: ProductStoreSummary[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
    }> {
        const { search = "", page = 1, limit = 20, status = "all", moderationStatus, categoryId } = params;
        const term = search.trim();

        const where: Prisma.ProductWhereInput = {
            storeId: sellerId,
            deletedAt: null,
            ...((status === "lowstock" || status === "outOfStock") && {
                id: { in: inventoryProductIds ?? [] },
            }),
            ...(moderationStatus && { moderationStatus }),
            ...(categoryId && { categoryId }),
            ...(term && {
            OR: [
                { name: { contains: term, mode: "insensitive" } },
                { brand: { contains: term, mode: "insensitive" } },
                { description: { contains: term, mode: "insensitive" } },
                { sku: { contains: term, mode: "insensitive" } },
                { categoryName: { contains: term, mode: "insensitive" } },
                { tags: { has: term } },
            ],
            }),
        };

        const [products, total] = await prisma.$transaction([
            prisma.product.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                images: {
                orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
                },
            },
            }),
            prisma.product.count({ where }),
        ]);

        return {
            data: products.map((product): ProductStoreSummary => ({
            id: product.id,
            name: product.name,
            brand: product.brand,
            price: product.price.toNumber(),
            rating: product.rating.toNumber(),
            reviewsCount: product.reviewsCount,
            categoryId: product.categoryId,
            status: product.status,
            moderationStatus: product.moderationStatus,
            images: product.images.find((image) => image.isDefault)?.path ?? product.images[0]?.path ?? null,
            createdAt: product.createdAt.toISOString(),
            tags: product.tags,
            })),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async createProduct(storeId: string, data: ProductInput & { id: string | undefined }) {
        const { id, images, ...productData } = data;
        const existingProduct = id ? await prisma.product.findUnique({ where: { id } }) : null;
        if(existingProduct && existingProduct.moderationStatus != "draft") throw new ProductModerationError();

        if(!id) return prisma.product.create({
            data: {
                ...productData,
                storeId,
                images: {
                    create: images?.map(({ path, isDefault }, index) => ({
                        path,
                        isDefault: isDefault || (index === 0 && !images?.some((image) => image.isDefault)),
                    })) ?? [],
                },
            },
            include: {
                images: true,
            },
        });

        return prisma.product.upsert({
            where: { id, storeId },
            create: {
                ...productData,
                id,
                storeId,
                images: {
                    create: images?.map(({ path, isDefault }, index) => ({
                        path,
                        isDefault: isDefault || (index === 0 && !images?.some((image) => image.isDefault)),
                    })) ?? [],
                },
            },
            update: {
                ...productData,
                storeId,
                images: {
                    deleteMany: {},
                    create: images?.map(({ path, isDefault }, index) => ({
                        path,
                        isDefault: isDefault || (index === 0 && !images?.some((image) => image.isDefault)),
                    })) ?? [],
                },
            },
            include: {
                images: true,
            },
        });
    }
    async findProducts(params: GetProductQueryParam) {
        const {
            search = "",
            page = 1,
            limit = 20,
            minRating = 0,
            minPrice = 0,
            maxPrice = 9999999999,
            category = "",
            onSale = false,
            sort = "relevance"
        } = params;

        const where: Prisma.ProductWhereInput = {
            ...(search && {
                name: {
                    contains: search,
                    mode: "insensitive"
                }
            }),

            ...(category && {
                categoryId: category
            }),

            price: {
                gte: minPrice,
                lte: maxPrice
            },

            rating: {
                gte: minRating
            },

            ...(onSale && {
                discount: {
                    gt: 0
                }
            }),

            status: "active",
            deletedAt: null
        };

        const orderBy: Prisma.ProductOrderByWithRelationInput =
            sort === "price_asc"
                ? { price: "asc" }
                : sort === "price_desc"
                    ? { price: "desc" }
                    : sort === "rating"
                        ? { rating: "desc" }
                        : sort === "popularity"
                            ? { soldCount: "desc" }
                            : { createdAt: "desc" };

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,

                select: {
                    id: true,
                    name: true,
                    brand: true,
                    price: true,
                    rating: true,
                    reviewsCount: true,
                    storeId: true,
                    categoryId: true,
                    status: true,
                    createdAt: true,
                    tags: true,

                    images: {
                        where: {
                            isDefault: true
                        },
                        select: {
                            path: true
                        },
                        take: 1
                    }
                },

                orderBy,
                skip: (page - 1) * limit,
                take: limit
            }),

            prisma.product.count({
                where
            })
        ]);

        const data:ProductSummary[] = products.map(product => ({
            id: product.id,
            name: product.name,
            brand: product.brand,
            price: Number(product.price),
            rating: Number(product.rating),
            reviewsCount: product.reviewsCount,
            storeId: product.storeId,
            categoryId: product.categoryId,
            status: product.status,
            images: product.images[0]?.path ?? null,
            createdAt: product.createdAt.toISOString(),
            tags: product.tags
        }));

        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getFeaturedProducts() {
        const featured = await prisma.featuredProduct.findMany({
            where: {
                startsAt: { lte: new Date() },
                OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
                status: "active"
            },
            orderBy: { position: "asc" },
            take: 8,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        brand: true,
                        price: true,
                        rating: true,
                        reviewsCount: true,
                        storeId: true,
                        categoryId: true,
                        status: true,
                        createdAt: true,
                        tags: true,
                        images: {
                            where: {
                                isDefault: true,
                            },
                            select: {
                                path: true,
                            },
                            take: 1,
                        },
                    },
                },
            },
        });

        const data: ProductSummary[] = featured.map(({ product }) => ({
            id: product.id,
            name: product.name,
            brand: product.brand,
            price: Number(product.price),
            rating: Number(product.rating),
            reviewsCount: product.reviewsCount,
            storeId: product.storeId,
            categoryId: product.categoryId,
            status: product.status,
            images: product.images[0]?.path ?? null,
            createdAt: product.createdAt.toISOString(),
            tags: product.tags,
        }));

        return {
            data,
        };
    }

    async findProductById(id: string, role: "SELLER" | "BUYER", storeId?: string): Promise< Product | ProductBuyer | null>{
        const product = await prisma.product.findUnique({
            where: {id},
            include:{images:true}
        })
        if(!product) return null

        if(role === "SELLER" && storeId){
            if(product.storeId !== storeId) return null

            const stock = await prisma.inventory.findUnique({
                where:{productId:id},
                select:{stock:true,threshold:true}
            })
            const productSeller: Product = {
                id: product.id,
                name: product.name,
                brand: product.brand,
                description: product.description,
                price: Number(product.price),
                rating: Number(product.rating),
                reviewsCount: product.reviewsCount,
                storeId: product.storeId,
                storeName: product.storeName,
                categoryId: product.categoryId,
                categoryName: product.categoryName,
                lowStockThreshold: stock?.threshold ?? 0,
                stock: stock?.stock ?? 0,
                images: product.images.map(image => ({
                    path: image.path,
                    isDefault: image.isDefault
                })),
                sku: product.sku,
                tags: product.tags,
                specs: product.specs as ProductSpecs,
                variants: product.variants as ProductVariant[],
                status: product.status,
                moderationStatus: product.moderationStatus,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
                views: product.views,
                soldCount: product.soldCount,
                wishlistCount: product.wishlistCount
            }
            return productSeller
        }
        return {
            id: product.id,
            name: product.name,
            brand: product.brand,
            description: product.description,
            price: product.price.toNumber(),
            rating: product.rating.toNumber(),
            reviewsCount: product.reviewsCount,
            storeId: product.storeId,
            storeName: product.storeName,
            categoryId: product.categoryId,
            categoryName: product.categoryName,
            images: product.images,
            sku: product.sku,
            tags: product.tags,
            specs: product.specs as ProductSpecs,
            variants: product.variants as ProductVariant[],
            createdAt: product.createdAt,
        };
    }

    async findRelatedProducts( categoryIds: string[], productId: string, limit = 20, cursor?: string ) {
        let cursorData: { createdAt: string; id: string } | null = null;

        if (cursor) {
            try {
                const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
                    createdAt?: unknown;
                    id?: unknown;
                };

                if (
                    typeof decoded.createdAt !== "string" ||
                    Number.isNaN(new Date(decoded.createdAt).getTime()) ||
                    typeof decoded.id !== "string" ||
                    decoded.id.length === 0
                ) {
                    throw new Error("Invalid cursor payload");
                }

                cursorData = { createdAt: decoded.createdAt, id: decoded.id };
            } catch {
                throw new InvalidPaginationError("Invalid related products cursor");
            }
        }

        const where: Prisma.ProductWhereInput = {
            categoryId: {
                in: categoryIds
            },
            id: {
                not: productId
            },
            status: "active",
            deletedAt: null,

            ...(cursorData && {
                OR: [
                    {
                        createdAt: {
                            lt: new Date(cursorData.createdAt)
                        }
                    },
                    {
                        createdAt: new Date(cursorData.createdAt),
                        id: {
                            lt: cursorData.id
                        }
                    }
                ]
            })
        };

        const products = await prisma.product.findMany({
            where,
            select: {
                id: true,
                name: true,
                brand: true,
                price: true,
                rating: true,
                reviewsCount: true,
                storeId: true,
                categoryId: true,
                status: true,
                createdAt: true,
                tags: true,
                images: {
                    where: { isDefault: true },
                    select: { path: true },
                    take: 1
                }
            },
            orderBy: [
                { createdAt: "desc" },
                { id: "desc" }
            ],
            take: limit + 1
        });

        const hasMore = products.length > limit;
        const data = products.slice(0, limit);

        const last = data.at(-1);

        const nextCursor =
            hasMore && last
                ? Buffer.from(
                    JSON.stringify({
                        createdAt: last.createdAt.toISOString(),
                        id: last.id
                    })
                ).toString("base64url")
                : null;

        return {
            data: data.map(p => ({
                ...p,
                price: Number(p.price),
                rating: Number(p.rating),
                images: p.images[0]?.path ?? null,
                createdAt: p.createdAt.toISOString()
            })),
            meta: {
                nextCursor,
                hasMore
            }
        };
    }

    async findStoreProducts(
        storeId: string,
        limit: number,
        cursor?: { date: Date; id: string },
    ) {
        return prisma.product.findMany({
            where: {
                storeId,
                status: "active",
                deletedAt: null,

                ...(cursor && {
                    OR: [
                        {
                            createdAt: {
                                lt: cursor.date,
                            },
                        },
                        {
                            createdAt: cursor.date,
                            id: {
                                lt: cursor.id,
                            },
                        },
                    ],
                }),
            },

            select: {
                id: true,
                name: true,
                brand: true,
                price: true,
                rating: true,
                reviewsCount: true,
                storeId: true,
                categoryId: true,
                status: true,
                createdAt: true,
                tags: true,
                images: {
                    where: {
                        isDefault: true,
                    },
                    select: {
                        path: true,
                    },
                    take: 1,
                },
            },

            orderBy: [
                { createdAt: "desc" },
                { id: "desc" },
            ],

            take: limit + 1,
        });
    }

    async confirmProduct(productId: string,storeId: string, moderationStatus:ProductModerationStatus){
        const product = await prisma.product.update({
            where:{id: productId, storeId},
            data:{moderationStatus}
        })

        return product
    }

    async deleteProduct(productId: string){
        await prisma.product.update({
            where:{id: productId},
            data:{deletedAt: new Date(), status:"inactive"}
        })
    }
}