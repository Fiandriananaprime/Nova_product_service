import { getRelatedCategoryIds } from "../client/grpc/store.client.js";
import { InvalidPaginationError } from "../errorHandler/PaginationError.js";
import { ProductNotFoundError } from "../errorHandler/ProductError.js";
import type { ProductRepository } from "../repository/product.repository.js";
import type { GetProductQueryParam } from "../types/product.js";

export class ProductService {
    constructor(
        private readonly productRepository : ProductRepository
    ){}

    async findProducts( params: GetProductQueryParam){
        return this.productRepository.findProducts(params)
    }

    async getFeaturedProducts() {
        const products = await this.productRepository.getFeaturedProducts();

        return products;
    }

    async findProductById(id: string){
        const product = await this.productRepository.findProductById(id);

        if(!product) throw new ProductNotFoundError()

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

        const product = await this.productRepository.findProductById(productId);

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
}