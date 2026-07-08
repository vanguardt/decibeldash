import React, { useState, useEffect } from "react";
import { KeyRound, Mail, CheckCircle2, Loader2, Copy, Home } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

export default function PaymentSuccess() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(null);
  const [tierType, setTierType] = useState("lifetime");
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get("type") === "monthly" ? "monthly" : "lifetime";
    setTierType(type);

    const generateAndSend = async () => {
      try {
        if (!user || !user.email) {
          setError("Please log in to receive your unlock code.");
          setLoading(false);
          return;
        }
        setEmail(user.email);

        // Generate code via backend function (workflow auto-emails it)
        const response = await base44.functions.invoke("generateUnlockCode", { tier_type: type });
        if (response.data?.error) throw new Error(response.data.error);

        setCode(response.data.code);
      } catch (err) {
        setError("Something went wrong generating your code. Please contact support.");
      } finally {
        setLoading(false);
      }
    };

    if (user) generateAndSend();
  }, [user]);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      toast({ title: "Code copied!" });
    });
  };

  const handleRedeem = async () => {
    if (!code) return;
    try {
      if (!user?.id) {
        toast({ title: "Please log in to activate", variant: "destructive" });
        return;
      }
      const response = await base44.functions.invoke("redeemUnlockCode", {
        code,
        user_id: user.id,
      });
      const data = response.data;
      if (!data || data.success === false || data.error) {
        throw new Error(data?.error || "Could not activate");
      }
      toast({ title: "Pro activated! 👑", description: "All features unlocked." });
      navigate("/");
    } catch (err) {
      toast({ title: "Could not activate automatically", description: "Enter the code on the Pricing page.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 max-w-lg mx-auto">
      <div className="w-full">
        {loading ? (
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-lg font-bold mb-1">Processing your payment…</h1>
            <p className="text-xs text-muted-foreground">Generating your unlock code</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Button onClick={() => navigate("/pricing")}>Back to Pricing</Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold mb-1">Payment Successful!</h1>
            <p className="text-xs text-muted-foreground mb-6">
              Here's your Pro unlock code
            </p>

            <div className="bg-card border-2 border-dashed border-primary/30 rounded-xl p-6 mb-4">
              <KeyRound className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-mono font-bold tracking-wider break-all">{code}</p>
            </div>

            <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground mb-6">
              <Mail className="w-3.5 h-3.5" />
              <span>Code sent to {email}</span>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handleRedeem} className="w-full">
                Activate Pro Now
              </Button>
              <Button onClick={handleCopy} variant="outline" className="w-full">
                <Copy className="w-4 h-4 mr-2" /> Copy Code
              </Button>
              <Button onClick={() => navigate("/pricing")} variant="ghost" className="w-full">
                Enter on Pricing Page
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground mt-4">
              Keep this code safe. You can also enter it manually on the Pricing page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}