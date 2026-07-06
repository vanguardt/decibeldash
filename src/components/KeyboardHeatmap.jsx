import React, { useState } from "react";
import { Grid3x3, X } from "lucide-react";

const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m", ",", "."],
];

function getKeyColor(db) {
  if (db == null) return "bg-muted/40 text-muted-foreground/40 border-transparent";
  if (db < 52) return "bg-green-500/25 text-green-300 border-green-500/30";
  if (db < 62) return "bg-yellow-500/25 text-yellow-300 border-yellow-500/30";
  if (db < 73) return "bg-orange-500/25 text-orange-300 border-orange-500/30";
  return "bg-red-500/25 text-red-300 border-red-500/30";
}

export default function KeyboardHeatmap({ recording }) {
  const [selectedKey, setSelectedKey] = useState(null);

  let heatmap = {};
  try {
    heatmap = JSON.parse(recording.key_heatmap || "{}");
  } catch {}

  const keysWithData = Object.keys(heatmap).filter((k) => heatmap[k].hits > 0);
  const hasData = keysWithData.length > 0;

  if (!hasData) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
        <Grid3x3 className="w-3.5 h-3.5" />
        No per-key data for this recording
      </div>
    );
  }

  const hottestKey = keysWithData.reduce((a, b) =>
    heatmap[a].avg_db > heatmap[b].avg_db ? a : b
  );
  const quietestKey = keysWithData.reduce((a, b) =>
    heatmap[a].avg_db < heatmap[b].avg_db ? a : b
  );

  const renderKey = (key) => {
    const stats = heatmap[key];
    const hasHit = stats && stats.hits > 0;
    const db = hasHit ? stats.avg_db : null;
    const isSelected = selectedKey === key;

    return (
      <button
        key={key}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedKey(isSelected ? null : key);
        }}
        className={`relative flex flex-col items-center justify-center rounded-md border transition-all ${
          getKeyColor(db)
        } ${isSelected ? "ring-2 ring-primary scale-105 z-10" : ""} h-9`}
        style={{ minWidth: key === " " ? "60%" : "28px", flex: key === " " ? "1" : "0 0 auto" }}
      >
        <span className="text-[10px] font-bold uppercase leading-none">
          {key === " " ? "Space" : key}
        </span>
        {hasHit && (
          <span className="text-[7px] font-mono leading-none mt-0.5 opacity-80">
            {db.toFixed(0)}
          </span>
        )}
      </button>
    );
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {/* Keyboard layout */}
      <div className="flex flex-col items-center gap-1 mb-3">
        {KEYBOARD_ROWS.map((row, i) => (
          <div
            key={i}
            className="flex gap-1"
            style={{ marginLeft: `${i * 12}px` }}
          >
            {row.map(renderKey)}
          </div>
        ))}
        <div className="flex gap-1 mt-0.5 w-full justify-center">
          {renderKey(" ")}
        </div>
      </div>

      {/* Selected key detail */}
      {selectedKey && heatmap[selectedKey] && (
        <div className="bg-background border border-border rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase">
              Key: {selectedKey === " " ? "Space" : selectedKey}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedKey(null); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[9px] uppercase text-muted-foreground">Avg dB</p>
              <p className="text-sm font-mono font-bold">{heatmap[selectedKey].avg_db.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase text-muted-foreground">Peak dB</p>
              <p className="text-sm font-mono font-bold">{heatmap[selectedKey].peak_db.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase text-muted-foreground">Hits</p>
              <p className="text-sm font-mono font-bold">{heatmap[selectedKey].hits}</p>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {[
          { label: "Quiet", color: "bg-green-500/40", range: "<52" },
          { label: "Moderate", color: "bg-yellow-500/40", range: "52-62" },
          { label: "Loud", color: "bg-orange-500/40", range: "62-73" },
          { label: "Very Loud", color: "bg-red-500/40", range: "73+" },
        ].map((z) => (
          <div key={z.label} className="flex items-center gap-1">
            <div className={`w-2.5 h-2.5 rounded-sm ${z.color}`} />
            <span className="text-[9px] text-muted-foreground">{z.label}</span>
          </div>
        ))}
      </div>

      {/* Highlights */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          Loudest:{" "}
          <span className="font-bold text-orange-400 uppercase">
            {hottestKey === " " ? "Space" : hottestKey}
          </span>{" "}
          ({heatmap[hottestKey].avg_db.toFixed(1)} dB)
        </span>
        <span>
          Quietest:{" "}
          <span className="font-bold text-green-400 uppercase">
            {quietestKey === " " ? "Space" : quietestKey}
          </span>{" "}
          ({heatmap[quietestKey].avg_db.toFixed(1)} dB)
        </span>
      </div>
    </div>
  );
}