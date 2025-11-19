import React, { useState, useRef, useEffect } from 'react';
import { compoundData } from '../../data/compoundData';

const EsterSelector = ({ compoundKey, selectedEster, onChange, color }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  
  const meta = compoundData[compoundKey];
  // If no esters defined or only 1 option, don't show selector
  const esterOptions = meta?.esters ? Object.entries(meta.esters) : [];
  
  if (esterOptions.length <= 1) return null;

  const currentLabel = meta.esters[selectedEster]?.slug || 'Select';

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-physio-bg-surface border border-physio-border-subtle hover:border-physio-border-strong transition-all group"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-physio-text-secondary group-hover:text-physio-text-primary">
          {currentLabel}
        </span>
        <svg 
          className={`w-2.5 h-2.5 text-physio-text-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-32 bg-physio-bg-core/95 backdrop-blur-xl border border-physio-border-strong rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
          {esterOptions.map(([key, details]) => (
            <button
              key={key}
              onClick={() => {
                onChange(key);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-[10px] font-medium transition-colors flex justify-between items-center ${
                selectedEster === key 
                  ? 'bg-physio-bg-highlight text-white' 
                  : 'text-physio-text-secondary hover:bg-physio-bg-surface hover:text-physio-text-primary'
              }`}
            >
              {details.label}
              {selectedEster === key && (
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EsterSelector;
