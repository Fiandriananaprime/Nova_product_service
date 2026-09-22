import type { FastifyInstance } from "fastify";
import { ProductRepository } from "./repository/product.repository.js";
import { ProductService } from "./service/product.service.js";
import { ProductController } from "./controller/product.controller.js";
import { ProductRoute } from "./routes/product.route.js";
import { ReviewRepository } from "./repository/review.repository.js";
import { ReviewService } from "./service/review.service.js";
import { ReviewController } from "./controller/review.controller.js";
import { StoreRoute } from "./routes/store.route.js";

export const routes = (app: FastifyInstance) => {
    // Dependencies
    const productRepository = new ProductRepository();
    const reviewRepository = new ReviewRepository();

    //Service
    const productService = new ProductService(productRepository);
    const reviewService = new ReviewService(reviewRepository);

    // Controller
    const productController = new ProductController(productService);
    const reviewController = new ReviewController(reviewService)

    ProductRoute(app,productController,reviewController,{prefix:"/api"})
    StoreRoute(app,productController,reviewController,{prefix:"/api"})

};