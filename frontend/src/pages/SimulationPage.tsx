import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { scenarioApi } from '@/api/scenarios';
import { attemptApi } from '@/api/attempts';
import { useAuth } from '@/context/AuthContext';
import { Scenario } from '@/types';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Table';
import { cn } from '@/utils/cn';

export const SimulationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { incrementPoints } = useAuth();

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Scenario
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
          setError(err.response?.data?.message || 'Failed to load simulation.');
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
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-48 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (error || !scenario || !scenario.questions || scenario.questions.length === 0) {
    return (
      <PageContainer>
        <div className="max-w-md mx-auto text-center py-16">
          <AlertCircle className="w-8 h-8 text-safety-red mx-auto mb-2" />
          <h2 className="text-sm font-semibold text-slate-900">Drill Unavailable</h2>
          <p className="text-xs text-slate-500 mt-1">{error || 'No questions found for this scenario.'}</p>
          <Link to="/scenarios" className="mt-4 inline-block">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Catalog
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const questions = scenario.questions;
  const currentQ = questions[currentStep];
  const totalQuestions = questions.length;
  const isFinalStep = currentStep === totalQuestions - 1;

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const allAnswered = questions.every((q) => !!selectedAnswers[q.questionId]);
  const answeredCount = Object.keys(selectedAnswers).length;

  const handleSubmit = async () => {
    if (!allAnswered) {
      setError('Please select an action for each situation before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const answersPayload = questions.map((q) => ({
      questionId: q.questionId,
      selectedOptionId: selectedAnswers[q.questionId],
    }));

    try {
      const result = await attemptApi.submit({
        scenarioId: scenario.id,
        answers: answersPayload,
        timeSpent: secondsElapsed,
      });

      if (result.score > 0) {
        incrementPoints(result.score);
      }

      // Store in session storage for immediate results review
      sessionStorage.setItem(
        `attempt_${result.id}`,
        JSON.stringify({
          ...result,
          scenarioTitle: scenario.title,
          disasterType: scenario.disasterType,
          timeSpent: secondsElapsed,
        })
      );

      navigate(`/attempts/${result.id}`);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to submit simulation.');
      setIsSubmitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Status Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Link
              to={`/scenarios/${scenario.id}`}
              className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Abort Drill
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-bold text-slate-900 truncate">
              {scenario.title}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {formatTimer(secondsElapsed)}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
              {answeredCount}/{totalQuestions} Answered
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-brand-navy h-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Warning Banner */}
        <div className="p-3 bg-safety-amber-subtle border border-amber-200 rounded-md flex items-center gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-safety-amber shrink-0" />
          <span>
            <strong>Simulated Emergency Alert:</strong> Evaluate structural risks and select the safest life-preservation action immediately.
          </span>
        </div>

        {error && (
          <div className="p-3 bg-safety-red-subtle border border-red-200 rounded-md text-xs text-safety-red flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Decision Card */}
        <Card className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>SITUATION BEAT {currentStep + 1} OF {totalQuestions}</span>
            <span>{currentQ.points} PTS BENCHMARK</span>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 leading-snug">
              {currentQ.question}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select your immediate tactical response:
            </p>
          </div>

          {/* Option list */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt) => {
              const isSelected = selectedAnswers[currentQ.questionId] === opt.optionId;
              return (
                <button
                  key={opt.optionId}
                  type="button"
                  onClick={() => handleSelectOption(currentQ.questionId, opt.optionId)}
                  className={cn(
                    'w-full text-left p-3.5 rounded-md border text-xs transition-colors flex items-start gap-3 select-none',
                    isSelected
                      ? 'border-brand-navy bg-slate-50/90 font-medium text-slate-900 ring-1 ring-brand-navy'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  )}
                >
                  <span
                    className={cn(
                      'w-5 h-5 rounded-full border text-[11px] font-mono flex items-center justify-center shrink-0 mt-0.5',
                      isSelected
                        ? 'border-brand-navy bg-brand-navy text-white font-semibold'
                        : 'border-slate-300 text-slate-500'
                    )}
                  >
                    {opt.optionId}
                  </span>
                  <span className="flex-1 leading-relaxed">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Nav buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Previous Beat
            </Button>

            {isFinalStep ? (
              <Button
                variant="primary"
                size="sm"
                disabled={!allAnswered || isSubmitting}
                isLoading={isSubmitting}
                onClick={handleSubmit}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Submit for Evaluation
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCurrentStep((prev) => Math.min(totalQuestions - 1, prev + 1))}
              >
                Next Beat <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>
        </Card>

        <div className="text-[11px] text-slate-400 font-mono text-center flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          <span>Responses are verified and graded according to standard civil defense protocols.</span>
        </div>
      </div>
    </PageContainer>
  );
};
