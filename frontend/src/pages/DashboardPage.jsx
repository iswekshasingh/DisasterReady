import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { leaderboardApi } from '../utils/api';
import {
  User,
  Trophy,
  Zap,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Award
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
      // Query leaderboard to fetch the latest PostgreSQL totalPoints & level
      const res = await leaderboardApi.getLeaderboard();
      if (res.success && Array.isArray(res.leaderboard)) {
        const currentUserId = user?.id || user?.userId;
        const myEntry = res.leaderboard.find(
          (item) => item.id === currentUserId || item.username === user?.username
        );

        if (myEntry) {
          setStats({
            totalPoints: myEntry.totalPoints || 0,
            level: myEntry.level || 1,
            rank: myEntry.rank || null,
          });
        } else {
          setStats({
            totalPoints: 0,
            level: 1,
            rank: null,
          });
        }
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
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.fullName || user?.username || 'Trainee';

  return (
    <div className="container" style={{ maxWidth: '720px', paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        {/* Welcome Section */}
        <div style={{
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
              Logged in as <strong style={{ color: 'var(--accent-orange)' }}>@{user?.username}</strong> ({user?.email})
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}>
          {/* Total Points */}
          <div style={{
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
              backgroundColor: 'var(--accent-orange-subtle)',
              color: 'var(--accent-orange)',
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
          <div style={{
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
          <div style={{
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
        <div style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.15) 0%, rgba(22, 32, 54, 0.9) 100%)',
          border: '1px solid rgba(255, 107, 53, 0.35)',
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

          <Link to="/play/earthquake" className="btn btn-primary btn-lg" style={{ boxShadow: '0 4px 20px rgba(255, 107, 53, 0.4)' }}>
            <Zap size={18} />
            <span>Play Now</span>
          </Link>
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
      </div>
    </div>
  );
};
