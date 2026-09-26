-- Mueblería Polaris — Etapa 2: arquitectura e-commerce
-- Migración aditiva. El bucket "product-images" debe verificarse manualmente;
-- esta migración no crea ni modifica recursos de Storage.

-- Catálogo normalizado (se conservan products.subcategory y products.brand).
CREATE TABLE IF NOT EXISTS public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subcategories_category_name
  ON public.subcategories (COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.subcategories(category_id);

CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_name ON public.brands(lower(name));
CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_slug ON public.brands(slug);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS minimum_stock INTEGER NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(12,3),
  ADD COLUMN IF NOT EXISTS dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS units_sold INTEGER NOT NULL DEFAULT 0 CHECK (units_sold >= 0),
  ADD COLUMN IF NOT EXISTS shipping_category TEXT,
  ADD COLUMN IF NOT EXISTS shipping_weight_kg NUMERIC(12,3),
  ADD COLUMN IF NOT EXISTS shipping_volume_m3 NUMERIC(12,6),
  ADD COLUMN IF NOT EXISTS shipping_pieces INTEGER NOT NULL DEFAULT 1 CHECK (shipping_pieces > 0),
  ADD COLUMN IF NOT EXISTS shipping_factor NUMERIC(10,4) NOT NULL DEFAULT 1 CHECK (shipping_factor > 0);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON public.products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);

-- Recupera las etiquetas legacy sin modificarlas ni borrarlas.
INSERT INTO public.brands (name, slug)
SELECT DISTINCT b.name,
       trim(both '-' FROM regexp_replace(lower(b.name), '[^a-z0-9]+', '-', 'g')) || '-' || substr(md5(lower(b.name)), 1, 8)
FROM (SELECT btrim(brand) AS name FROM public.products WHERE NULLIF(btrim(brand), '') IS NOT NULL) b
ON CONFLICT DO NOTHING;

UPDATE public.products p
SET brand_id = b.id
FROM public.brands b
WHERE p.brand_id IS NULL AND lower(b.name) = lower(btrim(p.brand));

INSERT INTO public.subcategories (category_id, name, slug)
SELECT DISTINCT p.category_id, btrim(p.subcategory),
       trim(both '-' FROM regexp_replace(lower(btrim(p.subcategory)), '[^a-z0-9]+', '-', 'g')) || '-' || substr(md5(COALESCE(p.category_id::text, '') || lower(btrim(p.subcategory))), 1, 8)
FROM public.products p
WHERE NULLIF(btrim(p.subcategory), '') IS NOT NULL
ON CONFLICT DO NOTHING;

UPDATE public.products p
SET subcategory_id = s.id
FROM public.subcategories s
WHERE p.subcategory_id IS NULL
  AND s.category_id IS NOT DISTINCT FROM p.category_id
  AND lower(s.name) = lower(btrim(p.subcategory));

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id, sort_order);

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS price_adjustment NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS additional_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  input_type TEXT NOT NULL DEFAULT 'text',
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_attributes_product_name ON public.product_attributes(product_id, lower(name));

CREATE TABLE IF NOT EXISTS public.product_attribute_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id UUID NOT NULL REFERENCES public.product_attributes(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  value_text TEXT,
  value_number NUMERIC,
  value_boolean BOOLEAN,
  value_json JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (num_nonnulls(value_text, value_number, value_boolean, value_json) >= 1)
);
CREATE INDEX IF NOT EXISTS idx_product_attribute_values_attribute ON public.product_attribute_values(attribute_id, sort_order);

