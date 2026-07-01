-- ============================================================
-- BarberOS — Esquema Completo v1
-- Basado en el esquema de Barbería Cénit, extendido para:
--   - Múltiples trabajadores y múltiples servicios (barber_services)
--   - Franjas reservadas para clientes frecuentes (reserved_slots)
--   - Capacidad por servicio (services.max_capacity)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  second_name TEXT,
  first_lastname TEXT NOT NULL,
  second_lastname TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  identification TEXT,
  identification_type TEXT DEFAULT 'CC' CHECK (identification_type IN ('CC', 'TI', 'CE', 'PP', 'NIT')),
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'barber', 'super_admin')),
  avatar_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'suspended')),
  is_frequent BOOLEAN DEFAULT FALSE,
  no_show_count INTEGER DEFAULT 0,
  email_verified BOOLEAN DEFAULT FALSE,
  -- Permiso delegado: un admin normal NO gestiona inventario/tienda a
  -- menos que el super_admin le otorgue este flag explícitamente
  -- (ver migrations/004_inventory_permission_and_raffle_security.sql).
  can_manage_inventory BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. BARBERS (trabajadores)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.barbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Barbero',
  years_experience INTEGER,
  signature_style TEXT,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on-leave')),
  photo_url TEXT, -- opcional, ver migrations/005_barber_photo.sql
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. SERVICES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  price NUMERIC NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  max_capacity INTEGER NOT NULL DEFAULT 1,
  category TEXT DEFAULT 'corte' CHECK (category IN ('corte', 'afeitado', 'completo', 'diseño', 'otro')),
  available BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. BARBER_SERVICES (qué servicios ofrece cada trabajador)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.barber_services (
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (barber_id, service_id)
);

-- ============================================================
-- 5. BARBER SCHEDULES (horario semanal por trabajador)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.barber_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(barber_id, day_of_week)
);

-- ============================================================
-- 6. SCHEDULE BLOCKS (almuerzo, día libre, vacaciones, custom)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.schedule_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL DEFAULT 'custom' CHECK (block_type IN ('lunch', 'break', 'vacation', 'day_off', 'custom')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  recurrence TEXT DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekly')),
  reason TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

-- ============================================================
-- 7. RESERVED SLOTS (franjas reservadas para clientes frecuentes)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reserved_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  client_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_name TEXT,
  client_phone TEXT,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'reserved' CHECK (status IN ('reserved', 'used', 'cancelled', 'expired')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- ============================================================
-- 8. PRODUCT CATEGORIES / PRODUCTS / PRODUCT IMAGES (tienda)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  collection TEXT,
  price NUMERIC NOT NULL,
  stock INTEGER DEFAULT 0,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  color_hex TEXT,
  accent_hex TEXT,
  color_name TEXT,
  tag TEXT,
  material TEXT,
  sku TEXT UNIQUE,
  visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. APPOINTMENTS (citas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  end_time TIME,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'in-chair', 'completed',
    'no-show', 'cancelled', 'late-cancelled'
  )),
  checked_in_at TIMESTAMPTZ,
  is_free_cut BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. RESERVATIONS (apartados de productos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. MONTHLY RAFFLES (sorteos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.monthly_raffles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raffle_month DATE NOT NULL,
  winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  prize_type TEXT DEFAULT 'free_cut',
  prize_appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  prize_expires_at TIMESTAMPTZ,
  prize_redeemed BOOLEAN DEFAULT FALSE,
  eligible_count INTEGER DEFAULT 0,
  ticket_digits INTEGER DEFAULT 6,
  drawn_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(raffle_month)
);

-- ============================================================
-- 12. NOTIFICATIONS LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'whatsapp', 'sms')),
  recipient TEXT NOT NULL,
  subject TEXT,
  body_preview TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
  related_appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  related_reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. ADMIN SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. CAJA / GASTOS (contabilidad simple)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_per_unit NUMERIC NOT NULL,
  total NUMERIC GENERATED ALWAYS AS (quantity * price_per_unit) STORED,
  description TEXT,
  barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL DEFAULT 'Otro',
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_barber_services_barber ON public.barber_services(barber_id);
CREATE INDEX IF NOT EXISTS idx_barber_services_service ON public.barber_services(service_id);

