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
}