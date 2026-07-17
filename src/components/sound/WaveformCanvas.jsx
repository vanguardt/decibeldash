import React, { useRef, useEffect } from "react";

// Renders decibel samples as an area waveform on a canvas.
export default function WaveformCanvas({ samples, peakDb = 95, minDb = 35, height = 64, className = "" }) {
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

    if (!samples || samples.length < 2) {
      ctx.fillStyle = "rgba(148,163,184,0.3)";
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillText("No waveform data", 8, ch / 2 + 3);
      return;
    }

    const range = peakDb - minDb || 60;
    const maxT = samples[samples.length - 1].t || 1;
    const pts = samples.map((s) => ({
      x: (s.t / maxT) * cw,
      y: ch - ((s.db - minDb) / range) * ch,
    }));

    // Fill area
    const grad = ctx.createLinearGradient(0, 0, 0, ch);
    grad.addColorStop(0, "rgba(16,185,129,0.45)");
    grad.addColorStop(1, "rgba(16,185,129,0.05)");
    ctx.beginPath();
    ctx.moveTo(0, ch);
    pts.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(cw, ch);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Stroke line
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [samples, peakDb, minDb, height]);

  return <canvas ref={canvasRef} style={{ width: "100%", height }} className={className} />;
}