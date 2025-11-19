import React, { useState, useEffect, useRef } from "react";

const Slider = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  unit,
  className = "",
  markers = [],
  warningThreshold = null,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newValue = Number(e.target.value);
    setLocalValue(newValue);
    onChange(newValue);
  };

  const percentage = ((localValue - min) / (max - min)) * 100;
  const isHigh = warningThreshold !== null && localValue >= warningThreshold;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-end mb-2">
        {label && (
          <label className="text-xs font-semibold text-physio-text-secondary uppercase tracking-wider">
            {label}
          </label>
        )}
        <div
          className={`font-mono text-sm font-bold transition-colors ${isHigh ? "text-physio-accent-critical" : "text-physio-text-primary"}`}
        >
          {localValue}{" "}
          <span className="text-physio-text-tertiary text-xs font-sans font-normal">
            {unit}
          </span>
        </div>
      </div>

      <div className="relative h-6 flex items-center">
        {/* Track Background */}
        <div className="absolute w-full h-1 bg-physio-bg-highlight rounded-full overflow-hidden">
          {/* Fill */}
          <div
            className="h-full bg-gradient-to-r from-physio-accent-primary to-physio-accent-secondary transition-all duration-100"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Markers */}
        {markers.map((marker, idx) => {
          const markerPos = ((marker.value - min) / (max - min)) * 100;
          if (markerPos < 0 || markerPos > 100) return null;

          let colorClass = "bg-physio-text-muted";
          if (marker.tone === "accent") colorClass = "bg-physio-accent-primary";
          if (marker.tone === "warning")
            colorClass = "bg-physio-accent-warning";
          if (marker.tone === "error") colorClass = "bg-physio-accent-critical";

          return (
            <div
              key={idx}
              className={`absolute w-1 h-2 ${colorClass} rounded-sm transform -translate-x-1/2 mt-3`}
              style={{ left: `${markerPos}%`, top: "50%" }}
              title={`${marker.label}: ${marker.value}`}
            />
          );
        })}

        {/* Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleChange}
          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
        />

        {/* Custom Thumb (Visual Only - follows percentage) */}
        <div
          className="absolute w-4 h-4 bg-physio-bg-core border-2 border-physio-accent-primary rounded-full shadow-neo-glow transform -translate-x-1/2 pointer-events-none transition-all duration-100"
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default Slider;
