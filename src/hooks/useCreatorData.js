import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

export function useCreatorData() {
  const [recordings, setRecordings] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [collections, setCollections] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const [recs, blds, colls, tmpls] = await Promise.all([
        base44.entities.SoundRecording.list("-created_date", 100),
        base44.entities.BuildProfile.list("-created_date", 50),
        base44.entities.BuildCollection.list("-created_date", 50).catch(() => []),
        base44.entities.BuildTemplate.list("-created_date", 50).catch(() => []),
      ]);
      setRecordings(recs || []);
      setBuilds(blds || []);
      setCollections(colls || []);
      setTemplates(tmpls || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  return { recordings, builds, collections, templates, loading, reload: loadAll };
}