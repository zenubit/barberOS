import { supabase } from './supabaseClient';

const handleError = (error, context) => {
  const errorMessage = error?.message || 'Error desconocido';
  console.error(`[ScheduleService - ${context}]:`, errorMessage);
  throw new Error(`${context}: ${errorMessage}`);
};

export const scheduleService = {
  // Horario semanal (barber_schedules)
  async getBarberSchedule(barberId) {
    try {
      if (!barberId) throw new Error('Barber ID es requerido');
      const { data, error } = await supabase
        .from('barber_schedules')
        .select('*')
        .eq('barber_id', barberId)
        .order('day_of_week', { ascending: true });
      if (error) handleError(error, 'getBarberSchedule');
      return data || [];
    } catch (err) {
      handleError(err, 'getBarberSchedule');
    }
  },

  async upsertScheduleDay(barberId, dayOfWeek, { open_time, close_time, is_active }) {
    try {
      const { data, error } = await supabase
        .from('barber_schedules')
        .upsert(
          [{ barber_id: barberId, day_of_week: dayOfWeek, open_time, close_time, is_active }],
          { onConflict: 'barber_id,day_of_week' }
        )
        .select();
      if (error) handleError(error, 'upsertScheduleDay');
      return data?.[0];
    } catch (err) {
      handleError(err, 'upsertScheduleDay');
    }
  },

  // Bloqueos (schedule_blocks): almuerzo, día libre, vacaciones, custom
  async getBlocks(barberId) {
    try {
      let query = supabase.from('schedule_blocks').select('*').order('start_date', { ascending: false });
      if (barberId) query = query.eq('barber_id', barberId);
      const { data, error } = await query;
      if (error) handleError(error, 'getBlocks');
      return data || [];
    } catch (err) {
      handleError(err, 'getBlocks');
    }
  },

  async createBlock(block) {
    try {
      if (!block.barber_id || !block.start_date || !block.end_date) throw new Error('Campos requeridos faltantes');
      const { data, error } = await supabase.from('schedule_blocks').insert([block]).select();
      if (error) handleError(error, 'createBlock');
      return data?.[0];
    } catch (err) {
      handleError(err, 'createBlock');
    }
  },

  async updateBlock(id, updates) {
    try {
      if (!id) throw new Error('Block ID es requerido');
      const { data, error } = await supabase
        .from('schedule_blocks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();
      if (error) handleError(error, 'updateBlock');
      return data?.[0];
    } catch (err) {
      handleError(err, 'updateBlock');
    }
  },

  async deleteBlock(id) {
    try {
      if (!id) throw new Error('Block ID es requerido');
      const { error } = await supabase.from('schedule_blocks').delete().eq('id', id);
      if (error) handleError(error, 'deleteBlock');
      return true;
    } catch (err) {
      handleError(err, 'deleteBlock');
    }
  },

  // Franjas reservadas para clientes frecuentes (reserved_slots)
  async getReservedSlots(barberId) {
    try {
      let query = supabase.from('reserved_slots').select('*').order('slot_date', { ascending: true });
      if (barberId) query = query.eq('barber_id', barberId);
      const { data, error } = await query;
      if (error) handleError(error, 'getReservedSlots');
      return data || [];
    } catch (err) {
      handleError(err, 'getReservedSlots');
    }
  },

  async createReservedSlot(slot) {
    try {
      if (!slot.barber_id || !slot.slot_date || !slot.start_time || !slot.end_time) {
        throw new Error('Campos requeridos faltantes');
      }
      const { data, error } = await supabase.from('reserved_slots').insert([slot]).select();
      if (error) handleError(error, 'createReservedSlot');
      return data?.[0];
    } catch (err) {
      handleError(err, 'createReservedSlot');
    }
  },

  async cancelReservedSlot(id) {
    try {
      if (!id) throw new Error('ID es requerido');
      const { data, error } = await supabase
        .from('reserved_slots')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();
      if (error) handleError(error, 'cancelReservedSlot');
      return data?.[0];
    } catch (err) {
      handleError(err, 'cancelReservedSlot');
    }
  }
};

export default scheduleService;
