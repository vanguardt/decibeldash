import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { AnimatePresence } from "framer-motion";
import RecordingCard from "@/components/RecordingCard";

export default function Recordings() {
  const { toast } = useToast();
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterCategory, setFilterCategory] = useState("all");

  const loadRecordings = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.SoundRecording.list("-created_date", 100);
      setRecordings(data);
    } catch (err) {
      toast({ title: "Failed to load recordings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecordings();
  }, []);

  const handleDelete = async (id) => {
    try {
      await base44.entities.SoundRecording.delete(id);
      setRecordings((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Recording deleted" });
    } catch (err) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  let filtered = recordings.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.notes || "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "all" || r.category === filterCategory;
    return matchSearch && matchCategory;
  });

  if (sortBy === "newest") filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  else if (sortBy === "quietest") filtered.sort((a, b) => a.avg_decibels - b.avg_decibels);
  else if (sortBy === "loudest") filtered.sort((a, b) => b.avg_decibels - a.avg_decibels);
  else if (sortBy === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Recordings</h1>
      <p className="text-xs text-muted-foreground mb-6">All your saved sound measurements</p>

      {/* Search & Filters */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search keyboards…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="bg-card flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="quietest">Quietest first</SelectItem>
              <SelectItem value="loudest">Loudest first</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="bg-card flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="mechanical">Mechanical</SelectItem>
              <SelectItem value="membrane">Membrane</SelectItem>
              <SelectItem value="scissor">Scissor</SelectItem>
              <SelectItem value="optical">Optical</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {recordings.length === 0 ? "No recordings yet" : "No matches found"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((r) => (
              <RecordingCard key={r.id} recording={r} onDelete={handleDelete} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}