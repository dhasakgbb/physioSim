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
          className={`font-mono text-sm font-bold transition-colors ${isHigh ? "text-rose" : "text-primary"}`}
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
        <div className="absolute w-full h-2 rounded-full overflow-hidden transition-colors bg-white/10 group-hover:bg-white/15">
          {/* Fill */}
          <div
            className={`h-full transition-all duration-100 ${
              isHigh ? 'bg-rose' : 'bg-indigo'
            }`}
            style={{ width: `${percentage}%` }}
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

        {/* Custom Thumb (Primary Indigo with glow) */}
        <div
          className={`absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-200 border border-white/20 ${
            isHovered ? 'w-6 h-6 scale-110 shadow-glow-indigo' : 'w-5 h-5'
          } ${
            isHigh ? 'bg-rose' : 'bg-indigo'
          }`}
          style={{ left: `${percentage}%`, top: '50%' }}
        />
      </div>
    </div>
  );
};

export default Slider;
