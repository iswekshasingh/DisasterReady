import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { scenarioService } from '@/api/scenario.service';
import { attemptService } from '@/api/attempt.service';
import { useAuth } from '@/context/AuthContext';
import { ScenarioDetail } from '@/types/scenario.types';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/cn';

export const SimulationRunPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateUserStats } = useAuth();

  const [scenario, setScenario] = useState<ScenarioDetail | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch scenario details
  useEffect(() => {
    let isMounted = true;
    const loadScenario = async () => {
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
          setError(axiosError.response?.data?.message || 'Failed to load scenario.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadScenario();
    return () => {
      isMounted = false;
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
          <AlertCircle className="w-8 h-8 text-semantic-danger mx-auto mb-2" />
          <h2 className="text-sm font-semibold text-slate-900">Simulation Unavailable</h2>
          <p className="text-xs text-slate-500 mt-1">{error || 'No questions found for this scenario.'}</p>
          <Link to="/scenarios" className="mt-4 inline-block">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Scenarios
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const questions = scenario.questions;
  const currentQ = questions[currentStep];
  const totalQuestions = questions.length;
  const isLastQuestion = currentStep === totalQuestions - 1;

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = questions.every((q) => !!selectedAnswers[q.questionId]);

  const handleSubmit = async () => {
    if (!allAnswered) {
      setError('Please provide a decision for all scenarios before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const answersPayload = questions.map((q) => ({
      questionId: q.questionId,
      selectedOptionId: selectedAnswers[q.questionId],
    }));

    try {
      const response = await attemptService.submitAttempt({
        scenarioId: scenario.id,
        answers: answersPayload,
        timeSpent,
      });

      // Update local profile stats with points earned
      if (response.attempt.score > 0) {
        updateUserStats(response.attempt.score);
      }

      // Store evaluation results in sessionStorage for immediate review
      sessionStorage.setItem(
        `attempt_${response.attempt.id}`,
        JSON.stringify({
          ...response.attempt,
          scenarioTitle: scenario.title,
          disasterType: scenario.disasterType,
          timeSpent,
        })
      );

      navigate(`/attempts/${response.attempt.id}`);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to submit simulation attempt.');
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Strip with Timer and Progress */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              to={`/scenarios/${scenario.id}`}
              className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Abort
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-semibold text-slate-900">
              {scenario.title}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {formatTimer(timeSpent)}
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

        {error && (
          <div className="p-3 bg-semantic-danger-subtle border border-[#ECCECE] rounded-md text-xs text-semantic-danger flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Question Card */}
        <Card className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>DECISION POINT {currentStep + 1} OF {totalQuestions}</span>
            <span>{currentQ.points} POINTS</span>
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900 leading-snug">
              {currentQ.question}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select the safest emergency response action:
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt) => {
              const isSelected = selectedAnswers[currentQ.questionId] === opt.optionId;
              return (
                <button
                  key={opt.optionId}
                  type="button"
                  onClick={() => handleSelectOption(currentQ.questionId, opt.optionId)}
                  className={cn(
                    'w-full text-left p-3.5 rounded-md border text-xs transition-colors flex items-start gap-3',
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

          {/* Stepper Navigation */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Previous
            </Button>

            {isLastQuestion ? (
              <Button
                variant="primary"
                size="sm"
                disabled={!allAnswered || isSubmitting}
                isLoading={isSubmitting}
                onClick={handleSubmit}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Submit Simulation
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCurrentStep((prev) => Math.min(totalQuestions - 1, prev + 1))}
              >
                Next <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>
        </Card>

        {/* Trainee Notice */}
        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 justify-center">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Responses are recorded securely and evaluated by DisasterReady protocol standards.</span>
        </div>
      </div>
    </PageContainer>
  );
};
