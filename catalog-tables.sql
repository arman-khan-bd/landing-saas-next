-- 1. Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(store_id, slug)
);

-- 2. Create sub_categories table
CREATE TABLE IF NOT EXISTS sub_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(store_id, slug)
);

-- 3. Create brands table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    logo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create taxes table
CREATE TABLE IF NOT EXISTS taxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    rate NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create attributes table
CREATE TABLE IF NOT EXISTS attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    values TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;

-- 7. Configure RLS Policies

-- Categories
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
CREATE POLICY "Allow public read access to categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow owners to insert categories" ON categories;
CREATE POLICY "Allow owners to insert categories" ON categories FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = categories.store_id AND (stores.owner_id::text = auth.uid()::text OR stores.owner_id = auth.uid())));

DROP POLICY IF EXISTS "Allow owners to update categories" ON categories;
CREATE POLICY "Allow owners to update categories" ON categories FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = categories.store_id AND (stores.owner_id::text = auth.uid()::text OR stores.owner_id = auth.uid())));

DROP POLICY IF EXISTS "Allow owners to delete categories" ON categories;
CREATE POLICY "Allow owners to delete categories" ON categories FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = categories.store_id AND (stores.owner_id::text = auth.uid()::text OR stores.owner_id = auth.uid())));

-- Sub Categories
DROP POLICY IF EXISTS "Allow public read access to sub_categories" ON sub_categories;
CREATE POLICY "Allow public read access to sub_categories" ON sub_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow owners to insert sub_categories" ON sub_categories;
CREATE POLICY "Allow owners to insert sub_categories" ON sub_categories FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = sub_categories.store_id AND (stores.owner_id::text = auth.uid()::text OR stores.owner_id = auth.uid())));

DROP POLICY IF EXISTS "Allow owners to update sub_categories" ON sub_categories;
CREATE POLICY "Allow owners to update sub_categories" ON sub_categories FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = sub_categories.store_id AND (stores.owner_id::text = auth.uid()::text OR stores.owner_id = auth.uid())));

DROP POLICY IF EXISTS "Allow owners to delete sub_categories" ON sub_categories;
CREATE POLICY "Allow owners to delete sub_categories" ON sub_categories FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = sub_categories.store_id AND (stores.owner_id::text = auth.uid()::text OR stores.owner_id = auth.uid())));

-- Brands
DROP POLICY IF EXISTS "Allow public read access to brands" ON brands;
CREATE POLICY "Allow public read access to brands" ON brands FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow owners to insert brands" ON brands;
CREATE POLICY "Allow owners to insert brands" ON brands FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = brands.store_id AND (stores.owner_id::text = auth.uid()::text OR stores.owner_id = auth.uid())));

DROP POLICY IF EXISTS "Allow owners to update brands" ON brands;
CREATE POLICY "Allow owners to update brands" ON brands FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = brands.store_id AND (stores.owner_id::text = auth.uid()::text OR stores.owner_id = auth.uid())));

DROP POLICY IF EXISTS "Allow owners to delete brands" ON brands;
CREATE POLICY "Allow owners to delete brands" ON brands FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = brands.store_id AND (stores.owner_id::text = auth.uid()::text OR stores.owner_id = auth.uid())));

-- Taxes
DROP POLICY IF EXISTS "Allow public read access to taxes" ON taxes;
CREATE POLICY "Allow public read access to taxes" ON taxes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow owners to insert taxes" ON taxes;
CREATE POLICY "Allow owners to insert taxes" ON taxes FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = taxes.store_id AND (stores.owner_id::text = auth.uid()::text OR stores.owner_id = auth.uid())));

DROP POLICY IF EXISTS "Allow owners to update taxes" ON taxes;
CREATE POLICY "Allow owners to update taxes" ON taxes FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = taxes.store_id AND (stores.owner_id::text = auth.uid()::text OR stores.owner_id = auth.uid())));

DROP POLICY IF EXISTS "Allow owners to delete taxes" ON taxes;
CREATE POLICY "Allow owners to delete taxes" ON taxes FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = taxes.store_id AND (stores.owner_id::text = auth.uid()::text OR stores.owner_id = auth.uid())));

-- Attributes
DROP POLICY IF EXISTS "Allow public read access to attributes" ON attributes;
CREATE POLICY "Allow public read access to attributes" ON attributes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow owners to insert attributes" ON attributes;
CREATE POLICY "Allow owners to insert attributes" ON attributes FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = attributes.store_id AND (stores.owner_id::text = auth.uid()::text OR stores.owner_id = auth.uid())));

DROP POLICY IF EXISTS "Allow owners to update attributes" ON attributes;
CREATE POLICY "Allow owners to update attributes" ON attributes FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = attributes.store_id AND (stores.owner_id::text = auth.uid()::text OR stores.owner_id = auth.uid())));

DROP POLICY IF EXISTS "Allow owners to delete attributes" ON attributes;
CREATE POLICY "Allow owners to delete attributes" ON attributes FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = attributes.store_id AND (stores.owner_id::text = auth.uid()::text OR stores.owner_id = auth.uid())));
