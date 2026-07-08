import React from "react";
import { Eye, Share2, Download, TrendingUp, BarChart3, Award } from "lucide-react";
import { computeCreatorStats } from "@/lib/creatorStats";
import { soundProfile, profileStyles } from "@/lib/soundProfile";
import { Link } from "react-router-dom";

const PROFILE_COLORS = {
  thocky: "bg-fuchsia-500",
  clacky: "bg-cyan-500",
  clicky: "bg-sky-500",
  marbly: "bg-purple-500",
  creamy: "bg-amber-500",
};

export default function CreatorStatsDashboard({ recordings, builds, collections }) {
  const stats = computeCreatorStats(recordings, builds, collections);

  const totalViews = builds.reduce((s, b) => s + (b.view_count || 0), 0);
  const totalShares = builds.reduce((s, b) => s + (b.share_count || 0), 0);
  const totalDownloads = builds.reduce((s, b) => s + (b.download_count || 0), 0);

  const popularBuild = builds.length > 0
    ? builds.reduce((best, b) => ((b.view_count || 0) > (best.view_count || 0) ? b : best))
    : null;

  const downloadedBuild = builds.length > 0
    ? builds.reduce((best, b) => ((b.download_count || 0) > (best.download_count || 0) ? b : best))
    : null;

  const profileEntries = Object.entries(stats.profileCounts || {}).sort((a, b) => b[1] - a[1]);
  const totalProfiles = profileEntries.reduce((s, [, n]) => s + n, 0) || 1;

  return (
    <div className="w-full">
      <h2 className="text-sm font-bold mb-3">Stats Dashboard</h2>

      {/* Engagement metrics */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <Eye className="w-4 h-4 mx-auto text-blue-400 mb-1" />
          <p className="text-lg font-mono font-bold">{totalViews}</p>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Views</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <Share2 className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
          <p className="text-lg font-mono font-bold">{totalShares}</p>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Shares</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <Download className="w-4 h-4 mx-auto text-amber-400 mb-1" />
          <p className="text-lg font-mono font-bold">{totalDownloads}</p>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Downloads</p>
        </div>
      </div>

      {/* Most popular build */}
      {popularBuild && (popularBuild.view_count || 0) > 0 && (
        <Link to={`/builds/${popularBuild.id}`} className="block mb-2">
          <div className="flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-r from-blue-500/5 to-transparent border-blue-500/20 hover:bg-blue-500/5 transition-colors">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500/10">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Most Popular</p>
              <p className="text-sm font-semibold truncate">{popularBuild.name}</p>
              <p className="text-[10px] text-muted-foreground">{popularBuild.view_count} views</p>
            </div>
          </div>
        </Link>
      )}

      {/* Most downloaded build */}
      {downloadedBuild && (downloadedBuild.download_count || 0) > 0 && (
        <Link to={`/builds/${downloadedBuild.id}`} className="block mb-4">
          <div className="flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-r from-amber-500/5 to-transparent border-amber-500/20 hover:bg-amber-500/5 transition-colors">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/10">
              <Download className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Most Downloaded</p>
              <p className="text-sm font-semibold truncate">{downloadedBuild.name}</p>
              <p className="text-[10px] text-muted-foreground">{downloadedBuild.download_count} downloads</p>
            </div>
          </div>
        </Link>
      )}

      {/* Sound signature breakdown */}
      {profileEntries.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold">Sound Signature Breakdown</h3>
          </div>
          <div className="space-y-2">
            {profileEntries.map(([profile, count]) => {
              const style = profileStyles[profile] || { label: profile };
              const pct = Math.round((count / totalProfiles) * 100);
              const color = PROFILE_COLORS[profile] || "bg-muted";
              return (
                <div key={profile} className="flex items-center gap-2">
                  <span className="text-[10px] w-16 text-muted-foreground capitalize">{style.label}</span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold">Overview</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Avg dB</p>
            <p className="text-lg font-mono font-bold text-emerald-400">
              {stats.avgDb != null ? stats.avgDb.toFixed(1) : "—"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Peak dB</p>
            <p className="text-lg font-mono font-bold text-amber-400">
              {stats.peakDb != null ? stats.peakDb.toFixed(0) : "—"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Builds</p>
            <p className="text-lg font-mono font-bold">{stats.buildCount}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Recordings</p>
            <p className="text-lg font-mono font-bold">{stats.recordingCount}</p>
          </div>
        </div>
      </div>

      {builds.length === 0 && recordings.length === 0 && (
        <div className="text-center py-8">
          <BarChart3 className="w-6 h-6 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground">No data yet — start recording!</p>
        </div>
      )}
    </div>
  );
}