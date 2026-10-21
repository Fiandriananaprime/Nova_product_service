import type { ProductSpecs, ProductVariant } from "@Fiandriananaprime/nova_api_type";
import type { InputJsonValue, JsonValue } from "@prisma/client/runtime/client";

export type { ProductSpecs,ProductVariant } from "@Fiandriananaprime/nova_api_type"

export type GetProductQueryParam = {
    search?: string,
    page?: number,
    limit?: number,
    category?: string,
    minPrice?: number,
    maxPrice?: number,
    minRating?: number,
    onSale?: boolean,
    sort: "price_asc" | "price_desc" | "rating" | "newest" | "relevance" | "popularity"
}
export type ProductStatus = "active" | "inactive"

export type GetProductStoreQueryParam = {
    search?: string,
    page?: number,
    limit?: number,
    categoryId?: string,
    status: ProductStatus 
    moderationStatus: ProductModerationStatus,
}
export type ProductSummary = {
    id: string;
    name: string;
    brand: string | null;
    price: number;
    rating: number;
    reviewsCount: number;
    storeId: string;
    categoryId: string;
    status: ProductStatus;
    images: string | null;
    createdAt: string;
    tags: string[];
};

export type ProductStoreSummary = {
    id: string;
    name: string;
    brand: string | null;
    price: number;
    rating: number;
    reviewsCount: number;
    categoryId: string;
    status: ProductStatus;
    moderationStatus: ProductModerationStatus;
    images: string | null;
    createdAt: string;
    tags: string[];
};

export type ProductModerationStatus = "draft" | "pending" | "approved" | "rejected";

export interface Product {
  id: string;
  name: string;
  brand: string | null;
  description: string;
  price: number;
  rating: number;
  reviewsCount: number;
  storeId: string;
  storeName: string;
  categoryId: string;
  categoryName: string;
  lowStockThreshold: number;
  images: ProductImage[];
  stock: number;
  sku: string | null;
  tags: string[];
  specs: JsonValue;
  variants?: ProductVariant[] | null;
  status: ProductStatus;
  moderationStatus: ProductModerationStatus;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  soldCount: number;
  wishlistCount: number;
}

export interface ProductImage {
  url: string;
  isDefault: boolean;
}

export interface ProductBuyer {
    id: string;
    name: string;
    brand?: string | null;
    description: string;
    price: number;
    rating: number;
    reviewsCount: number;
    storeId: string;
    storeName: string;
    categoryId: string;
    categoryName: string;
    images: {
        url: string;
        isDefault: boolean;
    }[];
    sku?: string | null;
    tags: string[];
    specs: ProductSpecs;
    variants: ProductVariant[];
    createdAt: Date;
}

export interface ProductInput {
  name: string;
  storeName: string;
  categoryName: string;
  description?: string;
  brand?: string | null;
  categoryId: string;
  tags?: string[];
  images?: ProductImageInput[];
  price: number;
  stock: number;
  specs: InputJsonValue;
  variants?: ProductVariant[];
  status?: ProductStatus;
}

export interface ProductImageInput {
  url: string;
  isDefault: boolean;
}