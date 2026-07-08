import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { buildAcousticProfile, generateAcousticInsights } from "@/lib/acousticProfile";

export function useAcousticProfile(wpmHistory = []) {
  const [recordings, setRecordings] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [recs, blds] = await Promise.all([
          base44.entities.SoundRecording.list("-created_date", 100),
          base44.entities.BuildProfile.list("-created_date", 50),
        ]);
        setRecordings(recs || []);
        setBuilds(blds || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const profile = useMemo(
    () => buildAcousticProfile(recordings, builds),
    [recordings, builds]
  );

  const insights = useMemo(
    () => generateAcousticInsights(recordings, builds, wpmHistory),
    [recordings, builds, wpmHistory]
  );

  return { profile, insights, loading };
}