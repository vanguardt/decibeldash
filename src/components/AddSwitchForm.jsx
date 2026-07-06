import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MobileSelect from "@/components/ui/mobile-select";
import { useToast } from "@/components/ui/use-toast";

export default function AddSwitchForm({ onClose, onCreated, editSwitch }) {
  const { toast } = useToast();
  const isEditing = !!editSwitch;
  const [name, setName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [switchTypeInput, setSwitchTypeInput] = useState("Linear");
  const [pitchProfile, setPitchProfile] = useState("Neutral");
  const [avgDb, setAvgDb] = useState("");
  const [peakDb, setPeakDb] = useState("");
  const [rating, setRating] = useState("");
  const [actuationForce, setActuationForce] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editSwitch) {
      setName(editSwitch.name || "");
      setManufacturer(editSwitch.manufacturer || "");
      setSwitchTypeInput(editSwitch.switch_type || "Linear");
      setPitchProfile(editSwitch.pitch_profile || "Neutral");
      setAvgDb(editSwitch.avg_decibels != null ? String(editSwitch.avg_decibels) : "");
      setPeakDb(editSwitch.peak_decibels != null ? String(editSwitch.peak_decibels) : "");
      setRating(editSwitch.responsiveness_rating != null ? String(editSwitch.responsiveness_rating) : "");
      setActuationForce(editSwitch.actuation_force != null ? String(editSwitch.actuation_force) : "");
      setDescription(editSwitch.description || "");
    }
  }, [editSwitch]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: "Switch name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        manufacturer: manufacturer.trim() || undefined,
        switch_type: switchTypeInput.trim() || "Linear",
        pitch_profile: pitchProfile,
        avg_decibels: avgDb ? parseFloat(avgDb) : undefined,
        peak_decibels: peakDb ? parseFloat(peakDb) : undefined,
        responsiveness_rating: rating ? parseFloat(rating) : undefined,
        actuation_force: actuationForce ? parseFloat(actuationForce) : undefined,
        description: description.trim() || undefined,
      };

      if (isEditing) {
        const updated = await base44.entities.SwitchEntry.update(editSwitch.id, payload);
        toast({ title: "Switch updated!" });
        onCreated?.(updated);
      } else {
        payload.sound_test_count = 0;
        const created = await base44.entities.SwitchEntry.create(payload);
        toast({ title: "Switch added!" });
        onCreated?.(created);
      }
      onClose();
    } catch {
      toast({ title: isEditing ? "Failed to update switch" : "Failed to add switch", variant: "destructive" });
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
        <h2 className="text-sm font-semibold mb-4">{isEditing ? "Edit Switch" : "Add Switch"}</h2>
        <div className="space-y-3">
          <Input placeholder="Switch name *" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Manufacturer" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
          <div>
            <Input
              placeholder="Switch type (e.g. Linear, Tactile, Clicky...)"
              value={switchTypeInput}
              onChange={(e) => setSwitchTypeInput(e.target.value)}
              list="switch-type-suggestions"
            />
            <datalist id="switch-type-suggestions">
              <option value="Linear" />
              <option value="Tactile" />
              <option value="Clicky" />
              <option value="Silent Linear" />
              <option value="Silent Tactile" />
            </datalist>
          </div>
          <MobileSelect
            value={pitchProfile}
            onValueChange={setPitchProfile}
            placeholder="Pitch profile"
            options={[
              { value: "Thocky", label: "Thocky" },
              { value: "Clacky", label: "Clacky" },
              { value: "Marbly", label: "Marbly" },
              { value: "Creamy", label: "Creamy" },
              { value: "High-pitched", label: "High-pitched" },
              { value: "Low-pitched", label: "Low-pitched" },
              { value: "Neutral", label: "Neutral" },
            ]}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Avg dB" type="number" value={avgDb} onChange={(e) => setAvgDb(e.target.value)} />
            <Input placeholder="Peak dB" type="number" value={peakDb} onChange={(e) => setPeakDb(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Rating (1-5)" type="number" min="1" max="5" step="0.5" value={rating} onChange={(e) => setRating(e.target.value)} />
            <Input placeholder="Actuation (g)" type="number" value={actuationForce} onChange={(e) => setActuationForce(e.target.value)} />
          </div>
          <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="resize-none" />
          <Button className="w-full" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Switch"}
          </Button>
        </div>
      </div>
    </div>
  );
}