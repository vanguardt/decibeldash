import React, { useState } from "react";
import { Plus, X, Trash2, Folder } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const THEMES = [
  { value: "Silent", label: "Silent", color: "#3b82f6" },
  { value: "Thock", label: "Thock", color: "#a855f7" },
  { value: "Clack", label: "Clack", color: "#f97316" },
  { value: "Budget", label: "Budget", color: "#22c55e" },
  { value: "Gaming", label: "Gaming", color: "#ef4444" },
  { value: "Custom", label: "Custom", color: "#64748b" },
];

function getBuildIds(coll) {
  try { return JSON.parse(coll.build_ids || "[]"); } catch { return []; }
}

export default function CollectionManager({ builds, collections, reload }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("Custom");
  const [expandedId, setExpandedId] = useState(null);

  const createCollection = async () => {
    if (!name.trim()) {
      toast({ title: "Please enter a name", variant: "destructive" });
      return;
    }
    const themeColor = THEMES.find((t) => t.value === theme)?.color || "#64748b";
    try {
      await base44.entities.BuildCollection.create({
        name: name.trim(),
        description: description.trim() || undefined,
        theme,
        build_ids: "[]",
        cover_color: themeColor,
      });
      toast({ title: "Collection created!" });
      setName("");
      setDescription("");
      setTheme("Custom");
      setShowForm(false);
      reload();
    } catch {
      toast({ title: "Failed to create collection", variant: "destructive" });
    }
  };

  const toggleBuildInCollection = async (coll, buildId) => {
    const ids = getBuildIds(coll);
    const newIds = ids.includes(buildId)
      ? ids.filter((id) => id !== buildId)
      : [...ids, buildId];
    try {
      await base44.entities.BuildCollection.update(coll.id, {
        build_ids: JSON.stringify(newIds),
      });
      reload();
    } catch {
      toast({ title: "Failed to update collection", variant: "destructive" });
    }
  };

  const deleteCollection = async (id) => {
    try {
      await base44.entities.BuildCollection.delete(id);
      toast({ title: "Collection deleted" });
      setExpandedId(null);
      reload();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold">Build Collections</h2>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          New
        </Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3 mb-3">
          <Input
            placeholder="Collection name (e.g. Silent Linears Collection)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <div className="flex flex-wrap gap-1.5">
            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  theme === t.value
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background"
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={createCollection}>Create</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {collections.length === 0 ? (
        <div className="text-center py-8">
          <Folder className="w-6 h-6 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground">No collections yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {collections.map((coll) => {
            const buildIds = getBuildIds(coll);
            const isExpanded = expandedId === coll.id;
            const themeColor = coll.cover_color || THEMES.find((t) => t.value === coll.theme)?.color || "#64748b";
            return (
              <div key={coll.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : coll.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-accent transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: themeColor + "20" }}>
                    <Folder className="w-4 h-4" style={{ color: themeColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{coll.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {coll.theme} · {buildIds.length} build{buildIds.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-border pt-2">
                    {coll.description && (
                      <p className="text-xs text-muted-foreground mb-2">{coll.description}</p>
                    )}
                    {builds.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">No builds available to add</p>
                    ) : (
                      <div className="space-y-1">
                        {builds.map((b) => {
                          const inCollection = buildIds.includes(b.id);
                          return (
                            <button
                              key={b.id}
                              onClick={() => toggleBuildInCollection(coll, b.id)}
                              className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-colors ${
                                inCollection ? "bg-primary/10 border border-primary/20" : "bg-background border border-border"
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                                inCollection ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                              }`}>
                                {inCollection && <span className="text-[8px]">✓</span>}
                              </div>
                              <span className="truncate flex-1">{b.name}</span>
                              <span className="text-muted-foreground font-mono">{b.avg_decibels?.toFixed(0)} dB</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <button
                      onClick={() => deleteCollection(coll.id)}
                      className="flex items-center gap-1.5 text-xs text-destructive mt-2 hover:underline"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete collection
                    </button>
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