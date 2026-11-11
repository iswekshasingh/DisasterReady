import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Circle, ShieldCheck } from 'lucide-react';
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
    const timer = setInterval(check, 20000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const getBreadcrumbs = () => {
    const p = location.pathname;
    if (p === '/') return { section: 'Operations', title: 'Operational Overview' };
    if (p.startsWith('/scenarios/') && p.endsWith('/run')) return { section: 'Simulation Engine', title: 'Active Emergency Drill' };
    if (p.startsWith('/scenarios/')) return { section: 'Scenarios', title: 'Drill Briefing & Protocol' };
    if (p === '/scenarios') return { section: 'Scenarios', title: 'Training Catalog' };
    if (p.startsWith('/attempts/')) return { section: 'Audit Reports', title: 'Simulation After-Action Review' };
    if (p === '/attempts') return { section: 'Audit Reports', title: 'Trainee Attempt Log' };
    if (p === '/leaderboard') return { section: 'Rankings', title: 'Readiness Leaderboard' };
    if (p === '/profile') return { section: 'Trainee', title: 'Personnel Profile' };
    if (p === '/settings') return { section: 'System', title: 'Engine Diagnostics' };
    return { section: 'DisasterReady', title: 'Platform' };
  };

  const { section, title } = getBreadcrumbs();

  return (
    <header className="h-14 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 z-10">
      <div className="flex items-center gap-2.5">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          {section}
        </span>
        <span className="text-slate-300">/</span>
        <h1 className="text-xs font-semibold text-slate-900 tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* API Health indicator */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600">
          <Circle
            className={`w-2 h-2 fill-current ${
              isHealthy === null
                ? 'text-slate-300'
                : isHealthy
                ? 'text-safety-green'
                : 'text-safety-red'
            }`}
          />
          <span>{isHealthy ? 'Backend 4000 Connected' : 'Backend Disconnected'}</span>
        </div>

        {/* User Pill */}
        {user && (
          <Link
            to="/profile"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:bg-slate-100 transition-colors font-mono"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-brand-blue" />
            <span className="font-semibold text-slate-900">{user.totalPoints ?? 0}</span>
            <span className="text-slate-400">pts</span>
          </Link>
        )}
      </div>
    </header>
  );
};
