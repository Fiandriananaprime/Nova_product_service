import { prisma } from "../database/prisma.js";

export class ReviewRepository {
    async createProductReview(
        productId: string,
        customerId: string,
        rating: number,
        comment: string,
    ) {
        const product = await prisma.product.findFirst({
            where: {
                id: productId,
                status: "active",
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                storeId: true,
                images: {
                    where: { isDefault: true },
                    select: { url: true },
                    take: 1,
                },
            },
        });

        if (!product) return null;

        return prisma.review.create({
            data: {
                productId: product.id,
                productName: product.name,
                storeId: product.storeId,
                customerId,
                customerName: "Customer",
                rating,
                comment,
                productImage: product.images[0]?.url ?? null,
                verifiedPurchase: false,
                status: "pending",
            },
        });
    }

    async findReviews(
        productId: string,
        limit: number,
        cursor?: { date: Date; id: string },
        rating?: number,
    ) {
        const where = {
            productId,
            status: "published" as const,
            ...(rating !== undefined ? { rating } : {}),
        };

        const [reviews, ratingGroups] = await Promise.all([
            prisma.review.findMany({
                where,
                take: limit + 1,
                ...(cursor && {
                    cursor: {
                        date_id: {
                            date: cursor.date,
                            id: cursor.id,
                        },
                    },
                    skip: 1,
                }),
                orderBy: [
                    { date: "desc" },
                    { id: "desc" },
                ],
            }),

            prisma.review.groupBy({
                by: ["rating"],
                where: {
                    productId,
                    status: "published",
                },
                _count: {
                    _all: true,
                },
            }),
        ]);

        const hasMore = reviews.length > limit;

        if (hasMore) reviews.pop();

        const counts = {
            "1": 0,
            "2": 0,
            "3": 0,
            "4": 0,
            "5": 0,
        };

        for (const group of ratingGroups) {
            counts[String(group.rating) as keyof typeof counts] =
                group._count._all;
        }

        return {
            data: reviews,
            hasMore,
            counts,
        };
    }

    async findStoreReviews(
        storeId: string,
        limit: number,
        cursor?: { date: Date; id: string },
        rating?: number,
    ) {
        const where = {
            storeId,
            status: "published" as const,
            ...(rating !== undefined ? { rating } : {}),
        };

        const [reviews, ratingGroups] = await Promise.all([
            prisma.review.findMany({
                where,
                take: limit + 1,
                ...(cursor && {
                    cursor: {
                        date_id: {
                            date: cursor.date,
                            id: cursor.id,
                        },
                    },
                    skip: 1,
                }),
                orderBy: [
                    { date: "desc" },
                    { id: "desc" },
                ],
            }),

            prisma.review.groupBy({
                by: ["rating"],
                where: {
                    storeId,
                    status: "published",
                },
                _count: {
                    _all: true,
                },
            }),
        ]);

        const hasMore = reviews.length > limit;

        if (hasMore) reviews.pop();

        const counts = {
            "1": 0,
            "2": 0,
            "3": 0,
            "4": 0,
            "5": 0,
        };

        for (const group of ratingGroups) {
            counts[String(group.rating) as keyof typeof counts] =
                group._count._all;
        }

        return {
            data: reviews,
            hasMore,
            counts,
        };
    }
    
}