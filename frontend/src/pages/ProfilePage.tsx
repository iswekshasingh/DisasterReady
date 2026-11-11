import React from 'react';
import { Shield, Award, Mail, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();

  const points = user?.totalPoints ?? 0;
  const level = user?.level ?? 1;
  const nextTarget = level * 100;
  const progress = Math.min(100, (points / nextTarget) * 100);

  return (
    <PageContainer
      title="Trainee Personnel Profile"
      description="Authorized responder credentials, certification tier progress, and earned commendations."
      action={
        <Button variant="danger" size="sm" onClick={logout}>
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          Sign Out
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="space-y-4">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-16 h-16 rounded-full bg-brand-navy text-white text-xl font-bold flex items-center justify-center font-mono shadow-subtle mb-3">
              {user?.username ? user.username.slice(0, 2).toUpperCase() : 'TR'}
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {user?.fullName || user?.username || 'Trainee Responder'}
            </h3>
            <span className="text-xs text-slate-400 font-mono mt-0.5">
              @{user?.username || 'trainee'}
            </span>
            <div className="mt-3">
              <Badge variant="brand" size="md">
                {user?.role || 'USER'}
              </Badge>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Mail className="w-3.5 h-3.5" /> Email
              </span>
              <span className="font-mono text-slate-900 truncate max-w-[160px]">
                {user?.email || '—'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Shield className="w-3.5 h-3.5" /> Trainee ID
              </span>
              <span className="font-mono text-slate-500 text-[11px] truncate max-w-[120px]">
                {user?.id?.slice(0, 8) || '—'}...
              </span>
            </div>
          </div>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card className="space-y-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Certification Tier & Score Growth</CardTitle>
                  <p className="text-xs text-slate-500">
                    Calculated from validated disaster simulation performance
                  </p>
                </div>
                <Badge variant="success">Tier {level}</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-2xl font-bold text-slate-900">
                  {points}{' '}
                  <span className="text-xs font-normal text-slate-400">/ {nextTarget} pts</span>
                </span>
                <span className="text-xs text-slate-500">
                  {Math.round(progress)}% to Tier {level + 1}
                </span>
              </div>

              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-blue h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500 pt-1">
                Completing disaster drills in browser or through the Unity client accumulates training points to advance your tier standing.
              </p>
            </CardContent>
          </Card>

          <Card className="space-y-4">
            <CardHeader>
              <CardTitle>Earned Badges & Specializations</CardTitle>
              <p className="text-xs text-slate-500">
                Verified skill certificates
              </p>
            </CardHeader>

            <CardContent>
              {user?.badges && user.badges.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.badges.map((b, i) => (
                    <div
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700"
                    >
                      <Award className="w-3.5 h-3.5 text-brand-blue" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-md text-center">
                  <Award className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                  <p className="text-xs font-medium text-slate-700">No Badges Earned Yet</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Achieve high passing scores on earthquake and flood scenarios to unlock credentials.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

