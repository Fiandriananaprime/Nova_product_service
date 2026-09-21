import type { ProductSpecs, ProductVariant } from "@Fiandriananaprime/nova_api_type";

export type { Product,ProductSpecs,ProductVariant } from "@Fiandriananaprime/nova_api_type"

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