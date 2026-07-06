import React from "react";
import { ArrowRight, TrendingDown, TrendingUp, Minus } from "lucide-react";

function parseMods(rec) {
  try {
    const arr = JSON.parse(rec.modifications || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

const MOD_LABELS = {
  o_rings_single: "O-Rings (Single)",
  o_rings_double: "O-Rings (Double)",
  lubed: "Lubed",
  filmed: "Filmed",
  tape_mod: "Tape Mod",
};

function DeltaStat({ label, before, after, unit = "", invert = false }) {
  const delta = (after ?? 0) - (before ?? 0);
  const changed = Math.abs(delta) >= 0.1 && before != null && after != null;
  const isGood = invert ? delta > 0 : delta < 0;
  const isBad = invert ? delta < 0 : delta > 0;

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-muted-foreground">
          {before != null ? before.toFixed(1) + unit : "—"}
        </span>
        {changed && (
          <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
            isGood ? "bg-emerald-500/15 text-emerald-400" : isBad ? "bg-orange-500/15 text-orange-400" : "bg-muted text-muted-foreground"
          }`}>
            {isGood ? <TrendingDown className="w-2.5 h-2.5" /> : isBad ? <TrendingUp className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
            {Math.abs(delta).toFixed(1)}
          </div>
        )}
        <span className="text-sm font-mono text-muted-foreground/40">→</span>
        <span className="text-sm font-mono font-bold">
          {after != null ? after.toFixed(1) + unit : "—"}
        </span>
      </div>
    </div>
  );
}

function ModDiff({ label, before, after }) {
  const changed = (before || "") !== (after || "");
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {changed ? (
          <>
            <span className="text-xs text-muted-foreground line-through">{before || "—"}</span>
            <ArrowRight className="w-3 h-3 text-primary" />
            <span className="text-xs font-semibold text-primary">{after || "—"}</span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">{before || "—"}</span>
        )}
      </div>
    </div>
  );
}

export default function ModComparison({ before, after }) {
  if (!before || !after) return null;

  const dbDelta = (after.avg_decibels ?? 0) - (before.avg_decibels ?? 0);
  const isQuieter = dbDelta < -0.1;
  const isLouder = dbDelta > 0.1;

  const beforeMods = parseMods(before);
  const afterMods = parseMods(after);
  const allModKeys = [...new Set([...beforeMods, ...afterMods])];

  return (
    <div className="space-y-4">
      {/* Verdict banner */}
      <div className={`rounded-xl p-4 border ${
        isQuieter
          ? "bg-emerald-500/10 border-emerald-500/30"
          : isLouder
          ? "bg-orange-500/10 border-orange-500/30"
          : "bg-muted border-border"
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">After mods</p>
            <p className={`text-lg font-bold ${
              isQuieter ? "text-emerald-400" : isLouder ? "text-orange-400" : "text-muted-foreground"
            }`}>
              {isQuieter
                ? `${Math.abs(dbDelta).toFixed(1)} dB quieter`
                : isLouder
                ? `${dbDelta.toFixed(1)} dB louder`
                : "No change"}
            </p>
          </div>
          {isQuieter ? (
            <TrendingDown className="w-8 h-8 text-emerald-400" />
          ) : isLouder ? (
            <TrendingUp className="w-8 h-8 text-orange-400" />
          ) : (
            <Minus className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Before / After names */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Before</p>
          <p className="text-sm font-semibold truncate">{before.name}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">After</p>
          <p className="text-sm font-semibold truncate">{after.name}</p>
        </div>
      </div>

      {/* Acoustic stats */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Acoustic Comparison
        </h3>
        <DeltaStat label="Average dB" before={before.avg_decibels} after={after.avg_decibels} unit=" dB" />
        <DeltaStat label="Peak dB" before={before.peak_decibels} after={after.peak_decibels} unit=" dB" />
        <DeltaStat label="Min dB" before={before.min_decibels} after={after.min_decibels} unit=" dB" />
        {before.wpm > 0 && after.wpm > 0 && (
          <DeltaStat label="WPM" before={before.wpm} after={after.wpm} invert />
        )}
      </div>

      {/* Mod differences */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
          What Changed
        </h3>
        <ModDiff label="Switch Type" before={before.switch_type} after={after.switch_type} />
        <ModDiff label="Keycap Profile" before={before.keycap_profile} after={after.keycap_profile} />
        <ModDiff label="Category" before={before.category} after={after.category} />
        {allModKeys.map((modKey) => (
          <ModDiff
            key={modKey}
            label={MOD_LABELS[modKey] || modKey}
            before={beforeMods.includes(modKey) ? "Yes" : "No"}
            after={afterMods.includes(modKey) ? "Yes" : "No"}
          />
        ))}
      </div>
    </div>
  );
}