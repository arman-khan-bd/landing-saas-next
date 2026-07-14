-- ============================================================
-- SAAS ADMIN DASHBOARD — Missing Columns & Fixes
-- Run in Supabase SQL Editor after the main schema
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. STORES — add suspension & admin columns
-- ─────────────────────────────────────────────────────────────
ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

-- ─────────────────────────────────────────────────────────────
-- 2. SAAS_TRANSACTIONS — fix missing columns
-- ─────────────────────────────────────────────────────────────
ALTER TABLE saas_transactions ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
ALTER TABLE saas_transactions ADD COLUMN IF NOT EXISTS rejection_note TEXT;

-- ─────────────────────────────────────────────────────────────
-- 3. SUBSCRIPTIONS — add current_period_start
-- ─────────────────────────────────────────────────────────────
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE;

-- ─────────────────────────────────────────────────────────────
-- 4. SYSTEM_NOTIFICATIONS — add type column
-- ─────────────────────────────────────────────────────────────
ALTER TABLE system_notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';

-- ─────────────────────────────────────────────────────────────
-- 5. USERS — add display_name, avatar, full_name, phone
-- ─────────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- ─────────────────────────────────────────────────────────────
-- 5.1 RLS policies for users table (to allow signup profile storage)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON users;
CREATE POLICY "Allow users to insert their own profile" ON users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to update their own profile" ON users;
CREATE POLICY "Allow users to update their own profile" ON users
  FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow public/anon users to insert profile during signup" ON users;
CREATE POLICY "Allow public/anon users to insert profile during signup" ON users
  FOR INSERT TO anon, authenticated WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- 5.2 Helper function to bypass RLS recursion (SECURITY DEFINER)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
-- 6. Fix RLS: admins can read ALL users (needed for saas-admin overview)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can read all users" ON users;
CREATE POLICY "Admins can read all users" ON users
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR public.is_admin()
  );

-- ─────────────────────────────────────────────────────────────
-- 7. Fix RLS: admins can suspend stores
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can update any store" ON stores;
CREATE POLICY "Admins can update any store" ON stores
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = owner_id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete any store" ON stores;
CREATE POLICY "Admins can delete any store" ON stores
  FOR DELETE TO authenticated
  USING (
    auth.uid() = owner_id
    OR public.is_admin()
  );

-- ─────────────────────────────────────────────────────────────
-- 8. Fix RLS: admins can read all transactions
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage all transactions" ON saas_transactions;
CREATE POLICY "Admins can manage all transactions" ON saas_transactions
  FOR ALL TO authenticated
  USING (
    auth.uid() = owner_id
    OR public.is_admin()
  );

-- ─────────────────────────────────────────────────────────────
-- 9. Fix RLS: admins can read all subscriptions
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON subscriptions;
CREATE POLICY "Admins can manage all subscriptions" ON subscriptions
  FOR ALL TO authenticated
  USING (
    auth.uid() = owner_id
    OR public.is_admin()
  );

-- ─────────────────────────────────────────────────────────────
-- 10. Fix RLS: admins can manage custom domain requests
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage all domain requests" ON custom_domain_requests;
CREATE POLICY "Admins can manage all domain requests" ON custom_domain_requests
  FOR ALL TO authenticated
  USING (
    auth.uid() = owner_id
    OR public.is_admin()
  );

-- ─────────────────────────────────────────────────────────────
-- 11. Fix RLS: anyone can insert orders (for storefront)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
CREATE POLICY "Anyone can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 12. Enable Realtime for admin tables (run separately if needed)
-- ─────────────────────────────────────────────────────────────
-- In Supabase Dashboard → Database → Replication, enable:
-- ALTER PUBLICATION supabase_realtime ADD TABLE saas_transactions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE custom_domain_requests;
-- ALTER PUBLICATION supabase_realtime ADD TABLE stores;
-- ALTER PUBLICATION supabase_realtime ADD TABLE users;
-- ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;

-- ─────────────────────────────────────────────────────────────
-- 13. Seed yourself as admin (IMPORTANT: replace with your user ID)
-- ─────────────────────────────────────────────────────────────
-- First find your user ID from Supabase Auth → Users
-- Then run:
-- UPDATE users SET role = 'admin' WHERE email = 'your@email.com';

