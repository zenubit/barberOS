import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
        <div className="max-w-sm text-center">
          <h1 className="font-display font-bold text-2xl mb-3">Algo salió mal</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--ink-muted)' }}>
            Ocurrió un error inesperado. Intenta recargar la página.
          </p>
          <button onClick={() => window.location.reload()} className="btn-teal">Recargar</button>
        </div>
      </div>
    );
  }
}
