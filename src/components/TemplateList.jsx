import React, { useState } from "react";
import { Plus, Trash2, FileText, Wrench } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const MOD_OPTIONS = [
  { key: "o_rings_single", label: "O-rings (Single)" },
  { key: "o_rings_double", label: "O-rings (Double)" },
  { key: "lubed", label: "Lubed" },
  { key: "filmed", label: "Filmed" },
  { key: "tape_mod", label: "Tape Mod" },
];

const BUILD_TYPES = ["Silent", "Gaming", "Thock", "Clack", "Custom"];
const SWITCH_TYPES = ["Linear", "Tactile", "Clicky"];

export default function TemplateList({ templates, reload }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [buildType, setBuildType] = useState("Custom");
  const [switchType, setSwitchType] = useState("");
  const [mods, setMods] = useState({});
  const [targetDb, setTargetDb] = useState("");

  const createTemplate = async () => {
    if (!name.trim()) {
      toast({ title: "Please enter a name", variant: "destructive" });
      return;
    }
    const modList = Object.entries(mods).filter(([, v]) => v).map(([k]) => k);
    try {
      await base44.entities.BuildTemplate.create({
        name: name.trim(),
        description: description.trim() || undefined,
        modifications: JSON.stringify(modList),
        switch_type: switchType || undefined,
        build_type: buildType,
        target_db: targetDb ? parseFloat(targetDb) : undefined,
      });
      toast({ title: "Template published!" });
      setName("");
      setDescription("");
      setBuildType("Custom");
      setSwitchType("");
      setMods({});
      setTargetDb("");
      setShowForm(false);
      reload();
    } catch {
      toast({ title: "Failed to publish template", variant: "destructive" });
    }
  };

  const deleteTemplate = async (id) => {
    try {
      await base44.entities.BuildTemplate.delete(id);
      toast({ title: "Template deleted" });
      reload();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold">Build Templates</h2>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Publish
        </Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3 mb-3">
          <Input
            placeholder="Template name (e.g. Silent Build Template)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Textarea
            placeholder="What does this template achieve? How to apply it?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <div className="flex flex-wrap gap-1.5">
            {BUILD_TYPES.map((bt) => (
              <button
                key={bt}
                onClick={() => setBuildType(bt)}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  buildType === bt ? "border-primary bg-primary/5" : "border-border bg-background"
                }`}
              >
                {bt}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SWITCH_TYPES.map((st) => (
              <button
                key={st}
                onClick={() => setSwitchType(st === switchType ? "" : st)}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  switchType === st ? "border-primary bg-primary/5" : "border-border bg-background"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
          <Input
            type="number"
            placeholder="Target dB (optional)"
            value={targetDb}
            onChange={(e) => setTargetDb(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            {MOD_OPTIONS.map((mod) => (
              <label
                key={mod.key}
                className="flex items-center gap-2 text-xs cursor-pointer rounded-md border border-border px-2.5 py-2 hover:bg-accent"
              >
                <Checkbox
                  checked={!!mods[mod.key]}
                  onCheckedChange={(v) => setMods((prev) => ({ ...prev, [mod.key]: !!v }))}
                />
                {mod.label}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={createTemplate}>Publish Template</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-6 h-6 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground">No templates published yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((tmpl) => {
            let modList = [];
            try { modList = JSON.parse(tmpl.modifications || "[]"); } catch {}
            return (
              <div key={tmpl.id} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{tmpl.name}</p>
                    {tmpl.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{tmpl.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteTemplate(tmpl.id)}
                    className="text-muted-foreground hover:text-destructive shrink-0 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {tmpl.build_type && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{tmpl.build_type}</span>
                  )}
                  {tmpl.switch_type && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tmpl.switch_type}</span>
                  )}
                  {tmpl.target_db != null && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      ~{tmpl.target_db} dB
                    </span>
                  )}
                </div>
                {modList.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    <Wrench className="w-3 h-3 text-muted-foreground" />
                    {modList.map((m) => (
                      <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {m.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}