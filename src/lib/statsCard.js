// Generates a shareable stats card image (PNG) for a recording.

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncate(s, n) {
  return s && s.length > n ? s.slice(0, n - 1) + "…" : s || "";
}

// Draws a mirrored frequency-bar "sound signature" from decibel samples.
function drawSoundSignature(ctx, samples, x, y, w, h) {
  if (!samples || !samples.length) return;
  const midY = y + h / 2;
  const numBars = 56;
  const barWidth = w / numBars;
  const gap = barWidth * 0.28;
  const drawW = barWidth - gap;

  // Resample decibel samples into bar buckets
  const bars = new Array(numBars).fill(0);
  const stride = samples.length / numBars;
  for (let i = 0; i < numBars; i++) {
    let sum = 0, count = 0;
    const start = Math.floor(i * stride);
    const end = Math.min(samples.length, Math.floor((i + 1) * stride));
    for (let j = start; j < end; j++) {
      sum += samples[j].db;
      count++;
    }
    bars[i] = count > 0 ? sum / count : 0;
  }

  for (let i = 0; i < numBars; i++) {
    const norm = Math.max(0, Math.min(1, (bars[i] - 20) / 80));
    const barH = Math.max(4, norm * h * 0.9);
    const px = x + i * barWidth + gap / 2;

    const grad = ctx.createLinearGradient(0, midY + barH / 2, 0, midY - barH / 2);
    grad.addColorStop(0, "#10b981");
    grad.addColorStop(0.6, "#34d399");
    grad.addColorStop(1, "#22d3ee");
    ctx.fillStyle = grad;

    const r = Math.min(drawW / 2, barH / 2, 4);
    roundRect(ctx, px, midY - barH / 2, drawW, barH, r);
    ctx.fill();
  }

  // Center line
  ctx.fillStyle = "rgba(52,211,153,0.2)";
  ctx.fillRect(x, midY - 0.5, w, 1);
}

export function drawStatsCard(ctx, rec, W, H) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#0b1f1a");
  g.addColorStop(1, "#04100c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  ctx.textAlign = "center";

  // brand
  ctx.fillStyle = "#34d399";
  ctx.font = "700 34px Inter, system-ui, sans-serif";
  ctx.fillText("DecibelDash", cx, 95);

  // keyboard name
  ctx.fillStyle = "#e6fff5";
  ctx.font = "700 46px Inter, system-ui, sans-serif";
  ctx.fillText(truncate(rec.name, 26), cx, 175);

  // waveform
  let samples = [];
  try { samples = JSON.parse(rec.decibel_samples || "[]"); } catch {}
  drawSoundSignature(ctx, samples, 80, 235, W - 160, 170);

  // big avg dB
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 150px Inter, system-ui, sans-serif";
  const avg = rec.avg_decibels != null ? rec.avg_decibels.toFixed(1) : "—";
  ctx.fillText(avg, cx, 600);
  ctx.fillStyle = "#9ca3af";
  ctx.font = "600 36px Inter, system-ui, sans-serif";
  ctx.fillText("dB AVG", cx, 660);

  // stats grid
  const stats = [
    { label: "PEAK", value: rec.peak_decibels != null ? rec.peak_decibels.toFixed(1) : "—" },
    { label: "MIN", value: rec.min_decibels != null && rec.min_decibels > 0 ? rec.min_decibels.toFixed(1) : "—" },
    { label: "WPM", value: rec.wpm > 0 ? String(rec.wpm) : "—" },
    { label: "ACC", value: rec.accuracy != null && rec.wpm > 0 ? rec.accuracy.toFixed(0) + "%" : "—" },
  ];
  const gap = 28;
  const boxW = (W - 120 - gap * 3) / 4;
  const boxH = 160;
  const y = 750;
  stats.forEach((s, i) => {
    const x = 60 + i * (boxW + gap);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    roundRect(ctx, x, y, boxW, boxH, 18);
    ctx.fill();
    ctx.fillStyle = "#34d399";
    ctx.font = "700 26px Inter, system-ui, sans-serif";
    ctx.fillText(s.label, x + boxW / 2, y + 50);
    ctx.fillStyle = "#e6fff5";
    ctx.font = "800 46px Inter, system-ui, sans-serif";
    ctx.fillText(s.value, x + boxW / 2, y + 118);
  });

  // footer: duration · category
  ctx.fillStyle = "#9ca3af";
  ctx.font = "500 32px Inter, system-ui, sans-serif";
  const dur = rec.duration_seconds > 0 ? `${rec.duration_seconds.toFixed(0)}s` : "";
  const cat = (rec.category || "").toUpperCase();
  ctx.fillText([dur, cat].filter(Boolean).join("   ·   "), cx, H - 80);
}

export function makeStatsImage(recording) {
  return new Promise((resolve, reject) => {
    try {
      const W = 1080, H = 1350;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      const finish = () => {
        try {
          drawStatsCard(ctx, recording, W, H);
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
            "image/png"
          );
        } catch (err) {
          reject(err);
        }
      };
      if (document.fonts && document.fonts.ready) {
        Promise.race([
          document.fonts.ready,
          new Promise((r) => setTimeout(r, 1500)),
        ]).then(finish).catch(finish);
      } else {
        finish();
      }
    } catch (err) {
      reject(err);
    }
  });
}