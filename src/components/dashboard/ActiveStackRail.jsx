import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { compoundData } from "../../data/compoundData";
import Slider from "../ui/Slider";
import { useStack } from "../../context/StackContext";
import { useSimulation } from "../../context/SimulationContext";
import Logo from "../ui/Logo";



const PATHWAY_LABELS = {
  ar_genomic: "Genomic",
  non_genomic: "Non-Genomic",
};

const getPathwayLabel = (pathway) => PATHWAY_LABELS[pathway] || "Special Ops";

const CompoundSelector = ({ isOpen, onClose }) => {
  const { addCompound } = useSimulation();
  const [query, setQuery] = useState("");
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };
    const handleKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKey);
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

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
    addCompound(compoundKey);
    setQuery("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="absolute left-0 top-[96px] z-50 h-[calc(100%-96px)] w-full bg-[#0F1115] border-t border-white/5"
      data-compound-selector
    >
      <div className="h-full overflow-y-auto px-4 py-4">
        <div
          ref={panelRef}
          className="bg-[#13151A] border border-white/10 rounded-2xl shadow-[0_35px_80px_rgba(0,0,0,0.75)] backdrop-blur-xl p-4"
        >
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gray-500">
              Add Compound
            </p>
            <p className="text-xs text-gray-400 mt-1">Search the stack library</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] tracking-[0.3em] text-gray-500">
            <span className="uppercase">⌘K</span>
            <button
              onClick={onClose}
              className="uppercase hover:text-white"
            >
              Close
            </button>
          </div>
        </div>

          <div className="mt-4">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to filter arsenal"
              className="w-full rounded-lg border border-white/10 bg-[#1A1D23] px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-white/40 focus:bg-[#1F232B]"
            />
          </div>

          <div className="max-h-[60vh] overflow-y-auto pr-1 mt-4 space-y-3 scrollbar-hide">
            {filteredGroups.length === 0 && (
              <div className="text-center py-6 text-xs uppercase tracking-[0.3em] text-gray-500">
                No match in arsenal
              </div>
            )}

            {filteredGroups.map((group) => (
              <div key={group.id}>
                <div className="sticky top-0 z-10 text-[10px] tracking-[0.35em] text-gray-500/80 bg-[#13151A] py-1 px-2 border-b border-white/5">
                  {group.label}
                </div>
                <div className="flex flex-col">
                  {group.options.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => handleSelect(option.key)}
                      className="w-full flex items-center justify-between text-left px-3 py-3 border border-transparent rounded-xl text-sm text-white hover:border-white/10 hover:bg-white/5 transition-all"
                    >
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider">
                          {option.name}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">
                          {getPathwayLabel(option.pathway)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-gray-400">
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
      </div>
    </div>
  );
};

const StackCard = ({ item, autoExpand }) => {
  const [isExpanded, setIsExpanded] = useState(Boolean(autoExpand));
  useEffect(() => {
    if (autoExpand) {
      setIsExpanded(true);
    }
  }, [autoExpand]);
  const { setInspectedCompound } = useStack();
  const {
    updateDose,
    removeCompound,
    updateEster,
    updateFrequency,
  } = useSimulation();

  const meta = compoundData[item.compound];
  const isOral = meta.type === "oral";
  const unit = isOral ? "mg/day" : "mg/wk";
  const max = isOral ? 150 : 2500;
  const [doseInput, setDoseInput] = useState(String(item.dose));

  useEffect(() => {
    setDoseInput(String(item.dose));
  }, [item.dose]);

  const commitDoseInput = () => {
    const numeric = Number(doseInput);
    if (!Number.isFinite(numeric)) {
      setDoseInput(String(item.dose));
      return;
    }
    const clamped = Math.max(0, Math.min(max, numeric));
    if (clamped !== item.dose) {
      updateDose(item.compound, clamped);
    }
    setDoseInput(String(clamped));
  };

  const esterOptions = React.useMemo(() => {
    if (!meta.esters) return [];
    if (Array.isArray(meta.esters)) return meta.esters;
    return Object.entries(meta.esters).map(([id, details]) => ({
      id,
      name: details?.name || details?.label || id,
    }));
  }, [meta.esters]);

  const selectedEster = React.useMemo(() => {
    const base = item.ester || meta.defaultEster || esterOptions[0]?.id || "";
    if (!esterOptions.length) return base;
    return esterOptions.some((opt) => opt.id === base) ? base : esterOptions[0].id;
  }, [item.ester, meta.defaultEster, esterOptions]);
  const frequency = item.frequency || 3.5; // Default fallback

  return (
    <div className="border-b border-physio-border-subtle last:border-b-0">
      {/* Compact Row (48px) */}
      <div
        className="flex items-center h-11 w-full min-w-0 gap-2.5 px-3 hover:bg-physio-bg-highlight/30 cursor-pointer transition-colors group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Expand/Collapse Chevron */}
        <button
          className="flex items-center justify-center w-6 h-6 text-physio-text-tertiary hover:text-physio-text-primary transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Color Indicator */}
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: meta.color }}
        />

        {/* Compound Name */}
        <div className="flex-1 min-w-0 flex items-center pr-2">
          <span
            className="text-sm font-medium text-gray-200 truncate"
            title={meta.name || item.compound}
          >
            {meta.name || item.compound}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex shrink-0 items-center gap-1 pr-1 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setInspectedCompound(item.compound);
            }}
            className="flex h-8 w-8 items-center justify-center rounded text-gray-500 hover:bg-white/10 hover:text-white transition-colors"
            title="View compound details"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              removeCompound(item.compound);
            }}
            className="flex h-8 w-8 items-center justify-center rounded text-gray-500 hover:bg-white/10 hover:text-rose-400 transition-all duration-200 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100"
            title="Remove compound"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Controls */}
      {isExpanded && (
        <div className="bg-[#13151A] border-t border-dashed border-white/5 px-3 py-3">
          {/* Controls Row: Ester + Frequency */}
          <div className={`grid gap-3 mb-3 ${esterOptions.length > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
            {esterOptions.length > 0 && (
              <div>
                <p className="text-[9px] text-gray-500 font-bold tracking-wider uppercase mb-2">Ester</p>
                <select
                  value={selectedEster}
                  onChange={(e) => updateEster(item.compound, e.target.value)}
                  className="w-full h-8 px-3 py-1.5 text-sm bg-[#1A1D23] border border-white/10 rounded-lg text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all duration-200"
                >
                  {esterOptions.map((ester) => (
                    <option key={ester.id} value={ester.id}>
                      {ester.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <p className="text-[9px] text-gray-500 font-bold tracking-wider uppercase mb-2">Frequency</p>
              <select
                value={frequency}
                onChange={(e) => updateFrequency(item.compound, parseFloat(e.target.value))}
                className="w-full h-8 px-3 py-1.5 text-sm bg-[#1A1D23] border border-white/10 rounded-lg text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all duration-200"
              >
                <option value={1}>QD</option>
                <option value={1.5}>1.5x/wk</option>
                <option value={2}>EOD</option>
                <option value={3.5}>3.5x/wk</option>
                <option value={7}>Daily</option>
              </select>
            </div>
          </div>

          {/* Dosage Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] text-gray-500 font-bold tracking-wider uppercase">
                {isOral ? "Daily Dosage" : "Weekly Dosage"}
              </p>
              <div className="relative flex items-center w-28">
                <input
                  type="number"
                  value={doseInput}
                  onChange={(e) => setDoseInput(e.target.value)}
                  onBlur={commitDoseInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitDoseInput();
                      e.currentTarget.blur();
                    }
                  }}
                  className="w-full h-8 bg-[#1A1D23] border border-white/10 rounded px-3 py-1.5 text-sm text-white font-mono pr-12 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
                />
                <span className="pointer-events-none absolute right-3 text-[10px] text-gray-500 uppercase tracking-[0.2em] select-none">
                  {unit}
                </span>
              </div>
            </div>
            <Slider
              value={item.dose}
              min={0}
              max={max}
              step={isOral ? 5 : 10}
              unit={unit}
              onChange={(val) => updateDose(item.compound, val)}
              warningThreshold={isOral ? 50 : 800}
              accentColor={meta.color}
              showValue={false}
            />
          </div>
        </div>
      )}
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
  const { compounds } = useSimulation();
  const stack = compounds;
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const prevKeysRef = React.useRef(new Set());
  const hasHydratedRef = React.useRef(false);
  const newlyAddedKeys = React.useMemo(() => {
    const previous = prevKeysRef.current;
    const currentKeys = new Set(stack.map((item) => item.compound));
    const added = new Set();

    if (hasHydratedRef.current) {
      stack.forEach((item) => {
        if (!previous.has(item.compound)) {
          added.add(item.compound);
        }
      });
    }

    prevKeysRef.current = currentKeys;
    hasHydratedRef.current = true;
    return added;
  }, [stack]);

  const openSelector = useCallback(() => setIsSelectorOpen(true), []);
  const closeSelector = useCallback(() => setIsSelectorOpen(false), []);

  useEffect(() => {
    const handleHighlight = () => openSelector();
    if (typeof window !== "undefined") {
      window.addEventListener("highlight-selector", handleHighlight);
      window.addEventListener("open-compound-selector", handleHighlight);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("highlight-selector", handleHighlight);
        window.removeEventListener("open-compound-selector", handleHighlight);
      }
    };
  }, [openSelector]);

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSelector();
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleShortcut);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("keydown", handleShortcut);
      }
    };
  }, [openSelector]);

  return (
    <div className="relative flex flex-col w-full h-full bg-[#0F1115]">
      <div className="sticky top-0 z-20 border-b border-white/5 bg-[#0F1115]">
        <div className="flex items-center justify-between h-12 px-4 border-b border-white/5">
          <div className="scale-90 origin-left">
            <Logo />
          </div>
          <span className="text-[10px] font-mono text-tertiary uppercase tracking-[0.35em]">Beta</span>
        </div>
        <div className="flex items-center justify-between h-12 px-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-tertiary">
              Active Stack
            </span>
            <span className="text-[10px] font-mono text-gray-600">
              {stack.length.toString().padStart(2, "0")}
            </span>
          </div>
          <button
            onClick={openSelector}
            className={`flex items-center justify-center gap-2 h-7 px-3 text-[11px] font-semibold uppercase tracking-widest border rounded-full transition-all ${
              stack.length === 0
                ? "linear-active shadow-glow-indigo"
                : "text-primary bg-element border-white/10 hover:border-white/20"
            }`}
          >
            <span className="text-sm leading-none mb-0.5">+</span>
            Add
          </button>
        </div>
      </div>

      <CompoundSelector isOpen={isSelectorOpen} onClose={closeSelector} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {stack.length === 0 ? (
          <EmptyStackState />
        ) : (
          stack.map((item) => (
            <StackCard
              key={item.compound}
              item={item}
              autoExpand={newlyAddedKeys.has(item.compound)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ActiveStackRail;
