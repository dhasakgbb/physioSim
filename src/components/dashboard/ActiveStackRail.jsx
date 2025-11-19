import React from 'react';
import { compoundData } from '../../data/compoundData';
import Slider from '../ui/Slider'; // Reusing your existing component

const StackCard = ({ item, onChange, onRemove }) => {
  const meta = compoundData[item.compound];
  const isOral = meta.type === 'oral';
  const unit = isOral ? 'mg/day' : 'mg/wk';
  const max = isOral ? 100 : 1000;

  return (
    <div className="group relative p-4 bg-physio-bg-core border border-physio-border-subtle rounded-xl transition-all hover:border-physio-accent-primary/30 hover:shadow-neo-sm">
      {/* Color Strip */}
      <div 
        className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full" 
        style={{ backgroundColor: meta.color }} 
      />

      <div className="pl-3">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-sm font-semibold text-physio-text-primary">{meta.name}</h3>
            <p className="text-[10px] text-physio-text-tertiary uppercase tracking-wider">
              {meta.category}
            </p>
          </div>
          <button 
            onClick={onRemove}
            className="text-physio-text-tertiary hover:text-physio-accent-critical transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <Slider
          value={item.dose}
          min={0}
          max={max}
          step={isOral ? 5 : 10}
          unit={unit}
          onChange={onChange}
          className="mb-1"
        />
      </div>
    </div>
  );
};

const ActiveStackRail = ({ stack, onDoseChange, onRemove }) => {
  if (stack.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-physio-border-subtle rounded-xl opacity-50">
        <div className="w-12 h-12 rounded-full bg-physio-bg-surface flex items-center justify-center mb-3">
          <span className="text-2xl">🧪</span>
        </div>
        <p className="text-sm text-physio-text-secondary">Your stack is empty</p>
        <p className="text-xs text-physio-text-tertiary mt-1">Select compounds from the dock below to begin modeling.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stack.map(item => (
        <StackCard 
          key={item.compound}
          item={item}
          onChange={(val) => onDoseChange(item.compound, val)}
          onRemove={() => onRemove(item.compound)}
        />
      ))}
    </div>
  );
};

export default ActiveStackRail;
