import React, { useState } from "react";
import { Check, Crown, Zap, Loader2, KeyRound, ExternalLink } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

// PayPal checkout — funds go to roger@roger-thornton.com
// After payment, PayPal redirects back to /payment-success which auto-generates & emails the code
const PAYPAL_CONFIG = {
  business: "roger@roger-thornton.com",
  lifetime: { amount: "9.99", itemName: "DecibelDash Pro - Lifetime" },
  monthly: { amount: "2.99", itemName: "DecibelDash Pro - Monthly" },
};

function buildPayPalUrl(type) {
  const cfg = PAYPAL_CONFIG[type];
  const returnUrl = encodeURIComponent(`${window.location.origin}/payment-success?type=${type}`);
  return `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${PAYPAL_CONFIG.business}&amount=${cfg.amount}&item_name=${encodeURIComponent(cfg.itemName)}&currency_code=USD&return=${returnUrl}`;
}

export default function Pricing() {
  const { isPro, subType, redeemCode } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [unlockCode, setUnlockCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const handleRedeem = async () => {
    if (!unlockCode.trim()) {
      toast({ title: "Please enter your unlock code", variant: "destructive" });
      return;
    }
    setRedeeming(true);
    try {
      await redeemCode(unlockCode);
      toast({
        title: "Welcome to Pro! 👑",
        description: "Your unlock code was accepted — Pro is now active.",
      });
      setUnlockCode("");
      navigate("/");
    } catch (err) {
      toast({
        title: "Invalid code",
        description: err.message || "Please check your code and try again.",
        variant: "destructive",
      });
    } finally {
      setRedeeming(false);
    }
  };

  const handlePayPal = (type) => {
    window.location.href = buildPayPalUrl(type);
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

      {/* Pro tier — PayPal purchase */}
      {!isPro && (
        <>
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

            {/* Lifetime via PayPal */}
            <button
              onClick={() => handlePayPal("lifetime")}
              className="w-full bg-primary text-primary-foreground rounded-xl p-4 mb-3 text-left hover:bg-primary/90 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">Lifetime</p>
                  <p className="text-[10px] opacity-80">One-time payment via PayPal</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-2xl font-bold">$9.99</p>
                    <p className="text-[10px] opacity-80">forever</p>
                  </div>
                  <ExternalLink className="w-4 h-4 opacity-70" />
                </div>
              </div>
            </button>

            {/* Monthly via PayPal */}
            <button
              onClick={() => handlePayPal("monthly")}
              className="w-full border border-primary/30 rounded-xl p-4 text-left hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">Monthly</p>
                  <p className="text-[10px] text-muted-foreground">Cancel anytime</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-2xl font-bold">$2.99</p>
                    <p className="text-[10px] text-muted-foreground">/month</p>
                  </div>
                  <ExternalLink className="w-4 h-4 opacity-50" />
                </div>
              </div>
            </button>
          </div>

          {/* Unlock code redemption */}
          <div className="bg-card border border-border rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <KeyRound className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Enter Unlock Code</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Already purchased? You'll receive a unique unlock code after PayPal checkout. Enter it below to activate Pro.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. DD-PRO-LIFE-XXXXXX"
                value={unlockCode}
                onChange={(e) => setUnlockCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
                className="bg-background font-mono text-sm"
              />
              <Button
                onClick={handleRedeem}
                disabled={redeeming}
                className="shrink-0"
              >
                {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unlock"}
              </Button>
            </div>
          </div>
        </>
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
        Payments processed via PayPal. After purchase you'll receive a unique unlock code by email to activate Pro.
      </p>
    </div>
  );
}