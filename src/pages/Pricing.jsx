import React, { useState } from "react";
import { Check, Crown, Zap, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

const FREE_FEATURES = [
  "Basic sound recording",
  "Basic key heatmap",
  "Basic build profiles",
  "Basic comparison (up to 2)",
  "5 recording limit",
  "Community switch library",
];

const PRO_FEATURES = [
  "Unlimited recordings",
  "Advanced heatmaps & analysis",
  "Acoustic profile coaching",
  "Smart recommendations",
  "Creator stats dashboard",
  "Build collections",
  "Premium PNG exports",
  "Premium themes",
  "Priority new features",
  "Ad-free experience",
];

export default function Pricing() {
  const { isPro, subType, upgrade, loading } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(null); // "monthly" | "lifetime" | null

  const handleUpgrade = async (type) => {
    setProcessing(type);
    try {
      await upgrade(type);
      toast({
        title: "Welcome to Pro! 👑",
        description: type === "lifetime" ? "Lifetime access unlocked" : "Pro subscription active",
      });
      navigate("/");
    } catch {
      toast({ title: "Upgrade failed", variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Crown className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">DecibelDash Pro</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Unlock the full acoustic toolkit
        </p>
      </div>

      {isPro && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6 text-center">
          <Crown className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="text-sm font-medium text-primary">
            You're a Pro member{subType === "lifetime" ? " (Lifetime)" : " (Monthly)"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            All features unlocked. Thank you for your support!
          </p>
        </div>
      )}

      {/* Free tier */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold">Free</h2>
            <p className="text-xs text-muted-foreground">Get started</p>
          </div>
          <p className="text-2xl font-bold">$0</p>
        </div>
        <div className="space-y-2">
          {FREE_FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pro tier */}
      {!isPro && (
        <div className="bg-primary/5 border-2 border-primary/30 rounded-2xl p-5 mb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg">
            BEST VALUE
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Pro</h2>
              </div>
              <p className="text-xs text-muted-foreground">Full access</p>
            </div>
          </div>

          {/* Lifetime */}
          <button
            onClick={() => handleUpgrade("lifetime")}
            disabled={processing !== null}
            className="w-full bg-primary text-primary-foreground rounded-xl p-4 mb-3 text-left hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Lifetime</p>
                <p className="text-[10px] opacity-80">One-time payment</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">$9.99</p>
                <p className="text-[10px] opacity-80">forever</p>
              </div>
            </div>
            {processing === "lifetime" && (
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <Loader2 className="w-3 h-3 animate-spin" /> Processing...
              </div>
            )}
          </button>

          {/* Monthly */}
          <button
            onClick={() => handleUpgrade("monthly")}
            disabled={processing !== null}
            className="w-full border border-primary/30 rounded-xl p-4 text-left hover:bg-primary/5 transition-colors disabled:opacity-60"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Monthly</p>
                <p className="text-[10px] text-muted-foreground">Cancel anytime</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">$2.99</p>
                <p className="text-[10px] text-muted-foreground">/month</p>
              </div>
            </div>
            {processing === "monthly" && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> Processing...
              </div>
            )}
          </button>
        </div>
      )}

      {/* Pro feature list */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-primary" /> What you get with Pro
        </h3>
        <div className="space-y-2">
          {PRO_FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs">{f}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-4">
        Payments are processed securely. Cancel anytime.
      </p>
    </div>
  );
}