import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  interactionPairs,
  interactionHeatmapModes,
  interactionDimensions,
  defaultSensitivities,
  stackOptimizerCombos
} from '../data/interactionEngineData';
import { heatmapScores } from '../data/interactionMatrix';
import {
  computeHeatmapValue,
  evaluatePairDimension,
  generatePrimaryCurveSeries,
  buildSurfaceData
} from '../utils/interactionEngine';
import { evaluateStack } from '../utils/stackEngine';
import { generateStackOptimizerResults, generateCustomStackResults } from '../utils/stackOptimizer';
import { compoundData } from '../data/compoundData';
import { defaultProfile } from '../utils/personalization';
import { readJSONStorage, writeJSONStorage, removeStorageKey } from '../utils/storage';
import { INTERACTION_CONTROL_STORAGE_KEY, HEATMAP_FOCUS_PIN_KEY } from '../utils/storageKeys';
import { deriveDoseWindow } from '../utils/doseWindows';
import DoseSlider from './DoseSlider';
import InteractionSummaryCard from './interactions/InteractionSummaryCard';
import InteractionDoseSliders from './interactions/InteractionDoseSliders';
import InteractionAnalyticsDeck from './interactions/InteractionAnalyticsDeck';

const uniqueCompounds = Array.from(new Set(Object.values(interactionPairs).flatMap(pair => pair.compounds)));

const heatmapColorScale = (value, maxValue, mode) => {
  if (maxValue === 0) return '#e5e7eb';
  const normalized = Math.min(value / maxValue, 1);
  if (mode === 'benefit') {
    return `rgba(14,165,233,${0.2 + normalized * 0.8})`; // physio-accent-cyan
  }
  if (mode === 'risk') {
    return `rgba(248,113,113,${0.2 + normalized * 0.8})`; // physio-error
  }
  return `rgba(168,85,247,${0.2 + normalized * 0.8})`; // physio-accent-violet
};

const defaultHeatmapControls = {
  heatmapMode: 'benefit',
  evidenceBlend: 0.35
};

const describeEvidenceMix = blend => {
  const clinicalShare = Math.round((1 - blend) * 100);
  const anecdoteShare = 100 - clinicalShare;
  return `${clinicalShare}% clinical · ${anecdoteShare}% anecdotal`;
};

const matrixViewOptions = [
  { key: 'leanBack', label: 'Lean-back' },
  { key: 'leanIn', label: 'Lean-in' }
];

const getLeanBackGlyph = (value) => {
  if (value >= 0.35) return '++';
  if (value >= 0.15) return '+';
  if (value <= -0.35) return '⚠';
  if (value <= -0.15) return '—';
  return '·';
};

const getLeanBackPalette = (value) => {
  if (value >= 0.35) return 'bg-physio-accent-mint/20 text-physio-accent-mint border-physio-accent-mint/40';
  if (value >= 0.15) return 'bg-physio-accent-cyan/20 text-physio-accent-cyan border-physio-accent-cyan/40';
  if (value <= -0.35) return 'bg-physio-error/20 text-physio-error border-physio-error/40';
  if (value <= -0.15) return 'bg-physio-warning/20 text-physio-warning border-physio-warning/40';
  return 'bg-physio-bg-core text-physio-text-tertiary border-physio-bg-border';
};

