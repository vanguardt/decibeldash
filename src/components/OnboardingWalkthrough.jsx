import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Keyboard, Grid3x3, Boxes, Clapperboard, ChevronRight, X } from "lucide-react";
import { Link } from "react-router-dom";

const STEPS = [
  {
    icon: Mic,
    title: "Welcome to DecibelDash",
    description: "Measure your keyboard's sound, track typing speed, and build your acoustic profile — all in one place.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Keyboard,
    title: "Typing Test",
    description: "When you hit record, a typing test appears. Type the passage to measure your WPM and accuracy alongside sound levels.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Mic,
    title: "Recording",
    description: "Tap the mic button to start. Your keystrokes generate real-time decibel readings. Switch to Keys Only mode for sound without typing.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Grid3x3,
    title: "Heatmaps",
    description: "Each key's loudness is tracked automatically. After recording, see which keys are loudest and quietest in a visual heatmap.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Boxes,
    title: "Build Profiles",
    description: "Save recordings as Build Profiles with switch type, keycaps, and mods. Group them into themed collections and compare side-by-side.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Clapperboard,
    title: "Creator Mode",
    description: "Earn badges, complete weekly challenges, generate an identity card, publish mod templates, and track your stats.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
];

export default function OnboardingWalkthrough({ onComplete }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  const next = () => {
    if (isLast) {
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  const skip = () => onComplete();

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }}
          className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full relative"
        >
          <button
            onClick={skip}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-accent text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className={`flex items-center justify-center w-16 h-16 rounded-2xl ${current.bg} mb-4`}>
            <Icon className={`w-8 h-8 ${current.color}`} />
          </div>

          {/* Content */}
          <h2 className="text-lg font-bold text-center mb-2">{current.title}</h2>
          <p className="text-sm text-muted-foreground text-center leading-relaxed mb-6">
            {current.description}
          </p>

          {/* Action button */}
          <button
            onClick={next}
            className="w-full flex items-center justify-center gap-1.5 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            {isLast ? "Get Started" : "Next"}
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isLast && (
            <button
              onClick={skip}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-3"
            >
              Skip walkthrough
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}