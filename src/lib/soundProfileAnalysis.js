// Keyboard Sound Profile analysis engine.
// Computes 10 acoustic metrics, a switch profile guess, and a
// keyboard quality score (0–100) from frequency band data captured
// during recording plus decibel samples and the per-key heatmap.

const clamp100 = (n) => Math.max(0, Math.min(100, Math.round(n)));

const CENTROID_FREQS = { subBass: 40, bass: 155, lowMid: 375, mid: 1250, highMid: 3000, treble: 10000 };

function bandTotal(b) {
  if (!b) return 1;
  return (b.subBass || 0) + (b.bass || 0) + (b.lowMid || 0) + (b.mid || 0) + (b.highMid || 0) + (b.treble || 0) || 1;
}

const lowRatio = (b) => ((b.subBass || 0) + (b.bass || 0)) / bandTotal(b);
const lowMidRatio = (b) => ((b.subBass || 0) + (b.bass || 0) + (b.lowMid || 0)) / bandTotal(b);
const midRatio = (b) => ((b.lowMid || 0) + (b.mid || 0)) / bandTotal(b);
const highRatio = (b) => ((b.highMid || 0) + (b.treble || 0)) / bandTotal(b);
const trebleRatio = (b) => (b.treble || 0) / bandTotal(b);

function spectralCentroid(b) {
  if (!b) return 0;
  let w = 0, t = 0;
  for (const [k, f] of Object.entries(CENTROID_FREQS)) { w += f * (b[k] || 0); t += (b[k] || 0); }
  return t > 0 ? w / t : 0;
}

// Average the frequency timeline into a single band set
export function averageFreqTimeline(timeline) {
  if (!timeline || timeline.length === 0) return null;
  const acc = { subBass: 0, bass: 0, lowMid: 0, mid: 0, highMid: 0, treble: 0 };
  let count = 0;
  for (const snap of timeline) {
    const b = snap.bands || snap;
    if (!b) continue;
    for (const k of Object.keys(acc)) acc[k] += b[k] || 0;
    count++;
  }
  if (count === 0) return null;
  for (const k of Object.keys(acc)) acc[k] /= count;
  return acc;
}

// Heatmap-derived consistency (std dev of per-key avg dB)
function heatmapStats(heatmap) {
  if (!heatmap) return null;
  const keys = Object.values(heatmap).filter((s) => s.hits > 0);
  if (keys.length < 2) return null;
  const avg = keys.reduce((s, k) => s + (k.avg_db || 0), 0) / keys.length;
  const variance = keys.reduce((s, k) => s + Math.pow((k.avg_db || 0) - avg, 2), 0) / keys.length;
  const stdDev = Math.sqrt(variance);
  return { avg, stdDev, count: keys.length };
}

function stabilizerEffect(heatmap) {
  const stats = heatmapStats(heatmap);
  if (!stats) return { score: null, spacebarDelta: null };
  const space = heatmap[" "];
  let delta = 0;
  if (space && space.hits > 0) {
    delta = (space.avg_db || 0) - stats.avg;
  }
  // Large positive delta = rattle/poor stab. Variance = uneven board.
  const deltaPenalty = Math.max(0, delta) * 12;
  const variancePenalty = stats.stdDev * 6;
  const score = clamp100(100 - deltaPenalty - variancePenalty);
  return { score, spacebarDelta: delta, boardStdDev: stats.stdDev };
}

