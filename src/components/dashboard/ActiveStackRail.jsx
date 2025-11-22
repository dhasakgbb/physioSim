import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { COMPOUNDS as compoundData } from "../../data/compounds";
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
        name: data.metadata.name,
        abbreviation: data.metadata.abbreviation,
        type: data.metadata.classification,
        color: data.metadata.color,
        category: data.metadata.family,
        // Map pathway from PD data
        pathway: data.pd.receptorInteractions.AR.activityType === 'FullAgonist' ? 'ar_genomic' : 'non_genomic',
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
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white tracking-wide">Add Compound</p>
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
                      <div className="flex items-center min-w-0 pr-3">
                        <div
                          className="w-2 h-2 rounded-full mr-3 flex-shrink-0"
                          style={{ backgroundColor: option.color }}
                        />
                        <div className="flex flex-col min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {option.name}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-1">
                            {getPathwayLabel(option.pathway)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-gray-400">
                          {option.abbreviation}
                        </span>
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

const NAME_MAP = {
  "Oral Turinabol": "Turinabol",
  "Nandrolone Phenylpropionate": "NPP",
};

const getDisplayName = (name) => NAME_MAP[name] || name;

const StackCard = ({ item }) => {
  const isExpanded = Boolean(item.isOpen);
  const { setInspectedCompound } = useStack();
  const {
    updateDose,
    removeCompound,
    updateEster,
    updateFrequency,
    setCompoundOpen,
  } = useSimulation();

  const meta = compoundData[item.compound];
  const isOral = meta.metadata.administrationRoutes.includes("Oral");
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
    if (!meta.pk.esters) return [];
    // esters is now an object in new schema, not array
    return Object.entries(meta.pk.esters).map(([id, details]) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1), // Simple capitalization
    }));
  }, [meta.pk.esters]);

  const selectedEster = React.useMemo(() => {
    const base = item.ester || esterOptions[0]?.id || "";
    if (!esterOptions.length) return base;
    return esterOptions.some((opt) => opt.id === base) ? base : esterOptions[0].id;
  }, [item.ester, esterOptions]);
  const frequency = item.frequency || 3.5; // Default fallback
  const unitLabel = unit.toUpperCase();
  const displayDose = Math.round(item.dose || 0);
  const displayName = getDisplayName(meta.metadata.name || item.compound);

  const toggleExpanded = () => {
    setCompoundOpen(item.compound, !isExpanded);
  };

  return (
    <div className="border-b border-physio-border-subtle last:border-b-0">
      {/* Compact Row (48px) */}
      <div
        className="flex items-center h-11 w-full min-w-0 gap-2.5 px-3 hover:bg-physio-bg-highlight/30 cursor-pointer transition-colors group"
        onClick={toggleExpanded}
      >
        {/* Expand/Collapse Chevron */}
        <button
          className="flex items-center justify-center w-6 h-6 text-physio-text-tertiary hover:text-physio-text-primary transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            toggleExpanded();
          }}
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
          style={{ backgroundColor: meta.metadata.color }}
        />

        {/* Compound Name */}
        <div className="flex-1 min-w-0 flex items-center pr-2">
          <span
            className="text-sm font-medium text-gray-200 truncate"
            title={meta.metadata.name || item.compound}
          >
            {meta.metadata.name || item.compound}
          </span>
        </div>

        <div className="flex items-baseline gap-1 font-mono text-sm text-gray-100 shrink-0">
          <span>{displayDose}</span>
          <span className="text-[10px] uppercase tracking-[0.25em] text-white/40">
            {unitLabel}
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
        <div className="px-3 py-3">
          <div className="group relative flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="h-2 w-2 rounded-full shadow-[0_0_6px_rgba(0,0,0,0.6)]"
                  style={{ backgroundColor: meta.metadata.color }}
                />
                <span className="text-sm font-medium text-white/90 truncate">
                  {displayName}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCompoundOpen(item.compound, true);
                    setInspectedCompound(item.compound);
                  }}
                  className="rounded p-1 text-white/30 hover:bg-white/10 hover:text-white"
                  title="View compound details"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCompound(item.compound);
                  }}
                  className="rounded p-1 text-white/30 hover:bg-rose-500/20 hover:text-rose-300"
                  title="Remove compound"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className={`grid gap-2 ${esterOptions.length > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
              {esterOptions.length > 0 && (
                <div className="relative">
                  <label className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/30 mb-1 block">Ester</label>
                  <select
                    value={selectedEster}
                    onChange={(e) => updateEster(item.compound, e.target.value)}
                    className="w-full appearance-none rounded-lg border border-white/5 bg-white/[0.03] py-1.5 pl-2 pr-6 text-[11px] font-medium text-white/80 outline-none transition-colors hover:bg-white/[0.06] hover:border-white/10 focus:border-white/20"
                  >
                    {esterOptions.map((ester) => (
                      <option key={ester.id} value={ester.id} className="bg-[#0F1115]">
                        {ester.name}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-2 top-[34px] h-3 w-3 text-white/30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}

              <div className="relative">
                <label className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/30 mb-1 block">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => updateFrequency(item.compound, parseFloat(e.target.value))}
                  className="w-full appearance-none rounded-lg border border-white/5 bg-white/[0.03] py-1.5 pl-2 pr-6 text-[11px] font-medium text-white/80 outline-none transition-colors hover:bg-white/[0.06] hover:border-white/10 focus:border-white/20"
                >
                  <option value={7}>Daily</option>
                  <option value={3}>3x / week</option>
                  <option value={2}>2x / week</option>
                  <option value={1}>1x / week</option>
                </select>
                <svg
                  className="pointer-events-none absolute right-2 top-[34px] h-3 w-3 text-white/30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Dosage */}
            <div className="space-y-2 pt-1">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/30">
                  Dosage
                </span>
                <div className="flex items-baseline gap-1">
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
                    className="w-16 bg-transparent text-right font-mono text-sm font-medium text-white outline-none focus:text-emerald-400"
                  />
                  <span className="text-[9px] font-medium text-white/40">{unitLabel}</span>
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
                accentColor={meta.metadata.color}
                showValue={false}
                className="pt-1"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyStackState = () => (
  <div className="h-full w-full flex flex-col items-center justify-center text-center p-8">
    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
      <span className="text-3xl">🧪</span>
    </div>
    <p className="text-base font-semibold text-white tracking-wide uppercase mb-2">No Compounds Deployed</p>
    <p className="text-sm text-gray-400 max-w-[200px]">
      Initialize your stack with the console above.
    </p>
  </div>
);

const ActiveStackRail = () => {
  const { compounds } = useSimulation();
  const stack = compounds;
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const listRef = useRef(null);
  const prevLengthRef = useRef(0);

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

  useEffect(() => {
    if (stack.length > prevLengthRef.current) {
      requestAnimationFrame(() => {
        if (listRef.current) {
          listRef.current.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      });
    }
    prevLengthRef.current = stack.length;
  }, [stack.length]);

  return (
    <div className="relative flex flex-col h-full bg-[#0F1115] border-r border-white/5 flex-shrink-0">
      <div className="sticky top-0 z-20 border-b border-white/5 bg-[#0F1115]">
        <div className="flex items-center justify-between h-12 px-4 border-b border-white/5">
          <div className="scale-90 origin-left">
            <Logo />
          </div>
          <span className="text-[10px] font-mono text-tertiary uppercase tracking-[0.35em]">Beta</span>
        </div>
        <div className="flex items-center justify-between h-11 px-4">
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

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-3 pt-3 pb-4 space-y-3 scrollbar-hide"
      >
        {stack.length === 0 ? (
          <EmptyStackState />
        ) : (
          stack.map((item) => (
            <StackCard
              key={item.compound}
              item={item}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ActiveStackRail;
