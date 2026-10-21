import { AppError } from "./AppError.js";

export class ProductValidationError extends AppError {
    constructor(message: string) {
        super("PRODUCT_VALIDATION_ERROR", 400, message);
    }
}