// Main entry point. `input` shape:
// { bands, freqTimeline, decibelSamples, avgDb, peakDb, minDb, heatmap, duration, modifications }
export function analyzeSoundProfile(input) {
  const {
    bands,
    freqTimeline,
    decibelSamples = [],
    avgDb = 0,
    peakDb = 0,
    minDb = 0,
    heatmap = {},
    duration = 0,
    modifications = [],
  } = input;

  // Use averaged timeline if no direct bands provided
  const b = bands || averageFreqTimeline(freqTimeline) || {
    subBass: 0, bass: 0, lowMid: 0, mid: 0, highMid: 0, treble: 0,
  };

  const centroid = spectralCentroid(b);
  const dynRange = Math.max(0, peakDb - minDb);
  const sharpness = clamp100((dynRange / 30) * 100); // transient sharpness
  const mods = Array.isArray(modifications)
    ? modifications
    : (() => { try { return JSON.parse(modifications || "[]"); } catch { return []; } })();

  // --- 10 acoustic metrics (0–100) ---

  // 1. Clackiness — high-frequency energy + sharp attack
  const clackiness = clamp100(highRatio(b) * 200 * 0.6 + sharpness * 0.4);

  // 2. Thockiness — low/low-mid dominance + lower average loudness
  const thockBase = lowMidRatio(b) * 150;
  const lowAvgScore = clamp100(((55 - avgDb) / 20) * 100);
  const thockiness = clamp100(thockBase * 0.6 + lowAvgScore * 0.4);

  // 3. Hollow resonance — wide dynamic range + low floor + mid emphasis
  const rangeScore = clamp100((dynRange / 25) * 100);
  const lowFloorScore = clamp100(((50 - minDb) / 15) * 100);
  const midEmphasis = midRatio(b) * 150;
  const hollowResonance = clamp100(rangeScore * 0.4 + lowFloorScore * 0.3 + midEmphasis * 0.3);

  // 4. Deepness — low-frequency dominance + low spectral centroid
  const deepBase = lowRatio(b) * 130;
  const centroidScore = clamp100(((1000 - centroid) / 900) * 100);
  const deepness = clamp100(deepBase * 0.6 + centroidScore * 0.4);

  // 5. Brightness — high-frequency energy + high spectral centroid
  const brightBase = highRatio(b) * 150;
  const centroidHigh = clamp100(((centroid - 500) / 2500) * 100);
  const brightness = clamp100(brightBase * 0.5 + centroidHigh * 0.5);

  // 6. Dampening — compressed dynamic range + suppressed peaks + mods
  const compRange = clamp100(100 - (dynRange / 25) * 100);
  const peakSupp = clamp100(((70 - peakDb) / 30) * 100);
  const modBoost = mods.some((m) => ["tape_mod", "lubed", "filmed", "o_rings_double"].includes(m)) ? 12 : 0;
  const dampening = clamp100(compRange * 0.5 + peakSupp * 0.5 + modBoost);

  // 7. Noise floor — cleanliness rating (lower floor = cleaner = higher)
  const noiseFloorDb = minDb;
  const noiseFloor = clamp100(((50 - minDb) / 20) * 100);

  // 8. Stabilizer effectiveness
  const stab = stabilizerEffect(heatmap);

  // 9. Case resonance — boxy mid/low-mid cavity emphasis
  const boxy = ((b.lowMid || 0) + (b.mid || 0) * 0.5) / bandTotal(b) * 200;
  const caseResonance = clamp100(boxy * 0.5 + hollowResonance * 0.5);

  // 10. Plate resonance — high-mid ring (2–4 kHz) + transient sharpness
  const ring = ((b.highMid || 0) / bandTotal(b)) * 250;
  const plateResonance = clamp100(ring * 0.7 + sharpness * 0.3);

  // --- Switch profile guess ---
  const switchGuess = guessSwitch({
    avgDb, brightness, sharpness, dampening, treble: trebleRatio(b), mid: midRatio(b), low: lowRatio(b),
  });

  // --- Sound signature ---
  const soundSignature = computeSignature(avgDb, peakDb, minDb, hollowResonance, clackiness, thockiness);

  // --- Keyboard quality score (0–100) ---
  const stats = heatmapStats(heatmap);
  const consistencyScore = stats ? clamp100(100 - stats.stdDev * 10) : 70;
  const resonanceBalance = clamp100(100 - Math.abs(hollowResonance - 50) * 0.8 - Math.abs(clackiness - 40) * 0.4);
  const stabScore = stab.score != null ? stab.score : 70;
  const qualityScore = clamp100(
    consistencyScore * 0.25 +
    stabScore * 0.2 +
    noiseFloor * 0.15 +
    resonanceBalance * 0.2 +
    dampening * 0.2
  );

  return {
    metrics: {
      clackiness,
      thockiness,
      hollowResonance,
      deepness,
      brightness,
      dampening,
      noiseFloor,        // cleanliness 0–100
      noiseFloorDb,      // raw dB value
      stabilizerEffect: stab.score,
      spacebarDelta: stab.spacebarDelta,
      caseResonance,
      plateResonance,
    },
    bands: b,
    centroid: Math.round(centroid),
    dynamicRange: Math.round(dynRange * 10) / 10,
    switchGuess: switchGuess.type,
    switchConfidence: switchGuess.confidence,
    soundSignature,
    qualityScore,
    consistencyScore,
  };
}

