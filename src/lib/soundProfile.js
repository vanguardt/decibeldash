// Derive a sound profile from decibel levels and switch type
export const soundProfile = (r) => {
  const db = r.avg_decibels ?? 0;
  const peak = r.peak_decibels ?? db;
  const sw = (r.switch_type || "").toLowerCase();
  const mods = (() => {
    try { return JSON.parse(r.modifications || "[]"); } catch { return []; }
  })();

  if (sw.includes("click") || sw.includes("blue") || sw.includes("white")) return "clicky";
  if (mods.includes("lubed") && mods.includes("filmed") && peak < 55) return "creamy";
  if (db < 45) return "thocky";
  if (db >= 55 || peak >= 70) return "clacky";
  return db < 50 ? "thocky" : "clacky";
};

export const profileStyles = {
  clacky: { label: "Clacky", className: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  thocky: { label: "Thocky", className: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  clicky: { label: "Clicky", className: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  creamy: { label: "Creamy", className: "bg-pink-500/15 text-pink-400 border-pink-500/30" },
};