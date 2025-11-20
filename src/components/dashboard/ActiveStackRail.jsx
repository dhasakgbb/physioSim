import React, { useState, useRef, useEffect } from "react";
import { compoundData } from "../../data/compoundData";
import EsterSelector from "./EsterSelector";
import { useStack } from "../../context/StackContext";

// --- Compact Components ---

const CompactInput = ({ value, onChange, min, max, step, unit }) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startValue = useRef(0);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startValue.current = value;
    document.body.style.cursor = "ew-resize";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const delta = e.clientX - startX.current;
    // Sensitivity: 1px = 1 step
    const change = Math.round(delta / 2) * step;
    let newValue = startValue.current + change;
    newValue = Math.max(min, Math.min(max, newValue));
    onChange(newValue);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.body.style.cursor = "default";
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleInputChange = (e) => {
    const val = Number(e.target.value);
    setLocalValue(val);
  };

  const handleBlur = () => {
    let val = localValue;
    if (isNaN(val)) val = min;
    val = Math.max(min, Math.min(max, val));
    onChange(val);
    setLocalValue(val);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      inputRef.current.blur();
    }
  };

  // Calculate fill percentage for the micro-bar
  const fillPercent = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col w-full group">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="number"
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-physio-bg-core border border-physio-border-subtle rounded px-2 py-1 text-xs font-mono text-right focus:border-physio-accent-primary focus:outline-none transition-colors z-10"
        />
        <span className="absolute left-2 text-[10px] text-physio-text-tertiary pointer-events-none">
          {unit}
        </span>
      </div>
      {/* Micro-scrubber */}
      <div
        className="h-1 w-full bg-physio-bg-highlight mt-0.5 rounded-full overflow-hidden cursor-ew-resize relative"
        onMouseDown={handleMouseDown}
      >
        <div
          className="h-full bg-physio-accent-primary transition-all duration-75"
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
};

const CompactSelect = ({ value, options, onChange, className = "" }) => (
  <div className="relative group">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full appearance-none bg-transparent text-xs font-medium text-physio-text-secondary hover:text-physio-text-primary cursor-pointer focus:outline-none pr-3 ${className}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {/* Tiny chevron */}
    <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-physio-text-tertiary">
      <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
);

// --- Main Row Component ---

const PropertyRow = ({ item, isLast }) => {
  const {
    handleDoseChange,
    handleRemove,
    setInspectedCompound,
    handleEsterChange,
    handleFrequencyChange,
  } = useStack();

  const meta = compoundData[item.compound];
  const isOral = meta.type === "oral";
  const unit = isOral ? "mg/d" : "mg/w";
  const max = isOral ? 150 : 2500;
  const step = isOral ? 5 : 10;

  const selectedEster = item.ester || meta.defaultEster || "enanthate";
  const frequency = item.frequency || 3.5;

  const freqOptions = [
    { label: "ED", value: 1 },
    { label: "EOD", value: 2 },
    { label: "2x/Wk", value: 3.5 },
    { label: "1x/Wk", value: 7 },
  ];

  // Generate ester options based on compound type (simplified for now, ideally from data)
  const esterOptions = meta.esters 
    ? meta.esters.map(e => ({ label: e.charAt(0).toUpperCase() + e.slice(1), value: e }))
    : [{ label: "None", value: "none" }];

  return (
    <div className={`group flex flex-col py-2 px-3 hover:bg-physio-bg-highlight/30 transition-colors ${!isLast ? "border-b border-physio-border-subtle" : ""}`}>
      {/* Top Line: Name & Actions */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 overflow-hidden">
          <div 
            className="w-1.5 h-1.5 rounded-full shrink-0" 
            style={{ backgroundColor: meta.color }}
          />
          <span 
            className="text-xs font-bold text-physio-text-primary truncate cursor-pointer hover:underline"
            onClick={() => setInspectedCompound(item.compound)}
            title="Inspect Compound"
          >
            {meta.name}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <button
            onClick={() => handleRemove(item.compound)}
            className="text-physio-text-tertiary hover:text-physio-accent-critical transition-colors"
            title="Remove"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Middle Line: Controls Grid */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
        {/* Dose Input */}
        <CompactInput
          value={item.dose}
          min={0}
          max={max}
          step={step}
          unit={unit}
          onChange={(val) => handleDoseChange(item.compound, val)}
        />

        {/* Ester Select */}
        {!isOral && (
          <div className="w-16">
             <CompactSelect
              value={selectedEster}
              options={esterOptions}
              onChange={(val) => handleEsterChange(item.compound, val)}
            />
          </div>
        )}

        {/* Frequency Select */}
        <div className="w-12 text-right">
          <CompactSelect
            value={frequency}
            options={freqOptions}
            onChange={(val) => handleFrequencyChange(item.compound, Number(val))}
          />
        </div>
      </div>
    </div>
  );
};

const ActiveStackRail = () => {
  const { stack } = useStack();

  if (stack.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-40">
        <div className="mb-2 text-physio-text-tertiary">
          <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <p className="text-xs text-physio-text-secondary font-medium">No Active Compounds</p>
        <p className="text-[10px] text-physio-text-tertiary mt-1">Drag from dock to add</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-physio-bg-surface min-h-full">
      {/* Header Row for Columns */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2 border-b border-physio-border-subtle bg-physio-bg-surface text-[10px] font-bold text-physio-text-tertiary uppercase tracking-wider">
        <div>Dosage</div>
        <div className="w-16">Ester</div>
        <div className="w-12 text-right">Freq</div>
      </div>

      {/* List */}
      <div className="flex-col">
        {stack.map((item, index) => (
          <PropertyRow 
            key={item.compound} 
            item={item} 
            isLast={index === stack.length - 1} 
          />
        ))}
      </div>
    </div>
  );
};

export default ActiveStackRail;
