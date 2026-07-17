import React from "react";

// A labeled 0–100 metric bar with color-coded value.
export default function MetricBar({ label, value, desc, max = 100, accent = "emerald" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const colors = {
    emerald: "bg-emerald-500",
    sky: "bg-sky-500",
    violet: "bg-violet-500",
    amber: "bg-amber-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
    rose: "bg-rose-500",
  };
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-xs font-mono font-bold">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${colors[accent] || colors.emerald} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {desc && <p className="text-[10px] text-muted-foreground leading-snug">{desc}</p>}
    </div>
  );
}