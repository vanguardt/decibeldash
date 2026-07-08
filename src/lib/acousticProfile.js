import { soundProfile, profileStyles } from "./soundProfile";
import {
  Volume2,
  AlertTriangle,
  Sparkles,
  Target,
  TrendingUp,
  TrendingDown,
  Wrench,
  Keyboard,
  Lightbulb,
} from "lucide-react";

const KEY_LABELS = { " ": "Spacebar" };

function keyLabel(key) {
  return KEY_LABELS[key] || (key.length === 1 ? key.toUpperCase() : key);
}

// --- Heatmap Analysis ---

export function aggregateHeatmaps(recordings) {
  const merged = {};
  for (const rec of recordings) {
    let hm = {};
    try { hm = JSON.parse(rec.key_heatmap || "{}"); } catch { continue; }
    for (const [key, stats] of Object.entries(hm)) {
      if (!merged[key]) merged[key] = { hits: 0, totalDb: 0, peak_db: 0 };
      const hits = stats.hits || 1;
      merged[key].hits += hits;
      merged[key].totalDb += (stats.avg_db || 0) * hits;
      if ((stats.peak_db || 0) > merged[key].peak_db) merged[key].peak_db = stats.peak_db;
    }
  }
  for (const key of Object.keys(merged)) {
    merged[key].avg_db = merged[key].hits > 0 ? merged[key].totalDb / merged[key].hits : 0;
  }
  return merged;
}

function keysWithStats(heatmap, minHits = 3) {
  return Object.entries(heatmap)
    .filter(([, s]) => s.hits >= minHits)
    .map(([key, stats]) => ({ key, ...stats, label: keyLabel(key) }));
}

function boardAverage(keys) {
  return keys.length === 0 ? 0 : keys.reduce((sum, k) => sum + k.avg_db, 0) / keys.length;
}

export function findLoudKeys(heatmap) {
  const keys = keysWithStats(heatmap);
  if (keys.length < 3) return [];
  const avg = boardAverage(keys);
  return keys
    .map((k) => ({ ...k, delta: k.avg_db - avg }))
    .filter((k) => k.delta > 3)
    .sort((a, b) => b.delta - a.delta);
}

export function findQuietKeys(heatmap) {
  const keys = keysWithStats(heatmap);
  if (keys.length < 3) return [];
  const avg = boardAverage(keys);
  return keys
    .map((k) => ({ ...k, delta: k.avg_db - avg }))
    .filter((k) => k.delta < -3)
    .sort((a, b) => a.delta - b.delta);
}

export function hasUnevenPeaks(heatmap) {
  const keys = keysWithStats(heatmap);
  if (keys.length < 5) return false;
  const avg = boardAverage(keys);
  const variance = keys.reduce((sum, k) => sum + Math.pow(k.avg_db - avg, 2), 0) / keys.length;
  return Math.sqrt(variance) > 4;
}

// --- Profile Analysis ---

