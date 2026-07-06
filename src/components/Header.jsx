import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const titles = {
  "/": "Sound Meter",
  "/recordings": "Recordings",
  "/compare": "Compare",
  "/rankings": "Rankings",
  "/roulette": "Sound Roulette",
  "/switches": "Switches",
  "/settings": "Settings",
};

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isRoot = pathname === "/";
  const title = titles[pathname] || "DecibelDash";

  return (
    <header
      className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center gap-2 h-14 px-4 max-w-lg mx-auto">
        {!isRoot ? (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        ) : (
          <div className="w-14" />
        )}
        <h1 className="flex-1 text-center text-sm font-semibold tracking-tight">{title}</h1>
        <div className="w-14" />
      </div>
    </header>
  );
}