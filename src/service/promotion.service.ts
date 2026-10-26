import type { PromotionRepository } from "../repository/promotion.repository.js";
import type { Promotion, PromotionInput } from "../types/promotion.js";

export class PromotionService {
    private readonly promotionRepository: PromotionRepository;

    constructor(promotionRepository: PromotionRepository) {
        this.promotionRepository = promotionRepository;
    }

    async getPromotionById(promotionId: string) {
        return this.promotionRepository.getPromotionById(promotionId);
    }

    async getPromotionByStoreId(storeId: string) {
        return this.promotionRepository.getPromotionByStoreId(storeId);
    }

    async createPromotion(storeId: string, promotionData: PromotionInput): Promise<Promotion> {
        const status = new Date(promotionData.startDate) > new Date() ? "scheduled" : "active";
        const promotion = await this.promotionRepository.createPromotion(storeId, promotionData);
        return { 
            ...promotion,
            productIds: promotion.products.map((p) => p.productId), 
            status,
            minimumOrderAmount: promotion.minimumOrderAmount ? Number(promotion.minimumOrderAmount) : null,
            maximumDiscount: promotion.maximumDiscount ? Number(promotion.maximumDiscount) : null,
            discount: Number(promotion.discount),
            startDate: promotion.startDate.toISOString(),
            endDate: promotion.endDate.toISOString(),
        };
    }
}