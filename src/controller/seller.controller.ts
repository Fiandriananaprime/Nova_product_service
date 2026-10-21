import type { FastifyReply, FastifyRequest } from "fastify";
import type { ProductService } from "../service/product.service.js";
import type { GetProductStoreQueryParam, ProductInput } from "../types/product.js";
import { ForbiddenError } from "../errorHandler/InvalidCredentials.js";

export class SellerController {
    private readonly productService: ProductService

    constructor(ps:ProductService){
        this.productService=ps
    }

    async getProductsBySellerId(request: FastifyRequest<{Querystring: GetProductStoreQueryParam}>, reply: FastifyReply) {
        const storeId = request.headers["x-store-id"];
        if(!storeId || typeof storeId !== "string") throw new ForbiddenError("Must have SellerRole");

        const products = await this.productService.getProductsBySellerId(storeId, request.query);
        return reply.status(200).send(products);
    }

    async createProduct( request: FastifyRequest<{Body:ProductInput}>,reply: FastifyReply){
        const storeId = request.headers["x-store-id"];
        if(!storeId || typeof storeId !== "string") throw new ForbiddenError("Must have SellerRole");

        const product = this.productService.createDraftProduct(storeId,request.body)
        return reply.status(201).send(product)
    }
}