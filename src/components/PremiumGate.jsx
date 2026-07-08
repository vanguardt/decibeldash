import React from "react";
import { Lock, Crown } from "lucide-react";
import { Link } from "react-router-dom";

export default function PremiumGate({ featureLabel, children, compact }) {
  if (compact) {
    return (
      <Link
        to="/pricing"
        className="block w-full bg-muted/40 border border-dashed border-primary/30 rounded-lg p-3 flex items-center gap-2 hover:bg-muted/60 transition-colors"
      >
        <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-xs text-muted-foreground flex-1">
          {featureLabel} — Upgrade to Pro
        </span>
        <Crown className="w-3.5 h-3.5 text-primary shrink-0" />
      </Link>
    );
  }

  return (
    <div className="w-full bg-muted/30 border border-dashed border-primary/20 rounded-xl p-6 text-center">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
        <Crown className="w-5 h-5 text-primary" />
      </div>
      <p className="text-sm font-medium mb-1">{featureLabel}</p>
      <p className="text-xs text-muted-foreground mb-3">
        Available with DecibelDash Pro
      </p>
      <Link
        to="/pricing"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
      >
        <Crown className="w-3.5 h-3.5" /> Upgrade to Pro
      </Link>
    </div>
  );
}