// Build suggestion engine — generates actionable build recommendations
// from a BuildProfile's dominant sound profile and acoustic data.
// Returns a structured suggestion object used by the BuildSuggestions component.

import { getDominantSoundProfile } from "@/lib/soundProfile";

// Per-sound-profile suggestion templates.
const PROFILE_SUGGESTIONS = {
  thocky: {
    label: "Thocky",
    switchType: { type: "Linear or Tactile", models: ["Gateron Oil King", "NovelKeys Cream", "Bob U4T", "Durock T1"] },
    keycapMaterial: "PBT double-shot, Cherry or OEM profile — thick walls deepen the bottom-out",
    plateMaterial: "POM or Polycarbonate plate — flexible material adds low-end resonance",
    caseType: "Polycarbonate or POM case, gasket-mounted — softer flex for a deep, rounded thock",
    mods: {
      tapeMod: "2–3 layers painter's tape on the PCB back",
      peFoam: "PE sheet mod between PCB and plate for a deeper, fuller tone",
      lube: "Krytox 205g0 on stems + 105 on springs (bag lube)",
      forceBreak: "Force-break mod between top & bottom case to reduce hollow echo",
    },
    dampeningLevel: "Medium",
    targetSoundProfile: "Deep, rounded thock with minimal echo — aim for 42–48 dB avg",
  },
  clacky: {
    label: "Clacky",
    switchType: { type: "Tactile or Linear", models: ["Holy Panda", "C³ Equalz", "Cherry MX Black", "Kailh BOX Brown"] },
    keycapMaterial: "ABS Cherry profile (GMK-style) — sharper, higher-pitched clack",
    plateMaterial: "Brass or Copper plate — rigid metal plate preserves the crisp attack",
    caseType: "Aluminum case, top-mounted plate — rigidity produces a defined, sharp clack",
    mods: {
      tapeMod: "1–2 layers painter's tape — enough to tighten without dulling the clack",
      peFoam: "Skip PE foam — over-dampening kills the clack's attack",
      lube: "Thin film of Krytox 205g0 — just enough to remove scratch, not the clack",
      forceBreak: "Force-break mod to eliminate case rattle and tighten the sound",
    },
    dampeningLevel: "Light",
    targetSoundProfile: "Crisp, defined clack with attack — aim for 50–56 dB avg",
  },
  marbly: {
    label: "Marbly",
    switchType: { type: "Linear", models: ["C³ Tangerine V2", "Gateron Ink Black", "Durock Piano", "HMX Macchiato"] },
    keycapMaterial: "ABS Cherry profile — accentuates the glassy, marbled resonance",
    plateMaterial: "FR4 plate — adds a glassy, resonant quality to the bottom-out",
    caseType: "Aluminum case with FR4 or acrylic plate — rigidity + glassy tone",
    mods: {
      tapeMod: "2 layers painter's tape to tighten the sound",
      peFoam: "PE sheet mod only — avoids over-dampening the marble resonance",
      lube: "Krytox 105 on springs (bag lube) + light 205g0 on stems",
      forceBreak: "Force-break mod for a clean, resonant sound with no rattle",
    },
    dampeningLevel: "Light–Medium",
    targetSoundProfile: "Glassy, resonant marble tone — aim for 46–52 dB avg",
  },
  creamy: {
    label: "Creamy",
    switchType: { type: "Linear", models: ["Gateron Oil King", "C³ Tangerine V2", "Gateron CAP Yellow", "Tealios V2"] },
    keycapMaterial: "PBT Cherry profile with foam dampening — smooths out any harshness",
    plateMaterial: "FR4 or Polycarbonate plate, gasket-mounted — smooth, dampened flex",
    caseType: "Aluminum case, gasket-mounted + poron foam — fully dampened, premium feel",
    mods: {
      tapeMod: "3 layers painter's tape for maximum sound tightening",
      peFoam: "Case foam + plate foam (poron) + PE sheet — full dampening stack",
      lube: "Generous Krytox 205g0 on stems + 105 on springs",
      forceBreak: "Force-break mod + poron/silicone pads between case halves",
    },
    dampeningLevel: "Heavy",
    targetSoundProfile: "Smooth, buttery, fully-dampened cream — aim for 44–50 dB avg",
  },
  silent: {
    label: "Silent",
    switchType: { type: "Silent Linear or Tactile", models: ["Cherry MX Silent Red", "Gateron Silent Red", "Zilents V2", "Healios"] },
    keycapMaterial: "PBT OEM or Cherry profile — dense material reduces keycap ping",
    plateMaterial: "Polycarbonate or PP plate — soft, dampened plate absorbs impact",
    caseType: "Polycarbonate or plastic case, gasket-mounted — minimizes resonance",
    mods: {
      tapeMod: "1 layer painter's tape (optional) — minimal, to avoid adding stiffness",
      peFoam: "Case foam + plate foam (poron) + PE sheet — full sound absorption",
      lube: "Krytox 205g0 on stems + 105 on springs for silent switches",
      forceBreak: "Force-break mod + silicone/sorbothane pads for maximum isolation",
    },
    dampeningLevel: "Heavy",
    targetSoundProfile: "Whisper-quiet, cushioned keystrokes — aim for 36–42 dB avg",
  },
  clicky: {
    label: "Clicky",
    switchType: { type: "Clicky", models: ["Kailh BOX Jade", "Kailh BOX White", "Cherry MX Blue", "Kailh BOX Navy"] },
    keycapMaterial: "PBT Cherry profile — crisp without adding mush",
    plateMaterial: "Brass plate — rigid plate lets the click bar resonate cleanly",
    caseType: "Aluminum case, top-mounted — rigidity keeps the click sharp and defined",
    mods: {
      tapeMod: "Skip tape mod — preserves the click's sharpness",
      peFoam: "Skip foam — dampening muddies the click",
      lube: "Krytox 105 on springs only (bag lube) — reduces ping without touching the click",
      forceBreak: "Force-break mod to remove case rattle around the click",
    },
    dampeningLevel: "Minimal",
    targetSoundProfile: "Sharp, defined click with no rattle — aim for 54–60 dB avg",
  },
};

