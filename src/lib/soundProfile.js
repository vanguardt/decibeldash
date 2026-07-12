// Derive a sound profile from decibel levels and switch type
export const soundProfile = (r) => {
  const db = r.avg_decibels ?? 0;
  const peak = r.peak_decibels ?? db;
  const sw = (r.switch_type || "").toLowerCase();
  const mods = (() => {
    try { return JSON.parse(r.modifications || "[]"); } catch { return []; }
  })();

  if (sw.includes("click") || sw.includes("blue") || sw.includes("white")) return "clicky";
  if (db < 38 && !sw.includes("click")) return "silent";
  if (mods.includes("lubed") && mods.includes("filmed") && peak < 55) return "creamy";
  if (sw.includes("box") || sw.includes("pom") || sw.includes("ink")) return "marbly";
  if (db < 45) return "thocky";
  if (db >= 55 || peak >= 70) return "clacky";
  return db < 50 ? "thocky" : "clacky";
};

export const recordingWithProfile = (r) => ({ ...r, soundProfile: soundProfile(r) });

// Compute the dominant sound profile for a build.
// If the build has recordings, use the most common profile among them.
// Otherwise derive from the build's own acoustic data.
export const getDominantSoundProfile = (build) => {
  let recordings = [];
  try {
    recordings = JSON.parse(build.recordings || "[]");
  } catch {
    recordings = [];
  }

  if (recordings.length > 0) {
    const counts = {};
    for (const r of recordings) {
      const sp = r.soundProfile || soundProfile(r);
      counts[sp] = (counts[sp] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }

  // Fall back to the build's own data
  if (build.soundProfile) return build.soundProfile;
  if (build.avg_decibels != null) return soundProfile(build);
  return null;
};

export const profileStyles = {
  silent: { label: "Silent", className: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40" },
  clacky: { label: "Clacky", className: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/40" },
  thocky: { label: "Thocky", className: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40" },
  clicky: { label: "Clicky", className: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/40" },
  creamy: { label: "Creamy", className: "bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/40" },
  marbly: { label: "Marbly", className: "bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40" },
};