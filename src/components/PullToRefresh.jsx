import React, { useRef, useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";

const THRESHOLD = 70;
const MAX_PULL = 100;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const distRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  });

  useEffect(() => {
    const onTouchStart = (e) => {
      if (window.scrollY <= 0 && !refreshingRef.current) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
        distRef.current = 0;
      } else {
        pulling.current = false;
      }
    };

    const onTouchMove = (e) => {
      if (!pulling.current || refreshingRef.current) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0 && window.scrollY <= 0) {
        const eased = Math.min(delta * 0.5, MAX_PULL);
        distRef.current = eased;
        setPullDistance(eased);
      }
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      if (distRef.current >= THRESHOLD) {
        setRefreshing(true);
        refreshingRef.current = true;
        setPullDistance(THRESHOLD);
        try {
          await onRefreshRef.current?.();
        } finally {
          setRefreshing(false);
          refreshingRef.current = false;
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <>
      <div
        className="fixed left-0 right-0 flex items-center justify-center pointer-events-none z-30"
        style={{
          top: "calc(3.5rem + env(safe-area-inset-top))",
          height: pullDistance,
          opacity: progress,
        }}
      >
        {refreshing ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : (
          <RefreshCw
            className="w-5 h-5 text-muted-foreground transition-transform"
            style={{ transform: `rotate(${pullDistance * 3}deg)` }}
          />
        )}
      </div>
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pulling.current ? "none" : "transform 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </>
  );
}