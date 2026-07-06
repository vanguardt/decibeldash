import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { GitCompare, Check, Boxes } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import RecordingCard from "@/components/RecordingCard";
import ComparisonChart from "@/components/ComparisonChart";
import AudioUploader from "@/components/AudioUploader";
import ModComparison from "@/components/ModComparison";
import BuildProfileComparison from "@/components/BuildProfileComparison";

export default function Compare() {
  const { toast } = useToast();
  const [recordings, setRecordings] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [mode, setMode] = useState("chart");
  const [beforeId, setBeforeId] = useState("");
  const [afterId, setAfterId] = useState("");
  const [buildAId, setBuildAId] = useState("");
  const [buildBId, setBuildBId] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [recData, buildData] = await Promise.all([
          base44.entities.SoundRecording.list("-created_date", 100),
          base44.entities.BuildProfile.list("-created_date", 100),
        ]);
        setRecordings(recData);
        setBuilds(buildData);
      } catch (err) {
        toast({ title: "Failed to load", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length >= 6 ? prev : [...prev, id]
    );
  };

  const selectedRecordings = recordings.filter((r) => selected.includes(r.id));
  const beforeRecording = recordings.find((r) => r.id === beforeId);
  const afterRecording = recordings.find((r) => r.id === afterId);
  const buildA = builds.find((b) => b.id === buildAId);
  const buildB = builds.find((b) => b.id === buildBId);

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Compare</h1>
      <p className="text-xs text-muted-foreground mb-4">
        {mode === "chart"
          ? "Select 2–6 recordings to compare side by side"
          : mode === "beforeafter"
          ? "Pick a before and after recording to see mod impact"
          : "Pick two build profiles to compare dB peaks & heatmap patterns"}
      </p>

      {/* Mode toggle */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-full mb-6">
        <button
          type="button"
          onClick={() => setMode("chart")}
          className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            mode === "chart" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Chart
        </button>
        <button
          type="button"
          onClick={() => setMode("beforeafter")}
          className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            mode === "beforeafter" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Before / After
        </button>
        <button
          type="button"
          onClick={() => setMode("builds")}
          className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            mode === "builds" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          <Boxes className="w-3 h-3 inline mr-1" />
          Builds
        </button>
      </div>

      {mode !== "builds" && <AudioUploader onUploaded={(r) => setRecordings((prev) => [r, ...prev])} />}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : mode === "builds" ? (
        builds.length < 2 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Boxes className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {builds.length === 0
                ? "No build profiles yet — save one from the Record page"
                : "Need at least 2 build profiles to compare"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Build A</label>
                <select
                  value={buildAId}
                  onChange={(e) => setBuildAId(e.target.value)}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select…</option>
                  {builds.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Build B</label>
                <select
                  value={buildBId}
                  onChange={(e) => setBuildBId(e.target.value)}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select…</option>
                  {builds.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {buildA && buildB && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <BuildProfileComparison before={buildA} after={buildB} />
              </motion.div>
            )}

            {(!buildA || !buildB) && (buildAId || buildBId) && (
              <div className="bg-card border border-border rounded-xl p-6 text-center mb-8">
                <p className="text-sm text-muted-foreground">Select both a Build A and Build B to compare</p>
              </div>
            )}
          </>
        )
      ) : recordings.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <GitCompare className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No recordings to compare yet</p>
        </div>
      ) : (
        <>
          {mode === "chart" && (
            <>
              {/* Selection count */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full">
                  <Check className="w-3 h-3" />
                  {selected.length} selected
                </div>
                {selected.length > 0 && (
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setSelected([])}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Comparison chart */}
              {selectedRecordings.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <ComparisonChart recordings={selectedRecordings} />
                </motion.div>
              )}

              {selectedRecordings.length === 1 && (
                <div className="bg-card border border-border rounded-xl p-6 text-center mb-8">
                  <p className="text-sm text-muted-foreground">Select at least one more recording to compare</p>
                </div>
              )}
            </>
          )}

          {mode === "beforeafter" && (
            <>
              {/* Before/After selectors */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Before</label>
                  <select
                    value={beforeId}
                    onChange={(e) => setBeforeId(e.target.value)}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select…</option>
                    {recordings.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">After</label>
                  <select
                    value={afterId}
                    onChange={(e) => setAfterId(e.target.value)}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select…</option>
                    {recordings.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {beforeRecording && afterRecording && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <ModComparison before={beforeRecording} after={afterRecording} />
                </motion.div>
              )}

              {(!beforeRecording || !afterRecording) && (beforeId || afterId) && (
                <div className="bg-card border border-border rounded-xl p-6 text-center mb-8">
                  <p className="text-sm text-muted-foreground">Select both a before and after recording</p>
                </div>
              )}
            </>
          )}

          {/* Recordings to pick from */}
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Your Recordings
          </h2>
          <div className="space-y-2">
            {recordings.map((r) => (
              <RecordingCard
                key={r.id}
                recording={r}
                selected={selected.includes(r.id)}
                onSelect={toggleSelect}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}