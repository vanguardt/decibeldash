import React from "react";
import { Share2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ShareButton({ recording, className }) {
  const { toast } = useToast();

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