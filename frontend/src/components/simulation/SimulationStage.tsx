import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { attemptApi } from '@/api/attempts';
import { useAuth } from '@/context/AuthContext';

type SimPhase = 'intro' | 'beat1' | 'beat2' | 'beat3' | 'completed';
type CharacterState = 'idle' | 'hiding' | 'running' | 'hurt';

interface SimulationStageProps {
  scenarioId?: string;
  onFinish?: (attemptId: string) => void;
  className?: string;
}

export const SimulationStage: React.FC<SimulationStageProps> = ({
  scenarioId = 'earthquake-drill-01',
  onFinish,
  className,
}) => {
  const { incrementPoints } = useAuth();

  // Simulation State
  const [phase, setPhase] = useState<SimPhase>('intro');
  const [characterState, setCharacterState] = useState<CharacterState>('idle');
  const [isDamagedRoom, setIsDamagedRoom] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isAlertBorder, setIsAlertBorder] = useState(false);
  const [debrisFalling, setDebrisFalling] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
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

    if (sirenRef.current) sirenRef.current.pause();
    playRumble();
    setIsShaking(true);
    setIsDamagedRoom(true);
    setIsAlertBorder(false);

    if (choiceId === 'B') {
      setCharacterState('hiding');
    } else {
      setCharacterState('running');
    }

    setTimeout(() => {
      setPhase('beat2');
    }, 900);
  };

  const handleBeat2Choice = (choiceId: string) => {
    const updated = { ...selectedAnswers, EQ_Q2: choiceId };
    setSelectedAnswers(updated);

    setDebrisFalling(true);
    playCrash();

    if (choiceId === 'C') {
      setCharacterState('hiding');
    } else {
      setCharacterState('hurt');
    }

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
      default:
        return '/game/sprites/character_idle.png';
    }
  };

  return (
    <div
      className={cn(
        'relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-2xl select-none transition-all',
        isShaking && 'animate-shake',
        isAlertBorder && 'animate-alert',
        className
      )}
      style={{ aspectRatio: '16/9', maxHeight: '560px' }}
    >
      {/* 1. ROOM BACKGROUND (Normal vs Damaged) */}
      <img
        src={isDamagedRoom ? '/game/sprites/background_room_damaged.png' : '/game/sprites/background_room.png'}
        alt="Simulation Room"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
      />

      {/* Subtle cinematic gradient vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none" />

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

      {/* 5. MINIMAL TOP CONTROLS */}
      <div className="absolute top-4 inset-x-5 flex items-center justify-between z-30 pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10 text-[10px] font-mono uppercase tracking-wider text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            2D Simulation Engine
          </span>
          {phase !== 'intro' && (
            <span className="text-[11px] font-mono text-slate-300 bg-slate-900/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
              {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
            </span>
          )}
        </div>

        <button
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            if (!next) stopAllAudio();
          }}
          className="p-2 rounded-full bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md text-white border border-white/10 transition-colors"
          title={soundEnabled ? 'Mute Audio' : 'Enable Audio'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-slate-200" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
        </button>
      </div>

      {/* 6. IMMERSIVE HUD OVERLAYS */}

      {/* INTRO PHASE */}
      {phase === 'intro' && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40">
          <div className="max-w-md space-y-3">
            <span className="text-[11px] font-mono text-slate-400 tracking-widest uppercase">
              Seismic Survival Protocol
            </span>
            <h2 className="text-2xl font-semibold text-white tracking-tight">
              Earthquake Response Drill
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Navigate real-time structural tremors, falling hazards, and evacuation decisions. Your actions determine physical safety and response score.
            </p>

            <div className="pt-2">
              <button
                onClick={handleStart}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-950 text-xs font-semibold hover:bg-slate-100 hover:shadow-lg hover:shadow-white/10 transition-all duration-200 active:scale-98"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Simulation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BEAT 1 OVERLAY */}
      {phase === 'beat1' && (
        <div className="absolute bottom-5 inset-x-5 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 z-40 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-amber-400 font-medium flex items-center gap-1.5">
              <Flame className="w-3 h-3 animate-pulse" />
              Phase 1: Initial Ground Motion
            </span>
            <span className="text-slate-500 text-[10px]">Select Response</span>
          </div>

          <p className="text-xs font-medium text-slate-100">
            Ground shaking begins suddenly in the room. What is your immediate action?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleBeat1Choice('B')}
              className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-left border border-white/10 hover:border-white/20 transition-all duration-150 group"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-semibold">B</span>
                <span className="text-xs font-medium text-white group-hover:text-emerald-200 transition-colors">
                  Drop, Cover, and Hold On
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block pl-6">
                Take shelter immediately beneath the sturdy table
              </span>
            </button>

            <button
              onClick={() => handleBeat1Choice('A')}
              className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-left border border-white/10 hover:border-white/20 transition-all duration-150 group"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 font-semibold">A</span>
                <span className="text-xs font-medium text-white group-hover:text-rose-200 transition-colors">
                  Run towards the room exit
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block pl-6">
                Sprint across the shaking room toward the door
              </span>
            </button>
          </div>
        </div>
      )}

      {/* BEAT 2 OVERLAY */}
      {phase === 'beat2' && (
        <div className="absolute bottom-5 inset-x-5 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 z-40 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-rose-400 font-medium flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3 animate-pulse" />
              Phase 2: Severe Tremors & Falling Debris
            </span>
            <span className="text-slate-500 text-[10px]">Select Response</span>
          </div>

          <p className="text-xs font-medium text-slate-100">
            Ceiling plaster and concrete fragments are crashing down. How do you respond?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleBeat2Choice('C')}
              className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-left border border-white/10 hover:border-white/20 transition-all duration-150 group"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-semibold">C</span>
                <span className="text-xs font-medium text-white group-hover:text-emerald-200 transition-colors">
                  Remain sheltered under the desk
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block pl-6">
                Keep vital organs protected until the shaking stops
              </span>
            </button>

            <button
              onClick={() => handleBeat2Choice('A')}
              className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-left border border-white/10 hover:border-white/20 transition-all duration-150 group"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 font-semibold">A</span>
                <span className="text-xs font-medium text-white group-hover:text-rose-200 transition-colors">
                  Leave shelter to look for an exit
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block pl-6">
                Stand up and move through the falling debris zone
              </span>
            </button>
          </div>
        </div>
      )}

      {/* BEAT 3 OVERLAY */}
      {phase === 'beat3' && (
        <div className="absolute bottom-5 inset-x-5 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 z-40 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-emerald-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              Phase 3: Post-Shake Evacuation
            </span>
            <span className="text-slate-500 text-[10px]">Final Protocol</span>
          </div>

          <p className="text-xs font-medium text-slate-100">
            Shaking has subsided. How should you evacuate the building safely?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              disabled={isSubmitting}
              onClick={() => handleBeat3Choice('B')}
              className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-left border border-white/10 hover:border-white/20 transition-all duration-150 group disabled:opacity-50"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-semibold">B</span>
                <span className="text-xs font-medium text-white group-hover:text-emerald-200 transition-colors">
                  Take stairs after checking for hazards
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block pl-6">
                Descend safely via fire stairs, watching for debris
              </span>
            </button>

            <button
              disabled={isSubmitting}
              onClick={() => handleBeat3Choice('A')}
              className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-left border border-white/10 hover:border-white/20 transition-all duration-150 group disabled:opacity-50"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 font-semibold">A</span>
                <span className="text-xs font-medium text-white group-hover:text-rose-200 transition-colors">
                  Use the building elevator
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block pl-6">
                Take the elevator for quickest descent (high entrapment risk)
              </span>
            </button>
          </div>
        </div>
      )}

      {/* COMPLETED RESULT OVERLAY */}
      {phase === 'completed' && result && (
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40">
          <div className="max-w-sm space-y-3">
            <div
              className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center border ${
                result.passed
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {result.passed ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight">
                {result.passed ? 'Drill Completed Successfully' : 'Drill Completed — Review Recommended'}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-1 font-mono text-xs">
                <span className="text-slate-400">Score:</span>
                <span className="font-bold text-white text-sm">{result.score}</span>
                <span className="text-slate-500">/ {result.maxScore}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {result.passed
                ? 'Excellent tactical judgment. Dropping beneath sturdy furniture and using stairs protected you from critical hazards.'
                : 'Hazard protocol violated. Remember to never run during shaking or use elevators post-earthquake.'}
            </p>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                onClick={handleStart}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white border border-white/10 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Replay
              </button>

              {onFinish && (
                <button
                  onClick={() => onFinish(result.attemptId)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-slate-950 text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  View Review <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
