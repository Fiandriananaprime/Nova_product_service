import type { FastifyReply, FastifyRequest } from "fastify";
import type { ProductService } from "../service/product.service.js";
import type { GetProductQueryParam } from "../types/product.js";

export class ProductController {
    constructor (
        private readonly productService: ProductService
    ){}

    async findProducts(request: FastifyRequest<{Querystring:GetProductQueryParam}>,reply: FastifyReply){
        const products = await this.productService.findProducts(request.query);

        return reply.status(200).send(products)
    }

    async getFeaturedProducts(_request: FastifyRequest,reply: FastifyReply){
        const featuredProducts = await this.productService.getFeaturedProducts();

        return reply.status(200).send(featuredProducts)
    }

}