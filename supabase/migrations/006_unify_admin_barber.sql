-- ============================================================
-- 006: Unificar admin y barbero (dashboard/citas)
-- ============================================================
-- Antes: 'admin' veía y gestionaba TODAS las citas del negocio (encargado
-- de turno), además de las suyas propias como barbero. El usuario pidió
-- que admin y barbero sean exactamente iguales: cada uno solo ve/gestiona
-- SUS PROPIAS citas. Ver/gestionar TODAS las citas del negocio queda
-- reservado únicamente a super_admin.
--
-- El resto de la separación "self vs super_admin" ya estaba correcta desde
-- 003_roles_and_barber_cash.sql (barbers, horarios, caja, etc.) — esta
-- migración solo corrige el último caso pendiente: appointments.

DROP POLICY IF EXISTS "appointments_select_admin" ON public.appointments;
CREATE POLICY "appointments_select_super_admin" ON public.appointments
  FOR SELECT USING (public.is_super_admin());

DROP POLICY IF EXISTS "appointments_admin_all" ON public.appointments;
CREATE POLICY "appointments_super_admin_all" ON public.appointments
  FOR ALL USING (public.is_super_admin());

-- Las policies "appointments_select_own_barber" / "appointments_update_own_barber"
-- (barber_id = my_barber_id()) ya existen desde 003 y cubren tanto a
-- 'barber' como a 'admin'/'super_admin' (todos son barberos con silla propia).
