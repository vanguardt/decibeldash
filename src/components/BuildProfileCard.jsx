import React from "react";
import { Link } from "react-router-dom";
import { Volume2 } from "lucide-react";
import SoundProfileBadge from "@/components/SoundProfileBadge";

const BUILD_TYPE_STYLES = {
  Silent: "bg-blue-500/15 text-blue-400",
  Gaming: "bg-purple-500/15 text-purple-400",
  Thock: "bg-fuchsia-500/15 text-fuchsia-400",
  Clack: "bg-cyan-500/15 text-cyan-400",
  Custom: "bg-muted text-muted-foreground",
};

function getLoudnessBadge(db) {
  if (db == null) return null;
  if (db < 45) return { label: "Quiet", cls: "bg-emerald-500/15 text-emerald-400" };
  if (db < 55) return { label: "Moderate", cls: "bg-amber-500/15 text-amber-400" };
  if (db < 65) return { label: "Loud", cls: "bg-orange-500/15 text-orange-400" };
  return { label: "Very Loud", cls: "bg-red-500/15 text-red-400" };
}

export default function BuildProfileCard({ profile }) {
  const loudness = getLoudnessBadge(profile.avg_decibels);

  return (
    <Link
      to={`/builds/${profile.id}`}
      className="block bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm truncate">{profile.name}</h3>
        <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${BUILD_TYPE_STYLES[profile.build_type] || BUILD_TYPE_STYLES.Custom}`}>
          {profile.build_type}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        {profile.switch_type && <span>{profile.switch_type}</span>}
        {profile.keycap_profile && <span>· {profile.keycap_profile}</span>}
        {profile.avg_decibels != null && (
          <span className="flex items-center gap-1 ml-auto">
            <Volume2 className="w-3 h-3" />
            {profile.avg_decibels.toFixed(1)} dB
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        <SoundProfileBadge recording={profile} />
        {loudness && (
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${loudness.cls}`}>
            {loudness.label}
          </span>
        )}
        {profile.wpm > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {profile.wpm} WPM
          </span>
        )}
      </div>
    </Link>
  );
}