import { getRelatedCategoryIds } from "../client/grpc/store.client.js";
import { getCategorySpecs as getCategorySpecsFromStore } from "../client/grpc/category-spec.client.js";
import type { CategorySpec } from "../client/grpc/category-spec.client.js";
import { InvalidPaginationError } from "../errorHandler/PaginationError.js";
import { ProductModerationError, ProductNotFoundError } from "../errorHandler/ProductError.js";
import type { ProductRepository } from "../repository/product.repository.js";
import type { GetProductQueryParam, GetProductStoreQueryParam, Product, ProductBuyer, ProductInput, ProductStoreSummary } from "../types/product.js";
import type { InventoryRepository } from "../repository/Inventory.repository.js";
import { parseProductVariants, validateProductSpecs } from "./validation.js";
import { ForbiddenError } from "../errorHandler/InvalidCredentials.js";
import { ProductImageError } from "../errorHandler/ProductImageError.js";

export class ProductService {
    constructor(
        private readonly productRepository : ProductRepository,
        private readonly inventoryRepository: InventoryRepository
    ){}

    async getCategorySpecs(categoryId: string): Promise<CategorySpec[]> {
        return getCategorySpecsFromStore(categoryId);
    }

    async findProducts( params: GetProductQueryParam){
        return this.productRepository.findProducts(params)
    }

    async getProductsBySellerId(sellerId: string, params: GetProductStoreQueryParam): Promise<{
        data: ProductStoreSummary[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
        LowStock: number;
        OutOfStock: number;
    }> {
        const [lowStock, outOfStock] = await Promise.all([
            this.inventoryRepository.getLowStockProducts(),
            this.inventoryRepository.getOutOfStockProducts(),
        ]);
        const inventoryProductIds =
            params.status === "lowstock" ? lowStock :
            params.status === "outOfStock" ? outOfStock :
            undefined;

        const data = await this.productRepository.getProductsBySellerId(
            sellerId,
            params,
            inventoryProductIds,
        );

        return {
            ...data,
            LowStock: lowStock.length,
            OutOfStock: outOfStock.length,
        };
    }

    async getFeaturedProducts() {
        const products = await this.productRepository.getFeaturedProducts();

        return products;
    }

    async createorUpdateDraftProduct( storeId: string, data: ProductInput,id?:string): Promise<Product> {
        const productSpecs = await this.getCategorySpecs(data.categoryId);

        const validatedSpecs = validateProductSpecs(productSpecs, data.specs);
        const inventory = await this.inventoryRepository.initializeProductInventory(storeId);
        const product = await this.productRepository.createProduct(
            storeId, { ...data, specs: validatedSpecs,id });

        return {
            ...product,
            price: Number(product.price),
            rating: Number(product.rating),
            stock: inventory.stock,
            variants: parseProductVariants(product.variants),
        };
    }

    async findProductById(id: string, role: "SELLER" | "BUYER", storeId?: string): Promise<Product | ProductBuyer> {
        const product = await this.productRepository.findProductById(id, role, storeId);

        if(!product) throw new ProductNotFoundError()

        if(role === "SELLER" && storeId){
            if(product.storeId !== storeId) throw new ForbiddenError("Product does not belong to the specified store");
        }

        return product
    }

    async findRelatedProducts(
        productId: string,
        limit = 20,
        cursor?: string
    ) {
        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            throw new InvalidPaginationError("limit must be an integer between 1 and 100");
        }

        const product = await this.productRepository.findProductById(productId,"BUYER");

        if (!product)
            throw new Error("Product not found");

        let categoryIds = [product.categoryId];

        try {
            categoryIds = await getRelatedCategoryIds(product.categoryId);
        } catch {
            categoryIds= [product.categoryId]
        }

        return this.productRepository.findRelatedProducts(
            categoryIds,
            productId,
            limit,
            cursor
        );
    }

    async findProductsByStoreId(
        storeId: string,
        limit = 20,
        cursor?: string,
    ) {
        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            throw new InvalidPaginationError(
                "limit must be an integer between 1 and 100",
            );
        }

        let cursorData: { date: Date; id: string } | undefined;

