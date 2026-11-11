import React, { useEffect, useState } from 'react';
import { Server, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '@/api/auth.service';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<{
    status: string;
    uptime: number;
    service: string;
    timestamp: string;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [clearMessage, setClearMessage] = useState<string | null>(null);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const data = await authService.getHealth();
      setHealth(data as unknown as { status: string; uptime: number; service: string; timestamp: string });
    } catch {
      setHealth(null);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleClearCache = () => {
    // Clear simulation caches from session storage
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('attempt_')) {
        sessionStorage.removeItem(key);
      }
    });
    setClearMessage('Local simulation session cache has been reset.');
    setTimeout(() => setClearMessage(null), 3000);
  };

  return (
    <PageContainer
      title="System Settings & Diagnostics"
      description="Manage local operational settings, verify backend gateway health, and inspect runtime diagnostics."
    >
      <div className="max-w-4xl space-y-6">
        {/* API Health Card */}
        <Card className="space-y-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-accent-blue" />
                <CardTitle>Backend REST API Gateway</CardTitle>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={checkHealth}
                isLoading={isChecking}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Ping Gateway
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-md text-xs">
              <div>
                <span className="text-slate-400 font-mono text-[11px] uppercase">Gateway Status</span>
                <div className="flex items-center gap-1.5 mt-1">
                  {health ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-semantic-success" />
                      <span className="font-semibold text-semantic-success font-mono">
                        {health.status.toUpperCase()}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-semantic-danger" />
                      <span className="font-semibold text-semantic-danger font-mono">
                        DISCONNECTED
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-mono text-[11px] uppercase">Service Name</span>
                <p className="font-mono text-slate-800 mt-1 truncate">
                  {health?.service || 'DisasterReady API'}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-mono text-[11px] uppercase">Server Uptime</span>
                <p className="font-mono text-slate-800 mt-1">
                  {health ? `${Math.round(health.uptime)} seconds` : '—'}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              The platform connects to the local Express + Prisma engine at port 4000.
            </p>
          </CardContent>
        </Card>

        {/* Local Storage & Session */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Session & Client Cache</CardTitle>
            <p className="text-xs text-slate-500">
              Manage client-side cache and local simulation states
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {clearMessage && (
              <div className="p-3 bg-semantic-success-subtle border border-[#C5DDD2] rounded-md text-xs text-semantic-success">
                {clearMessage}
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-md">
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Clear Temporary Simulation Run Cache
                </span>
                <span className="text-[11px] text-slate-500">
                  Clears locally cached session storage for in-progress simulations
                </span>
              </div>
              <Button variant="secondary" size="sm" onClick={handleClearCache}>
                Clear Cache
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};
