import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Circle } from 'lucide-react';
import { authService } from '@/api/auth.service';
import { useAuth } from '@/context/AuthContext';

export const Header: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        await authService.getHealth();
        if (isMounted) setIsBackendHealthy(true);
      } catch {
        if (isMounted) setIsBackendHealthy(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getPageInfo = () => {
    const path = location.pathname;
    if (path === '/') return { title: 'Operational Overview', breadcrumb: 'Dashboard' };
    if (path.startsWith('/scenarios/')) return { title: 'Scenario Simulation', breadcrumb: 'Scenarios / Detail' };
    if (path === '/scenarios') return { title: 'Preparedness Scenarios', breadcrumb: 'Scenarios' };
    if (path.startsWith('/attempts/')) return { title: 'Evaluation Report', breadcrumb: 'Attempts / Report' };
    if (path === '/attempts') return { title: 'Training History', breadcrumb: 'Attempts' };
    if (path === '/leaderboard') return { title: 'Trainee Leaderboard', breadcrumb: 'Leaderboard' };
    if (path === '/profile') return { title: 'Trainee Profile', breadcrumb: 'Profile' };
    if (path === '/settings') return { title: 'System Settings', breadcrumb: 'Settings' };
    return { title: 'DisasterReady', breadcrumb: 'Platform' };
  };

  const { title, breadcrumb } = getPageInfo();

  return (
    <header className="h-14 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 z-10">
      {/* Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
          {breadcrumb}
        </span>
        <span className="text-slate-300">/</span>
        <h1 className="text-sm font-semibold text-slate-900 tracking-tight">
          {title}
        </h1>
      </div>

      {/* Right Utility Actions */}
      <div className="flex items-center gap-4">
        {/* Backend Connectivity Status Dot */}
        <div
          className="flex items-center gap-1.5 text-xs text-slate-500 font-mono"
          title={isBackendHealthy ? 'API Gateway Connected' : 'API Gateway Disconnected'}
        >
          <Circle
            className={`w-2 h-2 fill-current ${
              isBackendHealthy === null
                ? 'text-slate-300'
                : isBackendHealthy
                ? 'text-semantic-success'
                : 'text-semantic-danger'
            }`}
          />
          <span className="hidden sm:inline text-[11px]">
            {isBackendHealthy ? 'API Active' : 'API Offline'}
          </span>
        </div>

        {/* User Badges / Points Pill */}
        {user && (
          <Link
            to="/profile"
            className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-accent-blue" />
            <span className="font-mono font-medium">{user.totalPoints ?? 0} pts</span>
            <span className="text-[11px] text-slate-400">·</span>
            <span className="text-[11px] text-slate-500">Lvl {user.level ?? 1}</span>
          </Link>
        )}
      </div>
    </header>
  );
};

