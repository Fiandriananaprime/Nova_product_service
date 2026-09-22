import type { FastifyInstance } from "fastify";
import type { ProductController } from "../controller/product.controller.js";
import type { ReviewController } from "../controller/review.controller.js";

export const StoreRoute = (
    app: FastifyInstance,
    productController: ProductController,
    reviewController: ReviewController,
    option: {prefix: string}
) => {
    app.register((routes) => {
        routes.get<{Params:{id:string}; Querystring:{limit?: number, cursor?: string}}>(
            "/stores/:id/products",productController.findProductsByStoreId.bind(productController))
        routes.get<{Params:{id:string}; Querystring:{limit?: number, cursor?: string}}>(
            "/stores/:id/reviews",reviewController.findReviewsByStoreId.bind(reviewController))
    },option)
}