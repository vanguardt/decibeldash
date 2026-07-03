import React, { useState, useEffect } from "react";
import { Share2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { makeStatsImage } from "@/lib/statsCard";

export default function ShareButton({ recording, className }) {
  const { toast } = useToast();
  const [imgBlob, setImgBlob] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);

  // Pre-generate the stats card image + fetch the audio so the share/download
  // call runs synchronously within the user's tap gesture.
  useEffect(() => {
    let cancelled = false;
    makeStatsImage(recording)
      .then((b) => { if (!cancelled) setImgBlob(b); })
      .catch(() => {});
    if (recording.audio_url) {
      fetch(recording.audio_url)
        .then((r) => r.blob())
        .then((b) => { if (!cancelled) setAudioBlob(b); })
        .catch(() => {});
    }
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

  const handleShare = (e) => {
    e.stopPropagation();
    const text = buildText();

    const files = [];
    if (imgBlob) files.push(new File([imgBlob], `${safeName()}.png`, { type: "image/png" }));
    if (audioBlob) {
      const t = audioBlob.type || "audio/webm";
      const ext = t.includes("mp4") ? "m4a" : "webm";
      files.push(new File([audioBlob], `${safeName()}.${ext}`, { type: t }));
    }

    // Share the stats image + audio together
    if (files.length > 0 && typeof navigator.canShare === "function" && navigator.canShare({ files })) {
      navigator.share({ title: recording.name, text, files }).catch(() => {});
      return;
    }

    // Download the stats image + audio to the device
    if (files.length > 0) {
      files.forEach((f) => downloadBlob(f, f.name));
      toast({ title: "Saved stats + recording to your device" });
      return;
    }

    // Not ready yet — share stats text + audio link
    const shareData = { title: recording.name, text };
    if (recording.audio_url) shareData.url = recording.audio_url;
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard
        .writeText(text + (recording.audio_url ? `\n${recording.audio_url}` : ""))
        .then(() => toast({ title: "Copied to clipboard" }))
        .catch(() => toast({ title: "Couldn't share", variant: "destructive" }));
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