import React from 'react';
import { compoundData } from '../../data/compoundData';

const PathwayGroup = ({ label, description, compounds, onSelect, color }) => (
  <div className={`flex flex-col gap-2 p-3 rounded-2xl border ${color} bg-physio-bg-surface/40 backdrop-blur-sm min-w-[200px]`}>
    <div className="mb-1">
      <h4 className="text-xs font-bold text-physio-text-primary uppercase tracking-widest">{label}</h4>
      <p className="text-[9px] text-physio-text-tertiary leading-tight">{description}</p>
    </div>
    <div className="flex flex-wrap gap-2">
      {compounds.map(([key, data]) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className="group relative flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-lg bg-physio-bg-core border border-physio-border-subtle hover:border-physio-accent-primary transition-all hover:shadow-neo-sm"
        >
          <div 
            className="w-2 h-8 rounded-full" 
            style={{ backgroundColor: data.color }} 
          />
          <div className="text-left">
            <span className="block text-[10px] font-bold text-physio-text-primary leading-none">{data.abbreviation}</span>
            <span className="block text-[8px] text-physio-text-tertiary leading-none mt-0.5">{data.type}</span>
          </div>
        </button>
      ))}
    </div>
  </div>
);

const CompoundDock = ({ onAddCompound }) => {
  const genomic = Object.entries(compoundData).filter(([key, data]) => data.pathway === 'ar_genomic');
  const nonGenomic = Object.entries(compoundData).filter(([key, data]) => data.pathway === 'non_genomic');

  return (
    <div className="flex gap-4 items-end pb-2 overflow-x-auto">
      <PathwayGroup 
        label="Genomic AR Agonists" 
        description="Primary tissue builders. High receptor affinity. Diminishing returns if stacked heavily."
        compounds={genomic} 
        onSelect={onAddCompound}
        color="border-emerald-500/20"
      />
      <PathwayGroup 
        label="Non-Genomic / CNS" 
        description="Rapid signaling, CNS drive, & nutrient partitioning. High toxicity load."
        compounds={nonGenomic} 
        onSelect={onAddCompound}
        color="border-amber-500/20"
      />
    </div>
  );
};

export default CompoundDock;