        if (cursor) {
            try {
                const decoded = JSON.parse(
                    Buffer.from(cursor, "base64url").toString("utf8"),
                ) as {
                    createdAt?: unknown;
                    id?: unknown;
                };

                if (
                    typeof decoded.createdAt !== "string" ||
                    Number.isNaN(new Date(decoded.createdAt).getTime()) ||
                    typeof decoded.id !== "string" ||
                    !decoded.id
                ) {
                    throw new Error();
                }

                cursorData = {
                    date: new Date(decoded.createdAt),
                    id: decoded.id,
                };
            } catch {
                throw new InvalidPaginationError(
                    "Invalid store products cursor",
                );
            }
        }

        const result = await this.productRepository.findStoreProducts(
            storeId,
            limit,
            cursorData,
        );

        const hasMore = result.length > limit;
        const data = result.slice(0, limit);
        const last = data.at(-1);

        const nextCursor =
            hasMore && last
                ? Buffer.from(
                    JSON.stringify({
                        createdAt: last.createdAt.toISOString(),
                        id: last.id,
                    }),
                ).toString("base64url")
                : null;

        return {
            data: data.map((product) => ({
                ...product,
                price: Number(product.price),
                rating: Number(product.rating),
                images: product.images[0]?.url ?? "",
                createdAt: product.createdAt.toISOString(),
            })),
            meta: {
                nextCursor,
                hasMore,
            },
        };
    }

    async confirmProduct(storeId: string, productId: string) {
        const product = await this.productRepository.findProductByIdAndStoreId(productId, storeId);
        if (!product) throw new ProductNotFoundError();
        if (product.storeId !== storeId) throw new ProductNotFoundError();
        if (product.moderationStatus !== "draft") throw new ProductModerationError();
        await this.productRepository.confirmProduct(productId,storeId,"pending");
    }

    async duplicateProduct(productId: string, storeId: string) {
        const product = await this.productRepository.findProductById(productId, "SELLER", storeId);
        if (!product) throw new ProductNotFoundError();
        const data : ProductInput = {
            name: product.name,
            storeName: product.storeName,
            categoryName: product.categoryName,
            description: product.description,
            brand: product.brand ?? "",
            categoryId: product.categoryId,
            tags: product.tags,
            price: product.price,
            stock: 0,
            specs: product.specs ?? {},
        };
        const productSpecs = await this.getCategorySpecs(data.categoryId);

        const validatedSpecs = validateProductSpecs(productSpecs, data.specs);
        const inventory = await this.inventoryRepository.initializeProductInventory(storeId);
        const duplicatedProduct = await this.productRepository.createProduct(
            storeId, { ...data, specs: validatedSpecs,id: undefined });
        return  {
            ...duplicatedProduct,
            price: Number(duplicatedProduct.price),
            rating: Number(duplicatedProduct.rating),
            stock: inventory.stock,
            variants: parseProductVariants(duplicatedProduct.variants),
        };;
    }

    async addProductImage(productId: string, storeId: string, url: string, isDefault: boolean) {
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch {
            throw new ProductImageError("Invalid Firebase Storage URL", 400);
        }

        const allowedHosts = new Set(["firebasestorage.googleapis.com", "storage.googleapis.com"]);
        if (parsedUrl.protocol !== "https:" || !allowedHosts.has(parsedUrl.hostname)) {
            throw new ProductImageError("Image URL must point to Firebase Storage", 400);
        }

        // Verify that the uploaded object is publicly/token accessible before storing its URL.
        const response = await fetch(parsedUrl, { method: "HEAD", signal: AbortSignal.timeout(5000) });
        if (!response.ok) {
            throw new ProductImageError("Firebase Storage image does not exist or is not accessible", 400);
        }
        const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
        if (!contentType?.startsWith("image/")) {
            throw new ProductImageError("Firebase Storage object is not an image", 400);
        }

        const image = await this.productRepository.createProductImage(productId, storeId, url, isDefault);
        if (!image) throw new ProductNotFoundError();
        return image;
    }

    async deleteProduct(productId: string,storeId: string) {
        const product = await this.productRepository.findProductById(productId, "SELLER", storeId);
        if (!product) throw new ProductNotFoundError();
        await this.productRepository.deleteProduct(productId);
    }
}