export function findDominantSoundProfile(recordings) {
  if (recordings.length === 0) return null;
  const counts = {};
  for (const rec of recordings) {
    const p = soundProfile(rec);
    counts[p] = (counts[p] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

export function analyzeDbRange(recordings) {
  const valid = recordings.filter((r) => r.avg_decibels != null);
  if (valid.length === 0) return null;
  const mins = valid.filter((r) => r.min_decibels).map((r) => r.min_decibels);
  return {
    avg: valid.reduce((s, r) => s + r.avg_decibels, 0) / valid.length,
    peak: Math.max(...valid.map((r) => r.peak_decibels || 0)),
    min: mins.length ? Math.min(...mins) : 0,
  };
}

export function analyzeBuildConsistency(builds) {
  if (builds.length < 3) return null;
  const peaks = builds.slice(0, 3).map((b) => b.peak_decibels).filter((p) => p > 0);
  if (peaks.length < 3) return null;
  const avg = peaks.reduce((s, p) => s + p, 0) / peaks.length;
  const maxDev = Math.max(...peaks.map((p) => Math.abs(p - avg)));
  if (maxDev <= 2) return { avgPeak: Math.round(avg) };
  return null;
}

export function analyzeModUsage(recordings, builds) {
  const counts = {};
  for (const item of [...recordings, ...builds]) {
    let mods = [];
    try { mods = JSON.parse(item.modifications || "[]"); } catch {}
    for (const m of mods) counts[m] = (counts[m] || 0) + 1;
  }
  return counts;
}

export function analyzeSwitchUsage(recordings, builds) {
  const counts = {};
  for (const item of [...recordings, ...builds]) {
    if (item.switch_type) counts[item.switch_type] = (counts[item.switch_type] || 0) + 1;
  }
  return counts;
}

export function analyzeWpmTrend(wpmHistory) {
  if (!wpmHistory || wpmHistory.length < 3) return null;
  const recent = wpmHistory.slice(-3);
  const earlier = wpmHistory.slice(-6, -3);
  if (earlier.length === 0) return { trend: "stable", recent: recent[recent.length - 1] };
  const recentAvg = recent.reduce((s, w) => s + w, 0) / recent.length;
  const earlierAvg = earlier.reduce((s, w) => s + w, 0) / earlier.length;
  const diff = recentAvg - earlierAvg;
  if (Math.abs(diff) < 3) return { trend: "stable", recent: recentAvg };
  return { trend: diff > 0 ? "improving" : "declining", recent: recentAvg, diff: Math.abs(diff) };
}

// --- Profile Builder ---

export function buildAcousticProfile(recordings, builds) {
  if (recordings.length === 0 && builds.length === 0) return null;

  const heatmap = aggregateHeatmaps(recordings);
  const dominantProfile = findDominantSoundProfile(recordings);
  const dbRange = analyzeDbRange(recordings);
  const modUsage = analyzeModUsage(recordings, builds);
  const switchUsage = analyzeSwitchUsage(recordings, builds);
  const topMods = Object.entries(modUsage).sort((a, b) => b[1] - a[1]).map(([mod]) => mod);
  const topSwitch = Object.entries(switchUsage).sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    totalRecordings: recordings.length,
    totalBuilds: builds.length,
    dominantProfile,
    dbRange,
    topMods,
    topSwitch,
    heatmap,
    loudKeys: findLoudKeys(heatmap),
    quietKeys: findQuietKeys(heatmap),
    modUsage,
    switchUsage,
  };
}

// --- Insight Generation ---

const PROFILE_MOD_RECS = {
  thocky: "Tape mod (2–3 layers), case foam, and Krytox 205g0 lube deepen the thock.",
  clacky: "Switch films and light tape mod (1–2 layers) keep the clack crisp and defined.",
  creamy: "Generous switch lube and poron plate foam smooth out the creamy sound.",
  marbly: "Switch films and a PE sheet mod preserve the marbled resonance.",
  clicky: "Switch films tighten housing for a cleaner, more consistent click.",
};

function loudKeyRec(key) {
  if (key.key === " ") {
    return `Averages ${key.avg_db.toFixed(0)} dB — ${Math.round(key.delta)} dB above your board. Band-aid mod + dielectric grease on stabilizers, or tape mod, will reduce rattle.`;
  }
  return `Averages ${key.avg_db.toFixed(0)} dB — ${Math.round(key.delta)} dB above your board. Consider lubing the switch or adding films to tighten the housing.`;
}

export function generateAcousticInsights(recordings, builds, wpmHistory) {
  const insights = [];
  const profile = buildAcousticProfile(recordings, builds);
  if (!profile) return insights;

  const { dominantProfile, dbRange, heatmap, loudKeys, quietKeys, topMods, topSwitch, switchUsage } = profile;

  // 1. Loudest key
  if (loudKeys.length > 0) {
    const k = loudKeys[0];
    insights.push({
      id: "loud_key",
      icon: Volume2,
      priority: k.delta > 6 ? "high" : "medium",
      title: `Your ${k.label} is ${Math.round(k.delta)} dB louder`,
      description: loudKeyRec(k),
      action: { label: "Get mods", path: "/recommend" },
    });
  }

  // 2. Uneven peaks
  if (hasUnevenPeaks(heatmap)) {
    insights.push({
      id: "uneven_peaks",
      icon: AlertTriangle,
      priority: "medium",
      title: "Uneven sound distribution",
      description: "Your heatmap shows inconsistent peaks across keys. A force break mod or PE foam sheet can help even out the sound profile.",
      action: { label: "Learn more", path: "/recommend" },
    });
  }

  // 3. Sound profile
  if (dominantProfile) {
    const label = profileStyles[dominantProfile]?.label || dominantProfile;
    insights.push({
      id: "sound_profile",
      icon: Sparkles,
      priority: "medium",
      title: `Your builds lean "${label}"`,
      description: PROFILE_MOD_RECS[dominantProfile] || PROFILE_MOD_RECS.thocky,
      action: { label: "Enhance it", path: "/recommend" },
    });
  }

  // 4. Build consistency
  const consistency = analyzeBuildConsistency(builds);
  if (consistency) {
    insights.push({
      id: "build_consistency",
      icon: Target,
      priority: "low",
      title: `Last 3 builds peak at ~${consistency.avgPeak} dB`,
      description: consistency.avgPeak > 55
        ? "You're consistently in the loud range. Try silent switches like ZealPC Tangerine V2 or Cherry MX Silent Red for a quieter setup."
        : "Your builds are consistently quiet. Want to experiment with a clackier or thockier sound profile?",
      action: { label: "Browse switches", path: "/switches" },
    });
  }

  // 5. WPM trend
  const wpmTrend = analyzeWpmTrend(wpmHistory);
  if (wpmTrend?.trend === "declining") {
    insights.push({
      id: "wpm_decline",
      icon: TrendingDown,
      priority: "medium",
      title: `WPM dipped ${Math.round(wpmTrend.diff)} recently`,
      description: "Your typing speed has decreased in recent sessions. A focused typing drill could help you get back on track.",
      action: { label: "Practice", path: "/" },
    });
  } else if (wpmTrend?.trend === "improving") {
    insights.push({
      id: "wpm_improving",
      icon: TrendingUp,
      priority: "low",
      title: `WPM up ${Math.round(wpmTrend.diff)} — nice!`,
      description: "Your typing speed is trending upward. Keep the momentum going!",
    });
  }

  // 6. Missing tape mod for thocky
  if (dominantProfile === "thocky" && !topMods.includes("tape_mod")) {
    insights.push({
      id: "missing_tape",
      icon: Wrench,
      priority: "medium",
      title: "Try tape mod for deeper thock",
      description: "2–3 layers of painter's tape on the PCB back is a free, reversible mod that deepens the thock profile.",
      action: { label: "How to", path: "/recommend" },
    });
  }

  // 7. High dB → O-rings
  if (dbRange && dbRange.avg > 55 && !topMods.includes("o_rings_single") && !topMods.includes("o_rings_double")) {
    insights.push({
      id: "high_db_orings",
      icon: Volume2,
      priority: "high",
      title: `Average is ${dbRange.avg.toFixed(0)} dB — above optimal`,
      description: "O-rings cushion bottom-out impact and typically reduce peak noise by 2–4 dB. A quick win for quieter typing.",
      action: { label: "Get mods", path: "/recommend" },
    });
  }

  // 8. Switch variety
  if (topSwitch && Object.keys(switchUsage).length === 1 && recordings.length >= 3) {
    insights.push({
      id: "switch_variety",
      icon: Keyboard,
      priority: "low",
      title: `Only tested ${topSwitch} switches`,
      description: `Trying a different switch type (${topSwitch === "Linear" ? "Tactile or Clicky" : "Linear"}) could reveal a sound profile you'll love.`,
      action: { label: "Browse", path: "/switches" },
    });
  }

  // 9. Quiet key
  if (quietKeys.length > 0 && loudKeys.length === 0) {
    const k = quietKeys[0];
    insights.push({
      id: "quiet_key",
      icon: Lightbulb,
      priority: "low",
      title: `Your ${k.label} is quieter than average`,
      description: `Averages ${k.avg_db.toFixed(0)} dB — ${Math.abs(Math.round(k.delta))} dB below your board. Lubing stabilizers can help even out the sound.`,
    });
  }

  const order = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => (order[a.priority] ?? 2) - (order[b.priority] ?? 2));
  return insights;
}