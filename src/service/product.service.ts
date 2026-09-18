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
}