-- ─────────────────────────────────────────────────────────────
-- 14. Add foreign keys for saas_transactions joins to work
-- (safe to run even if already exists)
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'saas_transactions_store_id_fkey'
  ) THEN
    ALTER TABLE saas_transactions
      ADD CONSTRAINT saas_transactions_store_id_fkey
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'saas_transactions_plan_id_fkey'
  ) THEN
    ALTER TABLE saas_transactions
      ADD CONSTRAINT saas_transactions_plan_id_fkey
      FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 15. Add limitation columns to subscription_plans
-- ─────────────────────────────────────────────────────────────
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS products_limit INTEGER DEFAULT -1;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS pages_limit INTEGER DEFAULT -1;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS orders_limit INTEGER DEFAULT -1;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS custom_domain_enabled BOOLEAN DEFAULT false;

-- ─────────────────────────────────────────────────────────────
-- 16. Grant admin full access to all store/tenant tables (Bypass RLS for Admin role)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Store owners can manage pages" ON pages;
CREATE POLICY "Store owners can manage pages" ON pages FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = pages.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Store owners can manage sections" ON sections;
CREATE POLICY "Store owners can manage sections" ON sections FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = sections.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Allow owners to insert products" ON products;
CREATE POLICY "Allow owners to insert products" ON products FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Allow owners to update products" ON products;
CREATE POLICY "Allow owners to update products" ON products FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Allow owners to delete products" ON products;
CREATE POLICY "Allow owners to delete products" ON products FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Store owners can read their orders" ON orders;
CREATE POLICY "Store owners can read their orders" ON orders FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Store owners can update their orders" ON orders;
CREATE POLICY "Store owners can update their orders" ON orders FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Store owners can delete their orders" ON orders;
CREATE POLICY "Store owners can delete their orders" ON orders FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Store owners can manage uncompleted orders" ON uncompleted_orders;
CREATE POLICY "Store owners can manage uncompleted orders" ON uncompleted_orders FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = uncompleted_orders.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Store owners can manage customers" ON customers;
CREATE POLICY "Store owners can manage customers" ON customers FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = customers.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Store owners can manage fraud blocks" ON fraud_blocks;
CREATE POLICY "Store owners can manage fraud blocks" ON fraud_blocks FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = fraud_blocks.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Allow owners to insert categories" ON categories;
CREATE POLICY "Allow owners to insert categories" ON categories FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = categories.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Allow owners to update categories" ON categories;
CREATE POLICY "Allow owners to update categories" ON categories FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = categories.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Allow owners to delete categories" ON categories;
CREATE POLICY "Allow owners to delete categories" ON categories FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = categories.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Allow owners to insert sub_categories" ON sub_categories;
CREATE POLICY "Allow owners to insert sub_categories" ON sub_categories FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = sub_categories.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Allow owners to update sub_categories" ON sub_categories;
CREATE POLICY "Allow owners to update sub_categories" ON sub_categories FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = sub_categories.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Allow owners to delete sub_categories" ON sub_categories;
CREATE POLICY "Allow owners to delete sub_categories" ON sub_categories FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = sub_categories.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Allow owners to insert brands" ON brands;
CREATE POLICY "Allow owners to insert brands" ON brands FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = brands.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Allow owners to update brands" ON brands;
CREATE POLICY "Allow owners to update brands" ON brands FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = brands.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Allow owners to delete brands" ON brands;
CREATE POLICY "Allow owners to delete brands" ON brands FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = brands.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Allow owners to insert taxes" ON taxes;
CREATE POLICY "Allow owners to insert taxes" ON taxes FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = taxes.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Allow owners to update taxes" ON taxes;
CREATE POLICY "Allow owners to update taxes" ON taxes FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = taxes.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Allow owners to delete taxes" ON taxes;
CREATE POLICY "Allow owners to delete taxes" ON taxes FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = taxes.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Allow owners to insert attributes" ON attributes;
CREATE POLICY "Allow owners to insert attributes" ON attributes FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = attributes.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Allow owners to update attributes" ON attributes;
CREATE POLICY "Allow owners to update attributes" ON attributes FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = attributes.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Allow owners to delete attributes" ON attributes;
CREATE POLICY "Allow owners to delete attributes" ON attributes FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = attributes.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Store owners can manage tags" ON tags;
CREATE POLICY "Store owners can manage tags" ON tags FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = tags.store_id AND stores.owner_id = auth.uid()) OR public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 17. Add details column to saas_payment_methods
-- ─────────────────────────────────────────────────────────────
ALTER TABLE saas_payment_methods ADD COLUMN IF NOT EXISTS details TEXT;

