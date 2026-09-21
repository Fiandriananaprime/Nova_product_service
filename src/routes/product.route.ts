import type { FastifyInstance } from "fastify";
import type { ProductController } from "../controller/product.controller.js";

export const ProductRoute = (
    app: FastifyInstance,
    productController: ProductController,
    option: { prefix: string}
) => {
    app.register((route) => {
        route.get("/products",productController.findProducts.bind(productController))
        route.get("/products/featured",productController.getFeaturedProducts.bind(productController))
        route.get<{Params:{id: string}}>("/products/:id",productController.findProductById.bind(productController))
        route.get<{Params:{id:string};Querystring:{limit?: number, cursor?: string}}>(
            "/products/:id/related",productController.findRelatedProducts.bind(productController))
    },option)
}