-- =============================================================================
-- HIND TYRES AND ACCESSORIES - SUPABASE POSTGRESQL DATABASE SCHEMA
-- =============================================================================
-- Run this script in your Supabase project's SQL Editor to create all tables,
-- constraints, indexes, and initial default settings.
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE (Admin & Counter Staff)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'COUNTER' CHECK (role IN ('ADMIN', 'COUNTER')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TYRE COMPANIES
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) UNIQUE NOT NULL,
    contact_person VARCHAR(120),
    phone VARCHAR(30),
    email VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TYRES CATALOG
CREATE TABLE IF NOT EXISTS tyres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    model_name VARCHAR(120) NOT NULL,
    size VARCHAR(60) NOT NULL,
    vehicle_type VARCHAR(40) NOT NULL DEFAULT 'Car',
    sku VARCHAR(100) UNIQUE NOT NULL,
    purchase_price_paise BIGINT NOT NULL CHECK (purchase_price_paise >= 0),
    selling_price_paise BIGINT NOT NULL CHECK (selling_price_paise >= 0),
    mrp_paise BIGINT NOT NULL CHECK (mrp_paise >= 0),
    gst_percent NUMERIC(5,2) NOT NULL DEFAULT 28.00,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 4 CHECK (low_stock_threshold >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. ACCESSORIES CATALOG
CREATE TABLE IF NOT EXISTS accessories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    category VARCHAR(60) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    purchase_price_paise BIGINT NOT NULL CHECK (purchase_price_paise >= 0),
    selling_price_paise BIGINT NOT NULL CHECK (selling_price_paise >= 0),
    mrp_paise BIGINT NOT NULL CHECK (mrp_paise >= 0),
    gst_percent NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(255),
    address TEXT,
    vehicle_number VARCHAR(40),
    vehicle_model VARCHAR(100),
    total_purchases_paise BIGINT NOT NULL DEFAULT 0,
    total_invoices_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. SALES / INVOICES
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no VARCHAR(60) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_snapshot JSONB NOT NULL,
    subtotal_paise BIGINT NOT NULL CHECK (subtotal_paise >= 0),
    gst_paise BIGINT NOT NULL CHECK (gst_paise >= 0),
    discount_paise BIGINT NOT NULL DEFAULT 0 CHECK (discount_paise >= 0),
    total_paise BIGINT NOT NULL CHECK (total_paise >= 0),
    payment_mode VARCHAR(30) NOT NULL DEFAULT 'CASH' CHECK (payment_mode IN ('CASH', 'UPI', 'CARD', 'NET_BANKING', 'CHEQUE')),
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'CANCELLED')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    email_status JSONB DEFAULT '{"customer": {"sent": false}, "admin": {"sent": false}}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. SALE LINE ITEMS
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('Tyre', 'Accessory')),
    item_id UUID NOT NULL,
    name VARCHAR(150) NOT NULL,
    company VARCHAR(120),
    size VARCHAR(60),
    sku VARCHAR(100),
    qty INTEGER NOT NULL CHECK (qty > 0),
    unit_price_paise BIGINT NOT NULL,
    gst_percent NUMERIC(5,2) NOT NULL,
    line_total_paise BIGINT NOT NULL
);

-- 8. STOCK MOVEMENTS (Audited Ledger)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('Tyre', 'Accessory')),
    item_id UUID NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    type VARCHAR(40) NOT NULL CHECK (type IN ('PURCHASE', 'SALE', 'SALE_CANCEL', 'ADJUST_ADD', 'ADJUST_REMOVE', 'ADJUST_DAMAGE', 'INITIAL_STOCK')),
    qty INTEGER NOT NULL,
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    reference VARCHAR(120),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. SHOP SETTINGS
CREATE TABLE IF NOT EXISTS shop_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_name VARCHAR(150) NOT NULL DEFAULT 'HIND TYRES AND ACCESSORIES',
    address TEXT NOT NULL DEFAULT 'Cantonment Market Shop No:03 Near Football Ground Bus Stand Ramgarh Cantt ,Jharkhand 829122',
    phone VARCHAR(50) NOT NULL DEFAULT '+91 98765 43210',
    email VARCHAR(255) NOT NULL DEFAULT 'contact@hindtyres.com',
    gstin VARCHAR(40) NOT NULL DEFAULT '09AAACH7409R1ZZ',
    logo_url TEXT,
    invoice_footer TEXT DEFAULT 'Thank you for choosing Hind Tyres & Accessories! Safe journey!',
    terms_and_conditions TEXT DEFAULT '1. Goods once sold will not be taken back without valid bill.\n2. Manufacturer warranty applies as per brand policy.',
    default_gst_percent NUMERIC(5,2) NOT NULL DEFAULT 28.00,
    max_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 15.00,
    admin_receipt_email VARCHAR(255) NOT NULL DEFAULT 'admin@hindtyres.com',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(120),
    user_role VARCHAR(30),
    action VARCHAR(60) NOT NULL,
    entity VARCHAR(60) NOT NULL,
    entity_id VARCHAR(100),
    before_snapshot JSONB,
    after_snapshot JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. EMAIL OTP (Password Reset)
CREATE TABLE IF NOT EXISTS email_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    verified BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_tyres_company ON tyres(company_id);
CREATE INDEX IF NOT EXISTS idx_tyres_sku ON tyres(sku);
CREATE INDEX IF NOT EXISTS idx_tyres_vehicle ON tyres(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_accessories_category ON accessories(category);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_no ON sales(invoice_no);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(item_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Insert Default Shop Settings (if not already present)
INSERT INTO shop_settings (shop_name)
SELECT 'HIND TYRES AND ACCESSORIES'
WHERE NOT EXISTS (SELECT 1 FROM shop_settings);
