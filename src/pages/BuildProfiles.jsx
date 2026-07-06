import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Mic } from "lucide-react";
import BuildProfileCard from "@/components/BuildProfileCard";

export default function BuildProfiles() {
  const location = useLocation();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [switchFilter, setSwitchFilter] = useState("all");

  useEffect(() => {
    if (location.pathname !== "/builds") return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await base44.entities.BuildProfile.list("-updated_date", 200);
        setProfiles(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [location.pathname]);

  const filtered = profiles.filter(
    (p) =>
      (typeFilter === "all" || p.build_type === typeFilter) &&
      (switchFilter === "all" || (p.switch_type || "").toLowerCase() === switchFilter.toLowerCase())
  );

  const availableSwitches = ["all", ...new Set(profiles.map((p) => p.switch_type).filter(Boolean))];

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Filters */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
        {availableSwitches.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground mb-4">No build profiles yet</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-primary font-medium"
          >
            <Mic className="w-4 h-4" />
            Record a sound test
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => (
            <BuildProfileCard key={p.id} profile={p} />
          ))}
        </div>
      )}
    </div>
  );
}