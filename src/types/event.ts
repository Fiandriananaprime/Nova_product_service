export interface OrderDeliveredEvent {
    orderId: string;
    userId: string;
    items: OrderDeliveredItem[];
    deliveredAt: string;
}

export interface OrderDeliveredItem {
    orderItemId: string;
    productId: string;
}