function guessSwitch({ avgDb, brightness, sharpness, dampening, treble, mid, low }) {
  // Silent: very quiet + well-dampened
  if (avgDb < 40 && dampening > 55) {
    return { type: "silent", confidence: clamp100((dampening + (40 - avgDb) * 3) / 2) };
  }
  // Clicky: strong treble spike + sharp transients
  if (treble > 0.22 || (brightness > 65 && sharpness > 50)) {
    return { type: "clicky", confidence: clamp100(treble * 300 + sharpness * 0.4) };
  }
  // Tactile: mid emphasis + moderate transient sharpness
  if (mid > 0.38 && sharpness > 25 && sharpness < 60) {
    return { type: "tactile", confidence: clamp100(mid * 200 + (60 - Math.abs(sharpness - 42)) * 0.6) };
  }
  // Linear: smooth, low dynamic range, balanced low-mid
  return {
    type: "linear",
    confidence: clamp100((100 - sharpness) * 0.5 + low * 100 + mid * 100),
  };
}

function computeSignature(avgDb, peakDb, minDb, hollow, clack, thock) {
  if (hollow > 60 && (peakDb - minDb) > 20) return "Hollow";
  if (thock > 60 && avgDb < 50) return "Thock";
  if (clack > 60 || avgDb >= 54) return "Clack";
  return "Balanced";
}

export const switchGuessStyles = {
  linear: { label: "Linear", className: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30" },
  tactile: { label: "Tactile", className: "bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30" },
  clicky: { label: "Clicky", className: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30" },
  silent: { label: "Silent", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30" },
};

export const signatureStyles = {
  Thock: { label: "Thock", className: "bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30" },
  Clack: { label: "Clack", className: "bg-orange-500/15 text-orange-600 dark:text-orange-300 border-orange-500/30" },
  Hollow: { label: "Hollow", className: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30" },
  Balanced: { label: "Balanced", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30" },
};

export const metricMeta = [
  { key: "clackiness", label: "Clackiness", desc: "High-frequency sharpness of keystroke attack" },
  { key: "thockiness", label: "Thockiness", desc: "Deep, low-frequency resonance depth" },
  { key: "hollowResonance", label: "Hollow Resonance", desc: "Echoey cavity resonance from the case" },
  { key: "deepness", label: "Deepness", desc: "Low-frequency dominance of the sound" },
  { key: "brightness", label: "Brightness", desc: "High-frequency presence and clarity" },
  { key: "dampening", label: "Dampening", desc: "How well transients are suppressed (mods/foam)" },
  { key: "noiseFloor", label: "Noise Floor", desc: "Cleanliness of the background (higher = cleaner)" },
  { key: "stabilizerEffect", label: "Stabilizer Effect", desc: "Evenness of large keys vs the board" },
  { key: "caseResonance", label: "Case Resonance", desc: "Boxy mid-frequency cavity emphasis" },
  { key: "plateResonance", label: "Plate Resonance", desc: "High-mid ring from the plate material" },
];