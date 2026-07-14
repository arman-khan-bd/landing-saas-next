-- ============================================================
-- IHUT / DOKANBD SHOP — Complete Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. USERS  (mirrors auth.users with role)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'user',  -- 'user' | 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Auto-insert a row in public.users when someone signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 2. STORES  (multi-tenant core)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subdomain TEXT NOT NULL UNIQUE,
    custom_domain TEXT UNIQUE,
    logo TEXT,
    favicon TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    manage_password TEXT,

    -- Home / Banner
    home_page_title TEXT,
    home_banner TEXT,
    offer_banner BOOLEAN DEFAULT false,
    offer_text TEXT,
    offer_link TEXT,
    product_display_type TEXT DEFAULT 'new_to_old',
    selected_products JSONB DEFAULT '[]'::jsonb,

    -- Settings (stored as JSONB for flexibility)
    payment_settings JSONB DEFAULT '{"cod": true, "manualEnabled": false, "manualMethods": []}'::jsonb,
    shipping_settings JSONB DEFAULT '{"enabled": false, "methods": [{"id": "1", "name": "Standard Shipping", "cost": 0}]}'::jsonb,
    seo JSONB DEFAULT '{"metaImage": "", "keywords": "", "description": ""}'::jsonb,
    shop_config JSONB DEFAULT '{"showHeader": true, "stickyHeader": true}'::jsonb,
    social_links JSONB DEFAULT '{"facebook": "", "twitter": "", "instagram": "", "youtube": ""}'::jsonb,

    -- Analytics
    google_analytics_id TEXT,
    facebook_pixel_id TEXT,
    google_map_embed TEXT,
    working_days TEXT,
    selected_theme TEXT DEFAULT 'modern',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 3. CATEGORIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(store_id, slug)
);

-- ─────────────────────────────────────────────────────────────
-- 4. SUB-CATEGORIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sub_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(store_id, slug)
);

-- ─────────────────────────────────────────────────────────────
-- 5. BRANDS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    logo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 6. TAXES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS taxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    rate NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 7. ATTRIBUTES  (size, color, etc.)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    values TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 8. TAGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 9. PRODUCTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    slug TEXT,
    description TEXT,
    short_description TEXT,
    featured_image TEXT,
    gallery TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    meta_keywords TEXT,
    meta_description TEXT,
    "currentPrice" NUMERIC NOT NULL DEFAULT 0,  -- kept camelCase to match app reads
    "prevPrice" NUMERIC,
    "featuredImage" TEXT,                        -- kept for backward-compat
    "shortDescription" TEXT,
    "metaKeywords" TEXT,
    "metaDescription" TEXT,
    "totalInStock" INTEGER NOT NULL DEFAULT 0,
    "youtubeLink" TEXT,
    category UUID REFERENCES categories(id) ON DELETE SET NULL,
    sub_category UUID REFERENCES sub_categories(id) ON DELETE SET NULL,
    "subCategory" UUID,
    brand UUID REFERENCES brands(id) ON DELETE SET NULL,
    tax TEXT DEFAULT '0',
    sku TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 10. PAGES  (custom storefront pages)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    blocks JSONB DEFAULT '[]'::jsonb,
    page_style JSONB DEFAULT '{"backgroundColor": "#FFFFFF", "paddingTop": 0, "paddingBottom": 40}'::jsonb,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(store_id, slug)
);

-- ─────────────────────────────────────────────────────────────
-- 11. SECTIONS  (landing page builder)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    blocks JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT true,
    page_style JSONB DEFAULT '{"backgroundColor": "#FFFFFF", "paddingTop": 0, "paddingBottom": 40}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(store_id, slug)
);

