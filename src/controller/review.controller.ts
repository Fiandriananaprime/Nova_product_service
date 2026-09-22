import type { FastifyReply, FastifyRequest } from "fastify";
import type { ReviewService } from "../service/review.service.js";

type ReviewQuery = {
    limit?: number;
    cursor?: string;
    rating?: "all" | "1" | "2" | "3" | "4" | "5";
};

export class ReviewController {
    constructor (
        private readonly reviewService: ReviewService
    ){}

    async getProductReviews(
        request: FastifyRequest<{Params:{id:string}, Querystring:ReviewQuery}>,
        reply: FastifyReply
    ){
        const id = request.params.id
        const { limit: rawLimit, cursor, rating: rawRating} = request.query
        const limit = rawLimit === undefined ? 20 : Number(rawLimit);
        const rating = rawRating && rawRating !== "all" ? Number(rawRating) : undefined;

        const reviews = await this.reviewService.getProductReviews(id,limit,cursor,rating as 1 | 2 | 3 | 4 | 5 | undefined);

        return reply.status(200).send(reviews)
    }

    async findReviewsByStoreId(
        request: FastifyRequest<{Params:{id:string}, Querystring:ReviewQuery}>,
        reply: FastifyReply
    ){
        const storeId = request.params.id
        const { limit: rawLimit, cursor, rating: rawRating} = request.query
        const limit = rawLimit === undefined ? 20 : Number(rawLimit);
        const rating = rawRating && rawRating !== "all" ? Number(rawRating) : undefined;

        const reviews = await this.reviewService.findReviewsByStoreId(storeId,limit,cursor,rating as 1 | 2 | 3 | 4 | 5 | undefined);

        return reply.status(200).send(reviews)
    }

}