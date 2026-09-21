import { AppError } from "./AppError.js";

export class InvalidPaginationError extends AppError {
  constructor(message = "Invalid pagination cursor or limit") {
    super("INVALID_PAGINATION", 400, message);
  }
}