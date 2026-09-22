import { AppError } from "./AppError.js";

export class ProductNotFoundError extends AppError {
    constructor(){
        super(
            "PRODUCT_NOT_FOUND",
            404,
            "Product not found"
        )
    }
}