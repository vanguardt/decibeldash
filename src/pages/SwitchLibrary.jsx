import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Plus, Loader2 } from "lucide-react";
import SwitchCard from "@/components/SwitchCard";
import AddSwitchForm from "@/components/AddSwitchForm";

export default function SwitchLibrary() {
  const [switches, setSwitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sort, setSort] = useState("rating");
  const [showAdd, setShowAdd] = useState(false);

  const loadSwitches = async () => {
    try {
      const data = await base44.entities.SwitchEntry.list("-updated_date", 200);
      setSwitches(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSwitches();
  }, []);

  const filtered = switches
    .filter((s) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        s.name?.toLowerCase().includes(q) ||
        s.manufacturer?.toLowerCase().includes(q)
      );
    })
    .filter((s) => typeFilter === "all" || s.switch_type === typeFilter)
    .sort((a, b) => {
      if (sort === "rating")
        return (b.responsiveness_rating || 0) - (a.responsiveness_rating || 0);
      if (sort === "quiet")
        return (a.avg_decibels || 999) - (b.avg_decibels || 999);
      if (sort === "loud")
        return (b.avg_decibels || 0) - (a.avg_decibels || 0);
      if (sort === "name") return (a.name || "").localeCompare(b.name || "");
      return 0;
    });

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search switches..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 h-10 rounded-full bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Filters + sort */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {["all", "Linear", "Tactile", "Clicky"].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              typeFilter === t
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {t === "all" ? "All" : t}
          </button>
        ))}
        <div className="shrink-0 w-px h-5 bg-border mx-1" />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="shrink-0 bg-muted text-xs rounded-full px-3 py-1.5 text-muted-foreground focus:outline-none"
        >
          <option value="rating">Top Rated</option>
          <option value="quiet">Quietest</option>
          <option value="loud">Loudest</option>
          <option value="name">A–Z</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground mb-3">No switches found</p>
          <button onClick={() => setShowAdd(true)} className="text-sm text-primary font-medium">
            Add the first one
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((s) => (
            <SwitchCard key={s.id} switchEntry={s} />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-4 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors z-30"
        aria-label="Add switch"
      >
        <Plus className="w-5 h-5" />
      </button>

      {showAdd && (
        <AddSwitchForm onClose={() => setShowAdd(false)} onCreated={() => loadSwitches()} />
      )}
    </div>
  );
}