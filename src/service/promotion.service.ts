import { PromotionError } from "../errorHandler/PromotionError.js";
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

    async updatePromotion(promotionId: string, promotionData: PromotionInput): Promise<Promotion> {
        const promotion = await this.promotionRepository.getPromotionById(promotionId);
        if(!promotion) throw new PromotionError(`Promotion  not found`, 404);
        if(new Date() > promotion.startDate) throw new PromotionError(`Cannot update promotion that has already started`, 403);
        const status = new Date(promotionData.startDate) > new Date() ? "scheduled" : "active";
        const updatedPromotion = await this.promotionRepository.updatePromotion(promotionId, promotionData);
        return { 
            ...updatedPromotion,
            productIds: updatedPromotion.products.map((p) => p.productId), 
            status,
            minimumOrderAmount: updatedPromotion.minimumOrderAmount ? Number(updatedPromotion.minimumOrderAmount) : null,
            maximumDiscount: updatedPromotion.maximumDiscount ? Number(updatedPromotion.maximumDiscount) : null,
            discount: Number(updatedPromotion.discount),
            startDate: updatedPromotion.startDate.toISOString(),
            endDate: updatedPromotion.endDate.toISOString(),
        };
    }

    async deletePromotion(promotionId: string): Promise<void> {
        const promotion = await this.promotionRepository.getPromotionById(promotionId);
        if(!promotion) throw new PromotionError(`Promotion  not found`, 404);
        if(new Date() > promotion.startDate) throw new PromotionError(`Cannot delete promotion that has already started`, 403);
        await this.promotionRepository.deletePromotion(promotionId, promotion.storeId);
    }
}