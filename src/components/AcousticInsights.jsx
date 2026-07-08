import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Activity } from "lucide-react";
import { profileStyles } from "@/lib/soundProfile";
import { useAcousticProfile } from "@/hooks/useAcousticProfile";

const PRIORITY_STYLES = {
  high: "bg-orange-500/10 text-orange-400",
  medium: "bg-blue-500/10 text-blue-400",
  low: "bg-emerald-500/10 text-emerald-400",
};

export default function AcousticInsights({ wpmHistory }) {
  const { profile, insights, loading } = useAcousticProfile(wpmHistory);

  if (loading || !profile || insights.length === 0) return null;

  const profileLabel = profile.dominantProfile
    ? profileStyles[profile.dominantProfile]?.label
    : null;
  const profileClass = profile.dominantProfile
    ? profileStyles[profile.dominantProfile]?.className
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mb-6"
    >
      {/* Profile summary */}
      <div className="flex items-center gap-3 mb-3 px-1">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
          <Activity className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">Your Acoustic Profile</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {profileLabel && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${profileClass}`}>
                {profileLabel}
              </span>
            )}
            {profile.dbRange && (
              <span className="text-[10px] text-muted-foreground font-mono">
                {profile.dbRange.min?.toFixed(0)}–{profile.dbRange.peak?.toFixed(0)} dB
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">
              · {profile.totalRecordings} recordings
            </span>
          </div>
        </div>
      </div>

      {/* Insight cards */}
      <div className="space-y-2">
        {insights.slice(0, 4).map((insight) => {
          const Icon = insight.icon;
          const inner = (
            <div className="flex items-start gap-3 p-3 rounded-xl border bg-card border-border hover:border-muted-foreground/30 transition-colors">
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${PRIORITY_STYLES[insight.priority] || PRIORITY_STYLES.medium}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{insight.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {insight.description}
                </p>
                {insight.action && (
                  <span className="inline-flex items-center gap-0.5 text-xs text-primary font-medium mt-1.5">
                    {insight.action.label}
                    <ChevronRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          );

          if (insight.action?.path) {
            return (
              <Link key={insight.id} to={insight.action.path} className="block">
                {inner}
              </Link>
            );
          }
          return <div key={insight.id}>{inner}</div>;
        })}
      </div>
    </motion.div>
  );
}