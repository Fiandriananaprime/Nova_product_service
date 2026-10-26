export interface PromotionInput {
  name: string;
  type: promotionType;
  discount: number;
  description?: string;
  code?: string;
  productIds: string[];
  startDate: string; 
  endDate: string; 
  minimumOrderAmount?: number | null;
  maximumDiscount?: number | null;
  usageLimit: number | null;
  isAutomatic: boolean;
}

export interface Promotion {
  id: string;
  storeId: string;
  storeName?: string;
  name: string;
  type: promotionType;
  discount: number;
  productIds: string[];
  startDate: string; 
  endDate: string; 
  status: "active" | "scheduled" | "inactive" | "expired";
  code: string | null;
  minimumOrderAmount: number | null;
  maximumDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isAutomatic: boolean;
}

export type promotionType = "percentage" | "fixed";