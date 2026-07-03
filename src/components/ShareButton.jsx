import React, { useState, useEffect } from "react";
import { Share2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { makeStatsImage } from "@/lib/statsCard";

export default function ShareButton({ recording, className }) {
  const { toast } = useToast();
  const [imgBlob, setImgBlob] = useState(null);

  // Pre-generate the stats card image so the share/download call runs
  // synchronously within the user's tap gesture.
  useEffect(() => {
    let cancelled = false;
    makeStatsImage(recording)
      .then((b) => { if (!cancelled) setImgBlob(b); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [recording]);

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

  const handleShare = async (e) => {
    e.stopPropagation();
    const text = buildText();

    if (imgBlob) {
      const file = new File([imgBlob], `${safeName()}.png`, { type: "image/png" });
      // Mobile: native share sheet (Discord appears as a target)
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        navigator.share({ title: recording.name, text, files: [file] }).catch(() => {});
        return;
      }
      // Desktop: copy the image to the clipboard so it can be pasted into Discord
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          const item = new ClipboardItem({
            "image/png": imgBlob,
            "text/plain": new Blob([text], { type: "text/plain" }),
          });
          await navigator.clipboard.write([item]);
          toast({ title: "Copied — paste into Discord" });
          return;
        } catch {}
      }
      // Last resort: download the results image
      downloadBlob(imgBlob, `${safeName()}.png`);
      toast({ title: "Saved results to your device" });
      return;
    }

    // Image not ready yet — copy the stats text to clipboard
    try {
      await navigator.clipboard.writeText(
        text + (recording.audio_url ? `\n${recording.audio_url}` : "")
      );
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({ title: "Couldn't share", variant: "destructive" });
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-colors shrink-0 ${className || ""}`}
      aria-label="Share or download"
    >
      <Share2 className="w-3.5 h-3.5" />
    </button>
  );
}