-- ============================================================
-- 007: Eliminar el rol 'admin' como concepto separado
-- ============================================================
-- Tras unificar el dashboard de admin y barbero (migración 006), ya no hay
-- ninguna diferencia funcional entre ambos roles salvo el permiso delegado
-- de inventario — mantenerlos como roles separados solo generaba confusión
-- en el selector de roles ("¿qué diferencia hay entre barbero y admin?").
-- Ahora solo existen 3 roles: customer, barber, super_admin. El permiso de
-- inventario se activa con un flag (can_manage_inventory) sobre cualquier
-- barbero, en vez de depender de un rol "admin" separado.

-- 1. Migrar cuentas existentes con role='admin' a 'barber'
UPDATE public.profiles SET role = 'barber' WHERE role = 'admin';

-- 2. Restringir el CHECK constraint a los 3 roles vigentes
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'barber', 'super_admin'));

-- 3. can_manage_inventory(): el permiso delegado ahora aplica a cualquier
-- 'barber' con el flag activo (antes exigía específicamente role='admin')
CREATE OR REPLACE FUNCTION public.can_manage_inventory()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (role = 'super_admin' OR (role = 'barber' AND can_manage_inventory = TRUE))
  );
$$;

-- 4. is_admin() se conserva por compatibilidad con RLS existentes (varias
-- tablas la usan como "admin o super_admin") pero al no existir ya el rol
-- 'admin', equivale en la práctica a is_super_admin(). Se deja intacta.
