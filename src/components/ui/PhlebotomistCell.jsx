import React from "react";

const PhlebotomistCell = ({
  label,
  value,
  min = 0,
  max = 100,
  safeMax = 80,
  unit = "",
  isCritical = false
}) => {
  // Calculate bar width as percentage of range
  const range = max - min;
  const valuePercent = Math.min(100, Math.max(0, ((value - min) / range) * 100));
  const safeMaxPercent = Math.min(100, Math.max(0, ((safeMax - min) / range) * 100));

  // Determine if value exceeds safe limit
  const isOverSafe = value > safeMax;
  const isDanger = value > max * 0.9 || isCritical; // Danger if in top 10% or explicitly critical
  const barColor = isDanger ? "var(--signal-red)" : isOverSafe ? "var(--signal-orange)" : "white";
  const glowClass = isDanger ? "glow-red" : isOverSafe ? "glow-orange" : "";

  return (
    <div className="w-[140px] h-[70px] bg-physio-bg-surface border border-physio-border-subtle rounded-lg p-3 flex flex-col justify-between">
      {/* Header: Label and Value */}
      <div className="flex justify-between items-center text-xs mb-2">
        <span className="text-physio-text-secondary font-medium truncate">
          {label}
        </span>
        <span className={`font-mono font-bold text-xs ${isDanger ? 'text-physio-accent-critical' : isOverSafe ? 'text-physio-accent-warning' : 'text-physio-text-primary'}`}>
          {typeof value === 'number' ? value.toFixed(value < 10 ? 1 : 0) : value}{unit}
        </span>
      </div>

      {/* Bullet Chart - Thin grey reference bar with white/brighter indicator */}
      <div className="relative w-full h-1.5 bg-physio-bg-input/60 rounded-full overflow-hidden">
        {/* Reference range background (subtle grey) */}
        <div className="absolute inset-0 bg-physio-bg-input/40 rounded-full" />

        {/* Safe limit indicator line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-physio-text-tertiary/60 z-20"
          style={{ left: `${safeMaxPercent}%` }}
        />

        {/* Value indicator bar - white/brighter when normal, colored when dangerous */}
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${glowClass}`}
          style={{
            width: `${valuePercent}%`,
            backgroundColor: barColor,
            boxShadow: isDanger ? '0 0 8px rgba(225, 85, 85, 0.6)' : isOverSafe ? '0 0 6px rgba(243, 160, 65, 0.5)' : 'none',
          }}
        />

        {/* Max danger indicator line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-physio-accent-critical/40 z-10"
          style={{ left: '90%' }}
        />
      </div>

      {/* Status indicator */}
      <div className="flex justify-center mt-1">
        <div className={`w-1.5 h-1.5 rounded-full ${isDanger ? 'bg-physio-accent-critical' : isOverSafe ? 'bg-physio-accent-warning' : 'bg-physio-accent-success'}`} />
      </div>
    </div>
  );
};

export default PhlebotomistCell;
