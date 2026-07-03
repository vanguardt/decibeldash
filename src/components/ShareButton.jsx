import React, { useState, useEffect } from "react";
import { Share2, X, Download, Clipboard } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { makeStatsImage } from "@/lib/statsCard";

export default function ShareButton({ recording, className }) {
  const { toast } = useToast();
  const [imgBlob, setImgBlob] = useState(null);
  const [open, setOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState(null);

  // Pre-generate the stats card image so it's ready when the button is tapped.
  useEffect(() => {
    let cancelled = false;
    makeStatsImage(recording)
      .then((b) => { if (!cancelled) setImgBlob(b); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [recording]);

  // Build an object URL for the on-screen preview.
  useEffect(() => {
    if (open && imgBlob) {
      const url = URL.createObjectURL(imgBlob);
      setImgUrl(url);
      return () => { URL.revokeObjectURL(url); setImgUrl(null); };
    }
  }, [open, imgBlob]);

  const buildText = () => {
    const lines = [`⌨️ ${recording.name}`];
    if (recording.avg_decibels != null) {
      lines.push(
        `🔊 Avg: ${recording.avg_decibels.toFixed(1)} dB · Peak: ${recording.peak_decibels?.toFixed(1)} dB`
      );
    }
    if (recording.wpm > 0) {
      lines.push(`⚡ ${recording.wpm} WPM · ${recording.accuracy?.toFixed(0)}% accuracy`);
    }
    if (recording.duration_seconds > 0) {
      lines.push(`⏱️ ${recording.duration_seconds.toFixed(0)}s`);
    }
    lines.push("— via DecibelDash");
    return lines.join("\n");
  };

  const safeName = () =>
    (recording.name || "recording").replace(/[^a-z0-9-_ ]/gi, "").trim() || "recording";

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

  const copyImage = async () => {
    if (!imgBlob) return;
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": imgBlob,
            "text/plain": new Blob([buildText()], { type: "text/plain" }),
          }),
        ]);
        toast({ title: "Copied — paste into Discord" });
        return;
      } catch {}
    }
    toast({ title: "Right-click the image → Copy", description: "Then paste into Discord." });
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const text = buildText();
    // Mobile: native share sheet (Discord appears as a target)
    if (imgBlob) {
      const file = new File([imgBlob], `${safeName()}.png`, { type: "image/png" });
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        navigator.share({ title: recording.name, text, files: [file] }).catch(() => {});
        return;
      }
    }
    // Desktop / restricted iframe: show the card on screen to copy or save manually
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        className={`flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-colors shrink-0 ${className || ""}`}
        aria-label="Share or download"
      >
        <Share2 className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
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
              <img src={imgUrl} alt="Recording stats" className="w-full rounded-lg" />
            ) : (
              <div className="w-full aspect-[4/5] rounded-lg bg-muted animate-pulse" />
            )}

            <p className="text-xs text-muted-foreground text-center mt-3 mb-3">
              Long-press or right-click the image to save it, then paste into Discord.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyImage}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                <Clipboard className="w-4 h-4" /> Copy
              </button>
              <button
                type="button"
                onClick={() => imgBlob && downloadBlob(imgBlob, `${safeName()}.png`)}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md border border-input text-sm font-medium hover:bg-accent"
              >
                <Download className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}