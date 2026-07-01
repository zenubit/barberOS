import { supabase } from './supabaseClient';

const handleError = (error, context) => {
  const errorMessage = error?.message || 'Error desconocido';
  console.error(`[AuthService - ${context}]:`, errorMessage);
  throw new Error(errorMessage);
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const authService = {
  async signUp({ email, password, first_name, second_name, first_lastname, second_lastname, phone, identification, identification_type }) {
    try {
      if (!email || !password) throw new Error('Email y contraseña son requeridos');
      if (!validateEmail(email)) throw new Error('Email inválido');
      if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
      if (!first_name || !first_lastname) throw new Error('Nombre y apellido son requeridos');

      if (phone) {
        const { data: exists, error: phoneError } = await supabase.rpc('phone_exists', { p_phone: phone });
        if (phoneError) handleError(phoneError, 'signUp (phone check)');
        if (exists) throw new Error('Este número de teléfono ya está registrado por otro usuario');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name,
            second_name: second_name || null,
            first_lastname,
            second_lastname: second_lastname || null,
            phone: phone || null,
            identification: identification || null,
            identification_type: identification_type || 'CC',
          }
        }
      });

      if (error) handleError(error, 'signUp');
      return data;
    } catch (err) {
      handleError(err, 'signUp');
    }
  },

  async signIn(identifier, password) {
    try {
      if (!identifier || !password) throw new Error('Email/Teléfono y contraseña son requeridos');

      let emailToLogin = identifier.trim();

      if (!emailToLogin.includes('@')) {
        const searchClean = identifier.replace(/\D/g, '');
        if (searchClean.length < 7) throw new Error('Ingresa un correo o número de teléfono válido.');

        const { data: matchedEmail, error: phoneError } = await supabase.rpc('find_email_by_phone', { p_phone: identifier });
        if (phoneError) throw new Error('No se pudo verificar el número de teléfono.');
        if (!matchedEmail) throw new Error('No se encontró una cuenta con ese número de teléfono.');
        emailToLogin = matchedEmail;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email: emailToLogin, password });
      if (error) handleError(error, 'signIn');

      if (data?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', data.user.id)
          .single();

        if (profile?.status === 'blocked') {
          await supabase.auth.signOut();
          throw new Error('Tu cuenta ha sido suspendida. Contacta al administrador.');
        }
        if (profile?.status === 'suspended') {
          await supabase.auth.signOut();
          throw new Error('Tu cuenta está temporalmente suspendida. Contacta al administrador.');
        }
      }

      return data;
    } catch (err) {
      handleError(err, 'signIn');
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) handleError(error, 'signOut');
    } catch (err) {
      handleError(err, 'signOut');
    }
  },

  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user || null;
    } catch {
      return null;
    }
  },

  async resetPassword(email) {
    try {
      if (!email || !validateEmail(email)) throw new Error('Email inválido');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) handleError(error, 'resetPassword');
      return true;
    } catch (err) {
      handleError(err, 'resetPassword');
    }
  },

  async updatePassword(newPassword) {
    try {
      if (!newPassword || newPassword.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) handleError(error, 'updatePassword');
      return true;
    } catch (err) {
      handleError(err, 'updatePassword');
    }
  },

  async getProfile(userId) {
    try {
      if (!userId) throw new Error('User ID es requerido');
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) handleError(error, 'getProfile');
      return data;
    } catch (err) {
      handleError(err, 'getProfile');
    }
  },

  async updateProfile(userId, updates) {
    try {
      if (!userId) throw new Error('User ID es requerido');
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      if (error) handleError(error, 'updateProfile');
      return data;
    } catch (err) {
      handleError(err, 'updateProfile');
    }
  },

  onAuthStateChange(callback) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => callback(event, session));
    return data?.subscription;
  }
};

export default authService;
