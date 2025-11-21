import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const THEMES = {
  hepatic: {
    border: "border-red-500/20",
    bg: "bg-red-500/5",
    text: "text-red-400",
    icon: "text-red-500",
    button: "border-red-500/30 hover:bg-red-500/10 text-red-300",
    label: "Hepatotoxicity Critical",
    sub: "AST/ALT levels indicate severe stress.",
  },
  renal: {
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    icon: "text-amber-500",
    button: "border-amber-500/30 hover:bg-amber-500/10 text-amber-300",
    label: "Renal Stress Detected",
    sub: "eGFR/Creatinine levels unsafe.",
  },
};

const HealthInsightBanner = ({ insight, onAction, isLoading }) => {
  if (!insight) return null;

  const type = insight.id === "renal" ? "renal" : "hepatic";
  const theme = THEMES[type];
  const actionLabel = insight.actionLabel || "Apply Fix";
  const label = insight.title || theme.label;
  const subtitle = insight.subtitle || theme.sub;

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={type}
        initial={{ opacity: 0, height: 0, y: -10 }}
        animate={{ opacity: 1, height: "auto", y: 0 }}
        exit={{ opacity: 0, height: 0, y: -10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="sticky top-0 z-20 mb-3"
      >
        <div
          className={`w-full px-3 py-2.5 rounded-md border ${theme.border} ${theme.bg} flex items-center justify-between gap-3`}
        >
          <div className="flex items-center gap-3">
            <div className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${theme.icon} bg-current`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${theme.icon} bg-current`}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
              <span
                className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${theme.text}`}
              >
                {label}
              </span>
              <span className="text-xs text-zinc-500 font-medium">
                {subtitle}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onAction?.(insight)}
            disabled={isLoading}
            className={`h-6 px-3 text-[10px] font-bold uppercase tracking-wider rounded border flex items-center gap-2 transition-colors duration-200 ${theme.button} ${isLoading ? "opacity-70 cursor-wait" : ""}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Applying...</span>
              </>
            ) : (
              <>
                <span>{actionLabel}</span>
                <span className="opacity-50 text-[9px] font-mono border border-current px-1 rounded-sm">
                  ↵
                </span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HealthInsightBanner;
