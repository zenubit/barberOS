import { supabase } from './supabaseClient';

const handleError = (error, context) => {
  const errorMessage = error?.message || 'Error desconocido';
  console.error(`[AppointmentsService - ${context}]:`, errorMessage);
  throw new Error(`${context}: ${errorMessage}`);
};

export const appointmentsService = {
  async getAllAppointments(filters = {}) {
    try {
      let query = supabase
        .from('appointments')
        .select(`*, barbers:barber_id(name, role), services:service_id(name, price, duration_minutes)`)
        .order('appointment_date', { ascending: false });

      if (filters.date) query = query.eq('appointment_date', filters.date);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.barberId) query = query.eq('barber_id', filters.barberId);

      const { data, error } = await query;
      if (error) handleError(error, 'getAllAppointments');
      return data || [];
    } catch (err) {
      handleError(err, 'getAllAppointments');
    }
  },

  async getUserAppointments(userId) {
    try {
      if (!userId) throw new Error('User ID es requerido');
      const { data, error } = await supabase
        .from('appointments')
        .select(`*, barbers:barber_id(name, role), services:service_id(name, price, duration_minutes)`)
        .eq('user_id', userId)
        .order('appointment_date', { ascending: false });
      if (error) handleError(error, 'getUserAppointments');
      return data || [];
    } catch (err) {
      handleError(err, 'getUserAppointments');
    }
  },

  // Usa la función SQL get_available_slots (tiene en cuenta duración, capacidad,
  // horario del trabajador, bloqueos y franjas reservadas para clientes frecuentes)
  async getAvailableSlots(barberId, serviceId, date, clientPhone = null) {
    try {
      if (!barberId || !serviceId || !date) throw new Error('barberId, serviceId y date son requeridos');
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_barber_id: barberId,
        p_service_id: serviceId,
        p_date: date,
        p_client_phone: clientPhone,
      });
      if (error) handleError(error, 'getAvailableSlots');
      return (data || []).map(s => ({ time: s.slot_time?.slice(0, 5), available: s.is_available }));
    } catch (err) {
      handleError(err, 'getAvailableSlots');
    }
  },

  async createAppointment(appointment) {
    try {
      if (!appointment.client_name || !appointment.client_phone || !appointment.appointment_date || !appointment.appointment_time) {
        throw new Error('Campos requeridos faltantes');
      }
      const { data, error } = await supabase
        .from('appointments')
        .insert([{ ...appointment, status: appointment.status || 'pending' }])
        .select(`*, barbers:barber_id(name, role), services:service_id(name, price, duration_minutes)`);
      if (error) handleError(error, 'createAppointment');
      return data?.[0];
    } catch (err) {
      handleError(err, 'createAppointment');
    }
  },

  async updateAppointment(id, updates) {
    try {
      if (!id) throw new Error('ID de cita es requerido');
      const { data, error } = await supabase
        .from('appointments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`*, barbers:barber_id(name, role), services:service_id(name, price, duration_minutes)`);
      if (error) handleError(error, 'updateAppointment');
      return data?.[0];
    } catch (err) {
      handleError(err, 'updateAppointment');
    }
  },

  async cancelAppointment(id) {
    return this.updateAppointment(id, { status: 'cancelled' });
  },

  async deleteAppointment(id) {
    try {
      if (!id) throw new Error('ID de cita es requerido');
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) handleError(error, 'deleteAppointment');
      return true;
    } catch (err) {
      handleError(err, 'deleteAppointment');
    }
  }
};

export default appointmentsService;
