import React, { useState, useEffect } from "react";
import { Share2, X, Download, Clipboard, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ComparisonShareModal({ targetRef, recordings, open, onClose }) {
  const { toast } = useToast();
  const [imgBlob, setImgBlob] = useState(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const captureImage = async () => {
    if (!targetRef.current) return;
    setLoading(true);
    setError(false);
    setImgBlob(null);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (blob) {
        setImgBlob(blob);
        const url = URL.createObjectURL(blob);
        setImgUrl(url);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      captureImage();
    }
    return () => {
      if (imgUrl) URL.revokeObjectURL(imgUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const buildText = () => {
    const lines = recordings.map((r, i) => {
      const mods = (() => { try { return JSON.parse(r.modifications || "[]"); } catch { return []; } })();
      const modStr = mods.length > 0 ? ` · mods: ${mods.join(", ")}` : "";
      return `${i + 1}. ${r.name} — ${r.avg_decibels?.toFixed(1)} dB avg / ${r.peak_decibels?.toFixed(1)} dB peak${r.wpm ? ` · ${r.wpm} WPM` : ""}${modStr}`;
    });
    return `🔊 Keyboard Sound Comparison\n\n${lines.join("\n")}\n\nPowered by DecibelDash`;
  };

  const handleCopy = async () => {
    const text = buildText();
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Comparison copied!" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const handleDownload = () => {
    if (!imgBlob) return;
    const url = URL.createObjectURL(imgBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "decibeldash-comparison.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const hasNativeShare = typeof navigator.share === "function";

  const handleNativeShare = async () => {
    const text = buildText();
    if (imgBlob && typeof navigator.canShare === "function") {
      const file = new File([imgBlob], "decibeldash-comparison.png", { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ title: "Keyboard Sound Comparison", text, files: [file] });
          return;
        } catch {}
      }
    }
    if (hasNativeShare) {
      try {
        await navigator.share({ title: "Keyboard Sound Comparison", text });
      } catch {}
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-card border border-border rounded-2xl p-4 max-w-[340px] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-accent text-muted-foreground"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {loading ? (
          <div className="w-full aspect-[4/5] rounded-lg bg-muted flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Capturing comparison…</p>
          </div>
        ) : imgUrl ? (
          <img src={imgUrl} alt="Keyboard comparison" className="w-full rounded-lg" />
        ) : error ? (
          <div className="w-full aspect-[4/5] rounded-lg bg-muted flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Image unavailable</p>
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground text-center mt-3 mb-2">
          Share the image or copy the stats text below.
        </p>

        <textarea
          readOnly
          value={buildText()}
          className="w-full h-20 text-xs bg-background border border-input rounded-md p-2 resize-none font-mono cursor-text mb-3"
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
          {hasNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              disabled={!imgBlob}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md border border-input text-sm font-medium hover:bg-accent disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={!imgBlob}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md border border-input text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}