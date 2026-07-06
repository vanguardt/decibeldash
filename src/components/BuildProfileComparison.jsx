import React from "react";
import { TrendingDown, TrendingUp, Minus, Boxes } from "lucide-react";
import KeyboardHeatmap from "@/components/KeyboardHeatmap";

const MOD_LABELS = {
  o_rings_single: "O-Rings (Single)",
  o_rings_double: "O-Rings (Double)",
  lubed: "Lubed",
  filmed: "Filmed",
  tape_mod: "Tape Mod",
};

function parseMods(rec) {
  try {
    const arr = JSON.parse(rec.modifications || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

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

function ProfileColumn({ profile }) {
  const mods = parseMods(profile);

  return (
    <div className="bg-background border border-border rounded-lg p-3">
      <p className="text-sm font-semibold truncate mb-1">{profile.name}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
          {profile.build_type}
        </span>
        {profile.switch_type && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
            {profile.switch_type}
          </span>
        )}
        {profile.keycap_profile && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
            {profile.keycap_profile}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1 text-center mb-2">
        <div>
          <p className="text-[8px] uppercase text-muted-foreground">Avg</p>
          <p className="text-sm font-mono font-bold text-emerald-400">
            {profile.avg_decibels?.toFixed(0) ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-[8px] uppercase text-muted-foreground">Peak</p>
          <p className="text-sm font-mono font-bold text-amber-400">
            {profile.peak_decibels?.toFixed(0) ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-[8px] uppercase text-muted-foreground">Min</p>
          <p className="text-sm font-mono font-bold text-blue-400">
            {profile.min_decibels > 0 ? profile.min_decibels?.toFixed(0) : "—"}
          </p>
        </div>
      </div>

      {profile.wpm > 0 && (
        <p className="text-[9px] text-center text-primary font-mono mb-2">{profile.wpm} WPM</p>
      )}

      {/* Mods */}
      {mods.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {mods.map((mod) => (
            <span key={mod} className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {MOD_LABELS[mod] || mod.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      {/* Heatmap */}
      {profile.key_heatmap ? (
        <div className="mt-1">
          <KeyboardHeatmap recording={profile} />
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground text-center py-2">No heatmap data</p>
      )}
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
            <span className="text-xs font-semibold text-primary">{after || "—"}</span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">{before || "—"}</span>
        )}
      </div>
    </div>
  );
}

export default function BuildProfileComparison({ before, after }) {
  if (!before || !after) return null;

  const dbDelta = (after.avg_decibels ?? 0) - (before.avg_decibels ?? 0);
  const isQuieter = dbDelta < -0.1;
  const isLouder = dbDelta > 0.1;

  const beforeMods = parseMods(before);
  const afterMods = parseMods(after);
  const allModKeys = [...new Set([...beforeMods, ...afterMods])];

  const beforeHasHeatmap = !!(before.key_heatmap);
  const afterHasHeatmap = !!(after.key_heatmap);

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
            <p className="text-xs text-muted-foreground mb-0.5">dB difference</p>
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

      {/* Build names */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Build A</p>
          <p className="text-sm font-semibold truncate">{before.name}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Build B</p>
          <p className="text-sm font-semibold truncate">{after.name}</p>
        </div>
      </div>

      {/* Side-by-side profiles with heatmaps */}
      <div className="grid grid-cols-2 gap-2">
        <ProfileColumn profile={before} />
        <ProfileColumn profile={after} />
      </div>

      {/* Acoustic comparison */}
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

      {/* Configuration differences */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Build Differences
        </h3>
        <ModDiff label="Build Type" before={before.build_type} after={after.build_type} />
        <ModDiff label="Switch Type" before={before.switch_type} after={after.switch_type} />
        <ModDiff label="Keycap Profile" before={before.keycap_profile} after={after.keycap_profile} />
        {allModKeys.map((modKey) => (
          <ModDiff
            key={modKey}
            label={MOD_LABELS[modKey] || modKey.replace(/_/g, " ")}
            before={beforeMods.includes(modKey) ? "Yes" : "No"}
            after={afterMods.includes(modKey) ? "Yes" : "No"}
          />
        ))}
      </div>

      {/* Heatmap availability note */}
      {(!beforeHasHeatmap || !afterHasHeatmap) && (beforeHasHeatmap || afterHasHeatmap) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
          <Boxes className="w-3.5 h-3.5 shrink-0" />
          <span>
            {!beforeHasHeatmap && "Build A has no heatmap data. "}
            {!afterHasHeatmap && "Build B has no heatmap data."}
            Heatmap patterns can't be compared without data on both builds.
          </span>
        </div>
      )}
    </div>
  );
}