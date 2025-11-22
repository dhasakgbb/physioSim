// ReactiveReceptorGauge.jsx
// Visual "Breathing Ring" that shows Androgen Receptor (AR) load, spillover and upregulation.
// Uses framer-motion for spring‑based animation.

import React, { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * Props:
 *   capacity      – Max AR capacity (mg) before spillover.
 *   load          – Current active dose (mg) adjusted by binding affinity.
 *   adaptationRate – % increase of capacity per week (simulated).
 */
const ReactiveReceptorGauge = ({ capacity, load, adaptationRate }) => {
  // Clamp values
  const sat = Math.min(1, load / capacity);
  const spill = Math.max(0, load - capacity);
  const isOverflow = spill > 0;
  const efficiency = Math.round((Math.min(load, capacity) / load) * 100) || 0;

  // Visual calculations
  const radius = 48; // SVG radius
  const circumference = 2 * Math.PI * radius;
  const strokeDash = sat * circumference;

  // Upregulation – slowly increase radius when overflowing
  const dynamicRadius = useMemo(() => {
    if (!isOverflow) return radius;
    // Simple linear growth based on adaptationRate (per week). Here we just add a small fraction.
    return radius + radius * (adaptationRate / 100) * 0.2;
  }, [isOverflow, adaptationRate]);

  return (
    <div className="flex flex-col items-center justify-center w-48 h-48 relative">
      {/* Spillover mist */}
      {isOverflow && (
        <motion.div
          className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl"
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* SVG ring */}
      <svg viewBox="0 0 120 120" className="transform -rotate-90 w-full h-full">
        {/* Track */}
        <circle
          cx="60"
          cy="60"
          r={dynamicRadius}
          stroke="#333"
          strokeWidth="8"
          fill="none"
        />
        {/* Fill */}
        <motion.circle
          cx="60"
          cy="60"
          r={dynamicRadius}
          stroke="#10B981"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference - strokeDash}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - strokeDash }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
        />
        {/* Ghost ring for future capacity */}
        {isOverflow && (
          <circle
            cx="60"
            cy="60"
            r={dynamicRadius + 4}
            stroke="#10B981"
            strokeWidth="2"
            fill="none"
            opacity="0.3"
            strokeDasharray="4 4"
          />
        )}
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-mono font-bold text-white">{Math.round(sat * 100)}%</span>
        <span className="text-xs uppercase tracking-wider text-gray-400 mt-1">Saturation</span>
        <span className="text-sm mt-1 text-indigo-300">Eff. {efficiency}%</span>
      </div>
    </div>
  );
};

export default ReactiveReceptorGauge;
