import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Boxes, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileSelect from "@/components/ui/mobile-select";
import { useToast } from "@/components/ui/use-toast";

export default function SaveAsBuildDialog({ recording }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [buildType, setBuildType] = useState("Custom");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.BuildProfile.create({
        name: recording.name,
        build_type: buildType,
        avg_decibels: recording.avg_decibels,
        peak_decibels: recording.peak_decibels,
        min_decibels: recording.min_decibels,
        duration_seconds: recording.duration_seconds,
        switch_type: recording.switch_type || undefined,
        keycap_profile: recording.keycap_profile || undefined,
        modifications: recording.modifications || undefined,
        decibel_samples: recording.decibel_samples || undefined,
        key_heatmap: recording.key_heatmap || undefined,
        audio_url: recording.audio_url || undefined,
        wpm: recording.wpm > 0 ? recording.wpm : undefined,
        accuracy: recording.wpm > 0 ? recording.accuracy : undefined,
        notes: recording.notes || undefined,
      });
      toast({ title: "Saved to Builds!" });
      setOpen(false);
      navigate("/builds");
    } catch {
      toast({ title: "Failed to save build", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-medium text-muted-foreground hover:text-primary hover:bg-accent transition-colors shrink-0 border border-border"
        aria-label="Save as build profile"
        title="Save as build profile"
      >
        <Boxes className="w-3.5 h-3.5" />
        Build
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        e.stopPropagation();
        if (!saving) setOpen(false);
      }}
    >
      <div
        className="w-full max-w-sm bg-card border border-border rounded-xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Save as Build Profile</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Add <span className="font-medium text-foreground">{recording.name}</span> to the Builds page.
        </p>

        <MobileSelect
          value={buildType}
          onValueChange={setBuildType}
          placeholder="Build type"
          className="bg-background"
          options={[
            { value: "Silent", label: "Silent Build" },
            { value: "Gaming", label: "Gaming Build" },
            { value: "Thock", label: "Thock Build" },
            { value: "Clack", label: "Clack Build" },
            { value: "Custom", label: "Custom" },
          ]}
        />

        <div className="flex gap-2 pt-2">
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Boxes className="w-4 h-4 mr-2" />}
            Save to Builds
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}