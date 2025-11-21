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
  accentColor = "#6366f1",
  showValue = true,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);
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
  const safeColor = accentColor || "#6366f1";
  const trackColor = isHigh ? "#f43f5e" : safeColor;

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-end mb-2">
          {label && (
            <label className="text-xs font-semibold text-physio-text-secondary uppercase tracking-wider">
              {label}
            </label>
          )}
          {showValue && (
            <div
              className={`font-mono text-sm font-bold transition-colors ${isHigh ? "text-rose" : "text-primary"}`}
            >
              {localValue}{" "}
              <span className="text-physio-text-tertiary text-xs font-sans font-normal">
                {unit}
              </span>
            </div>
          )}
        </div>
      )}

      <div
        className="relative h-6 flex items-center group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Track Background */}
        <div className="absolute w-full h-0.5 rounded-full overflow-hidden transition-colors bg-white/15">
          {/* Fill */}
          <div
            className="h-full transition-all duration-100"
            style={{
              width: `${percentage}%`,
              backgroundColor: trackColor,
            }}
          />
        </div>

        {/* Markers */}
        {markers.map((marker, idx) => {
          const markerPos = ((marker.value - min) / (max - min)) * 100;
          if (markerPos < 0 || markerPos > 100) return null;

          let colorClass = "bg-physio-text-muted";
          if (marker.tone === "accent") colorClass = "bg-indigo";
          if (marker.tone === "warning")
            colorClass = "bg-emerald";
          if (marker.tone === "error") colorClass = "bg-rose";

          return (
            <div
              key={idx}
              className={`absolute w-1 h-2 ${colorClass} rounded-sm transform -translate-x-1/2 mt-3 transition-opacity ${
                isHovered ? 'opacity-100' : 'opacity-60'
              }`}
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

        {/* Custom Thumb */}
        <div
          className={`absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-150 border border-white/30 ${
            isHovered ? 'w-4 h-4' : 'w-3.5 h-3.5'
          }`}
          style={{
            left: `${percentage}%`,
            top: '50%',
            backgroundColor: trackColor,
            boxShadow: "0 0 6px rgba(0,0,0,0.25)",
          }}
        />
      </div>
    </div>
  );
};

export default Slider;
