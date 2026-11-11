import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Maximize2,
  Gamepad2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Activity,
  Layers,
  HelpCircle,
  Play
} from 'lucide-react';

export const PlayGamePage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const unityInstanceRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [buildFound, setBuildFound] = useState(null); // true, false, null (checking)
  const [attemptNotice, setAttemptNotice] = useState(null);

  // Check if WebGL build files are in public directory
  const checkBuildFiles = async () => {
    setLoading(true);
    setError('');
    try {
      // Check for loader script and ensure it is actual JavaScript (not Vite SPA HTML fallback)
      const loaderRes = await fetch('/unity/earthquake/Build/earthquake.loader.js');
      const contentType = loaderRes.headers.get('content-type') || '';
      
      if (loaderRes.ok && (contentType.includes('javascript') || contentType.includes('application/x-javascript'))) {
        setBuildFound(true);
        loadUnityGame('/unity/earthquake/Build/');
      } else {
        // Fallback check: root directory
        const rootRes = await fetch('/unity/earthquake/earthquake.loader.js');
        const rootContentType = rootRes.headers.get('content-type') || '';
        
        if (rootRes.ok && (rootContentType.includes('javascript') || rootContentType.includes('application/x-javascript'))) {
          setBuildFound(true);
          loadUnityGame('/unity/earthquake/');
        } else {
          setBuildFound(false);
          setLoading(false);
        }
      }
    } catch (e) {
      console.warn('WebGL build check failed:', e);
      setBuildFound(false);
      setLoading(false);
    }
  };

  const loadUnityGame = (basePath) => {
    const loaderUrl = `${basePath}earthquake.loader.js`;

    const script = document.createElement('script');
    script.src = loaderUrl;
    script.onload = () => {
      if (typeof window.createUnityInstance !== 'function') {
        setError('Unity loader loaded, but createUnityInstance function was not found.');
        setLoading(false);
        return;
      }

      const config = {
        arguments: [],
        dataUrl: `${basePath}earthquake.data`,
        frameworkUrl: `${basePath}earthquake.framework.js`,
        codeUrl: `${basePath}earthquake.wasm`,
        streamingAssetsUrl: 'StreamingAssets',
        companyName: 'DefaultCompany',
        productName: 'DisasterReady',
        productVersion: '1.0',
      };

      window.createUnityInstance(canvasRef.current, config, (prog) => {
        setProgress(Math.round(prog * 100));
      })
        .then((instance) => {
          unityInstanceRef.current = instance;
          setLoading(false);

          // Authenticate session seamlessly in memory
          if (token && user) {
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
            const sessionPayload = JSON.stringify({
              token: token,
              username: user.username,
              baseUrl: apiBase,
            });

            try {
              instance.SendMessage('[Managers]', 'SetWebSession', sessionPayload);
              console.log('[React Unity Bridge] Injected web session for user:', user.username);
            } catch (err) {
              console.warn('[React Unity Bridge] Could not send initial session:', err);
            }
          }
        })
        .catch((err) => {
          console.error('[React Unity Bridge] Unity load error:', err);
          setError('Failed to initialize Unity simulation engine: ' + (err?.message || err));
          setLoading(false);
        });
    };

    script.onerror = () => {
      setError('Could not load earthquake.loader.js from the server.');
      setLoading(false);
    };

    document.body.appendChild(script);
  };

  useEffect(() => {
    checkBuildFiles();

    // Listen for attempt completion event emitted by Unity
    const handleAttemptSubmitted = (event) => {
      console.log('[React Unity Bridge] Attempt submitted by Unity:', event.detail);
      setAttemptNotice('Simulation completed! Points and attempt recorded on PostgreSQL leaderboard.');
      setTimeout(() => setAttemptNotice(null), 8000);
    };

    window.addEventListener('unity:attemptSubmitted', handleAttemptSubmitted);

    return () => {
      window.removeEventListener('unity:attemptSubmitted', handleAttemptSubmitted);
      if (unityInstanceRef.current) {
        try {
          unityInstanceRef.current.Quit();
        } catch {}
      }
    };
  }, []);

  const handleFullscreen = () => {
    if (unityInstanceRef.current) {
      unityInstanceRef.current.SetFullscreen(1);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1200px' }}>
      {/* Top Header / Navigation */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/dashboard" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="var(--accent-orange)" />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF' }}>
              Earthquake Survival Simulation
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {unityInstanceRef.current && (
            <button
              onClick={handleFullscreen}
              className="btn btn-secondary btn-sm"
              title="Fullscreen Mode"
            >
              <Maximize2 size={16} />
              <span>Fullscreen</span>
            </button>
          )}
          <Link to="/leaderboard" className="btn btn-outline-orange btn-sm">
            Leaderboard
          </Link>
        </div>
      </div>

      {/* Attempt completed banner */}
      {attemptNotice && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-success-bg)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#34D399',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          <span>{attemptNotice}</span>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-danger-bg)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#F87171',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Build Not Found Fallback Instructions */}
      {buildFound === false && (
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-orange-subtle)',
            color: 'var(--accent-orange)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}>
            <Gamepad2 size={32} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFF', marginBottom: '0.75rem' }}>
            Unity Web Build Ready to Generate
          </h2>

          <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 2rem auto', fontSize: '0.95rem', lineHeight: '1.6' }}>
            The Unity WebGL player build files are pending output to <code style={{ color: '#FFF' }}>frontend/public/unity/earthquake/</code>.
          </p>

          <div style={{
            maxWidth: '540px',
            margin: '0 auto 2rem auto',
            textAlign: 'left',
            padding: '1.25rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.88rem',
            lineHeight: '1.6'
          }}>
            <strong style={{ color: 'var(--accent-orange)', display: 'block', marginBottom: '0.5rem' }}>
              To complete the build inside your open Unity Editor:
            </strong>
            <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
              <li>Switch to your currently open <strong>Unity 6 Editor</strong> window.</li>
              <li>In the top menu bar, click <strong>DisasterReady &gt; Build WebGL for React Portal</strong>.</li>
              <li>Wait for Unity to compile the WebAssembly package.</li>
              <li>Click the <strong>"Check &amp; Launch Game"</strong> button below.</li>
            </ol>
          </div>

          <button onClick={checkBuildFiles} className="btn btn-primary btn-lg">
            <RefreshCw size={18} />
            <span>Check &amp; Launch Game</span>
          </button>
        </div>
      )}

      {/* Unity Canvas Viewport Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#0A0F1D',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        display: buildFound === false ? 'none' : 'block'
      }}>
        {/* 16:9 Aspect Ratio Container */}
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
          <canvas
            ref={canvasRef}
            id="unity-canvas"
            tabIndex={1}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              outline: 'none',
              display: 'block',
              background: '#1F2937'
            }}
          />

          {/* Loading Screen Overlay */}
          {loading && buildFound !== false && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(10, 15, 29, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.25rem',
              zIndex: 10
            }}>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-orange-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-orange)'
              }}>
                <Gamepad2 size={28} />
              </div>

              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', marginBottom: '0.35rem' }}>
                  Loading DisasterReady Simulation...
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Initializing Unity 2D Physics &amp; WebAssembly Engine
                </p>
              </div>

              {/* Progress Bar */}
              <div style={{
                width: '280px',
                height: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: 'var(--accent-orange)',
                  transition: 'width 0.2s ease-out'
                }} />
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {progress}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Gameplay Controls Banner */}
      {buildFound !== false && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <HelpCircle size={16} color="var(--accent-orange)" />
            <span>
              <strong>Controls:</strong> Use Mouse Click or Arrow Keys / [A-D] to select decisions. Walk towards safe zones when tremors start.
            </span>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Playing as: <strong style={{ color: '#FFF' }}>@{user?.username}</strong>
          </div>
        </div>
      )}
    </div>
  );
};

