import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Mic,
  Layers,
  Trophy,
  Boxes,
  Flame,
  Keyboard,
  Zap,
  Dices,
  GitCompare,
  Sparkles,
} from "lucide-react";

const STORAGE_KEY = "decibeldash_behavior";

export const ACHIEVEMENTS = [
  { id: "first_recording", name: "First Recording", desc: "Saved your first keyboard profile", icon: Mic },
  { id: "five_recordings", name: "Getting Started", desc: "Saved 5 recordings", icon: Layers },
  { id: "ten_recordings", name: "Sound Collector", desc: "Saved 10 recordings", icon: Trophy },
  { id: "first_build", name: "Build Master", desc: "Saved your first build profile", icon: Boxes },
  { id: "three_day_streak", name: "On a Roll", desc: "3-day streak — keep it going!", icon: Flame },
  { id: "seven_day_streak", name: "Dedicated", desc: "7-day streak!", icon: Flame },
  { id: "wpm_50", name: "Quick Fingers", desc: "Hit 50 WPM", icon: Keyboard },
  { id: "wpm_80", name: "Speed Demon", desc: "Hit 80 WPM", icon: Zap },
  { id: "wpm_100", name: "Lightning Hands", desc: "Hit 100 WPM", icon: Zap },
  { id: "roulette_player", name: "Risk Taker", desc: "Played Sound Roulette", icon: Dices },
  { id: "switch_explorer", name: "Explorer", desc: "Browsed the switch library", icon: Layers },
  { id: "comparator", name: "Analyst", desc: "Compared two recordings", icon: GitCompare },
];

function getDefaultBehavior() {
  return {
    featureVisits: {},
    recordingCount: 0,
    buildCount: 0,
    lastMode: null,
    lastSettings: {},
    wpmHistory: [],
    bestWpm: 0,
    visitDates: [],
    achievements: [],
    onboardingCompleted: false,
  };
}

function loadBehavior() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...getDefaultBehavior(), ...JSON.parse(raw) } : getDefaultBehavior();
  } catch {
    return getDefaultBehavior();
  }
}

let behaviorState = loadBehavior();
let listeners = [];
let achievementState = null;
let achievementListeners = [];

function commitBehavior(next) {
  behaviorState = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l(next));
}

