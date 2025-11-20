import React, { useState, useRef, useEffect } from "react";
import { compoundData } from "../../data/compoundData";
import Slider from "../ui/Slider";
import EsterSelector from "./EsterSelector";
import { useStack } from "../../context/StackContext";

const freqOptions = [
  { label: "ED", value: 1 },
  { label: "EOD", value: 2 },
  { label: "2x/Wk", value: 3.5 },
  { label: "1x/Wk", value: 7 },
];

const FrequencySelector = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const currentLabel =
    freqOptions.find((f) => f.value === value)?.label || "Cust";

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="text-xs font-bold uppercase tracking-wide text-physio-accent-primary bg-physio-accent-primary/10 px-3 py-1.5 rounded border border-physio-accent-primary/20 hover:bg-physio-accent-primary/20 transition-colors"
      >
        @{currentLabel}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 z-50 bg-physio-bg-surface border border-physio-border-strong rounded-lg shadow-xl overflow-hidden min-w-[80px]">
          {freqOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={(e) => {
                e.stopPropagation();
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-physio-bg-highlight transition-colors ${value === opt.value ? "text-physio-accent-primary font-bold" : "text-physio-text-secondary"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const StackCard = ({ item }) => {
  const {
    handleDoseChange,
    handleRemove,
    setInspectedCompound,
    handleEsterChange,
    handleFrequencyChange,
  } = useStack();

  const meta = compoundData[item.compound];
  const isOral = meta.type === "oral";
  const unit = isOral ? "mg/day" : "mg/wk";
  const max = isOral ? 150 : 2500;

  // Fallback for compounds without explicit ester config
  const selectedEster = item.ester || meta.defaultEster || "enanthate";
  const frequency = item.frequency || 3.5; // Default fallback

  return (
    <div className="group relative p-4 bg-physio-bg-core border border-physio-border-subtle rounded-xl transition-all hover:border-physio-accent-primary/30 hover:shadow-neo-sm">
      {/* Color Strip */}
      <div
        className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
        style={{ backgroundColor: meta.color }}
      />

      <div className="pl-3">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-physio-text-primary">
              {meta.name}
            </h4>

            {/* Info Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setInspectedCompound(item.compound);
              }}
              className="p-1.5 rounded-full hover:bg-physio-bg-highlight/50 text-physio-text-tertiary hover:text-physio-accent-primary transition-colors"
              title="View compound details"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemove(item.compound);
            }}
            className="p-2 hover:bg-physio-accent-critical/10 rounded-lg text-physio-text-tertiary hover:text-physio-accent-critical transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Controls Row: Ester + Frequency + Category */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <EsterSelector
            compoundKey={item.compound}
            selectedEster={selectedEster}
            color={meta.color}
            onChange={(newEster) => handleEsterChange(item.compound, newEster)}
          />

          {/* NEW Frequency Selector */}
          <FrequencySelector
            value={frequency}
            onChange={(val) => handleFrequencyChange(item.compound, val)}
            color={meta.color}
          />

          {/* Category Badge */}
          <span className="text-[10px] uppercase tracking-wider text-physio-text-tertiary border border-physio-border-subtle px-2 py-1 rounded">
            {meta.category}
          </span>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <Slider
            value={item.dose}
            min={0}
            max={max}
            step={isOral ? 5 : 10}
            unit={unit}
            onChange={(val) => handleDoseChange(item.compound, val)}
            className="mb-1"
            warningThreshold={isOral ? 50 : 800}
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
      <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-physio-border-subtle rounded-xl opacity-50">
        <div className="w-12 h-12 rounded-full bg-physio-bg-surface flex items-center justify-center mb-3">
          <span className="text-2xl">🧪</span>
        </div>
        <p className="text-sm text-physio-text-secondary">
          Your stack is empty
        </p>
        <p className="text-xs text-physio-text-tertiary mt-1">
          Select compounds from the dock below to begin modeling.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stack.map((item) => (
        <StackCard key={item.compound} item={item} />
      ))}
    </div>
  );
};

export default ActiveStackRail;
