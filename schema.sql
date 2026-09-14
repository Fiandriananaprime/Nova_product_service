CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE product_status AS ENUM (
    'draft',
    'active',
    'inactive',
    'pending',
    'approved',
    'rejected'
);

CREATE TYPE inventory_movement_type AS ENUM (
    'manual',
    'sale',
    'reservation',
    'release',
    'audit',
    'adjustment'
);

CREATE TYPE moderation_action AS ENUM (
    'approved',
    'rejected'
);

CREATE TYPE promotion_type AS ENUM (
    'percentage',
    'fixed'
);

CREATE TYPE promotion_status AS ENUM (
    'active',
    'scheduled',
    'inactive',
    'expired'
);


-- ============================================================
-- PRODUCTS
-- ============================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,

    brand VARCHAR(255),

    description TEXT NOT NULL DEFAULT '',

    price DECIMAL(19,4) NOT NULL,

    rating DECIMAL(3,2) NOT NULL DEFAULT 0,

    reviews_count INTEGER NOT NULL DEFAULT 0,

    store_id UUID NOT NULL,

    category_id UUID NOT NULL,

    low_stock_threshold INTEGER NOT NULL DEFAULT 10,

    sku VARCHAR(255),

    tags TEXT[] NOT NULL DEFAULT '{}',

    specs JSONB NOT NULL DEFAULT '{}',

    variants JSONB NOT NULL DEFAULT '[]',

    status product_status NOT NULL DEFAULT 'draft',

    views INTEGER NOT NULL DEFAULT 0,

    sold_count INTEGER NOT NULL DEFAULT 0,

    wishlist_count INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    deleted_at TIMESTAMPTZ(6)
);


-- ============================================================
-- PRODUCT IMAGES
-- ============================================================

CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL,

    url TEXT NOT NULL,

    is_default BOOLEAN NOT NULL DEFAULT FALSE,

    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT product_images_product_id_fkey
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
);


-- ============================================================
-- INVENTORY
-- ============================================================

CREATE TABLE inventory (
    product_id UUID PRIMARY KEY,

    stock INTEGER NOT NULL DEFAULT 0,

    reserved INTEGER NOT NULL DEFAULT 0,

    threshold INTEGER NOT NULL DEFAULT 10,

    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT inventory_product_id_fkey
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
);


-- ============================================================
-- INVENTORY MOVEMENTS
-- ============================================================

CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL,

    delta INTEGER NOT NULL,

    quantity_before INTEGER NOT NULL,

    quantity_after INTEGER NOT NULL,

    type inventory_movement_type NOT NULL,

    reference_type VARCHAR(255),

    reference_id VARCHAR(255),

    actor_id UUID,

    reason TEXT,

    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT inventory_movements_product_id_fkey
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT
);


-- ============================================================
-- INVENTORY AUDITS
-- ============================================================

CREATE TABLE inventory_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL,

    expected_stock INTEGER NOT NULL,

    counted_stock INTEGER NOT NULL,

    difference INTEGER NOT NULL,

    reason TEXT,

    notes TEXT,

    moderator_id UUID NOT NULL,

    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT inventory_audits_product_id_fkey
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT
);


-- ============================================================
-- PRODUCT MODERATION HISTORY
-- ============================================================

CREATE TABLE product_moderation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL,

    actor_id UUID NOT NULL,

    action moderation_action NOT NULL,

    reason TEXT,

    is_admin_override BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT product_moderation_history_product_id_fkey
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT
);


-- ============================================================
-- PROMOTIONS
-- ============================================================

CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    store_id UUID,

    name VARCHAR(255) NOT NULL,

    type promotion_type NOT NULL,

    discount DECIMAL(19,4) NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    status promotion_status NOT NULL DEFAULT 'scheduled',

    code VARCHAR(255),

    minimum_order_amount DECIMAL(19,4),

    maximum_discount DECIMAL(19,4),

    usage_limit INTEGER,

    used_count INTEGER NOT NULL DEFAULT 0,

    is_automatic BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);


-- ============================================================
-- PROMOTION PRODUCTS
-- ============================================================

CREATE TABLE promotion_products (
    promotion_id UUID NOT NULL,

    product_id UUID NOT NULL,

    CONSTRAINT promotion_products_pkey
        PRIMARY KEY (promotion_id, product_id),

    CONSTRAINT promotion_products_promotion_id_fkey
        FOREIGN KEY (promotion_id)
        REFERENCES promotions(id)
        ON DELETE CASCADE,

    CONSTRAINT promotion_products_product_id_fkey
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
);


-- ============================================================
-- PROMOTION USAGE
-- ============================================================

CREATE TABLE promotion_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    promotion_id UUID NOT NULL,

    user_id UUID NOT NULL,

    order_id VARCHAR(255),

    discount_amount DECIMAL(19,4) NOT NULL,

    used_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT promotion_usages_promotion_id_fkey
        FOREIGN KEY (promotion_id)
        REFERENCES promotions(id)
        ON DELETE RESTRICT
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_products_store_status
    ON products (store_id, status, created_at DESC);

CREATE INDEX idx_products_category
    ON products (category_id);

CREATE INDEX idx_products_price
    ON products (price);

CREATE INDEX idx_products_rating
    ON products (rating DESC);

CREATE INDEX idx_products_sku
    ON products (store_id, sku);


CREATE INDEX idx_product_images_product
    ON product_images (product_id, sort_order, id);


CREATE INDEX idx_inventory_low_stock
    ON inventory (stock, threshold);


CREATE INDEX idx_inventory_movements_product_date
    ON inventory_movements (product_id, created_at DESC);

CREATE INDEX idx_inventory_movements_reference
    ON inventory_movements (reference_type, reference_id);


CREATE INDEX idx_inventory_audits_product_date
    ON inventory_audits (product_id, created_at DESC);

CREATE INDEX idx_inventory_audits_moderator_date
    ON inventory_audits (moderator_id, created_at DESC);


CREATE INDEX idx_product_moderation_history_product
    ON product_moderation_history (product_id, created_at DESC);


CREATE INDEX idx_promotions_store_dates
    ON promotions (store_id, start_date, end_date, status);


CREATE INDEX idx_promotion_products_product
    ON promotion_products (product_id);


CREATE INDEX idx_promotion_usages_promotion
    ON promotion_usages (promotion_id, used_at DESC);

CREATE INDEX idx_promotion_usages_user
    ON promotion_usages (user_id, used_at DESC);