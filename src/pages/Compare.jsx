import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { GitCompare, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import RecordingCard from "@/components/RecordingCard";
import ComparisonChart from "@/components/ComparisonChart";
import AudioUploader from "@/components/AudioUploader";

export default function Compare() {
  const { toast } = useToast();
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.SoundRecording.list("-created_date", 100);
        setRecordings(data);
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

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Compare</h1>
      <p className="text-xs text-muted-foreground mb-6">
        Select 2–6 recordings to compare side by side
      </p>

      <AudioUploader onUploaded={(r) => setRecordings((prev) => [r, ...prev])} />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : recordings.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <GitCompare className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No recordings to compare yet</p>
        </div>
      ) : (
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