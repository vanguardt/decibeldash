import React from "react";
import { Link } from "react-router-dom";
import { Volume2 } from "lucide-react";

const BUILD_TYPE_STYLES = {
  Silent: "bg-blue-500/15 text-blue-400",
  Gaming: "bg-purple-500/15 text-purple-400",
  Thock: "bg-fuchsia-500/15 text-fuchsia-400",
  Clack: "bg-cyan-500/15 text-cyan-400",
  Custom: "bg-muted text-muted-foreground",
};

export default function BuildProfileCard({ profile }) {
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
    </Link>
  );
}