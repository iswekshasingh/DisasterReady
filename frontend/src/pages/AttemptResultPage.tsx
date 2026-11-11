import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { attemptApi } from '@/api/attempts';
import { scenarioApi } from '@/api/scenarios';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Table';

interface AttemptData {
  id: string;
  scenarioId: string;
  scenarioTitle?: string;
  disasterType?: string;
  score: number;
  maxScore: number;
  correctAnswers: number;
  totalQuestions: number;
  passed: boolean;
  timeSpent?: number;
  results?: Array<{
    questionId: string;
    selectedOptionId: string;
    correctOptionId: string;
    isCorrect: boolean;
    points: number;
    explanation: string;
  }>;
}

export const AttemptResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AttemptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!id) return;

      // 1. Check local session storage
      const cached = sessionStorage.getItem(`attempt_${id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (active) {
            setData(parsed);
            setIsLoading(false);
            return;
          }
        } catch {
          // fallback to API
        }
      }

      // 2. Fetch from attempt history API
      try {
        const history = await attemptApi.getHistory();
        const found = history.find((h) => h.id === id);
        if (found) {
          let title = found.scenario?.title || 'Emergency Drill';
          let maxScore = 100;
          try {
            const sc = await scenarioApi.getById(found.scenarioId);
            title = sc.title;
            maxScore = sc.maxScore;
          } catch {
            // fallback to existing
          }

          if (active) {
            setData({
              id: found.id,
              scenarioId: found.scenarioId,
              scenarioTitle: title,
              disasterType: found.scenario?.disasterType,
              score: found.score,
              maxScore,
              correctAnswers: Math.round((found.score / maxScore) * (found.userChoices?.length || 3)),
              totalQuestions: found.userChoices?.length || 3,
              passed: found.score >= 70,
              timeSpent: found.timeSpent || undefined,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load result:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer>
        <div className="max-w-md mx-auto text-center py-16">
          <h2 className="text-sm font-semibold text-slate-900">Attempt Record Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">
            Could not locate results for reference ID {id}.
          </p>
          <Link to="/attempts" className="mt-4 inline-block">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> View History
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const passed = data.score >= 70;

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link
            to="/attempts"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back to Incident History
          </Link>
        </div>

        {/* Scorecard Hero */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <span>{data.disasterType || 'DISASTER DRILL'}</span>
                <span>·</span>
                <span>AFTER-ACTION REPORT</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                {data.scenarioTitle || 'Emergency Drill Evaluation'}
              </h1>
            </div>

            <Badge variant={passed ? 'success' : 'danger'} size="md">
              {passed ? 'Passed Standard Protocol' : 'Did Not Meet Benchmark'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 font-mono">
            <div>
              <span className="text-[11px] text-slate-400 uppercase">Score Awarded</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold text-slate-900">{data.score}</span>
                <span className="text-xs text-slate-400">/ {data.maxScore}</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 uppercase">Correct Actions</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold text-slate-900">{data.correctAnswers}</span>
                <span className="text-xs text-slate-400">/ {data.totalQuestions}</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 uppercase">Survival Accuracy</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold text-slate-900">
                  {data.totalQuestions > 0
                    ? Math.round((data.correctAnswers / data.totalQuestions) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 uppercase">Execution Time</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold text-slate-900">
                  {data.timeSpent ? `${Math.round(data.timeSpent)}s` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI & Tactical Safety Advisory */}
        <Card className="border-brand-blue/30 bg-slate-50/60 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Sparkles className="w-4 h-4 text-brand-blue" />
              <span>AI Evaluation & Safety Advisory</span>
            </div>
            <Badge variant="outline" size="sm">
              Standard Doctrine: Drop, Cover, Hold On
            </Badge>
          </div>

          <div className="text-xs text-slate-700 space-y-2.5 leading-relaxed">
            {passed ? (
              <p>
                <strong>Operational Readiness Confirmed:</strong> You made sound, life-preserving decisions during active shaking. Shielding head and torso beneath sturdy furniture and utilizing stairways for egress prevented lethal blunt-force trauma from falling ceiling debris.
              </p>
            ) : (
              <p>
                <strong>Critical Procedural Errors Detected:</strong> Running outdoors or abandoning cover while ground tremors are active dramatically increases the chance of severe injury from falling architectural elements and broken glass. Always remain in shelter until tremors conclude.
              </p>
            )}

            <div className="p-3 bg-white border border-slate-200 rounded font-mono text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-900 uppercase">Key Safety Reminders:</span>
              <div>1. Drop, Cover, and Hold On beneath load-bearing furniture.</div>
              <div>2. Stay away from exterior walls, windows, and heavy hanging light fixtures.</div>
              <div>3. Never enter elevators following tremors; exit via marked emergency stairwells.</div>
            </div>
          </div>
        </Card>

        {/* Decision Breakdown */}
        {data.results && data.results.length > 0 && (
          <Card className="space-y-4">
            <CardHeader>
              <CardTitle>Decision Breakdown</CardTitle>
              <p className="text-xs text-slate-500">
                Audit of chosen actions against verified emergency standards
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.results.map((r, i) => (
                <div
                  key={r.questionId}
                  className={`p-3.5 rounded-md border text-xs space-y-2 ${
                    r.isCorrect
                      ? 'bg-safety-green-subtle border-green-200'
                      : 'bg-safety-red-subtle border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2">
                      {r.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-safety-green shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-safety-red shrink-0" />
                      )}
                      <span className="font-bold text-slate-900">
                        Beat #{i + 1}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {r.points} points awarded
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                    <div>
                      <span className="text-slate-400">Chosen: </span>
                      <span className="font-bold text-slate-800">Option {r.selectedOptionId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Standard Safe: </span>
                      <span className="font-bold text-slate-800">Option {r.correctOptionId}</span>
                    </div>
                  </div>

                  <p className="text-slate-600 pt-1 text-[11px] border-t border-slate-200/50 leading-relaxed">
                    <strong className="text-slate-700">Safety Rationale: </strong>
                    {r.explanation}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-2">
          <Link to={`/scenarios/${data.scenarioId}`}>
            <Button variant="secondary" size="sm">
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Retake Simulation
            </Button>
          </Link>

          <Link to="/leaderboard">
            <Button variant="primary" size="sm">
              <Trophy className="w-3.5 h-3.5 mr-1.5" /> View Standings
            </Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
};
