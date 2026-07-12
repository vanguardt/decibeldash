import React, { useState } from "react";
import { Trash2, Volume2, Clock, ArrowUp, ArrowDown, Minus, Grid3x3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import ShareButton from "@/components/ShareButton";
import RecordingAudioPlayer from "@/components/RecordingAudioPlayer";
import AudioDownloadButton from "@/components/AudioDownloadButton";
import DecibelScale from "@/components/DecibelScale";
import KeyboardHeatmap from "@/components/KeyboardHeatmap";
import SoundProfileBadge from "@/components/SoundProfileBadge";
import SaveAsBuildDialog from "@/components/SaveAsBuildDialog";

const categoryColors = {
  mechanical: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  membrane: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  scissor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  optical: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  other: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

export default function RecordingCard({ recording, onDelete, selected, onSelect }) {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const getColor = (db) => {
    if (db < 30) return "text-green-400";
    if (db < 50) return "text-emerald-400";
    if (db < 70) return "text-yellow-400";
    if (db < 90) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`group relative rounded-xl border p-4 transition-all cursor-pointer ${
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border bg-card hover:border-muted-foreground/30"
      }`}
      onClick={() => onSelect?.(recording.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate">{recording.name}</h3>
            <Badge variant="outline" className={`shrink-0 text-[10px] px-1.5 py-0 ${categoryColors[recording.category] || categoryColors.other}`}>
              {recording.category}
            </Badge>
            <SoundProfileBadge recording={recording} />
          </div>

          {recording.notes && (
            <p className="text-xs text-muted-foreground truncate mb-2">{recording.notes}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Volume2 className="w-3 h-3" />
              <span className={`font-mono font-semibold ${getColor(recording.avg_decibels)}`}>
                {recording.avg_decibels?.toFixed(1)} dB
              </span>
              <span className="text-muted-foreground/60">avg</span>
            </span>
            <span className="flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              <span className="font-mono">{recording.peak_decibels?.toFixed(1)}</span>
            </span>
            <span className="flex items-center gap-1">
              <ArrowDown className="w-3 h-3" />
              <span className="font-mono">{recording.min_decibels?.toFixed(1)}</span>
            </span>
            {recording.duration_seconds > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {recording.duration_seconds?.toFixed(0)}s
              </span>
            )}
            {recording.wpm > 0 && (
              <span className="flex items-center gap-1 text-primary">
                {recording.wpm} WPM
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {recording.key_heatmap && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowHeatmap(!showHeatmap);
              }}
              className={`flex items-center justify-center h-7 w-7 rounded-md transition-colors shrink-0 ${
                showHeatmap ? "text-primary bg-accent" : "text-muted-foreground hover:text-primary hover:bg-accent"
              }`}
              aria-label="Toggle heatmap"
            >
              <Grid3x3 className="w-3.5 h-3.5" />
            </button>
          )}
          <SaveAsBuildDialog recording={recording} />
          <ShareButton recording={recording} />
          {recording.audio_url && (
            <AudioDownloadButton url={recording.audio_url} name={recording.name} />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(recording.id);
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Audio playback */}
      {recording.audio_url && (
        <RecordingAudioPlayer url={recording.audio_url} onPlay={() => setShowHeatmap(true)} />
      )}

      {/* dB comparison scale */}
      {recording.avg_decibels != null && (
        <DecibelScale db={recording.avg_decibels} className="mt-3" />
      )}

      {/* Per-key heatmap */}
      {showHeatmap && recording.key_heatmap && (
        <div className="mt-3 pt-3 border-t border-border">
          <KeyboardHeatmap recording={recording} />
        </div>
      )}
    </motion.div>
  );
}