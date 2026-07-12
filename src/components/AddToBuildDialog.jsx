import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Boxes, Loader2, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MobileSelect from "@/components/ui/mobile-select";
import { useToast } from "@/components/ui/use-toast";
import { recordingWithProfile } from "@/lib/soundProfile";

export default function AddToBuildDialog({ recording }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [newBuildName, setNewBuildName] = useState("");
  const [newBuildType, setNewBuildType] = useState("Custom");
  const [mode, setMode] = useState("existing");

  const loadBuilds = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.BuildProfile.list("-updated_date", 50);
      setBuilds(data);
      if (data.length > 0) {
        setSelectedId(data[0].id);
        setMode("existing");
      } else {
        setMode("new");
      }
    } catch {
      setMode("new");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadBuilds();
  }, [open]);

  const handleAdd = async () => {
    setSaving(true);
    const entry = recordingWithProfile(recording);
    try {
      if (mode === "new") {
        const name = newBuildName.trim() || recording.name;
        await base44.entities.BuildProfile.create({
          name,
          build_type: newBuildType,
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
          recordings: JSON.stringify([entry]),
        });
      } else {
        const build = builds.find((b) => b.id === selectedId);
        if (!build) {
          toast({ title: "Select a build", variant: "destructive" });
          return;
        }
        let existing = [];
        try { existing = JSON.parse(build.recordings || "[]"); } catch {}
        if (existing.some((r) => r.id === recording.id)) {
          toast({ title: "Already in this build" });
          setOpen(false);
          return;
        }
        existing.push(entry);
        await base44.entities.BuildProfile.update(selectedId, {
          recordings: JSON.stringify(existing),
        });
      }
      toast({ title: "Added to build!" });
      setOpen(false);
      navigate("/builds");
    } catch {
      toast({ title: "Failed to add", variant: "destructive" });
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
        aria-label="Add to build"
        title="Add to build"
      >
        <Boxes className="w-3.5 h-3.5" />
        Add to Build
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
        className="w-full max-w-sm bg-card border border-border rounded-xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Add to Build</h2>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); if (!saving) setOpen(false); }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={(e) => { e.stopPropagation(); if (builds.length > 0) setMode("existing"); }}
            disabled={builds.length === 0}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mode === "existing" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            } disabled:opacity-40`}
          >
            Existing Build
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setMode("new"); }}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mode === "new" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            New Build
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : mode === "existing" ? (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {builds.map((b) => (
              <button
                key={b.id}
                onClick={(e) => { e.stopPropagation(); setSelectedId(b.id); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors ${
                  selectedId === b.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{b.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {b.build_type}
                    {b.avg_decibels != null ? ` · ${b.avg_decibels.toFixed(0)} dB` : ""}
                  </p>
                </div>
                {selectedId === b.id && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              placeholder="Build name"
              value={newBuildName}
              onChange={(e) => setNewBuildName(e.target.value)}
              className="bg-background"
            />
            <MobileSelect
              value={newBuildType}
              onValueChange={setNewBuildType}
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
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1"
            onClick={handleAdd}
            disabled={saving || (mode === "existing" && !selectedId)}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Add to Build
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}