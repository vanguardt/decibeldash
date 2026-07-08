import React, { useState, useRef } from "react";
import { Download, Share2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { computeCreatorStats, getCreatorTier } from "@/lib/creatorStats";
import { computeBadges, BADGE_COLORS } from "@/lib/creatorBadges";
import { signatureStyles, computeSoundSignature } from "@/lib/acousticProfile";
import { profileStyles } from "@/lib/soundProfile";

export default function CreatorIdentityCard({ recordings, builds, collections }) {
  const { toast } = useToast();
  const [creatorName, setCreatorName] = useState("");
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

  const stats = computeCreatorStats(recordings, builds, collections);
  const badges = computeBadges(stats);
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const tier = getCreatorTier(stats);
  const signature = computeSoundSignature(recordings);
  const sigStyle = signature ? signatureStyles[signature] : null;
  const profileLabel = stats.dominantProfile ? profileStyles[stats.dominantProfile]?.label : null;
  const profileClass = stats.dominantProfile ? profileStyles[stats.dominantProfile]?.className : null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0a0a0a",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Failed to generate image");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `creator-card-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast({ title: "Creator card downloaded!" });
    } catch {
      toast({ title: "Failed to generate card", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0a0a0a",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;
      const file = new File([blob], `creator-card-${Date.now()}.png`, { type: "image/png" });
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${creatorName || "My"} Creator Card`,
          text: `Check out my DecibelDash acoustic profile!`,
          files: [file],
        });
        return;
      }
      handleDownload();
    } catch {
      // user cancelled or unsupported
    }
  };

  return (
    <div className="w-full">
      {/* The card */}
      <div
        ref={cardRef}
        className="w-full rounded-2xl p-5 text-white"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-white/40">DecibelDash</p>
            <p className="text-[9px] uppercase tracking-widest text-white/40">Creator Card</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tier.bg} ${tier.color}`}>
            {tier.name}
          </span>
        </div>

        {/* Name + signature */}
        <div className="mb-4">
          <input
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            placeholder="Your creator name"
            className="bg-transparent text-xl font-bold text-white outline-none border-b border-white/10 focus:border-white/30 transition-colors w-full pb-1"
          />
          <div className="flex items-center gap-2 mt-2">
            {sigStyle && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sigStyle.className}`}>
                {sigStyle.label}
              </span>
            )}
            {profileLabel && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${profileClass}`}>
                {profileLabel}
              </span>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-[8px] uppercase text-white/40">Avg dB</p>
            <p className="text-lg font-mono font-bold text-emerald-400">
              {stats.avgDb != null ? stats.avgDb.toFixed(0) : "—"}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-[8px] uppercase text-white/40">Best WPM</p>
            <p className="text-lg font-mono font-bold text-yellow-400">{stats.bestWpm || "—"}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-[8px] uppercase text-white/40">Builds</p>
            <p className="text-lg font-mono font-bold text-blue-400">{stats.buildCount}</p>
          </div>
        </div>

        {/* Top build */}
        {stats.topBuild && (
          <div className="bg-white/5 rounded-lg p-2.5 mb-3">
            <p className="text-[8px] uppercase text-white/40 mb-0.5">Top Build</p>
            <p className="text-sm font-semibold truncate">{stats.topBuild.name}</p>
            <div className="flex items-center gap-2 text-[10px] text-white/60">
              <span>{stats.topBuild.avg_decibels?.toFixed(0)} dB</span>
              {stats.topBuild.wpm > 0 && <span>· {stats.topBuild.wpm} WPM</span>}
              {stats.topBuild.switch_type && <span>· {stats.topBuild.switch_type}</span>}
            </div>
          </div>
        )}

        {/* Badges */}
        <div>
          <p className="text-[8px] uppercase text-white/40 mb-1.5">
            Badges ({unlockedBadges.length}/{badges.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <span
                key={badge.id}
                className={`text-[9px] px-1.5 py-0.5 rounded-md border ${
                  badge.unlocked
                    ? BADGE_COLORS[badge.color]
                    : "bg-white/5 text-white/20 border-white/5"
                }`}
              >
                {badge.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download Card
        </button>
        {typeof navigator.share === "function" && (
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md border border-input text-sm font-medium hover:bg-accent"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        )}
      </div>
    </div>
  );
}