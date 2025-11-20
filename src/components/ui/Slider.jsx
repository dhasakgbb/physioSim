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

      <div
        className="relative h-8 flex items-center group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Track Background */}
        <div className="absolute w-full h-2 bg-physio-bg-input rounded-full overflow-hidden group-hover:bg-physio-bg-input/80 transition-colors">
          {/* Fill */}
          <div
            className={`h-full transition-all duration-100 ${
              isHigh ? 'bg-physio-accent-critical' : 'bg-physio-accent-primary'
            }`}
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
              className={`absolute w-1 h-2 ${colorClass} rounded-sm transform -translate-x-1/2 mt-4 transition-opacity ${
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

        {/* Custom Thumb (Larger with hover halo) */}
        <div
          className={`absolute rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-200 ${
            isHovered
              ? 'w-6 h-6 shadow-[0_0_0_6px_rgba(59,130,246,0.15),0_6px_20px_rgba(0,0,0,0.3)] scale-110'
              : 'w-5 h-5 shadow-[0_4px_12px_rgba(0,0,0,0.25)]'
          } ${
            isHigh
              ? 'bg-white border-physio-accent-critical'
              : 'bg-white border-physio-accent-primary'
          }`}
          style={{ left: `${percentage}%`, top: '50%' }}
        />
      </div>
    </div>
  );
};

export default Slider;
