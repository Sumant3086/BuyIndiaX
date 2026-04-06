import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const TestAuth = () => {
  const { user, loading, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleClearAndReload = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleGoToAdmin = () => {
    navigate('/admin');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Authentication Test Page</h1>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>Current Auth State:</h2>
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        <p><strong>User:</strong> {user ? 'Logged In' : 'Not Logged In'}</p>
        
        {user && (
          <div style={{ marginTop: '1rem' }}>
            <h3>User Details:</h3>
            <pre style={{ background: '#fff', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(user, null, 2)}
            </pre>
            
            <div style={{ marginTop: '1rem' }}>
              <p><strong>Is Admin:</strong> {user.role === 'admin' ? '✅ YES' : '❌ NO'}</p>
              <p><strong>Role Value:</strong> "{user.role}"</p>
            </div>
          </div>
        )}
        
        <div style={{ marginTop: '1rem' }}>
          <h3>LocalStorage Token:</h3>
          <p>{localStorage.getItem('token') ? '✅ Token exists' : '❌ No token found'}</p>
          {localStorage.getItem('token') && (
            <pre style={{ background: '#fff', padding: '1rem', borderRadius: '4px', overflow: 'auto', fontSize: '0.8rem' }}>
              {localStorage.getItem('token')}
            </pre>
          )}
        </div>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#e3f2fd', borderRadius: '8px' }}>
        <h2>Admin Credentials:</h2>
        <p><strong>Email:</strong> sumant@gmail.com</p>
        <p><strong>Password:</strong> @Sumant3086</p>
        <p><strong>Name:</strong> Sumant Yadav</p>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {!user && (
          <button 
            onClick={handleGoToLogin}
            style={{ padding: '0.75rem 1.5rem', background: '#0066FF', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Go to Login
          </button>
        )}
        
        {user && user.role === 'admin' && (
          <button 
            onClick={handleGoToAdmin}
            style={{ padding: '0.75rem 1.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Go to Admin Dashboard
          </button>
        )}
        
        {user && (
          <button 
            onClick={logout}
            style={{ padding: '0.75rem 1.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Logout
          </button>
        )}
        
        <button 
          onClick={handleClearAndReload}
          style={{ padding: '0.75rem 1.5rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Clear Storage & Reload
        </button>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#fef3c7', borderRadius: '8px' }}>
        <h3>Troubleshooting Steps:</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li>If you see "Not Logged In" above, click "Go to Login" and login with admin credentials</li>
          <li>After login, you should be redirected back here or to admin dashboard</li>
          <li>Check if "Is Admin" shows ✅ YES above</li>
          <li>If you see the user but role is not "admin", the admin user wasn't created properly</li>
          <li>If token exists but user is null, there might be an issue with the /me endpoint</li>
          <li>Check browser console (F12) for any error messages</li>
          <li>If issues persist, click "Clear Storage & Reload" and try logging in again</li>
        </ol>
      </div>
    </div>
  );
};

export default TestAuth;
