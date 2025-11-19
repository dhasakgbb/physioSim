import React from 'react';
import { compoundData } from '../../data/compoundData';
import Slider from '../ui/Slider';
import Button from '../ui/Button';

const StackCard = ({ item, onUpdateDose, onRemove }) => {
  const compound = compoundData[item.compoundId];
  
  if (!compound) return null;

  return (
    <div className="bg-physio-bg-surface border border-physio-border-subtle rounded-xl p-3 relative overflow-hidden group transition-all hover:border-physio-border-strong">
      {/* Colored Stripe */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: compound.color }}
      />

      <div className="pl-3 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-physio-text-primary leading-none">{compound.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-physio-text-tertiary uppercase tracking-wider">{compound.type}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-physio-bg-core border border-physio-border-subtle text-physio-text-secondary font-mono">
                HL: {compound.halfLife}
              </span>
            </div>
          </div>
          <button 
            onClick={() => onRemove(item.id)}
            className="text-physio-text-tertiary hover:text-physio-accent-critical transition-colors p-1 rounded-md hover:bg-physio-bg-core"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Controls */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-physio-text-secondary font-mono">Dose</span>
            <span className="text-physio-text-primary font-bold font-mono">{item.dose} mg</span>
          </div>
          <Slider
            value={[item.dose]}
            min={0}
            max={1500}
            step={10}
            onValueChange={(val) => onUpdateDose(item.id, val[0])}
            className="py-2"
          />
        </div>
      </div>
    </div>
  );
};

export default StackCard;
