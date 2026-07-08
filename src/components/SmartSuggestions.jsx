import React from "react";
import { Link } from "react-router-dom";
import { Flame, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function SmartSuggestions({ suggestions, streak, onQuickRecord }) {
  if (!suggestions.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mb-6 space-y-2"
    >
      {streak > 0 && (
        <div className="flex items-center justify-center gap-1.5 text-xs mb-1">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-muted-foreground">
            <span className="font-bold text-orange-400">{streak}-day</span> streak — keep it going!
          </span>
        </div>
      )}

      {suggestions.map((s) => {
        const Icon = s.icon;
        const isQuickRecord = s.action === "quick_record";

        const inner = (
          <div
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
              isQuickRecord
                ? "bg-primary/10 border-primary/20 hover:bg-primary/15"
                : "bg-card border-border hover:border-muted-foreground/30"
            }`}
          >
            <div
              className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${
                isQuickRecord ? "bg-primary/20" : "bg-muted"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isQuickRecord ? "text-primary" : "text-muted-foreground"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{s.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {s.description}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        );

        if (isQuickRecord) {
          return (
            <button
              key={s.id}
              type="button"
              onClick={onQuickRecord}
              className="w-full text-left"
            >
              {inner}
            </button>
          );
        }

        if (s.path) {
          return (
            <Link key={s.id} to={s.path}>
              {inner}
            </Link>
          );
        }

        return <div key={s.id}>{inner}</div>;
      })}
    </motion.div>
  );
}