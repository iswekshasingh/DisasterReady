import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  History,
  Trophy,
  User,
  Settings,
  LogOut,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Overview', to: '/', icon: LayoutDashboard },
    { name: 'Scenarios', to: '/scenarios', icon: Compass },
    { name: 'My Attempts', to: '/attempts', icon: History },
    { name: 'Leaderboard', to: '/leaderboard', icon: Trophy },
    { name: 'Profile', to: '/profile', icon: User },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-white border-r border-slate-200 transition-all duration-200 ease-in-out z-20 shrink-0 select-none',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center h-14 px-4 border-b border-slate-100 justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-brand-navy text-white shrink-0">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-slate-900 tracking-tight leading-none truncate">
                DisasterReady
              </span>
              <span className="text-[11px] text-slate-400 font-mono tracking-tight leading-none mt-1">
                TRAINING OPS
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors group',
                  isActive
                    ? 'bg-slate-100 text-brand-navy font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-slate-900" />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User / Session Area */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-brand-navy/10 text-brand-navy font-medium text-xs flex items-center justify-center shrink-0">
              {user?.username ? user.username.slice(0, 2).toUpperCase() : 'TR'}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-slate-900 truncate">
                  {user?.fullName || user?.username || 'Trainee'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono leading-none truncate">
                  {user?.role || 'TRAINEE'}
                </span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-semantic-danger hover:bg-slate-100 rounded transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

