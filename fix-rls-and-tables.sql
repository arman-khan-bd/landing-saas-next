-- 1. Create subscription_plans table if it doesn't exist
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL,
    store_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create sections table if it doesn't exist
CREATE TABLE IF NOT EXISTS sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    blocks JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT true,
    page_style JSONB DEFAULT '{"backgroundColor": "#FFFFFF", "paddingTop": 0, "paddingBottom": 40}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(store_id, slug)
);

-- 4. Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    image_urls TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable RLS on stores, subscriptions, subscription_plans, sections, and products tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 6. Configure policies for stores table
DROP POLICY IF EXISTS "Allow public read access to stores" ON stores;
CREATE POLICY "Allow public read access to stores" 
ON stores FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert their own stores" ON stores;
CREATE POLICY "Allow authenticated users to insert their own stores" 
ON stores FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = owner_id::text OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Allow owners to update their own stores" ON stores;
CREATE POLICY "Allow owners to update their own stores" 
ON stores FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = owner_id::text OR auth.uid() = owner_id);

-- 7. Configure policies for subscriptions table
DROP POLICY IF EXISTS "Allow users to read their own subscriptions" ON subscriptions;
CREATE POLICY "Allow users to read their own subscriptions" 
ON subscriptions FOR SELECT 
TO authenticated 
USING (auth.uid()::text = owner_id::text OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Allow users to insert their own subscriptions" ON subscriptions;
CREATE POLICY "Allow users to insert their own subscriptions" 
ON subscriptions FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = owner_id::text OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Allow users to update their own subscriptions" ON subscriptions;
CREATE POLICY "Allow users to update their own subscriptions" 
ON subscriptions FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = owner_id::text OR auth.uid() = owner_id);

-- 8. Configure policies for subscription_plans table
DROP POLICY IF EXISTS "Allow public read access to subscription plans" ON subscription_plans;
CREATE POLICY "Allow public read access to subscription plans" 
ON subscription_plans FOR SELECT 
USING (true);

-- 9. Configure policies for sections table
DROP POLICY IF EXISTS "Allow public read access to sections" ON sections;
CREATE POLICY "Allow public read access to sections" 
ON sections FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow owners to insert sections" ON sections;
CREATE POLICY "Allow owners to insert sections" 
ON sections FOR INSERT 
TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = sections.store_id AND (stores.owner_id::text = auth.uid()::text OR stores.owner_id = auth.uid())));

DROP POLICY IF EXISTS "Allow owners to update sections" ON sections;
CREATE POLICY "Allow owners to update sections" 
ON sections FOR UPDATE 
TO authenticated 
USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = sections.store_id AND (stores.owner_id::text = auth.uid()::text OR stores.owner_id = auth.uid())));

DROP POLICY IF EXISTS "Allow owners to delete sections" ON sections;
CREATE POLICY "Allow owners to delete sections" 
ON sections FOR DELETE 
TO authenticated 
USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = sections.store_id AND (stores.owner_id::text = auth.uid()::text OR stores.owner_id = auth.uid())));

-- 10. Configure policies for products table
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
CREATE POLICY "Allow public read access to products" 
ON products FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow owners to insert products" ON products;
CREATE POLICY "Allow owners to insert products" 
ON products FOR INSERT 
TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND (stores.owner_id::text = auth.uid()::text OR stores.owner_id = auth.uid())));

DROP POLICY IF EXISTS "Allow owners to update products" ON products;
CREATE POLICY "Allow owners to update products" 
ON products FOR UPDATE 
TO authenticated 
USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND (stores.owner_id::text = auth.uid()::text OR stores.owner_id = auth.uid())));

DROP POLICY IF EXISTS "Allow owners to delete products" ON products;
CREATE POLICY "Allow owners to delete products" 
ON products FOR DELETE 
TO authenticated 
USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND (stores.owner_id::text = auth.uid()::text OR stores.owner_id = auth.uid())));

-- 11. Add home branding and promotion columns to stores table if they don't exist
ALTER TABLE stores ADD COLUMN IF NOT EXISTS home_page_title TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "homePageTitle" TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS home_banner TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "homeBanner" TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS offer_banner BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "offerBanner" BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS offer_text TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "offerText" TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS offer_link TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "offerLink" TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS product_display_type TEXT DEFAULT 'new_to_old';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "productDisplayType" TEXT DEFAULT 'new_to_old';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS selected_products JSONB DEFAULT '[]'::jsonb;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "selectedProducts" JSONB DEFAULT '[]'::jsonb;

