import React from "react";
import { Link } from "react-router-dom";
import { Star, Volume2, Gauge, Zap } from "lucide-react";

const TYPE_COLORS = {
  Linear: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Tactile: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Clicky: "bg-amber-500/15 text-amber-400 border-amber-500/20",
};

const PITCH_COLORS = {
  Thocky: "bg-purple-500/15 text-purple-400",
  Clacky: "bg-cyan-500/15 text-cyan-400",
  Marbly: "bg-pink-500/15 text-pink-400",
  Creamy: "bg-orange-500/15 text-orange-400",
  "High-pitched": "bg-yellow-500/15 text-yellow-400",
  "Low-pitched": "bg-indigo-500/15 text-indigo-400",
  Neutral: "bg-muted text-muted-foreground",
};

export default function SwitchCard({ switchEntry }) {
  const rating = switchEntry.responsiveness_rating || 0;

  return (
    <Link
      to={`/switches/${switchEntry.id}`}
      className="block bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm truncate">{switchEntry.name}</h3>
          {switchEntry.manufacturer && (
            <p className="text-xs text-muted-foreground truncate">{switchEntry.manufacturer}</p>
          )}
        </div>
        <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${TYPE_COLORS[switchEntry.switch_type] || ""}`}>
          {switchEntry.switch_type}
        </span>
      </div>

      {switchEntry.pitch_profile && switchEntry.pitch_profile !== "Neutral" && (
        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full mb-2 ${PITCH_COLORS[switchEntry.pitch_profile] || PITCH_COLORS.Neutral}`}>
          {switchEntry.pitch_profile}
        </span>
      )}

      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="text-center">
          <Volume2 className="w-3.5 h-3.5 mx-auto text-muted-foreground/60 mb-0.5" />
          <p className="text-[10px] text-muted-foreground">Avg dB</p>
          <p className="text-sm font-mono font-bold">
            {switchEntry.avg_decibels != null ? switchEntry.avg_decibels.toFixed(1) : "—"}
          </p>
        </div>
        <div className="text-center">
          <Gauge className="w-3.5 h-3.5 mx-auto text-muted-foreground/60 mb-0.5" />
          <p className="text-[10px] text-muted-foreground">Force</p>
          <p className="text-sm font-mono font-bold">
            {switchEntry.actuation_force ? `${switchEntry.actuation_force}g` : "—"}
          </p>
        </div>
        <div className="text-center">
          <Zap className="w-3.5 h-3.5 mx-auto text-muted-foreground/60 mb-0.5" />
          <p className="text-[10px] text-muted-foreground">Snappy</p>
          <div className="flex items-center justify-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`w-3 h-3 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {switchEntry.sound_test_count > 0 && (
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          {switchEntry.sound_test_count} sound test{switchEntry.sound_test_count !== 1 ? "s" : ""}
        </p>
      )}
    </Link>
  );
}