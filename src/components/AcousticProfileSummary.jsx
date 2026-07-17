import React from "react";
import { motion } from "framer-motion";
import { Activity, Volume2, VolumeX, Gauge, Wrench, Keyboard } from "lucide-react";
import { useAcousticProfile } from "@/hooks/useAcousticProfile";
import { signatureStyles } from "@/lib/acousticProfile";

function ScoreRing({ score, label, icon: Icon, sublabel }) {
  if (score == null) return null;
  const color = score >= 70 ? "text-emerald-400" : score >= 40 ? "text-yellow-400" : "text-orange-400";
  const ringColor = score >= 70 ? "#22c55e" : score >= 40 ? "#facc15" : "#f97316";
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" strokeWidth="5" className="stroke-muted" />
          <circle
            cx="32" cy="32" r="28" fill="none" strokeWidth="5"
            stroke={ringColor}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className={`w-4 h-4 ${color} mb-0.5`} />
          <span className={`text-sm font-bold font-mono ${color}`}>{score}</span>
        </div>
      </div>
      <p className="text-[10px] font-medium mt-1.5">{label}</p>
      {sublabel && <p className="text-[9px] text-muted-foreground">{sublabel}</p>}
    </div>
  );
}

export default function AcousticProfileSummary({ wpmHistory }) {
  const { profile, loading } = useAcousticProfile(wpmHistory);

  if (loading || !profile) return null;

  const { dbRange, loudKeys, quietKeys, soundSignature, consistencyScore, modEffectiveness, typingStability } = profile;
  const sigStyle = soundSignature ? signatureStyles[soundSignature] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mt-8 bg-card border border-border rounded-2xl p-4"
    >
      <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-border/60">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
          <Activity className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-sm font-bold">Your Acoustic Profile</h2>
      </div>

      {/* Top row: Avg dB + Sound Signature */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 bg-background border border-border rounded-xl p-3 text-center">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Avg dB</p>
          <p className="text-xl font-mono font-bold text-emerald-400 mt-0.5">
            {dbRange ? dbRange.avg.toFixed(1) : "—"}
          </p>
        </div>
        <div className="flex-1 bg-background border border-border rounded-xl p-3 text-center flex flex-col justify-center">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Signature</p>
          {sigStyle ? (
            <span className={`inline-block text-xs px-2.5 py-1 rounded-full border ${sigStyle.className}`}>
              {sigStyle.label}
            </span>
          ) : (
            <p className="text-xs text-muted-foreground">—</p>
          )}
        </div>
      </div>

      {/* Loudest / Quietest keys */}
      {(loudKeys.length > 0 || quietKeys.length > 0) && (
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="bg-background border border-border rounded-xl p-2.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Volume2 className="w-3 h-3 text-orange-400" />
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Loudest</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {loudKeys.slice(0, 3).map((k) => (
                <span key={k.key} className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-400">
                  {k.label} +{Math.round(k.delta)}
                </span>
              ))}
              {loudKeys.length === 0 && <span className="text-[10px] text-muted-foreground">—</span>}
            </div>
          </div>
          <div className="bg-background border border-border rounded-xl p-2.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <VolumeX className="w-3 h-3 text-blue-400" />
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Quietest</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {quietKeys.slice(0, 3).map((k) => (
                <span key={k.key} className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400">
                  {k.label} {Math.round(k.delta)}
                </span>
              ))}
              {quietKeys.length === 0 && <span className="text-[10px] text-muted-foreground">—</span>}
            </div>
          </div>
        </div>
      )}

      {/* Score rings */}
      <div className="flex items-start justify-around gap-2 pt-3.5 border-t border-border/60">
        <ScoreRing
          score={consistencyScore}
          label="Consistency"
          icon={Gauge}
        />
        <ScoreRing
          score={modEffectiveness?.score}
          label="Mod Effect"
          icon={Wrench}
          sublabel={modEffectiveness ? `−${modEffectiveness.reduction} dB` : null}
        />
        <ScoreRing
          score={typingStability}
          label="Typing Stability"
          icon={Keyboard}
        />
      </div>
    </motion.div>
  );
}