-- Mueblería Polaris — Etapa 6: intentos de pago, configuración y verificación.
-- Aditiva e idempotente. Ejecutar manualmente; no contiene credenciales ni datos bancarios.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS provider_reference TEXT;

CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT, method TEXT NOT NULL,
  provider TEXT, provider_payment_id TEXT, provider_reference TEXT, status TEXT NOT NULL DEFAULT 'pending',
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0), currency TEXT NOT NULL DEFAULT 'PEN',
  expires_at TIMESTAMPTZ, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (status IN ('pending','approved','rejected','cancelled','failed'))
);
CREATE INDEX IF NOT EXISTS payment_attempts_order_idx ON public.payment_attempts(order_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS payment_attempts_one_pending_idx ON public.payment_attempts(order_id) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), provider TEXT NOT NULL, event_id TEXT NOT NULL,
  payment_attempt_id UUID REFERENCES public.payment_attempts(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, payload JSONB NOT NULL DEFAULT '{}'::jsonb, processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider,event_id)
);

ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payment_attempts_own_read ON public.payment_attempts;
CREATE POLICY payment_attempts_own_read ON public.payment_attempts FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS payment_attempts_admin_all ON public.payment_attempts;
CREATE POLICY payment_attempts_admin_all ON public.payment_attempts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS payment_events_admin_read ON public.payment_events;
CREATE POLICY payment_events_admin_read ON public.payment_events FOR SELECT TO authenticated USING (public.is_admin());

-- Solo se publican datos operativos no sensibles. El administrador carga QR/cuentas en metadata.
UPDATE public.payment_methods SET is_active=FALSE
 WHERE code IN ('card','mercado_pago') AND provider IS NULL;
UPDATE public.payment_methods SET sort_order=CASE code WHEN 'card' THEN 10 WHEN 'yape' THEN 20 WHEN 'plin' THEN 21 WHEN 'bank_transfer' THEN 50 WHEN 'mercado_pago' THEN 40 ELSE sort_order END;

CREATE OR REPLACE FUNCTION public.manage_payment_attempt(p_order_id UUID,p_action TEXT,p_method TEXT DEFAULT NULL)
RETURNS TABLE(attempt_id UUID,order_id UUID,order_number TEXT,method TEXT,status TEXT,amount NUMERIC,provider TEXT,provider_reference TEXT,expires_at TIMESTAMPTZ,method_metadata JSONB)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_order public.orders%ROWTYPE; v_method public.payment_methods%ROWTYPE; v_attempt public.payment_attempts%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id=p_order_id AND user_id=auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.payment_status IN ('approved','aprobado','cancelled','cancelado') THEN RAISE EXCEPTION 'Payment cannot be changed'; END IF;
  IF p_action NOT IN ('continue','retry','change','start') THEN RAISE EXCEPTION 'Invalid action'; END IF;
  SELECT * INTO v_attempt FROM public.payment_attempts WHERE payment_attempts.order_id=p_order_id AND payment_attempts.status='pending' LIMIT 1 FOR UPDATE;
  -- start/continue/retry son idempotentes mientras exista un intento pendiente del
  -- mismo método. Solo change hacia otro método invalida y reemplaza el intento.
  IF FOUND AND (p_action IN ('continue','start','retry') OR COALESCE(p_method,v_attempt.method)=v_attempt.method) THEN
    SELECT * INTO v_method FROM public.payment_methods WHERE code=v_attempt.method;
    IF v_attempt.method='bank_transfer' AND NOT (
      COALESCE(v_method.metadata->>'bank','')<>'' AND
      COALESCE(v_method.metadata->>'account_holder','')<>'' AND
      COALESCE(v_method.metadata->>'account_number','')<>''
    ) THEN RAISE EXCEPTION 'Bank transfer is not configured'; END IF;
  ELSE
    SELECT * INTO v_method FROM public.payment_methods WHERE code=COALESCE(p_method,v_order.payment_method) AND is_active;
    IF NOT FOUND THEN RAISE EXCEPTION 'Payment method unavailable'; END IF;
    IF v_method.code='bank_transfer' AND NOT (
      COALESCE(v_method.metadata->>'bank','')<>'' AND
      COALESCE(v_method.metadata->>'account_holder','')<>'' AND
      COALESCE(v_method.metadata->>'account_number','')<>''
    ) THEN RAISE EXCEPTION 'Bank transfer is not configured'; END IF;
    UPDATE public.payment_attempts SET status='cancelled',updated_at=now() WHERE payment_attempts.order_id=p_order_id AND payment_attempts.status='pending';
    INSERT INTO public.payment_attempts(order_id,user_id,method,provider,status,amount)
      VALUES(p_order_id,auth.uid(),v_method.code,v_method.provider,'pending',v_order.total) RETURNING * INTO v_attempt;
    UPDATE public.orders SET payment_method=v_method.code,payment_provider=v_method.provider,payment_status='pending' WHERE id=p_order_id;
  END IF;
  RETURN QUERY SELECT v_attempt.id,v_order.id,v_order.order_number,v_attempt.method,v_attempt.status,v_order.total,
    v_attempt.provider,v_attempt.provider_reference,v_attempt.expires_at,COALESCE(v_method.metadata,'{}'::jsonb);
END $$;
REVOKE ALL ON FUNCTION public.manage_payment_attempt(UUID,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_payment_attempt(UUID,TEXT,TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_manual_payment(p_order_id UUID,p_status TEXT,p_reference TEXT DEFAULT NULL,p_note TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_method TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin required'; END IF;
  IF p_status NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  SELECT payment_method INTO v_method FROM public.orders WHERE id=p_order_id FOR UPDATE;
  IF v_method NOT IN ('yape','plin','bank_transfer') THEN RAISE EXCEPTION 'Not a manual payment'; END IF;
  UPDATE public.orders SET payment_status=p_status,paid_at=CASE WHEN p_status='approved' THEN now() ELSE NULL END,
    provider_reference=NULLIF(p_reference,''),payment_metadata=payment_metadata||jsonb_build_object('manual_review_note',COALESCE(p_note,''),'reviewed_at',now()) WHERE id=p_order_id;
  UPDATE public.payment_attempts SET status=p_status,provider_reference=NULLIF(p_reference,''),updated_at=now() WHERE order_id=p_order_id AND status='pending';
END $$;
REVOKE ALL ON FUNCTION public.review_manual_payment(UUID,TEXT,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_manual_payment(UUID,TEXT,TEXT,TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_unpaid_logistics() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.status IN ('preparando','empaquetando','preparando_envio','camino','entregado') AND NEW.payment_status NOT IN ('approved','aprobado') THEN
   RAISE EXCEPTION 'An unpaid order cannot enter logistics';
 END IF; RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_unpaid_logistics ON public.orders;
CREATE TRIGGER guard_unpaid_logistics BEFORE INSERT OR UPDATE OF status,payment_status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.guard_unpaid_logistics();
