import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="container" style={{
      minHeight: '65vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '3rem 1.5rem'
    }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Brand Icon */}
        <div style={{
          width: '4rem',
          height: '4rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--accent-orange-subtle)',
          border: '1px solid rgba(255, 107, 53, 0.4)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.75rem',
          boxShadow: '0 0 25px rgba(255, 107, 53, 0.25)'
        }}>
          <ShieldAlert size={36} color="var(--accent-orange)" />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          marginBottom: '1.25rem',
          color: '#FFFFFF'
        }}>
          Disaster<span style={{ color: 'var(--accent-orange)' }}>Ready</span>
        </h1>

        {/* Short Project Introduction */}
        <p style={{
          fontSize: 'clamp(1.05rem, 2vw, 1.2rem)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: '2.5rem'
        }}>
          A gamified disaster preparedness and emergency response training portal. Create an account to track your survival simulation performance and compete on the live leaderboard.
        </p>

        {/* Action Buttons */}
        {isAuthenticated ? (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/dashboard" className="btn btn-primary btn-lg">
              <span>Go to Dashboard</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/leaderboard" className="btn btn-secondary btn-lg">
              <span>View Leaderboard</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn btn-primary btn-lg">
              <UserPlus size={18} />
              <span>Create Account</span>
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              <LogIn size={18} />
              <span>Sign In</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
