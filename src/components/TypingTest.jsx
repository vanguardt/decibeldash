import React, { useState, useRef, useEffect, useCallback } from "react";
import { Timer } from "lucide-react";

const PASSAGES = [
  "the quick brown fox jumps over the lazy dog while typing on a mechanical keyboard",
  "programming requires focus and a good keyboard that feels comfortable to type on",
  "a quiet keyboard can make a big difference when working in a shared office space",
  "typing speed and accuracy depend heavily on the switches used in your keyboard",
  "the sound of typing varies greatly between membrane and mechanical keyboards",
];

const TYPING_DURATION = 30; // seconds

export default function TypingTest({
  isRecording,
  onWpmUpdate,
  onFirstKeystroke,
  onComplete,
  onKeystroke,
}) {
  const [passage, setPassage] = useState("");
  const [typed, setTyped] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [completed, setCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(TYPING_DURATION);

  const inputRef = useRef(null);
  const typedRef = useRef("");
  const startTimeRef = useRef(null);
  const completedRef = useRef(false);

  const computeAccuracy = (value) => {
    let correct = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === passage[i]) correct++;
    }
    return value.length > 0 ? (correct / value.length) * 100 : 100;
  };

  const newPassage = useCallback(() => {
    setPassage(PASSAGES[Math.floor(Math.random() * PASSAGES.length)]);
    setTyped("");
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setCompleted(false);
    setTimeRemaining(TYPING_DURATION);
    typedRef.current = "";
    startTimeRef.current = null;
    completedRef.current = false;
  }, []);

  useEffect(() => {
    newPassage();
  }, [newPassage]);

  // 30s countdown
  useEffect(() => {
    if (!startTime || completed) return;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, TYPING_DURATION - elapsed);
      setTimeRemaining(Math.ceil(remaining));
      if (remaining <= 0 && !completedRef.current) {
        completedRef.current = true;
        setCompleted(true);
        const elapsedMin = Math.max(
          (Date.now() - startTimeRef.current) / 60000,
          0.0001
        );
        const finalWpm = Math.round(typedRef.current.length / 5 / elapsedMin);
        const acc = computeAccuracy(typedRef.current);
        setWpm(finalWpm);
        onWpmUpdate?.(finalWpm, acc);
        onComplete?.();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [startTime, completed, passage, onWpmUpdate, onComplete]);

  const handleInput = (e) => {
    if (!isRecording || completed) return;
    const value = e.target.value;

    // First keystroke → start the clock + notify parent to begin audio metering
    if (value.length === 1 && !startTimeRef.current) {
      const now = Date.now();
      startTimeRef.current = now;
      setStartTime(now);
      onFirstKeystroke?.();
    }

    // Report the newly typed character(s) for per-key heatmap tracking
    const prev = typedRef.current || "";
    if (value.length > prev.length) {
      const added = value.slice(prev.length);
      for (const ch of added) {
        if (ch.trim()) onKeystroke?.(ch.toLowerCase());
      }
    }

    setTyped(value);
    typedRef.current = value;

    const acc = computeAccuracy(value);
    setAccuracy(acc);

    if (startTimeRef.current) {
      const elapsedMin = (Date.now() - startTimeRef.current) / 60000;
      const currentWpm =
        elapsedMin > 0 ? Math.round(value.length / 5 / elapsedMin) : 0;
      setWpm(currentWpm);
      onWpmUpdate?.(currentWpm, acc);
    }

    // Early completion: passage fully typed before 30s
    if (value === passage && !completedRef.current) {
      completedRef.current = true;
      setCompleted(true);
      const elapsedMin = Math.max(
        (Date.now() - startTimeRef.current) / 60000,
        0.0001
      );
      const finalWpm = Math.round(value.length / 5 / elapsedMin);
      setWpm(finalWpm);
      onWpmUpdate?.(finalWpm, acc);
      onComplete?.();
    }
  };

  const isCorrect = (i) => {
    if (i >= typed.length) return null;
    return typed[i] === passage[i];
  };

  return (
    <div className="w-full bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
          Typing Test
        </h3>
        <div className="flex items-center gap-3">
          {startTime && !completed && (
            <span
              className={`flex items-center gap-1 text-[10px] font-mono ${
                timeRemaining <= 5 ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              <Timer className="w-3 h-3" />
              {timeRemaining}s
            </span>
          )}
          {wpm > 0 && (
            <span className="text-sm font-mono font-bold text-primary">
              {wpm} WPM
            </span>
          )}
        </div>
      </div>

      {/* Passage display */}
      <div
        className="text-sm leading-relaxed font-mono mb-3 select-none"
        onClick={() =>
          isRecording && !completed && inputRef.current?.focus()
        }
      >
        {passage.split("").map((char, i) => {
          let className = "text-muted-foreground/50";
          if (i < typed.length) {
            className = isCorrect(i)
              ? "text-emerald-400"
              : "text-red-400 bg-red-500/10 rounded";
          }
          if (i === typed.length && isRecording && !completed) {
            className = "text-foreground bg-primary/20 rounded animate-pulse";
          }
          return (
            <span key={i} className={className}>
              {char}
            </span>
          );
        })}
      </div>

      {/* Hidden input */}
      <textarea
        ref={inputRef}
        value={typed}
        onChange={handleInput}
        disabled={!isRecording || completed}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        rows={1}
        spellCheck={false}
        autoComplete="off"
        placeholder={
          isRecording
            ? completed
              ? "Completed!"
              : "Start typing to begin recording…"
            : "Start recording to type"
        }
      />

      {/* Stats */}
      {completed && (
        <div className="flex items-center gap-4 mt-3 text-xs">
          <span className="text-emerald-400">✓ Completed at {wpm} WPM</span>
          <span className="text-muted-foreground">
            Accuracy: {accuracy.toFixed(0)}%
          </span>
          <button
            className="text-primary hover:underline ml-auto"
            onClick={newPassage}
          >
            Try again →
          </button>
        </div>
      )}

      {!completed && isRecording && typed.length > 0 && (
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>
            Accuracy:{" "}
            <span
              className={
                accuracy > 90
                  ? "text-emerald-400"
                  : accuracy > 70
                  ? "text-yellow-400"
                  : "text-red-400"
              }
            >
              {accuracy.toFixed(0)}%
            </span>
          </span>
          <span>
            Progress: {Math.round((typed.length / passage.length) * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}