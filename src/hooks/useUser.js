import { useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export function useUser() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStaff, setIsStaff] = useState(false);

  const fetchProfile = useCallback(async (userId) => {
    try {
      const userProfile = await authService.getProfile(userId);
      setProfile(userProfile);
      setIsStaff(['barber', 'admin', 'super_admin'].includes(userProfile?.role));
      return userProfile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
      setIsStaff(false);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeUser = async () => {
      try {
        setLoading(true);
        const currentUser = await authService.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
          if (currentUser) await fetchProfile(currentUser.id);
          else { setProfile(null); setIsStaff(false); }
        }
      } catch {
        if (isMounted) { setUser(null); setProfile(null); setIsStaff(false); }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeUser();

    const subscription = authService.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setIsStaff(false);
      }
    });

    return () => { isMounted = false; subscription?.unsubscribe(); };
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates) => {
    if (!user) throw new Error('No hay usuario autenticado');
    try {
      setLoading(true);
      setError(null);
      const updated = await authService.updateProfile(user.id, updates);
      setProfile(updated);
      if (updates.role) setIsStaff(['barber', 'admin', 'super_admin'].includes(updated?.role));
      return updated;
    } catch (err) {
      setError(err.message || 'Error al actualizar perfil');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await authService.signOut();
      setUser(null);
      setProfile(null);
      setIsStaff(false);
    } catch (err) {
      setError(err.message || 'Error al cerrar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.signIn(email, password);
      if (data?.user) {
        setUser(data.user);
        await fetchProfile(data.user.id);
      }
      return data;
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  const signUp = useCallback(async (formData) => {
    try {
      setLoading(true);
      setError(null);
      return await authService.signUp(formData);
    } catch (err) {
      setError(err.message || 'Error al registrarse');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    try {
      setLoading(true);
      setError(null);
      await authService.resetPassword(email);
      return true;
    } catch (err) {
      setError(err.message || 'Error al recuperar contraseña');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePassword = useCallback(async (newPassword) => {
    try {
      setLoading(true);
      setError(null);
      await authService.updatePassword(newPassword);
      return true;
    } catch (err) {
      setError(err.message || 'Error al actualizar contraseña');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    user, profile, loading, error,
    isLoggedIn: !!user,
    isStaff,
    userStatus: profile?.status || null,
    updateProfile, signOut, signIn, signUp, resetPassword, updatePassword, clearError,
  };
}

export default useUser;
