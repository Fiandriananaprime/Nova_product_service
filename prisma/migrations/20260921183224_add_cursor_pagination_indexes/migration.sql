-- CreateEnum
CREATE TYPE "product_moderation_status" AS ENUM ('draft', 'pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "product_status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "inventory_movement_type" AS ENUM ('manual', 'sale', 'reservation', 'release', 'audit', 'adjustment');

-- CreateEnum
CREATE TYPE "moderation_action" AS ENUM ('approved', 'rejected');

-- CreateEnum
CREATE TYPE "promotion_type" AS ENUM ('percentage', 'fixed');

-- CreateEnum
CREATE TYPE "promotion_status" AS ENUM ('active', 'scheduled', 'inactive', 'expired');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('published', 'hidden', 'pending', 'rejected');

-- CreateTable
CREATE TABLE "Review" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "productName" TEXT NOT NULL,
    "storeId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "customerName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "replied" BOOLEAN NOT NULL DEFAULT false,
    "reply" TEXT,
    "replyDate" TIMESTAMP(3),
    "productImage" TEXT,
    "verifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "price" DECIMAL(19,4) NOT NULL,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "reviews_count" INTEGER NOT NULL DEFAULT 0,
    "store_id" UUID NOT NULL,
    "store_name" TEXT NOT NULL,
    "category_id" UUID NOT NULL,
    "category_name" TEXT NOT NULL,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 10,
    "sku" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specs" JSONB NOT NULL DEFAULT '{}',
    "variants" JSONB NOT NULL DEFAULT '[]',
    "views" INTEGER NOT NULL DEFAULT 0,
    "sold_count" INTEGER NOT NULL DEFAULT 0,
    "wishlist_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "moderation_status" "product_moderation_status" NOT NULL DEFAULT 'draft',
    "status" "product_status" NOT NULL DEFAULT 'inactive',

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "featured_products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6),

    CONSTRAINT "featured_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "product_id" UUID NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "threshold" INTEGER NOT NULL DEFAULT 10,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "delta" INTEGER NOT NULL,
    "quantity_before" INTEGER NOT NULL,
    "quantity_after" INTEGER NOT NULL,
    "type" "inventory_movement_type" NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "actor_id" UUID,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_audits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "expected_stock" INTEGER NOT NULL,
    "counted_stock" INTEGER NOT NULL,
    "difference" INTEGER NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "moderator_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_moderation_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "action" "moderation_action" NOT NULL,
    "reason" TEXT,
    "is_admin_override" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_moderation_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_id" UUID,
    "name" TEXT NOT NULL,
    "type" "promotion_type" NOT NULL,
    "discount" DECIMAL(19,4) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "promotion_status" NOT NULL DEFAULT 'scheduled',
    "code" TEXT,
    "minimum_order_amount" DECIMAL(19,4),
    "maximum_discount" DECIMAL(19,4),
    "usage_limit" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "is_automatic" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_products" (
    "promotion_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,

    CONSTRAINT "promotion_products_pkey" PRIMARY KEY ("promotion_id","product_id")
);

-- CreateTable
CREATE TABLE "promotion_usages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "promotion_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" TEXT,
    "discount_amount" DECIMAL(19,4) NOT NULL,
    "used_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_reviews_product_status_date_id" ON "Review"("productId", "status", "date" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "Review_productId_idx" ON "Review"("productId");

-- CreateIndex
CREATE INDEX "Review_storeId_idx" ON "Review"("storeId");

-- CreateIndex
CREATE INDEX "Review_customerId_idx" ON "Review"("customerId");

-- CreateIndex
CREATE INDEX "Review_status_idx" ON "Review"("status");

-- CreateIndex
CREATE INDEX "Review_date_idx" ON "Review"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Review_date_id_key" ON "Review"("date", "id");

-- CreateIndex
CREATE INDEX "idx_products_store_status" ON "products"("store_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_products_related_cursor" ON "products"("category_id", "status", "deleted_at", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "idx_products_category" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "idx_products_price" ON "products"("price");

-- CreateIndex
CREATE INDEX "idx_products_rating" ON "products"("rating" DESC);

-- CreateIndex
CREATE INDEX "idx_products_sku" ON "products"("store_id", "sku");

-- CreateIndex
CREATE INDEX "featured_products_position_idx" ON "featured_products"("position");

-- CreateIndex
CREATE INDEX "featured_products_starts_at_ends_at_idx" ON "featured_products"("starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "idx_product_images_product" ON "product_images"("product_id", "sort_order", "id");

-- CreateIndex
CREATE INDEX "idx_inventory_low_stock" ON "inventory"("stock", "threshold");

-- CreateIndex
CREATE INDEX "idx_inventory_movements_product_date" ON "inventory_movements"("product_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_inventory_movements_reference" ON "inventory_movements"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "idx_inventory_audits_product_date" ON "inventory_audits"("product_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_inventory_audits_moderator_date" ON "inventory_audits"("moderator_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_product_moderation_history_product" ON "product_moderation_history"("product_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_promotions_store_dates" ON "promotions"("store_id", "start_date", "end_date", "status");

-- CreateIndex
CREATE INDEX "idx_promotion_products_product" ON "promotion_products"("product_id");

-- CreateIndex
CREATE INDEX "idx_promotion_usages_promotion" ON "promotion_usages"("promotion_id", "used_at" DESC);

-- CreateIndex
CREATE INDEX "idx_promotion_usages_user" ON "promotion_usages"("user_id", "used_at" DESC);

-- AddForeignKey
ALTER TABLE "featured_products" ADD CONSTRAINT "featured_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_audits" ADD CONSTRAINT "inventory_audits_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_moderation_history" ADD CONSTRAINT "product_moderation_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_usages" ADD CONSTRAINT "promotion_usages_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
