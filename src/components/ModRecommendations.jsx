import React from "react";
import { Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import { generateRecommendations } from "@/lib/modRecommendations";

const PRIORITY_CONFIG = {
  high: {
    label: "High Priority",
    bg: "bg-orange-500/8",
    text: "text-orange-400",
    border: "border-orange-500/20",
    badge: "bg-orange-500/20 text-orange-400",
  },
  medium: {
    label: "Medium Priority",
    bg: "bg-blue-500/8",
    text: "text-blue-400",
    border: "border-blue-500/20",
    badge: "bg-blue-500/20 text-blue-400",
  },
  low: {
    label: "All Good",
    bg: "bg-emerald-500/8",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    badge: "bg-emerald-500/20 text-emerald-400",
  },
};

export default function ModRecommendations({ profile }) {
  const recs = generateRecommendations(profile);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Mod Recommendations</h3>
      </div>
      <div className="space-y-2">
        {recs.map((rec, i) => {
          const config = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.medium;
          const Icon = rec.priority === "low" ? CheckCircle2 : AlertTriangle;
          return (
            <div key={i} className={`rounded-lg border p-3 ${config.bg} ${config.border}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${config.text}`} />
                  <span className="text-sm font-medium truncate">{rec.mod}</span>
                </div>
                <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${config.badge}`}>
                  {config.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{rec.reason}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}