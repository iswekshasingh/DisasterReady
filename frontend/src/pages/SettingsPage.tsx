import React, { useEffect, useState } from 'react';
import { Server, RefreshCw, CheckCircle2, AlertCircle, Gamepad2 } from 'lucide-react';
import { authApi } from '@/api/auth';
import { HealthStatus } from '@/types';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [clearedNotice, setClearedNotice] = useState<string | null>(null);

  const check = async () => {
    setIsChecking(true);
    try {
      const h = await authApi.checkHealth();
      setHealth(h);
    } catch {
      setHealth(null);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    check();
  }, []);

  const handleClearCache = () => {
    Object.keys(sessionStorage).forEach((k) => {
      if (k.startsWith('attempt_')) {
        sessionStorage.removeItem(k);
      }
    });
    setClearedNotice('Session drill caches have been cleared.');
    setTimeout(() => setClearedNotice(null), 3000);
  };

  return (
    <PageContainer
      title="Platform Diagnostics & Settings"
      description="Verify REST API backend connectivity, inspect database status, and manage client-side state."
    >
      <div className="max-w-4xl space-y-6">
        {/* Backend Gateway */}
        <Card className="space-y-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-brand-blue" />
                <CardTitle>REST API Gateway Diagnostics</CardTitle>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={check}
                isLoading={isChecking}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Ping Health
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-md text-xs font-mono">
              <div>
                <span className="text-slate-400 text-[11px] uppercase block">Server Gateway</span>
                <div className="flex items-center gap-1.5 mt-1">
                  {health ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-safety-green shrink-0" />
                      <span className="font-bold text-safety-green">{health.status.toUpperCase()}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-safety-red shrink-0" />
                      <span className="font-bold text-safety-red">OFFLINE</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] uppercase block">Service Header</span>
                <p className="text-slate-800 mt-1 truncate">
                  {health?.service || 'DisasterReady API'}
                </p>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] uppercase block">Uptime</span>
                <p className="text-slate-800 mt-1">
                  {health ? `${Math.round(health.uptime)} seconds` : '—'}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              The API communicates on <code>http://localhost:4000/api</code>, backed by Prisma ORM v7 and local PostgreSQL.
            </p>
          </CardContent>
        </Card>

        {/* Unity Client Instructions */}
        <Card className="space-y-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-brand-navy" />
              <CardTitle>Unity 2D Client Integration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <p>
              The Unity project is located at the workspace root: <code>/Users/amresh/Desktop/DisasterReady</code>.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500 font-mono">
              <li>Scene: <code>Assets/Scenes/SampleScene.unity</code></li>
              <li>API Connector: <code>Assets/Scripts/Backend/ApiClient.cs</code></li>
              <li>Target: <code>http://localhost:4000</code></li>
            </ul>
          </CardContent>
        </Card>

        {/* Session Cache */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Client Session Cache</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {clearedNotice && (
              <div className="p-3 bg-safety-green-subtle border border-green-200 rounded text-xs text-safety-green font-mono">
                {clearedNotice}
              </div>
            )}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-md">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Flush Local Simulation Caches
                </span>
                <span className="text-[11px] text-slate-500">
                  Resets locally stored question answer sessions
                </span>
              </div>
              <Button variant="secondary" size="sm" onClick={handleClearCache}>
                Flush Cache
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};
