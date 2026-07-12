import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, ChevronDown } from "lucide-react";
import BuildProfileCard from "@/components/BuildProfileCard";
import { getDominantSoundProfile } from "@/lib/soundProfile";

// Maps build-type filter buttons to sound profile keys.
// Silent/Thock/Clack filter by dominant soundProfile; Gaming/Custom stay build_type.
const TYPE_TO_SOUND_PROFILE = {
  Silent: "silent",
  Thock: "thocky",
  Clack: "clacky",
};

const LOUDNESS_BANDS = [
  { key: "all", label: "All Levels", min: -Infinity, max: Infinity },
  { key: "quiet", label: "Quiet (<45 dB)", min: -Infinity, max: 45 },
  { key: "moderate", label: "Moderate (45–55 dB)", min: 45, max: 55 },
  { key: "loud", label: "Loud (55–65 dB)", min: 55, max: 65 },
  { key: "very_loud", label: "Very Loud (>65 dB)", min: 65, max: Infinity },
];

const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "loudest", label: "Loudest" },
  { key: "quietest", label: "Quietest" },
  { key: "fastest", label: "Fastest WPM" },
];

export default function BuildProfiles() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [switchFilter, setSwitchFilter] = useState("all");
  const [loudnessFilter, setLoudnessFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.BuildProfile.list("-updated_date", 200);
      setProfiles(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const availableSwitches = useMemo(
    () => ["all", ...new Set(profiles.map((p) => p.switch_type).filter(Boolean))],
    [profiles]
  );

  const filtered = useMemo(() => {
    const band = LOUDNESS_BANDS.find((b) => b.key === loudnessFilter);
    const result = profiles.filter((p) => {
      let typeMatch;
      if (typeFilter === "all") {
        typeMatch = true;
      } else if (TYPE_TO_SOUND_PROFILE[typeFilter]) {
        // Filter by dominant sound profile (from recordings or build data)
        const dominant = getDominantSoundProfile(p);
        typeMatch = dominant === TYPE_TO_SOUND_PROFILE[typeFilter];
      } else {
        // Gaming, Custom — filter by build_type
        typeMatch = p.build_type === typeFilter;
      }
      const switchMatch =
        switchFilter === "all" ||
        (p.switch_type || "").toLowerCase() === switchFilter.toLowerCase();
      const db = p.avg_decibels ?? -Infinity;
      const loudnessMatch = db >= band.min && db < band.max;
      return typeMatch && switchMatch && loudnessMatch;
    });

    const sorted = [...result];
    switch (sortBy) {
      case "loudest":
        sorted.sort((a, b) => (b.avg_decibels ?? 0) - (a.avg_decibels ?? 0));
        break;
      case "quietest":
        sorted.sort((a, b) => (a.avg_decibels ?? 999) - (b.avg_decibels ?? 999));
        break;
      case "fastest":
        sorted.sort((a, b) => (b.wpm ?? 0) - (a.wpm ?? 0));
        break;
      default:
        sorted.sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
    }
    return sorted;
  }, [profiles, typeFilter, switchFilter, loudnessFilter, sortBy]);

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto relative pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold tracking-tight">Build Profiles</h1>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-xs font-medium text-primary"
        >
          <Plus className="w-4 h-4" />
          Add Build
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-2 mb-4">
        {/* Build type */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {["all", "Silent", "Gaming", "Thock", "Clack", "Custom"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                typeFilter === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {t === "all" ? "All Builds" : t}
            </button>
          ))}
        </div>

        {/* Loudness */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {LOUDNESS_BANDS.map((b) => (
            <button
              key={b.key}
              onClick={() => setLoudnessFilter(b.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                loudnessFilter === b.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Switch type */}
        {availableSwitches.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {availableSwitches.map((s) => (
              <button
                key={s}
                onClick={() => setSwitchFilter(s)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  switchFilter === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s === "all" ? "All Switches" : s}
              </button>
            ))}
          </div>
        )}

        {/* Sort */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            {filtered.length} build{filtered.length !== 1 ? "s" : ""}
          </span>
          <div className="relative">
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sort: {SORT_OPTIONS.find((o) => o.key === sortBy)?.label}
              <ChevronDown className="w-3 h-3" />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.key}
                      onClick={() => {
                        setSortBy(o.key);
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors ${
                        sortBy === o.key ? "text-primary font-medium" : "text-foreground"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground mb-4">
            {profiles.length === 0 ? "No build profiles yet" : "No builds match your filters"}
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-sm text-primary font-medium"
          >
            <Plus className="w-4 h-4" />
            Record a sound test
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => (
            <BuildProfileCard key={p.id} profile={p} />
          ))}
        </div>
      )}

      {/* Floating + button */}
      <button
        onClick={() => navigate("/")}
        className="fixed bottom-6 right-1/2 translate-x-[calc(50vw-2rem)] sm:right-6 sm:left-auto sm:translate-x-0 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center"
        aria-label="Add build profile"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}