import { prisma } from "../database/prisma.js";
import { Prisma } from "../generated/prisma/edge.js";
import type { PromotionInput } from "../types/promotion.js";

export class PromotionRepository {
    async getPromotionById(promotionId: string) {
        return prisma.promotion.findUnique({
            where: { id: promotionId },
        });
    }

    async getPromotionByStoreId(storeId: string) {
        return prisma.promotion.findMany({
            where: { storeId },
            include: {
                    products: {
                        select: {
                            productId: true,
                        },
                    },
                },
        });
    }

    async createPromotion(storeId: string, promotionData: PromotionInput) {
        return prisma.promotion.create({
            data: {
                storeId,
                name: promotionData.name,
                type: promotionData.type,
                discount: promotionData.discount,
                description: promotionData.description? promotionData.description : null,
                code: promotionData.code? promotionData.code : null,
                startDate: new Date(promotionData.startDate),
                endDate: new Date(promotionData.endDate),
                minimumOrderAmount:
                    promotionData.minimumOrderAmount != null
                        ? new Prisma.Decimal(promotionData.minimumOrderAmount)
                        : null,

                    maximumDiscount:
                    promotionData.maximumDiscount != null? new Prisma.Decimal(promotionData.maximumDiscount)
                        : null,
                usageLimit: promotionData.usageLimit,
                isAutomatic: promotionData.isAutomatic ?? false,
                products: {
                    createMany: {
                        data: promotionData.productIds.map((productId) => ({
                            productId,
                        })),
                    },
                },
            },
            include: {
                products: {
                    select: {
                        productId: true,
                    },
                },
            },
        });
    }
}