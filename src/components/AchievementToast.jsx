import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function AchievementToast({ achievement, onDismiss }) {
  useEffect(() => {
    if (!achievement) return;
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [achievement, onDismiss]);

  const Icon = achievement?.icon;

  return (
    <AnimatePresence>
      {achievement && Icon && (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm"
        >
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 shadow-lg backdrop-blur-xl">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/20 shrink-0">
              <Icon className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
                Achievement Unlocked!
              </p>
              <p className="text-sm font-semibold">{achievement.name}</p>
              <p className="text-xs text-muted-foreground">{achievement.desc}</p>
            </div>
            <button
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}