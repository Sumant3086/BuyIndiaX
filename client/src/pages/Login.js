import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import SEOMeta from '../components/SEOMeta';
import './Auth.css';

const Login = () => {
  useDocumentTitle('Login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user } = await login(email, password);
      showToast(`Welcome back, ${user.name?.split(' ')[0]}!`, 'success');
      navigate(user.role === 'admin' ? '/admin' : redirectTo, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Check your credentials.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOMeta title="Login" description="Login to your BuyIndiaX account to continue shopping." />
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <h1>Welcome back</h1>
              <p>Login to your BuyIndiaX account</p>
            </div>

            {error && (
              <div className="auth-alert auth-alert-error" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  aria-required="true"
                />
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="password">Password</label>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => showToast('Password reset coming soon', 'info')}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="input-with-toggle">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    aria-required="true"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <><span className="btn-spinner" aria-hidden="true" /> Logging in...</>
                ) : 'Login'}
              </button>
            </form>

            <p className="auth-switch">
              Don't have an account? <Link to="/register">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
