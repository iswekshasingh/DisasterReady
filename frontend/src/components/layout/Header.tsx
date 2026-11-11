import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { authApi } from '@/api/auth';
import { useAuth } from '@/context/AuthContext';

export const Header: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        await authApi.checkHealth();
        if (active) setIsHealthy(true);
      } catch {
        if (active) setIsHealthy(false);
      }
    };
    check();
    const timer = setInterval(check, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const getBreadcrumbs = () => {
    const p = location.pathname;
    if (p === '/') return { section: 'Console', title: 'Simulation Overview' };
    if (p.startsWith('/scenarios/')) return { section: 'Scenarios', title: 'Module Briefing' };
    if (p === '/scenarios') return { section: 'Scenarios', title: 'Training Catalog' };
    if (p.startsWith('/attempts/')) return { section: 'Audit', title: 'Incident Review' };
    if (p === '/attempts') return { section: 'Audit', title: 'Attempt Log' };
    if (p === '/leaderboard') return { section: 'Rankings', title: 'Readiness Board' };
    if (p === '/profile') return { section: 'Profile', title: 'Operator Dossier' };
    if (p === '/settings') return { section: 'System', title: 'Diagnostics' };
    return { section: 'DisasterReady', title: 'Platform' };
  };

  const { section, title } = getBreadcrumbs();

  return (
    <header className="h-13 px-6 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between shrink-0 z-10 transition-all">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          {section}
        </span>
        <span className="text-slate-300 text-xs">/</span>
        <h1 className="text-xs font-semibold text-slate-800 tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Sleek status pill */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <span className="relative flex h-2 w-2">
            {isHealthy && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isHealthy === null
                  ? 'bg-slate-300'
                  : isHealthy
                  ? 'bg-emerald-500'
                  : 'bg-rose-500'
              }`}
            />
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            {isHealthy ? 'System Active' : 'Disconnected'}
          </span>
        </div>

        {/* User points */}
        {user && (
          <Link
            to="/profile"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 transition-colors font-mono border border-slate-200/60"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-brand-blue" />
            <span className="font-semibold text-slate-900">{user.totalPoints ?? 0}</span>
            <span className="text-slate-400 text-[10px]">pts</span>
          </Link>
        )}
      </div>
    </header>
  );
};
