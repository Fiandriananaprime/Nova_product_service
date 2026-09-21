import type { FastifyInstance } from "fastify";
import type { ProductController } from "../controller/product.controller.js";

export const StoreRoute = (
    app: FastifyInstance,
    productController: ProductController,
    option: {prefix: string}
) => {
    app.register((routes) => {
        routes.get<{Params:{id:string}; Querystring:{limit?: number, cursor?: string}}>(
            "/stores/:id/products",productController.findProductsByStoreId.bind(productController))
    },option)
}