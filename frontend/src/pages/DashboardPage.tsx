import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Trophy,
  ArrowRight,
  Clock,
  Target,
  Gamepad2,
  CheckCircle2,
  XCircle,
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

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [attempts, setAttempts] = useState<AttemptHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const [scRes, attRes] = await Promise.all([
          scenarioApi.getAll().catch(() => []),
          attemptApi.getHistory().catch(() => []),
        ]);
        if (active) {
          setScenarios(scRes);
          setAttempts(attRes);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const completed = attempts.filter((a) => a.status === 'COMPLETED');
  const totalCompleted = completed.length;
  const passedCount = completed.filter((a) => a.score >= 70).length;
  const passRate = totalCompleted > 0 ? Math.round((passedCount / totalCompleted) * 100) : 0;
  const avgScore =
    totalCompleted > 0
      ? Math.round(completed.reduce((sum, item) => sum + item.score, 0) / totalCompleted)
      : 0;

  return (
    <PageContainer
      title={`Operational Console — ${user?.fullName || user?.username || 'Trainee'}`}
      description="Real-time disaster preparedness metrics, validated incident attempts, and training module catalog."
      action={
        <Link to="/scenarios">
          <Button variant="primary" size="sm">
            <Compass className="w-3.5 h-3.5 mr-1.5" />
            Browse Scenarios
          </Button>
        </Link>
      }
    >
      {/* 4 Metric Cards */}
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
            <span>Avg: {avgScore}%</span>
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

      {/* Unity 2D Companion Banner */}
      <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-brand-navy text-white shrink-0 mt-0.5">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Unity 2D Disaster Simulation Client Connected
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              The project includes a standalone 2D emergency survival game built in Unity (<code>Assets/Scenes/SampleScene.unity</code>). Both this web portal and Unity connect to the same backend at <code>http://localhost:4000</code>.
            </p>
          </div>
        </div>
        <Link to="/scenarios">
          <Button variant="secondary" size="sm" className="whitespace-nowrap">
            Launch In-Browser Drill <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Main Grid: Recommended Drills & Recent Attempts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 span): Recommended Scenarios */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Available Emergency Scenarios</CardTitle>
                <p className="text-xs text-slate-500">
                  Standardized disaster response decision modules
                </p>
              </div>
              <Link to="/scenarios" className="text-xs text-brand-blue hover:underline font-medium">
                View catalog →
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
                        Briefing →
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

        {/* Right Column (1 span): Recent Incident Attempts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Simulation Runs</CardTitle>
                <p className="text-xs text-slate-500">Audit of your latest runs</p>
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
                <p className="text-xs text-slate-500">No attempts logged yet.</p>
                <Link to="/scenarios" className="mt-2 inline-block">
                  <Button variant="secondary" size="sm">
                    Start Earthquake Drill
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};
