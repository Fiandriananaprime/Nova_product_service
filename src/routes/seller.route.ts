import type { FastifyInstance } from "fastify";
import type { GetProductStoreQueryParam, ProductInput } from "../types/product.js";
import type { SellerController } from "../controller/seller.controller.js";
import { registerProductSchemas } from "../schema/ProductInput.js";
import type { GetinventoryQueryParams } from "../types/inventory.js";
import { InventoryUpdateSchema } from "../schema/Inventory.js";
import { PromotionInputSchema } from "../schema/promotion.js";
import type { PromotionInput } from "../types/promotion.js";

export const SellerRoutes = async (
    app: FastifyInstance,
    sellerController: SellerController,
    option:{prefix: string}
) => {
    await registerProductSchemas(app);
    app.register((route) => {
        route.get<{Querystring: GetProductStoreQueryParam}>("/products",sellerController.getProductsBySellerId.bind(sellerController))
        route.post<{Params: {productId: string}; Body: {path: string; isDefault?: boolean}}>(
            "/products/:productId/images",
            sellerController.uploadProductImage.bind(sellerController),
        )
        route.post<{Body:ProductInput}>("/products",{schema:{body: { $ref: "ProductInput#" }}},sellerController.createProduct.bind(sellerController))
        route.put<{Body: ProductInput, Params: {productId: string}}>("/products/:productId",{schema:{body: { $ref: "ProductInput#" }}},sellerController.updateProduct.bind(sellerController))
        route.patch<{Params: {productId: string}}>("/products/:productId",sellerController.confirmProduct.bind(sellerController))
        route.post<{Params: {productId: string}}>("/products/:productId", sellerController.duplicateProduct.bind(sellerController))
        route.delete<{Params: {productId: string}}>("/products/:productId", sellerController.deleteProduct.bind(sellerController))
        route.get<{Querystring: GetinventoryQueryParams}>("/products/inventory", sellerController.showInventory.bind(sellerController))
        route.patch<{Params: {productId: string}, Body: {stock: number; threshold: number}}>("/products/:productId/inventory/",{schema:InventoryUpdateSchema},sellerController.updateProductStock.bind(sellerController))
        route.post<{Params: {productId: string, id: string},Body: {response: string}}>("/products/:productId/reviews/:id/",sellerController.replyToReview.bind(sellerController))
        route.get("/promotions", sellerController.getPromotions.bind(sellerController))
        route.post<{Body:PromotionInput}>("/promotions",{schema: PromotionInputSchema}, sellerController.createPromotion.bind(sellerController))
        route.put<{Params: {promotionId: string}; Body: PromotionInput}>("/promotions/:promotionId",{schema: PromotionInputSchema}, sellerController.updatePromotion.bind(sellerController))
        route.delete<{Params: {promotionId: string}}>("/promotions/:promotionId", sellerController.deletePromotion.bind(sellerController))
    },option)
}