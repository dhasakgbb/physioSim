import React, { useState, useRef, useEffect } from "react";
import { compoundData } from "../../data/compoundData";

const EsterSelector = ({ compoundKey, selectedEster, onChange, color }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const meta = compoundData[compoundKey];
  // If no esters defined or only 1 option, don't show selector
  const esterOptions = meta?.esters 
    ? Object.entries(meta.esters).sort((a, b) => {
        const labelA = a[1].label || a[1].shortLabel || a[1].slug || a[0];
        const labelB = b[1].label || b[1].shortLabel || b[1].slug || b[0];
        return labelA.localeCompare(labelB);
      })
    : [];

  if (esterOptions.length <= 1) return null;

  const esterMeta = meta?.esters?.[selectedEster];
  const currentLabel = esterMeta?.label || esterMeta?.shortLabel || esterMeta?.slug || "Select";

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
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-physio-bg-surface border border-physio-border-subtle hover:border-physio-border-strong transition-all group min-w-[10rem] max-w-[14rem]"
      >
        <span
          className="flex-1 truncate text-left text-xs font-bold uppercase tracking-wider text-physio-text-secondary group-hover:text-physio-text-primary"
          title={currentLabel}
        >
          {currentLabel}
        </span>
        <svg
          className={`w-3 h-3 text-physio-text-tertiary transition-transform ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-48 bg-physio-bg-core/95 backdrop-blur-xl border border-physio-border-strong rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
          {esterOptions.map(([key, details]) => (
            <button
              key={key}
              onClick={() => {
                onChange(key);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors flex justify-between items-center ${
                selectedEster === key
                  ? "bg-physio-bg-highlight text-white"
                  : "text-physio-text-secondary hover:bg-physio-bg-surface hover:text-physio-text-primary"
              }`}
            >
              {details.label}
              {selectedEster === key && (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EsterSelector;
