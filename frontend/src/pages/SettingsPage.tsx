import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/api/client';
import {
  Server,
  Gamepad2,
  Volume2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Cpu,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'healthy' | 'error'>('checking');
  const [backendMeta, setBackendMeta] = useState<{ uptime?: number; env?: string; timestamp?: string } | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [sfxVolume, setSfxVolume] = useState(() => localStorage.getItem('dr_sfx_vol') || '80');
  const [screenShakeEnabled, setScreenShakeEnabled] = useState(() => localStorage.getItem('dr_shake') !== 'false');

  const checkGatewayHealth = async () => {
    setIsPinging(true);
    setBackendStatus('checking');
    try {
      const res = await apiClient.get('/health');
      setBackendStatus('healthy');
      setBackendMeta({
        uptime: Math.floor(res.data.uptime || 0),
        env: res.data.environment || 'development',
        timestamp: res.data.timestamp,
      });
    } catch {
      setBackendStatus('error');
      setBackendMeta(null);
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    checkGatewayHealth();
  }, []);

  const handleVolumeChange = (val: string) => {
    setSfxVolume(val);
    localStorage.setItem('dr_sfx_vol', val);
  };

  const handleShakeToggle = (checked: boolean) => {
    setScreenShakeEnabled(checked);
    localStorage.setItem('dr_shake', String(checked));
  };

  const handleClearCache = () => {
    if (confirm('Clear local session caches and diagnostic settings? This will refresh your workspace view.')) {
      localStorage.removeItem('dr_sfx_vol');
      localStorage.removeItem('dr_shake');
      window.location.reload();
    }
  };

  return (
    <PageContainer
      title="System Settings & Engine Diagnostics"
      description="Operational monitoring, Unity simulation pipeline, and client audio-visual parameters."
    >
      <div className="space-y-6 max-w-4xl">
        {/* Backend & Gateway Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-brand-blue">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">API Gateway & Backend Connectivity</h3>
                <p className="text-xs text-slate-500">Node.js Express gateway running on port 4000 via proxy /api</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {backendStatus === 'healthy' ? (
                <Badge variant="success" className="px-2.5 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Gateway Active
                </Badge>
              ) : backendStatus === 'checking' ? (
                <Badge variant="outline" className="px-2.5 py-1 text-slate-500">
                  <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                  Checking
                </Badge>
              ) : (
                <Badge variant="danger" className="px-2.5 py-1">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  Gateway Unreachable
                </Badge>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={checkGatewayHealth}
                isLoading={isPinging}
              >
                Ping Gateway
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block uppercase tracking-wider text-[10px]">Endpoint</span>
              <span className="text-slate-700 font-semibold">http://localhost:4000/api/health</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block uppercase tracking-wider text-[10px]">Environment</span>
              <span className="text-slate-700 font-semibold">{backendMeta?.env || 'development'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block uppercase tracking-wider text-[10px]">Gateway Uptime</span>
              <span className="text-slate-700 font-semibold">
                {backendMeta?.uptime ? `${Math.floor(backendMeta.uptime / 60)} min` : 'Offline'}
              </span>
            </div>
          </div>
        </Card>

        {/* Unity 2D Engine Integration */}
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Gamepad2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Unity 2D Disaster Engine Specification</h3>
                <p className="text-xs text-slate-500">Standalone C# client & in-browser HTML5 Web Canvas drill sync</p>
              </div>
            </div>
            <Badge variant="neutral" className="px-2.5 py-1">
              Unity 6000.0.x Ready
            </Badge>
          </div>

          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <Cpu className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-900 block text-xs">Unity Project Path</span>
                <code className="text-xs text-indigo-700 font-mono bg-indigo-50/60 px-1.5 py-0.5 rounded">
                  Assets/Scenes/SampleScene.unity
                </code>
                <p className="text-xs text-slate-500 mt-1">
                  C# controllers (<code className="text-xs font-mono">GameController.cs</code>, <code className="text-xs font-mono">DisasterGameClient.cs</code>) communicate directly with the local backend via REST payload matching.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <HardDrive className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-900 block text-xs">Synced Asset Pipeline</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  High-resolution 2D sprites (<code className="text-xs font-mono">background_room.png</code>, <code className="text-xs font-mono">ceiling_debris.png</code>, <code className="text-xs font-mono">character_hiding.png</code>) and audio triggers (<code className="text-xs font-mono">rumble.mp3</code>, <code className="text-xs font-mono">debris_crash.mp3</code>) are synchronized between Unity and the web simulation console.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Audio-Visual Drill Parameters */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4 mb-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Volume2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Simulation Audio & Visual Effects</h3>
              <p className="text-xs text-slate-500">Fine-tune in-browser earthquake rumble and camera shake feedback</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 block">
                Disaster Sound Effects Volume ({sfxVolume}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={sfxVolume}
                onChange={(e) => handleVolumeChange(e.target.value)}
                className="w-full accent-brand-blue h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">Controls earthquake rumble, emergency siren, and debris impact audio.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 block">
                Camera Tremor / Screen Shake
              </label>
              <div className="flex items-center space-x-3 pt-1">
                <input
                  type="checkbox"
                  id="shake-toggle"
                  checked={screenShakeEnabled}
                  onChange={(e) => handleShakeToggle(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                />
                <label htmlFor="shake-toggle" className="text-xs text-slate-700 cursor-pointer">
                  Enable realistic seismic tremor shake on emergency beat triggers
                </label>
              </div>
              <p className="text-[11px] text-slate-400">Can be disabled for low-motion accessibility.</p>
            </div>
          </div>
        </Card>

        {/* Diagnostic Storage */}
        <Card className="p-6 border-red-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Reset Local Simulation State</h3>
                <p className="text-xs text-slate-500">Clears cached simulation responses and audio preferences.</p>
              </div>
            </div>
            <Button variant="danger" size="sm" onClick={handleClearCache}>
              Flush Diagnostics
            </Button>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};
