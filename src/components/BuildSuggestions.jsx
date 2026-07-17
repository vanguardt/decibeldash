import React from "react";
import {
  Lightbulb,
  Layers,
  Grid3x3,
  Square,
  Box,
  Wrench,
  Volume2,
  Target,
  Check,
  Circle,
} from "lucide-react";

// Styled "Build Suggestions" section — shows data-driven recommendations
// derived from the build's dominant sound profile and acoustic data.
export default function BuildSuggestions({ suggestions }) {
  if (!suggestions) return null;

  const {
    soundProfileLabel,
    switchType,
    keycapMaterial,
    plateMaterial,
    caseType,
    mods,
    dampeningLevel,
    dampeningNote,
    targetSoundProfile,
  } = suggestions;

  const dampeningColor =
    dampeningLevel === "Heavy" ? "bg-rose-500/15 text-rose-400 border-rose-500/20"
    : dampeningLevel === "Light" || dampeningLevel === "Minimal" ? "bg-sky-500/15 text-sky-400 border-sky-500/20"
    : "bg-amber-500/15 text-amber-400 border-amber-500/20";

  return (
    <div className="bg-gradient-to-br from-primary/5 to-card border border-primary/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-primary/10">
        <Lightbulb className="w-4 h-4 text-primary shrink-0" />
        <h3 className="text-sm font-bold">Build Suggestions</h3>
        {soundProfileLabel && (
          <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/20 text-primary">
            {soundProfileLabel} profile
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Switch type */}
        <SuggestionRow icon={Layers} label="Suggested Switch Type">
          <p className="text-xs font-medium">{switchType.type}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {switchType.models.map((m) => (
              <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {m}
              </span>
            ))}
          </div>
        </SuggestionRow>

        {/* Keycap material */}
        <SuggestionRow icon={Grid3x3} label="Keycap Material">
          <p className="text-xs leading-relaxed text-muted-foreground">{keycapMaterial}</p>
        </SuggestionRow>

        {/* Plate material */}
        <SuggestionRow icon={Square} label="Plate Material">
          <p className="text-xs leading-relaxed text-muted-foreground">{plateMaterial}</p>
        </SuggestionRow>

        {/* Case type */}
        <SuggestionRow icon={Box} label="Case Type">
          <p className="text-xs leading-relaxed text-muted-foreground">{caseType}</p>
        </SuggestionRow>

        {/* Mods */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Recommended Mods
            </span>
          </div>
          <div className="grid gap-1.5">
            {mods.map((mod) => (
              <div
                key={mod.key}
                className={`flex items-start gap-2 rounded-lg px-2.5 py-2 border ${
                  mod.applied
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-muted/50 border-border"
                }`}
              >
                {mod.applied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold">{mod.label}</span>
                    {mod.applied && (
                      <span className="text-[9px] font-medium text-emerald-500">Applied</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{mod.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dampening level */}
        <div className="flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
            Dampening
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${dampeningColor}`}>
            {dampeningLevel}
          </span>
        </div>
        {dampeningNote && (
          <p className="text-[11px] text-muted-foreground leading-snug -mt-1 pl-6">{dampeningNote}</p>
        )}

        {/* Target sound profile */}
        <div className="flex items-start gap-2 pt-1 border-t border-border">
          <Target className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Target Sound Profile
            </span>
            <p className="text-xs leading-relaxed text-foreground mt-0.5">{targetSoundProfile}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuggestionRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}