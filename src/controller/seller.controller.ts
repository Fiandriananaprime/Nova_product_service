import type { FastifyReply, FastifyRequest } from "fastify";
import type { ProductService } from "../service/product.service.js";
import type { GetProductStoreQueryParam, ProductInput } from "../types/product.js";
import { ForbiddenError } from "../errorHandler/InvalidCredentials.js";

export class SellerController {
    private readonly productService: ProductService

    constructor(ps:ProductService){
        this.productService=ps
    }

    async getProductById(request: FastifyRequest<{Params: {productId: string}}>, reply: FastifyReply){
        const productId = request.params.productId;
        const storeId = request.headers["x-store-id"];
        const userRole = request.role;
        if(!storeId || userRole != "SELLER" || typeof storeId !== "string") throw new ForbiddenError("Must have SellerRole");
        const product = await this.productService.findProductById(productId, "SELLER", storeId);
        return reply.status(200).send(product);
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
    
    async confirmProduct(request: FastifyRequest<{Params: {productId: string}}>, reply: FastifyReply){
        const storeId = request.headers["x-store-id"];
        const userRole = request.role;
        const sellerId= request.userId;
        const productId= request.params.productId;

        if(!storeId || userRole != "SELLER" || !sellerId || typeof storeId !== "string") throw new ForbiddenError("User dont have permission to access this ressources");

        await this.productService.confirmProduct(storeId, productId);

        return reply.status(204).send({message:"Product successfully submitted"});
    }

    async duplicateProduct(request: FastifyRequest<{Params: {productId: string}}>, reply: FastifyReply){
        const storeId = request.headers["x-store-id"];
        const userRole = request.role;
        const sellerId= request.userId;
        const productId= request.params.productId;
        if(!storeId || userRole != "SELLER" || !sellerId || typeof storeId !== "string") throw new ForbiddenError("User dont have permission to access this ressources");
        const product = await this.productService.duplicateProduct(productId,storeId);
        return reply.status(201).send(product);
    }

    async uploadProductImage(
        request: FastifyRequest<{ Params: { productId: string }; Body: { url: string; isDefault?: boolean } }>,
        reply: FastifyReply,
    ) {
        const storeId = request.headers["x-store-id"];
        if (!storeId || request.role !== "SELLER" || typeof storeId !== "string") {
            throw new ForbiddenError("Must have SellerRole");
        }

        const { url, isDefault = false } = request.body ?? {};
        if (typeof url !== "string" || typeof isDefault !== "boolean") {
            return reply.status(400).send({ error: { code: "INVALID_IMAGE", message: "url and optional isDefault are required" } });
        }

        const image = await this.productService.addProductImage(
            request.params.productId,
            storeId,
            url,
            isDefault,
        );
        return reply.status(201).send(image);
    }

    async deleteProduct(request: FastifyRequest<{Params: {productId: string}}>, reply: FastifyReply){
        const storeId = request.headers["x-store-id"];
        const userRole = request.role;
        const sellerId= request.userId;
        const productId= request.params.productId;
        if(!storeId || userRole != "SELLER" || !sellerId || typeof storeId !== "string") throw new ForbiddenError("User dont have permission to access this ressources");
        await this.productService.deleteProduct(productId,storeId);
        return reply.status(204).send({message:"Product successfully deleted"});
    }
}