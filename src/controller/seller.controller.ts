import type { FastifyReply, FastifyRequest } from "fastify";
import type { ProductService } from "../service/product.service.js";
import type { GetProductStoreQueryParam, ProductInput } from "../types/product.js";
import { ForbiddenError } from "../errorHandler/InvalidCredentials.js";
import type { GetinventoryQueryParams, InventoryItem } from "../types/inventory.js";
import type { ReviewService } from "../service/review.service.js";
import type { PromotionInput } from "../types/promotion.js";
import type { PromotionService } from "../service/promotion.service.js";

export class SellerController {
    private readonly productService: ProductService
    private readonly reviewService: ReviewService
    private readonly promotionService: PromotionService

    constructor(ps:ProductService, rs:ReviewService, promotionService: PromotionService){
        this.productService=ps;
        this.reviewService=rs;
        this.promotionService=promotionService;
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
        request: FastifyRequest<{ Params: { productId: string }; Body: { path: string; isDefault?: boolean } }>,
        reply: FastifyReply,
    ) {
        const storeId = request.headers["x-store-id"];
        if (!storeId || request.role !== "SELLER" || typeof storeId !== "string") {
            throw new ForbiddenError("Must have SellerRole");
        }

        const { path, isDefault = false } = request.body ?? {};
        if (typeof path !== "string" || typeof isDefault !== "boolean") {
            return reply.status(400).send({ error: { code: "INVALID_IMAGE", message: "path and optional isDefault are required" } });
        }

        const image = await this.productService.addProductImage(
            request.params.productId,
            storeId,
            path,
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

    async showInventory(request: FastifyRequest<{Querystring: GetinventoryQueryParams}>, reply: FastifyReply): Promise<InventoryItem[]> {
        const storeId = request.headers["x-store-id"];
        const userRole = request.role;
        if(!storeId || userRole != "SELLER" || typeof storeId !== "string") throw new ForbiddenError("Must have SellerRole");
        const inventory = await this.productService.getInventory(storeId,request.query);
        return reply.status(200).send(inventory);
    }

    async updateProductStock(request: FastifyRequest<{Params: {productId: string}; Body: {stock: number; threshold: number}}>, reply: FastifyReply):Promise<InventoryItem> {
        const storeId = request.headers["x-store-id"];
        const userRole = request.role;
        const sellerId= request.userId;
        const productId= request.params.productId;
        if(!storeId || userRole != "SELLER" || !sellerId || typeof storeId !== "string") throw new ForbiddenError("User dont have permission to access this ressources");
        const inventory = await this.productService.updateProductStock(productId,storeId,request.body);
        return reply.status(200).send(inventory);
    }

    async replyToReview(request: FastifyRequest<{Params: {productId: string, id: string};Body: {response: string}}>, reply: FastifyReply){
        const storeId = request.headers["x-store-id"];
        const userRole = request.role;
        const sellerId= request.userId;
        const productId= request.params.productId;
        if(!storeId || userRole != "SELLER" || !sellerId || typeof storeId !== "string") throw new ForbiddenError("User dont have permission to access this ressources");
        const reviewId= request.params.id;
        const { response } = request.body;

        const updatedReview = await this.reviewService.replyToReview(storeId,productId, reviewId, response);
        return reply.status(200).send(updatedReview);
    }

    async getPromotions(request: FastifyRequest, reply: FastifyReply){
        const storeId = request.headers["x-store-id"];
        const userRole = request.role;
        if(!storeId || userRole != "SELLER" || typeof storeId !== "string") throw new ForbiddenError("Must have SellerRole");
        const promotions = await this.promotionService.getPromotionByStoreId(storeId);
        return reply.status(200).send(promotions);
    }

    async createPromotion(request: FastifyRequest<{Body: PromotionInput}>, reply: FastifyReply){
        const storeId = request.headers["x-store-id"];
        const userRole = request.role;
        if(!storeId || userRole != "SELLER" || typeof storeId !== "string") throw new ForbiddenError("Must have SellerRole");
        const promotion = await this.promotionService.createPromotion(storeId,request.body);
        return reply.status(201).send(promotion);
    }

    async updatePromotion(request: FastifyRequest<{Params: {promotionId: string}; Body: PromotionInput}>, reply: FastifyReply){
        const storeId = request.headers["x-store-id"];
        const userRole = request.role;
        if(!storeId || userRole != "SELLER" || typeof storeId !== "string") throw new ForbiddenError("Must have SellerRole");
        const promotionId = request.params.promotionId;
        const promotion = await this.promotionService.updatePromotion(promotionId,request.body);
        return reply.status(200).send(promotion);
    }

    async deletePromotion(request: FastifyRequest<{Params: {promotionId: string}}>, reply: FastifyReply){
        const storeId = request.headers["x-store-id"];
        const userRole = request.role;
        if(!storeId || userRole != "SELLER" || typeof storeId !== "string") throw new ForbiddenError("Must have SellerRole");
        const promotionId = request.params.promotionId;
        await this.promotionService.deletePromotion(promotionId);
        return reply.status(204).send();
    }
}