import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Icon, Logo } from '../components/Shared';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
  const [tab, setTab] = useState('login');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, signUp, error, clearError } = useAuth();

  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    first_name: '', first_lastname: '', email: '', phone: '', password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const redirect = searchParams.get('redirect') || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setLocalError(null);
    clearError();
    try {
      await signIn(loginForm.identifier, loginForm.password);
      navigate(redirect);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setLocalError(null);
    clearError();
    try {
      await signUp(signupForm);
      setTab('login');
      setLocalError('Cuenta creada. Ya puedes iniciar sesión.');
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-5 py-20">
      <div className="flex justify-center mb-10">
        <Logo size={44} />
      </div>

      <div className="flex gap-2 mb-8 p-1 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        {['login', 'signup'].map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setLocalError(null); }}
            className="flex-1 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer"
            style={tab === t ? { background: 'var(--teal)', color: '#06120F' } : { color: 'var(--ink-muted)' }}
          >
            {t === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        ))}
      </div>

      {(localError || error) && (
        <div className="mb-6 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,.08)', color: '#ff8080', border: '1px solid rgba(239,68,68,.3)' }}>
          {localError || error}
        </div>
      )}

      {tab === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            className="input" placeholder="Correo o teléfono"
            value={loginForm.identifier}
            onChange={e => setLoginForm({ ...loginForm, identifier: e.target.value })}
          />
          <input
            className="input" type="password" placeholder="Contraseña"
            value={loginForm.password}
            onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
          />
          <button type="submit" disabled={submitting} className="btn-teal w-full flex items-center justify-center gap-2">
            {submitting ? 'Ingresando...' : <>Ingresar <Icon name="ArrowRight" size={16} /></>}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input className="input" placeholder="Nombre" value={signupForm.first_name} onChange={e => setSignupForm({ ...signupForm, first_name: e.target.value })} />
            <input className="input" placeholder="Apellido" value={signupForm.first_lastname} onChange={e => setSignupForm({ ...signupForm, first_lastname: e.target.value })} />
          </div>
          <input className="input" placeholder="Correo" type="email" value={signupForm.email} onChange={e => setSignupForm({ ...signupForm, email: e.target.value })} />
          <input className="input" placeholder="Teléfono" value={signupForm.phone} onChange={e => setSignupForm({ ...signupForm, phone: e.target.value })} />
          <input className="input" placeholder="Contraseña" type="password" value={signupForm.password} onChange={e => setSignupForm({ ...signupForm, password: e.target.value })} />
          <button type="submit" disabled={submitting} className="btn-teal w-full flex items-center justify-center gap-2">
            {submitting ? 'Creando...' : <>Crear cuenta <Icon name="ArrowRight" size={16} /></>}
          </button>
        </form>
      )}

      <Link to="/" className="block text-center mt-8 text-xs" style={{ color: 'var(--ink-faint)' }}>← Volver al inicio</Link>
    </div>
  );
}
