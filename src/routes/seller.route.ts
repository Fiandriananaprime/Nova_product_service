import type { FastifyInstance } from "fastify";
import type { GetProductStoreQueryParam, ProductInput } from "../types/product.js";
import type { SellerController } from "../controller/seller.controller.js";
import { registerProductSchemas } from "../schema/ProductInput.js";

export const SellerRoutes = async (
    app: FastifyInstance,
    sellerController: SellerController,
    option:{prefix: string}
) => {
    await registerProductSchemas(app);
    app.register((route) => {
        route.get<{Querystring: GetProductStoreQueryParam}>("/products",sellerController.getProductsBySellerId.bind(sellerController))
        route.post<{Params: {productId: string}; Body: {url: string; isDefault?: boolean}}>(
            "/products/:productId/images",
            sellerController.uploadProductImage.bind(sellerController),
        )
        route.post<{Body:ProductInput}>("/products",{schema:{body: { $ref: "ProductInput#" }}},sellerController.createProduct.bind(sellerController))
        route.put<{Body: ProductInput, Params: {productId: string}}>("/products/:productId",{schema:{body: { $ref: "ProductInput#" }}},sellerController.updateProduct.bind(sellerController))
        route.patch<{Params: {productId: string}}>("/products/:productId",sellerController.confirmProduct.bind(sellerController))
        route.post<{Params: {productId: string}}>("/products/:productId", sellerController.duplicateProduct.bind(sellerController))
        route.delete<{Params: {productId: string}}>("/products/:productId", sellerController.deleteProduct.bind(sellerController))
    },option)
}