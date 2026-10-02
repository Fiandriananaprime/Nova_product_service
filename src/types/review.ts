export type Review = {
    id: string;
    productId: string;
    productName: string;
    storeId: string;
    customerId: string;
    customerName: string;
    rating: number;
    comment: string;
    date: string;
    replied: boolean;
    reply: string | null;
    replyDate: string | null;
    verifiedPurchase: boolean;
    helpfulCount: number;
    status: "published" | "hidden" | "pending" | "rejected";
};

export type CreateReviewInput = {
    rating: number;
    comment: string;
};