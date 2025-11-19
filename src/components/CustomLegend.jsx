import React from 'react';
import { compoundData } from '../data/compoundData';
import { getPlateauDose, getHardMax } from '../utils/interactionEngine';
import Card from './ui/Card';
import Badge from './ui/Badge';

const unitByType = {
  injectable: 'mg/week',
  oral: 'mg/day'
};

const formatDose = dose => {
  if (dose == null) return null;
  const rounded = Number(dose.toFixed ? dose.toFixed(0) : Math.round(dose));
  return Number.isFinite(rounded) ? rounded.toLocaleString() : null;
};

const CustomLegend = ({
  visibleCompounds,
  toggleCompound,
  onMethodologyClick,
  onToggleAll,
  activeTab,
  onCompoundHover = () => {},
  highlightedCompound = null
}) => {
  // Separate compounds by type
  const injectables = Object.entries(compoundData).filter(([_, compound]) => compound.type === 'injectable');
  const orals = Object.entries(compoundData).filter(([_, compound]) => compound.type === 'oral');
  
  const renderCompoundGroup = (compounds, groupName) => {
    return (
      <div className="mb-6 last:mb-0">
        <div className="flex items-center justify-between mb-3 px-1">
          <h4 className="text-[10px] font-bold text-physio-text-tertiary uppercase tracking-wider">{groupName}</h4>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             {/* Hidden actions for now to keep it clean, can re-enable if needed */}
          </div>
        </div>
        
        <div className="space-y-2">
          {compounds.map(([key, compound]) => {
            const isVisible = visibleCompounds[key];
            const isHovered = highlightedCompound === key;
            const guardrailActive = Boolean(highlightedCompound) && !isHovered;
            const plateauDose = getPlateauDose(compound);
            const hardMax = getHardMax(compound);
            const plateauLabel = plateauDose ? formatDose(plateauDose) : null;
            const hardCapLabel = hardMax ? formatDose(hardMax) : null;
            
            return (
              <button
                key={key}
                onClick={() => toggleCompound(key)}
                onMouseEnter={() => onCompoundHover(key)}
                onMouseLeave={() => onCompoundHover(null)}
                className={`w-full group relative flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                  isVisible 
                    ? 'bg-physio-bg-surface border-physio-border-subtle shadow-sm' 
                    : 'bg-transparent border-transparent opacity-50 hover:opacity-80 hover:bg-physio-bg-surface/50'
                } ${isHovered ? 'ring-1 ring-physio-accent-primary border-physio-accent-primary shadow-neo-glow z-10 scale-[1.02]' : ''} ${guardrailActive ? 'opacity-30 grayscale blur-[1px]' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-3 h-3 rounded-full shadow-sm transition-transform duration-300 ${isVisible ? 'scale-100' : 'scale-75 grayscale'}`}
                    style={{ backgroundColor: compound.color, boxShadow: isVisible ? `0 0 8px ${compound.color}` : 'none' }}
                  />
                  <div className="flex flex-col items-start">
                    <span className={`text-sm font-semibold leading-none ${isVisible ? 'text-physio-text-primary' : 'text-physio-text-secondary'}`}>
                      {compound.abbreviation}
                    </span>
                    <span className="text-[10px] text-physio-text-tertiary font-medium mt-1">
                      {compound.name}
                    </span>
                  </div>
                </div>
                
                {/* Status Indicators */}
                <div className="flex items-center gap-2">
                   {isVisible && (plateauLabel || hardCapLabel) && (
                     <div className={`flex gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                        {plateauLabel && <div className="w-1.5 h-1.5 rounded-full bg-physio-accent-warning" title={`Plateau: ${plateauLabel}`} />}
                        {hardCapLabel && <div className="w-1.5 h-1.5 rounded-full bg-physio-accent-critical" title={`Cap: ${hardCapLabel}`} />}
                     </div>
                   )}
                   
                   {/* Info Icon on Hover */}
                   <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onMethodologyClick(key);
                      }}
                      className={`p-1.5 rounded-full hover:bg-physio-bg-highlight text-physio-text-tertiary hover:text-physio-accent-primary transition-all ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                       <circle cx="12" cy="12" r="10"></circle>
                       <line x1="12" y1="16" x2="12" y2="12"></line>
                       <line x1="12" y1="8" x2="12.01" y2="8"></line>
                     </svg>
                   </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <Card className="h-full overflow-y-auto bg-physio-bg-surface/40 backdrop-blur-md border-l border-physio-border-subtle" noPadding>
      <div className="p-5">
        {/* Show only relevant compounds based on active tab */}
        {(activeTab === 'injectables' || activeTab === 'interactions' || activeTab === 'stack') && renderCompoundGroup(injectables, "Injectables")}
        {(activeTab === 'orals' || activeTab === 'interactions' || activeTab === 'stack') && renderCompoundGroup(orals, "Orals")}
        
        <div className="mt-8 pt-6 border-t border-physio-border-subtle/50">
          <h5 className="text-[10px] font-bold text-physio-text-tertiary uppercase tracking-wider mb-3">Legend</h5>
          <div className="space-y-3 text-[11px] text-physio-text-secondary">
            <div className="flex items-center gap-3">
              <div className="w-8 h-0.5 bg-physio-text-secondary rounded-full" />
              <span>Benefit (Anabolic)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-0.5 border-t-2 border-dashed border-physio-text-secondary/70" />
              <span>Risk (Burden)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-3 bg-physio-text-tertiary/10 rounded-sm border border-physio-text-tertiary/20" />
              <span>Uncertainty Range</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CustomLegend;
