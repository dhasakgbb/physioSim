import React, { useState, useMemo, useRef, useEffect } from 'react';
import { compoundData } from '../data/compoundData';
import { calculateStackSynergy } from '../data/interactionMatrix';
import { getAncillaryProtocol } from '../data/sideFxAndAncillaries';
import { evaluateCompoundResponse } from '../utils/interactionEngine';
import { goalPresets } from '../data/interactionEngineData';
import { scoreStack } from '../utils/stackOptimizer';
import { defaultProfile } from '../utils/personalization';
import PDFExport from './PDFExport';

const OrientationBar = ({ items, tone = 'default' }) => {
  const toneClasses = tone === 'accent'
    ? 'bg-physio-bg-tertiary/90 border-physio-accent-cyan/40'
    : 'bg-physio-bg-core/95 border-physio-bg-border';

  return (
    <div className="sticky top-4 z-30">
      <div className={`${toneClasses} rounded-2xl px-4 py-2 flex flex-wrap items-center gap-4 text-[11px] tracking-wide uppercase text-physio-text-tertiary shadow-physio-subtle`}>
        {items.map(({ label, value }, index) => (
          <div key={`${label}-${index}`} className="flex items-center gap-2">
            <span>{label}</span>
            <span className="text-physio-text-primary text-sm font-semibold normal-case">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Stack Builder Component
 * Interactive tool for building compound stacks with metrics and ancillary calculations
 */
const StackBuilder = ({ prefillStack, userProfile, initialGoalPreset = 'lean_mass' }) => {
  const [stack, setStack] = useState([]);
  const [selectedCompound, setSelectedCompound] = useState('');
  const [dose, setDose] = useState('');
  const [goalPreset, setGoalPreset] = useState(initialGoalPreset);
  const stackRef = useRef(null);
  const compoundSelectId = 'stack-builder-compound';
  const doseInputId = 'stack-builder-dose';
  const goalSelectId = 'stack-builder-goal';

  useEffect(() => {
    if (!prefillStack || !prefillStack.compounds?.length) return;
    setStack(prefillStack.compounds.map(item => ({
      compound: item.compound,
      dose: item.dose
    })));
  }, [prefillStack]);
  
  // Calculate stack metrics
  const stackMetrics = useMemo(() => {
    if (stack.length === 0) {
      return {
        totalBenefit: 0,
        totalRisk: 0,
        benefitRiskRatio: 0,
        benefitSynergy: 0,
        riskSynergy: 0,
        benefitSynergyDelta: 0,
        riskSynergyDelta: 0,
        adjustedBenefit: 0,
        adjustedRisk: 0,
        adjustedRatio: 0,
        goalScore: 0
      };
    }
    const profile = userProfile || defaultProfile;
    
    // Calculate base scores
    let totalBenefit = 0;
    let totalRisk = 0;
    
    stack.forEach(item => {
      totalBenefit += evaluateCompoundResponse(item.compound, 'benefit', item.dose, profile);
      totalRisk += evaluateCompoundResponse(item.compound, 'risk', item.dose, profile);
    });
    
    const synergy = calculateStackSynergy(stack, { profile });
    const benefitDelta = synergy.benefitSynergy || 0;
    const riskDelta = synergy.riskSynergy || 0;
    const benefitSynergyRatio = totalBenefit > 0 ? benefitDelta / totalBenefit : 0;
    const riskSynergyRatio = totalRisk > 0 ? riskDelta / totalRisk : 0;
    
    const adjustedBenefit = totalBenefit + benefitDelta;
    const adjustedRisk = totalRisk + riskDelta;
    
    const benefitRiskRatio = totalRisk > 0 ? totalBenefit / totalRisk : totalBenefit;
    const presetScore = scoreStack(adjustedBenefit, adjustedRisk, goalPreset);
    const adjustedRatio = presetScore.ratio;
    
    return {
      totalBenefit: totalBenefit.toFixed(2),
      totalRisk: totalRisk.toFixed(2),
      benefitRiskRatio: benefitRiskRatio.toFixed(2),
      benefitSynergy: benefitSynergyRatio.toFixed(4),
      riskSynergy: riskSynergyRatio.toFixed(4),
      benefitSynergyDelta: benefitDelta.toFixed(2),
      riskSynergyDelta: riskDelta.toFixed(2),
      adjustedBenefit: adjustedBenefit.toFixed(2),
      adjustedRisk: adjustedRisk.toFixed(2),
      adjustedRatio: adjustedRatio.toFixed(2),
      goalScore: presetScore.score.toFixed(2)
    };
  }, [stack, userProfile, goalPreset]);
  
  // Calculate ancillary protocol
  const ancillaryProtocol = useMemo(() => {
    if (stack.length === 0) return null;
    
    // Build protocol input from stack
    const stackWithTypes = stack.map(item => ({
      compound: item.compound,
      dose: item.dose,
      type: compoundData[item.compound].type,
      category: compoundData[item.compound].category
    }));
    
    return getAncillaryProtocol(stackWithTypes);
  }, [stack]);
  
  // Add compound to stack
  const handleAddCompound = () => {
    if (!selectedCompound || !dose) return;
    
    const doseNum = parseFloat(dose);
    if (isNaN(doseNum) || doseNum <= 0) return;
    
    // Check if compound already in stack
    if (stack.some(item => item.compound === selectedCompound)) {
      alert('Compound already in stack. Remove it first to change dosage.');
      return;
    }
    
    setStack([...stack, {
      compound: selectedCompound,
      dose: doseNum
    }]);
    
    setSelectedCompound('');
    setDose('');
  };
  
  // Remove compound from stack
  const handleRemoveCompound = (compoundKey) => {
    setStack(stack.filter(item => item.compound !== compoundKey));
  };
  
  // Update dose for compound
  const handleUpdateDose = (compoundKey, newDose) => {
    const doseNum = parseFloat(newDose);
    if (isNaN(doseNum) || doseNum < 0) return;
    
    setStack(stack.map(item =>
      item.compound === compoundKey ? { ...item, dose: doseNum } : item
    ));
  };
  
  // Get available compounds (not in stack)
  const availableCompounds = Object.keys(compoundData).filter(
    key => !stack.some(item => item.compound === key)
  );
  
  // Separate injectables and orals
  const injectables = availableCompounds.filter(key => compoundData[key].type === 'injectable');
  const orals = availableCompounds.filter(key => compoundData[key].type === 'oral');
  const goalLabel = goalPresets[goalPreset]?.label || 'Custom goal';
  const hasStack = stack.length > 0;

  const builderOrientationItems = [
    { label: 'Goal', value: goalLabel },
    { label: 'Compounds', value: hasStack ? stack.length : 0 },
    { label: 'Final ratio', value: hasStack ? stackMetrics.adjustedRatio : '—' },
    { label: 'Goal score', value: hasStack ? stackMetrics.goalScore : '—' }
  ];

  const ancillaryOrientationItems = ancillaryProtocol
    ? [
        {
          label: 'Ancillaries',
          value: `${ancillaryProtocol.essential.length} essential • ${ancillaryProtocol.recommended.length} recommended`
        },
        {
          label: 'Weekly cost',
          value: `$${ancillaryProtocol.totalWeeklyCost.toFixed(2)}`
        },
        {
          label: 'Monitoring',
          value: `${ancillaryProtocol.monitoring.length} labs`
        }
      ]
    : [];
  
  return (
    <div className="w-full space-y-8">
      <div className="space-y-6">
        <OrientationBar items={builderOrientationItems} />

        {/* Add Compound Section */}
        <div className="bg-physio-bg-secondary p-6 rounded-lg shadow-sm border border-physio-bg-border">
          <h2 className="text-2xl font-bold mb-4 text-physio-text-primary">Build Your Stack</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-physio-text-secondary mb-2" htmlFor={compoundSelectId}>
                Select Compound
              </label>
              <select
                id={compoundSelectId}
                value={selectedCompound}
                onChange={(e) => setSelectedCompound(e.target.value)}
                className="w-full px-3 py-2 bg-physio-bg-tertiary text-physio-text-primary border border-physio-bg-border rounded-md focus:outline-none focus:ring-2 focus:ring-physio-accent-cyan transition-standard"
              >
                <option value="">-- Choose Compound --</option>
                <optgroup label="Injectable Compounds">
                  {injectables.map(key => (
                    <option key={key} value={key}>
                      {compoundData[key].name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Oral Compounds">
                  {orals.map(key => (
                    <option key={key} value={key}>
                      {compoundData[key].name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-physio-text-secondary mb-2" htmlFor={doseInputId}>
                Dose ({selectedCompound && compoundData[selectedCompound]?.type === 'oral' ? 'mg/day' : 'mg/week'})
              </label>
              <input
                type="number"
                id={doseInputId}
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="Enter dose"
                className="w-full px-3 py-2 bg-physio-bg-tertiary text-physio-text-primary border border-physio-bg-border rounded-md focus:outline-none focus:ring-2 focus:ring-physio-accent-cyan transition-standard"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleAddCompound}
                disabled={!selectedCompound || !dose}
                className="w-full px-4 py-2 bg-physio-accent-cyan text-white rounded-md hover:bg-physio-accent-cyan disabled:bg-physio-bg-border disabled:cursor-not-allowed transition-colors"
              >
                Add to Stack
              </button>
            </div>
          </div>
        </div>
        
        {/* Current Stack */}
        <div className="bg-physio-bg-secondary p-6 rounded-lg shadow-sm border border-physio-bg-border">
          <h3 className="text-xl font-semibold mb-4 text-physio-text-primary">Current Stack</h3>
          
          {stack.length === 0 ? (
            <p className="text-physio-text-tertiary text-center py-8">No compounds in stack. Add compounds above to get started.</p>
          ) : (
            <div className="space-y-3">
              {stack.map(item => {
                const compound = compoundData[item.compound];
                return (
                  <div
                    key={item.compound}
                    className="flex items-center justify-between p-4 bg-physio-bg-core rounded-lg border border-physio-bg-border"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: compound.color }}
                      ></div>
                      <div className="flex-1">
                        <div className="font-semibold text-physio-text-primary">{compound.name}</div>
                        <div className="text-sm text-physio-text-tertiary">
                          {compound.type === 'oral' ? 'Oral' : 'Injectable'} • {compound.abbreviation}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.dose}
                          onChange={(e) => handleUpdateDose(item.compound, e.target.value)}
                          className="w-24 px-2 py-1 border border-physio-bg-border rounded text-sm"
                        />
                        <span className="text-sm text-physio-text-secondary">
                          {compound.type === 'oral' ? 'mg/day' : 'mg/wk'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveCompound(item.compound)}
                      className="ml-4 px-3 py-1 bg-physio-error text-physio-bg-core rounded hover:bg-physio-error/80 transition-standard text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Stack Metrics */}
        {stack.length > 0 && (
          <div className="bg-physio-bg-secondary p-6 rounded-lg shadow-sm border border-physio-bg-border">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <h3 className="text-xl font-semibold text-physio-text-primary">Stack Metrics</h3>
              <label htmlFor={goalSelectId} className="text-sm text-physio-text-secondary flex flex-col md:flex-row md:items-center gap-2">
                Goal preset
                <select
                  id={goalSelectId}
                  value={goalPreset}
                  onChange={e => setGoalPreset(e.target.value)}
                  className="px-3 py-1.5 bg-physio-bg-tertiary border border-physio-bg-border rounded-md text-physio-text-primary"
                >
                  {Object.entries(goalPresets).map(([key, preset]) => (
                    <option key={key} value={key}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Base Metrics */}
            <div className="space-y-3">
              <h4 className="font-semibold text-physio-text-secondary mb-2">Base Scores (Without Synergy)</h4>
              <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
                <span className="text-physio-text-secondary">Total Benefit:</span>
                <span className="font-semibold text-physio-accent-mint text-lg">{stackMetrics.totalBenefit}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
                <span className="text-physio-text-secondary">Total Risk:</span>
                <span className="font-semibold text-physio-error text-lg">{stackMetrics.totalRisk}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
                <span className="text-physio-text-secondary">Benefit:Risk Ratio:</span>
                <span className="font-semibold text-physio-accent-cyan text-lg">{stackMetrics.benefitRiskRatio}</span>
              </div>
            </div>
            
            {/* Synergy-Adjusted Metrics */}
            <div className="space-y-3">
              <h4 className="font-semibold text-physio-text-secondary mb-2">Synergy-Adjusted Scores</h4>
              <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
                <span className="text-physio-text-secondary">Benefit Synergy:</span>
                <span className={`font-semibold text-lg ${parseFloat(stackMetrics.benefitSynergy) >= 0 ? 'text-physio-accent-mint' : 'text-physio-error'}`}>
                  {parseFloat(stackMetrics.benefitSynergy) >= 0 ? '+' : ''}{(parseFloat(stackMetrics.benefitSynergy) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
                <span className="text-physio-text-secondary">Risk Synergy:</span>
                <span className={`font-semibold text-lg ${parseFloat(stackMetrics.riskSynergy) <= 0 ? 'text-physio-accent-mint' : 'text-physio-error'}`}>
                  {parseFloat(stackMetrics.riskSynergy) >= 0 ? '+' : ''}{(parseFloat(stackMetrics.riskSynergy) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="bg-physio-bg-tertiary p-3 rounded mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-physio-text-secondary font-medium">Adjusted Benefit:</span>
                  <span className="font-bold text-physio-accent-mint">{stackMetrics.adjustedBenefit}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-physio-text-secondary font-medium">Adjusted Risk:</span>
                  <span className="font-bold text-physio-error">{stackMetrics.adjustedRisk}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-physio-accent-cyan">
                  <span className="text-physio-text-secondary font-medium">Final Ratio:</span>
                  <span className="font-bold text-physio-accent-cyan text-lg">{stackMetrics.adjustedRatio}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-physio-bg-tertiary rounded-lg border border-physio-bg-border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-physio-text-secondary">Net goal score</p>
                <p className="text-xs text-physio-text-tertiary">
                  Weighted by {goalPresets[goalPreset]?.label || 'selected goal'} preference curve
                </p>
              </div>
              <span className={`text-2xl font-bold ${parseFloat(stackMetrics.goalScore) >= 0 ? 'text-physio-accent-cyan' : 'text-physio-error'}`}>
                {stackMetrics.goalScore}
              </span>
            </div>
          </div>
          
          {/* Interpretation */}
          <div className="mt-4 p-4 bg-physio-warning/10 rounded-lg border border-physio-warning/40">
            <p className="text-sm text-physio-text-secondary">
              <strong>Interpretation:</strong> Higher benefit:risk ratios indicate more efficient stacks. 
              Positive benefit synergy = compounds amplify each other's benefits. 
              Positive risk synergy = compounds compound each other's risks. 
              Aim for positive benefit synergy and low/negative risk synergy.
            </p>
          </div>
          
          {/* Export Stack Report */}
          <div className="mt-6 flex justify-end">
          <PDFExport 
            chartRef={stackRef}
            stackData={{
              compounds: stack.map(item => ({
                id: item.compound,
                  dose: item.dose
                })),
                totalBenefit: parseFloat(stackMetrics.totalBenefit),
                totalRisk: parseFloat(stackMetrics.totalRisk),
                benefitSynergy: parseFloat(stackMetrics.benefitSynergyDelta),
                riskSynergy: parseFloat(stackMetrics.riskSynergyDelta),
                benefitSynergyPercent: parseFloat(stackMetrics.benefitSynergy) * 100,
                riskSynergyPercent: parseFloat(stackMetrics.riskSynergy) * 100,
                ancillaryProtocol: ancillaryProtocol ? [
                  ...ancillaryProtocol.essential.map(item => ({
                    name: item.drug,
                    category: 'Essential',
                    reason: item.purpose,
                    dosing: item.dosing,
                    weeklyCost: item.cost
                  })),
                  ...ancillaryProtocol.recommended.map(item => ({
                    name: item.drug,
                    category: 'Recommended',
                    reason: item.purpose,
                    dosing: item.dosing,
                    weeklyCost: item.cost
                  })),
                  ...ancillaryProtocol.optional.map(item => ({
                    name: item.drug,
                    category: 'Optional',
                    reason: item.purpose,
                    dosing: item.dosing,
                    weeklyCost: item.cost
                  }))
                ] : []
            }}
            includeInteractions={true}
            contextSummary={{
              title: 'Stack Orientation',
              items: [
                { label: 'Goal preset', value: goalPresets[goalPreset]?.label || 'Selected goal' },
                { label: 'Compounds', value: stack.length },
                { label: 'Adjusted ratio', value: stackMetrics.adjustedRatio },
                { label: 'Goal score', value: stackMetrics.goalScore }
              ]
            }}
          />
        </div>
        </div>
      )}
      </div>
      
      {/* Ancillary Protocol */}
      {ancillaryProtocol && (
        <div className="space-y-4">
          <OrientationBar items={ancillaryOrientationItems} tone="accent" />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.9fr)]">
            <div className="bg-physio-bg-secondary p-6 rounded-lg shadow-sm border border-physio-bg-border space-y-6">
              <h3 className="text-xl font-semibold text-physio-text-primary">Required Ancillary Protocol</h3>
              
              {ancillaryProtocol.essential.length > 0 && (
                <div>
                  <h4 className="font-semibold text-physio-error mb-3 flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    Essential (Non-Negotiable)
                  </h4>
                  <div className="space-y-3">
                    {ancillaryProtocol.essential.map((item, idx) => (
                      <div key={idx} className="p-4 bg-physio-bg-tertiary rounded-lg border-2 border-physio-error">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-physio-text-primary">{item.drug}</span>
                          <span className="text-sm text-physio-text-secondary">${item.cost}/week</span>
                        </div>
                        <div className="text-sm text-physio-text-secondary space-y-1">
                          <div><strong>Dosing:</strong> {item.dosing}</div>
                          <div><strong>Purpose:</strong> {item.purpose}</div>
                          {item.timing && <div><strong>Timing:</strong> {item.timing}</div>}
                          {item.note && <div className="text-physio-error mt-2"><strong>Note:</strong> {item.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {ancillaryProtocol.recommended.length > 0 && (
                <div>
                  <h4 className="font-semibold text-physio-accent-cyan mb-3">Strongly Recommended</h4>
                  <div className="space-y-3">
                    {ancillaryProtocol.recommended.map((item, idx) => (
                      <div key={idx} className="p-4 bg-physio-bg-tertiary rounded-lg border border-physio-accent-cyan">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-physio-text-primary">{item.drug}</span>
                          <span className="text-sm text-physio-text-secondary">${item.cost}/week</span>
                        </div>
                        <div className="text-sm text-physio-text-secondary space-y-1">
                          <div><strong>Dosing:</strong> {item.dosing}</div>
                          <div><strong>Purpose:</strong> {item.purpose}</div>
                          {item.timing && <div><strong>Timing:</strong> {item.timing}</div>}
                          {item.note && <div className="text-physio-accent-cyan mt-2"><strong>Note:</strong> {item.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {ancillaryProtocol.optional.length > 0 && (
                <div>
                  <h4 className="font-semibold text-physio-accent-mint mb-3">Optional (Context-Dependent)</h4>
                  <div className="space-y-3">
                    {ancillaryProtocol.optional.map((item, idx) => (
                      <div key={idx} className="p-4 bg-physio-bg-tertiary rounded-lg border border-physio-accent-mint">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-physio-text-primary">{item.drug}</span>
                          <span className="text-sm text-physio-text-secondary">${item.cost}/week</span>
                        </div>
                        <div className="text-sm text-physio-text-secondary space-y-1">
                          <div><strong>Dosing:</strong> {item.dosing}</div>
                          <div><strong>Purpose:</strong> {item.purpose}</div>
                          {item.timing && <div><strong>Timing:</strong> {item.timing}</div>}
                          {item.note && <div className="text-physio-accent-mint mt-2"><strong>Note:</strong> {item.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 lg:sticky lg:top-4">
              <div className="p-4 bg-physio-bg-tertiary rounded-lg border border-physio-bg-border">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-physio-text-primary text-lg">Weekly Ancillary Cost</span>
                  <span className="font-bold text-physio-text-primary text-xl">${ancillaryProtocol.totalWeeklyCost.toFixed(2)}</span>
                </div>
                <p className="text-sm text-physio-text-secondary mt-2">
                  Estimated weekly spend across essential + recommended support. Actual costs vary by source/brand.
                </p>
              </div>

              {ancillaryProtocol.monitoring.length > 0 && (
                <div className="p-4 bg-physio-bg-tertiary rounded-lg border-2 border-physio-accent-violet space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-physio-accent-violet">Monitoring Requirements</h4>
                    <span className="text-xs text-physio-text-tertiary">
                      {ancillaryProtocol.monitoring.length} labs
                    </span>
                  </div>
                  <div className="space-y-3">
                    {ancillaryProtocol.monitoring.map((item, idx) => (
                      <div key={idx} className="text-sm text-physio-text-secondary border border-physio-bg-border rounded-lg p-3 bg-physio-bg-core">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-physio-text-primary">{item.test}</span>
                          <span className="text-xs text-physio-accent-violet font-medium">{item.frequency}</span>
                        </div>
                        <div className="space-y-1">
                          <div><strong>Targets:</strong> {item.targets}</div>
                          <div><strong>Action if abnormal:</strong> {item.action}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StackBuilder;
