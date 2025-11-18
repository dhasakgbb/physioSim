import React from 'react';
import { compoundData } from '../data/compoundData';
import { getPlateauDose, getHardMax } from '../utils/interactionEngine';

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
          <div className="flex gap-1">
            <button
              onClick={() => {
                onToggleAll?.('all-on', compounds.map(([key]) => key));
              }}
              className="px-2 py-0.5 text-[10px] font-medium rounded text-physio-accent-mint hover:bg-physio-accent-mint/10 transition-colors"
            >
              All
            </button>
            <div className="w-px h-3 bg-physio-border-subtle self-center mx-1" />
            <button
              onClick={() => {
                onToggleAll?.('all-off', compounds.map(([key]) => key));
              }}
              className="px-2 py-0.5 text-[10px] font-medium rounded text-physio-text-tertiary hover:text-physio-text-primary hover:bg-physio-bg-subtle transition-colors"
            >
              None
            </button>
          </div>
        </div>
        
        <div className="space-y-1">
          {compounds.map(([key, compound]) => {
            const isVisible = visibleCompounds[key];
            const isHovered = highlightedCompound === key;
            const guardrailActive = Boolean(highlightedCompound) && !isHovered;
            const plateauDose = getPlateauDose(compound);
            const hardMax = getHardMax(compound);
            const plateauLabel = plateauDose ? formatDose(plateauDose) : null;
            const hardCapLabel = hardMax ? formatDose(hardMax) : null;
            const unitLabel = unitByType[compound.type] || 'mg';
            const showBadges = isHovered && (plateauLabel || hardCapLabel);
            
            return (
              <div
                key={key}
                className={`group flex flex-col gap-1 p-2 rounded-md transition-all border ${
                  isVisible 
                    ? 'bg-physio-bg-subtle border-physio-border-subtle hover:border-physio-border-active' 
                    : 'bg-transparent border-transparent opacity-60 hover:opacity-100 hover:bg-physio-bg-subtle'
                } ${isHovered ? 'bg-physio-bg-surface border-physio-accent-cyan/30 shadow-sm z-10' : ''} ${guardrailActive ? 'opacity-30 grayscale' : ''}`}
                onMouseEnter={() => onCompoundHover(key)}
                onMouseLeave={() => onCompoundHover(null)}
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleCompound(key)}
                    className="flex items-center flex-1 text-left focus-visible:outline-none"
                  >
                    <div className="relative mr-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-sm transition-all ${isVisible ? 'opacity-100' : 'opacity-50'}`}
                        style={{ backgroundColor: compound.color }}
                      />
                      {!isVisible && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-3 h-px bg-physio-text-tertiary rotate-45" />
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium transition-colors ${
                        isVisible ? 'text-physio-text-primary' : 'text-physio-text-tertiary'
                      } ${isHovered ? 'text-white' : ''}`}
                    >
                      {compound.abbreviation}
                    </span>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMethodologyClick(key);
                    }}
                    className="opacity-0 group-hover:opacity-100 ml-2 text-[10px] font-mono text-physio-text-tertiary hover:text-physio-accent-cyan transition-all px-1.5 py-0.5 rounded hover:bg-physio-accent-cyan/10"
                    title="View methodology"
                  >
                    INFO
                  </button>
                </div>
                {showBadges && (
                  <div className="flex flex-wrap items-center gap-1.5 ml-5.5 mt-1 animate-fade-in">
                    {plateauLabel && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium border border-physio-accent-amber/30 text-physio-accent-amber bg-physio-accent-amber/5">
                        Plateau {plateauLabel}
                      </span>
                    )}
                    {hardCapLabel && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium border border-physio-accent-red/30 text-physio-accent-red bg-physio-accent-red/5">
                        Cap {hardCapLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-physio-bg-core border border-physio-border-subtle rounded-xl p-4 h-full overflow-y-auto">
      {/* Show only relevant compounds based on active tab */}
      {(activeTab === 'injectables' || activeTab === 'interactions' || activeTab === 'stack') && renderCompoundGroup(injectables, "Injectables")}
      {(activeTab === 'orals' || activeTab === 'interactions' || activeTab === 'stack') && renderCompoundGroup(orals, "Orals")}
      
      <div className="mt-6 pt-4 border-t border-physio-border-subtle text-[10px] text-physio-text-tertiary space-y-2">
        <div className="flex items-center">
          <div className="w-6 h-0.5 bg-physio-text-tertiary mr-2" />
          <span>Benefit (Anabolic)</span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-0.5 border-t border-dashed border-physio-text-tertiary mr-2" />
          <span>Risk (Burden)</span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-2 bg-physio-text-tertiary/20 mr-2 rounded-sm" />
          <span>Uncertainty</span>
        </div>
      </div>
    </div>
  );
};

export default CustomLegend;
