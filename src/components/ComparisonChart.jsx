import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-mono font-semibold" style={{ color: entry.color }}>
          {entry.value?.toFixed(1)} dB
        </p>
      ))}
    </div>
  );
};

export default function ComparisonChart({ recordings }) {
  if (!recordings || recordings.length === 0) return null;

  const barData = recordings.map((r, i) => ({
    name: r.name.length > 12 ? r.name.slice(0, 12) + "…" : r.name,
    avg: r.avg_decibels,
    peak: r.peak_decibels,
    min: r.min_decibels,
    color: COLORS[i % COLORS.length],
  }));

  const radarData = [
    { metric: "Average", ...Object.fromEntries(recordings.map((r, i) => [`kb${i}`, r.avg_decibels])) },
    { metric: "Peak", ...Object.fromEntries(recordings.map((r, i) => [`kb${i}`, r.peak_decibels])) },
    { metric: "Min", ...Object.fromEntries(recordings.map((r, i) => [`kb${i}`, r.min_decibels || 0])) },
    { metric: "Range", ...Object.fromEntries(recordings.map((r, i) => [`kb${i}`, (r.peak_decibels || 0) - (r.min_decibels || 0)])) },
  ];

  // Find the quietest
  const sorted = [...recordings].sort((a, b) => a.avg_decibels - b.avg_decibels);
  const quietest = sorted[0];
  const loudest = sorted[sorted.length - 1];
  const diff = loudest.avg_decibels - quietest.avg_decibels;

  return (
    <div className="space-y-6">
      {/* Summary */}
      {recordings.length >= 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
            <p className="text-[10px] uppercase tracking-widest text-green-400/70 mb-1">Quietest</p>
            <p className="text-sm font-semibold text-green-400 truncate">{quietest.name}</p>
            <p className="text-2xl font-mono font-bold text-green-400">{quietest.avg_decibels?.toFixed(1)}</p>
            <p className="text-[10px] text-green-400/50">dB average</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <p className="text-[10px] uppercase tracking-widest text-red-400/70 mb-1">Loudest</p>
            <p className="text-sm font-semibold text-red-400 truncate">{loudest.name}</p>
            <p className="text-2xl font-mono font-bold text-red-400">{loudest.avg_decibels?.toFixed(1)}</p>
            <p className="text-[10px] text-red-400/50">dB average</p>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
            <p className="text-[10px] uppercase tracking-widest text-primary/70 mb-1">Difference</p>
            <p className="text-2xl font-mono font-bold text-primary mt-2">{diff.toFixed(1)}</p>
            <p className="text-[10px] text-primary/50">dB gap</p>
          </div>
        </div>
      )}

      {/* Bar Chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Decibel Comparison</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={barData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 12%)" />
            <XAxis dataKey="name" tick={{ fill: "hsl(215, 14%, 50%)", fontSize: 11 }} />
            <YAxis tick={{ fill: "hsl(215, 14%, 50%)", fontSize: 11 }} domain={[0, "auto"]} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avg" name="Average dB" radius={[6, 6, 0, 0]}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
            <Bar dataKey="peak" name="Peak dB" radius={[6, 6, 0, 0]} opacity={0.4}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Radar Chart for multi-dimension comparison */}
      {recordings.length >= 2 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Multi-Dimension Profile</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(220, 14%, 16%)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(215, 14%, 50%)", fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: "hsl(215, 14%, 40%)", fontSize: 9 }} />
              {recordings.map((r, i) => (
                <Radar
                  key={r.id}
                  name={r.name}
                  dataKey={`kb${i}`}
                  stroke={COLORS[i % COLORS.length]}
                  fill={COLORS[i % COLORS.length]}
                  fillOpacity={0.15}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 11, color: "hsl(215, 14%, 50%)" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}