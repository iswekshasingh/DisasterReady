import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { leaderboardApi } from '../utils/api';
import { Trophy, RefreshCw, AlertTriangle, Crown, Medal, Award, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../components/GlassCard';

export const LeaderboardPage = () => {
  const { user } = useAuth();

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchLeaderboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await leaderboardApi.getLeaderboard();
      if (res.success && Array.isArray(res.leaderboard)) {
        setLeaderboard(res.leaderboard);
      } else {
        setLeaderboard([]);
      }
    } catch (err) {
      console.error('Leaderboard error:', err);
      setError('Failed to fetch the live leaderboard from the database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const currentUserId = user?.id || user?.userId;

  return (
    <div className="container leaderboard-page" style={{ maxWidth: '840px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-warning)'
            }}>
              <Trophy size={22} />
            </div>
            <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#FFF' }}>
              Simulation Leaderboard
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Live PostgreSQL rankings updated when simulations are completed in Unity.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => fetchLeaderboard(true)}
            className="btn btn-secondary btn-sm"
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Updating...' : 'Refresh Standings'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-danger-bg)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#F87171',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.88rem'
        }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Leaderboard Table Card */}
      <GlassCard className="card leaderboard-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <div className="spinner" style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 1rem auto' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading leaderboard records...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
            <Trophy size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
            <p>No leaderboard records found in database.</p>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                  <th>Username</th>
                  <th>Level</th>
                  <th style={{ textAlign: 'right' }}>Total Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => {
                  const isMe = currentUserId && (entry.id === currentUserId || entry.username === user?.username);

                  return (
                    <tr key={entry.id} className={isMe ? 'table-row-highlight' : ''}>
                      <td style={{ textAlign: 'center' }}>
                        {entry.rank === 1 ? (
                          <Crown size={20} color="#FBBF24" style={{ margin: '0 auto' }} />
                        ) : entry.rank === 2 ? (
                          <Medal size={20} color="#CBD5E1" style={{ margin: '0 auto' }} />
                        ) : entry.rank === 3 ? (
                          <Award size={20} color="#D97706" style={{ margin: '0 auto' }} />
                        ) : (
                          <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            #{entry.rank}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '50%',
                            backgroundColor: isMe ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.08)',
                            color: '#FFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem'
                          }}>
                            {(entry.fullName || entry.username || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{
                              fontWeight: 700,
                              color: isMe ? 'var(--accent-primary)' : '#FFF',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.45rem'
                            }}>
                              <span>{entry.username}</span>
                              {isMe && (
                                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                                  YOU
                                </span>
                              )}
                            </div>
                            {entry.fullName && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {entry.fullName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-secondary)' }}>
                          Level {entry.level || 1}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF' }}>
                          {entry.totalPoints} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>pts</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
