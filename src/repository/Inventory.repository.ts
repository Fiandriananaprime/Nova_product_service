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
}