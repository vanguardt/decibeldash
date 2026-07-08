import React from "react";
import { X, Crown } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdBanner() {
  return (
    <div className="relative w-full bg-muted/60 border border-border rounded-lg p-3 flex items-center gap-3">
      <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Crown className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">
          Go Pro for unlimited recordings & ad-free
        </p>
        <p className="text-[10px] text-muted-foreground">
          $2.99/mo or $9.99 lifetime
        </p>
      </div>
      <Link
        to="/pricing"
        className="shrink-0 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
      >
        Upgrade
      </Link>
    </div>
  );
}