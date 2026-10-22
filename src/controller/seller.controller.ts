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
        const userRole = request.role
        if(!storeId || userRole != "SELLER" || typeof storeId !== "string") throw new ForbiddenError("Must have SellerRole");

        const products = await this.productService.getProductsBySellerId(storeId, request.query);
        return reply.status(200).send(products);
    }

    async createProduct( request: FastifyRequest<{Body:ProductInput}>,reply: FastifyReply){
        const storeId = request.headers["x-store-id"];
        const userRole = request.role;
        if(!storeId || userRole != "SELLER" || typeof storeId !== "string") throw new ForbiddenError("Must have SellerRole");

        const product = this.productService.createorUpdateDraftProduct(storeId,request.body,undefined);
        return reply.status(201).send(product)
    }

    async updateProduct(request: FastifyRequest<{Body: ProductInput, Params: {productId: string}}>, reply: FastifyReply){
        const storeId = request.headers["x-store-id"];
        const userRole = request.role;
        const sellerId= request.userId;
        const productId= request.params.productId;

        if(!storeId || userRole != "SELLER" || !sellerId || typeof storeId !== "string") throw new ForbiddenError("User dont have permission to access this ressources");

        const updatedProduct = await this.productService.createorUpdateDraftProduct( storeId,request.body,productId);

        return reply.status(200).send(updatedProduct);
    }
}