const InteractionHeatmap = ({
  userProfile,
  onPrefillStack,
  resetSignal = 0,
  onFiltersDirtyChange
}) => {
  const pairIds = Object.keys(interactionPairs);
  const [selectedPairId, setSelectedPairId] = useState(pairIds[0]);
  const [heatmapMode, setHeatmapMode] = useState(defaultHeatmapControls.heatmapMode);
  const [focusPinned, setFocusPinned] = useState(false);
  const [sensitivities, setSensitivities] = useState(() => ({ ...defaultSensitivities }));
  const [evidenceBlend, setEvidenceBlend] = useState(defaultHeatmapControls.evidenceBlend);
  
  // Custom Optimizer State
  const [customSelection, setCustomSelection] = useState('');
  const [customCompounds, setCustomCompounds] = useState([]);
  const [customRanges, setCustomRanges] = useState({});
  const [customResults, setCustomResults] = useState([]);
  
  // UI State
  const [optimizerCollapsed, setOptimizerCollapsed] = useState(false);
  const [heatmapCompact, setHeatmapCompact] = useState(false);
  const [matrixViewMode, setMatrixViewMode] = useState('leanBack');
  
  const pairDetailRef = useRef(null);
  const heatmapRef = useRef(null);

  const allCompoundKeys = useMemo(() => Object.keys(compoundData), []);

  // Scroll handler for compact mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      if (!pairDetailRef.current) return;
      const rect = pairDetailRef.current.getBoundingClientRect();
      setHeatmapCompact(rect.top < 180);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToMatrix = () => {
    if (typeof window === 'undefined' || !heatmapRef.current) return;
    const top = heatmapRef.current.offsetTop - 24;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const selectedPair = interactionPairs[selectedPairId];
  
  // Dimension Logic
  const dimensionKeys = useMemo(() => {
    const keys = new Set();
    Object.keys(selectedPair?.synergy || {}).forEach(k => keys.add(k));
    Object.keys(selectedPair?.penalties || {}).forEach(k => keys.add(k));
    return Array.from(keys);
  }, [selectedPair]);

  const [selectedDimension, setSelectedDimension] = useState(selectedPair?.defaultDimension || dimensionKeys[0] || null);
  const [primaryCompound, setPrimaryCompound] = useState(selectedPair?.compounds[0]);
  const [doses, setDoses] = useState(() => ({ ...selectedPair?.defaultDoses }));

  // Handle Pair Change
  const handlePairChange = (pairId) => {
    setSelectedPairId(pairId);
    const pair = interactionPairs[pairId];
    const keys = new Set();
    Object.keys(pair.synergy || {}).forEach(k => keys.add(k));
    Object.keys(pair.penalties || {}).forEach(k => keys.add(k));
    const nextDimension = pair.defaultDimension || Array.from(keys)[0];
    
    setSelectedDimension(nextDimension);
    setPrimaryCompound(pair.compounds[0]);
    setDoses({ ...pair.defaultDoses });
    
    // Auto-scroll to detail view
    if (pairDetailRef.current) {
      setTimeout(() => {
        pairDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // Dose Helpers
  const updateDose = (compoundKey, value) => {
    setDoses(prev => ({
      ...prev,
      [compoundKey]: Number(value)
    }));
  };

  const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);

  // Calculations
  const dimensionResult = useMemo(() => {
    if (!selectedPair || !selectedDimension) return null;
    return evaluatePairDimension({
      pairId: selectedPairId,
      dimensionKey: selectedDimension,
      doses,
      profile: userProfile,
      sensitivities,
      evidenceBlend
    });
  }, [selectedPairId, selectedDimension, doses, userProfile, sensitivities, evidenceBlend, selectedPair]);

  const chartData = useMemo(() => {
    if (!selectedPair || !selectedDimension) return [];
    return generatePrimaryCurveSeries({
      pairId: selectedPairId,
      dimensionKey: selectedDimension,
      primaryCompound,
      doses,
      profile: userProfile,
      sensitivities,
      evidenceBlend
    });
  }, [selectedPairId, selectedDimension, primaryCompound, doses, userProfile, sensitivities, evidenceBlend, selectedPair]);

  const surfaceData = useMemo(() => {
    if (!selectedPair) return [];
    return buildSurfaceData({
      pairId: selectedPairId,
      profile: userProfile,
      sensitivities,
      evidenceBlend
    });
  }, [selectedPairId, userProfile, sensitivities, evidenceBlend, selectedPair]);

  const heatmapValues = useMemo(() => {
    const values = {};
    pairIds.forEach(id => {
      values[id] = computeHeatmapValue({
        pairId: id,
        mode: heatmapMode,
        profile: userProfile,
        sensitivities,
        evidenceBlend
      });
    });
    return values;
  }, [pairIds, heatmapMode, userProfile, sensitivities, evidenceBlend]);

  const maxHeatmapValue = Math.max(0.01, ...Object.values(heatmapValues).map(value => Math.abs(value)));

  const pairEvaluation = useMemo(() => {
    if (!selectedPair) return null;
    const payload = selectedPair.compounds.map(compoundKey => ({
      compound: compoundKey,
      dose: doses?.[compoundKey] ?? selectedPair.defaultDoses?.[compoundKey] ?? 0
    }));
    const profile = userProfile || defaultProfile;
    return evaluateStack({
      stackInput: payload,
      profile
    });
  }, [selectedPair, doses, userProfile]);

  const pairTotals = pairEvaluation?.totals || null;
  const baseBenefitValue = Number(pairTotals?.baseBenefit ?? 0);
  const baseRiskValue = Number(pairTotals?.baseRisk ?? 0);
  const adjustedBenefitValue = Number(pairTotals?.totalBenefit ?? baseBenefitValue);
  const adjustedRiskValue = Number(pairTotals?.totalRisk ?? baseRiskValue);
  const benefitDelta = adjustedBenefitValue - baseBenefitValue;
  const riskDelta = adjustedRiskValue - baseRiskValue;
  const netScore = pairTotals?.netScore || 0;
  const adjustedRatio = adjustedRiskValue > 0 ? adjustedBenefitValue / adjustedRiskValue : 0;

  const benefitSynergyPercent = baseBenefitValue > 0 ? (benefitDelta / baseBenefitValue) * 100 : 0;
  const riskSynergyPercent = baseRiskValue > 0 ? (riskDelta / baseRiskValue) * 100 : 0;

  const pairNetChartData = useMemo(() => {
    return [
      {
        metric: 'Benefit',
        Base: Number(baseBenefitValue.toFixed(2)),
        'With Synergy': Number(adjustedBenefitValue.toFixed(2))
      },
      {
        metric: 'Risk',
        Base: Number(baseRiskValue.toFixed(2)),
        'With Synergy': Number(adjustedRiskValue.toFixed(2))
      }
    ];
  }, [baseBenefitValue, baseRiskValue, adjustedBenefitValue, adjustedRiskValue]);

  const recommendations = useMemo(() => {
    if (!selectedPair) return [];
    const [cA, cB] = selectedPair.compounds;
    const seen = new Set();
    const sorted = [...surfaceData].sort((a, b) => b.score - a.score);
    const top = [];
    for (const point of sorted) {
      const key = `${point[cA]}-${point[cB]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      top.push(point);
      if (top.length >= 4) break;
    }
    return top;
  }, [surfaceData, selectedPair]);

  // Custom Stack Logic
  const handleAddCustomCompound = () => {
    if (!customSelection || customCompounds.includes(customSelection) || customCompounds.length >= 4) return;
    const defaults = deriveDoseWindow(customSelection);
    setCustomCompounds(prev => [...prev, customSelection]);
    setCustomRanges(prev => ({
      ...prev,
      [customSelection]: { ...defaults }
    }));
    setCustomSelection('');
  };

  const handleRemoveCustomCompound = (compoundKey) => {
    setCustomCompounds(prev => prev.filter(c => c !== compoundKey));
    setCustomRanges(prev => {
      const next = { ...prev };
      delete next[compoundKey];
      return next;
    });
    setCustomResults([]);
  };

  const updateCustomBounds = (compoundKey, nextMin, nextMax) => {
    setCustomRanges(prev => {
      const current = prev[compoundKey] || deriveDoseWindow(compoundKey);
      const safeMin = Math.max(0, Math.min(nextMin, nextMax));
      const safeMax = Math.max(safeMin + 1, Math.max(nextMin, nextMax));
      const safeBase = clampValue(current.base, safeMin, safeMax);
      return {
        ...prev,
        [compoundKey]: { ...current, min: Math.round(safeMin), max: Math.round(safeMax), base: Math.round(safeBase) }
      };
    });
  };

  const updateCustomBase = (compoundKey, nextBase) => {
    setCustomRanges(prev => {
      const current = prev[compoundKey] || deriveDoseWindow(compoundKey);
      const safeValue = clampValue(Math.round(nextBase), current.min, current.max);
      return { ...prev, [compoundKey]: { ...current, base: safeValue } };
    });
  };

  const handleRunCustomOptimizer = () => {
    if (!customCompounds.length) return;
    const combo = {
      id: `custom-${Date.now()}`,
      label: 'Custom Stack',
      narrative: 'User-defined stack blueprint',
      compounds: customCompounds,
      doseRanges: customCompounds.reduce((acc, key) => {
        const settings = customRanges[key] || deriveDoseWindow(key);
        acc[key] = [settings.min, settings.max];
        return acc;
      }, {}),
      defaultDoses: customCompounds.reduce((acc, key) => {
        const settings = customRanges[key] || deriveDoseWindow(key);
        acc[key] = settings.base;
        return acc;
      }, {}),
      steps: 3
    };
    const results = generateCustomStackResults({ combo, profile: userProfile });
    setCustomResults(results);
  };

  const stackResults = useMemo(
    () => generateStackOptimizerResults({ profile: userProfile }),
    [userProfile]
  );

  // Filters & Persistence
  const interactionFilterSummary = useMemo(() => {
    const entries = [];
    if (heatmapMode !== defaultHeatmapControls.heatmapMode) {
      entries.push({ key: 'heatmapMode', label: 'Matrix focus', description: heatmapMode });
    }
    if (Math.abs(evidenceBlend - defaultHeatmapControls.evidenceBlend) > 0.01) {
      entries.push({ key: 'evidenceBlend', label: 'Evidence mix', description: describeEvidenceMix(evidenceBlend) });
    }
    return entries;
  }, [heatmapMode, evidenceBlend]);

  useEffect(() => {
    onFiltersDirtyChange?.({
      dirty: interactionFilterSummary.length > 0,
      items: interactionFilterSummary
    });
  }, [interactionFilterSummary, onFiltersDirtyChange]);

  const customAvailableCompounds = useMemo(
    () => allCompoundKeys.filter(key => !customCompounds.includes(key)),
    [allCompoundKeys, customCompounds]
  );

  const handleSendRecommendation = (point) => {
    if (!selectedPair || !onPrefillStack) return;
    const payload = selectedPair.compounds.map(key => ({
      compound: key,
      dose: point[key]
    }));
    onPrefillStack(payload);
  };

  return (
    <div className="space-y-8">
      {/* ZONE 1: Matrix Dashboard */}
      <section ref={heatmapRef} className={`bg-physio-bg-secondary border border-physio-bg-border rounded-2xl shadow-sm transition-all duration-200 ${heatmapCompact ? 'p-4' : 'p-6'}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-physio-text-primary tracking-tight">Interaction Matrix</h2>
            {!heatmapCompact && (
              <p className="text-sm text-physio-text-secondary mt-1">
                Select any cell to load dose-aware synergy modeling in the workspace below.
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
             <div className="flex items-center bg-physio-bg-core rounded-full border border-physio-bg-border p-1">
               {interactionHeatmapModes.map(mode => (
                 <button
                   key={mode.key}
                   onClick={() => setHeatmapMode(mode.key)}
                   className={`px-3 py-1 text-[11px] rounded-full font-medium transition ${
                     heatmapMode === mode.key
                       ? 'bg-physio-accent-cyan text-physio-bg-core shadow-sm'
                       : 'text-physio-text-secondary hover:text-physio-text-primary'
                   }`}
                 >
                   {mode.label}
                 </button>
               ))}
             </div>
             
             <div className="flex items-center bg-physio-bg-core rounded-full border border-physio-bg-border p-1">
               {matrixViewOptions.map(option => (
                 <button
                   key={option.key}
                   onClick={() => setMatrixViewMode(option.key)}
                   className={`px-3 py-1 text-[11px] rounded-full font-medium transition ${
                     matrixViewMode === option.key
                       ? 'bg-physio-accent-mint text-physio-bg-core shadow-sm'
                       : 'text-physio-text-secondary hover:text-physio-text-primary'
                   }`}
                 >
                   {option.label}
                 </button>
               ))}
             </div>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="inline-block min-w-full">
            <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${uniqueCompounds.length}, 1fr)` }}>
              <div className="h-12"></div>
              {uniqueCompounds.map(key => (
                <div
                  key={key}
                  className="h-12 flex items-center justify-center text-xs font-bold uppercase tracking-wide text-physio-text-primary bg-physio-bg-core rounded-lg border border-physio-bg-border/50"
                >
                  {compoundData[key]?.abbreviation || key}
                </div>
              ))}

              {uniqueCompounds.map(row => (
                <React.Fragment key={row}>
                  <div className="h-12 flex items-center px-3 text-xs font-bold uppercase tracking-wide text-physio-text-primary bg-physio-bg-core rounded-lg border border-physio-bg-border/50">
                    {compoundData[row]?.abbreviation || row}
                  </div>
                  {uniqueCompounds.map(col => {
                    const pair = Object.values(interactionPairs).find(p =>
                      (p.compounds[0] === row && p.compounds[1] === col) ||
                      (p.compounds[0] === col && p.compounds[1] === row)
                    );
                    
                    if (!pair) {
                      return (
                        <div key={`${row}-${col}`} className="h-12 bg-physio-bg-tertiary/30 rounded-md border border-physio-bg-border/30"></div>
                      );
                    }

                    const value = heatmapValues[pair.id] || 0;
                    const isSelected = pair.id === selectedPairId;
                    const leanBackEnabled = matrixViewMode === 'leanBack';
                    const glyph = getLeanBackGlyph(value);
                    const leanBackClass = leanBackEnabled ? getLeanBackPalette(value) : '';
                    const color = heatmapColorScale(value, maxHeatmapValue, heatmapMode);
                    
                    return (
                      <button
                        key={`${row}-${col}`}
                        onClick={() => handlePairChange(pair.id)}
                        className={`h-12 relative rounded-md border transition-all duration-200 hover:scale-105 hover:z-10 hover:shadow-lg ${
                          isSelected 
                            ? 'ring-2 ring-physio-accent-cyan ring-offset-2 ring-offset-physio-bg-secondary z-10' 
                            : 'border-physio-bg-border/50'
                        } ${leanBackClass}`}
                        style={!leanBackEnabled ? { backgroundColor: color } : {}}
                        title={`${pair.label} (Score: ${value.toFixed(2)})`}
                      >
                        {leanBackEnabled ? (
                          <span className="text-sm font-bold">{glyph}</span>
                        ) : (
                          <span className="text-xs font-semibold text-physio-bg-core drop-shadow-sm">{value.toFixed(2)}</span>
                        )}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ZONE 2: Interaction Workspace */}
      <div ref={pairDetailRef} className="min-h-[600px]">
        {selectedPair ? (
          <section className="space-y-6 animate-fade-in">
            {/* Summary Card */}
            <InteractionSummaryCard 
              pair={selectedPair} 
              benefitSynergy={benefitSynergyPercent}
              riskSynergy={riskSynergyPercent}
              evidenceBlend={evidenceBlend}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={handleSendCurrentToStack}
                className="px-4 py-2 rounded-lg border border-physio-accent-cyan text-physio-accent-cyan text-sm font-semibold hover:bg-physio-accent-cyan/10 transition-colors"
              >
                Load Current Doses into Stack
              </button>
              <PDFExport
                chartRef={pairDetailRef}
                filename={`interaction-${selectedPair.label.replace(/\s+/g, '-')}.pdf`}
                contextSummary={{
                  title: 'Interaction Analysis',
                  items: [
                    { label: 'Pair', value: selectedPair.label },
                    { label: 'Scoring', value: 'Net Benefit - Risk' },
                    { label: 'Evidence', value: describeEvidenceMix(evidenceBlend) }
                  ]
                }}
              />
            </div>

            {/* Control Surface */}
            <div className="bg-physio-bg-secondary border border-physio-bg-border rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-physio-text-primary">Dose Synergy Lab</h3>
                <div className="flex gap-2">
                  {dimensionKeys.map(key => (
                    <button
                      key={key}
                      onClick={() => setSelectedDimension(key)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition ${
                        selectedDimension === key
                          ? 'bg-physio-accent-cyan/10 text-physio-accent-cyan border-physio-accent-cyan'
                          : 'bg-physio-bg-core text-physio-text-secondary border-physio-bg-border hover:text-physio-text-primary'
                      }`}
                    >
                      {interactionDimensions[key]?.label || key}
                    </button>
                  ))}
                </div>
              </div>

              <InteractionDoseSliders
                pair={selectedPair}
                doses={doses}
                onDoseChange={updateDose}
                primaryCompound={primaryCompound}
                onPrimaryChange={setPrimaryCompound}
                guardrails={pairEvaluation?.byCompound}
                metrics={{
                  adjustedBenefit: adjustedBenefitValue,
                  adjustedRisk: adjustedRiskValue,
                  adjustedRatio: adjustedRatio,
                  netScore: netScore
                }}
              />
            </div>

            {/* Analytics Deck */}
            <InteractionAnalyticsDeck
              pairNetChartData={pairNetChartData}
              interactionCurveData={chartData}
              primaryCompound={primaryCompound}
              recommendations={recommendations}
              compoundA={selectedPair.compounds[0]}
              compoundB={selectedPair.compounds[1]}
              onLoadRecommendation={handleSendRecommendation}
            />

          </section>
        ) : (
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-physio-bg-border rounded-2xl text-physio-text-tertiary">
            Select a pair from the matrix to analyze synergy.
          </div>
        )}
      </div>

      {/* Advanced / Optimizers */}
      <section className="bg-physio-bg-secondary border border-physio-bg-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-physio-text-primary">Advanced Optimizers</h3>
          <button
            onClick={() => setOptimizerCollapsed(prev => !prev)}
            className="text-sm text-physio-accent-cyan hover:underline"
          >
            {optimizerCollapsed ? 'Show' : 'Hide'}
          </button>
        </div>
        
        {!optimizerCollapsed && (
          <div className="space-y-8">
            {/* Multi-Compound */}
            <div>
              <h4 className="text-sm font-medium text-physio-text-secondary mb-3">3-Compound Templates</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {stackResults.map(result => (
                  <article key={result.comboId} className="bg-physio-bg-core border border-physio-bg-border rounded-xl p-4 flex flex-col gap-3 hover:border-physio-accent-cyan/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-semibold text-physio-text-primary">{stackOptimizerCombos.find(c => c.id === result.comboId)?.label}</h5>
                        <p className="text-xs text-physio-text-secondary mt-1">{result.narrative}</p>
                      </div>
                      <span className={`text-sm font-bold ${result.score >= 0 ? 'text-physio-accent-cyan' : 'text-physio-error'}`}>
                        Net {result.score.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-physio-text-tertiary">
                      {result.compounds.map(c => `${compoundData[c]?.abbreviation}: ${result.doses[c]}mg`).join(' · ')}
                    </div>
                    <button
                      onClick={() => onPrefillStack?.(result.compounds.map(c => ({ compound: c, dose: result.doses[c] })))}
                      className="mt-auto w-full py-2 rounded-lg border border-physio-bg-border text-xs font-semibold text-physio-text-secondary hover:bg-physio-bg-secondary hover:text-physio-accent-cyan transition"
                    >
                      Load to Stack Builder
                    </button>
                  </article>
                ))}
              </div>
            </div>

            {/* Custom Optimizer */}
            <div className="pt-6 border-t border-physio-bg-border">
              <h4 className="text-sm font-medium text-physio-text-secondary mb-3">Custom 4-Way Optimizer</h4>
              <div className="flex gap-2 mb-4">
                <select 
                  value={customSelection}
                  onChange={e => setCustomSelection(e.target.value)}
                  className="bg-physio-bg-core border border-physio-bg-border rounded-lg px-3 py-2 text-sm text-physio-text-primary"
                >
                  <option value="">Add compound...</option>
                  {customAvailableCompounds.map(k => (
                    <option key={k} value={k}>{compoundData[k]?.name}</option>
                  ))}
                </select>
                <button 
                  onClick={handleAddCustomCompound}
                  disabled={!customSelection}
                  className="px-4 py-2 bg-physio-accent-cyan text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  Add
                </button>
                <button 
                  onClick={handleRunCustomOptimizer}
                  disabled={!customCompounds.length}
                  className="px-4 py-2 border border-physio-accent-cyan text-physio-accent-cyan rounded-lg text-sm font-semibold ml-auto disabled:opacity-50"
                >
                  Run Optimizer
                </button>
              </div>
              
              {customCompounds.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {customCompounds.map(k => (
                    <div key={k} className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-3 flex justify-between items-center">
                      <span className="text-sm font-medium text-physio-text-primary">{compoundData[k]?.name}</span>
                      <button onClick={() => handleRemoveCustomCompound(k)} className="text-xs text-physio-error">Remove</button>
                    </div>
                  ))}
                </div>
              )}

              {customResults.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {customResults.map((res, idx) => (
                    <div key={idx} className="bg-physio-bg-core border border-physio-bg-border rounded-xl p-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-physio-text-tertiary">Result #{idx+1}</span>
                        <span className="font-bold text-physio-accent-mint">Net {res.score.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-physio-text-primary mb-3">
                        {res.compounds.map(c => `${c}: ${res.doses[c]}mg`).join(', ')}
                      </div>
                      <button
                        onClick={() => onPrefillStack?.(res.compounds.map(c => ({ compound: c, dose: res.doses[c] })))}
                        className="w-full py-1.5 rounded border border-physio-accent-cyan text-xs font-semibold text-physio-accent-cyan hover:bg-physio-accent-cyan/10"
                      >
                        Use Stack
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default InteractionHeatmap;

