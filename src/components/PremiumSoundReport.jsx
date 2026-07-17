import React, { useRef, useState, useCallback } from "react";
import { FileDown, Loader2, Activity, Layers, Gauge, Waves, ShieldCheck } from "lucide-react";
import WaveformCanvas from "@/components/sound/WaveformCanvas";
import SpectrogramCanvas from "@/components/sound/SpectrogramCanvas";
import MetricBar from "@/components/sound/MetricBar";
import { metricMeta, switchGuessStyles, signatureStyles } from "@/lib/soundProfileAnalysis";

// Premium Sound Report — full frequency analysis, resonance map,
// stabilizer effectiveness, case material profile, switch profile
// accuracy, noise floor breakdown, and PDF export.
// Bound to the DecibelDash Pro entitlement.
export default function PremiumSoundReport({ recording, analysis, freqTimeline }) {
  const reportRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  if (!analysis) return null;

  const samples = (() => {
    try { return JSON.parse(recording?.decibel_samples || "[]"); } catch { return []; }
  })();

  const m = analysis.metrics;
  const swStyle = switchGuessStyles[analysis.switchGuess] || switchGuessStyles.linear;
  const sigStyle = signatureStyles[analysis.soundSignature] || signatureStyles.Balanced;

  // Switch profile accuracy: compare guess to user-declared switch type
  const declaredSwitch = (recording?.switch_type || "").toLowerCase();
  const guess = analysis.switchGuess;
  let switchAccuracy = null;
  if (declaredSwitch) {
    if (declaredSwitch.includes(guess) || guess.includes(declaredSwitch.slice(0, 4))) {
      switchAccuracy = 100;
    } else {
      const related = { linear: ["linear"], tactile: ["tactile", "brown"], clicky: ["clicky", "blue", "white"], silent: ["silent", "pink", "red"] };
      const group = Object.values(related).find((g) => g.some((s) => declaredSwitch.includes(s)));
      switchAccuracy = group && group.includes(guess) ? 70 : 0;
    }
  }

  const caseProfile = inferCaseMaterial(m.caseResonance, m.hollowResonance, m.dampening);

  const handleExport = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(reportRef.current, { backgroundColor: "#0a0f1e", scale: 2, useCORS: true });
      const { jsPDF } = await import("jspdf");
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgW = 190;
      const imgH = (canvas.height / canvas.width) * imgW;
      pdf.addImage(imgData, "PNG", 10, 10, imgW, Math.min(imgH, 277));
      pdf.save(`${(recording?.name || "decibeldash").replace(/\s+/g, "_")}-sound-report.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div ref={reportRef} className="space-y-3.5 bg-card border border-border rounded-2xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary">Premium Report</span>
              <p className="text-sm font-semibold leading-tight">{recording?.name || "Untitled"}</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-background border border-border">
            <span className="text-xl font-mono font-bold text-primary leading-none">{analysis.qualityScore}</span>
            <span className="text-[8px] uppercase text-muted-foreground mt-0.5">/ 100</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${swStyle.className}`}>
            {swStyle.label} · {analysis.switchConfidence}% conf.
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sigStyle.className}`}>
            {sigStyle.label}
          </span>
          {switchAccuracy != null && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              Switch accuracy: {switchAccuracy}%
            </span>
          )}
        </div>

        {/* Frequency analysis */}
        <Section icon={Waves} title="Frequency Analysis">
          <SpectrogramCanvas timeline={freqTimeline} height={88} />
          <div className="grid grid-cols-3 gap-2 mt-2">
            <Stat label="Spectral Centroid" value={`${analysis.centroid} Hz`} />
            <Stat label="Dynamic Range" value={`${analysis.dynamicRange} dB`} />
            <Stat label="Consistency" value={`${analysis.consistencyScore}/100`} />
          </div>
        </Section>

        {/* Resonance map */}
        <Section icon={Layers} title="Resonance Map">
          <div className="space-y-2">
            <MetricBar label="Case Resonance" value={m.caseResonance} accent="amber" desc={caseProfile} />
            <MetricBar label="Plate Resonance" value={m.plateResonance} accent="orange" desc="High-mid ring from plate material" />
            <MetricBar label="Hollow Resonance" value={m.hollowResonance} accent="purple" desc="Echoey cavity emphasis" />
          </div>
        </Section>

        {/* Stabilizer effectiveness */}
        <Section icon={ShieldCheck} title="Stabilizer Effectiveness">
          {m.stabilizerEffect != null ? (
            <>
              <MetricBar label="Stabilizer Score" value={m.stabilizerEffect} accent="emerald" />
              <p className="text-[10px] text-muted-foreground mt-1">
                {m.spacebarDelta != null && `Spacebar is ${m.spacebarDelta > 0 ? "+" : ""}${m.spacebarDelta.toFixed(1)} dB vs board average. `}
                {m.stabilizerEffect >= 70 ? "Well-tuned stabilizers." : m.stabilizerEffect >= 45 ? "Moderate stab rattle — consider band-aid mod." : "Significant rattle — lubing stabs recommended."}
              </p>
            </>
          ) : (
            <p className="text-[10px] text-muted-foreground">No per-key heatmap data for this recording.</p>
          )}
        </Section>

        {/* Case material profile */}
        <Section icon={Layers} title="Case Material Profile">
          <p className="text-xs text-muted-foreground leading-relaxed">{caseProfile}</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Stat label="Case Resonance" value={`${m.caseResonance}/100`} />
            <Stat label="Dampening" value={`${m.dampening}/100`} />
          </div>
        </Section>

        {/* Noise floor breakdown */}
        <Section icon={Activity} title="Noise Floor Breakdown">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Noise Floor" value={`${m.noiseFloorDb != null ? m.noiseFloorDb.toFixed(1) : "—"} dB`} />
            <Stat label="Cleanliness" value={`${m.noiseFloor}/100`} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {m.noiseFloor >= 70 ? "Clean background — minimal ambient bleed." : m.noiseFloor >= 45 ? "Moderate ambient noise present." : "High noise floor — record in a quieter environment for best results."}
          </p>
        </Section>

        {/* Full metric breakdown */}
        <Section icon={Gauge} title="Acoustic Profile">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {metricMeta.map((meta) => (
              <MetricBar
                key={meta.key}
                label={meta.label}
                value={m[meta.key]}
                accent={metricAccent(meta.key)}
                desc={meta.desc}
              />
            ))}
          </div>
        </Section>
      </div>

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={exporting}
        className="w-full flex items-center justify-center gap-2 text-xs font-medium text-primary px-3 py-2.5 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors disabled:opacity-50"
      >
        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
        {exporting ? "Exporting…" : "Export Full Report (PDF)"}
      </button>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-background/50 rounded-xl p-3.5 space-y-2.5">
      <div className="flex items-center gap-2 pb-1 border-b border-border/60">
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-background border border-border rounded-lg p-2 text-center">
      <p className="text-[9px] uppercase text-muted-foreground">{label}</p>
      <p className="text-xs font-mono font-bold mt-0.5">{value}</p>
    </div>
  );
}

function metricAccent(key) {
  const map = {
    clackiness: "orange",
    thockiness: "purple",
    hollowResonance: "amber",
    deepness: "violet",
    brightness: "sky",
    dampening: "emerald",
    noiseFloor: "emerald",
    stabilizerEffect: "emerald",
    caseResonance: "amber",
    plateResonance: "orange",
  };
  return map[key] || "emerald";
}

function inferCaseMaterial(caseRes, hollow, dampening) {
  if (dampening > 65 && caseRes < 40) return "Heavily dampened build — case foam + plate foam suppress resonance. Likely a polymer or foamed plastic case, or a modded metal case.";
  if (hollow > 60 && caseRes > 55) return "Resonant hollow profile suggests an aluminum or brass case with minimal internal dampening. Adding case foam will tighten the sound.";
  if (caseRes > 50 && hollow < 50) return "Balanced mid-range resonance — consistent with a polycarbonate or PP (polypropylene) case, or an FR4 plate. Generally a desirable, muted resonance.";
  return "Neutral case resonance — typical of a gasket-mounted or well-isolated board. Sound is well-controlled without dominant cavity emphasis.";
}