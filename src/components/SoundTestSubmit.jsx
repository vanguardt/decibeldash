import React, { useState, useRef } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MobileSelect from "@/components/ui/mobile-select";
import { useToast } from "@/components/ui/use-toast";

export default function SoundTestSubmit({ switchEntry, onClose, onSubmitted }) {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [audioFile, setAudioFile] = useState(null);
  const [keyboard, setKeyboard] = useState("");
  const [keycapProfile, setKeycapProfile] = useState("");
  const [avgDb, setAvgDb] = useState("");
  const [peakDb, setPeakDb] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!audioFile) {
      toast({ title: "Please select an audio file", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const uploadRes = await base44.integrations.Core.UploadFile({ file: audioFile });

      await base44.entities.SwitchSoundTest.create({
        switch_id: switchEntry.id,
        switch_name: switchEntry.name,
        audio_url: uploadRes.file_url,
        avg_decibels: avgDb ? parseFloat(avgDb) : undefined,
        peak_decibels: peakDb ? parseFloat(peakDb) : undefined,
        keyboard: keyboard.trim() || undefined,
        keycap_profile: keycapProfile || undefined,
        notes: notes.trim() || undefined,
      });

      await base44.entities.SwitchEntry.update(switchEntry.id, {
        sound_test_count: (switchEntry.sound_test_count || 0) + 1,
      });

      toast({ title: "Sound test submitted!" });
      onSubmitted?.();
      onClose();
    } catch {
      toast({ title: "Failed to submit", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-card border border-border rounded-2xl p-5 max-w-md w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-accent text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-semibold mb-1">Submit Sound Test</h2>
        <p className="text-xs text-muted-foreground mb-4">{switchEntry.name}</p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/40 hover:bg-accent/50 transition-colors"
          >
            {audioFile ? (
              <>
                <Upload className="w-5 h-5 text-primary" />
                <span className="text-xs text-primary font-medium truncate max-w-[200px]">{audioFile.name}</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Tap to select audio file</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
          />

          <Input placeholder="Keyboard (e.g. Keychron K2)" value={keyboard} onChange={(e) => setKeyboard(e.target.value)} />

          <MobileSelect
            value={keycapProfile}
            onValueChange={setKeycapProfile}
            placeholder="Keycap profile"
            options={[
              { value: "", label: "None" },
              { value: "Cherry", label: "Cherry" },
              { value: "OEM", label: "OEM" },
              { value: "XVX", label: "XVX" },
              { value: "MT3", label: "MT3" },
              { value: "Other", label: "Other" },
            ]}
          />

          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Avg dB (optional)" type="number" value={avgDb} onChange={(e) => setAvgDb(e.target.value)} />
            <Input placeholder="Peak dB (optional)" type="number" value={peakDb} onChange={(e) => setPeakDb(e.target.value)} />
          </div>

          <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="resize-none" />

          <Button className="w-full" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
              </>
            ) : (
              "Submit Sound Test"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}