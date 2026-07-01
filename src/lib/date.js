// Fecha en formato YYYY-MM-DD basada en hora LOCAL, no UTC.
// date.toISOString() convierte a UTC: en Colombia (UTC-5) eso hace que
// entre ~19:00 y 23:59 hora local se devuelva la fecha de "mañana".
export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO() {
  return toISODate(new Date());
}