-- ─────────────────────────────────────────────────────────────
-- 12. ORDERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    customer JSONB NOT NULL DEFAULT '{}'::jsonb,
    shipping JSONB DEFAULT '{"name": "Direct Order", "cost": 0}'::jsonb,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    shipping_cost NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',  -- pending | processing | shipped | delivered | cancelled
    payment_method TEXT NOT NULL DEFAULT 'cod',
    payment_status TEXT NOT NULL DEFAULT 'unpaid',  -- unpaid | pending_verification | paid
    transaction_id TEXT,
    selected_manual_method_id TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 13. UNCOMPLETED ORDERS  (abandoned / draft orders)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS uncompleted_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    customer JSONB DEFAULT '{}'::jsonb,
    total NUMERIC DEFAULT 0,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 14. CUSTOMERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    total_orders INTEGER DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 15. FRAUD BLOCKS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fraud_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'phone',  -- 'phone' | 'ip'
    value TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(store_id, value)
);

-- ─────────────────────────────────────────────────────────────
-- 16. SYSTEM NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',  -- 'info' | 'warning' | 'success' | 'error'
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 17. SUBSCRIPTION PLANS  (SaaS tiers)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    billing_interval TEXT NOT NULL DEFAULT 'month',
    features TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sms_limit INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 18. SUBSCRIPTIONS  (user → plan mapping)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'expired' | 'cancelled'
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 19. SAAS TRANSACTIONS  (payment proofs from users)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saas_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'BDT',
    payment_method TEXT,
    transaction_id TEXT,
    screenshot_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 20. SAAS PAYMENT METHODS  (admin-configured)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saas_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    number TEXT,
    instructions TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 21. CUSTOM DOMAIN REQUESTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_domain_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    domain TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 22. PLATFORM SETTINGS  (global key-value settings for admin)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Seed default SEO setting
INSERT INTO platform_settings (key, value) VALUES
('seo', '{"metaTitle": "iHut | Multi-tenant E-commerce SaaS", "metaDescription": "The ultimate platform for launching your online store in minutes.", "keywords": "ecommerce, saas, store"}')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 23. PLATFORM FEATURES  (landing page feature cards, managed by admin)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'Zap',
    accent TEXT DEFAULT 'primary',
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE uncompleted_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_domain_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_features ENABLE ROW LEVEL SECURITY;

-- ─── USERS ───
DROP POLICY IF EXISTS "Users can read own row" ON users;
CREATE POLICY "Users can read own row" ON users FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all users" ON users;
CREATE POLICY "Admins can read all users" ON users FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));

DROP POLICY IF EXISTS "Admins can update user roles" ON users;
CREATE POLICY "Admins can update user roles" ON users FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- ─── STORES ───
DROP POLICY IF EXISTS "Public can read all stores" ON stores;
CREATE POLICY "Public can read all stores" ON stores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create stores" ON stores;
CREATE POLICY "Authenticated users can create stores" ON stores FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update their store" ON stores;
CREATE POLICY "Owners can update their store" ON stores FOR UPDATE TO authenticated
    USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete their store" ON stores;
CREATE POLICY "Owners can delete their store" ON stores FOR DELETE TO authenticated
    USING (auth.uid() = owner_id);

-- ─── PRODUCTS ───
DROP POLICY IF EXISTS "Public can read products" ON products;
CREATE POLICY "Public can read products" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store owners can insert products" ON products;
CREATE POLICY "Store owners can insert products" ON products FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Store owners can update products" ON products;
CREATE POLICY "Store owners can update products" ON products FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Store owners can delete products" ON products;
CREATE POLICY "Store owners can delete products" ON products FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()));

-- ─── PAGES ───
DROP POLICY IF EXISTS "Public can read pages" ON pages;
CREATE POLICY "Public can read pages" ON pages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store owners can manage pages" ON pages;
CREATE POLICY "Store owners can manage pages" ON pages FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = pages.store_id AND stores.owner_id = auth.uid()));

-- ─── SECTIONS ───
DROP POLICY IF EXISTS "Public can read sections" ON sections;
CREATE POLICY "Public can read sections" ON sections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store owners can manage sections" ON sections;
CREATE POLICY "Store owners can manage sections" ON sections FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = sections.store_id AND stores.owner_id = auth.uid()));

