import { supabase } from './supabaseClient';

const handleError = (error, context) => {
  const errorMessage = error?.message || 'Error desconocido';
  console.error(`[RafflesService - ${context}]:`, errorMessage);
  throw new Error(`${context}: ${errorMessage}`);
};

export const rafflesService = {
  async getRaffles() {
    try {
      const { data, error } = await supabase
        .from('monthly_raffles')
        .select('*, profiles:winner_id(first_name, first_lastname, phone)')
        .order('raffle_month', { ascending: false });
      if (error) handleError(error, 'getRaffles');
      return data || [];
    } catch (err) {
      handleError(err, 'getRaffles');
    }
  },

  // target_month: fecha del primer día del mes, ej. '2026-06-01'
  async getEligibleUsers(targetMonth) {
    try {
      if (!targetMonth) throw new Error('El mes objetivo es requerido');
      const { data, error } = await supabase.rpc('get_raffle_eligible_users', { target_month: targetMonth });
      if (error) handleError(error, 'getEligibleUsers');
      return data || [];
    } catch (err) {
      handleError(err, 'getEligibleUsers');
    }
  },

  async executeRaffle(targetMonth) {
    try {
      if (!targetMonth) throw new Error('El mes objetivo es requerido');
      const { data, error } = await supabase.rpc('execute_monthly_raffle', { target_month: targetMonth });
      if (error) handleError(error, 'executeRaffle');
      return data;
    } catch (err) {
      handleError(err, 'executeRaffle');
    }
  },

  async redeemPrize(id) {
    try {
      if (!id) throw new Error('Raffle ID es requerido');
      const { data, error } = await supabase
        .from('monthly_raffles')
        .update({ prize_redeemed: true })
        .eq('id', id)
        .select();
      if (error) handleError(error, 'redeemPrize');
      return data?.[0];
    } catch (err) {
      handleError(err, 'redeemPrize');
    }
  },
};

export default rafflesService;
