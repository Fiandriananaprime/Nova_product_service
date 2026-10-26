import { Prisma } from "../generated/prisma/index.js";
import { prisma } from "../database/prisma.js";
import type { GetinventoryQueryParams, Inventory, InventoryDto, InventoryItem } from "../types/inventory.js";

export class InventoryRepository{
    async initializeProductInventory (productId: string): Promise<Inventory>{
        return await prisma.inventory.create({data:{
            productId
        }})
    }

        async getInventory( storeId: string, params: GetinventoryQueryParams,): Promise<{ data: InventoryItem[];total: number;page: number;limit: number;totalPages: number;
        }> {
        const { search, status, page = 1, limit = 20 } = params;

        const offset = (page - 1) * limit;

        const searchFilter = search
            ? Prisma.sql`AND p.name ILIKE ${`%${search}%`}`
            : Prisma.empty;

        const statusFilter = status
            ? Prisma.sql`
                AND (
                CASE
                    WHEN i.stock = 0 THEN 'out_of_stock'
                    WHEN i.threshold > 0 AND i.stock > i.threshold THEN 'in_stock'
                    WHEN i.threshold > 0 AND i.stock <= i.threshold THEN 'low_stock'
                    WHEN i.stock < 10 THEN 'critical'
                    ELSE 'in_stock'
                END
                ) = ${status}
            `
            : Prisma.empty;

        const [countResult, rows] = await Promise.all([
            prisma.$queryRaw<{ total: bigint }[]>(Prisma.sql`
            SELECT COUNT(*) AS total
            FROM inventory i
            INNER JOIN product p ON p.id = i.product_id
            WHERE p.store_id = ${storeId}::uuid
                ${searchFilter}
                ${statusFilter}
            `),

            prisma.$queryRaw<InventoryItem[]>(Prisma.sql`
            SELECT
                i.product_id AS "productId",
                i.stock,
                i.reserved,
                i.threshold,
                i.updated_at AS "updatedAt",
                p.name,
                CASE
                WHEN i.stock = 0 THEN 'out_of_stock'
                WHEN i.threshold > 0 AND i.stock > i.threshold THEN 'in_stock'
                WHEN i.threshold > 0 AND i.stock <= i.threshold THEN 'low_stock'
                WHEN i.stock < 10 THEN 'critical'
                ELSE 'in_stock'
                END AS status
            FROM inventory i
            INNER JOIN product p ON p.id = i.product_id
            WHERE p.store_id = ${storeId}::uuid
                ${searchFilter}
                ${statusFilter}
            ORDER BY p.name ASC
            LIMIT ${limit}
            OFFSET ${offset}
            `),
        ]);

        const total = Number(countResult[0]?.total ?? 0);

        return {
            data: rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
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