function pushAchievement(ach) {
  achievementState = ach;
  achievementListeners.forEach((l) => l(ach));
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function computeStreak(visitDates) {
  if (!visitDates.length) return 0;
  const sorted = [...visitDates].sort();
  const today = todayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (!sorted.includes(today) && !sorted.includes(yesterday)) return 0;

  let streak = 0;
  let cursor = sorted.includes(today) ? today : yesterday;
  const set = new Set(sorted);

  while (set.has(cursor)) {
    streak++;
    cursor = new Date(new Date(cursor).getTime() - 86400000)
      .toISOString()
      .slice(0, 10);
  }
  return streak;
}

function checkAchievements(state) {
  const unlocked = new Set(state.achievements);
  const newlyUnlocked = [];

  const streak = computeStreak(state.visitDates);
  const checks = [
    { id: "first_recording", cond: state.recordingCount >= 1 },
    { id: "five_recordings", cond: state.recordingCount >= 5 },
    { id: "ten_recordings", cond: state.recordingCount >= 10 },
    { id: "first_build", cond: state.buildCount >= 1 },
    { id: "three_day_streak", cond: streak >= 3 },
    { id: "seven_day_streak", cond: streak >= 7 },
    { id: "wpm_50", cond: state.bestWpm >= 50 },
    { id: "wpm_80", cond: state.bestWpm >= 80 },
    { id: "wpm_100", cond: state.bestWpm >= 100 },
    { id: "roulette_player", cond: (state.featureVisits.roulette || 0) >= 1 },
    { id: "switch_explorer", cond: (state.featureVisits.switches || 0) >= 1 },
    { id: "comparator", cond: (state.featureVisits.compare || 0) >= 1 },
  ];

  for (const { id, cond } of checks) {
    if (cond && !unlocked.has(id)) {
      unlocked.add(id);
      newlyUnlocked.push(id);
    }
  }

  return { achievements: [...unlocked], newlyUnlocked };
}

function applyAndCheck(updater) {
  const prev = behaviorState;
  const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
  const ach = checkAchievements(next);
  next.achievements = ach.achievements;
  commitBehavior(next);
  if (ach.newlyUnlocked.length > 0) {
    const def = ACHIEVEMENTS.find((a) => a.id === ach.newlyUnlocked[0]);
    if (def) setTimeout(() => pushAchievement(def), 400);
  }
}

export function useUserBehavior() {
  const [behavior, setBehaviorState] = useState(behaviorState);
  const [pendingAchievement, setPendingAchState] = useState(achievementState);

  useEffect(() => {
    listeners.push(setBehaviorState);
    achievementListeners.push(setPendingAchState);
    return () => {
      listeners = listeners.filter((l) => l !== setBehaviorState);
      achievementListeners = achievementListeners.filter(
        (l) => l !== setPendingAchState
      );
    };
  }, []);

  const trackFeatureVisit = useCallback((feature) => {
    applyAndCheck((prev) => {
      const today = todayStr();
      const visitDates = prev.visitDates.includes(today)
        ? prev.visitDates
        : [...prev.visitDates, today].slice(-365);
      return {
        ...prev,
        featureVisits: {
          ...prev.featureVisits,
          [feature]: (prev.featureVisits[feature] || 0) + 1,
        },
        visitDates,
      };
    });
  }, []);

  const trackRecording = useCallback((settings) => {
    applyAndCheck((prev) => {
      const next = {
        ...prev,
        recordingCount: prev.recordingCount + 1,
        lastMode: settings?.mode || prev.lastMode,
        lastSettings: settings || prev.lastSettings,
      };
      if (settings?.wpm && settings.wpm > 0) {
        next.wpmHistory = [...prev.wpmHistory, settings.wpm].slice(-50);
        next.bestWpm = Math.max(prev.bestWpm, settings.wpm);
      }
      return next;
    });
  }, []);

  const trackBuild = useCallback(() => {
    applyAndCheck((prev) => ({
      ...prev,
      buildCount: prev.buildCount + 1,
    }));
  }, []);

  const dismissAchievement = useCallback(() => pushAchievement(null), []);

  const completeOnboarding = useCallback(() => {
    applyAndCheck((prev) => ({ ...prev, onboardingCompleted: true }));
  }, []);

  const streak = useMemo(
    () => computeStreak(behavior.visitDates),
    [behavior.visitDates]
  );

  const suggestions = useMemo(() => {
    const { recordingCount, featureVisits, lastMode } = behavior;
    const list = [];

    if (recordingCount === 0) {
      list.push({
        id: "first_record",
        title: "Record your first keyboard",
        description: "Tap the mic below to measure your keyboard's sound",
        icon: Mic,
      });
    } else if (lastMode) {
      list.push({
        id: "quick_record",
        title: "Jump right back in",
        description: `${
          lastMode === "soundOnly" ? "Keys Only" : "Typing + Sound"
        } mode · settings pre-filled`,
        icon: Zap,
        action: "quick_record",
      });
    }

    const untried = [
      {
        path: "/roulette",
        key: "roulette",
        title: "Try Sound Roulette",
        description: "Guess the switch by sound alone",
        icon: Dices,
      },
      {
        path: "/switches",
        key: "switches",
        title: "Browse the Switch Library",
        description: "Community-tested acoustic profiles",
        icon: Layers,
      },
      {
        path: "/compare",
        key: "compare",
        title: "Compare Recordings",
        description: "Side-by-side sound analysis",
        icon: GitCompare,
      },
      {
        path: "/recommend",
        key: "recommend",
        title: "Get Mod Recommendations",
        description: "AI-powered suggestions for your build",
        icon: Sparkles,
      },
    ].filter((f) => !featureVisits[f.key]);

    list.push(...untried.slice(0, 2));
    return list.slice(0, 3);
  }, [behavior]);

  return {
    behavior,
    streak,
    suggestions,
    pendingAchievement,
    dismissAchievement,
    trackFeatureVisit,
    trackRecording,
    trackBuild,
    completeOnboarding,
  };
}