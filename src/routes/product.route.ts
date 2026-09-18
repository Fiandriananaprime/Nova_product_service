import type { FastifyInstance } from "fastify";
import type { ProductController } from "../controller/product.controller.js";

export const ProductRoute = (
    app: FastifyInstance,
    productController: ProductController,
    option: { prefix: string}
) => {
    app.register((route) => {
        route.get("/products",productController.findProducts.bind(productController))
    },option)
}