-- Reseñas: incluye la referencia UUID normalizada y el identificador del catálogo legacy.
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  catalog_product_id TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT '',
  location TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT,
  text TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
  moderation_notes TEXT,
  moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  helpful INTEGER NOT NULL DEFAULT 0 CHECK (helpful >= 0),
  tags TEXT[] NOT NULL DEFAULT '{}',
  avatar_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (product_id IS NOT NULL OR catalog_product_id IS NOT NULL),
  CHECK (comment IS NOT NULL OR text IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_status ON public.product_reviews(product_id, status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_catalog_status ON public.product_reviews(catalog_product_id, status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user ON public.product_reviews(user_id);

CREATE OR REPLACE FUNCTION public.prepare_pending_product_review()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.user_id := auth.uid();
    NEW.status := 'pending';
    NEW.moderation_notes := NULL;
    NEW.moderated_by := NULL;
    NEW.moderated_at := NULL;
  END IF;
  NEW.comment := COALESCE(NEW.comment, NEW.text);
  NEW.text := COALESCE(NEW.text, NEW.comment);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS prepare_pending_product_review ON public.product_reviews;
CREATE TRIGGER prepare_pending_product_review BEFORE INSERT ON public.product_reviews
FOR EACH ROW EXECUTE FUNCTION public.prepare_pending_product_review();

CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code TEXT NOT NULL,
  min_distance_km NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_distance_km NUMERIC(10,2),
  base_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost_per_km NUMERIC(12,4) NOT NULL DEFAULT 0,
  minimum_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (max_distance_km IS NULL OR max_distance_km >= min_distance_km)
);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_lookup ON public.shipping_rates(category_code, is_active, priority DESC);

CREATE OR REPLACE FUNCTION public.calculate_shipping_cost(p_category_code TEXT, p_distance_km NUMERIC)
RETURNS NUMERIC LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT COALESCE((
    SELECT GREATEST(r.minimum_cost, r.base_cost + (GREATEST(p_distance_km, 0) * r.cost_per_km))
    FROM public.shipping_rates r
    WHERE r.is_active
      AND upper(r.category_code) = upper(p_category_code)
      AND GREATEST(p_distance_km, 0) >= r.min_distance_km
      AND (r.max_distance_km IS NULL OR GREATEST(p_distance_km, 0) <= r.max_distance_km)
    ORDER BY r.priority DESC, r.min_distance_km DESC
    LIMIT 1
  ), 0)::NUMERIC;
$$;

-- Mantiene cart legacy y copia sus filas una sola vez a la arquitectura objetivo.
INSERT INTO public.shopping_carts (user_id)
SELECT DISTINCT c.user_id FROM public.cart c
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.cart_items (cart_id, product_id, quantity, created_at, updated_at)
SELECT sc.id, c.product_id, c.quantity, c.created_at, c.updated_at
FROM public.cart c JOIN public.shopping_carts sc ON sc.user_id = c.user_id
ON CONFLICT (cart_id, product_id, (COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid)))
DO UPDATE SET quantity = GREATEST(public.cart_items.quantity, EXCLUDED.quantity);

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS variant_name TEXT,
  ADD COLUMN IF NOT EXISTS variant_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS product_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.order_items oi
SET product_name = COALESCE(oi.product_name, p.name),
    product_sku = COALESCE(oi.product_sku, p.sku),
    product_image_url = COALESCE(oi.product_image_url, p.image_url),
    product_snapshot = CASE WHEN oi.product_snapshot = '{}'::jsonb THEN jsonb_strip_nulls(jsonb_build_object(
      'id', p.id, 'name', p.name, 'sku', p.sku, 'image_url', p.image_url, 'price', oi.unit_price
    )) ELSE oi.product_snapshot END
FROM public.products p WHERE p.id = oi.product_id;

UPDATE public.order_items oi
SET variant_name = COALESCE(oi.variant_name, v.name),
    variant_snapshot = CASE WHEN oi.variant_snapshot = '{}'::jsonb THEN jsonb_strip_nulls(jsonb_build_object(
      'id', v.id, 'name', v.name, 'sku', v.sku, 'attributes', v.attributes
    )) ELSE oi.variant_snapshot END
FROM public.product_variants v WHERE v.id = oi.variant_id;

-- profiles.role es la única fuente de autorización administrativa.
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user'::public.user_role;
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::public.user_role);
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
          COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''), 'user'::public.user_role)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.settings (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can change profile roles';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_profile_role ON public.profiles;
CREATE TRIGGER protect_profile_role BEFORE UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- RLS de las tablas nuevas.
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['subcategories','brands','product_images','product_attributes','product_attribute_values','shipping_rates']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_public_read', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO public USING (true)', t || '_public_read', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_write', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t || '_admin_write', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS product_reviews_public_read ON public.product_reviews;
CREATE POLICY product_reviews_public_read ON public.product_reviews FOR SELECT TO public USING (status = 'published');
DROP POLICY IF EXISTS product_reviews_own_pending ON public.product_reviews;
CREATE POLICY product_reviews_own_pending ON public.product_reviews FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');
DROP POLICY IF EXISTS product_reviews_own_insert ON public.product_reviews;
CREATE POLICY product_reviews_own_insert ON public.product_reviews FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');
DROP POLICY IF EXISTS product_reviews_own_update ON public.product_reviews;
CREATE POLICY product_reviews_own_update ON public.product_reviews FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'pending');
DROP POLICY IF EXISTS product_reviews_own_delete ON public.product_reviews;
CREATE POLICY product_reviews_own_delete ON public.product_reviews FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');
DROP POLICY IF EXISTS product_reviews_admin_access ON public.product_reviews;
CREATE POLICY product_reviews_admin_access ON public.product_reviews FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- El propietario puede crear y leer pedidos, pero solo administración puede mutarlos.
DROP POLICY IF EXISTS "orders_own_access" ON public.orders;
DROP POLICY IF EXISTS orders_own_select ON public.orders;
CREATE POLICY orders_own_select ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS orders_own_insert ON public.orders;
CREATE POLICY orders_own_insert ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "order_items_own_access" ON public.order_items;
DROP POLICY IF EXISTS order_items_own_select ON public.order_items;
CREATE POLICY order_items_own_select ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
DROP POLICY IF EXISTS order_items_own_insert ON public.order_items;
CREATE POLICY order_items_own_insert ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

DROP POLICY IF EXISTS "quotes_own_access" ON public.quotes;
DROP POLICY IF EXISTS quotes_own_select ON public.quotes;
CREATE POLICY quotes_own_select ON public.quotes FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS quotes_own_insert ON public.quotes;
CREATE POLICY quotes_own_insert ON public.quotes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "quote_items_own_access" ON public.quote_items;
DROP POLICY IF EXISTS quote_items_own_select ON public.quote_items;
CREATE POLICY quote_items_own_select ON public.quote_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.user_id = auth.uid()));
DROP POLICY IF EXISTS quote_items_own_insert ON public.quote_items;
CREATE POLICY quote_items_own_insert ON public.quote_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.user_id = auth.uid()));

DROP TRIGGER IF EXISTS set_subcategories_updated_at ON public.subcategories;
CREATE TRIGGER set_subcategories_updated_at BEFORE UPDATE ON public.subcategories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_brands_updated_at ON public.brands;
CREATE TRIGGER set_brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_product_attributes_updated_at ON public.product_attributes;
CREATE TRIGGER set_product_attributes_updated_at BEFORE UPDATE ON public.product_attributes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_product_reviews_updated_at ON public.product_reviews;
CREATE TRIGGER set_product_reviews_updated_at BEFORE UPDATE ON public.product_reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_shipping_rates_updated_at ON public.shipping_rates;
CREATE TRIGGER set_shipping_rates_updated_at BEFORE UPDATE ON public.shipping_rates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
