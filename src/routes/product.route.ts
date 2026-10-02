import type { FastifyInstance } from "fastify";
import type { ProductController } from "../controller/product.controller.js";
import type { ReviewController } from "../controller/review.controller.js";
import { createProductReviewSchema } from "../schema/review.js";

export const ProductRoute = (
    app: FastifyInstance,
    productController: ProductController,
    reviewController: ReviewController,
    option: { prefix: string}
) => {
    app.register((route) => {
        route.get("/products",productController.findProducts.bind(productController))
        route.get("/products/featured",productController.getFeaturedProducts.bind(productController))
        route.get<{Params:{id: string}}>("/products/:id",productController.findProductById.bind(productController))
        route.get<{Params:{id:string};Querystring:{limit?: number, cursor?: string}}>("/products/:id/related",productController.findRelatedProducts.bind(productController))
        route.get<{Params:{id:string}; Querystring:{limit?: number, cursor?: string}}>("/products/:id/reviews",reviewController.getProductReviews.bind(reviewController))
        route.post<{Params:{id:string}; Body:{rating:number;comment:string}}>("/products/:id/reviews",{schema: createProductReviewSchema},reviewController.createProductReview.bind(reviewController),
        )
    },option)
}