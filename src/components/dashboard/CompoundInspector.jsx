import React from 'react';
import { compoundData } from '../../data/compoundData';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const BiomarkerRow = ({ label, value }) => {
  // -3 to +3 scale
  const percentage = (value / 3) * 100; // Can be negative
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;
  
  let color = 'bg-physio-text-tertiary';
  if (isPositive) color = 'bg-physio-accent-success'; // e.g. IGF-1 boost
  if (isNegative) color = 'bg-physio-accent-primary'; // e.g. SHBG suppression (good) or Cortisol suppression
  
  // Contextual coloring based on specific biomarkers could be more nuanced, 
  // but for now we stick to a consistent visual language.
  // Actually, let's make "Bad" things red if they are typically bad.
  // But "Impact" is neutral. Let's stick to the vector direction.
  
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-24 text-physio-text-secondary uppercase tracking-wider text-[10px]">{label}</span>
      <div className="flex-1 h-6 bg-physio-bg-core rounded flex items-center relative px-2">
        {/* Center Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-physio-border-subtle" />
        
        {/* Bar */}
        {!isNeutral && (
          <div 
            className={`h-2 rounded-full absolute ${color} opacity-80`}
            style={{
              left: isPositive ? '50%' : 'auto',
              right: isNegative ? '50%' : 'auto',
              width: `${Math.abs(percentage) / 2}%` // Divide by 2 because it's from center
            }}
          />
        )}
        
        {/* Value Label */}
        <span className={`relative z-10 w-full text-center font-mono text-[10px] ${isNeutral ? 'text-physio-text-tertiary' : 'text-physio-text-primary'}`}>
          {value > 0 ? `+${value}` : value}
        </span>
      </div>
    </div>
  );
};

const CompoundInspector = ({ compoundKey, onClose }) => {
  const data = compoundData[compoundKey];

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-physio-bg-surface border border-physio-border-strong rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-physio-border-subtle flex items-start justify-between sticky top-0 bg-physio-bg-surface/95 backdrop-blur z-10">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg"
              style={{ backgroundColor: data.color }}
            >
              {data.abbreviation}
            </div>
            <div>
              <h2 className="text-xl font-bold text-physio-text-primary">{data.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="neutral" size="sm">{data.type}</Badge>
                <Badge variant="info" size="sm">{data.category}</Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>✕</Button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* 1. Clinical Clearance & Pharmacology */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-physio-text-tertiary uppercase tracking-widest border-b border-physio-border-subtle pb-2">
                Clinical Data
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-physio-bg-core rounded-lg border border-physio-border-subtle">
                  <span className="block text-[10px] text-physio-text-tertiary uppercase">Half-Life</span>
                  <span className="text-lg font-mono text-physio-text-primary">{data.halfLife || 'N/A'}</span>
                </div>
                <div className="p-3 bg-physio-bg-core rounded-lg border border-physio-border-subtle">
                  <span className="block text-[10px] text-physio-text-tertiary uppercase">Binding Affinity</span>
                  <span className="text-lg font-mono text-physio-text-primary capitalize">{data.bindingAffinity || 'N/A'}</span>
                </div>
              </div>
              <div className="p-3 bg-physio-bg-core rounded-lg border border-physio-border-subtle">
                <span className="block text-[10px] text-physio-text-tertiary uppercase">Pathway</span>
                <span className="text-sm font-medium text-physio-text-primary">
                  {data.pathway === 'ar_genomic' ? 'Genomic AR Agonist' : 'Non-Genomic / CNS Signaling'}
                </span>
              </div>
            </div>

            {/* 2. Biomarker Impact Vector */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-physio-text-tertiary uppercase tracking-widest border-b border-physio-border-subtle pb-2">
                Endocrine Impact
              </h3>
              <div className="space-y-2">
                {data.biomarkers ? (
                  Object.entries(data.biomarkers).map(([key, val]) => (
                    <BiomarkerRow key={key} label={key.replace('_', ' ')} value={val} />
                  ))
                ) : (
                  <p className="text-xs text-physio-text-tertiary italic">No biomarker data available.</p>
                )}
              </div>
            </div>
          </div>

          {/* 3. Methodology / Description */}
          <div className="space-y-4">
             <h3 className="text-xs font-bold text-physio-text-tertiary uppercase tracking-widest border-b border-physio-border-subtle pb-2">
                Mechanism of Action
              </h3>
              <div className="p-4 bg-physio-bg-highlight/10 rounded-xl border border-physio-border-subtle text-sm text-physio-text-secondary leading-relaxed">
                <p className="mb-2"><strong className="text-physio-text-primary">Summary:</strong> {data.methodology?.summary}</p>
                <p className="mb-2"><strong className="text-physio-text-primary">Benefit:</strong> {data.methodology?.benefitRationale}</p>
                <p><strong className="text-physio-text-primary">Risk:</strong> {data.methodology?.riskRationale}</p>
              </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-physio-border-subtle bg-physio-bg-core flex justify-end">
          <Button variant="primary" onClick={onClose}>Close Inspector</Button>
        </div>

      </div>
    </div>
  );
};

export default CompoundInspector;
