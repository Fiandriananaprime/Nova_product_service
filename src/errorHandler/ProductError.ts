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

export class ProductModerationError extends AppError {
    constructor(){
        super(
            "PRODUCT_MODERATION_ERROR",
            409,
            "Product is already approved and cannot be modified"
        )
    }
}