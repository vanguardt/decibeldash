import React from "react";
import { motion } from "framer-motion";

export default function DecibelGauge({ value, peak, isRecording }) {
  const clampedValue = Math.min(Math.max(value, 0), 120);
  const percentage = (clampedValue / 120) * 100;

  const getColor = (db) => {
    if (db < 30) return "#22c55e";
    if (db < 50) return "#10b981";
    if (db < 70) return "#eab308";
    if (db < 90) return "#f97316";
    return "#ef4444";
  };

  const getLabel = (db) => {
    if (db < 20) return "Silent";
    if (db < 30) return "Whisper";
    if (db < 40) return "Very Quiet";
    if (db < 50) return "Quiet";
    if (db < 60) return "Moderate";
    if (db < 70) return "Noticeable";
    if (db < 80) return "Loud";
    if (db < 90) return "Very Loud";
    return "Extremely Loud";
  };

  const segments = 40;
  const activeSegments = Math.round((percentage / 100) * segments);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Outer ring glow */}
        {isRecording && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${getColor(clampedValue)}15 0%, transparent 70%)`,
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}

        {/* Circular segments */}
        <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full -rotate-90">
          {Array.from({ length: segments }).map((_, i) => {
            const angle = (i / segments) * 270 - 135;
            const rad = (angle * Math.PI) / 180;
            const innerR = 82;
            const outerR = 92;
            const cx = 100;
            const cy = 100;
            const isActive = i < activeSegments;

            return (
              <line
                key={i}
                x1={cx + innerR * Math.cos(rad)}
                y1={cy + innerR * Math.sin(rad)}
                x2={cx + outerR * Math.cos(rad)}
                y2={cy + outerR * Math.sin(rad)}
                stroke={isActive ? getColor((i / segments) * 120) : "hsl(220, 14%, 16%)"}
                strokeWidth="3"
                strokeLinecap="round"
                opacity={isActive ? 1 : 0.4}
              />
            );
          })}
        </svg>

        {/* Center content */}
        <div className="flex flex-col items-center z-10">
          <motion.span
            className="text-6xl font-mono font-bold tracking-tight"
            style={{ color: isRecording ? getColor(clampedValue) : "hsl(210, 20%, 60%)" }}
            key={Math.round(clampedValue)}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.1 }}
          >
            {clampedValue.toFixed(1)}
          </motion.span>
          <span className="text-sm font-mono text-muted-foreground mt-1">dB</span>
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <span
          className="text-lg font-semibold tracking-wide"
          style={{ color: isRecording ? getColor(clampedValue) : "hsl(210, 20%, 50%)" }}
        >
          {isRecording ? getLabel(clampedValue) : "Ready"}
        </span>
        {peak > 0 && (
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Peak: {peak.toFixed(1)} dB
          </p>
        )}
      </div>
    </div>
  );
}