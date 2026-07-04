import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { analyzeAudioFile } from "@/lib/audioAnalysis";

export default function AudioUploader({ onUploaded }) {
  const { toast } = useToast();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const [analysis, uploadRes] = await Promise.all([
        analyzeAudioFile(file),
        base44.integrations.Core.UploadFile({ file }),
      ]);
      const name = file.name.replace(/\.[^.]+$/, "");
      const record = await base44.entities.SoundRecording.create({
        name,
        category: "other",
        audio_url: uploadRes.file_url,
        avg_decibels: analysis.avg_decibels,
        peak_decibels: analysis.peak_decibels,
        min_decibels: analysis.min_decibels,
        duration_seconds: analysis.duration_seconds,
        decibel_samples: analysis.decibel_samples,
      });
      onUploaded?.(record);
      toast({ title: "Uploaded & analyzed" });
    } catch (err) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="mb-6">
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-dashed border-primary/40 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 disabled:opacity-60 transition-colors"
      >
        {busy ? (
          <>
            <span className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
            Analyzing audio…
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Upload audio to compare
          </>
        )}
      </button>
    </div>
  );
}