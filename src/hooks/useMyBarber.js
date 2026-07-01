import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const STAFF_ROLES = ['barber', 'super_admin'];

// Resuelve la fila de `barbers` vinculada al perfil logueado (self-service:
// mi horario, mis servicios, mi caja). null si el usuario no es staff o
// todavía no tiene ficha de barbero vinculada.
export function useMyBarber(profile) {
  const [barber, setBarber] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBarber = useCallback(async (mountedRef = { current: true }) => {
    if (!profile || !STAFF_ROLES.includes(profile.role)) {
      if (mountedRef.current) { setBarber(null); setLoading(false); }
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('barbers')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();
    if (mountedRef.current) { setBarber(data || null); setLoading(false); }
  }, [profile?.id, profile?.role]);

  useEffect(() => {
    const mountedRef = { current: true };
    fetchBarber(mountedRef);
    return () => { mountedRef.current = false; };
  }, [fetchBarber]);

  return { barber, barberId: barber?.id || null, loading, refetch: () => fetchBarber() };
}

export default useMyBarber;
