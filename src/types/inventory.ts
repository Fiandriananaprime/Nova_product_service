export interface Inventory {
    productId: string
    stock: number
    reserved: number
    threshold: number
}

export interface InventoryItem {
    productId: string
    name: string
    stock: number
    reserved: number
    threshold: number
    status: InventoryStatus
}


export type GetinventoryQueryParams = {
    search?: string,
    page?: number,
    limit?: number,
    status?: InventoryStatus
}
export type InventoryStatus = "in_stock" | "low_stock"| "out_of_stock"| "critical"

export type InventoryDto = {
    stock?: number
    threshold?: number
    reserved?: number
}