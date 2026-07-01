import { supabase } from './supabaseClient';

const handleError = (error, context) => {
  const errorMessage = error?.message || 'Error desconocido';
  console.error(`[BarbersService - ${context}]:`, errorMessage);
  throw new Error(`${context}: ${errorMessage}`);
};

export const barbersService = {
  async getAllBarbers(includeInactive = false) {
    try {
      let query = supabase.from('barbers').select('*').order('name', { ascending: true });
      if (!includeInactive) query = query.eq('status', 'active');
      const { data, error } = await query;
      if (error) handleError(error, 'getAllBarbers');
      return data || [];
    } catch (err) {
      handleError(err, 'getAllBarbers');
    }
  },

  // Trabajadores que pueden realizar un servicio específico
  async getBarbersByService(serviceId) {
    try {
      if (!serviceId) throw new Error('Service ID es requerido');
      const { data, error } = await supabase
        .from('barber_services')
        .select('barbers:barber_id(*)')
        .eq('service_id', serviceId);
      if (error) handleError(error, 'getBarbersByService');
      return (data || [])
        .map(row => row.barbers)
        .filter(b => b && b.status === 'active');
    } catch (err) {
      handleError(err, 'getBarbersByService');
    }
  },

  async getBarberById(id) {
    try {
      if (!id) throw new Error('Barber ID es requerido');
      const { data, error } = await supabase.from('barbers').select('*').eq('id', id).single();
      if (error) handleError(error, 'getBarberById');
      return data;
    } catch (err) {
      handleError(err, 'getBarberById');
    }
  },

  async getBarberByProfileId(profileId) {
    try {
      if (!profileId) throw new Error('Profile ID es requerido');
      const { data, error } = await supabase.from('barbers').select('*').eq('profile_id', profileId).maybeSingle();
      if (error) handleError(error, 'getBarberByProfileId');
      return data;
    } catch (err) {
      handleError(err, 'getBarberByProfileId');
    }
  },

  async createBarber(barberData) {
    try {
      if (!barberData.name || !barberData.role) throw new Error('Campos requeridos faltantes (name, role)');
      const { data, error } = await supabase
        .from('barbers')
        .insert([{
          profile_id: barberData.profile_id || null,
          name: barberData.name,
          role: barberData.role,
          years_experience: barberData.years_experience || 0,
          signature_style: barberData.signature_style || '',
          phone: barberData.phone || null,
          email: barberData.email || null,
          status: barberData.status || 'active',
        }])
        .select();
      if (error) handleError(error, 'createBarber');
      return data?.[0];
    } catch (err) {
      handleError(err, 'createBarber');
    }
  },

  async updateBarber(id, updates) {
    try {
      if (!id) throw new Error('Barber ID es requerido');
      const { data, error } = await supabase
        .from('barbers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();
      if (error) handleError(error, 'updateBarber');
      return data?.[0];
    } catch (err) {
      handleError(err, 'updateBarber');
    }
  },

  async updateBarberStatus(id, status) {
    if (!['active', 'inactive', 'on-leave'].includes(status)) throw new Error('Estado inválido');
    return this.updateBarber(id, { status });
  },

  async deleteBarber(id) {
    try {
      if (!id) throw new Error('Barber ID es requerido');
      const { error } = await supabase.from('barbers').delete().eq('id', id);
      if (error) {
        if (error.code === '23503') throw new Error('No se puede eliminar: tiene citas asociadas. Desactívalo en su lugar.');
        handleError(error, 'deleteBarber');
      }
      return true;
    } catch (err) {
      handleError(err, 'deleteBarber');
    }
  },

  // Servicios asignados a un trabajador
  async getBarberServiceIds(barberId) {
    try {
      if (!barberId) throw new Error('Barber ID es requerido');
      const { data, error } = await supabase.from('barber_services').select('service_id').eq('barber_id', barberId);
      if (error) handleError(error, 'getBarberServiceIds');
      return (data || []).map(r => r.service_id);
    } catch (err) {
      handleError(err, 'getBarberServiceIds');
    }
  },

  // Reemplaza el set completo de servicios que ofrece un trabajador
  async setBarberServices(barberId, serviceIds) {
    try {
      if (!barberId) throw new Error('Barber ID es requerido');
      const { error: delError } = await supabase.from('barber_services').delete().eq('barber_id', barberId);
      if (delError) handleError(delError, 'setBarberServices (delete)');

      if (serviceIds.length > 0) {
        const rows = serviceIds.map(service_id => ({ barber_id: barberId, service_id }));
        const { error: insError } = await supabase.from('barber_services').insert(rows);
        if (insError) handleError(insError, 'setBarberServices (insert)');
      }
      return true;
    } catch (err) {
      handleError(err, 'setBarberServices');
    }
  }
};

export default barbersService;
