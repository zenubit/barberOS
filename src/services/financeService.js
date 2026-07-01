import { supabase } from './supabaseClient';
import { todayISO } from '../lib/date';

const handleError = (error, context) => {
  const errorMessage = error?.message || 'Error desconocido';
  console.error(`[FinanceService - ${context}]:`, errorMessage);
  throw new Error(`${context}: ${errorMessage}`);
};

export const financeService = {
  async getSales({ from, to, barberId } = {}) {
    try {
      let query = supabase.from('daily_sales').select('*').order('date', { ascending: false });
      if (from) query = query.gte('date', from);
      if (to) query = query.lte('date', to);
      if (barberId) query = query.eq('barber_id', barberId);
      const { data, error } = await query;
      if (error) handleError(error, 'getSales');
      return data || [];
    } catch (err) {
      handleError(err, 'getSales');
    }
  },

  async createSale(sale) {
    try {
      if (!sale.price_per_unit) throw new Error('El precio unitario es requerido');
      const { data, error } = await supabase
        .from('daily_sales')
        .insert([{
          date: sale.date || todayISO(),
          quantity: sale.quantity || 1,
          price_per_unit: sale.price_per_unit,
          description: sale.description || '',
          barber_id: sale.barber_id || null,
        }])
        .select();
      if (error) handleError(error, 'createSale');
      return data?.[0];
    } catch (err) {
      handleError(err, 'createSale');
    }
  },

  async deleteSale(id) {
    try {
      if (!id) throw new Error('Sale ID es requerido');
      const { error } = await supabase.from('daily_sales').delete().eq('id', id);
      if (error) handleError(error, 'deleteSale');
      return true;
    } catch (err) {
      handleError(err, 'deleteSale');
    }
  },

  async getExpenses({ from, to, barberId } = {}) {
    try {
      let query = supabase.from('expenses').select('*').order('date', { ascending: false });
      if (from) query = query.gte('date', from);
      if (to) query = query.lte('date', to);
      if (barberId) query = query.eq('barber_id', barberId);
      const { data, error } = await query;
      if (error) handleError(error, 'getExpenses');
      return data || [];
    } catch (err) {
      handleError(err, 'getExpenses');
    }
  },

  async createExpense(expense) {
    try {
      if (!expense.description || !expense.amount) throw new Error('Descripción y monto son requeridos');
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          date: expense.date || todayISO(),
          category: expense.category || 'Otro',
          description: expense.description,
          amount: expense.amount,
          barber_id: expense.barber_id || null,
        }])
        .select();
      if (error) handleError(error, 'createExpense');
      return data?.[0];
    } catch (err) {
      handleError(err, 'createExpense');
    }
  },

  async deleteExpense(id) {
    try {
      if (!id) throw new Error('Expense ID es requerido');
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) handleError(error, 'deleteExpense');
      return true;
    } catch (err) {
      handleError(err, 'deleteExpense');
    }
  },
};

export default financeService;
