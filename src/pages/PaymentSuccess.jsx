import React, { useState, useEffect } from "react";
import { Crown, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useSubscription } from "@/hooks/useSubscription";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { refresh } = useSubscription();
  const urlParams = new URLSearchParams(window.location.search);
  const planType = urlParams.get("type") || "lifetime";
  const sessionId = urlParams.get("session_id");
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        // Directly verify via Stripe session — most reliable
        const response = await base44.functions.invoke("verifyPayment", {
          session_id: sessionId,
        });
        const data = response.data;

        if (data?.activated) {
          await refresh();
          setStatus("success");
          setMessage(`Pro ${planType} is now active on your account. Enjoy full access!`);
        } else {
          setStatus("pending");
          setMessage(
            "Your payment was received! Pro access is being activated. Refresh this page in a few seconds, or check your Settings page."
          );
        }
      } catch {
        setStatus("pending");
        setMessage(
          "Your payment was received! Pro access is being activated. Please check your Settings page shortly."
        );
      }
    };

    verify();
  }, []);

  return (
    <div className="min-h-screen px-4 py-12 flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        {status === "checking" && (
          <>
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-bold mb-2">Activating your Pro account...</h1>
            <p className="text-sm text-muted-foreground">
              Please wait while we confirm your payment.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-xl font-bold mb-2">Welcome to Pro! 👑</h1>
            <p className="text-sm text-muted-foreground mb-6">{message}</p>
            <Button onClick={() => navigate("/")} className="w-full">
              Go to Dashboard
            </Button>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-xl font-bold mb-2">Payment Received</h1>
            <p className="text-sm text-muted-foreground mb-6">{message}</p>
            <Button onClick={() => navigate("/settings")} variant="outline" className="w-full">
              Go to Settings
            </Button>
          </>
        )}
      </div>
    </div>
  );
}