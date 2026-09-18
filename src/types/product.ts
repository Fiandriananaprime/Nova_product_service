export type { Product } from "@Fiandriananaprime/nova_api_type"

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
    images: string;
    createdAt: string;
    tags: string[];
};
