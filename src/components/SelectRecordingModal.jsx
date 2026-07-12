import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Loader2, Plus, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { soundProfile, profileStyles } from "@/lib/soundProfile";

export default function SelectRecordingModal({ open, onClose, onAdd, existingIds = [] }) {
  const { toast } = useToast();
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelected([]);
      setSearch("");
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const data = await base44.entities.SoundRecording.list("-created_date", 100);
        setRecordings(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open]);

  const filtered = recordings.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.notes || "").toLowerCase().includes(search.toLowerCase());
    const notAlreadyAdded = !existingIds.includes(r.id);
    return matchSearch && notAlreadyAdded;
  });

  const toggleSelect = (rec) => {
    setSelected((prev) =>
      prev.some((r) => r.id === rec.id)
        ? prev.filter((r) => r.id !== rec.id)
        : [...prev, rec]
    );
  };

  const handleConfirm = async () => {
    if (selected.length === 0) {
      toast({ title: "Select at least one recording", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await onAdd(selected);
      onClose();
    } catch {
      toast({ title: "Failed to add recordings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card border border-border rounded-xl p-4 space-y-3 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Add Recordings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground shrink-0">
          {selected.length > 0
            ? `${selected.length} selected`
            : "Pick recordings from your library to add to this build"}
        </p>

        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search recordings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 -mx-1 px-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">
              {recordings.length === 0 ? "No recordings in your library" : "No matches found"}
            </p>
          ) : (
            filtered.map((r) => {
              const profile = soundProfile(r);
              const style = profileStyles[profile] || profileStyles.thocky;
              const isSelected = selected.some((s) => s.id === r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => toggleSelect(r)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{r.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${style.className}`}>
                        {style.label}
                      </span>
                      {r.avg_decibels != null && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {r.avg_decibels.toFixed(0)} dB
                        </span>
                      )}
                      {r.peak_decibels != null && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ↑{r.peak_decibels.toFixed(0)}
                        </span>
                      )}
                      {r.duration_seconds > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {r.duration_seconds.toFixed(0)}s
                        </span>
                      )}
                      {r.category && (
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {r.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? "bg-primary border-primary" : "border-border"
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex gap-2 pt-2 shrink-0 border-t border-border">
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={saving || selected.length === 0}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Add {selected.length > 0 ? `(${selected.length})` : ""}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}