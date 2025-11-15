import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { compoundData } from '../data/compoundData';

const CompoundChipRail = ({
  compoundType,
  visibleCompounds,
  toggleCompound,
  onHover = () => {},
  highlightedCompound
}) => {
  const buttonRefs = useRef([]);
  const compounds = useMemo(
    () =>
      Object.entries(compoundData)
        .filter(([_, data]) => data.type === compoundType)
        .sort((a, b) => (a[1].name || a[0]).localeCompare(b[1].name || b[0])),
    [compoundType]
  );
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    buttonRefs.current = buttonRefs.current.slice(0, compounds.length);
    setFocusedIndex(prev => Math.min(prev, Math.max(compounds.length - 1, 0)));
  }, [compounds.length]);

  const moveFocus = useCallback(
    (currentIndex, delta) => {
      if (!compounds.length) return;
      const nextIndex = (currentIndex + delta + compounds.length) % compounds.length;
      setFocusedIndex(nextIndex);
      const button = buttonRefs.current[nextIndex];
      button?.focus();
    },
    [compounds.length]
  );

  const focusBoundary = useCallback(
    (position) => {
      if (!compounds.length) return;
      const nextIndex = position === 'start' ? 0 : compounds.length - 1;
      setFocusedIndex(nextIndex);
      buttonRefs.current[nextIndex]?.focus();
    },
    [compounds.length]
  );

  const handleKeyDown = (event, index, key) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      moveFocus(index, 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveFocus(index, -1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusBoundary('start');
    } else if (event.key === 'End') {
      event.preventDefault();
      focusBoundary('end');
    } else if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      toggleCompound(key);
    }
  };

  if (!compounds.length) return null;

  return (
    <section
      className="overflow-x-auto pb-1"
      aria-label={`${compoundType} compound selector`}
    >
      <div className="flex gap-2 min-w-max" role="listbox" aria-multiselectable="true">
        {compounds.map(([key, compound], index) => {
          const isActive = visibleCompounds[key];
          const isHighlighted = highlightedCompound === key;
          const isFocused = focusedIndex === index;
          return (
            <button
              key={key}
              type="button"
              ref={el => {
                buttonRefs.current[index] = el;
              }}
              role="option"
              aria-selected={isActive}
              tabIndex={isFocused ? 0 : -1}
              onClick={() => toggleCompound(key)}
              onMouseEnter={() => {
                onHover(key);
                setFocusedIndex(index);
              }}
              onMouseLeave={() => onHover(null)}
              onFocus={() => setFocusedIndex(index)}
              onKeyDown={event => handleKeyDown(event, index, key)}
              className={`px-3.5 py-1.5 rounded-full border text-sm font-semibold transition-all duration-150 flex items-center gap-2 backdrop-blur-sm ${
                isActive
                  ? 'bg-physio-bg-core/70 border-physio-accent-cyan text-white shadow-[0_0_20px_rgba(75,187,247,0.25)]'
                  : 'bg-physio-bg-secondary/70 border-physio-bg-border/80 text-physio-text-tertiary'
              } ${
                isHighlighted
                  ? 'ring-2 ring-physio-accent-cyan/70'
                  : 'hover:border-physio-accent-cyan/50 hover:text-white hover:shadow-[0_0_16px_rgba(75,187,247,0.18)]'
              } ${isFocused && !isActive ? 'border-physio-text-tertiary/40 text-physio-text-primary' : ''}`}
              style={{ boxShadow: isActive ? `0 0 16px ${compound.color}33` : 'none' }}
              title={compound.name || key}
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
