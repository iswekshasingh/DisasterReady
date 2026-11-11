import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Target,
  Play,
  Gamepad2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { scenarioApi } from '@/api/scenarios';
import { Scenario } from '@/types';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Table';

export const ScenarioDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (id) {
      scenarioApi.getById(id).then((sc) => {
        if (active) {
          setScenario(sc);
          setIsLoading(false);
        }
      }).catch((err) => {
        if (active) {
          setError(err.response?.data?.message || 'Scenario not found.');
          setIsLoading(false);
        }
      });
    }
    return () => {
      active = false;
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
          <AlertCircle className="w-8 h-8 text-safety-red mx-auto mb-2" />
          <h2 className="text-sm font-semibold text-slate-900">Scenario Unavailable</h2>
          <p className="text-xs text-slate-500 mt-1">{error || 'Could not load scenario briefing.'}</p>
          <Link to="/scenarios" className="mt-4 inline-block">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Catalog
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link
            to="/scenarios"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back to Scenarios
          </Link>
        </div>

        {/* Hero Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                {scenario.disasterType}
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
                Passing Score: {scenario.passingScore}%
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {scenario.title}
            </h1>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {scenario.description}
            </p>
          </div>

          {/* Launch Strip */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-mono">
              Drill Complexity: {scenario.questions?.length ?? 3} decision beats · {scenario.maxScore} max pts
            </span>

            <div className="flex items-center gap-2">
              <Link to={`/scenarios/${scenario.id}/run`}>
                <Button variant="primary" size="md">
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Launch In-Browser Drill
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Instructions & Guidelines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 space-y-4">
            <CardHeader>
              <CardTitle>Standard Operational Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600 leading-relaxed">
              {scenario.instructions ? (
                <div className="p-3 bg-slate-50 rounded border border-slate-200/80 font-mono text-[11px] text-slate-700">
                  {scenario.instructions}
                </div>
              ) : (
                <p>
                  Respond immediately to incoming seismic alerts and environmental changes. Evaluate structural integrity, avoid elevator hazards, and protect vital body areas.
                </p>
              )}

              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-900">Simulation Protocol:</h4>
                <ul className="space-y-2 list-none pl-0">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-safety-green shrink-0 mt-0.5" />
                    <span>Every emergency question must be addressed to evaluate your readiness.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-safety-green shrink-0 mt-0.5" />
                    <span>Scoring is evaluated server-side and recorded to your global profile.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-safety-green shrink-0 mt-0.5" />
                    <span>Detailed post-drill rationales provide verified life-safety doctrines.</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Unity Client Card */}
          <Card className="space-y-4">
            <CardHeader>
              <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                <Gamepad2 className="w-4 h-4 text-brand-blue" />
                <span>Unity 2D Game Client</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                You can also run this exact simulation inside the Unity 2D environment with character animations, dynamic debris physics, and audio cues:
              </p>
              <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded font-mono text-[11px] text-slate-700 space-y-1">
                <div>1. Open Unity Editor</div>
                <div>2. Load <code className="text-brand-blue">SampleScene.unity</code></div>
                <div>3. Press Play (▶)</div>
              </div>
              <div className="flex items-start gap-1.5 text-[11px] text-slate-400">
                <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Scores from both Web and Unity sync to the same backend leaderboard.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
