import { AppError } from "./AppError.js";

export class PromotionError extends AppError {
    constructor(message: string, statusCode: number = 400) {
        super("PROMOTION_ERROR", statusCode, message);
    }
}