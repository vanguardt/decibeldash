import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export const FREE_RECORDING_LIMIT = 5;
export const PLATFORM_FEE_PERCENT = 0.25; // 25% platform, 75% creator

export const PREMIUM_FEATURES = {
  advanced_heatmaps: "Advanced Heatmaps",
  acoustic_profile: "Acoustic Profile Analysis",
  smart_recommendations: "Smart Recommendations",
  creator_stats: "Creator Stats Dashboard",
  build_collections: "Build Collections",
  premium_exports: "Premium PNG Exports",
  premium_themes: "Premium Themes",
  unlimited_recordings: "Unlimited Recordings",
};

export function useSubscription() {
  const { user } = useAuth();
  // Start with whatever the auth context already knows — avoids a flash of "free"
  // when the user is actually Pro, especially right after login.
  const [tier, setTier] = useState(user?.subscription_tier || "free");
  const [subType, setSubType] = useState(user?.subscription_type || null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await base44.functions.invoke("getSubscriptionStatus", {});
      setTier(response.data?.subscription_tier || "free");
      setSubType(response.data?.subscription_type || null);
    } catch {
      setTier("free");
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch when the user changes (login/logout) so Pro status is always current
  useEffect(() => {
    if (user?.id) {
      // Optimistically set from auth context while the backend verifies
      setTier(user.subscription_tier || "free");
      setSubType(user.subscription_type || null);
    }
    refresh();
  }, [refresh, user?.id]);

  const isPro = tier === "pro";

  const upgrade = useCallback(async (type) => {
    // type: "monthly" or "lifetime"
    await base44.auth.updateMe({
      subscription_tier: "pro",
      subscription_type: type,
    });
    setTier("pro");
    setSubType(type);
  }, []);

  const redeemCode = useCallback(async (code) => {
    const trimmed = code.trim();
    if (!trimmed) throw new Error("Please enter a code");

    // Backend authenticates via token, validates code, and marks it used
    const response = await base44.functions.invoke("redeemUnlockCode", {
      code: trimmed,
    });
    const data = response.data;
    if (!data || data.success === false || data.error) {
      throw new Error(data?.error || "Invalid code");
    }

    // Update subscription on the user record via the authenticated SDK
    await base44.auth.updateMe({
      subscription_tier: "pro",
      subscription_type: data.tier_type || "lifetime",
    });

    // Refresh from DB to get the authoritative state
    await refresh();
  }, [refresh]);

  const downgrade = useCallback(async () => {
    await base44.auth.updateMe({
      subscription_tier: "free",
      subscription_type: null,
    });
    setTier("free");
    setSubType(null);
  }, []);

  const hasFeature = useCallback(
    (feature) => {
      return isPro;
    },
    [isPro]
  );

  const canRecord = useCallback(
    (recordingCount) => {
      if (isPro) return true;
      return recordingCount < FREE_RECORDING_LIMIT;
    },
    [isPro]
  );

  return {
    tier,
    subType,
    isPro,
    loading,
    refresh,
    upgrade,
    redeemCode,
    downgrade,
    hasFeature,
    canRecord,
    freeLimit: FREE_RECORDING_LIMIT,
    platformFeePercent: PLATFORM_FEE_PERCENT,
  };
}