import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Gamepad2
} from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Info message passed from signup page redirect
  const incomingMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);

    try {
      await login(email.trim().toLowerCase(), password);
      // Redirect to the originally attempted page or dashboard
      const origin = location.state?.from?.pathname || '/dashboard';
      navigate(origin, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{
      maxWidth: '460px',
      paddingTop: '2.5rem',
      paddingBottom: '3.5rem'
    }}>
      <div className="card" style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '3.25rem',
            height: '3.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--accent-orange-subtle)',
            border: '1px solid rgba(255, 107, 53, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: '0 0 20px rgba(255, 107, 53, 0.2)'
          }}>
            <ShieldAlert size={28} color="var(--accent-orange)" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFF', marginBottom: '0.35rem' }}>
            Trainee Sign In
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Access your disaster response dashboard and simulation logs
          </p>
        </div>

        {/* Incoming success banner */}
        {incomingMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-success-bg)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34D399',
            fontSize: '0.88rem',
            marginBottom: '1.5rem'
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{incomingMessage}</span>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#F87171',
            fontSize: '0.88rem',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="form-input-wrapper">
              <Mail size={18} className="form-input-icon" />
              <input
                id="email"
                type="email"
                required
                placeholder="trainee@example.com"
                className="form-input has-icon"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div className="form-input-wrapper">
              <Lock size={18} className="form-input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className="form-input has-icon"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                disabled={loading}
              />
              <button
                type="button"
                className="form-input-action"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Unity account notification note */}
        <div style={{
          marginTop: '1.5rem',
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <Gamepad2 size={18} color="var(--accent-orange)" style={{ flexShrink: 0 }} />
          <span>Already registered inside the Unity game? You can log in here with the same email and password.</span>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center',
          fontSize: '0.88rem',
          color: 'var(--text-secondary)'
        }}>
          Don't have an account yet?{' '}
          <Link to="/signup" style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>
            Create one now
          </Link>
        </div>
      </div>
    </div>
  );
};

