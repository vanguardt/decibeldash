import React, { useState, useEffect } from "react";
import { Share2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ShareButton({ recording, className }) {
  const { toast } = useToast();
  const [audioBlob, setAudioBlob] = useState(null);

  // Pre-fetch the audio so navigator.share runs within the tap gesture
  useEffect(() => {
    if (!recording.audio_url) return;
    let cancelled = false;
    fetch(recording.audio_url)
      .then((r) => r.blob())
      .then((b) => { if (!cancelled) setAudioBlob(b); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [recording.audio_url]);

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

  const handleShare = async (e) => {
    e.stopPropagation();
    const text = buildText();

    // Share the audio file + stats together when supported
    if (audioBlob && typeof navigator.canShare === "function") {
      const type = audioBlob.type || "audio/webm";
      const ext = type.includes("mp4") ? "m4a" : "webm";
      const file = new File([audioBlob], `${recording.name || "recording"}.${ext}`, { type });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ title: recording.name, text, files: [file] });
        } catch (err) {
          /* user cancelled */
        }
        return;
      }
    }

    // Fallback: stats text + audio link
    const shareData = { title: recording.name, text };
    if (recording.audio_url) shareData.url = recording.audio_url;
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        /* user cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(
          text + (recording.audio_url ? `\n${recording.audio_url}` : "")
        );
        toast({ title: "Copied to clipboard" });
      } catch {
        toast({ title: "Couldn't share", variant: "destructive" });
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-colors shrink-0 ${className || ""}`}
      aria-label="Share"
    >
      <Share2 className="w-3.5 h-3.5" />
    </button>
  );
}