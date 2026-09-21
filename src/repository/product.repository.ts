import { prisma } from "../database/prisma.js";
import type { Prisma } from "../generated/prisma/index.js";
import type { GetProductQueryParam, ProductSummary } from "../types/product.js";

export class ProductRepository {

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
                            url: true
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
            images: product.images[0]?.url ?? null,
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

    async getFeaturedProducts() :Promise<ProductSummary[]>{
        return prisma.featuredProduct.findMany({
                where: {
                startsAt: { lte: new Date() },
                OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
            },
            orderBy: { position: "asc" },
            take: 8,
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
                            url: true
                        },
                        take: 1
                    }
                }
        })
    }
}