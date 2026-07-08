import React, { useState, useRef } from "react";
import { Share2, X, Check, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import SoundProfileBadge from "@/components/SoundProfileBadge";
import RecordingAudioPlayer from "@/components/RecordingAudioPlayer";
import ComparisonShareModal from "@/components/ComparisonShareModal";

export default function CreatorComparison({ recordings }) {
  const { toast } = useToast();
  const [selected, setSelected] = useState([]);
  const [showShare, setShowShare] = useState(false);
  const comparisonRef = useRef(null);

  const toggleSelect = (rec) => {
    if (selected.find((r) => r.id === rec.id)) {
      setSelected(selected.filter((r) => r.id !== rec.id));
    } else if (selected.length < 4) {
      setSelected([...selected, rec]);
    } else {
      toast({ title: "Max 4 recordings", description: "Remove one to add another", variant: "destructive" });
    }
  };

  return (
    <div>
      {selected.length >= 2 && (
        <div ref={comparisonRef} className="bg-card border border-border rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Comparison ({selected.length})
            </h2>
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-primary px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/5"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
          </div>

          <div className={`grid gap-2 ${selected.length === 2 ? "grid-cols-2" : selected.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
            {selected.map((rec) => (
              <div key={rec.id} className="bg-background border border-border rounded-lg p-2.5 relative">
                <button
                  onClick={() => toggleSelect(rec)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
                <p className="text-xs font-semibold truncate mb-1">{rec.name}</p>
                <div className="mb-1.5">
                  <SoundProfileBadge recording={rec} />
                </div>
                <div className="grid grid-cols-2 gap-1 text-center">
                  <div>
                    <p className="text-[8px] uppercase text-muted-foreground">Avg</p>
                    <p className="text-sm font-mono font-bold text-emerald-400">
                      {rec.avg_decibels?.toFixed(0) ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase text-muted-foreground">Peak</p>
                    <p className="text-sm font-mono font-bold text-amber-400">
                      {rec.peak_decibels?.toFixed(0) ?? "—"}
                    </p>
                  </div>
                </div>
                {rec.wpm > 0 && (
                  <p className="text-[9px] text-center text-primary font-mono mt-1">{rec.wpm} WPM</p>
                )}
                {rec.switch_type && (
                  <p className="text-[9px] text-muted-foreground text-center mt-0.5 truncate">{rec.switch_type}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Avg dB Comparison</p>
            <div className="space-y-1.5">
              {selected.map((rec) => {
                const maxDb = Math.max(...selected.map((r) => r.avg_decibels || 0), 1);
                const pct = ((rec.avg_decibels || 0) / maxDb) * 100;
                return (
                  <div key={rec.id} className="flex items-center gap-2">
                    <span className="text-[10px] w-16 truncate text-muted-foreground">{rec.name}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: pct > 70
                            ? "linear-gradient(to right, #f97316, #ef4444)"
                            : pct > 50
                            ? "linear-gradient(to right, #fbbf24, #f97316)"
                            : "linear-gradient(to right, #22c55e, #14b8a6)",
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold w-10 text-right">
                      {rec.avg_decibels?.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          {selected.length > 0 ? `Add More (${selected.length}/4)` : "Select Recordings to Compare"}
        </h2>
        {recordings.length === 0 ? (
          <div className="text-center py-8">
            <Plus className="w-6 h-6 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">No recordings yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recordings.map((rec) => {
              const isSelected = !!selected.find((r) => r.id === rec.id);
              return (
                <button
                  key={rec.id}
                  onClick={() => toggleSelect(rec)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-accent"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                  }`}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{rec.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {rec.avg_decibels?.toFixed(1)} dB
                      </span>
                      {rec.switch_type && (
                        <span className="text-[10px] text-muted-foreground">· {rec.switch_type}</span>
                      )}
                    </div>
                  </div>
                  {rec.audio_url && <RecordingAudioPlayer url={rec.audio_url} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <ComparisonShareModal
        targetRef={comparisonRef}
        recordings={selected}
        open={showShare}
        onClose={() => setShowShare(false)}
      />
    </div>
  );
}