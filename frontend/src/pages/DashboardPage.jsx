import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi, leaderboardApi } from '../utils/api';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import {
  Trophy,
  Zap,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Award,
  Gamepad2,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalPoints: 0,
    level: 1,
    rank: null,
  });

  const loadUserData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      // Read this user's persisted score directly; the leaderboard only includes the top ten.
      const [profileResult, leaderboardResult] = await Promise.allSettled([
        authApi.getMe(),
        leaderboardApi.getLeaderboard(),
      ]);
      const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
      const leaderboard = leaderboardResult.status === 'fulfilled' ? leaderboardResult.value : null;
      const currentUserId = user?.id || user?.userId;
      const myEntry = Array.isArray(leaderboard?.leaderboard) ? leaderboard.leaderboard.find(
          (item) => item.id === currentUserId || item.username === user?.username
        ) : null;
      if (profile?.success || leaderboard?.success) {
        setStats({
          totalPoints: profile?.user?.totalPoints ?? myEntry?.totalPoints ?? 0,
          level: profile?.user?.level ?? myEntry?.level ?? 1,
          rank: myEntry?.rank ?? null,
        });
      } else {
        throw profileResult.reason || leaderboardResult.reason || new Error('Could not load trainee statistics.');
      }
    } catch (err) {
      console.warn('Could not load user leaderboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserData();

    // Auto-refresh stats when Unity reports a completed attempt
    const handleAttemptDone = () => {
      console.log('[Dashboard] Unity attempt detected — refreshing stats from PostgreSQL');
      loadUserData();
    };
    window.addEventListener('unity:attemptSubmitted', handleAttemptDone);
    return () => window.removeEventListener('unity:attemptSubmitted', handleAttemptDone);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.fullName || user?.username || 'Trainee';

  return (
    <div className="container dashboard-page" style={{ maxWidth: '720px', paddingTop: '2rem', paddingBottom: '3rem' }}>
      <GlassCard className="card dashboard-panel" style={{ padding: '2.5rem' }}>
        {/* Welcome Section */}
        <div className="dashboard-welcome" style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingBottom: '1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '2rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFF' }}>
                Welcome, {displayName}!
              </h1>
              <span className="badge badge-success">
                <ShieldCheck size={12} /> Active
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Logged in as <strong style={{ color: 'var(--accent-primary)' }}>@{user?.username}</strong> ({user?.email})
            </p>
          </div>

          <button
            onClick={() => loadUserData(true)}
            className="btn btn-secondary btn-sm"
            disabled={refreshing}
            title="Refresh database records"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>

        {/* User Stats Grid */}
        <div className="stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}>
          {/* Total Points */}
          <div className="bento-stat" style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-primary-soft)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem auto'
            }}>
              <Zap size={20} />
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
              Total Points
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FFF' }}>
              {loading ? '...' : `${stats.totalPoints} pts`}
            </div>
          </div>

          {/* Current Level */}
          <div className="bento-stat" style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--color-info)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem auto'
            }}>
              <Award size={20} />
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
              Current Level
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FFF' }}>
              {loading ? '...' : `Level ${stats.level}`}
            </div>
          </div>

          {/* Leaderboard Standing */}
          <div className="bento-stat" style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--color-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem auto'
            }}>
              <Trophy size={20} />
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
              Leaderboard Rank
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FFF' }}>
              {loading ? '...' : stats.rank ? `#${stats.rank}` : 'Unranked'}
            </div>
          </div>
        </div>

        {/* Unity Simulation Callout */}
        <div className="dashboard-hero" style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, rgba(109, 91, 255, 0.17) 0%, rgba(22, 32, 54, 0.9) 100%)',
          border: '1px solid rgba(109, 91, 255, 0.32)',
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-success">READY TO PLAY</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF' }}>
                Earthquake Survival Simulation
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '440px' }}>
              Experience the 2D seismic drill in your browser. Respond to 3 critical emergency situations and earn up to 100 points!
            </p>
          </div>

          <GlassButton as={Link} to="/play/earthquake" variant="primary" className="btn btn-primary btn-lg">
            <Gamepad2 size={18} />
            <span>Play Now</span>
          </GlassButton>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <Link to="/leaderboard" className="btn btn-secondary btn-lg">
            <Trophy size={18} />
            <span>View Leaderboard</span>
          </Link>

          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-lg"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
