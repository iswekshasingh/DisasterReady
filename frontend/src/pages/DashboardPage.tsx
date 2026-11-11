import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Trophy,
  ArrowRight,
  TrendingUp,
  Clock,
  Target,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { scenarioService } from '@/api/scenario.service';
import { attemptService } from '@/api/attempt.service';
import { ScenarioListItem } from '@/types/scenario.types';
import { AttemptHistoryItem } from '@/types/attempt.types';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [attempts, setAttempts] = useState<AttemptHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [scenariosRes, attemptsRes] = await Promise.all([
          scenarioService.getScenarios(),
          attemptService.getAttemptHistory().catch(() => ({ attempts: [], success: true, count: 0 })),
        ]);

        if (isMounted) {
          setScenarios(scenariosRes.scenarios || []);
          setAttempts(attemptsRes.attempts || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load dashboard:', err);
          setError('Could not retrieve operational dashboard metrics.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute metrics from actual attempts
  const completedAttempts = attempts.filter((a) => a.status === 'COMPLETED');
  const totalCompleted = completedAttempts.length;
  const passedCount = completedAttempts.filter((a) => a.score >= 70).length;
  const passRate = totalCompleted > 0 ? Math.round((passedCount / totalCompleted) * 100) : 0;
  const averageScore =
    totalCompleted > 0
      ? Math.round(
          completedAttempts.reduce((sum, item) => sum + item.score, 0) / totalCompleted
        )
      : 0;

  // Chart data from last 5 attempts
  const chartData = completedAttempts
    .slice(0, 5)
    .reverse()
    .map((att, idx) => ({
      name: `Run #${idx + 1}`,
      title: att.scenario?.title || 'Scenario',
      score: att.score,
    }));

  return (
    <PageContainer
      title={`Welcome, ${user?.fullName || user?.username || 'Trainee'}`}
      description="Operational preparedness status, completed training simulations, and real-time competency evaluations."
      action={
        <Link to="/scenarios">
          <Button variant="primary" size="sm">
            <Compass className="w-4 h-4 mr-1.5" />
            Explore Scenarios
          </Button>
        </Link>
      }
    >
      {error && (
        <div className="p-3 bg-semantic-danger-subtle border border-[#ECCECE] rounded-md text-xs text-semantic-danger flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Card className="p-4">
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
            Completed Modules
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-2" />
          ) : (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {totalCompleted}
              </span>
              <span className="text-xs text-slate-400">runs</span>
            </div>
          )}
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-accent-blue" />
            <span>Passed: {passedCount}</span>
          </div>
        </Card>

        {/* Metric 2 */}
        <Card className="p-4">
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
            Pass Proficiency
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-2" />
          ) : (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {passRate}%
              </span>
              <span className="text-xs text-slate-400">rate</span>
            </div>
          )}
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <Target className="w-3 h-3 text-semantic-success" />
            <span>Avg score: {averageScore}%</span>
          </div>
        </Card>

        {/* Metric 3 */}
        <Card className="p-4">
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
            Total Points
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-2" />
          ) : (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold tracking-tight text-brand-navy font-mono">
                {user?.totalPoints ?? 0}
              </span>
              <span className="text-xs text-slate-400">pts</span>
            </div>
          )}
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <Trophy className="w-3 h-3 text-semantic-warning" />
            <span>Rank points</span>
          </div>
        </Card>

        {/* Metric 4 */}
        <Card className="p-4">
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
            Trainee Level
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-2" />
          ) : (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                Lvl {user?.level ?? 1}
              </span>
              <span className="text-xs text-slate-400">Tier</span>
            </div>
          )}
          <div className="text-[11px] text-slate-500 mt-2">
            <span>Next tier in {100 - ((user?.totalPoints ?? 0) % 100)} pts</span>
          </div>
        </Card>
      </div>

      {/* Main Grid: Performance Chart & Recommended Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 span): Recent Performance Evaluation */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Evaluation Trajectory</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Recent simulation assessment scores across completed scenarios
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Threshold: 70%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : chartData.length > 0 ? (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        fontSize: '12px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      }}
                      formatter={(val: number) => [`${val}% Score`, 'Result']}
                    />
                    <Bar
                      dataKey="score"
                      fill="#243B53"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-md text-center p-6">
                <Target className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-700">No Simulation Data Recorded Yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Complete your first training scenario to generate evaluation benchmarks and AI feedback.
                </p>
                <Link to="/scenarios" className="mt-3">
                  <Button variant="secondary" size="sm">
                    Start Simulation
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column (1 span): Recommended Scenarios */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recommended Training</CardTitle>
              <Link
                to="/scenarios"
                className="text-xs text-accent-blue hover:text-accent-blue-hover font-medium flex items-center gap-1"
              >
                All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : scenarios.length > 0 ? (
              scenarios.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-md space-y-2 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900 leading-snug">
                      {item.title}
                    </span>
                    <Badge variant="brand" size="sm">
                      {item.difficulty}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.estimatedDuration ?? 5}m
                    </span>
                    <Link
                      to={`/scenarios/${item.id}`}
                      className="text-accent-blue hover:text-brand-navy font-sans font-medium"
                    >
                      Launch →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                No published scenarios available.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Simulation Runs List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Simulation History</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit log of completed simulations and evaluation scores
              </p>
            </div>
            <Link
              to="/attempts"
              className="text-xs text-accent-blue hover:text-accent-blue-hover font-medium flex items-center gap-1"
            >
              Full Log <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : completedAttempts.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {completedAttempts.slice(0, 4).map((att) => {
                const isPassed = att.score >= 70;
                return (
                  <div
                    key={att.id}
                    className="py-3 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isPassed ? 'bg-semantic-success' : 'bg-semantic-danger'
                        }`}
                      />
                      <div className="min-w-0">
                        <span className="font-medium text-slate-900 truncate block">
                          {att.scenario?.title || 'Emergency Scenario'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {att.completedAt
                            ? new Date(att.completedAt).toLocaleDateString()
                            : 'Recently'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 font-mono">
                      <span className="font-semibold text-slate-800">
                        {att.score}%
                      </span>
                      <Badge variant={isPassed ? 'success' : 'danger'} size="sm">
                        {isPassed ? 'Passed' : 'Failed'}
                      </Badge>
                      <Link
                        to={`/attempts/${att.id}`}
                        className="text-accent-blue hover:underline font-sans"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">
              No recent attempts found. Start with the Earthquake Safety Training module.
            </p>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
};
