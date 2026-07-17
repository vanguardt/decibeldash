import React, { useRef, useState, useCallback } from "react";
import { Share2, Download, Loader2, Award, Waves } from "lucide-react";
import WaveformCanvas from "@/components/sound/WaveformCanvas";
import SpectrogramCanvas from "@/components/sound/SpectrogramCanvas";
import { switchGuessStyles, signatureStyles } from "@/lib/soundProfileAnalysis";

// Shareable Keyboard Sound Card — waveform, spectrogram, signature,
// quality score, and switch profile guess. Exports as PNG via html2canvas.
export default function SoundCard({ recording, analysis, freqTimeline, compact = false }) {
  const cardRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [imgUrl, setImgUrl] = useState(null);

  const captureCard = useCallback(async () => {
    if (!cardRef.current) return null;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
    });
    return canvas.toDataURL("image/png");
  }, []);

  if (!analysis) return null;

  const samples = (() => {
    try { return JSON.parse(recording?.decibel_samples || "[]"); } catch { return []; }
  })();

  const score = analysis.qualityScore;
  const scoreColor =
    score >= 80 ? "text-emerald-500" :
    score >= 60 ? "text-sky-500" :
    score >= 40 ? "text-amber-500" : "text-rose-500";

  const swStyle = switchGuessStyles[analysis.switchGuess] || switchGuessStyles.linear;
  const sigStyle = signatureStyles[analysis.soundSignature] || signatureStyles.Balanced;

  const handleShare = async () => {
    setSharing(true);
    try {
      const dataUrl = await captureCard();
      setImgUrl(dataUrl);
      setShowShareModal(true);
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = async () => {
    let dataUrl = imgUrl;
    if (!dataUrl) {
      setSharing(true);
      dataUrl = await captureCard();
      setSharing(false);
    }
    if (dataUrl) {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${(recording?.name || "decibeldash").replace(/\s+/g, "_")}-soundcard.png`;
      a.click();
    }
  };

  const handleCopyImage = async () => {
    try {
      const dataUrl = imgUrl || (sharing ? null : await captureCard());
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    } catch {
      // clipboard not available — fall back to download
      handleDownload();
    }
  };

  return (
    <div className="relative">
      <div
        ref={cardRef}
        className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/40 p-4 space-y-3"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Waves className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary">Sound Card</span>
              <p className="text-sm font-semibold leading-tight">{recording?.name || "Untitled Keyboard"}</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-background border border-border">
            <span className={`text-xl font-mono font-bold leading-none ${scoreColor}`}>{score}</span>
            <span className="text-[8px] uppercase text-muted-foreground mt-0.5">Quality</span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${swStyle.className}`}>
            {swStyle.label} Switch
          </span>
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${sigStyle.className}`}>
            {sigStyle.label}
          </span>
          {analysis.switchConfidence != null && (
            <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
              {analysis.switchConfidence}% conf.
            </span>
          )}
        </div>

        {/* Waveform */}
        <div className="bg-background/60 rounded-xl p-2.5">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-1.5">Waveform</p>
          <WaveformCanvas samples={samples} height={56} />
        </div>

        {/* Spectrogram */}
        {!compact && (
          <div className="bg-background/60 rounded-xl p-2.5">
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-1.5">Spectrogram</p>
            <SpectrogramCanvas timeline={freqTimeline} height={72} />
          </div>
        )}

        {/* Signature graph — compact bar chart of the 4 signature metrics */}
        {!compact && (
          <div className="bg-background/60 rounded-xl p-2.5">
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-1.5">Sound Signature</p>
            <div className="space-y-1.5">
              {[
                { label: "Thockiness", value: analysis.metrics?.thockiness ?? 0, color: "bg-purple-500" },
                { label: "Clackiness", value: analysis.metrics?.clackiness ?? 0, color: "bg-orange-500" },
                { label: "Deepness", value: analysis.metrics?.deepness ?? 0, color: "bg-violet-500" },
                { label: "Brightness", value: analysis.metrics?.brightness ?? 0, color: "bg-sky-500" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="text-[9px] w-16 text-muted-foreground">{s.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.value}%` }} />
                  </div>
                  <span className="text-[9px] font-mono w-6 text-right">{Math.round(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <span className="text-[9px] text-muted-foreground">
            {recording?.avg_decibels != null ? `${recording.avg_decibels} dB avg` : ""}
            {recording?.peak_decibels != null ? ` · ${recording.peak_decibels} dB peak` : ""}
            {recording?.duration_seconds != null ? ` · ${recording.duration_seconds}s` : ""}
            {recording?.category ? ` · ${recording.category}` : ""}
          </span>
          <span className="text-[9px] text-primary font-semibold">DecibelDash</span>
        </div>
      </div>

      {/* Share button */}
      <button
        onClick={handleShare}
        disabled={sharing}
        className="mt-2 w-full flex items-center justify-center gap-2 text-xs font-medium text-primary px-3 py-2 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors disabled:opacity-50"
      >
        {sharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
        {sharing ? "Generating…" : "Share Sound Card"}
      </button>

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-card border border-border rounded-2xl p-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-3 text-center">Share Your Sound Card</h3>
            {imgUrl && (
              <img src={imgUrl} alt="Sound Card" className="w-full rounded-lg border border-border mb-3" />
            )}
            <div className="flex gap-2">
              <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <Download className="w-3.5 h-3.5" /> Save PNG
              </button>
              <button onClick={handleCopyImage} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border hover:bg-accent transition-colors">
                Copy Image
              </button>
            </div>
            <button onClick={() => setShowShareModal(false)} className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}