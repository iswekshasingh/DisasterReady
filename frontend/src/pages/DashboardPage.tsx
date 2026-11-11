import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Trophy,
  Clock,
  Target,
  Gamepad2,
  CheckCircle2,
  XCircle,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { scenarioApi } from '@/api/scenarios';
import { attemptApi } from '@/api/attempts';
import { Scenario, AttemptHistoryItem } from '@/types';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Table';
import { SimulationStage } from '@/components/simulation/SimulationStage';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [attempts, setAttempts] = useState<AttemptHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [scRes, attRes] = await Promise.all([
        scenarioApi.getAll().catch(() => []),
        attemptApi.getHistory().catch(() => []),
      ]);
      setScenarios(scRes);
      setAttempts(attRes);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const completed = attempts.filter((a) => a.status === 'COMPLETED');
  const totalCompleted = completed.length;
  const passedCount = completed.filter((a) => a.score >= 70).length;
  const passRate = totalCompleted > 0 ? Math.round((passedCount / totalCompleted) * 100) : 0;

  const earthquakeScenario = scenarios.find((s) => s.disasterType === 'EARTHQUAKE') || scenarios[0];

  return (
    <PageContainer
      title={`Operational Console — ${user?.fullName || user?.username || 'Trainee'}`}
      description="Live 2D disaster survival simulation canvas, response decision engine, and validated preparedness analytics."
      action={
        <Link to="/scenarios">
          <Button variant="secondary" size="sm">
            <Compass className="w-3.5 h-3.5 mr-1.5" />
            Browse Scenarios
          </Button>
        </Link>
      }
    >
      {/* 1. KEY KPI METRICS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
            Completed Simulations
          </span>
          {isLoading ? (
            <Skeleton className="h-7 w-16 mt-2" />
          ) : (
            <div className="flex items-baseline gap-1.5 mt-1 font-mono">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {totalCompleted}
              </span>
              <span className="text-xs text-slate-400">runs</span>
            </div>
          )}
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3 h-3 text-safety-green" />
            <span>Passed: {passedCount}</span>
          </div>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
            Readiness Proficiency
          </span>
          {isLoading ? (
            <Skeleton className="h-7 w-16 mt-2" />
          ) : (
            <div className="flex items-baseline gap-1.5 mt-1 font-mono">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {passRate}%
              </span>
              <span className="text-xs text-slate-400">rate</span>
            </div>
          )}
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 font-mono">
            <Target className="w-3 h-3 text-brand-blue" />
            <span>Target: 70%+</span>
          </div>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
            Total Score Points
          </span>
          {isLoading ? (
            <Skeleton className="h-7 w-16 mt-2" />
          ) : (
            <div className="flex items-baseline gap-1.5 mt-1 font-mono">
              <span className="text-2xl font-bold tracking-tight text-brand-blue">
                {user?.totalPoints ?? 0}
              </span>
              <span className="text-xs text-slate-400">pts</span>
            </div>
          )}
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 font-mono">
            <Trophy className="w-3 h-3 text-safety-amber" />
            <span>Rank points</span>
          </div>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
            Readiness Tier
          </span>
          {isLoading ? (
            <Skeleton className="h-7 w-16 mt-2" />
          ) : (
            <div className="flex items-baseline gap-1.5 mt-1 font-mono">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                Tier {user?.level ?? 1}
              </span>
            </div>
          )}
          <div className="text-[11px] text-slate-500 mt-2 font-mono">
            <span>Next tier in {100 - ((user?.totalPoints ?? 0) % 100)} pts</span>
          </div>
        </Card>
      </div>

      {/* 2. HERO: INTERACTIVE 2D SIMULATION CANVAS (THE UNITY VISUAL STAGE) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-brand-navy text-white">
              <Gamepad2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Interactive 2D Disaster Simulation Stage
              </h3>
              <p className="text-xs text-slate-500">
                Play the emergency scenario directly below — featuring dynamic room debris, character animations, seismic shaking, and siren audio.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-slate-500">
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
              Module: Earthquake Safety
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
              Backend Connected: 4000
            </span>
          </div>
        </div>

        {/* The 2D Simulation Stage */}
        <SimulationStage
          scenarioId={earthquakeScenario?.id}
          onFinish={(attemptId) => {
            loadData();
            if (attemptId && attemptId !== 'offline-local') {
              navigate(`/attempts/${attemptId}`);
            }
          }}
        />
      </div>

      {/* 3. UNITY ENGINE COMPANION & HYBRID INSTRUCTIONS */}
      <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-md bg-slate-100 text-slate-700 shrink-0 mt-0.5">
            <Layers className="w-5 h-5 text-brand-navy" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900">
                Unity 2D Standalone Client Companion
              </h4>
              <Badge variant="brand" size="sm">
                Native Engine Support
              </Badge>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed max-w-3xl">
              Prefer running natively inside Unity Editor? Open <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-brand-navy font-semibold">Assets/Scenes/SampleScene.unity</code> and press Play (▶). It uses the same character sprites, audio cues, and connects to your local backend on port 4000.
            </p>
          </div>
        </div>

        <Link to="/settings" className="shrink-0">
          <Button variant="secondary" size="sm">
            View Engine Config
          </Button>
        </Link>
      </div>

      {/* 4. SCENARIO CATALOG & RECENT SIMULATION HISTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Training Catalog Modules</CardTitle>
                <p className="text-xs text-slate-500">
                  Standardized civil preparedness and disaster survival drills
                </p>
              </div>
              <Link to="/scenarios" className="text-xs text-brand-blue hover:underline font-medium">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : scenarios.length > 0 ? (
              scenarios.map((sc) => (
                <div
                  key={sc.id}
                  className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-md hover:bg-slate-100/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {sc.title}
                      </span>
                      <Badge variant="brand" size="sm">
                        {sc.difficulty}
                      </Badge>
                      <span className="text-[11px] font-mono text-slate-400 uppercase">
                        {sc.disasterType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {sc.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {sc.estimatedDuration ?? 5}m
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-slate-400" />
                        Pass: {sc.passingScore}%
                      </span>
                    </div>
                    <Link to={`/scenarios/${sc.id}`}>
                      <Button variant="primary" size="sm">
                        Drill Briefing →
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">
                No scenarios currently published.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Incident Attempts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Drill Records</CardTitle>
                <p className="text-xs text-slate-500">Evaluated incident history</p>
              </div>
              <Link to="/attempts" className="text-xs text-brand-blue hover:underline font-medium">
                Full log →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {isLoading ? (
              <Skeleton className="h-28 w-full" />
            ) : completed.length > 0 ? (
              completed.slice(0, 4).map((att) => {
                const passed = att.score >= 70;
                return (
                  <div
                    key={att.id}
                    className="p-2.5 rounded border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {passed ? (
                        <CheckCircle2 className="w-4 h-4 text-safety-green shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-safety-red shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="font-medium text-slate-900 truncate block">
                          {att.scenario?.title || 'Emergency Drill'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {att.completedAt
                            ? new Date(att.completedAt).toLocaleDateString()
                            : 'Recently'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 font-mono">
                      <span className="font-bold text-slate-900">{att.score}%</span>
                      <Link to={`/attempts/${att.id}`}>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] font-sans">
                          Review
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No attempts logged yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Play the drill in the simulation canvas above to record your first score!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

