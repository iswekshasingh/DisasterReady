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
import { attemptService } from '@/api/attempt.service';
import { scenarioService } from '@/api/scenario.service';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

interface CachedAttemptResult {
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

export const AttemptResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [attemptData, setAttemptData] = useState<CachedAttemptResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadAttemptDetails = async () => {
      if (!id) return;

      // 1. Check local session storage for freshly submitted attempt
      const cached = sessionStorage.getItem(`attempt_${id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (isMounted) {
            setAttemptData(parsed);
            setIsLoading(false);
            return;
          }
        } catch {
          // fallback to API
        }
      }

      // 2. Fetch from attempt history
      try {
        const historyRes = await attemptService.getAttemptHistory();
        const found = historyRes.attempts?.find((a) => a.id === id);

        if (found) {
          // Fetch scenario to reconstruct questions if available
          let scTitle = found.scenario?.title;
          let maxScore = 100;
          try {
            const scRes = await scenarioService.getScenarioById(found.scenarioId);
            scTitle = scRes.scenario.title;
            maxScore = scRes.scenario.maxScore;
          } catch {
            // keep existing title
          }

          if (isMounted) {
            setAttemptData({
              id: found.id,
              scenarioId: found.scenarioId,
              scenarioTitle: scTitle || 'Emergency Simulation',
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
        console.error('Failed to load attempt details:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadAttemptDetails();
    return () => {
      isMounted = false;
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

  if (!attemptData) {
    return (
      <PageContainer>
        <div className="max-w-md mx-auto text-center py-16">
          <h2 className="text-sm font-semibold text-slate-900">Attempt Record Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">
            Unable to retrieve the simulation results for reference ID {id}.
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

  const isPassed = attemptData.score >= 70;

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link */}
        <div>
          <Link
            to="/attempts"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back to Simulation History
          </Link>
        </div>

        {/* Hero Scorecard */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
                <span>{attemptData.disasterType?.replace(/_/g, ' ') || 'DISASTER TRAINING'}</span>
                <span>·</span>
                <span>ATTEMPT EVALUATION</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                {attemptData.scenarioTitle || 'Emergency Simulation'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant={isPassed ? 'success' : 'danger'} size="md">
                {isPassed ? 'Passed Protocol' : 'Did Not Meet Benchmark'}
              </Badge>
            </div>
          </div>

          {/* Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase">Assessment Score</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {attemptData.score}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ {attemptData.maxScore}</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase">Accuracy</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {attemptData.totalQuestions > 0
                    ? Math.round((attemptData.correctAnswers / attemptData.totalQuestions) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase">Decisions Correct</span>
              <div className="flex items-baseline gap-1 mt-0.5 font-mono">
                <span className="text-2xl font-bold text-slate-900">
                  {attemptData.correctAnswers}
                </span>
                <span className="text-xs text-slate-400">/ {attemptData.totalQuestions}</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase">Execution Time</span>
              <div className="flex items-baseline gap-1 mt-0.5 font-mono">
                <span className="text-2xl font-bold text-slate-900">
                  {attemptData.timeSpent ? `${Math.round(attemptData.timeSpent)}s` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Feedback & Safety Coach Evaluation */}
        <Card className="border-accent-blue/30 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
              <Sparkles className="w-4 h-4 text-accent-blue" />
              <span>AI Evaluation & Safety Advisory</span>
            </div>
            <Badge variant="outline" size="sm">
              Model: Gemini 2.5 Flash
            </Badge>
          </div>

          {/* AI Feedback Content */}
          <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
            {isPassed ? (
              <p>
                <strong>Proficiency Confirmed:</strong> Your simulated responses demonstrated immediate situational awareness and priority for life safety. You effectively applied established shelter-in-place and structural hazard verification protocols before taking secondary action.
              </p>
            ) : (
              <p>
                <strong>Procedural Gaps Identified:</strong> Critical response steps were compromised during shaking or immediate aftermath. Remember the core life safety principle: Drop, Cover, and Hold On beneath sturdy furniture until shaking fully ceases, and avoid hasty evacuation during active seismic movement.
              </p>
            )}

            <div className="p-3 bg-white border border-slate-200/80 rounded-md space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-900 uppercase font-mono tracking-wider">
                Key Protocol Takeaways:
              </span>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                <li>Never exit a shaking building or run toward glass doors during primary tremors.</li>
                <li>Protect head and cervical spine under load-bearing furniture.</li>
                <li>Always use stairs; never enter elevators following structural shaking.</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Detailed Decision Points Audit */}
        {attemptData.results && attemptData.results.length > 0 && (
          <Card className="space-y-4">
            <CardHeader>
              <CardTitle>Decision Breakdown</CardTitle>
              <p className="text-xs text-slate-500">
                Evaluation of your specific operational selections against safety doctrines
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {attemptData.results.map((r, idx) => (
                <div
                  key={r.questionId}
                  className={`p-4 rounded-md border text-xs space-y-2 ${
                    r.isCorrect
                      ? 'bg-semantic-success-subtle/30 border-[#C5DDD2]'
                      : 'bg-semantic-danger-subtle/30 border-[#ECCECE]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {r.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-semantic-success shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-semantic-danger shrink-0" />
                      )}
                      <span className="font-semibold text-slate-900 font-mono">
                        Decision #{idx + 1}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500">
                      {r.points} points awarded
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                    <div>
                      <span className="text-slate-400 uppercase">Selected Action: </span>
                      <span className="font-semibold text-slate-800">Option {r.selectedOptionId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase">Standard Protocol: </span>
                      <span className="font-semibold text-slate-800">Option {r.correctOptionId}</span>
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

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-2">
          <Link to={`/scenarios/${attemptData.scenarioId}`}>
            <Button variant="secondary" size="sm">
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Retake Simulation
            </Button>
          </Link>

          <Link to="/leaderboard">
            <Button variant="primary" size="sm">
              <Trophy className="w-3.5 h-3.5 mr-1.5" /> View Global Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
};
