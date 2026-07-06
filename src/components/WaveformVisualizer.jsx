import React, { useRef, useEffect } from "react";

export default function WaveformVisualizer({ analyser, isRecording }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!analyser || !isRecording || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);

    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;

    // Use frequency data for bar graph
    const freqBins = analyser.frequencyBinCount;
    const freqData = new Uint8Array(freqBins);

    // Bar config — show ~48 bars, sample from the lower 3/4 of spectrum
    // where keyboard sounds live
    const numBars = 48;
    const barWidth = cw / numBars;
    const gap = barWidth * 0.25;
    const drawWidth = barWidth - gap;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(freqData);

      // Fade trail
      ctx.fillStyle = "rgba(10, 14, 20, 0.25)";
      ctx.fillRect(0, 0, cw, ch);

      const usableBins = Math.floor(freqBins * 0.75);
      const binsPerBar = Math.max(1, Math.floor(usableBins / numBars));
      const midY = ch / 2;

      for (let i = 0; i < numBars; i++) {
        // Average the bins for this bar
        let sum = 0;
        for (let j = 0; j < binsPerBar; j++) {
          sum += freqData[i * binsPerBar + j] || 0;
        }
        const avg = sum / binsPerBar / 255; // 0..1

        const barH = Math.max(2, avg * ch * 0.85);
        const x = i * barWidth + gap / 2;

        // Gradient: emerald at bottom → cyan at top
        const grad = ctx.createLinearGradient(0, midY + barH / 2, 0, midY - barH / 2);
        grad.addColorStop(0, "#10b981");
        grad.addColorStop(0.6, "#34d399");
        grad.addColorStop(1, "#22d3ee");
        ctx.fillStyle = grad;

        // Draw mirrored bars from center
        roundRectFill(ctx, x, midY - barH / 2, drawWidth, barH, drawWidth / 3);
      }

      // Center line glow
      ctx.fillStyle = "rgba(52,211,153,0.15)";
      ctx.fillRect(0, midY - 0.5, cw, 1);
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [analyser, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-24 rounded-lg bg-background/50 hidden"
      style={{ opacity: isRecording ? 1 : 0.3 }} />);


}

function roundRectFill(ctx, x, y, w, h, r) {
  if (h < 2 || w < 2) return;
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}