import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Maximize2,
  Gamepad2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  HelpCircle,
  Trophy,
} from 'lucide-react';

// Unity WebGL build paths — files live in frontend/public/unity/earthquake/Build/
const UNITY_BUILD_BASE = '/unity/earthquake/Build/';
const UNITY_LOADER_URL = `${UNITY_BUILD_BASE}earthquake.loader.js`;

export const PlayGamePage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const unityInstanceRef = useRef(null);
  const scriptRef = useRef(null);
  const sessionSentRef = useRef(false);

  const [phase, setPhase] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [attemptNotice, setAttemptNotice] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ─── Send session to Unity once instance is ready ─────────────────────────
  const injectSession = useCallback((instance) => {
    if (!token || !user || sessionSentRef.current) return;
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
    const payload = JSON.stringify({
      token,
      username: user.username,
      baseUrl: apiBase,
    });
    try {
      instance.SendMessage('[Managers]', 'SetWebSession', payload);
      sessionSentRef.current = true;
      console.log('[Unity Bridge] ✅ Session injected for:', user.username);
    } catch (err) {
      console.warn('[Unity Bridge] SendMessage failed:', err);
    }
  }, [token, user]);

  // ─── Load Unity WebGL ──────────────────────────────────────────────────────
  const loadUnity = useCallback(() => {
    // Avoid double-loading if script tag already added
    if (scriptRef.current) return;

    setPhase('loading');
    setProgress(0);
    setErrorMsg('');
    sessionSentRef.current = false;

    const script = document.createElement('script');
    script.src = UNITY_LOADER_URL;
    scriptRef.current = script;

    script.onload = () => {
      if (typeof window.createUnityInstance !== 'function') {
        setErrorMsg('Unity loader script loaded but createUnityInstance is missing.');
        setPhase('error');
        return;
      }

      const config = {
        dataUrl:          `${UNITY_BUILD_BASE}earthquake.data`,
        frameworkUrl:     `${UNITY_BUILD_BASE}earthquake.framework.js`,
        codeUrl:          `${UNITY_BUILD_BASE}earthquake.wasm`,
        streamingAssetsUrl: 'StreamingAssets',
        companyName:      'DefaultCompany',
        productName:      'DisasterReady',
        productVersion:   '1.0',
      };

      window
        .createUnityInstance(canvasRef.current, config, (prog) => {
          setProgress(Math.round(prog * 100));
        })
        .then((instance) => {
          unityInstanceRef.current = instance;
          setPhase('ready');
          injectSession(instance);
        })
        .catch((err) => {
          console.error('[Unity Bridge] createUnityInstance error:', err);
          setErrorMsg(
            err?.message
              ? `Unity failed to start: ${err.message}`
              : 'Unity engine failed to initialise. Check the browser console for details.'
          );
          setPhase('error');
        });
    };

    script.onerror = () => {
      setErrorMsg(
        `Could not fetch "${UNITY_LOADER_URL}". ` +
        'Make sure the Unity WebGL build files are present in frontend/public/unity/earthquake/Build/.'
      );
      setPhase('error');
    };

    document.body.appendChild(script);
  }, [injectSession]);

  // ─── Mount / unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    loadUnity();

    // Listen for Unity → React attempt-submitted event (from DisasterReadyBridge.jslib)
    const handleAttemptSubmitted = (e) => {
      console.log('[Unity Bridge] ✅ Attempt submitted:', e.detail);
      setAttemptNotice({
        score: e.detail?.attempt?.score ?? e.detail?.score ?? null,
        message: 'Simulation complete! Score saved to your profile.',
      });
      setTimeout(() => setAttemptNotice(null), 10000);
    };

    window.addEventListener('unity:attemptSubmitted', handleAttemptSubmitted);

    // Track fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('unity:attemptSubmitted', handleAttemptSubmitted);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);

      // Gracefully quit Unity instance on unmount
      if (unityInstanceRef.current) {
        try {
          unityInstanceRef.current.Quit().catch(() => {});
        } catch (_) {}
        unityInstanceRef.current = null;
      }

      // Remove injected script tag
      if (scriptRef.current && document.body.contains(scriptRef.current)) {
        document.body.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Fullscreen toggle ─────────────────────────────────────────────────────
  const toggleFullscreen = () => {
    const container = document.getElementById('unity-container');
    if (!document.fullscreenElement) {
      container?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // ─── Retry ────────────────────────────────────────────────────────────────
  const retry = () => {
    if (scriptRef.current && document.body.contains(scriptRef.current)) {
      document.body.removeChild(scriptRef.current);
      scriptRef.current = null;
    }
    loadUnity();
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)',
              textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500,
              backgroundColor: 'rgba(255,255,255,0.03)', transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-orange)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <ArrowLeft size={15} /> Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Gamepad2 size={18} color="var(--accent-orange)" />
            <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
              Earthquake Survival Simulation
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          {phase === 'ready' && (
            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)',
                background: 'rgba(255,255,255,0.03)', fontSize: '0.82rem', fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <Maximize2 size={14} /> {isFullscreen ? 'Exit' : 'Fullscreen'}
            </button>
          )}
          <Link
            to="/leaderboard"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--accent-orange)', color: 'var(--accent-orange)',
              textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600,
              background: 'var(--accent-orange-subtle)',
            }}
          >
            <Trophy size={14} /> Leaderboard
          </Link>
        </div>
      </div>

      {/* ── Attempt success banner ── */}
      {attemptNotice && (
        <div style={{
          padding: '0.9rem 1.1rem', borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          color: '#4ade80', fontSize: '0.9rem', fontWeight: 600,
        }}>
          <CheckCircle2 size={18} />
          {attemptNotice.message}
          {attemptNotice.score !== null && (
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '1rem', color: '#fff' }}>
              +{attemptNotice.score} pts
            </span>
          )}
        </div>
      )}

      {/* ── Error state ── */}
      {phase === 'error' && (
        <div style={{
          padding: '2rem', borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.07)',
          textAlign: 'center', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '1rem',
        }}>
          <AlertTriangle size={36} color="#f87171" />
          <div>
            <h3 style={{ margin: '0 0 0.3rem', color: '#f87171', fontWeight: 700 }}>Failed to Load Simulation</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '480px' }}>{errorMsg}</p>
          </div>
          <button
            onClick={retry}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 1.4rem', borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-orange)', color: '#fff',
              border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      )}

      {/* ── Unity canvas container ── */}
      <div
        id="unity-container"
        style={{
          position: 'relative', width: '100%',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          backgroundColor: '#0A0F1D',
          boxShadow: 'var(--shadow-lg)',
          display: phase === 'error' ? 'none' : 'block',
        }}
      >
        {/* 16:9 aspect ratio wrapper */}
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
          <canvas
            ref={canvasRef}
            id="unity-canvas"
            tabIndex={1}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%',
              outline: 'none', display: 'block',
            }}
          />

          {/* Loading overlay */}
          {phase === 'loading' && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundColor: 'rgba(10,15,29,0.97)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '1.1rem', zIndex: 10,
            }}>
              {/* Icon */}
              <div style={{
                width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-orange-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent-orange)',
              }}>
                <Gamepad2 size={28} />
              </div>

              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                  Loading DisasterReady…
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                  Compiling WebAssembly — this takes a moment on first load
                </p>
              </div>

              {/* Progress bar */}
              <div style={{ width: '260px', height: '7px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{
                  width: `${progress}%`, height: '100%',
                  backgroundColor: 'var(--accent-orange)',
                  transition: 'width 0.25s ease-out',
                  borderRadius: 'var(--radius-full)',
                }} />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {progress}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Controls footer ── */}
      {phase !== 'error' && (
        <div style={{
          padding: '0.9rem 1.1rem', borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center',
          justifyContent: 'space-between', gap: '0.75rem',
          fontSize: '0.84rem', color: 'var(--text-secondary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HelpCircle size={15} color="var(--accent-orange)" />
            <span>
              <strong>Controls:</strong> Click or Arrow Keys to make decisions. React quickly — time matters!
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Playing as <strong style={{ color: '#fff' }}>@{user?.username}</strong>
          </span>
        </div>
      )}
    </div>
  );
};
