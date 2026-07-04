import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Trophy, Crown, Medal, Volume2, ArrowUp, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import RecordingAudioPlayer from "@/components/RecordingAudioPlayer";

const medalColor = ["text-yellow-400", "text-zinc-300", "text-amber-600"];

const dbColor = (db) => {
  if (db < 30) return "text-green-400";
  if (db < 50) return "text-emerald-400";
  if (db < 70) return "text-yellow-400";
  if (db < 90) return "text-orange-400";
  return "text-red-400";
};

export default function Rankings() {
  const { toast } = useToast();
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.SoundRecording.list("-created_date", 200);
        setRecordings(
          data
            .filter((r) => r.avg_decibels != null)
            .sort((a, b) => a.avg_decibels - b.avg_decibels)
        );
      } catch {
        toast({ title: "Failed to load", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <Trophy className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No recordings to rank yet</p>
      </div>
    );
  }

  const winner = recordings[0];

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Rankings</h1>
      <p className="text-xs text-muted-foreground mb-6">
        Lowest average decibels wins — the quietest keyboard is #1
      </p>

      {/* Winner spotlight */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl p-5 mb-6 border border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 to-transparent overflow-hidden"
      >
        <div className="absolute top-3 right-3">
          <Crown className="w-7 h-7 text-yellow-400" />
        </div>
        <p className="text-[10px] uppercase tracking-widest text-yellow-400/80 font-semibold mb-1">
          🏆 Quietest keyboard
        </p>
        <h2 className="text-lg font-bold pr-10">{winner.name}</h2>
        <div className="flex items-center gap-4 mt-2 text-sm">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
            <span className={`font-mono font-bold text-lg ${dbColor(winner.avg_decibels)}`}>
              {winner.avg_decibels.toFixed(1)} dB
            </span>
            <span className="text-muted-foreground/60 text-xs">avg</span>
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowUp className="w-3 h-3" />
            <span className="font-mono">{winner.peak_decibels?.toFixed(1)}</span> peak
          </span>
          {winner.duration_seconds > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {winner.duration_seconds.toFixed(0)}s
            </span>
          )}
        </div>
        {winner.audio_url && (
          <div className="mt-3">
            <RecordingAudioPlayer url={winner.audio_url} />
          </div>
        )}
      </motion.div>

      {/* Full ranking */}
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
        Leaderboard
      </h3>
      <div className="space-y-2">
        {recordings.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.4) }}
            className={`flex items-center gap-3 rounded-xl border p-3 ${
              i === 0
                ? "border-yellow-500/40 bg-yellow-500/5"
                : "border-border bg-card"
            }`}
          >
            <div className="w-7 text-center">
              {i < 3 ? (
                <Medal className={`w-5 h-5 mx-auto ${medalColor[i]}`} />
              ) : (
                <span className="text-sm font-mono font-semibold text-muted-foreground">
                  {i + 1}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{r.name}</h4>
              {r.duration_seconds > 0 && (
                <p className="text-[10px] text-muted-foreground">{r.duration_seconds.toFixed(0)}s</p>
              )}
            </div>
            <div className="text-right">
              <p className={`font-mono font-bold text-sm ${dbColor(r.avg_decibels)}`}>
                {r.avg_decibels.toFixed(1)} dB
              </p>
              {r.wpm > 0 && (
                <p className="text-[10px] text-primary">{r.wpm} WPM</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}