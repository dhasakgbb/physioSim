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
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-physio-text-secondary uppercase tracking-wide">{groupName}</h4>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onToggleAll?.('all-on', compounds.map(([key]) => key));
              }}
              className="px-2 py-0.5 text-xs bg-physio-success/20 text-physio-success rounded hover:bg-physio-success/30 transition-standard border border-physio-success/40"
            >
              All ON
            </button>
            <button
              onClick={() => {
                onToggleAll?.('all-off', compounds.map(([key]) => key));
              }}
              className="px-2 py-0.5 text-xs bg-physio-error/20 text-physio-error rounded hover:bg-physio-error/30 transition-standard border border-physio-error/40"
            >
              All OFF
            </button>
          </div>
        </div>
        
        <div className="space-y-1">
          {compounds.map(([key, compound]) => {
            const isVisible = visibleCompounds[key];
            const provenance = compound.evidenceProvenance || { human: 0, animal: 0, aggregate: 0 };
            const tooltip = `${compound.name} • Confidence ${compound.modelConfidence?.toFixed?.(2) ?? 'n/a'} • Citations H:${provenance.human} A:${provenance.animal} Agg:${provenance.aggregate}`;
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
                className={`flex flex-col gap-1 p-1.5 rounded transition-all ${
                  isVisible ? 'hover:bg-physio-bg-secondary' : 'opacity-50'
                } ${guardrailActive ? 'opacity-40' : ''}`}
                title={tooltip}
                onMouseEnter={() => onCompoundHover(key)}
                onMouseLeave={() => onCompoundHover(null)}
              >
                <div className="flex items-center">
                  <button
                    onClick={() => toggleCompound(key)}
                    className="flex items-center flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-physio-accent-cyan/60 rounded"
                    onFocus={() => onCompoundHover(key)}
                    onBlur={() => onCompoundHover(null)}
                  >
                    <div
                      className={`w-3 h-3 rounded mr-2 flex-shrink-0 ${isHovered ? 'ring-2 ring-offset-1 ring-physio-accent-cyan/70 ring-offset-physio-bg-core' : ''}`}
                      style={{ backgroundColor: compound.color }}
                    />
                    <span
                      className={`text-sm ${
                        isVisible ? 'text-physio-text-primary' : 'line-through text-physio-text-tertiary'
                      } ${isHovered ? 'font-semibold text-physio-accent-cyan' : ''}`}
                    >
                      {compound.abbreviation}
                    </span>
                  </button>
                  
                  <button
                    onClick={() => onMethodologyClick(key)}
                    className="ml-2 px-2 py-0.5 text-xs text-physio-accent-cyan hover:text-physio-accent-cyan hover:underline transition-colors flex-shrink-0"
                    title="View methodology"
                  >
                    ⓘ
                  </button>
                </div>
                {showBadges && (
                  <div className="flex flex-wrap items-center gap-2 ml-5">
                    {plateauLabel && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border border-physio-warning/40 text-physio-warning bg-physio-warning/5">
                        Plateau {plateauLabel} {unitLabel}
                      </span>
                    )}
                    {hardCapLabel && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border border-physio-error/40 text-physio-error bg-physio-error/5">
                        Evidence cap {hardCapLabel} {unitLabel}
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
    <div className="bg-physio-bg-core p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-bold text-physio-text-primary mb-4">
        Legend
      </h3>
      
      {/* Show only relevant compounds based on active tab */}
      {(activeTab === 'injectables' || activeTab === 'interactions' || activeTab === 'stack') && renderCompoundGroup(injectables, "Injectables")}
      {(activeTab === 'orals' || activeTab === 'interactions' || activeTab === 'stack') && renderCompoundGroup(orals, "Orals")}
      
      <div className="mt-4 pt-4 border-t border-physio-bg-border text-xs text-physio-text-secondary">
        <div className="mb-2 font-semibold">Legend:</div>
        <div className="space-y-1">
          <div className="flex items-center">
            <div className="w-8 h-0.5 bg-physio-text-secondary mr-2" />
            <span>Solid line = Benefit</span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-0.5 border-t-2 border-dashed border-physio-text-secondary mr-2" />
            <span>Dotted line = Risk</span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-3 bg-physio-text-secondary opacity-30 mr-2" />
            <span>Shaded band = Uncertainty (wider = less confidence)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomLegend;
