import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { attemptApi } from '@/api/attempts';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

interface SimulationStageProps {
  scenarioId?: string;
  onFinish?: (attemptId: string) => void;
  className?: string;
}

type CharacterState = 'idle' | 'hiding' | 'running' | 'hurt';
type StagePhase = 'intro' | 'beat1' | 'beat2' | 'beat3' | 'completed';

export const SimulationStage: React.FC<SimulationStageProps> = ({
  scenarioId = '29cadb00-e475-4362-ae3b-5c3ff67687db',
  onFinish,
  className,
}) => {
  const { incrementPoints } = useAuth();

  // Stage states
  const [phase, setPhase] = useState<StagePhase>('intro');
  const [characterState, setCharacterState] = useState<CharacterState>('idle');
  const [isDamagedRoom, setIsDamagedRoom] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isAlertBorder, setIsAlertBorder] = useState(false);
  const [debrisFalling, setDebrisFalling] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Score & Evaluation
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    maxScore: number;
    passed: boolean;
    attemptId: string;
  } | null>(null);

  // Audio elements
  const sirenRef = useRef<HTMLAudioElement | null>(null);
  const rumbleRef = useRef<HTMLAudioElement | null>(null);
  const crashRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    sirenRef.current = new Audio('/game/audio/siren.mp3');
    rumbleRef.current = new Audio('/game/audio/rumble.mp3');
    crashRef.current = new Audio('/game/audio/debris_crash.mp3');

    if (sirenRef.current) sirenRef.current.loop = true;
    if (rumbleRef.current) rumbleRef.current.loop = true;

    return () => {
      stopAllAudio();
    };
  }, []);

  // Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase !== 'intro' && phase !== 'completed') {
      timer = setInterval(() => {
        setTimeSpent((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase]);

  const stopAllAudio = () => {
    if (sirenRef.current) {
      sirenRef.current.pause();
      sirenRef.current.currentTime = 0;
    }
    if (rumbleRef.current) {
      rumbleRef.current.pause();
      rumbleRef.current.currentTime = 0;
    }
    if (crashRef.current) {
      crashRef.current.pause();
      crashRef.current.currentTime = 0;
    }
  };

  const playSiren = () => {
    if (soundEnabled && sirenRef.current) {
      sirenRef.current.play().catch(() => {});
    }
  };

  const playRumble = () => {
    if (soundEnabled && rumbleRef.current) {
      rumbleRef.current.play().catch(() => {});
    }
  };

  const playCrash = () => {
    if (soundEnabled && crashRef.current) {
      crashRef.current.play().catch(() => {});
    }
  };

  // Phase Transitions
  const handleStart = () => {
    setPhase('beat1');
    setCharacterState('idle');
    setIsDamagedRoom(false);
    setIsShaking(false);
    setIsAlertBorder(true);
    setDebrisFalling(false);
    setTimeSpent(0);
    setSelectedAnswers({});
    setResult(null);
    playSiren();
  };

  const handleBeat1Choice = (choiceId: string) => {
    const updated = { ...selectedAnswers, EQ_Q1: choiceId };
    setSelectedAnswers(updated);

    // Stop siren, start earthquake rumble & camera shake!
    if (sirenRef.current) sirenRef.current.pause();
    playRumble();
    setIsShaking(true);
    setIsDamagedRoom(true);
    setIsAlertBorder(false);

    if (choiceId === 'B') {
      // Option B in seed: Drop, Cover and Hold On
      setCharacterState('hiding');
    } else {
      // Option A: Running outside
      setCharacterState('running');
    }

    // Trigger falling debris after 0.6s
    setTimeout(() => {
      setDebrisFalling(true);
      playCrash();
      if (choiceId !== 'B') {
        setCharacterState('hurt');
      }
    }, 700);

    // Advance to Beat 2 prompt after 1.8s
    setTimeout(() => {
      setPhase('beat2');
    }, 1800);
  };

  const handleBeat2Choice = (choiceId: string) => {
    const updated = { ...selectedAnswers, EQ_Q2: choiceId };
    setSelectedAnswers(updated);

    // If chose safe in Q2 (Option C: stay under cover)
    if (choiceId === 'C') {
      setCharacterState('hiding');
    } else {
      setCharacterState('hurt');
    }

    // Tremor subsides! Stop rumble & stop camera shake
    setTimeout(() => {
      if (rumbleRef.current) rumbleRef.current.pause();
      setIsShaking(false);
      setPhase('beat3');
    }, 1200);
  };

  const handleBeat3Choice = async (choiceId: string) => {
    const finalAnswers: Record<string, string> = { ...selectedAnswers, EQ_Q3: choiceId };
    setSelectedAnswers(finalAnswers);
    setIsSubmitting(true);

    const answersPayload = [
      { questionId: 'EQ_Q1', selectedOptionId: finalAnswers.EQ_Q1 || 'B' },
      { questionId: 'EQ_Q2', selectedOptionId: finalAnswers.EQ_Q2 || 'C' },
      { questionId: 'EQ_Q3', selectedOptionId: choiceId },
    ];

    try {
      const res = await attemptApi.submit({
        scenarioId,
        answers: answersPayload,
        timeSpent,
      });

      if (res.score > 0) {
        incrementPoints(res.score);
      }

      setResult({
        score: res.score,
        maxScore: res.maxScore,
        passed: res.passed,
        attemptId: res.id,
      });
      setPhase('completed');
    } catch {
      // Fallback offline calculation if backend temporarily unreachable
      const score = (finalAnswers.EQ_Q1 === 'B' ? 30 : 0) +
                    (finalAnswers.EQ_Q2 === 'C' ? 30 : 0) +
                    (choiceId === 'B' ? 40 : 0);
      setResult({
        score,
        maxScore: 100,
        passed: score >= 70,
        attemptId: 'offline-local',
      });
      setPhase('completed');
    } finally {
      setIsSubmitting(false);
      stopAllAudio();
    }
  };

  const getCharacterSprite = () => {
    switch (characterState) {
      case 'hiding':
        return '/game/sprites/character_hiding.png';
      case 'running':
        return '/game/sprites/character_run.png';
      case 'hurt':
        return '/game/sprites/character_hurt.png';
      case 'idle':
      default:
        return '/game/sprites/character_idle.png';
    }
  };

  return (
    <div
      className={cn(
        'relative w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-elevated select-none transition-all',
        isShaking && 'animate-shake',
        isAlertBorder && 'animate-alert',
        className
      )}
      style={{ aspectRatio: '16/9', maxHeight: '580px' }}
    >
      {/* 1. ROOM BACKGROUND (Normal vs Damaged) */}
      <img
        src={isDamagedRoom ? '/game/sprites/background_room_damaged.png' : '/game/sprites/background_room.png'}
        alt="Simulation Room"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
      />

      {/* Subtle lighting / vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/30 pointer-events-none" />

      {/* 2. TABLE (Shelter furniture) */}
      <div
        className="absolute transition-all duration-300"
        style={{
          bottom: '12%',
          left: '26%',
          width: '32%',
          maxWidth: '340px',
          zIndex: 10,
        }}
      >
        <img
          src="/game/sprites/table.png"
          alt="Safety Shelter Table"
          className="w-full object-contain filter drop-shadow-md"
        />
      </div>

      {/* 3. CHARACTER SPRITE */}
      <div
        className="absolute transition-all duration-500 ease-out"
        style={{
          bottom: characterState === 'hiding' ? '12%' : '14%',
          left:
            characterState === 'hiding'
              ? '33%'
              : characterState === 'running' || characterState === 'hurt'
              ? '75%'
              : '16%',
          width: characterState === 'hiding' ? '22%' : '15%',
          maxWidth: characterState === 'hiding' ? '220px' : '160px',
          zIndex: characterState === 'hiding' ? 5 : 15,
        }}
      >
        <img
          src={getCharacterSprite()}
          alt="Trainee Character"
          className="w-full object-contain filter drop-shadow-xl"
        />
      </div>

      {/* 4. FALLING CEILING DEBRIS */}
      {debrisFalling && (
        <div
          className="absolute pointer-events-none z-20 animate-debris"
          style={{
            top: '8%',
            left: characterState === 'hiding' ? '30%' : '72%',
            width: '28%',
            maxWidth: '240px',
          }}
        >
          <img
            src="/game/sprites/ceiling_debris.png"
            alt="Falling Debris"
            className="w-full object-contain filter drop-shadow-2xl"
          />
        </div>
      )}

      {/* 5. TOP HUD: Audio Toggle & Timer */}
      <div className="absolute top-3 inset-x-4 flex items-center justify-between z-30 pointer-events-auto">
        <div className="flex items-center gap-2">
          <Badge variant="brand" size="sm" className="bg-slate-900/80 border-slate-700 text-white font-mono">
            LIVE 2D SIMULATION
          </Badge>
          {phase !== 'intro' && (
            <span className="text-[11px] font-mono text-white/90 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
              ⏱ {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
            </span>
          )}
        </div>

        <button
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            if (!next) stopAllAudio();
          }}
          className="p-1.5 rounded-md bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 transition-colors"
          title={soundEnabled ? 'Mute Audio' : 'Enable Audio'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-brand-blue" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
        </button>
      </div>

      {/* 6. INTERACTIVE HUD / DECISION OVERLAYS */}

      {/* INTRO PHASE */}
      {phase === 'intro' && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-40">
          <div className="p-3 rounded-full bg-brand-navy/90 text-white mb-3 shadow-lg border border-slate-700">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Earthquake Survival Decision Drill
          </h2>
          <p className="text-xs text-slate-300 max-w-md mt-1 leading-relaxed">
            Experience real-time seismic alarms, falling structural debris, and survival decisions. Your tactical choices will animate the responder and grade your survival readiness.
          </p>

          <Button
            variant="accent"
            size="md"
            className="mt-5 px-6 font-semibold"
            onClick={handleStart}
          >
            <Play className="w-4 h-4 mr-2 fill-current" />
            Sound Alarm & Begin Simulation
          </Button>
        </div>
      )}

      {/* BEAT 1 OVERLAY */}
      {phase === 'beat1' && (
        <div className="absolute bottom-4 inset-x-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg p-4 z-40 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-safety-amber font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 animate-pulse" />
              SITUATION BEAT 1: EARLY WARNING ALERT
            </span>
            <span className="text-slate-400">DECISION POINT</span>
          </div>

          <h3 className="text-sm font-semibold text-white leading-snug">
            An earthquake suddenly begins! Shaking has started. What is your immediate action?
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleBeat1Choice('B')}
              className="p-3 rounded-md bg-brand-navy/80 hover:bg-brand-blue text-left border border-slate-700 hover:border-brand-blue transition-all group"
            >
              <span className="text-xs font-semibold text-white block group-hover:translate-x-0.5 transition-transform">
                Option B: Drop, Cover and Hold On under the table
              </span>
              <span className="text-[11px] text-slate-300">
                Protect head, neck, and vitals under sturdy furniture
              </span>
            </button>

            <button
              onClick={() => handleBeat1Choice('A')}
              className="p-3 rounded-md bg-brand-navy/80 hover:bg-safety-red text-left border border-slate-700 hover:border-safety-red transition-all group"
            >
              <span className="text-xs font-semibold text-white block group-hover:translate-x-0.5 transition-transform">
                Option A: Run towards the exit immediately
              </span>
              <span className="text-[11px] text-slate-300">
                Attempt to escape the building through the door
              </span>
            </button>
          </div>
        </div>
      )}

      {/* BEAT 2 OVERLAY */}
      {phase === 'beat2' && (
        <div className="absolute bottom-4 inset-x-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg p-4 z-40 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-safety-red font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
              SITUATION BEAT 2: VIOLENT TREMORS IN PROGRESS
            </span>
            <span className="text-slate-400">ACTIVE SHAKING</span>
          </div>

          <h3 className="text-sm font-semibold text-white leading-snug">
            Violent ground tremors continue and heavy concrete chunks are crashing down! What will you do?
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleBeat2Choice('C')}
              className="p-3 rounded-md bg-brand-navy/80 hover:bg-brand-blue text-left border border-slate-700 hover:border-brand-blue transition-all group"
            >
              <span className="text-xs font-semibold text-white block group-hover:translate-x-0.5 transition-transform">
                Option C: Stay under cover and protect head & neck
              </span>
              <span className="text-[11px] text-slate-300">
                Maintain position until shaking completely stops
              </span>
            </button>

            <button
              onClick={() => handleBeat2Choice('A')}
              className="p-3 rounded-md bg-brand-navy/80 hover:bg-safety-red text-left border border-slate-700 hover:border-safety-red transition-all group"
            >
              <span className="text-xs font-semibold text-white block group-hover:translate-x-0.5 transition-transform">
                Option A: Run around the room or toward windows
              </span>
              <span className="text-[11px] text-slate-300">
                Abandon shelter and move across the shaking room
              </span>
            </button>
          </div>
        </div>
      )}

      {/* BEAT 3 OVERLAY */}
      {phase === 'beat3' && (
        <div className="absolute bottom-4 inset-x-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg p-4 z-40 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-safety-green font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              SITUATION BEAT 3: POST-SHAKING EVACUATION
            </span>
            <span className="text-slate-400">FINAL DECISION</span>
          </div>

          <h3 className="text-sm font-semibold text-white leading-snug">
            The primary shaking has stopped. What is your safe evacuation procedure?
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              disabled={isSubmitting}
              onClick={() => handleBeat3Choice('B')}
              className="p-3 rounded-md bg-brand-navy/80 hover:bg-brand-blue text-left border border-slate-700 hover:border-brand-blue transition-all group disabled:opacity-50"
            >
              <span className="text-xs font-semibold text-white block group-hover:translate-x-0.5 transition-transform">
                Option B: Check for hazards & evacuate carefully using stairs
              </span>
              <span className="text-[11px] text-slate-300">
                Safe egress route avoiding mechanical elevator entrapment
              </span>
            </button>

            <button
              disabled={isSubmitting}
              onClick={() => handleBeat3Choice('A')}
              className="p-3 rounded-md bg-brand-navy/80 hover:bg-safety-red text-left border border-slate-700 hover:border-safety-red transition-all group disabled:opacity-50"
            >
              <span className="text-xs font-semibold text-white block group-hover:translate-x-0.5 transition-transform">
                Option A: Use the elevator immediately for fastest exit
              </span>
              <span className="text-[11px] text-slate-300">
                Attempt to take the lift down during potential aftershocks
              </span>
            </button>
          </div>
        </div>
      )}

      {/* COMPLETED RESULT OVERLAY */}
      {phase === 'completed' && result && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 border ${
              result.passed
                ? 'bg-safety-green/20 border-safety-green text-safety-green'
                : 'bg-safety-red/20 border-safety-red text-safety-red'
            }`}
          >
            {result.passed ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            {result.passed ? 'Drill Completed — Life Preserved' : 'Drill Completed — Critical Hazards Encountered'}
          </h2>

          <div className="flex items-center gap-3 my-3">
            <div className="px-3 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-sm text-white">
              Score: <span className="font-bold text-brand-blue">{result.score}</span> / {result.maxScore}
            </div>
            <Badge variant={result.passed ? 'success' : 'danger'} size="md">
              {result.passed ? 'Passed Standard' : 'Below Benchmark'}
            </Badge>
          </div>

          <p className="text-xs text-slate-300 max-w-sm mb-4 leading-relaxed">
            {result.passed
              ? 'Excellent tactical judgment! Drop, Cover, and Hold On beneath load-bearing furniture protected your cervical spine and vital organs.'
              : 'Remember: Never run during active shaking or use elevators after a tremor. Always seek sturdy cover and take stairs.'}
          </p>

          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={handleStart}>
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Replay Drill
            </Button>

            {onFinish && (
              <Button
                variant="accent"
                size="sm"
                onClick={() => onFinish(result.attemptId)}
              >
                Inspect Audit Report <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

