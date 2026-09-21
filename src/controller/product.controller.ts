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

        return reply.status(200).send(featuredProducts);
    }

    async findProductById(request: FastifyRequest<{Params:{id:string}}>, reply: FastifyReply){
        const id = request.params.id
        const product = await this.productService.findProductById(id)

        return reply.status(200).send(product)
    }

    async findRelatedProducts(
        request: FastifyRequest<{Params:{id: string},Querystring:{limit?: number,cursor?: string}}>,
        reply: FastifyReply
    ){
        const id = request.params.id;
        const {limit = 20, cursor} = request.query

        const products = await this.productService.findRelatedProducts(id,limit,cursor);

        return reply.status(200).send(products)
    }

}