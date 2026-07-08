import React, { useState } from "react";
import { Loader2, Trophy, Folder, Wrench, GitCompare, User } from "lucide-react";
import { useCreatorData } from "@/hooks/useCreatorData";
import CreatorComparison from "@/components/CreatorComparison";
import CreatorIdentityCard from "@/components/CreatorIdentityCard";
import CreatorBadgeGrid from "@/components/CreatorBadgeGrid";
import ChallengeList from "@/components/ChallengeList";
import CollectionManager from "@/components/CollectionManager";
import TemplateList from "@/components/TemplateList";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "collections", label: "Collections", icon: Folder },
  { id: "challenges", label: "Challenges", icon: Trophy },
  { id: "templates", label: "Templates", icon: Wrench },
  { id: "compare", label: "Compare", icon: GitCompare },
];

export default function Creator() {
  const { recordings, builds, collections, templates, loading, reload } = useCreatorData();
  const [tab, setTab] = useState("profile");

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <div className="text-center mb-5">
        <h1 className="text-xl font-bold tracking-tight">Creator Mode</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Your builds, badges, collections & identity
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide mb-5 -mx-4 px-4">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "profile" && (
        <div>
          <CreatorIdentityCard
            recordings={recordings}
            builds={builds}
            collections={collections}
          />
          <CreatorBadgeGrid
            recordings={recordings}
            builds={builds}
            collections={collections}
          />
        </div>
      )}

      {tab === "collections" && (
        <CollectionManager
          builds={builds}
          collections={collections}
          reload={reload}
        />
      )}

      {tab === "challenges" && (
        <ChallengeList recordings={recordings} builds={builds} />
      )}

      {tab === "templates" && (
        <TemplateList templates={templates} reload={reload} />
      )}

      {tab === "compare" && (
        <CreatorComparison recordings={recordings} />
      )}
    </div>
  );
}