-- ============================================================
-- BarberOS — Migración 002: RPCs de búsqueda por teléfono
-- ============================================================
-- Motivo: authService.signIn (login por teléfono) y authService.signUp
-- (chequeo de teléfono duplicado) hacían SELECT directo sobre
-- public.profiles. La política RLS "profiles_select_own" solo permite
-- ver la fila propia, así que un usuario anónimo (aún no autenticado)
-- siempre recibía 0 filas: el login por teléfono nunca funcionaba y el
-- chequeo de duplicados nunca detectaba nada.
--
-- Fix: dos funciones SECURITY DEFINER de superficie mínima — solo
-- devuelven un email o un booleano, nunca la fila completa de
-- profiles — expuestas a anon/authenticated vía GRANT EXECUTE.
-- ============================================================

CREATE OR REPLACE FUNCTION public.find_email_by_phone(p_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean TEXT;
  v_email TEXT;
BEGIN
  v_clean := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
  IF length(v_clean) < 7 THEN
    RETURN NULL;
  END IF;

  SELECT email INTO v_email
  FROM public.profiles
  WHERE phone IS NOT NULL
    AND regexp_replace(phone, '\D', '', 'g') LIKE '%' || v_clean
  LIMIT 1;

  RETURN v_email;
END;
$$;

REVOKE ALL ON FUNCTION public.find_email_by_phone(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_email_by_phone(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.phone_exists(p_phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean TEXT;
BEGIN
  v_clean := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
  IF v_clean = '' THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE phone IS NOT NULL
      AND regexp_replace(phone, '\D', '', 'g') = v_clean
  );
END;
$$;

REVOKE ALL ON FUNCTION public.phone_exists(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.phone_exists(TEXT) TO anon, authenticated;
