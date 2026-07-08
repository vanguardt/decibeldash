import { soundProfile } from "./soundProfile";

export const BADGES = [
  {
    id: "pro_modder",
    name: "Pro Modder",
    description: "Applied mods to 5+ builds",
    icon: "Wrench",
    color: "amber",
    check: (s) => s.moddedCount >= 5,
  },
  {
    id: "thock_master",
    name: "Thock Master",
    description: "Dominant sound profile is Thock",
    icon: "Sparkles",
    color: "purple",
    check: (s) => s.dominantProfile === "thocky",
  },
  {
    id: "silent_expert",
    name: "Silent Switch Expert",
    description: "Average dB below 45",
    icon: "Volume2",
    color: "blue",
    check: (s) => s.avgDb != null && s.avgDb < 45,
  },
  {
    id: "stab_surgeon",
    name: "Stabilizer Surgeon",
    description: "Spacebar is your loudest key",
    icon: "Scissors",
    color: "cyan",
    check: (s) => s.loudestKey === " ",
  },
  {
    id: "heatmap_hero",
    name: "Heatmap Hero",
    description: "5+ recordings with heatmaps",
    icon: "Grid3x3",
    color: "emerald",
    check: (s) => s.heatmapCount >= 5,
  },
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Hit 80+ WPM",
    icon: "Zap",
    color: "yellow",
    check: (s) => s.bestWpm >= 80,
  },
  {
    id: "clack_commander",
    name: "Clack Commander",
    description: "Dominant sound profile is Clack",
    icon: "Flame",
    color: "orange",
    check: (s) => s.dominantProfile === "clacky",
  },
  {
    id: "build_master",
    name: "Build Master",
    description: "Saved 3+ build profiles",
    icon: "Boxes",
    color: "primary",
    check: (s) => s.buildCount >= 3,
  },
  {
    id: "collector",
    name: "Collector",
    description: "Created a build collection",
    icon: "Layers",
    color: "teal",
    check: (s) => s.collectionCount >= 1,
  },
];

export const BADGE_COLORS = {
  amber: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  purple: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  blue: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  cyan: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  yellow: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  orange: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  primary: "bg-primary/15 text-primary border-primary/30",
  teal: "bg-teal-500/15 text-teal-400 border-teal-500/30",
};

export function computeBadges(stats) {
  return BADGES.map((badge) => ({
    ...badge,
    unlocked: badge.check(stats),
  }));
}