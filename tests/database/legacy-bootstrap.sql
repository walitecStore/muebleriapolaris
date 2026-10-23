-- Reproduce an existing Supabase project that already has profile data and enums.
-- A destructive DROP TYPE CASCADE used to remove profiles.role before indexing it.
CREATE TYPE public.user_role AS ENUM ('admin','user');
CREATE TYPE public.order_status_enum AS ENUM ('confirmado','preparando','empaquetando','preparando_envio','camino','entregado','cancelado');
CREATE TYPE public.notification_type AS ENUM ('promocion','nuevo_producto','estado_pedido','general');
CREATE TABLE public.profiles(
 id uuid PRIMARY KEY REFERENCES auth.users(id),email text NOT NULL UNIQUE,
 full_name text NOT NULL DEFAULT '',avatar_url text,telefono text,
 role public.user_role NOT NULL DEFAULT 'user',created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now()
);
INSERT INTO auth.users(id,email) VALUES('66666666-6666-4666-8666-666666666666','legacy@example.test');
INSERT INTO public.profiles(id,email,full_name,telefono,role) VALUES('66666666-6666-4666-8666-666666666666','legacy@example.test','Preserve existing name','999999999','user');
CREATE TABLE public.legacy_enum_preservation(id int PRIMARY KEY,status public.order_status_enum NOT NULL,kind public.notification_type NOT NULL);
INSERT INTO public.legacy_enum_preservation VALUES(1,'confirmado','general');
