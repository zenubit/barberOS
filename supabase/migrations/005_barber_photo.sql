-- ============================================================
-- 005: Foto opcional para barberos
-- ============================================================
ALTER TABLE public.barbers
  ADD COLUMN IF NOT EXISTS photo_url TEXT;
