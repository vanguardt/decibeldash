import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Share2, X, Download, Clipboard, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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

function drawSwitchCard(ctx, sw, W, H) {
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

  // switch name
  ctx.fillStyle = "#e6fff5";
  ctx.font = "700 44px Inter, system-ui, sans-serif";
  ctx.fillText(truncate(sw.name, 28), cx, 175);

  // manufacturer
  if (sw.manufacturer) {
    ctx.fillStyle = "#9ca3af";
    ctx.font = "500 32px Inter, system-ui, sans-serif";
    ctx.fillText(truncate(sw.manufacturer, 32), cx, 230);
  }

  // type + pitch badges
  let badgeY = 290;
  const badges = [sw.switch_type, sw.pitch_profile].filter((b) => b && b !== "Neutral");
  if (badges.length) {
    ctx.font = "700 28px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#34d399";
    ctx.fillText(badges.join("  ·  "), cx, badgeY);
  }

  // big avg dB
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 150px Inter, system-ui, sans-serif";
  const avg = sw.avg_decibels != null ? sw.avg_decibels.toFixed(1) : "—";
  ctx.fillText(avg, cx, 550);
  ctx.fillStyle = "#9ca3af";
  ctx.font = "600 36px Inter, system-ui, sans-serif";
  ctx.fillText("dB AVG", cx, 610);

  // stats grid
  const rating = sw.responsiveness_rating || 0;
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
  const stats = [
    { label: "PEAK", value: sw.peak_decibels != null ? sw.peak_decibels.toFixed(1) : "—" },
    { label: "FORCE", value: sw.actuation_force ? `${sw.actuation_force}g` : "—" },
    { label: "SNAPPY", value: stars },
    { label: "TESTS", value: sw.sound_test_count != null ? String(sw.sound_test_count) : "0" },
  ];
  const gap = 28;
  const boxW = (W - 120 - gap * 3) / 4;
  const boxH = 160;
  const y = 690;
  stats.forEach((s, i) => {
    const x = 60 + i * (boxW + gap);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    roundRect(ctx, x, y, boxW, boxH, 18);
    ctx.fill();
    ctx.fillStyle = "#34d399";
    ctx.font = "700 24px Inter, system-ui, sans-serif";
    ctx.fillText(s.label, x + boxW / 2, y + 48);
    ctx.fillStyle = "#e6fff5";
    ctx.font = "800 38px Inter, system-ui, sans-serif";
    ctx.fillText(s.value, x + boxW / 2, y + 110);
  });

  // footer
  ctx.fillStyle = "#9ca3af";
  ctx.font = "500 32px Inter, system-ui, sans-serif";
  ctx.fillText("Switch Sound Profile", cx, H - 80);
}

function makeSwitchImage(sw) {
  return new Promise((resolve, reject) => {
    try {
      const W = 1080, H = 1350;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      const finish = () => {
        try {
          drawSwitchCard(ctx, sw, W, H);
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

export default function SwitchShareButton({ switchEntry }) {
  const { toast } = useToast();
  const [imgBlob, setImgBlob] = useState(null);
  const [open, setOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setImgError(false);
    makeSwitchImage(switchEntry)
      .then((b) => { if (!cancelled) setImgBlob(b); })
      .catch(() => { if (!cancelled) setImgError(true); });
    return () => { cancelled = true; };
  }, [switchEntry]);

  useEffect(() => {
    if (open && imgBlob) {
      const url = URL.createObjectURL(imgBlob);
      setImgUrl(url);
      return () => { URL.revokeObjectURL(url); setImgUrl(null); };
    }
  }, [open, imgBlob]);

  const buildText = () => {
    const lines = [`⌨️ ${switchEntry.name}`];
    if (switchEntry.manufacturer) lines.push(switchEntry.manufacturer);
    if (switchEntry.switch_type) lines.push(`Type: ${switchEntry.switch_type}`);
    if (switchEntry.pitch_profile && switchEntry.pitch_profile !== "Neutral")
      lines.push(`Sound: ${switchEntry.pitch_profile}`);
    if (switchEntry.avg_decibels != null)
      lines.push(`🔊 Avg: ${switchEntry.avg_decibels.toFixed(1)} dB`);
    if (switchEntry.peak_decibels != null)
      lines.push(`Peak: ${switchEntry.peak_decibels.toFixed(1)} dB`);
    if (switchEntry.actuation_force)
      lines.push(`Force: ${switchEntry.actuation_force}g`);
    lines.push("— via DecibelDash");
    return lines.join("\n");
  };

  const safeName = () =>
    (switchEntry.name || "switch").replace(/[^a-z0-9-_ ]/gi, "").trim() || "switch";

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handleCopy = async () => {
    const text = buildText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "Stats copied — paste anywhere" });
        return;
      } catch {}
    }
    toast({ title: "Couldn't copy text in this browser" });
  };

  const handleCopyImage = async () => {
    if (!imgBlob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": imgBlob }),
      ]);
      toast({ title: "Image copied — paste anywhere!" });
    } catch {
      toast({ title: "Can't copy image in this browser", description: "Use Save to download instead", variant: "destructive" });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 flex items-center gap-1 text-xs text-primary font-medium px-2.5 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/5"
      >
        <Share2 className="w-3.5 h-3.5" /> Share
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-card border border-border rounded-2xl p-4 max-w-[340px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-accent text-muted-foreground"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {imgUrl ? (
              <img src={imgUrl} alt="Switch stats" className="w-full rounded-lg" />
            ) : imgError ? (
              <div className="w-full aspect-[4/5] rounded-lg bg-muted flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Image unavailable</p>
              </div>
            ) : (
              <div className="w-full aspect-[4/5] rounded-lg bg-muted animate-pulse" />
            )}

            <p className="text-xs text-muted-foreground text-center mt-3 mb-2">
              Save the image or copy the stats text below.
            </p>

            <textarea
              readOnly
              value={buildText()}
              className="w-full h-20 text-xs bg-background border border-input rounded-md p-2 resize-none font-mono cursor-text"
              onClick={(e) => e.target.select()}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                <Clipboard className="w-4 h-4" /> Copy
              </button>
              <button
                type="button"
                onClick={handleCopyImage}
                disabled={!imgBlob}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md border border-input text-sm font-medium hover:bg-accent disabled:opacity-50"
              >
                <ImageIcon className="w-4 h-4" /> Copy Img
              </button>
              <button
                type="button"
                onClick={() => { if (imgBlob) downloadBlob(imgBlob, `${safeName()}.png`); }}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md border border-input text-sm font-medium hover:bg-accent"
              >
                <Download className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}