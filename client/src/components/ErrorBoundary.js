import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Error Boundary — catches any React rendering error and shows a recovery UI
 * instead of a blank/crashed screen.
 *
 * Usage: wrap any subtree that might throw.
 * App-level: wrap <Routes> for page-level crashes.
 * Component-level: wrap individual widgets.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production, send to an error tracker (Sentry, etc.)
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught:', error, info);
    }
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    const { fallback } = this.props;
    if (fallback) return fallback;

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '50vh', padding: '2rem',
        textAlign: 'center', gap: '1rem'
      }}>
        <span style={{ fontSize: '3rem' }}>⚠️</span>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>
          Something went wrong
        </h2>
        <p style={{ color: '#64748b', maxWidth: 360 }}>
          {process.env.NODE_ENV === 'development'
            ? this.state.error?.message
            : 'An unexpected error occurred. Please refresh or try again.'}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={this.reset}
            style={{
              padding: '0.6rem 1.2rem', background: '#2563eb', color: 'white',
              border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600
            }}
          >
            Try Again
          </button>
          <Link
            to="/"
            style={{
              padding: '0.6rem 1.2rem', background: '#f1f5f9', color: '#374151',
              borderRadius: 8, fontWeight: 600, textDecoration: 'none'
            }}
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