const FALLBACK = {
  label: "Balanced",
  switchType: { type: "Linear or Tactile", models: ["Gateron Yellow", "Cherry MX Brown", "Durock T1"] },
  keycapMaterial: "PBT Cherry or OEM profile — versatile, balanced sound",
  plateMaterial: "FR4 plate, gasket-mounted — neutral baseline with slight flex",
  caseType: "Aluminum case, gasket-mounted — versatile, neutral baseline",
  mods: {
    tapeMod: "2 layers painter's tape as a starting point",
    peFoam: "Poron plate foam + PE sheet — moderate dampening",
    lube: "Krytox 205g0 on stems + 105 on springs",
    forceBreak: "Force-break mod to reduce case echo",
  },
  dampeningLevel: "Medium",
  targetSoundProfile: "Balanced, clean sound with no dominant coloration — aim for 45–52 dB avg",
};

// Generate build suggestions from a build profile + its recordings.
// Uses the dominant sound profile and acoustic data (avg/peak dB) to tune
// the dampening recommendation and whether to push toward quieter output.
export function generateBuildSuggestions(build) {
  const dominant = getDominantSoundProfile(build);
  const base = (dominant && PROFILE_SUGGESTIONS[dominant]) || FALLBACK;

  const avgDb = build.avg_decibels ?? null;
  const peakDb = build.peak_decibels ?? null;

  // Parse existing mods so we can flag which are already applied
  let existingMods = [];
  try { existingMods = JSON.parse(build.modifications || "[]"); } catch {}

  const modApplied = (key) => {
    const k = key.toLowerCase();
    return existingMods.some((m) => m.toLowerCase().includes(k));
  };

  // Tune dampening based on acoustic data: if the build is louder than the
  // target range for its profile, push the dampening level up a notch.
  let dampeningLevel = base.dampeningLevel;
  let dampeningNote = "";
  if (avgDb != null) {
    const loudForProfile =
      (dominant === "thocky" && avgDb > 50) ||
      (dominant === "clacky" && avgDb > 56) ||
      (dominant === "marbly" && avgDb > 52) ||
      (dominant === "creamy" && avgDb > 50) ||
      (dominant === "silent" && avgDb > 42) ||
      (dominant === "clicky" && avgDb > 60) ||
      (!dominant && avgDb > 55);

    if (loudForProfile && dominant !== "clicky") {
      dampeningLevel = "Heavy";
      dampeningNote = `Your avg of ${avgDb.toFixed(1)} dB is above this profile's target — heavier dampening recommended.`;
    } else if (avgDb != null) {
      dampeningNote = `Your avg of ${avgDb.toFixed(1)} dB is within range — current dampening is appropriate.`;
    }
  }

  // Build the mods list with applied-status flags
  const modEntries = [
    { key: "tapeMod", label: "Tape Mod", value: base.mods.tapeMod, applied: modApplied("tape") },
    { key: "peFoam", label: "PE Foam", value: base.mods.peFoam, applied: modApplied("pe_foam") || modApplied("pe foam") || modApplied("case_foam") || modApplied("plate_foam") },
    { key: "lube", label: "Lube", value: base.mods.lube, applied: modApplied("lubed") || modApplied("lube") },
    { key: "forceBreak", label: "Force Break", value: base.mods.forceBreak, applied: modApplied("force_break") || modApplied("force break") },
  ];

  return {
    soundProfile: dominant,
    soundProfileLabel: base.label,
    switchType: base.switchType,
    keycapMaterial: base.keycapMaterial,
    plateMaterial: base.plateMaterial,
    caseType: base.caseType,
    mods: modEntries,
    dampeningLevel,
    dampeningNote,
    targetSoundProfile: base.targetSoundProfile,
    avgDb,
    peakDb,
  };
}