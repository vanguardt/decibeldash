import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useOutlet } from "react-router-dom";
import { Mic, List, GitCompare, Trophy, Dices, Layers, Boxes, Settings as SettingsIcon, Sparkles, Clapperboard, ShoppingBag, Crown } from "lucide-react";
import Header from "@/components/Header";
import { useUserBehavior } from "@/hooks/useUserBehavior";
import AchievementToast from "@/components/AchievementToast";

const PATH_TO_FEATURE = {
  "/": "home",
  "/recordings": "recordings",
  "/compare": "compare",
  "/switches": "switches",
  "/builds": "builds",
  "/rankings": "rankings",
  "/roulette": "roulette",
  "/recommend": "recommend",
  "/creator": "creator",
  "/settings": "settings",
  "/marketplace": "marketplace",
  "/pricing": "pricing",
};

const navItems = [
  { path: "/", icon: Mic, label: "Record" },
  { path: "/recordings", icon: List, label: "Library" },
  { path: "/compare", icon: GitCompare, label: "Compare" },
  { path: "/switches", icon: Layers, label: "Switches" },
  { path: "/builds", icon: Boxes, label: "Builds" },
  { path: "/marketplace", icon: ShoppingBag, label: "Shop" },
  { path: "/rankings", icon: Trophy, label: "Ranks" },
  { path: "/roulette", icon: Dices, label: "Roulette" },
  { path: "/recommend", icon: Sparkles, label: "Recommends" },
  { path: "/creator", icon: Clapperboard, label: "Creator" },
  { path: "/pricing", icon: Crown, label: "Pro" },
  { path: "/settings", icon: SettingsIcon, label: "Settings" },
];

const keepAlivePaths = ["/", "/recordings", "/compare", "/switches", "/builds", "/marketplace", "/rankings", "/roulette", "/recommend", "/creator"];

function KeepAliveOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  const [cache, setCache] = useState({});

  useEffect(() => {
    if (keepAlivePaths.includes(location.pathname) && outlet) {
      setCache((prev) =>
        prev[location.pathname] === outlet
          ? prev
          : { ...prev, [location.pathname]: outlet }
      );
    }
  }, [location.pathname, outlet]);

  if (keepAlivePaths.includes(location.pathname)) {
    return (
      <>
        {keepAlivePaths.map((path) => (
          <div
            key={path}
            style={{ display: location.pathname === path ? "block" : "none" }}
          >
            {cache[path] || null}
          </div>
        ))}
      </>
    );
  }

  return outlet;
}

export default function Layout() {
  const { pathname } = useLocation();
  const { trackFeatureVisit, pendingAchievement, dismissAchievement } = useUserBehavior();
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const feature = PATH_TO_FEATURE[pathname];
    if (feature) trackFeatureVisit(feature);
  }, [pathname, trackFeatureVisit]);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
  }, []);

  useEffect(() => {
    // Auto-scroll active item into view
    const el = scrollRef.current;
    if (!el) return;
    const activeLink = el.querySelector('[data-active="true"]');
    if (activeLink) {
      activeLink.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
    setTimeout(updateScrollState, 300);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <AchievementToast achievement={pendingAchievement} onDismiss={dismissAchievement} />
      <Header />
      <main className="flex-1 pb-20">
        <KeepAliveOutlet />
      </main>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-lg mx-auto relative">
          {/* Left fade */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none" />
          )}
          {/* Right fade */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none" />
          )}
          <div
            ref={scrollRef}
            onScroll={updateScrollState}
            className="flex items-center h-16 overflow-x-auto scrollbar-hide"
          >
            {navItems.map(({ path, icon: Icon, label }) => {
              const active = pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  data-active={active}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors shrink-0 ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.5} />
                  <span className="text-[10px] font-medium tracking-wide whitespace-nowrap">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}