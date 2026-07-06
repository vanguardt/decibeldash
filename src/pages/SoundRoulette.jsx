import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Dices, Check, X, RotateCcw, Volume2, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import RecordingAudioPlayer from "@/components/RecordingAudioPlayer";
import { soundProfile, profileStyles } from "@/lib/soundProfile";

const SWITCH_OPTIONS = ["Linear", "Tactile", "Clicky"];
const PROFILE_OPTIONS = ["thocky", "clacky", "clicky", "creamy"];

export default function SoundRoulette() {
  const { toast } = useToast();
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("ready"); // ready | guessing | revealed
  const [current, setCurrent] = useState(null);
  const [guessSwitch, setGuessSwitch] = useState(null);
  const [guessProfile, setGuessProfile] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.SoundRecording.list("-created_date", 200);
        setRecordings(data.filter((r) => r.audio_url && r.avg_decibels != null));
      } catch {
        toast({ title: "Failed to load recordings", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const startRound = useCallback(() => {
    if (recordings.length === 0) return;
    const pick = recordings[Math.floor(Math.random() * recordings.length)];
    setCurrent(pick);
    setGuessSwitch(null);
    setGuessProfile(null);
    setPhase("guessing");
  }, [recordings]);

  const actualSwitch = current?.switch_type && SWITCH_OPTIONS.includes(current.switch_type)
    ? current.switch_type
    : null;
  const actualProfile = current ? soundProfile(current) : null;

  const switchCorrect = guessSwitch && actualSwitch && guessSwitch === actualSwitch;
  const profileCorrect = guessProfile && guessProfile === actualProfile;

  const submitGuess = () => {
    let correct = 0;
    let total = 0;
    if (guessSwitch && actualSwitch) { total++; if (switchCorrect) correct++; }
    if (guessProfile) { total++; if (profileCorrect) correct++; }

    setScore((s) => ({ correct: s.correct + correct, total: s.total + total }));
    const allRight = correct === total && total > 0;
    setStreak((s) => (allRight ? s + 1 : 0));
    setPhase("revealed");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <Dices className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          No recordings with audio yet. Record one to play!
        </p>
      </div>
    );
  }

  // ── Ready / Start screen ──────────────────────────────
  if (phase === "ready") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 max-w-lg mx-auto text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
        >
          <Dices className="w-10 h-10 text-primary" />
        </motion.div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Sound Roulette</h1>
        <p className="text-sm text-muted-foreground mb-8 max-w-xs">
          Listen to a mystery recording and guess the switch type &amp; sound profile.
          Test your ears — how many can you get right?
        </p>
        {score.total > 0 && (
          <div className="flex items-center gap-6 mb-8">
            <div className="text-center">
              <p className="text-2xl font-bold font-mono">{score.correct}/{score.total}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Score</p>
            </div>
            {streak > 1 && (
              <div className="text-center">
                <p className="text-2xl font-bold font-mono text-primary">{streak}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Streak</p>
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={startRound}
          className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg hover:bg-primary/90 transition-colors"
        >
          <Dices className="w-5 h-5" />
          {score.total > 0 ? "Play Again" : "Start"}
        </button>
      </div>
    );
  }

  // ── Guessing / Revealed phases ───────────────────────
  const revealed = phase === "revealed";

  const GuessButton = ({ active, onClick, children, result }) => {
    let style = "border-border bg-card hover:bg-accent text-foreground";
    if (revealed && result === "correct") style = "border-green-500/50 bg-green-500/10 text-green-400";
    else if (revealed && result === "wrong") style = "border-red-500/50 bg-red-500/10 text-red-400";
    else if (revealed && result === "reveal") style = "border-primary/50 bg-primary/10 text-primary";
    else if (active) style = "border-primary bg-primary/10 text-primary";

    return (
      <button
        type="button"
        onClick={onClick}
        disabled={revealed}
        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-sm font-medium transition-colors disabled:cursor-default ${style}`}
      >
        {revealed && result === "correct" && <Check className="w-4 h-4" />}
        {revealed && result === "wrong" && <X className="w-4 h-4" />}
        {children}
      </button>
    );
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      {/* Score bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-lg font-bold font-mono">{score.correct}/{score.total}</p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Score</p>
          </div>
          {streak > 1 && (
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
              🔥 {streak} streak
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={startRound}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Skip
        </button>
      </div>

      {/* Mystery card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-5 mb-5"
      >
        <div className="flex items-center gap-2 mb-1">
          <Dices className="w-4 h-4 text-primary" />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            Mystery Recording
          </p>
        </div>
        <h2 className="text-lg font-bold mb-4">
          {revealed ? current.name : "????"}
        </h2>
        <RecordingAudioPlayer url={current.audio_url} />

        {revealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap gap-2 mt-4"
          >
            <span className="text-xs px-2 py-1 rounded-full border border-border bg-muted text-muted-foreground">
              {current.avg_decibels.toFixed(1)} dB avg
            </span>
            {current.peak_decibels != null && (
              <span className="text-xs px-2 py-1 rounded-full border border-border bg-muted text-muted-foreground">
                {current.peak_decibels.toFixed(1)} dB peak
              </span>
            )}
            {current.category && (
              <span className="text-xs px-2 py-1 rounded-full border border-border bg-muted text-muted-foreground capitalize">
                {current.category}
              </span>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Guess: Sound Profile */}
      <div className="mb-5">
        <p className="text-xs font-semibold mb-2 text-muted-foreground">
          🎧 What's the sound profile?
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PROFILE_OPTIONS.map((p) => {
            const style = profileStyles[p];
            const active = guessProfile === p;
            let result = null;
            if (revealed) {
              if (p === actualProfile) result = "reveal";
              if (active && p === actualProfile) result = "correct";
              if (active && p !== actualProfile) result = "wrong";
            }
            return (
              <GuessButton
                key={p}
                active={active}
                onClick={() => setGuessProfile(p)}
                result={result}
              >
                {style.label}
              </GuessButton>
            );
          })}
        </div>
      </div>

      {/* Guess: Switch Type */}
      <div className="mb-6">
        <p className="text-xs font-semibold mb-2 text-muted-foreground">
          ⌨️ What's the switch type?
          {!actualSwitch && !revealed && (
            <span className="ml-1 text-muted-foreground/50">(may be unknown)</span>
          )}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {SWITCH_OPTIONS.map((s) => {
            const active = guessSwitch === s;
            let result = null;
            if (revealed && actualSwitch) {
              if (s === actualSwitch) result = "reveal";
              if (active && s === actualSwitch) result = "correct";
              if (active && s !== actualSwitch) result = "wrong";
            }
            return (
              <GuessButton
                key={s}
                active={active}
                onClick={() => setGuessSwitch(s)}
                result={result}
              >
                {s}
              </GuessButton>
            );
          })}
        </div>
        {revealed && !actualSwitch && (
          <p className="text-[11px] text-muted-foreground/70 mt-2">
            This recording didn't specify a switch type — not scored.
          </p>
        )}
      </div>

      {/* Action button */}
      {!revealed ? (
        <button
          type="button"
          onClick={submitGuess}
          disabled={!guessProfile && !guessSwitch}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Reveal Answer
        </button>
      ) : (
        <div className="space-y-3">
          {/* Result summary */}
          <div className="flex items-center justify-center gap-4 py-2">
            {guessProfile && (
              <div className="text-center">
                <p className={`text-lg font-bold ${profileCorrect ? "text-green-400" : "text-red-400"}`}>
                  {profileCorrect ? "✓" : "✗"}
                </p>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Profile</p>
              </div>
            )}
            {actualSwitch && guessSwitch && (
              <div className="text-center">
                <p className={`text-lg font-bold ${switchCorrect ? "text-green-400" : "text-red-400"}`}>
                  {switchCorrect ? "✓" : "✗"}
                </p>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Switch</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={startRound}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Dices className="w-5 h-5" />
            Next Recording
          </button>
        </div>
      )}
    </div>
  );
}