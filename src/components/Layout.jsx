import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useOutlet } from "react-router-dom";
import { Mic, List, GitCompare, Trophy, Dices, Settings as SettingsIcon } from "lucide-react";
import Header from "@/components/Header";

const navItems = [
  { path: "/", icon: Mic, label: "Record" },
  { path: "/recordings", icon: List, label: "Library" },
  { path: "/compare", icon: GitCompare, label: "Compare" },
  { path: "/rankings", icon: Trophy, label: "Ranks" },
  { path: "/roulette", icon: Dices, label: "Roulette" },
  { path: "/settings", icon: SettingsIcon, label: "Settings" },
];

const keepAlivePaths = ["/", "/recordings", "/compare", "/rankings", "/roulette"];

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pb-20">
        <KeepAliveOutlet />
      </main>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-around h-16">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[10px] font-medium tracking-wide">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}