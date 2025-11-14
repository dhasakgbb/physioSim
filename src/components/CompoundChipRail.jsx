import React from 'react';
import { compoundData } from '../data/compoundData';

const CompoundChipRail = ({
  compoundType,
  visibleCompounds,
  toggleCompound,
  onHover = () => {},
  highlightedCompound
}) => {
  const compounds = Object.entries(compoundData)
    .filter(([_, data]) => data.type === compoundType)
    .sort((a, b) => (a[1].name || a[0]).localeCompare(b[1].name || b[0]));

  if (!compounds.length) return null;

  return (
    <section className="overflow-x-auto pb-1" aria-label={`${compoundType} compound selector`}>
      <div className="flex gap-2 min-w-max">
        {compounds.map(([key, compound]) => {
          const isActive = visibleCompounds[key];
          const isHighlighted = highlightedCompound === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleCompound(key)}
              onMouseEnter={() => onHover(key)}
              onMouseLeave={() => onHover(null)}
              className={`px-3.5 py-1.5 rounded-full border text-sm font-semibold transition-all duration-150 flex items-center gap-2 ${
                isActive
                  ? 'bg-physio-bg-core/60 border-physio-accent-cyan text-physio-text-primary shadow-md'
                  : 'bg-physio-bg-secondary/70 border-physio-bg-border text-physio-text-tertiary opacity-70'
              } ${isHighlighted ? 'ring-2 ring-physio-accent-cyan/70' : ''}`}
              style={{ boxShadow: isActive ? `0 0 10px ${compound.color}33` : 'none' }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: compound.color }}
              ></span>
              {compound.abbreviation || compound.name || key}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default CompoundChipRail;
