import { AppError } from "./AppError.js";

export class ForbiddenError extends AppError {
    constructor(message?: string){
        super(
            "USER_NOT_ALLOWED",
            403,
            message || "The User is not allowed"
        )
    }

}