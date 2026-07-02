import React, { useState } from "react";
import { Share2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ShareButton({ recording, className }) {
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);

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

  const shareAsText = (text) => {
    const shareData = { title: recording.name, text };
    if (recording.audio_url) shareData.url = recording.audio_url;
    if (navigator.share) {
      return navigator
        .share(shareData)
        .catch(() => {})
        .finally(() => setSharing(false));
    }
    return navigator.clipboard
      .writeText(text + (recording.audio_url ? `\n${recording.audio_url}` : ""))
      .then(() => toast({ title: "Copied to clipboard" }))
      .catch(() => toast({ title: "Couldn't share", variant: "destructive" }))
      .finally(() => setSharing(false));
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    if (sharing) return;
    const text = buildText();

    // Try sharing the audio file + stats together (Web Share API w/ files)
    if (recording.audio_url && typeof navigator.canShare === "function") {
      try {
        setSharing(true);
        const res = await fetch(recording.audio_url);
        const blob = await res.blob();
        const type = blob.type || res.headers.get("Content-Type") || "audio/webm";
        const ext = type.includes("mp4") ? "m4a" : "webm";
        const file = new File([blob], `${recording.name || "recording"}.${ext}`, { type });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title: recording.name, text, files: [file] });
          setSharing(false);
          return;
        }
      } catch (err) {
        // fall through to text + link share
      }
      // canShare w/ files not supported → fall back
      return shareAsText(text);
    }

    setSharing(true);
    shareAsText(text);
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={sharing}
      className={`flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-colors shrink-0 disabled:opacity-50 ${className || ""}`}
      aria-label="Share"
    >
      {sharing ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Share2 className="w-3.5 h-3.5" />
      )}
    </button>
  );
}