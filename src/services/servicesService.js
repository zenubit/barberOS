import { supabase } from './supabaseClient';

const handleError = (error, context) => {
  const errorMessage = error?.message || 'Error desconocido';
  console.error(`[ServicesService - ${context}]:`, errorMessage);
  throw new Error(`${context}: ${errorMessage}`);
};

export const servicesService = {
  async getAllServices() {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('available', true)
        .order('display_order', { ascending: true });
      if (error) handleError(error, 'getAllServices');
      return data || [];
    } catch (err) {
      handleError(err, 'getAllServices');
    }
  },

  async getAllServicesAdmin() {
    try {
      const { data, error } = await supabase.from('services').select('*').order('display_order', { ascending: true });
      if (error) handleError(error, 'getAllServicesAdmin');
      return data || [];
    } catch (err) {
      handleError(err, 'getAllServicesAdmin');
    }
  },

  async getServiceById(id) {
    try {
      if (!id) throw new Error('Service ID es requerido');
      const { data, error } = await supabase.from('services').select('*').eq('id', id).single();
      if (error) handleError(error, 'getServiceById');
      return data;
    } catch (err) {
      handleError(err, 'getServiceById');
    }
  },

  async createService(serviceData) {
    try {
      if (!serviceData.name || !serviceData.price || serviceData.duration_minutes === undefined) {
        throw new Error('Campos requeridos faltantes (name, price, duration_minutes)');
      }
      const { data, error } = await supabase
        .from('services')
        .insert([{
          name: serviceData.name,
          subtitle: serviceData.subtitle || '',
          description: serviceData.description || '',
          price: serviceData.price,
          duration_minutes: serviceData.duration_minutes,
          max_capacity: serviceData.max_capacity || 1,
          category: serviceData.category || 'otro',
          available: serviceData.available !== false,
          display_order: serviceData.display_order || 999,
        }])
        .select();
      if (error) handleError(error, 'createService');
      return data?.[0];
    } catch (err) {
      handleError(err, 'createService');
    }
  },

  async updateService(id, updates) {
    try {
      if (!id) throw new Error('Service ID es requerido');
      const { data, error } = await supabase
        .from('services')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();
      if (error) handleError(error, 'updateService');
      return data?.[0];
    } catch (err) {
      handleError(err, 'updateService');
    }
  },

  async updateServiceAvailability(id, available) {
    return this.updateService(id, { available });
  },

  async deleteService(id) {
    try {
      if (!id) throw new Error('Service ID es requerido');
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) {
        if (error.code === '23503') throw new Error('No se puede eliminar: tiene citas asociadas. Desactívalo en su lugar.');
        handleError(error, 'deleteService');
      }
      return true;
    } catch (err) {
      handleError(err, 'deleteService');
    }
  }
};

export default servicesService;
