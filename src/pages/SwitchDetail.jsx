import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Star, Volume2, Gauge, Zap, Loader2, Plus, Pencil } from "lucide-react";
import RecordingAudioPlayer from "@/components/RecordingAudioPlayer";
import SoundTestSubmit from "@/components/SoundTestSubmit";
import FrequencySpectrum from "@/components/FrequencySpectrum";
import AddSwitchForm from "@/components/AddSwitchForm";
import { useAuth } from "@/lib/AuthContext";

const TYPE_COLORS = {
  Linear: "bg-blue-500/15 text-blue-400",
  Tactile: "bg-emerald-500/15 text-emerald-400",
  Clicky: "bg-amber-500/15 text-amber-400",
};

const PITCH_COLORS = {
  Thocky: "bg-purple-500/15 text-purple-400",
  Clacky: "bg-cyan-500/15 text-cyan-400",
  Marbly: "bg-pink-500/15 text-pink-400",
  Creamy: "bg-orange-500/15 text-orange-400",
  "High-pitched": "bg-yellow-500/15 text-yellow-400",
  "Low-pitched": "bg-indigo-500/15 text-indigo-400",
  Neutral: "bg-muted text-muted-foreground",
};

export default function SwitchDetail() {
  const { id } = useParams();
  const [switchEntry, setSwitchEntry] = useState(null);
  const [soundTests, setSoundTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const loadData = async () => {
    try {
      const sw = await base44.entities.SwitchEntry.get(id);
      setSwitchEntry(sw);
      const tests = await base44.entities.SwitchSoundTest.filter(
        { switch_id: id },
        "-created_date",
        100
      );
      setSoundTests(tests);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!switchEntry) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-sm text-muted-foreground">Switch not found</p>
      </div>
    );
  }

  const rating = switchEntry.responsiveness_rating || 0;

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight">{switchEntry.name}</h1>
          {switchEntry.manufacturer && (
            <p className="text-sm text-muted-foreground">{switchEntry.manufacturer}</p>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowEdit(true)}
            className="shrink-0 flex items-center gap-1 text-xs text-primary font-medium px-2.5 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/5"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_COLORS[switchEntry.switch_type] || ""}`}>
          {switchEntry.switch_type}
        </span>
        {switchEntry.pitch_profile && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${PITCH_COLORS[switchEntry.pitch_profile] || PITCH_COLORS.Neutral}`}>
            {switchEntry.pitch_profile}
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <Volume2 className="w-4 h-4 mx-auto text-muted-foreground/60 mb-1" />
          <p className="text-[10px] uppercase text-muted-foreground">Avg dB</p>
          <p className="text-lg font-mono font-bold">
            {switchEntry.avg_decibels != null ? switchEntry.avg_decibels.toFixed(1) : "—"}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <Gauge className="w-4 h-4 mx-auto text-muted-foreground/60 mb-1" />
          <p className="text-[10px] uppercase text-muted-foreground">Force</p>
          <p className="text-lg font-mono font-bold">
            {switchEntry.actuation_force ? `${switchEntry.actuation_force}g` : "—"}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <Zap className="w-4 h-4 mx-auto text-muted-foreground/60 mb-1" />
          <p className="text-[10px] uppercase text-muted-foreground">Snappy</p>
          <div className="flex items-center justify-center gap-0.5 mt-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`w-3.5 h-3.5 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      {switchEntry.description && (
        <div className="bg-card border border-border rounded-lg p-4 mb-5">
          <p className="text-xs text-muted-foreground leading-relaxed">{switchEntry.description}</p>
        </div>
      )}

      {/* Sound tests */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Sound Tests ({soundTests.length})</h2>
          <button
            onClick={() => setShowSubmit(true)}
            className="flex items-center gap-1 text-xs text-primary font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Submit
          </button>
        </div>

        {soundTests.length === 0 ? (
          <div className="text-center py-8 bg-card border border-border rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">No sound tests yet</p>
            <button onClick={() => setShowSubmit(true)} className="text-xs text-primary font-medium">
              Be the first to submit
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {soundTests.map((test) => (
              <div key={test.id} className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    {test.keyboard && (
                      <p className="text-xs font-medium truncate">{test.keyboard}</p>
                    )}
                    {test.keycap_profile && (
                      <p className="text-[10px] text-muted-foreground">{test.keycap_profile} keycaps</p>
                    )}
                  </div>
                  {test.avg_decibels != null && (
                    <span className="shrink-0 text-[10px] font-mono text-emerald-400">
                      {test.avg_decibels.toFixed(1)} dB
                    </span>
                  )}
                </div>
                {test.audio_url && <RecordingAudioPlayer url={test.audio_url} />}
                {test.audio_url && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <FrequencySpectrum audioUrl={test.audio_url} />
                  </div>
                )}
                {test.notes && (
                  <p className="text-[10px] text-muted-foreground mt-2">{test.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showSubmit && (
        <SoundTestSubmit
          switchEntry={switchEntry}
          onClose={() => setShowSubmit(false)}
          onSubmitted={() => loadData()}
        />
      )}

      {showEdit && (
        <AddSwitchForm
          editSwitch={switchEntry}
          onClose={() => setShowEdit(false)}
          onCreated={() => loadData()}
        />
      )}
    </div>
  );
}