import type { FastifyInstance } from "fastify";
import type { ProductInput } from "../types/product.js";
import type { SellerController } from "../controller/seller.controller.js";
import { registerProductSchemas } from "../schema/ProductInput.js";

export const SellerRoutes = async (
    app: FastifyInstance,
    sellerController: SellerController,
    option:{prefix: string}
) => {
    await registerProductSchemas(app);
    app.register((route) => {
        route.post<{Body:ProductInput}>("/products",{schema:{body: { $ref: "ProductInput#" }}},sellerController.createProduct.bind(sellerController))
    },option)
}