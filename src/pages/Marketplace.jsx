import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Plus, Loader2, Download, Star, ShoppingBag, X, Tag } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useSubscription, PLATFORM_FEE_PERCENT } from "@/hooks/useSubscription";
import { useAuth } from "@/lib/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import MobileSelect from "@/components/ui/mobile-select";

const TYPE_META = {
  build_pack: { label: "Build Pack", icon: "📦", color: "bg-blue-500/15 text-blue-400" },
  template: { label: "Template", icon: "📋", color: "bg-emerald-500/15 text-emerald-400" },
  sound_signature_pack: { label: "Sound Pack", icon: "🔊", color: "bg-purple-500/15 text-purple-400" },
  comparison_bundle: { label: "Comparison", icon: "⚖️", color: "bg-amber-500/15 text-amber-400" },
};

export default function Marketplace() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isPro, platformFeePercent } = useSubscription();
  const [listings, setListings] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const loadData = async () => {
    try {
      const [items, myPurchases] = await Promise.all([
        base44.entities.MarketplaceListing.list("-download_count", 200),
        base44.entities.Purchase.list("-created_date", 100),
      ]);
      setListings(items);
      setPurchases(myPurchases);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const purchasedIds = new Set(purchases.map((p) => p.listing_id));

  const filtered = listings
    .filter((l) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        l.title?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        l.creator_name?.toLowerCase().includes(q) ||
        l.tags?.toLowerCase().includes(q)
      );
    })
    .filter((l) => typeFilter === "all" || l.listing_type === typeFilter);

  const handlePurchase = async (listing) => {
    if (listing.price === 0 || purchasedIds.has(listing.id)) {
      toast({ title: "Downloaded!" });
      try {
        await base44.entities.MarketplaceListing.update(listing.id, {
          download_count: (listing.download_count || 0) + 1,
        });
      } catch {}
      loadData();
      return;
    }

    const fee = Math.round(listing.price * platformFeePercent * 100) / 100;
    const payout = Math.round((listing.price - fee) * 100) / 100;

    try {
      await base44.entities.Purchase.create({
        listing_id: listing.id,
        listing_title: listing.title,
        listing_type: listing.listing_type,
        price: listing.price,
        platform_fee: fee,
        creator_payout: payout,
        creator_name: listing.creator_name,
      });
      await base44.entities.MarketplaceListing.update(listing.id, {
        download_count: (listing.download_count || 0) + 1,
      });
      toast({ title: "Purchased!", description: `${listing.title} added to your library` });
      loadData();
    } catch {
      toast({ title: "Purchase failed", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-xs text-muted-foreground">Build packs, templates & more</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 text-xs text-primary font-medium px-3 py-2 rounded-lg border border-primary/20 hover:bg-primary/5"
        >
          <Plus className="w-3.5 h-3.5" /> Sell
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search marketplace..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 h-10 rounded-full bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Type filters */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {["all", ...Object.keys(TYPE_META)].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              typeFilter === t
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {t === "all" ? "All" : TYPE_META[t].label}
          </button>
        ))}
      </div>

      {/* Revenue info banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 flex items-center gap-2">
        <Tag className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground">
          Creators keep <span className="text-primary font-medium">{Math.round((1 - platformFeePercent) * 100)}%</span> of every sale
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No listings found</p>
          <button onClick={() => setShowCreate(true)} className="text-xs text-primary font-medium mt-2">
            Be the first to list
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((listing) => {
            const meta = TYPE_META[listing.listing_type] || {};
            const owned = purchasedIds.has(listing.id) || listing.price === 0;
            const isMine = listing.creator_name === user?.full_name;
            return (
              <div
                key={listing.id}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div
                  className="h-2"
                  style={{ backgroundColor: listing.cover_color || "#10b981" }}
                />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{listing.title}</h3>
                      {listing.creator_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          by {listing.creator_name}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${meta.color || ""}`}>
                      {meta.icon} {meta.label}
                    </span>
                  </div>

                  {listing.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {listing.description}
                    </p>
                  )}

                  {listing.tags && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {listing.tags.split(",").map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      {listing.rating > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {listing.rating.toFixed(1)}
                        </span>
                      )}
                      <span className="flex items-center gap-0.5">
                        <Download className="w-3 h-3" />
                        {listing.download_count || 0}
                      </span>
                    </div>

                    <button
                      onClick={() => handlePurchase(listing)}
                      disabled={isMine}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isMine
                          ? "bg-muted text-muted-foreground cursor-default"
                          : owned
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {isMine ? (
                        "Your listing"
                      ) : owned ? (
                        <>
                          <Download className="w-3.5 h-3.5" /> Download
                        </>
                      ) : listing.price === 0 ? (
                        <>
                          <Download className="w-3.5 h-3.5" /> Free
                        </>
                      ) : (
                        `$${listing.price.toFixed(2)}`
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateListingForm
          user={user}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function CreateListingForm({ user, onClose, onCreated }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [listingType, setListingType] = useState("build_pack");
  const [price, setPrice] = useState(0);
  const [tags, setTags] = useState("");
  const [coverColor, setCoverColor] = useState("#10b981");
  const [saving, setSaving] = useState(false);

  const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4"];

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "Please enter a title", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.MarketplaceListing.create({
        title: title.trim(),
        description: description.trim() || undefined,
        listing_type: listingType,
        price: Number(price) || 0,
        creator_name: user?.full_name || "Anonymous",
        tags: tags.trim() || undefined,
        cover_color: coverColor,
      });
      toast({ title: "Listing created!" });
      onCreated();
    } catch {
      toast({ title: "Failed to create listing", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Create Listing</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-accent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <Input
            placeholder="Listing title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <MobileSelect
            value={listingType}
            onValueChange={setListingType}
            placeholder="Listing type"
            options={Object.entries(TYPE_META).map(([value, meta]) => ({
              value,
              label: `${meta.icon} ${meta.label}`,
            }))}
          />

          <Textarea
            placeholder="What's included? What does it achieve?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="resize-none"
          />

          <Input
            placeholder="Tags (comma separated, e.g. thock, silent, linear)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Price (USD)
            </label>
            <Input
              type="number"
              min="0"
              step="0.50"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0 for free"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              You keep {Math.round((1 - PLATFORM_FEE_PERCENT) * 100)}% of each sale
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Cover color
            </label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setCoverColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    coverColor === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border p-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish"}
          </Button>
        </div>
      </div>
    </div>
  );
}