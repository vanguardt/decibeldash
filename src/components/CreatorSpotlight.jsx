import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Flame, Sparkles, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { computeCreatorStats, getCreatorTier } from "@/lib/creatorStats";
import { computeBadges } from "@/lib/creatorBadges";

export default function CreatorSpotlight() {
  const [stats, setStats] = useState(null);
  const [topBuild, setTopBuild] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [recs, blds] = await Promise.all([
          base44.entities.SoundRecording.list("-created_date", 100),
          base44.entities.BuildProfile.list("-created_date", 50),
        ]);
        const s = computeCreatorStats(recs || [], blds || [], []);
        setStats(s);
        setTopBuild(s.topBuild);
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  if (!stats || stats.recordingCount === 0) return null;

  const tier = getCreatorTier(stats);
  const badges = computeBadges(stats);
  const unlockedBadges = badges.filter((b) => b.unlocked).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mt-6"
    >
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">
        Creator Spotlight
      </h2>

      <div className="space-y-2">
        {/* Creator tier card */}
        <Link to="/creator" className="block">
          <div className="flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-r from-primary/5 to-transparent border-primary/20 hover:bg-primary/5 transition-colors">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${tier.bg}`}>
              <Trophy className={`w-5 h-5 ${tier.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">
                Creator Tier: <span className={tier.color}>{tier.name}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.recordingCount} recordings · {unlockedBadges} badges · {stats.bestWpm} WPM best
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </Link>

        {/* Build of the week */}
        {topBuild && (
          <Link to="/builds" className="block">
            <div className="flex items-center gap-3 p-3 rounded-xl border bg-card border-border hover:border-muted-foreground/30 transition-colors">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Build of the Week</p>
                <p className="text-sm font-semibold truncate">{topBuild.name}</p>
                <p className="text-xs text-muted-foreground">
                  {topBuild.avg_decibels?.toFixed(0)} dB
                  {topBuild.wpm > 0 && ` · ${topBuild.wpm} WPM`}
                  {topBuild.switch_type && ` · ${topBuild.switch_type}`}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>
        )}

        {/* Rising creator progress */}
        {stats.recentRecordings > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-xl border bg-card border-border">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500/10">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Rising Creator</p>
              <p className="text-sm font-semibold">
                {stats.recentRecordings} recording{stats.recentRecordings !== 1 ? "s" : ""} this week
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.recentRecordings >= 3 ? "On fire — keep it up!" : "Build momentum with more recordings"}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}