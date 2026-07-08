import { soundProfile } from "./soundProfile";
import { aggregateHeatmaps, findLoudKeys, analyzeModUsage, analyzeSwitchUsage, analyzeDbRange } from "./acousticProfile";

export function computeCreatorStats(recordings, builds, collections = []) {
  const modUsage = analyzeModUsage(recordings, builds);
  const switchUsage = analyzeSwitchUsage(recordings, builds);
  const dbRange = analyzeDbRange(recordings);
  const heatmap = aggregateHeatmaps(recordings);
  const loudKeys = findLoudKeys(heatmap);

  const all = [...recordings, ...builds];
  const moddedCount = all.filter((item) => {
    let mods = [];
    try { mods = JSON.parse(item.modifications || "[]"); } catch {}
    return mods.length > 0;
  }).length;

  const heatmapCount = recordings.filter((r) => {
    let hm = {};
    try { hm = JSON.parse(r.key_heatmap || "{}"); } catch {}
    return Object.keys(hm).length > 0;
  }).length;

  const profileCounts = {};
  for (const rec of recordings) {
    const p = soundProfile(rec);
    profileCounts[p] = (profileCounts[p] || 0) + 1;
  }
  const dominantProfile = Object.entries(profileCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  const bestWpm = Math.max(0, ...recordings.map((r) => r.wpm || 0));

  const topBuild = builds.length > 0
    ? builds.reduce((best, b) => ((b.wpm || 0) > (best.wpm || 0) ? b : best))
    : null;

  const totalMods = Object.values(modUsage).reduce((s, n) => s + n, 0);

  const weekAgo = Date.now() - 7 * 86400000;
  const recentRecordings = recordings.filter((r) => new Date(r.created_date).getTime() > weekAgo).length;

  return {
    recordingCount: recordings.length,
    buildCount: builds.length,
    collectionCount: collections.length,
    moddedCount,
    heatmapCount,
    dominantProfile,
    bestWpm,
    avgDb: dbRange?.avg,
    peakDb: dbRange?.peak,
    loudestKey: loudKeys[0]?.key || null,
    profileCounts,
    modUsage,
    switchUsage,
    topBuild,
    totalMods,
    recentRecordings,
  };
}

export function getCreatorTier(stats) {
  const { recordingCount, buildCount, moddedCount } = stats;
  const score = recordingCount + buildCount * 2 + moddedCount;
  if (score >= 30) return { name: "Master", color: "text-purple-400", bg: "bg-purple-500/10" };
  if (score >= 15) return { name: "Pro", color: "text-blue-400", bg: "bg-blue-500/10" };
  if (score >= 5) return { name: "Enthusiast", color: "text-emerald-400", bg: "bg-emerald-500/10" };
  return { name: "Beginner", color: "text-muted-foreground", bg: "bg-muted" };
}