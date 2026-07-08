import React from "react";
import { motion } from "framer-motion";
import { evaluateChallenges, getWeekKey } from "@/lib/creatorChallenges";

const ICON_MAP = {
  Volume2: "🔊",
  Grid3x3: "⬛",
  Sparkles: "✨",
  Wrench: "🔧",
  Zap: "⚡",
};

export default function ChallengeList({ recordings, builds }) {
  const challenges = evaluateChallenges(recordings, builds);
  const weekKey = getWeekKey();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold">Weekly Challenges</h2>
        <span className="text-[10px] text-muted-foreground font-mono">{weekKey}</span>
      </div>
      <div className="space-y-2">
        {challenges.map((ch, i) => {
          const hasResult = ch.result.score != null && ch.result.score !== 0;
          return (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl border bg-card border-border"
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${hasResult ? "bg-primary/10" : "bg-muted"}`}>
                <span className="text-xl">{ICON_MAP[ch.icon] || "🏆"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{ch.name}</p>
                <p className="text-xs text-muted-foreground truncate">{ch.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-mono font-bold ${hasResult ? "text-primary" : "text-muted-foreground"}`}>
                  {ch.result.label}
                </p>
                {hasResult && ch.result.recording && (
                  <p className="text-[9px] text-muted-foreground truncate max-w-[80px]">
                    {ch.result.recording.name}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}