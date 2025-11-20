import React, { useState, useRef, useEffect, useMemo } from "react";
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
        className="text-xs font-bold uppercase tracking-wide text-physio-text-primary bg-physio-bg-input px-3 py-1.5 rounded border border-physio-border-strong hover:bg-physio-bg-highlight transition-colors"
      >
        @{currentLabel}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 z-50 bg-physio-bg-highlight border border-physio-border-strong rounded-lg shadow-xl overflow-hidden min-w-[80px]">
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

const PATHWAY_LABELS = {
  ar_genomic: "Genomic",
  non_genomic: "Non-Genomic",
};

const getPathwayLabel = (pathway) => PATHWAY_LABELS[pathway] || "Special Ops";

const CompoundSelector = () => {
  const { handleAddCompound } = useStack();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pulse, setPulse] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const highlightTimeoutRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleHighlight = () => {
      setPulse(true);
      setIsOpen(true);
      requestAnimationFrame(() => inputRef.current?.focus());
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = setTimeout(() => setPulse(false), 1600);
    };

    window.addEventListener("highlight-selector", handleHighlight);
    return () => {
      window.removeEventListener("highlight-selector", handleHighlight);
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const catalog = Object.entries(compoundData)
      .map(([key, data]) => ({
        key,
        name: data.name,
        abbreviation: data.abbreviation,
        type: data.type,
        color: data.color,
        category: data.category,
        pathway: data.pathway,
      }))
      .filter((entry) => {
        if (!normalizedQuery) return true;
        return (
          entry.name.toLowerCase().includes(normalizedQuery) ||
          entry.abbreviation?.toLowerCase().includes(normalizedQuery) ||
          entry.key.toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const groups = [
      { id: "ar_genomic", label: "/// GENOMIC", options: [] },
      { id: "non_genomic", label: "/// NON-GENOMIC", options: [] },
      { id: "other", label: "/// SPECIAL OPS", options: [] },
    ];

    catalog.forEach((entry) => {
      const targetGroup = groups.find((group) => group.id === entry.pathway) || groups[2];
      targetGroup.options.push(entry);
    });

    return groups.filter((group) => group.options.length > 0);
  }, [query]);

  const handleSelect = (compoundKey) => {
    handleAddCompound(compoundKey);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div
      className="relative"
      ref={containerRef}
      data-compound-selector
    >
      <div
        className={`compound-selector flex items-center gap-4 px-4 py-3 rounded-2xl border border-physio-border-strong/60 bg-physio-bg-highlight text-physio-text-primary shadow-[0_12px_24px_rgba(0,0,0,0.45)] transition-all font-sans ${pulse ? "ring-2 ring-physio-accent-primary/60" : "ring-1 ring-transparent"}`}
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        <div className="flex-1 flex flex-col gap-1">
          <span className="text-[9px] font-semibold uppercase tracking-[0.4em] text-physio-text-secondary">
            Start Here
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="// initialize sequence"
            className="w-full bg-transparent text-[10px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.24em] text-physio-text-primary placeholder:text-physio-text-tertiary focus:outline-none font-sans"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-physio-text-secondary">
          <span className="hidden sm:inline font-sans tracking-[0.25em] uppercase text-[10px]">
            Deploy
          </span>
          <span className="w-9 h-9 rounded-full bg-white text-black border border-black/10 flex items-center justify-center text-base font-semibold">
            +
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-3 z-30 bg-physio-bg-highlight border border-physio-border-strong rounded-2xl shadow-[0_35px_80px_rgba(0,0,0,0.75)] backdrop-blur-xl p-3">
          <div className="max-h-80 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
            {filteredGroups.length === 0 && (
              <div className="text-center py-6 text-xs uppercase tracking-[0.3em] text-physio-text-tertiary">
                No match in arsenal
              </div>
            )}

            {filteredGroups.map((group) => (
              <div key={group.id}>
                <div className="group-header sticky top-0 z-10 text-[10px] tracking-[0.35em] text-physio-text-tertiary/80 bg-physio-bg-surface py-1 px-2 border-b border-physio-border-subtle/40 font-sans">
                  {group.label}
                </div>
                <div className="flex flex-col">
                  {group.options.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => handleSelect(option.key)}
                      className="compound-option w-full flex items-center justify-between text-left px-3 py-3 border border-physio-border-subtle/0 border-l-2 border-l-transparent rounded-xl text-sm text-physio-text-primary hover:border-physio-border-strong/40 hover:border-l-physio-accent-primary hover:bg-physio-bg-input/60 transition-all cursor-crosshair font-sans"
                    >
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider font-sans">
                          {option.name}
                        </p>
                        <p className="text-[10px] text-physio-text-tertiary mt-1 font-sans">
                          {getPathwayLabel(option.pathway)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-physio-text-secondary">
                          {option.abbreviation}
                        </span>
                        <span
                          className="w-2 h-8 rounded-full"
                          style={{ backgroundColor: option.color }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
    <div className="group relative p-4 bg-physio-bg-highlight border border-physio-border-subtle rounded-xl transition-all hover:border-physio-accent-primary/30 hover:shadow-neo-sm">
      {/* Color Strip */}
      <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-physio-accent-primary" />

      <div className="pl-3">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-physio-text-primary">
              {meta.name}
            </h4>
            <span
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: meta.color }}
            />

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

const EmptyStackState = () => (
  <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-physio-bg-highlight border border-physio-border-subtle rounded-xl">
    <div className="w-12 h-12 rounded-full bg-physio-bg-surface flex items-center justify-center mb-3 text-lg text-physio-text-secondary">
      <span className="text-2xl">🧪</span>
    </div>
    <p className="text-sm text-physio-text-primary tracking-wide uppercase">No compounds deployed</p>
    <p className="text-xs text-physio-text-secondary mt-2">
      Initialize your stack with the console above.
    </p>
  </div>
);

const ActiveStackRail = () => {
  const { stack } = useStack();

  return (
    <div className="flex flex-col w-full h-full bg-transparent">
      <div className="sticky top-0 z-20 p-4 bg-physio-bg-surface backdrop-blur">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] font-bold text-physio-text-tertiary uppercase tracking-[0.35em]">
              Active Mixture
            </p>
            <p className="text-xs text-physio-text-secondary mt-1">
              Steady-hand injector console
            </p>
          </div>
          <span className="text-[10px] font-mono text-physio-text-tertiary">
            {stack.length.toString().padStart(2, "0")} Slots
          </span>
        </div>
        <CompoundSelector />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {stack.length === 0 ? (
          <EmptyStackState />
        ) : (
          stack.map((item) => <StackCard key={item.compound} item={item} />)
        )}
      </div>
    </div>
  );
};

export default ActiveStackRail;
