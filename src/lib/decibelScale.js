export const DB_ZONES = [
  { label: "Quiet", min: 40, max: 52, range: 12, bar: "bg-green-500/40", text: "text-green-400", desc: "Silent switches, dampened" },
  { label: "Moderate", min: 52, max: 62, range: 10, bar: "bg-yellow-500/40", text: "text-yellow-400", desc: "Tactile switches" },
  { label: "Loud", min: 62, max: 73, range: 11, bar: "bg-orange-500/40", text: "text-orange-400", desc: "Clicky switches" },
  { label: "Very Loud", min: 73, max: 90, range: 17, bar: "bg-red-500/40", text: "text-red-400", desc: "Heavy typing, hollow case" },
];

export const SCALE_MIN = 38;
export const SCALE_MAX = 88;

export function getDbCategory(db) {
  if (db == null || db < 40) return null;
  return DB_ZONES.find((z) => db >= z.min && db < z.max) || DB_ZONES[3];
}