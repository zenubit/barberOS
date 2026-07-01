import { supabase } from './supabaseClient';

const handleError = (error, context) => {
  const errorMessage = error?.message || 'Error desconocido';
  console.error(`[UsersService - ${context}]:`, errorMessage);
  throw new Error(`${context}: ${errorMessage}`);
};

export const usersService = {
  async getAllProfiles() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) handleError(error, 'getAllProfiles');
      return data || [];
    } catch (err) {
      handleError(err, 'getAllProfiles');
    }
  },

  async updateRole(id, role) {
    try {
      if (!id) throw new Error('Profile ID es requerido');
      if (!['customer', 'barber', 'admin', 'super_admin'].includes(role)) throw new Error('Rol inválido');
      const { data, error } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();
      if (error) handleError(error, 'updateRole');
      return data?.[0];
    } catch (err) {
      handleError(err, 'updateRole');
    }
  },

  async updateStatus(id, status) {
    try {
      if (!id) throw new Error('Profile ID es requerido');
      if (!['active', 'blocked', 'suspended'].includes(status)) throw new Error('Estado inválido');
      const { data, error } = await supabase
        .from('profiles')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();
      if (error) handleError(error, 'updateStatus');
      return data?.[0];
    } catch (err) {
      handleError(err, 'updateStatus');
    }
  },

  // Permiso delegado: solo super_admin puede otorgarlo (impuesto también por
  // RLS vía can_manage_inventory()). Un admin normal no gestiona inventario
  // a menos que se le active este flag.
  async updateInventoryPermission(id, canManageInventory) {
    try {
      if (!id) throw new Error('Profile ID es requerido');
      const { data, error } = await supabase
        .from('profiles')
        .update({ can_manage_inventory: !!canManageInventory, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();
      if (error) handleError(error, 'updateInventoryPermission');
      return data?.[0];
    } catch (err) {
      handleError(err, 'updateInventoryPermission');
    }
  },
};

export default usersService;
