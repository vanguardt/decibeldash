import React from "react";
import { Lock, Crown, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function PremiumGate({ featureLabel, children, compact }) {
  if (compact) {
    return (
      <Link
        to="/pricing"
        className="group block w-full bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-3 hover:border-primary/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 shrink-0">
            <Lock className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold leading-tight">{featureLabel}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Unlock with DecibelDash Pro</p>
          </div>
          <div className="flex items-center gap-1 text-primary shrink-0">
            <Crown className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Pro</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="w-full relative overflow-hidden bg-gradient-to-br from-primary/8 via-card to-card border border-primary/20 rounded-2xl p-6 text-center">
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-3 ring-1 ring-primary/20">
          <Crown className="w-6 h-6 text-primary" />
        </div>
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Premium Feature</span>
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <p className="text-sm font-semibold mb-1">{featureLabel}</p>
        <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
          Get the full acoustic breakdown, resonance maps, and PDF exports with DecibelDash Pro.
        </p>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Crown className="w-3.5 h-3.5" /> Upgrade to Pro
        </Link>
      </div>
    </div>
  );
}