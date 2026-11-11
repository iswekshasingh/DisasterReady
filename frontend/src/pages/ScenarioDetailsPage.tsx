import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Target,
  CheckCircle2,
  Play,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { scenarioService } from '@/api/scenario.service';
import { ScenarioDetail } from '@/types/scenario.types';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

export const ScenarioDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [scenario, setScenario] = useState<ScenarioDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchScenario = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const res = await scenarioService.getScenarioById(id);
        if (isMounted) {
          setScenario(res.scenario);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const axiosError = err as { response?: { data?: { message?: string } } };
          setError(axiosError.response?.data?.message || 'Scenario not found or unavailable.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchScenario();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4 max-w-4xl mx-auto">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-40 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (error || !scenario) {
    return (
      <PageContainer>
        <div className="max-w-md mx-auto text-center py-16">
          <AlertCircle className="w-8 h-8 text-semantic-danger mx-auto mb-2" />
          <h2 className="text-sm font-semibold text-slate-900">Scenario Unavailable</h2>
          <p className="text-xs text-slate-500 mt-1">{error || 'Unable to load module.'}</p>
          <Link to="/scenarios" className="mt-4 inline-block">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Scenarios
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb / Back Link */}
        <div>
          <Link
            to="/scenarios"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back to All Scenarios
          </Link>
        </div>

        {/* Hero Section */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                {scenario.disasterType.replace(/_/g, ' ')}
              </span>
              <span className="text-slate-300">·</span>
              <Badge variant="brand" size="sm">
                {scenario.difficulty}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {scenario.estimatedDuration ?? 5} min
              </span>
              <span className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-slate-400" />
                Passing: {scenario.passingScore}%
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {scenario.title}
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {scenario.description}
            </p>
          </div>

          {/* Launch Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500 font-mono">
              Assessment: {scenario.questions?.length ?? 0} decision points · {scenario.maxScore} max points
            </div>
            <Link to={`/scenarios/${scenario.id}/run`}>
              <Button variant="primary" size="md">
                <Play className="w-4 h-4 mr-2 fill-current" />
                Begin Simulation Assessment
              </Button>
            </Link>
          </div>
        </div>

        {/* Operational Instructions & Objectives */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 space-y-4">
            <CardHeader>
              <CardTitle>Training Instructions & Protocol</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600 leading-relaxed">
              {scenario.instructions ? (
                <div className="p-3 bg-slate-50 rounded border border-slate-200/80 font-mono text-[11px] text-slate-700">
                  {scenario.instructions}
                </div>
              ) : (
                <p>
                  Respond to each emergency situation promptly by evaluating immediate life safety, structural hazards, and evacuation routes.
                </p>
              )}

              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold text-slate-900">Protocol Requirements:</h4>
                <ul className="space-y-2 list-none pl-0">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-semantic-success shrink-0 mt-0.5" />
                    <span>Every emergency question must be answered to calculate your readiness rating.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-semantic-success shrink-0 mt-0.5" />
                    <span>Scoring is calculated securely server-side; 70% or higher is required to pass.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-semantic-success shrink-0 mt-0.5" />
                    <span>Post-simulation feedback will provide safety rationales for each decision.</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Questions Summary Column */}
          <Card className="space-y-4">
            <CardHeader>
              <CardTitle>Evaluation Criteria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-slate-50 rounded border border-slate-200/80 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Total Scenarios:</span>
                  <span className="font-mono font-medium text-slate-900">
                    {scenario.questions?.length ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Max Score:</span>
                  <span className="font-mono font-medium text-slate-900">
                    {scenario.maxScore} pts
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Pass Benchmark:</span>
                  <span className="font-mono font-medium text-semantic-success">
                    {scenario.passingScore} pts
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-start gap-1.5 pt-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Points earned are recorded to your trainee profile and contribute to global leaderboard rankings.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
