import React, { useState } from "react";
import { compoundData } from "../../data/compoundData";
import { useStack } from "../../context/StackContext";

const CompoundSelector = () => {
  const { handleAddCompound } = useStack();
  const [isOpen, setIsOpen] = useState(false);

  const genomic = Object.entries(compoundData).filter(([, d]) => d.pathway === "ar_genomic");
  const nonGenomic = Object.entries(compoundData).filter(([, d]) => d.pathway === "non_genomic");

  const handleSelect = (key) => {
    handleAddCompound(key);
    setIsOpen(false);
  };

  return (
    <div className="relative mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-physio-bg-surface border border-physio-border-subtle rounded-lg hover:bg-physio-bg-highlight transition-colors text-left"
      >
        <span className="text-sm font-medium text-physio-text-secondary">
          + Add Compound
        </span>
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-physio-bg-surface border border-physio-border-subtle rounded-lg shadow-elevation-3 z-50 max-h-80 overflow-y-auto custom-scrollbar">
          <div className="p-2">
            <div className="text-2xs font-bold text-physio-text-tertiary uppercase tracking-wider px-2 py-1">
              Genomic (Builders)
            </div>
            {genomic.map(([key, data]) => (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                className="w-full flex items-center gap-3 p-2 hover:bg-physio-bg-highlight rounded text-left group"
              >
                <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: data.color }} />
                <div>
                  <div className="text-sm font-bold text-physio-text-primary group-hover:text-physio-accent-primary">
                    {data.name}
                  </div>
                </div>
              </button>
            ))}

            <div className="text-2xs font-bold text-physio-text-tertiary uppercase tracking-wider px-2 py-1 mt-2">
              Non-Genomic (CNS/Metabolic)
            </div>
            {nonGenomic.map(([key, data]) => (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                className="w-full flex items-center gap-3 p-2 hover:bg-physio-bg-highlight rounded text-left group"
              >
                <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: data.color }} />
                <div>
                  <div className="text-sm font-bold text-physio-text-primary group-hover:text-physio-accent-primary">
                    {data.name}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompoundSelector;
