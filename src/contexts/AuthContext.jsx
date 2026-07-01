import React, { createContext, useContext } from 'react';
import useUser from '../hooks/useUser';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: false,
  error: null,
  isLoggedIn: false,
  isAdmin: false,
  userStatus: null,
  updateProfile: () => Promise.reject('Not implemented'),
  signOut: () => Promise.reject('Not implemented'),
  signIn: () => Promise.reject('Not implemented'),
  signUp: () => Promise.reject('Not implemented'),
  resetPassword: () => Promise.reject('Not implemented'),
  updatePassword: () => Promise.reject('Not implemented'),
  clearError: () => {},
});

export function AuthProvider({ children }) {
  const auth = useUser();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  return context;
}

export default AuthContext;
