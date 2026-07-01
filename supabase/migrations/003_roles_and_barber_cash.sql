-- ============================================================
-- BarberOS — Migración 003: roles (super_admin) y caja por barbero
-- ============================================================
-- Modelo de permisos:
--   customer     -> reserva citas
--   barber       -> su propio dashboard/citas/horario/servicios que ofrece/caja
--   admin        -> todo lo de barber + ve/gestiona TODAS las citas del negocio
--   super_admin  -> todo lo de admin + usuarios, catálogo maestro de servicios,
--                   tienda, sorteos, caja global
-- admin y super_admin son también "barberos" (tienen fila en barbers vinculada).
-- ============================================================

-- ============================================================
-- 1. ROL super_admin
-- ============================================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'admin', 'barber', 'super_admin'));

-- ============================================================
-- 2. FUNCIONES HELPER
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.my_barber_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.barbers WHERE profile_id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- 3. CAJA POR BARBERO (daily_sales / expenses)
-- ============================================================
ALTER TABLE public.daily_sales ADD COLUMN IF NOT EXISTS barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_daily_sales_barber ON public.daily_sales(barber_id);
CREATE INDEX IF NOT EXISTS idx_expenses_barber ON public.expenses(barber_id);

-- ============================================================
-- 4. RLS — separar "cualquiera" (super_admin) de "lo propio" (self)
-- ============================================================

-- PROFILES: solo super_admin gestiona otros usuarios
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (public.is_super_admin());
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_super_admin_all" ON public.profiles
  FOR ALL USING (public.is_super_admin());

-- BARBERS: super_admin gestiona cualquiera; cada barbero edita su propia ficha
DROP POLICY IF EXISTS "barbers_admin_all" ON public.barbers;
CREATE POLICY "barbers_super_admin_all" ON public.barbers
  FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "barbers_self_update" ON public.barbers;
CREATE POLICY "barbers_self_update" ON public.barbers
  FOR UPDATE USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- BARBER_SERVICES: super_admin asigna a cualquiera; cada barbero elige lo suyo
DROP POLICY IF EXISTS "barber_services_admin_all" ON public.barber_services;
CREATE POLICY "barber_services_super_admin_all" ON public.barber_services
  FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "barber_services_self_all" ON public.barber_services;
CREATE POLICY "barber_services_self_all" ON public.barber_services
  FOR ALL USING (barber_id = public.my_barber_id()) WITH CHECK (barber_id = public.my_barber_id());

-- BARBER_SCHEDULES: super_admin gestiona cualquiera; cada quien su horario
DROP POLICY IF EXISTS "barber_schedules_admin_all" ON public.barber_schedules;
CREATE POLICY "barber_schedules_super_admin_all" ON public.barber_schedules
  FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "barber_schedules_self_all" ON public.barber_schedules;
CREATE POLICY "barber_schedules_self_all" ON public.barber_schedules
  FOR ALL USING (barber_id = public.my_barber_id()) WITH CHECK (barber_id = public.my_barber_id());

-- SCHEDULE_BLOCKS: ídem
DROP POLICY IF EXISTS "schedule_blocks_admin_all" ON public.schedule_blocks;
CREATE POLICY "schedule_blocks_super_admin_all" ON public.schedule_blocks
  FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "schedule_blocks_self_all" ON public.schedule_blocks;
CREATE POLICY "schedule_blocks_self_all" ON public.schedule_blocks
  FOR ALL USING (barber_id = public.my_barber_id()) WITH CHECK (barber_id = public.my_barber_id());

-- RESERVED_SLOTS: ídem
DROP POLICY IF EXISTS "reserved_slots_admin_all" ON public.reserved_slots;
CREATE POLICY "reserved_slots_super_admin_all" ON public.reserved_slots
  FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "reserved_slots_self_all" ON public.reserved_slots;
CREATE POLICY "reserved_slots_self_all" ON public.reserved_slots
  FOR ALL USING (barber_id = public.my_barber_id()) WITH CHECK (barber_id = public.my_barber_id());

-- SERVICES (catálogo maestro): solo super_admin crea/edita/elimina
DROP POLICY IF EXISTS "services_admin_all" ON public.services;
CREATE POLICY "services_super_admin_all" ON public.services
  FOR ALL USING (public.is_super_admin());

-- TIENDA: solo super_admin
DROP POLICY IF EXISTS "product_categories_admin_all" ON public.product_categories;
CREATE POLICY "product_categories_super_admin_all" ON public.product_categories
  FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "products_admin_all" ON public.products;
CREATE POLICY "products_super_admin_all" ON public.products
  FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "product_images_admin_all" ON public.product_images;
CREATE POLICY "product_images_super_admin_all" ON public.product_images
  FOR ALL USING (public.is_super_admin());

-- APPOINTMENTS: admin+super_admin ya ven/gestionan todas (is_admin(), sin cambio).
-- Se agrega acceso propio para el rol 'barber' (no cubierto por is_admin()).
DROP POLICY IF EXISTS "appointments_select_own_barber" ON public.appointments;
CREATE POLICY "appointments_select_own_barber" ON public.appointments
  FOR SELECT USING (barber_id = public.my_barber_id());
DROP POLICY IF EXISTS "appointments_update_own_barber" ON public.appointments;
CREATE POLICY "appointments_update_own_barber" ON public.appointments
  FOR UPDATE USING (barber_id = public.my_barber_id());

-- MONTHLY_RAFFLES / NOTIFICATIONS_LOG / ADMIN_SETTINGS: solo super_admin
DROP POLICY IF EXISTS "raffles_admin_all" ON public.monthly_raffles;
CREATE POLICY "raffles_super_admin_all" ON public.monthly_raffles
  FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "notifications_admin_all" ON public.notifications_log;
CREATE POLICY "notifications_super_admin_all" ON public.notifications_log
  FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "admin_settings_admin_all" ON public.admin_settings;
CREATE POLICY "admin_settings_super_admin_all" ON public.admin_settings
  FOR ALL USING (public.is_super_admin());

-- DAILY_SALES / EXPENSES: super_admin ve/gestiona todo (caja global);
-- cada barbero (incl. admin/super_admin, que también son barberos) su propia caja.
DROP POLICY IF EXISTS "daily_sales_admin_all" ON public.daily_sales;
CREATE POLICY "daily_sales_super_admin_all" ON public.daily_sales
  FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "daily_sales_self_all" ON public.daily_sales;
CREATE POLICY "daily_sales_self_all" ON public.daily_sales
  FOR ALL USING (barber_id = public.my_barber_id() AND public.my_barber_id() IS NOT NULL)
  WITH CHECK (barber_id = public.my_barber_id() AND public.my_barber_id() IS NOT NULL);

DROP POLICY IF EXISTS "expenses_admin_all" ON public.expenses;
CREATE POLICY "expenses_super_admin_all" ON public.expenses
  FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "expenses_self_all" ON public.expenses;
CREATE POLICY "expenses_self_all" ON public.expenses
  FOR ALL USING (barber_id = public.my_barber_id() AND public.my_barber_id() IS NOT NULL)
  WITH CHECK (barber_id = public.my_barber_id() AND public.my_barber_id() IS NOT NULL);
