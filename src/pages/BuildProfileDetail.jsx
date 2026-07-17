import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Volume2, Gauge, Zap, Star, Keyboard, Plus } from "lucide-react";
import DecibelScale from "@/components/DecibelScale";
import KeyboardHeatmap from "@/components/KeyboardHeatmap";
import RecordingAudioPlayer from "@/components/RecordingAudioPlayer";
import ModRecommendations from "@/components/ModRecommendations";
import RecordingCard from "@/components/RecordingCard";
import SelectRecordingModal from "@/components/SelectRecordingModal";
import ShareButton from "@/components/ShareButton";
import SoundProfileBadge from "@/components/SoundProfileBadge";
import BuildSuggestions from "@/components/BuildSuggestions";
import { recordingWithProfile } from "@/lib/soundProfile";
import { generateBuildSuggestions } from "@/lib/buildSuggestions";

const BUILD_TYPE_STYLES = {
  Silent: "bg-blue-500/15 text-blue-400",
  Gaming: "bg-purple-500/15 text-purple-400",
  Thock: "bg-fuchsia-500/15 text-fuchsia-400",
  Clack: "bg-cyan-500/15 text-cyan-400",
  Custom: "bg-muted text-muted-foreground",
};

export default function BuildProfileDetail() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRecordingsModal, setShowRecordingsModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.BuildProfile.get(id);
        setProfile(data);
        // Increment view count (fire-and-forget)
        base44.entities.BuildProfile.update(id, {
          view_count: (data.view_count || 0) + 1,
        }).catch(() => {});
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-sm text-muted-foreground">Build profile not found</p>
      </div>
    );
  }

  let mods = [];
  try { mods = JSON.parse(profile.modifications || "[]"); } catch {}

  let recordings = [];
  try { recordings = JSON.parse(profile.recordings || "[]"); } catch {}

  // Generate build suggestions from the dominant sound profile + acoustic
  // data. Re-derived every render, so it updates when recordings change.
  const buildSuggestions = generateBuildSuggestions(profile);

  const removeRecording = async (recId) => {
    const updated = recordings.filter((r) => r.id !== recId);
    try {
      await base44.entities.BuildProfile.update(profile.id, {
        recordings: JSON.stringify(updated),
      });
      setProfile({ ...profile, recordings: JSON.stringify(updated) });
    } catch {
      // ignore
    }
  };

  const addRecordings = async (newRecordings) => {
    const entries = newRecordings.map(recordingWithProfile);
    const updated = [...recordings, ...entries];
    await base44.entities.BuildProfile.update(profile.id, {
      recordings: JSON.stringify(updated),
    });
    setProfile({ ...profile, recordings: JSON.stringify(updated) });
  };

  const rating = profile.responsiveness_rating || 0;

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold tracking-tight">{profile.name}</h1>
        <ShareButton
          recording={profile}
          onShare={() => {
            base44.entities.BuildProfile.update(profile.id, {
              share_count: (profile.share_count || 0) + 1,
            }).catch(() => {});
          }}
          onDownload={() => {
            base44.entities.BuildProfile.update(profile.id, {
              download_count: (profile.download_count || 0) + 1,
            }).catch(() => {});
          }}
        />
      </div>
      <div className="flex flex-wrap gap-2 mb-5">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${BUILD_TYPE_STYLES[profile.build_type] || BUILD_TYPE_STYLES.Custom}`}>
          {profile.build_type} Build
        </span>
        <SoundProfileBadge recording={profile} />
        {profile.switch_type && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
            {profile.switch_type}
          </span>
        )}
        {profile.keycap_profile && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
            {profile.keycap_profile} keycaps
          </span>
        )}
      </div>

      {/* Sound results */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <Volume2 className="w-4 h-4 mx-auto text-muted-foreground/60 mb-1" />
          <p className="text-[10px] uppercase text-muted-foreground">Avg dB</p>
          <p className="text-lg font-mono font-bold">
            {profile.avg_decibels != null ? profile.avg_decibels.toFixed(1) : "—"}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <Gauge className="w-4 h-4 mx-auto text-muted-foreground/60 mb-1" />
          <p className="text-[10px] uppercase text-muted-foreground">Peak dB</p>
          <p className="text-lg font-mono font-bold">
            {profile.peak_decibels != null ? profile.peak_decibels.toFixed(1) : "—"}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <Zap className="w-4 h-4 mx-auto text-muted-foreground/60 mb-1" />
          <p className="text-[10px] uppercase text-muted-foreground">WPM</p>
          <p className="text-lg font-mono font-bold">
            {profile.wpm > 0 ? profile.wpm : "—"}
          </p>
        </div>
      </div>

      {/* Decibel scale */}
      {profile.avg_decibels != null && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
          <DecibelScale db={profile.avg_decibels} />
        </div>
      )}

      {/* Audio */}
      {profile.audio_url && (
        <div className="bg-card border border-border rounded-lg p-3 mb-4">
          <RecordingAudioPlayer url={profile.audio_url} />
        </div>
      )}

      {/* Build Suggestions */}
      <div className="mb-5">
        <BuildSuggestions suggestions={buildSuggestions} />
      </div>

      {/* Recordings */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-xs font-semibold">
            Recordings ({recordings.length})
          </h3>
          <button
            onClick={() => setShowRecordingsModal(true)}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Recording
          </button>
        </div>
        {recordings.length > 0 ? (
          <div className="space-y-2">
            {recordings.map((r) => (
              <RecordingCard key={r.id || r.name} recording={r} onRemove={removeRecording} />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-dashed border-border rounded-xl p-6 text-center">
            <p className="text-xs text-muted-foreground mb-3">
              No recordings yet. Add one from your library.
            </p>
            <button
              onClick={() => setShowRecordingsModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary"
            >
              <Plus className="w-3.5 h-3.5" />
              Browse Recordings
            </button>
          </div>
        )}
      </div>

      <SelectRecordingModal
        open={showRecordingsModal}
        onClose={() => setShowRecordingsModal(false)}
        onAdd={addRecordings}
        existingIds={recordings.map((r) => r.id)}
      />

      {/* Mods */}
      {mods.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
          <h3 className="text-xs font-semibold mb-2 flex items-center gap-2">
            <Keyboard className="w-3.5 h-3.5 text-muted-foreground" />
            Applied Mods
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {mods.map((mod) => (
              <span key={mod} className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary">
                {mod.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {profile.notes && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
          <p className="text-xs text-muted-foreground leading-relaxed">{profile.notes}</p>
        </div>
      )}

      {/* Heatmap */}
      {profile.key_heatmap && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
          <h3 className="text-xs font-semibold mb-2">Key Heatmap</h3>
          <KeyboardHeatmap recording={profile} />
        </div>
      )}

      {/* Mod recommendations */}
      <div className="bg-card border border-border rounded-lg p-4">
        <ModRecommendations profile={profile} />
      </div>
    </div>
  );
}