import { useEffect, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function fetchVersionHash() {
  try {
    const res = await fetch(`${window.location.origin}/?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    let hash = 0;
    for (let i = 0; i < html.length; i++) {
      hash = ((hash << 5) - hash + html.charCodeAt(i)) | 0;
    }
    return hash.toString();
  } catch {
    return null;
  }
}

export function useUpdateChecker() {
  const { toast } = useToast();
  const knownHash = useRef(null);
  const dismissed = useRef(false);

  const check = useCallback(
    async (showUpToDate = false) => {
      const hash = await fetchVersionHash();
      if (!hash) return;

      if (knownHash.current === null) {
        knownHash.current = hash;
        return;
      }

      if (hash !== knownHash.current && !dismissed.current) {
        knownHash.current = hash;
        toast({
          title: "New version available",
          description: "A new version of DecibelDash is ready.",
          duration: 15000,
          action: (
            <button
              onClick={() => window.location.reload()}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Reload
            </button>
          ),
          onDismiss: () => {
            dismissed.current = true;
          },
        });
      } else if (showUpToDate) {
        toast({ title: "You're up to date!" });
      }
    },
    [toast]
  );

  useEffect(() => {
    check();
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);
    const interval = setInterval(() => check(), POLL_INTERVAL);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, [check]);

  return { checkForUpdates: () => check(true) };
}