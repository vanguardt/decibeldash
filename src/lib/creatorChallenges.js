import { soundProfile } from "./soundProfile";

export function getWeekKey() {
  const d = new Date();
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${weekNum}`;
}

function parseMods(item) {
  try { return JSON.parse(item.modifications || "[]"); } catch { return []; }
}

function parseHeatmap(rec) {
  try { return JSON.parse(rec.key_heatmap || "{}"); } catch { return {}; }
}

export const CHALLENGES = [
  {
    id: "quietest_spacebar",
    name: "Quietest Spacebar",
    description: "Lowest average dB on the spacebar key",
    icon: "Volume2",
    evaluate: (recordings) => {
      let best = null;
      for (const rec of recordings) {
        const hm = parseHeatmap(rec);
        const space = hm[" "];
        if (space && space.avg_db) {
          if (!best || space.avg_db < best.score) {
            best = { score: space.avg_db, recording: rec };
          }
        }
      }
      return best
        ? { score: best.score.toFixed(1), label: `${best.score.toFixed(1)} dB`, recording: best.recording }
        : { score: null, label: "No spacebar data" };
    },
  },
  {
    id: "even_heatmap",
    name: "Most Even Heatmap",
    description: "Lowest variance across all keys",
    icon: "Grid3x3",
    evaluate: (recordings) => {
      let best = null;
      for (const rec of recordings) {
        const hm = parseHeatmap(rec);
        const keys = Object.entries(hm).filter(([, s]) => s.hits >= 2);
        if (keys.length < 3) continue;
        const avg = keys.reduce((s, [, k]) => s + k.avg_db, 0) / keys.length;
        const variance = keys.reduce((s, [, k]) => s + Math.pow(k.avg_db - avg, 2), 0) / keys.length;
        const stdDev = Math.sqrt(variance);
        if (!best || stdDev < best.score) {
          best = { score: stdDev, recording: rec };
        }
      }
      return best
        ? { score: best.score.toFixed(1), label: `±${best.score.toFixed(1)} dB`, recording: best.recording }
        : { score: null, label: "Not enough data" };
    },
  },
  {
    id: "best_thock",
    name: "Best Thock Profile",
    description: "Lowest dB recording with a thocky signature",
    icon: "Sparkles",
    evaluate: (recordings) => {
      let best = null;
      for (const rec of recordings) {
        if (soundProfile(rec) !== "thocky") continue;
        const db = rec.avg_decibels;
        if (db != null && (!best || db < best.score)) {
          best = { score: db, recording: rec };
        }
      }
      return best
        ? { score: best.score.toFixed(1), label: `${best.score.toFixed(1)} dB`, recording: best.recording }
        : { score: null, label: "No thocky builds" };
    },
  },
  {
    id: "mod_stack",
    name: "Most Creative Mod Stack",
    description: "Most mods applied to a single build",
    icon: "Wrench",
    evaluate: (recordings, builds) => {
      let best = null;
      for (const item of [...recordings, ...builds]) {
        const mods = parseMods(item);
        if (!best || mods.length > best.score) {
          best = { score: mods.length, recording: item, mods };
        }
      }
      return best
        ? { score: best.score, label: `${best.score} mods`, recording: best.recording }
        : { score: 0, label: "No mods yet" };
    },
  },
  {
    id: "speed_king",
    name: "Speed King",
    description: "Highest WPM across all recordings",
    icon: "Zap",
    evaluate: (recordings) => {
      let best = null;
      for (const rec of recordings) {
        if (rec.wpm && (!best || rec.wpm > best.score)) {
          best = { score: rec.wpm, recording: rec };
        }
      }
      return best
        ? { score: best.score, label: `${best.score} WPM`, recording: best.recording }
        : { score: 0, label: "No WPM data" };
    },
  },
];

export function evaluateChallenges(recordings, builds) {
  return CHALLENGES.map((ch) => ({
    ...ch,
    result: ch.evaluate(recordings, builds),
  }));
}