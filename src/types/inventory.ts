export interface Inventory {
    productId: string
    stock: number
    reserved: number
    threshold: number
}

export type InventoryDto = Omit<Inventory,"productId">