-- ─── CATEGORIES ───
DROP POLICY IF EXISTS "Public can read categories" ON categories;
CREATE POLICY "Public can read categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store owners can manage categories" ON categories;
CREATE POLICY "Store owners can manage categories" ON categories FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = categories.store_id AND stores.owner_id = auth.uid()));

-- ─── SUB CATEGORIES ───
DROP POLICY IF EXISTS "Public can read sub_categories" ON sub_categories;
CREATE POLICY "Public can read sub_categories" ON sub_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store owners can manage sub_categories" ON sub_categories;
CREATE POLICY "Store owners can manage sub_categories" ON sub_categories FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = sub_categories.store_id AND stores.owner_id = auth.uid()));

-- ─── BRANDS ───
DROP POLICY IF EXISTS "Public can read brands" ON brands;
CREATE POLICY "Public can read brands" ON brands FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store owners can manage brands" ON brands;
CREATE POLICY "Store owners can manage brands" ON brands FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = brands.store_id AND stores.owner_id = auth.uid()));

-- ─── TAXES ───
DROP POLICY IF EXISTS "Public can read taxes" ON taxes;
CREATE POLICY "Public can read taxes" ON taxes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store owners can manage taxes" ON taxes;
CREATE POLICY "Store owners can manage taxes" ON taxes FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = taxes.store_id AND stores.owner_id = auth.uid()));

-- ─── ATTRIBUTES ───
DROP POLICY IF EXISTS "Public can read attributes" ON attributes;
CREATE POLICY "Public can read attributes" ON attributes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store owners can manage attributes" ON attributes;
CREATE POLICY "Store owners can manage attributes" ON attributes FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = attributes.store_id AND stores.owner_id = auth.uid()));

-- ─── TAGS ───
DROP POLICY IF EXISTS "Public can read tags" ON tags;
CREATE POLICY "Public can read tags" ON tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store owners can manage tags" ON tags;
CREATE POLICY "Store owners can manage tags" ON tags FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = tags.store_id AND stores.owner_id = auth.uid()));

-- ─── ORDERS ───
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
CREATE POLICY "Anyone can insert orders" ON orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Store owners can read their orders" ON orders;
CREATE POLICY "Store owners can read their orders" ON orders FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Store owners can update their orders" ON orders;
CREATE POLICY "Store owners can update their orders" ON orders FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Store owners can delete their orders" ON orders;
CREATE POLICY "Store owners can delete their orders" ON orders FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()));

-- ─── UNCOMPLETED ORDERS ───
DROP POLICY IF EXISTS "Anyone can insert uncompleted orders" ON uncompleted_orders;
CREATE POLICY "Anyone can insert uncompleted orders" ON uncompleted_orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Store owners can manage uncompleted orders" ON uncompleted_orders;
CREATE POLICY "Store owners can manage uncompleted orders" ON uncompleted_orders FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = uncompleted_orders.store_id AND stores.owner_id = auth.uid()));

-- ─── CUSTOMERS ───
DROP POLICY IF EXISTS "Store owners can manage customers" ON customers;
CREATE POLICY "Store owners can manage customers" ON customers FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = customers.store_id AND stores.owner_id = auth.uid()));

-- ─── FRAUD BLOCKS ───
DROP POLICY IF EXISTS "Store owners can manage fraud blocks" ON fraud_blocks;
CREATE POLICY "Store owners can manage fraud blocks" ON fraud_blocks FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = fraud_blocks.store_id AND stores.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can read fraud blocks for their store" ON fraud_blocks;
CREATE POLICY "Anyone can read fraud blocks for their store" ON fraud_blocks FOR SELECT USING (true);

