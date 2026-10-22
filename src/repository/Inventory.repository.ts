import { prisma } from "../database/prisma.js";
import type { Inventory, InventoryDto } from "../types/inventory.js";

export class InventoryRepository{
    async initializeProductInventory (productId: string): Promise<Inventory>{
        return await prisma.inventory.create({data:{
            productId
        }})
    }

    async updateInventory(productId: string, data:InventoryDto): Promise<Inventory>{
        return await prisma.inventory.update({
            where:{productId},
            data
        })
    }

    async getLowStockProducts(): Promise<string[]> {
        const lowStock = await prisma.$queryRaw<{ product_id: string }[]>`
            SELECT product_id
            FROM inventory
            WHERE (stock - reserved) > 0
            AND (stock - reserved) <= threshold
        `;

        return lowStock.map(p => p.product_id);
    }

    async getOutOfStockProducts(): Promise<string[]>{
        const products = await prisma.inventory.findMany({
            where:{stock:0},
            select:{productId:true}
        })
        return products.map(p => p.productId);
    }
}