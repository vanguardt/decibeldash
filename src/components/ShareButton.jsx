import React, { useState, useEffect, useRef } from "react";
import { Share2, X, Download, Clipboard } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { makeStatsImage } from "@/lib/statsCard";

export default function ShareButton({ recording, className }) {
  const { toast } = useToast();
  const [imgBlob, setImgBlob] = useState(null);
  const [open, setOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState(null);
  const [imgError, setImgError] = useState(false);
  const textAreaRef = useRef(null);

  // Pre-generate the stats card image so it's ready when the button is tapped.
  useEffect(() => {
    let cancelled = false;
    makeStatsImage(recording)
      .then((b) => { if (!cancelled) setImgBlob(b); })
      .catch(() => { if (!cancelled) setImgError(true); });
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

  const handleCopy = async () => {
    const text = buildText();
    // Text clipboard — most widely supported across browsers
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "Stats copied — paste anywhere" });
        return;
      } catch {}
    }
    // Fallback: select + execCommand for older/restricted browsers
    if (textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.select();
      textAreaRef.current.setSelectionRange(0, text.length);
      try {
        document.execCommand("copy");
        toast({ title: "Stats copied!" });
        return;
      } catch {}
    }
    toast({ title: "Press and hold the text to copy manually" });
  };

  // Only use native share on touch/mobile devices — desktop browsers have
  // navigator.share but it opens a poor/unusable dialog, so skip straight
  // to the modal there.
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  const handleShare = async (e) => {
    e.stopPropagation();
    const text = buildText();

    if (isTouchDevice) {
      // Try file share first, then text-only
      if (imgBlob) {
        const file = new File([imgBlob], `${safeName()}.png`, { type: "image/png" });
        if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ title: recording.name, text, files: [file] });
            return;
          } catch {}
        }
      }
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({ title: recording.name, text });
          return;
        } catch {}
      }
    }

    // Desktop or native share unavailable: show modal
    setOpen(true);
  };

  const hasNativeShare = isTouchDevice && typeof navigator.share === "function";

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
              ref={textAreaRef}
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
              {hasNativeShare && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.share({ title: recording.name, text: buildText() });
                    } catch {}
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md border border-input text-sm font-medium hover:bg-accent"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              )}
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