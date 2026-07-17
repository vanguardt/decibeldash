import React, { useRef, useEffect } from "react";

const BAND_ORDER = ["subBass", "bass", "lowMid", "mid", "highMid", "treble"];
const BAND_LABELS = ["Sub", "Bass", "Low-Mid", "Mid", "Hi-Mid", "Treble"];

// Renders a frequency timeline as a heatmap spectrogram.
// timeline: [{ t, bands: { subBass, bass, lowMid, mid, highMid, treble } }]
export default function SpectrogramCanvas({ timeline, height = 80, className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth;
    const ch = height;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cw, ch);

    if (!timeline || timeline.length < 2) {
      ctx.fillStyle = "rgba(148,163,184,0.3)";
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillText("No spectral data", 8, ch / 2 + 3);
      return;
    }

    const rowH = ch / BAND_ORDER.length;
    const maxT = timeline[timeline.length - 1].t || 1;
    const colW = cw / (timeline.length - 1 || 1);

    // Find max energy for normalization
    let maxEnergy = 0;
    for (const snap of timeline) {
      for (const k of BAND_ORDER) maxEnergy = Math.max(maxEnergy, (snap.bands?.[k] || 0));
    }
    maxEnergy = maxEnergy || 1;

    for (let row = 0; row < BAND_ORDER.length; row++) {
      const band = BAND_ORDER[row];
      const y = row * rowH;
      for (let i = 0; i < timeline.length - 1; i++) {
        const v0 = (timeline[i].bands?.[band] || 0) / maxEnergy;
        const v1 = (timeline[i + 1].bands?.[band] || 0) / maxEnergy;
        const x0 = (timeline[i].t / maxT) * cw;
        const x1 = (timeline[i + 1].t / maxT) * cw;
        const avgV = (v0 + v1) / 2;
        // Hue: low freq = purple/blue, high freq = orange/yellow
        const hue = 270 - (row / (BAND_ORDER.length - 1)) * 230;
        const light = 20 + avgV * 50;
        ctx.fillStyle = `hsla(${hue}, 75%, ${light}%, ${0.25 + avgV * 0.75})`;
        ctx.fillRect(x0, y, Math.max(1, x1 - x0), rowH);
      }
    }
  }, [timeline, height]);

  return (
    <div className={className}>
      <canvas ref={canvasRef} style={{ width: "100%", height }} />
      <div className="flex justify-between mt-0.5">
        {BAND_LABELS.map((l) => (
          <span key={l} className="text-[8px] text-muted-foreground">{l}</span>
        ))}
      </div>
    </div>
  );
}