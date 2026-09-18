import type { FastifyInstance } from "fastify";
import { ProductRepository } from "./repository/product.repository.js";
import { ProductService } from "./service/product.service.js";
import { ProductController } from "./controller/product.controller.js";
import { ProductRoute } from "./routes/product.route.js";

export const routes = (app: FastifyInstance) => {
    // Dependencies
    const productRepository = new ProductRepository();

    //Service
    const productService = new ProductService(productRepository);

    // Controller
    const productController = new ProductController(productService);

    ProductRoute(app,productController,{prefix:"/api"})

};