-- ─── SYSTEM NOTIFICATIONS ───
DROP POLICY IF EXISTS "Users can read own notifications" ON system_notifications;
CREATE POLICY "Users can read own notifications" ON system_notifications FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON system_notifications;
CREATE POLICY "Authenticated users can insert notifications" ON system_notifications FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON system_notifications;
CREATE POLICY "Users can update own notifications" ON system_notifications FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- ─── SUBSCRIPTION PLANS ───
DROP POLICY IF EXISTS "Public can read subscription plans" ON subscription_plans;
CREATE POLICY "Public can read subscription plans" ON subscription_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage subscription plans" ON subscription_plans;
CREATE POLICY "Admins can manage subscription plans" ON subscription_plans FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- ─── SUBSCRIPTIONS ───
DROP POLICY IF EXISTS "Users can read own subscriptions" ON subscriptions;
CREATE POLICY "Users can read own subscriptions" ON subscriptions FOR SELECT TO authenticated
    USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON subscriptions;
CREATE POLICY "Admins can manage all subscriptions" ON subscriptions FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- ─── SAAS TRANSACTIONS ───
DROP POLICY IF EXISTS "Users can read own transactions" ON saas_transactions;
CREATE POLICY "Users can read own transactions" ON saas_transactions FOR SELECT TO authenticated
    USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON saas_transactions;
CREATE POLICY "Users can insert own transactions" ON saas_transactions FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Admins can manage all transactions" ON saas_transactions;
CREATE POLICY "Admins can manage all transactions" ON saas_transactions FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- ─── SAAS PAYMENT METHODS ───
DROP POLICY IF EXISTS "Public can read payment methods" ON saas_payment_methods;
CREATE POLICY "Public can read payment methods" ON saas_payment_methods FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage payment methods" ON saas_payment_methods;
CREATE POLICY "Admins can manage payment methods" ON saas_payment_methods FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- ─── CUSTOM DOMAIN REQUESTS ───
DROP POLICY IF EXISTS "Users can read own domain requests" ON custom_domain_requests;
CREATE POLICY "Users can read own domain requests" ON custom_domain_requests FOR SELECT TO authenticated
    USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert domain requests" ON custom_domain_requests;
CREATE POLICY "Users can insert domain requests" ON custom_domain_requests FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Admins can manage all domain requests" ON custom_domain_requests;
CREATE POLICY "Admins can manage all domain requests" ON custom_domain_requests FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- ─── PLATFORM SETTINGS ───
DROP POLICY IF EXISTS "Public can read platform settings" ON platform_settings;
CREATE POLICY "Public can read platform settings" ON platform_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage platform settings" ON platform_settings;
CREATE POLICY "Admins can manage platform settings" ON platform_settings FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- ─── PLATFORM FEATURES ───
DROP POLICY IF EXISTS "Public can read platform features" ON platform_features;
CREATE POLICY "Public can read platform features" ON platform_features FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage platform features" ON platform_features;
CREATE POLICY "Admins can manage platform features" ON platform_features FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- ============================================================
-- INDEXES  (for performance)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_stores_subdomain ON stores(subdomain);
CREATE INDEX IF NOT EXISTS idx_stores_custom_domain ON stores(custom_domain);
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_owner_id ON orders(owner_id);
CREATE INDEX IF NOT EXISTS idx_orders_is_read ON orders(is_read);
CREATE INDEX IF NOT EXISTS idx_sections_store_id ON sections(store_id);
CREATE INDEX IF NOT EXISTS idx_sections_slug ON sections(slug);
CREATE INDEX IF NOT EXISTS idx_pages_store_id ON pages(store_id);
CREATE INDEX IF NOT EXISTS idx_saas_transactions_owner_id ON saas_transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_system_notifications_user_id ON system_notifications(user_id);

-- ============================================================
-- REALTIME  (enable for live order/notification updates)
-- ============================================================
-- Run these in Supabase Dashboard -> Database -> Replication
-- Or uncomment and execute:

-- ALTER PUBLICATION supabase_realtime ADD TABLE orders;
-- ALTER PUBLICATION supabase_realtime ADD TABLE uncompleted_orders;
-- ALTER PUBLICATION supabase_realtime ADD TABLE system_notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE saas_transactions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE custom_domain_requests;
