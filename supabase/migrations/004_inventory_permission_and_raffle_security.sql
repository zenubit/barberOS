-- ============================================================
-- 004: Permiso delegado de inventario + endurecer RPCs de sorteo
-- ============================================================
-- Contexto de negocio:
--   - Solo super_admin gestiona usuarios, crea/elimina barberos,
--     se asigna a sí mismo como barbero, desactiva otros barberos,
--     y controla la tienda/inventario por defecto.
--   - Un admin (barbero con rol admin) NO puede borrar ni tocar el
--     inventario a menos que el super_admin le otorgue el permiso
--     explícito `can_manage_inventory`.

-- 1. Flag de permiso delegado en profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS can_manage_inventory BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Helper: ¿el usuario actual puede gestionar inventario?
--    (super_admin siempre puede; admin solo si tiene el flag delegado)
CREATE OR REPLACE FUNCTION public.can_manage_inventory()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (role = 'super_admin' OR (role = 'admin' AND can_manage_inventory = TRUE))
  );
$$;

-- 3. Tienda: super_admin siempre; admin solo con permiso delegado
DROP POLICY IF EXISTS "product_categories_super_admin_all" ON public.product_categories;
CREATE POLICY "product_categories_inventory_manage" ON public.product_categories
  FOR ALL USING (public.can_manage_inventory());

DROP POLICY IF EXISTS "products_super_admin_all" ON public.products;
CREATE POLICY "products_inventory_manage" ON public.products
  FOR ALL USING (public.can_manage_inventory());

DROP POLICY IF EXISTS "product_images_super_admin_all" ON public.product_images;
CREATE POLICY "product_images_inventory_manage" ON public.product_images
  FOR ALL USING (public.can_manage_inventory());

-- 4. Endurecer RPCs de sorteo: solo super_admin puede consultar elegibles
--    o ejecutar el sorteo (antes cualquier usuario autenticado podía
--    invocar estas funciones SECURITY DEFINER directamente vía API).
CREATE OR REPLACE FUNCTION public.get_raffle_eligible_users(target_month DATE)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  completed_appointments BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  SELECT
    a.user_id,
    (p.first_name || ' ' || p.first_lastname)::TEXT AS full_name,
    COUNT(*)::BIGINT AS completed_appointments
  FROM public.appointments a
  JOIN public.profiles p ON a.user_id = p.id
  WHERE
    a.status = 'completed'
    AND a.is_free_cut = FALSE
    AND a.user_id IS NOT NULL
    AND EXTRACT(MONTH FROM a.appointment_date) = EXTRACT(MONTH FROM target_month)
    AND EXTRACT(YEAR FROM a.appointment_date) = EXTRACT(YEAR FROM target_month)
    AND p.status = 'active'
  GROUP BY a.user_id, p.first_name, p.first_lastname
  HAVING COUNT(*) > 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.execute_monthly_raffle(target_month DATE)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  winner UUID;
  eligible_total INTEGER;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF EXISTS (SELECT 1 FROM public.monthly_raffles WHERE raffle_month = target_month) THEN
    RAISE EXCEPTION 'Ya existe un sorteo para este mes';
  END IF;

  SELECT COUNT(*) INTO eligible_total
  FROM public.get_raffle_eligible_users(target_month);

  IF eligible_total = 0 THEN
    RAISE EXCEPTION 'No hay usuarios elegibles para el sorteo';
  END IF;

  SELECT user_id INTO winner
  FROM public.get_raffle_eligible_users(target_month)
  ORDER BY RANDOM()
  LIMIT 1;

  INSERT INTO public.monthly_raffles (
    raffle_month, winner_id, prize_type,
    prize_expires_at, eligible_count, drawn_at
  ) VALUES (
    target_month, winner, 'free_cut',
    NOW() + INTERVAL '10 days', eligible_total, NOW()
  );

  RETURN winner;
END;
$$;
