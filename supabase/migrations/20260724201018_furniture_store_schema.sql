-- ============================================================
-- Mueblería Polaris — Full Database Schema
-- Migration: 20260724201018_furniture_store_schema.sql
-- ============================================================

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

DROP TYPE IF EXISTS public.order_status_enum CASCADE;
CREATE TYPE public.order_status_enum AS ENUM (
  'confirmado',
  'preparando',
  'empaquetando',
  'preparando_envio',
  'camino',
  'entregado',
  'cancelado'
);

DROP TYPE IF EXISTS public.notification_type CASCADE;
CREATE TYPE public.notification_type AS ENUM (
  'promocion',
  'nuevo_producto',
  'estado_pedido',
  'general'
);

-- ============================================================
-- 2. CORE TABLES (no foreign keys to other public tables)
-- ============================================================

-- profiles: extends auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,
  phone         TEXT,
  role          public.user_role NOT NULL DEFAULT 'user'::public.user_role,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- categories
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- order_status (lookup table for order status labels/metadata)
CREATE TABLE IF NOT EXISTS public.order_status (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        public.order_status_enum NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- settings (per-user app settings)
CREATE TABLE IF NOT EXISTS public.settings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme                   TEXT NOT NULL DEFAULT 'auto',
  notif_promociones       BOOLEAN NOT NULL DEFAULT TRUE,
  notif_nuevos_productos  BOOLEAN NOT NULL DEFAULT TRUE,
  notif_estado_pedidos    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. DEPENDENT TABLES
-- ============================================================

-- products
CREATE TABLE IF NOT EXISTS public.products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  description  TEXT,
  price        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  image_url    TEXT,
  images       JSONB,
  stock        INT NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- addresses
CREATE TABLE IF NOT EXISTS public.addresses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label        TEXT NOT NULL DEFAULT 'Casa',
  street       TEXT NOT NULL,
  city         TEXT NOT NULL,
  state        TEXT NOT NULL,
  zip_code     TEXT,
  country      TEXT NOT NULL DEFAULT 'México',
  is_default   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- favorites
CREATE TABLE IF NOT EXISTS public.favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- cart
CREATE TABLE IF NOT EXISTS public.cart (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity    INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- orders
CREATE TABLE IF NOT EXISTS public.orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  address_id      UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  status          public.order_status_enum NOT NULL DEFAULT 'confirmado'::public.order_status_enum,
  total           NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tracking_code   TEXT,
  payment_method  TEXT,
  notes           TEXT,
  estimated_delivery TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- order_items
CREATE TABLE IF NOT EXISTS public.order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity    INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  subtotal    NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        public.notification_type NOT NULL DEFAULT 'general'::public.notification_type,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  data        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. UNIQUE CONSTRAINTS (partial indexes for composite uniqueness)
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_product
  ON public.favorites (user_id, product_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_user_product
  ON public.cart (user_id, product_id);

-- ============================================================
-- 5. PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON public.favorites(product_id);

CREATE INDEX IF NOT EXISTS idx_cart_user_id ON public.cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_product_id ON public.cart(product_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);

-- ============================================================
-- 6. FUNCTIONS (MUST be before RLS policies that reference them)
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Check if current user is admin (reads from auth metadata — safe for all tables)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND (
        raw_user_meta_data->>'role' = 'admin'
        OR raw_app_meta_data->>'role' = 'admin'
      )
  );
$$;

-- Auto-create profile when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')::public.user_role
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create default settings for the new user
  INSERT INTO public.settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. RLS POLICIES
-- ============================================================

-- ---- profiles ----
DROP POLICY IF EXISTS "profiles_own_access" ON public.profiles;
CREATE POLICY "profiles_own_access"
  ON public.profiles FOR ALL TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_admin_access" ON public.profiles;
CREATE POLICY "profiles_admin_access"
  ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---- categories (public read, admin write) ----
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read"
  ON public.categories FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "categories_admin_write" ON public.categories;
CREATE POLICY "categories_admin_write"
  ON public.categories FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---- products (public read, admin write) ----
DROP POLICY IF EXISTS "products_public_read" ON public.products;
CREATE POLICY "products_public_read"
  ON public.products FOR SELECT TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "products_admin_write" ON public.products;
CREATE POLICY "products_admin_write"
  ON public.products FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---- favorites ----
DROP POLICY IF EXISTS "favorites_own_access" ON public.favorites;
CREATE POLICY "favorites_own_access"
  ON public.favorites FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- cart ----
DROP POLICY IF EXISTS "cart_own_access" ON public.cart;
CREATE POLICY "cart_own_access"
  ON public.cart FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- orders ----
DROP POLICY IF EXISTS "orders_own_access" ON public.orders;
CREATE POLICY "orders_own_access"
  ON public.orders FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "orders_admin_access" ON public.orders;
CREATE POLICY "orders_admin_access"
  ON public.orders FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---- order_items ----
DROP POLICY IF EXISTS "order_items_own_access" ON public.order_items;
CREATE POLICY "order_items_own_access"
  ON public.order_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "order_items_admin_access" ON public.order_items;
CREATE POLICY "order_items_admin_access"
  ON public.order_items FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---- order_status (public read, admin write) ----
DROP POLICY IF EXISTS "order_status_public_read" ON public.order_status;
CREATE POLICY "order_status_public_read"
  ON public.order_status FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "order_status_admin_write" ON public.order_status;
CREATE POLICY "order_status_admin_write"
  ON public.order_status FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---- addresses ----
DROP POLICY IF EXISTS "addresses_own_access" ON public.addresses;
CREATE POLICY "addresses_own_access"
  ON public.addresses FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- settings ----
DROP POLICY IF EXISTS "settings_own_access" ON public.settings;
CREATE POLICY "settings_own_access"
  ON public.settings FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- notifications ----
DROP POLICY IF EXISTS "notifications_own_access" ON public.notifications;
CREATE POLICY "notifications_own_access"
  ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_admin_insert" ON public.notifications;
CREATE POLICY "notifications_admin_insert"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- ============================================================
-- 9. TRIGGERS
-- ============================================================

-- Auto-create profile on new auth user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at triggers
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_cart_updated_at ON public.cart;
CREATE TRIGGER set_cart_updated_at
  BEFORE UPDATE ON public.cart
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_addresses_updated_at ON public.addresses;
CREATE TRIGGER set_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_settings_updated_at ON public.settings;
CREATE TRIGGER set_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 10. SEED DATA — order_status lookup table
-- ============================================================

INSERT INTO public.order_status (code, label, description, sort_order) VALUES
  ('confirmado',       'Pedido confirmado',   'Tu pedido ha sido recibido y confirmado.',        1),
  ('preparando',       'Preparando artículo', 'Estamos preparando tu artículo.',                 2),
  ('empaquetando',     'Empaquetando',        'Tu pedido está siendo empaquetado.',              3),
  ('preparando_envio', 'Preparando envío',    'Tu pedido está listo para ser enviado.',          4),
  ('camino',           'En camino',           'Tu pedido está en camino a tu dirección.',        5),
  ('entregado',        'Entregado',           'Tu pedido fue entregado correctamente.',          6),
  ('cancelado',        'Cancelado',           'El pedido fue cancelado.',                        7)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 11. SEED DATA — sample categories
-- ============================================================

INSERT INTO public.categories (id, name, slug, description) VALUES
  (gen_random_uuid(), 'Salas',      'salas',      'Sofás, sillones y muebles para sala'),
  (gen_random_uuid(), 'Recámaras',  'recamaras',  'Camas, colchones y muebles para recámara'),
  (gen_random_uuid(), 'Comedores',  'comedores',  'Mesas, sillas y muebles para comedor'),
  (gen_random_uuid(), 'Oficina',    'oficina',    'Escritorios, sillas y muebles de oficina'),
  (gen_random_uuid(), 'Decoración', 'decoracion', 'Accesorios y artículos decorativos')
ON CONFLICT (slug) DO NOTHING;
