import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const NotFound = () => {
  useDocumentTitle('Page Not Found — BuyIndiaX');
  const { pathname } = useLocation();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '70vh', padding: '2rem',
      textAlign: 'center', gap: '1rem'
    }}>
      <span style={{ fontSize: '5rem', lineHeight: 1 }}>🛍️</span>
      <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#1e293b', margin: 0 }}>
        404
      </h1>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151', margin: 0 }}>
        Page not found
      </h2>
      <p style={{ color: '#64748b', maxWidth: 400, margin: 0 }}>
        The page <code style={{ background: '#f1f5f9', padding: '0.1em 0.4em', borderRadius: 4, fontSize: '0.9em' }}>{pathname}</code> doesn't exist.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          to="/"
          style={{
            padding: '0.7rem 1.5rem', background: '#2563eb', color: 'white',
            borderRadius: 8, fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem'
          }}
        >
          Go Home
        </Link>
        <Link
          to="/products"
          style={{
            padding: '0.7rem 1.5rem', background: '#f1f5f9', color: '#374151',
            borderRadius: 8, fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem'
          }}
        >
          Browse Products
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
