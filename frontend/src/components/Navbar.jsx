import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlassButton } from './GlassButton';
import {
  ShieldAlert,
  LayoutDashboard,
  Trophy,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  Gamepad2
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(16px)',
      backgroundColor: 'rgba(10, 15, 29, 0.85)',
      borderBottom: '1px solid var(--border-subtle)'
    }} className="navbar-shell">
      <div className="container" style={{
        height: '4.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2.4rem',
            height: '2.4rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--accent-primary-soft)',
            border: '1px solid rgba(139, 124, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(109, 91, 255, 0.22)'
          }} className="navbar-logo">
            <ShieldAlert size={22} color="var(--accent-primary)" />
          </div>
          <span className="brand-word" style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
            Disaster<span className="brand-accent" style={{ color: 'var(--accent-primary)' }}>Ready</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav style={{ display: 'none', alignItems: 'center', gap: '0.5rem' }} className="desktop-nav">
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <LayoutDashboard size={17} />
                Dashboard
              </NavLink>
              <NavLink to="/play/earthquake" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <Gamepad2 size={17} />
                Play Simulation
              </NavLink>
              <NavLink to="/leaderboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <Trophy size={17} />
                Leaderboard
              </NavLink>
            </>
          ) : (
            <NavLink to="/leaderboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Trophy size={17} />
              Leaderboard
            </NavLink>
          )}
        </nav>

        {/* Desktop Auth Actions */}
        <div style={{ display: 'none', alignItems: 'center', gap: '0.75rem' }} className="desktop-actions">
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to="/dashboard" className="navbar-user" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{
                  width: '1.6rem',
                  height: '1.6rem',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}>
                  {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user?.username}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title="Sign out"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <GlassButton as={Link} to="/login" variant="secondary" className="btn btn-secondary btn-sm">
                <LogIn size={15} />
                <span>Sign In</span>
              </GlassButton>
              <GlassButton as={Link} to="/signup" variant="primary" className="btn btn-primary btn-sm">
                <UserPlus size={15} />
                <span>Sign Up</span>
              </GlassButton>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            padding: '0.5rem',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }}
          className="mobile-toggle"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-menu" style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {isAuthenticated ? (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '0.25rem'
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.username}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                </div>
              </div>
              <NavLink to="/dashboard" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <LayoutDashboard size={18} /> Dashboard
              </NavLink>
              <NavLink to="/play/earthquake" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <Gamepad2 size={18} /> Play Simulation
              </NavLink>
              <NavLink to="/leaderboard" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <Trophy size={18} /> Leaderboard
              </NavLink>
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '0.5rem', justifyContent: 'flex-start' }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/leaderboard" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <Trophy size={18} /> Leaderboard
              </NavLink>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Sign In
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{ flex: 1 }}>
                  Sign Up
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @media (min-width: 980px) {
          .desktop-nav { display: flex !important; }
          .desktop-actions { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
      `}</style>
    </header>
  );
};
