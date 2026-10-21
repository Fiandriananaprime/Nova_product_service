import type { FastifyInstance } from "fastify";
import type { ProductInput } from "../types/product.js";
import type { SellerController } from "../controller/seller.controller.js";

export const SellerRoutes = async (
    app: FastifyInstance,
    sellerController: SellerController,
    option:{prefix: string}
) => {
    app.register((route) => {
        route.post<{Body:ProductInput}>("/products",sellerController.createProduct.bind(sellerController))
    },option)
}