CREATE INDEX IF NOT EXISTS idx_barber_schedules_barber ON public.barber_schedules(barber_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_barber ON public.schedule_blocks(barber_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_dates ON public.schedule_blocks(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_reserved_slots_barber_date ON public.reserved_slots(barber_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_reserved_slots_client ON public.reserved_slots(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_reserved_slots_status ON public.reserved_slots(status);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_visible ON public.products(visible);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_barber ON public.appointments(barber_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON public.appointments(appointment_date, appointment_time);

CREATE INDEX IF NOT EXISTS idx_reservations_product ON public.reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_expires ON public.reservations(expires_at);

CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications_log(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications_log(status);

CREATE INDEX IF NOT EXISTS idx_monthly_raffles_month ON public.monthly_raffles(raffle_month);

CREATE INDEX IF NOT EXISTS idx_daily_sales_date ON public.daily_sales(date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);

-- ============================================================
-- VIEWS
-- ============================================================

CREATE OR REPLACE VIEW public.available_products AS
SELECT
  p.*,
  pc.name AS category_name,
  pc.slug AS category_slug,
  (p.stock - COALESCE(r.active_reservations, 0)) AS available_stock
FROM public.products p
LEFT JOIN public.product_categories pc ON p.category_id = pc.id
LEFT JOIN (
  SELECT product_id, SUM(quantity) AS active_reservations
  FROM public.reservations
  WHERE status = 'pending' AND expires_at > NOW()
  GROUP BY product_id
) r ON p.id = r.product_id
WHERE p.visible = TRUE;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-calcular end_time al insertar/actualizar appointment
CREATE OR REPLACE FUNCTION public.calculate_appointment_end_time()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  service_duration INTEGER;
BEGIN
  SELECT duration_minutes INTO service_duration
  FROM public.services WHERE id = NEW.service_id;

  IF service_duration IS NOT NULL THEN
    NEW.end_time := NEW.appointment_time + (service_duration || ' minutes')::INTERVAL;
  ELSE
    NEW.end_time := NEW.appointment_time + INTERVAL '45 minutes';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calc_end_time ON public.appointments;
CREATE TRIGGER trg_calc_end_time
  BEFORE INSERT OR UPDATE OF appointment_time, service_id
  ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_appointment_end_time();

-- Incrementar no-show y bloquear cliente tras 3 inasistencias
CREATE OR REPLACE FUNCTION public.handle_no_show()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'no-show' AND OLD.status != 'no-show' AND NEW.user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET
      no_show_count = no_show_count + 1,
      status = CASE
        WHEN no_show_count + 1 >= 3 THEN 'blocked'
        ELSE status
      END,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_no_show ON public.appointments;
CREATE TRIGGER trg_handle_no_show
  AFTER UPDATE OF status
  ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_no_show();

-- Crear perfil automáticamente al registrarse un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, first_name, first_lastname, email, phone,
    identification, identification_type, role
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'first_lastname', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'identification', NULL),
    COALESCE(NEW.raw_user_meta_data->>'identification_type', 'CC'),
    'customer'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Cancelar reservas de productos expiradas
CREATE OR REPLACE FUNCTION public.cancel_expired_reservations()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.reservations
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' AND expires_at <= NOW();
END;
$$;

-- Expirar franjas reservadas de clientes frecuentes que ya pasaron
CREATE OR REPLACE FUNCTION public.expire_reserved_slots()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.reserved_slots
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'reserved'
    AND (slot_date < CURRENT_DATE OR (slot_date = CURRENT_DATE AND end_time < CURRENT_TIME));
END;
$$;

-- Usuarios elegibles para sorteo mensual (solo super_admin puede invocarlo:
-- expone nombres/conteos de clientes, ver migrations/004_*.sql)
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

-- Ejecutar sorteo mensual (solo super_admin, ver migrations/004_*.sql)
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

-- Búsqueda de email por teléfono y chequeo de teléfono duplicado
-- (SECURITY DEFINER de superficie mínima, ver migrations/002_phone_lookup_rpc.sql)
CREATE OR REPLACE FUNCTION public.find_email_by_phone(p_phone TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

-- Slots disponibles para un trabajador + servicio en una fecha
-- Tiene en cuenta: horario del trabajador, duración y capacidad del servicio,
-- bloqueos (schedule_blocks) y franjas reservadas (reserved_slots) de otros clientes.
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_barber_id UUID,
  p_service_id UUID,
  p_date DATE,
  p_client_phone TEXT DEFAULT NULL
)
RETURNS TABLE (
  slot_time TIME,
  is_available BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_day_of_week INTEGER;
  v_open_time TIME;
  v_close_time TIME;
  v_slot TIME;
  v_slot_interval INTERVAL := INTERVAL '30 minutes';
  v_duration INTERVAL;
  v_capacity INTEGER;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date)::INTEGER;

  SELECT (s.duration_minutes || ' minutes')::INTERVAL, s.max_capacity
  INTO v_duration, v_capacity
  FROM public.services s WHERE s.id = p_service_id;

  IF v_duration IS NULL THEN
    v_duration := INTERVAL '45 minutes';
    v_capacity := 1;
  END IF;

  SELECT bs.open_time, bs.close_time INTO v_open_time, v_close_time
  FROM public.barber_schedules bs
  WHERE bs.barber_id = p_barber_id
    AND bs.day_of_week = v_day_of_week
    AND bs.is_active = TRUE;

  IF v_open_time IS NULL THEN
    RETURN;
  END IF;

  v_slot := v_open_time;

  WHILE v_slot + v_duration <= v_close_time LOOP
    RETURN QUERY
    SELECT
      v_slot,
      (
        (
          SELECT COUNT(*) FROM public.appointments a
          WHERE a.barber_id = p_barber_id
            AND a.appointment_date = p_date
            AND a.appointment_time < (v_slot + v_duration)
            AND a.end_time > v_slot
            AND a.status NOT IN ('cancelled', 'no-show', 'late-cancelled')
        ) < v_capacity
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.schedule_blocks sb
        WHERE sb.barber_id = p_barber_id
          AND sb.is_active = TRUE
          AND p_date BETWEEN sb.start_date AND sb.end_date
          AND (
            (sb.start_time IS NULL AND sb.end_time IS NULL)
            OR (v_slot < sb.end_time AND (v_slot + v_duration) > sb.start_time)
          )
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.reserved_slots rs
        WHERE rs.barber_id = p_barber_id
          AND rs.slot_date = p_date
          AND rs.status = 'reserved'
          AND (v_slot < rs.end_time AND (v_slot + v_duration) > rs.start_time)
          AND (p_client_phone IS NULL OR rs.client_phone IS DISTINCT FROM p_client_phone)
      );

    v_slot := v_slot + v_slot_interval;
  END LOOP;
END;
$$;

-- updated_at automático
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS trg_barbers_updated_at ON public.barbers;
CREATE TRIGGER trg_barbers_updated_at BEFORE UPDATE ON public.barbers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS trg_schedule_blocks_updated_at ON public.schedule_blocks;
CREATE TRIGGER trg_schedule_blocks_updated_at BEFORE UPDATE ON public.schedule_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS trg_reserved_slots_updated_at ON public.reserved_slots;
CREATE TRIGGER trg_reserved_slots_updated_at BEFORE UPDATE ON public.reserved_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS trg_reservations_updated_at ON public.reservations;
CREATE TRIGGER trg_reservations_updated_at BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS trg_admin_settings_updated_at ON public.admin_settings;
CREATE TRIGGER trg_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserved_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- is_admin() = admin o super_admin (gestión general); is_super_admin() = dueño
-- (usuarios, catálogo maestro, tienda, sorteos, caja global); my_barber_id()
-- resuelve la fila de barbers vinculada al usuario logueado (self-service).
-- Ver migrations/003_roles_and_barber_cash.sql para el detalle de políticas RLS
-- "self" vs "super_admin" agregadas sobre barbers/barber_services/
-- barber_schedules/schedule_blocks/reserved_slots/daily_sales/expenses.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.my_barber_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM public.barbers WHERE profile_id = auth.uid() LIMIT 1;
$$;

-- Permiso delegado de inventario: super_admin siempre puede; un admin
-- normal solo si el super_admin le activó profiles.can_manage_inventory.
-- Ver migrations/004_inventory_permission_and_raffle_security.sql.
CREATE OR REPLACE FUNCTION public.can_manage_inventory()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (role = 'super_admin' OR (role = 'admin' AND can_manage_inventory = TRUE))
  );
$$;

-- PROFILES
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- BARBERS
DROP POLICY IF EXISTS "barbers_public_read" ON public.barbers;
CREATE POLICY "barbers_public_read" ON public.barbers
  FOR SELECT USING (status = 'active');
DROP POLICY IF EXISTS "barbers_admin_all" ON public.barbers;
CREATE POLICY "barbers_admin_all" ON public.barbers
  FOR ALL USING (public.is_admin());

-- BARBER SERVICES
DROP POLICY IF EXISTS "barber_services_public_read" ON public.barber_services;
CREATE POLICY "barber_services_public_read" ON public.barber_services
  FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "barber_services_admin_all" ON public.barber_services;
CREATE POLICY "barber_services_admin_all" ON public.barber_services
  FOR ALL USING (public.is_admin());

-- BARBER SCHEDULES
DROP POLICY IF EXISTS "barber_schedules_public_read" ON public.barber_schedules;
CREATE POLICY "barber_schedules_public_read" ON public.barber_schedules
  FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "barber_schedules_admin_all" ON public.barber_schedules;
CREATE POLICY "barber_schedules_admin_all" ON public.barber_schedules
  FOR ALL USING (public.is_admin());

-- SCHEDULE BLOCKS
DROP POLICY IF EXISTS "schedule_blocks_public_read" ON public.schedule_blocks;
CREATE POLICY "schedule_blocks_public_read" ON public.schedule_blocks
  FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "schedule_blocks_admin_all" ON public.schedule_blocks;
CREATE POLICY "schedule_blocks_admin_all" ON public.schedule_blocks
  FOR ALL USING (public.is_admin());

-- RESERVED SLOTS: el dueño de la franja la puede ver, el admin ve todas
DROP POLICY IF EXISTS "reserved_slots_select_own" ON public.reserved_slots;
CREATE POLICY "reserved_slots_select_own" ON public.reserved_slots
  FOR SELECT USING (auth.uid() = client_profile_id OR public.is_admin());
DROP POLICY IF EXISTS "reserved_slots_admin_all" ON public.reserved_slots;
CREATE POLICY "reserved_slots_admin_all" ON public.reserved_slots
  FOR ALL USING (public.is_admin());

-- SERVICES
DROP POLICY IF EXISTS "services_public_read" ON public.services;
CREATE POLICY "services_public_read" ON public.services
  FOR SELECT USING (available = TRUE);
DROP POLICY IF EXISTS "services_admin_all" ON public.services;
CREATE POLICY "services_admin_all" ON public.services
  FOR ALL USING (public.is_admin());

-- PRODUCT CATEGORIES (tienda/inventario: super_admin siempre, admin solo con
-- permiso delegado can_manage_inventory — ver can_manage_inventory())
DROP POLICY IF EXISTS "product_categories_public_read" ON public.product_categories;
CREATE POLICY "product_categories_public_read" ON public.product_categories
  FOR SELECT USING (active = TRUE);
DROP POLICY IF EXISTS "product_categories_admin_all" ON public.product_categories;
DROP POLICY IF EXISTS "product_categories_super_admin_all" ON public.product_categories;
DROP POLICY IF EXISTS "product_categories_inventory_manage" ON public.product_categories;
CREATE POLICY "product_categories_inventory_manage" ON public.product_categories
  FOR ALL USING (public.can_manage_inventory());

-- PRODUCTS
DROP POLICY IF EXISTS "products_public_read" ON public.products;
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT USING (visible = TRUE);
DROP POLICY IF EXISTS "products_admin_all" ON public.products;
DROP POLICY IF EXISTS "products_super_admin_all" ON public.products;
DROP POLICY IF EXISTS "products_inventory_manage" ON public.products;
CREATE POLICY "products_inventory_manage" ON public.products
  FOR ALL USING (public.can_manage_inventory());

-- PRODUCT IMAGES
DROP POLICY IF EXISTS "product_images_public_read" ON public.product_images;
CREATE POLICY "product_images_public_read" ON public.product_images
  FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "product_images_admin_all" ON public.product_images;
DROP POLICY IF EXISTS "product_images_super_admin_all" ON public.product_images;
DROP POLICY IF EXISTS "product_images_inventory_manage" ON public.product_images;
CREATE POLICY "product_images_inventory_manage" ON public.product_images
  FOR ALL USING (public.can_manage_inventory());

-- APPOINTMENTS (admin y barber son equivalentes: cada uno solo ve/gestiona
-- las suyas vía appointments_select_own_barber/appointments_update_own_barber
-- de migrations/003_*.sql; ver TODAS las citas del negocio es solo
-- super_admin, ver migrations/006_unify_admin_barber.sql)
DROP POLICY IF EXISTS "appointments_insert_auth" ON public.appointments;
CREATE POLICY "appointments_insert_auth" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "appointments_select_own" ON public.appointments;
CREATE POLICY "appointments_select_own" ON public.appointments
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "appointments_select_admin" ON public.appointments;
DROP POLICY IF EXISTS "appointments_select_super_admin" ON public.appointments;
CREATE POLICY "appointments_select_super_admin" ON public.appointments
  FOR SELECT USING (public.is_super_admin());
DROP POLICY IF EXISTS "appointments_admin_all" ON public.appointments;
DROP POLICY IF EXISTS "appointments_super_admin_all" ON public.appointments;
CREATE POLICY "appointments_super_admin_all" ON public.appointments
  FOR ALL USING (public.is_super_admin());

-- RESERVATIONS
DROP POLICY IF EXISTS "reservations_insert_auth" ON public.reservations;
CREATE POLICY "reservations_insert_auth" ON public.reservations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "reservations_select_own" ON public.reservations;
CREATE POLICY "reservations_select_own" ON public.reservations
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "reservations_select_admin" ON public.reservations;
CREATE POLICY "reservations_select_admin" ON public.reservations
  FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "reservations_admin_all" ON public.reservations;
CREATE POLICY "reservations_admin_all" ON public.reservations
  FOR ALL USING (public.is_admin());

-- MONTHLY RAFFLES
DROP POLICY IF EXISTS "raffles_public_read" ON public.monthly_raffles;
CREATE POLICY "raffles_public_read" ON public.monthly_raffles
  FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "raffles_admin_all" ON public.monthly_raffles;
CREATE POLICY "raffles_admin_all" ON public.monthly_raffles
  FOR ALL USING (public.is_admin());

-- NOTIFICATIONS LOG
DROP POLICY IF EXISTS "notifications_admin_all" ON public.notifications_log;
CREATE POLICY "notifications_admin_all" ON public.notifications_log
  FOR ALL USING (public.is_admin());

-- ADMIN SETTINGS
DROP POLICY IF EXISTS "admin_settings_admin_all" ON public.admin_settings;
CREATE POLICY "admin_settings_admin_all" ON public.admin_settings
  FOR ALL USING (public.is_admin());

-- DAILY SALES / EXPENSES (solo admin)
DROP POLICY IF EXISTS "daily_sales_admin_all" ON public.daily_sales;
CREATE POLICY "daily_sales_admin_all" ON public.daily_sales
  FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "expenses_admin_all" ON public.expenses;
CREATE POLICY "expenses_admin_all" ON public.expenses
  FOR ALL USING (public.is_admin());

-- ============================================================
-- SEED DATA (configuración base, sin datos de Cénit)
-- ============================================================

INSERT INTO public.admin_settings (key, value)
VALUES
  ('business_name', '"BarberOS"'::JSONB),
  ('late_threshold_minutes', '5'::JSONB),
  ('max_no_shows_before_block', '3'::JSONB),
  ('raffle_prize_validity_days', '10'::JSONB),
  ('default_slot_interval_minutes', '30'::JSONB),
  ('whatsapp_notifications_enabled', 'true'::JSONB),
  ('email_notifications_enabled', 'true'::JSONB)
ON CONFLICT (key) DO NOTHING;
