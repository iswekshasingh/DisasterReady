import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Target,
  ArrowRight,
  Shield,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { scenarioApi } from '@/api/scenarios';
import { attemptApi } from '@/api/attempts';
import { Scenario, AttemptHistoryItem } from '@/types';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui/Badge';
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
  const passedCount = completed.filter((a) => a.score >= 70);
  const passRate = totalCompleted > 0 ? Math.round((passedCount.length / totalCompleted) * 100) : 0;
  const earthquakeScenario = scenarios.find((s) => s.disasterType === 'EARTHQUAKE') || scenarios[0];

  return (
    <PageContainer className="space-y-6">
      {/* 1. MINIMAL EDITORIAL METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200/60 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Drills Run
          </span>
          {isLoading ? (
            <Skeleton className="h-6 w-12 mt-1.5" />
          ) : (
            <div className="flex items-baseline gap-1 mt-1 font-mono">
              <span className="text-xl font-bold tracking-tight text-slate-900">
                {totalCompleted}
              </span>
              <span className="text-[11px] text-slate-400">completed</span>
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/60 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Readiness Rate
          </span>
          {isLoading ? (
            <Skeleton className="h-6 w-12 mt-1.5" />
          ) : (
            <div className="flex items-baseline gap-1 mt-1 font-mono">
              <span className="text-xl font-bold tracking-tight text-slate-900">
                {passRate}%
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">passing</span>
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/60 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Total Points
          </span>
          {isLoading ? (
            <Skeleton className="h-6 w-12 mt-1.5" />
          ) : (
            <div className="flex items-baseline gap-1 mt-1 font-mono">
              <span className="text-xl font-bold tracking-tight text-brand-blue">
                {user?.totalPoints ?? 0}
              </span>
              <span className="text-[11px] text-slate-400">earned</span>
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/60 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Defense Tier
          </span>
          {isLoading ? (
            <Skeleton className="h-6 w-12 mt-1.5" />
          ) : (
            <div className="flex items-baseline gap-1 mt-1 font-mono">
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Tier {user?.level ?? 1}
              </span>
              <span className="text-[11px] text-slate-400">
                ({100 - ((user?.totalPoints ?? 0) % 100)} pts to next)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. HERO: INTERACTIVE 2D SIMULATION STAGE */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              Interactive Disaster Simulation
            </h2>
            <p className="text-xs text-slate-500">
              Active earthquake scenario — test your physical reflexes and survival tactics below.
            </p>
          </div>
        </div>

        {/* 2D Canvas */}
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

      {/* 3. SCENARIOS CATALOG & RECENT HISTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-1">
        {/* Scenario List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Preparedness Modules
            </h3>
            <Link
              to="/scenarios"
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              All scenarios <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : scenarios.length > 0 ? (
              scenarios.map((sc) => (
                <Link
                  key={sc.id}
                  to={`/scenarios/${sc.id}`}
                  className="block p-3.5 bg-white border border-slate-200/70 hover:border-slate-300 rounded-xl hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 group-hover:text-brand-blue transition-colors truncate">
                          {sc.title}
                        </span>
                        <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
                          {sc.difficulty}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {sc.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 font-mono text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {sc.estimatedDuration ?? 5}m
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {sc.passingScore}%
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200/60">
                No scenarios currently published.
              </div>
            )}
          </div>
        </div>

        {/* Recent Drill Log */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Recent Drills
            </h3>
            <Link
              to="/attempts"
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              Log <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : completed.length > 0 ? (
              completed.slice(0, 4).map((att) => {
                const passed = att.score >= 70;
                return (
                  <Link
                    key={att.id}
                    to={`/attempts/${att.id}`}
                    className="block p-3 rounded-xl bg-white border border-slate-200/70 hover:border-slate-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <span className="text-xs font-medium text-slate-800 truncate block group-hover:text-brand-blue transition-colors">
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
                        <span className={`text-xs font-bold ${passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {att.score}%
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200/60">
                <Shield className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">No drills recorded yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Start the simulation above to log your first drill.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
