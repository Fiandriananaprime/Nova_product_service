import { getRelatedCategoryIds } from "../client/grpc/store.client.js";
import { ProductNotFoundError } from "../errorHandler/ProductError.js";
import type { ProductRepository } from "../repository/product.repository.js";
import type { GetProductQueryParam } from "../types/product.js";

export class ProductService {
    constructor(
        private readonly productRepository : ProductRepository
    ){}

    async findProducts(
        params: GetProductQueryParam
    ){
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
}