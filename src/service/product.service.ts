import type { ProductRepository } from "../repository/product.repository.js";
import type { GetProductQueryParam, ProductSummary } from "../types/product.js";

export class ProductService {
    constructor(
        private readonly productRepository : ProductRepository
    ){}

    async findProducts(
        params: GetProductQueryParam
    ){
        return this.productRepository.findProducts(params)
    }

    async getFeaturedProducts() :Promise<ProductSummary[]>{
        const products = await this.productRepository.getFeaturedProducts();

        return products
    }
}