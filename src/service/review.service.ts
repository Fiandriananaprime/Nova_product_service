import type { ReviewRepository } from "../repository/review.repository.js";
import { ProductNotFoundError } from "../errorHandler/ProductError.js";
import { AppError } from "../errorHandler/AppError.js";
import { InvalidPaginationError } from "../errorHandler/PaginationError.js";
import type { CreateReviewInput } from "../types/review.js";

type Cursor = {
    date: string;
    id: string;
};

type ReviewRating = 1 | 2 | 3 | 4 | 5;

export class ReviewService {
    constructor(
        private readonly reviewRepository: ReviewRepository
    ){}
    private encodeCursor(cursor: Cursor) {
        return Buffer.from(JSON.stringify(cursor)).toString("base64url");
    }

    private decodeCursor(cursor: string): Cursor {
        try {
            const decoded = JSON.parse(
                Buffer.from(cursor, "base64url").toString("utf8"),
            ) as { date?: unknown; id?: unknown };

            if (
                typeof decoded.date !== "string" ||
                Number.isNaN(new Date(decoded.date).getTime()) ||
                typeof decoded.id !== "string" ||
                decoded.id.length === 0
            ) {
                throw new Error("Invalid cursor payload");
            }

            return { date: decoded.date, id: decoded.id };
        } catch {
            throw new InvalidPaginationError("Invalid reviews cursor");
        }
    }

    async createProductReview(
        productId: string,
        customerId: string | null,
        input: CreateReviewInput,
    ) {
        if (!customerId) {
            throw new AppError("UNAUTHORIZED", 401, "Authentication required");
        }

        const comment = input.comment.trim();
        if (!comment) {
            throw new AppError("VALIDATION_ERROR", 400, "Review comment cannot be empty");
        }

        if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
            throw new AppError("VALIDATION_ERROR", 400, "Rating must be an integer between 1 and 5");
        }

        const review = await this.reviewRepository.createProductReview(
            productId,
            customerId,
            input.rating,
            comment,
        );

        if (!review) throw new ProductNotFoundError();

        return review;
    }

    async getProductReviews(
        productId: string,
        limit = 10,
        cursor?: string,
        rating?: ReviewRating,
    ) {
        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            throw new InvalidPaginationError("limit must be an integer between 1 and 100");
        }

        const decoded = cursor
            ? this.decodeCursor(cursor)
            : undefined;

        const result = await this.reviewRepository.findReviews(
            productId,
            limit,
            decoded && {
                date: new Date(decoded.date),
                id: decoded.id,
            },
            rating,
        );

        const last = result.data.at(-1);

        return {
            data: result.data,
            meta: {
                nextCursor:
                    result.hasMore && last
                        ? this.encodeCursor({
                              date: last.date.toISOString(),
                              id: last.id,
                          })
                        : null,
                hasMore: result.hasMore,
            },
            counts: result.counts,
        };
    }

    async findReviewsByStoreId(
        storeId: string,
        limit: number,
        cursor?: string,
        rating?: ReviewRating
    ){
        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            throw new InvalidPaginationError("limit must be an integer between 1 and 100");
        }

        const decoded = cursor
            ? this.decodeCursor(cursor)
            : undefined;

        const result = await this.reviewRepository.findStoreReviews(
            storeId,
            limit,
            decoded && {
                date: new Date(decoded.date),
                id: decoded.id,
            },
            rating,
        );

        const last = result.data.at(-1);

        return {
            data: result.data,
            meta: {
                nextCursor:
                    result.hasMore && last
                        ? this.encodeCursor({
                              date: last.date.toISOString(),
                              id: last.id,
                          })
                        : null,
                hasMore: result.hasMore,
            },
            counts: result.counts,
        };
        
    }
}