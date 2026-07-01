import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const STAFF_ROLES = ['barber', 'admin', 'super_admin'];

// Resuelve la fila de `barbers` vinculada al perfil logueado (self-service:
// mi horario, mis servicios, mi caja). null si el usuario no es staff o
// todavía no tiene ficha de barbero vinculada.
export function useMyBarber(profile) {
  const [barber, setBarber] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (!profile || !STAFF_ROLES.includes(profile.role)) {
      setBarber(null);
      setLoading(false);
      return () => { mounted = false; };
    }

    setLoading(true);
    supabase
      .from('barbers')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (mounted) setBarber(data || null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [profile?.id, profile?.role]);

  return { barber, barberId: barber?.id || null, loading };
}

export default useMyBarber;
