import { AppError } from "./AppError.js";

export class ProductImageError extends AppError {
  constructor(message: string, statusCode = 400) {
    super("PRODUCT_IMAGE_ERROR", statusCode, message);
    this.name = "ProductImageError";
  }
}
