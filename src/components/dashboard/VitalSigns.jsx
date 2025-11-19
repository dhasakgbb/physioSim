import React, { useMemo } from 'react';
import Card from '../ui/Card';
import { getAncillaryProtocol } from '../../data/sideFxAndAncillaries';
import { compoundData } from '../../data/compoundData';

// Helper to calculate organ-specific loads from the stack analysis
const calculateOrganLoad = (stack) => {
  // Baseline loads (simplified logic for visualization)
  const loads = { heart: 0, liver: 0, mind: 0, estrogen: 0 };
  
  stack.forEach(item => {
    const meta = compoundData[item.compound];
    if (!meta) return;
    
    // Normalize dose intensity (approximate "high" dose baseline)
    const doseFactor = item.dose / (meta.type === 'oral' ? 50 : 400); 
    
    if (meta.category === 'oral_mass' || meta.category === 'oral_cutting') loads.liver += doseFactor * 2.5;
    if (meta.category === 'oral_extreme') loads.liver += doseFactor * 4.0; // Halo/Superdrol
    
    if (item.compound === 'trenbolone' || item.compound === 'halotestin') loads.mind += doseFactor * 3.0;
    if (item.compound === 'eq' || item.compound === 'testosterone') loads.heart += doseFactor * 1.5; // BP/RBC
    if (item.compound === 'trenbolone') loads.heart += doseFactor * 2.0; // Renal/BP
    
    if (['testosterone', 'dianabol', 'anadrol'].includes(item.compound)) loads.estrogen += doseFactor * 2.0;
  });

  // Cap values for the bars (0-10 scale)
  return {
    heart: Math.min(loads.heart, 10),
    liver: Math.min(loads.liver, 10),
    mind: Math.min(loads.mind, 10),
    estrogen: Math.min(loads.estrogen, 10)
  };
};

const LoadBar = ({ label, value, color }) => (
  <div className="flex items-center gap-3 text-xs font-medium text-physio-text-secondary">
    <span className="w-12 text-right uppercase tracking-wider">{label}</span>
    <div className="flex-1 h-1.5 bg-physio-bg-core rounded-full overflow-hidden border border-physio-border-subtle">
      <div 
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${(value / 10) * 100}%` }}
      />
    </div>
  </div>
);

const VitalSigns = ({ metrics, stack, showScoreOnly = false, showSafetyOnly = false }) => {
  const { totalRisk, netScore, brRatio } = metrics.totals;
  
  // Calculate Ancillaries & Loads
  const ancillaries = useMemo(() => {
    if (!stack || stack.length === 0) return null;
    const formattedStack = stack.map(s => ({
      compound: s.compound,
      dose: s.dose,
      type: compoundData[s.compound]?.type,
      category: compoundData[s.compound]?.category
    }));
    return getAncillaryProtocol(formattedStack);
  }, [stack]);

  const organLoads = useMemo(() => calculateOrganLoad(stack), [stack]);

  const riskLevel = totalRisk > 8 ? 'Critical' : totalRisk > 5 ? 'High' : totalRisk > 3 ? 'Moderate' : 'Low';
  const riskColor = totalRisk > 8 ? 'text-physio-accent-critical' : totalRisk > 5 ? 'text-physio-accent-warning' : 'text-physio-accent-success';

  // Default to showing everything if no specific prop is passed
  const showAll = !showScoreOnly && !showSafetyOnly;

  return (
    <div className="space-y-6">
      
      {/* --- SECTION 1: THE NORTH STAR (SCORE) --- */}
      {(showAll || showScoreOnly) && (
        <Card variant="core" className="shadow-inner relative overflow-hidden p-5">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <span className="text-4xl">⚕️</span>
          </div>
          <p className="text-xs uppercase tracking-widest text-physio-text-tertiary mb-1">Net Efficiency</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-physio-text-primary">{netScore.toFixed(2)}</span>
            <span className="text-xs text-physio-text-secondary">pts</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <div className="flex gap-1">
              <span className="text-physio-text-tertiary">Risk Load:</span>
              <span className={`font-bold ${riskColor}`}>{riskLevel}</span>
            </div>
            <div className="w-px h-3 bg-physio-border-subtle" />
            <div className="flex gap-1">
              <span className="text-physio-text-tertiary">Ratio:</span>
              <span className="font-bold text-physio-text-primary">{brRatio.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      )}

      {/* --- SECTION 2: THE BILL (SAFETY & SUPPORT) --- */}
      {(showAll || showSafetyOnly) && (
        <>
          {/* NEW: Clinical Warnings (The "Doctor's Note") */}
          {metrics.warnings && metrics.warnings.length > 0 && (
            <div className="space-y-2 mb-4">
               <h4 className="text-xs uppercase tracking-widest text-physio-accent-critical font-bold border-b border-physio-accent-critical/30 pb-2 flex items-center gap-2">
                 <span>⚠️ Clinical Contraindications</span>
               </h4>
               {metrics.warnings.map((warn, idx) => (
                 <div key={idx} className={`p-3 rounded-lg border text-xs ${
                   warn.level === 'critical' 
                     ? 'bg-red-950/30 border-red-900/50 text-red-200' 
                     : 'bg-orange-950/30 border-orange-900/50 text-orange-200'
                 }`}>
                   <strong className="block mb-1 uppercase text-xs tracking-wider opacity-80">{warn.type} Warning</strong>
                   {warn.message}
                 </div>
               ))}
            </div>
          )}

          {/* Organ Load Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-physio-text-tertiary font-bold border-b border-physio-border-subtle pb-2">
              Systemic Burden Breakdown
            </h4>
            <div className="space-y-2">
              <LoadBar label="Heart" value={organLoads.heart} color="bg-physio-accent-warning" />
              <LoadBar label="Liver" value={organLoads.liver} color="bg-physio-accent-critical" />
              <LoadBar label="Neuro" value={organLoads.mind} color="bg-physio-accent-secondary" />
              <LoadBar label="Hormonal" value={organLoads.estrogen} color="bg-physio-accent-primary" />
            </div>
          </div>

          {/* Ancillary Checklist */}
          {ancillaries && ancillaries.essential.length > 0 ? (
            <div className="p-4 bg-physio-accent-warning/5 border border-physio-accent-warning/20 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-physio-accent-warning uppercase tracking-wide">
                  Required Support
                </h4>
                <span className="text-xs font-mono text-physio-text-secondary">
                  ${ancillaries.totalWeeklyCost}/wk
                </span>
              </div>
              <ul className="space-y-2">
                {ancillaries.essential.map((med, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-physio-text-secondary">
                    <span className="text-physio-accent-warning mt-0.5">●</span>
                    <span>
                      <span className="font-semibold text-physio-text-primary">{med.drug}</span>
                      <span className="block text-xs text-physio-text-tertiary">{med.dosing}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            // Empty State for Safety
             stack.length > 0 && (
              <div className="p-4 bg-physio-bg-surface border border-physio-border-subtle rounded-xl flex items-center gap-3 opacity-60">
                <div className="w-6 h-6 rounded-full bg-physio-accent-success/10 flex items-center justify-center text-physio-accent-success text-xs">✓</div>
                <p className="text-xs text-physio-text-tertiary">No essential ancillaries triggered.</p>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};

export default VitalSigns;
