import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

let cachedAvg = null;
let fetchPromise = null;

export function useCommunityAvg() {
  const [avg, setAvg] = useState(cachedAvg);

  useEffect(() => {
    if (cachedAvg !== null) {
      setAvg(cachedAvg);
      return;
    }
    if (!fetchPromise) {
      fetchPromise = base44.entities.SoundRecording.list("-created_date", 200)
        .then((data) => {
          const valid = data.filter((r) => r.avg_decibels != null);
          cachedAvg =
            valid.length > 0
              ? valid.reduce((s, r) => s + r.avg_decibels, 0) / valid.length
              : null;
        })
        .catch(() => {})
        .finally(() => {
          fetchPromise = null;
        });
    }
    fetchPromise.then(() => setAvg(cachedAvg));
  }, []);

  return avg;
}