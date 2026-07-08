import React from "react";
import { Lock } from "lucide-react";
import { computeCreatorStats } from "@/lib/creatorStats";
import { computeBadges, BADGE_COLORS } from "@/lib/creatorBadges";

const ICON_MAP = {
  Wrench: "🔧",
  Sparkles: "✨",
  Volume2: "🔊",
  Scissors: "✂️",
  Grid3x3: "⬛",
  Zap: "⚡",
  Flame: "🔥",
  Boxes: "📦",
  Layers: "📚",
};

export default function CreatorBadgeGrid({ recordings, builds, collections }) {
  const stats = computeCreatorStats(recordings, builds, collections);
  const badges = computeBadges(stats);
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="w-full mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold">Creator Badges</h2>
        <span className="text-xs text-muted-foreground font-mono">
          {unlockedCount}/{badges.length}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
              badge.unlocked
                ? `${BADGE_COLORS[badge.color]} border`
                : "bg-muted/50 border-border opacity-50"
            }`}
          >
            <div className="text-2xl mb-1.5">
              {badge.unlocked ? ICON_MAP[badge.icon] : <Lock className="w-5 h-5 text-muted-foreground" />}
            </div>
            <p className="text-[10px] font-bold leading-tight">{badge.name}</p>
            <p className="text-[8px] text-muted-foreground mt-0.5 leading-tight">{badge.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}