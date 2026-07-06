import React from "react";
import { useCommunityAvg } from "@/hooks/useCommunityAvg";
import { DB_ZONES, SCALE_MIN, SCALE_MAX, getDbCategory } from "@/lib/decibelScale";

const pct = (db) =>
  Math.max(0, Math.min(100, ((db - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100));

export default function DecibelScale({ db, showCommunity = true, className = "" }) {
  const communityAvg = useCommunityAvg();
  const category = getDbCategory(db);
  const active = db != null && db >= 40;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold font-mono">
          {active ? `${db.toFixed(1)} dB` : "—"}
        </span>
        {category && (
          <span className={`text-xs font-semibold ${category.text}`}>
            {category.label}
          </span>
        )}
      </div>

      {/* Scale bar */}
      <div className="relative">
        <div className="flex h-3 rounded-full overflow-hidden gap-px">
          {DB_ZONES.map((z) => (
            <div key={z.label} className={z.bar} style={{ flexGrow: z.range }} />
          ))}
        </div>

        {/* Your position marker */}
        {active && (
          <div
            className="absolute -top-1 -bottom-1 w-1 bg-white rounded-full shadow-md z-10"
            style={{ left: `${pct(db)}%`, transform: "translateX(-50%)" }}
          />
        )}

        {/* Community average marker */}
        {showCommunity && communityAvg != null && (
          <div
            className="absolute -top-2 -bottom-2 z-20 flex flex-col items-center"
            style={{ left: `${pct(communityAvg)}%`, transform: "translateX(-50%)" }}
          >
            <span className="text-[8px] text-primary font-bold mb-0.5 leading-none">
              AVG
            </span>
            <div className="w-0.5 flex-1 bg-primary" />
          </div>
        )}
      </div>

      {/* Zone labels */}
      <div className="flex mt-1.5 text-[9px] text-muted-foreground font-medium">
        {DB_ZONES.map((z) => (
          <div key={z.label} style={{ flexGrow: z.range }} className="text-center">
            {z.label}
          </div>
        ))}
      </div>
    </div>
  );
}