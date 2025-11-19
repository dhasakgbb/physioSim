import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { compoundData } from '../data/compoundData';
import { getAncillaryProtocol } from '../data/sideFxAndAncillaries';
import { interactionPairs } from '../data/interactionEngineData';
import { defaultProfile } from '../utils/personalization';
import { evaluateStack } from '../utils/stackEngine';
import { loadCycles, saveCycle, deleteCycle } from '../utils/cycleStore';
import PDFExport from './PDFExport';
import NavigationRail from './NavigationRail';
import { deriveDoseWindow } from '../utils/doseWindows';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Slider from './ui/Slider';
import Input from './ui/Input';

const stackScoringLabel = 'Net benefit − risk';

const OrientationBar = ({ items }) => {
  return (
    <div className="sticky top-3 z-30">
      <div className="glass-panel rounded-2xl px-4 py-2 flex flex-wrap items-center gap-4 text-xs uppercase tracking-wider text-physio-text-secondary shadow-neo-sm">
        {items.map(({ label, value }, index) => (
          <div key={`${label}-${index}`} className="flex items-center gap-2">
            <span className="font-bold text-physio-text-tertiary">{label}</span>
            <span className="text-physio-text-primary font-mono normal-case bg-physio-bg-highlight/50 px-1.5 py-0.5 rounded border border-physio-border-subtle">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const formatStackForProtocol = (stackItems = []) =>
  stackItems.map(item => ({
    compound: item.compound,
    dose: item.dose,
    type: compoundData[item.compound]?.type,
    category: compoundData[item.compound]?.category
  }));

const formatTimestamp = isoString => {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/**
 * Stack Builder Component
 * Interactive tool for building compound stacks with metrics and ancillary calculations
 */
const StackBuilder = ({ prefillStack, userProfile }) => {
  const [stack, setStack] = useState([]);
  const [selectedCompound, setSelectedCompound] = useState('');
  const [dose, setDose] = useState('');
  const [savedCycles, setSavedCycles] = useState(() => loadCycles());
  const [activeCycleId, setActiveCycleId] = useState(null);
  const [cycleModalOpen, setCycleModalOpen] = useState(false);
  const [cycleDraft, setCycleDraft] = useState({ name: '', notes: '' });
  const [stackActiveAnchor, setStackActiveAnchor] = useState('builder');
  const [compareSelection, setCompareSelection] = useState({ baseline: '', contender: '' });
  const [loadSelection, setLoadSelection] = useState('');

  
  const builderRef = useRef(null);
  const metricsRef = useRef(null);
  const cyclesRef = useRef(null);
  const ancillaryRef = useRef(null);

  const refreshCycles = useCallback(() => {
    setSavedCycles(loadCycles());
  }, []);

  useEffect(() => {
    if (!prefillStack || !prefillStack.compounds?.length) return;
    setStack(
      prefillStack.compounds.map(item => ({
        compound: item.compound,
        dose: item.dose
      }))
    );
  }, [prefillStack]);
  
  const stackEvaluation = useMemo(() => {
    if (!stack.length) return null;
    const profile = userProfile || defaultProfile;
    return evaluateStack({
      stackInput: stack,
      profile
    });
  }, [stack, userProfile]);

  const stackTotals = stackEvaluation?.totals;
  const stackMetrics = stackEvaluation
    ? {
        adjustedRatio: stackTotals?.totalRisk > 0 ? stackTotals.totalBenefit / stackTotals.totalRisk : stackTotals.totalBenefit,
        netScore: stackTotals?.netScore ?? 0
      }
    : { adjustedRatio: 0, netScore: 0 };

  const formatMetric = (value, digits = 2) => Number(value ?? 0).toFixed(digits);

  const guardrailMap = useMemo(() => {
    if (!stackEvaluation) return {};
    return stack.reduce((acc, item) => {
      const compoundEval = stackEvaluation.byCompound?.[item.compound];
      if (!compoundEval) return acc;
      const benefitMeta = compoundEval.meta?.benefit;
      const riskMeta = compoundEval.meta?.risk;
      const plateau = Boolean(benefitMeta?.nearingPlateau || riskMeta?.nearingPlateau);
      const beyond = Boolean(benefitMeta?.beyondEvidence || riskMeta?.beyondEvidence);
      if (!plateau && !beyond) return acc;
      acc[item.compound] = {
        compound: item.compound,
        plateau,
        beyond,
        plateauDose: benefitMeta?.plateauDose || riskMeta?.plateauDose || null,
        hardMax: benefitMeta?.hardMax || riskMeta?.hardMax || null
      };
      return acc;
    }, {});
  }, [stackEvaluation, stack]);

  const savedCycleMeta = useMemo(() => {
    const meta = {};
    savedCycles.forEach(cycle => {
      if (!cycle?.stack?.length) return;
      const profile = cycle.profile || userProfile || defaultProfile;
      const evaluation = evaluateStack({
        stackInput: cycle.stack,
        profile
      });
      const totals = evaluation?.totals;
      if (!totals) return;
      const net = totals.netScore ?? 0;
      meta[cycle.id] = { net };
    });
    return meta;
  }, [savedCycles, userProfile]);

  const handleLoadCycle = (cycleId) => {
    if (!cycleId) return;
    const record = savedCycles.find(cycle => cycle.id === cycleId);
    if (!record) return;
    setStack(record.stack || []);
    setActiveCycleId(record.id);
  };

  const handleDeleteCycle = (cycleId) => {
    deleteCycle(cycleId);
    refreshCycles();
    if (activeCycleId === cycleId) {
      setActiveCycleId(null);
    }
  };

  const handleConfirmSaveCycle = () => {
    if (!stack.length) return;
    const record = saveCycle({
      id: cycleDraft.id || activeCycleId,
      name: cycleDraft.name?.trim() || `Cycle ${new Date().toLocaleDateString()}`,
      notes: cycleDraft.notes,
      stack,
      profile: userProfile || defaultProfile
    });
    refreshCycles();
    setActiveCycleId(record?.id || null);
    setCycleModalOpen(false);
    setCycleDraft({ name: '', notes: '' });
  };

  const handleOpenCycleModal = () => {
    setCycleModalOpen(true);
    if (activeCycleId) {
      const active = savedCycles.find(c => c.id === activeCycleId);
      if (active) {
        setCycleDraft({ id: active.id, name: active.name, notes: active.notes || '' });
        return;
      }
    }
    setCycleDraft({ name: '', notes: '' });
  };

  const handleLoadSelectionChange = (cycleId) => {
    setLoadSelection(cycleId);
    if (cycleId) {
      handleLoadCycle(cycleId);
      setLoadSelection('');
    }
  };

  // Calculate ancillary protocol
  const ancillaryProtocol = useMemo(() => {
    if (stack.length === 0) return null;
    return getAncillaryProtocol(formatStackForProtocol(stack));
  }, [stack]);

  const stackAnchors = useMemo(
    () => [
      { key: 'builder', label: 'Builder', ref: builderRef, available: true },
      { key: 'metrics', label: 'Metrics', ref: metricsRef, available: stack.length > 0 },
      { key: 'cycles', label: 'Cycles', ref: cyclesRef, available: savedCycles.length > 0 },
      { key: 'ancillary', label: 'Ancillary', ref: ancillaryRef, available: Boolean(ancillaryProtocol) }
    ],
    [ancillaryProtocol, builderRef, cyclesRef, metricsRef, savedCycles.length, stack.length]
  );

  const scrollToStackSection = useCallback(
    (section) => {
      if (typeof window === 'undefined' || !section?.ref?.current) return;
      const offset = window.innerWidth < 768 ? 80 : 140;
      const targetTop = section.ref.current.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
      setStackActiveAnchor(section.key);
    },
    [setStackActiveAnchor]
  );

  const handleStackAnchorChange = useCallback(
    (key) => {
      const section = stackAnchors.find(entry => entry.key === key);
      if (!section || !section.available) return;
      scrollToStackSection(section);
    },
    [scrollToStackSection, stackAnchors]
  );

  // Add compound to stack
  const handleAddCompound = () => {
    if (!selectedCompound || !dose) return;
    const doseNum = parseFloat(dose);
    if (isNaN(doseNum) || doseNum <= 0) return;
    
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
  
  const handleRemoveCompound = (compoundKey) => {
    setStack(stack.filter(item => item.compound !== compoundKey));
  };
  
  const availableCompounds = Object.keys(compoundData).filter(
    key => !stack.some(item => item.compound === key)
  );
  
  const injectables = availableCompounds.filter(key => compoundData[key].type === 'injectable');
  const orals = availableCompounds.filter(key => compoundData[key].type === 'oral');
  const hasStack = stack.length > 0;
  const activeCycle = savedCycles.find(cycle => cycle.id === activeCycleId) || null;
  const selectedCompoundMeta = selectedCompound ? compoundData[selectedCompound] : null;
  const selectedDoseWindow = selectedCompound ? deriveDoseWindow(selectedCompound) : null;
  const selectedUnit = selectedCompoundMeta?.type === 'oral' ? 'mg/day' : 'mg/wk';
  const sliderValue = selectedCompoundMeta
    ? (dose === ''
        ? selectedDoseWindow?.base || selectedDoseWindow?.min || 0
        : Number(dose))
    : 0;

  const builderOrientationItems = [
    ...(activeCycle
      ? [
          { label: 'Editing', value: activeCycle.name },
          { label: 'Updated', value: formatTimestamp(activeCycle.updatedAt) },
          { label: 'Net score', value: formatMetric(savedCycleMeta[activeCycle.id]?.net ?? 0) }
        ]
      : []),
    { label: 'Scoring', value: stackScoringLabel },
    { label: 'Compounds', value: hasStack ? stack.length : 0 },
    { label: 'Final ratio', value: hasStack ? formatMetric(stackMetrics.adjustedRatio) : '—' },
    { label: 'Net score', value: hasStack ? formatMetric(stackMetrics.netScore) : '—' }
  ];

  const ancillaryOrientationItems = useMemo(() => {
    if (!ancillaryProtocol) return [];
    return [
      { label: 'Weekly Cost', value: `$${ancillaryProtocol.totalWeeklyCost.toFixed(0)}` },
      { label: 'Essential', value: ancillaryProtocol.essential.length },
      { label: 'Monitoring', value: `${ancillaryProtocol.monitoring.length} Labs` }
    ];
  }, [ancillaryProtocol]);

  const comparisonResult = useMemo(() => {
    if (!compareSelection.baseline || !compareSelection.contender) return null;
    
    const baseCycle = savedCycles.find(c => c.id === compareSelection.baseline);
    const contCycle = savedCycles.find(c => c.id === compareSelection.contender);
    
    if (!baseCycle || !contCycle) return null;
    
    const deltas = summarizeCycleDelta(
      baseCycle.stack, 
      contCycle.stack, 
      userProfile || defaultProfile
    );
    
    if (!deltas) return null;
    
    return {
      baseline: {
        name: baseCycle.name,
        totals: evaluateStack({ stackInput: baseCycle.stack, profile: userProfile || defaultProfile })?.totals
      },
      contender: {
        name: contCycle.name,
        totals: evaluateStack({ stackInput: contCycle.stack, profile: userProfile || defaultProfile })?.totals
      },
      deltas
    };
  }, [compareSelection, savedCycles, userProfile]);

  const comparisonNarrative = useMemo(() => {
    if (!comparisonResult) return null;
    const { deltas } = comparisonResult;
    if (deltas.net > 0 && deltas.risk <= 0) return "Win-win: more benefit with same or less risk.";
    if (deltas.net > 0 && deltas.risk > 0) return "Improved net score, but comes with increased risk.";
    if (deltas.net < 0) return "Net score decreases. Reconsider this trade-off.";
    return "Neutral change.";
  }, [comparisonResult]);
  
  return (
    <div className="w-full space-y-6">
      <OrientationBar items={builderOrientationItems} />
      <div className="sticky top-16 z-20">
        <NavigationRail
          tabs={stackAnchors.map(section => ({
            key: section.key,
            label: section.label,
            disabled: !section.available
          }))}
          activeTab={stackActiveAnchor}
          onTabChange={handleStackAnchorChange}
          ariaLabel="Stack builder anchors"
          className="w-full"
        />
      </div>
      <section ref={builderRef} className="space-y-5">

        {/* Add Compound Section */}
        <Card className="p-6" variant="glass">
          <h2 className="text-xl font-semibold mb-6 text-physio-text-primary flex items-center gap-2">
            <div className="w-1.5 h-6 bg-physio-accent-primary rounded-full shadow-neo-glow" />
            Build Your Stack
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-physio-text-secondary uppercase tracking-wide mb-2">
                Select Compound
              </label>
              <select
                value={selectedCompound}
                onChange={(e) => setSelectedCompound(e.target.value)}
                className="w-full px-4 py-3 bg-physio-bg-core border border-physio-border-strong rounded-xl text-physio-text-primary focus:outline-none focus:border-physio-accent-primary focus:ring-1 focus:ring-physio-accent-primary/50 transition-all"
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
              <label className="block text-xs font-bold text-physio-text-secondary uppercase tracking-wide mb-2">
                Dose ({selectedCompound ? selectedUnit : 'mg'})
              </label>
              {selectedCompoundMeta ? (
                <div className="bg-physio-bg-surface/50 border border-physio-border-subtle rounded-xl px-4 py-3">
                  <Slider
                    value={sliderValue}
                    min={selectedDoseWindow?.min || 0}
                    max={selectedDoseWindow?.max || 500}
                    step={selectedCompoundMeta.type === 'oral' ? 2 : 10}
                    unit={selectedUnit}
                    markers={[
                      selectedDoseWindow?.base
                        ? { value: selectedDoseWindow.base, label: 'Base', tone: 'accent' }
                        : null,
                      selectedDoseWindow?.max
                        ? { value: selectedDoseWindow.max, label: 'Ceil', tone: 'warning' }
                        : null
                    ].filter(Boolean)}
                    onChange={(value) => setDose(String(value))}
                  />
                  <div className="flex items-center gap-2 mt-3 text-[11px] text-physio-text-tertiary uppercase tracking-wide">
                    <span>
                      Window {selectedDoseWindow?.min ?? 0}-{selectedDoseWindow?.max ?? 0} {selectedUnit}
                    </span>
                    <input
                      type="number"
                      value={dose}
                      onChange={(e) => setDose(e.target.value)}
                      placeholder="Enter dose"
                      className="ml-auto w-24 px-2 py-1 rounded border border-physio-border-subtle bg-physio-bg-core text-xs text-physio-text-primary text-right focus:border-physio-accent-primary focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="h-[86px] flex items-center justify-center border border-dashed border-physio-border-subtle rounded-xl bg-physio-bg-surface/30">
                  <p className="text-xs text-physio-text-muted italic">
                    Select a compound to unlock
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-end pb-1">
              <Button
                onClick={handleAddCompound}
                disabled={!selectedCompound || !dose}
                className="w-full h-[52px] text-base shadow-neo-md"
                variant="primary"
              >
                Add to Stack
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Current Stack */}
        <Card className="p-6" variant="glass">
          <h3 className="text-xl font-semibold mb-6 text-physio-text-primary flex items-center gap-2">
             <div className="w-1.5 h-6 bg-physio-accent-secondary rounded-full shadow-neo-glow" />
             Current Stack
          </h3>
          
          {stack.length === 0 ? (
            <div className="text-physio-text-muted text-center py-12 border-2 border-dashed border-physio-border-subtle rounded-xl bg-physio-bg-surface/20">
              No compounds in stack. Add compounds above to get started.
            </div>
          ) : (
            <div className="grid gap-3">
              {stack.map(item => {
                const compound = compoundData[item.compound];
                const guardrail = guardrailMap[item.compound];
                const guardrailTone = guardrail?.beyond
                  ? 'border-physio-accent-critical/50 bg-physio-accent-critical/5'
                  : guardrail?.plateau
                  ? 'border-physio-accent-warning/50 bg-physio-accent-warning/5'
                  : 'border-physio-border-subtle bg-physio-bg-surface/50';
                
                return (
                  <div
                    key={item.compound}
                    className={`p-4 rounded-xl border backdrop-blur-sm transition-all hover:border-physio-border-strong ${guardrailTone}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shadow-neo-sm font-mono font-bold text-xs text-white"
                          style={{ backgroundColor: compound.color }}
                        >
                          {compound.abbreviation.slice(0,2)}
                        </div>
                        <div>
                          <div className="font-bold text-lg text-physio-text-primary tracking-tight">{compound.name}</div>
                          <div className="text-xs text-physio-text-secondary uppercase tracking-wider flex items-center gap-2">
                            {compound.type === 'oral' ? 'Oral' : 'Injectable'} 
                            <span className="text-physio-border-strong">•</span>
                            {compound.abbreviation}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 ml-14 md:ml-0">
                        <div className="text-right mr-4">
                          <div className="text-2xl font-mono font-bold text-physio-text-primary leading-none">
                            {item.dose}
                            <span className="text-xs text-physio-text-muted font-sans font-normal ml-1">
                              {compound.type === 'oral' ? 'mg/day' : 'mg/wk'}
                            </span>
                          </div>
                        </div>
                        
                        {guardrail?.beyond && (
                          <Badge variant="critical" size="sm">Beyond Evidence</Badge>
                        )}
                        {guardrail?.plateau && (
                          <Badge variant="warning" size="sm">Plateau</Badge>
                        )}
                        
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleRemoveCompound(item.compound)}
                          className="text-physio-text-muted hover:text-physio-accent-critical hover:bg-physio-accent-critical/10"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </section>

      <section ref={metricsRef}>
        {/* Stack Metrics */}
        {stack.length > 0 && (
          <div className="bg-physio-bg-core/30 backdrop-blur-md p-6 rounded-2xl border border-physio-bg-border shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
              <h3 className="text-xl font-semibold text-physio-text-primary flex items-center gap-2">
                <span className="w-1.5 h-6 bg-physio-accent-success rounded-full" />
                Stack Metrics
              </h3>
              <div className="text-right">
                <span className="block text-[10px] uppercase tracking-wider text-physio-text-tertiary">Net Score</span>
                <span className={`text-2xl font-bold ${parseFloat(stackMetrics.netScore) >= 0 ? 'text-physio-accent-cyan' : 'text-physio-accent-critical'}`}>
                  {formatMetric(stackMetrics.netScore)}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Base Metrics */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-physio-text-tertiary uppercase tracking-wider border-b border-physio-bg-border/50 pb-2">Base Scores (No Synergy)</h4>
              <div className="flex justify-between items-center">
                <span className="text-physio-text-secondary text-sm">Total Benefit</span>
                <span className="font-mono text-physio-accent-success">{formatMetric(stackMetrics.totalBenefit)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-physio-text-secondary text-sm">Total Risk</span>
                <span className="font-mono text-physio-accent-critical">{formatMetric(stackMetrics.totalRisk)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-physio-text-secondary text-sm">Benefit:Risk Ratio</span>
                <span className="font-mono text-physio-accent-cyan">{formatMetric(stackMetrics.benefitRiskRatio)}</span>
              </div>
            </div>
            
            {/* Synergy-Adjusted Metrics */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-physio-text-tertiary uppercase tracking-wider border-b border-physio-bg-border/50 pb-2">With Synergy</h4>
              <div className="flex justify-between items-center">
                <span className="text-physio-text-secondary text-sm">Benefit Synergy</span>
                <span className={`font-mono font-bold ${stackMetrics.benefitSynergyPct >= 0 ? 'text-physio-accent-success' : 'text-physio-accent-critical'}`}>
                  {stackMetrics.benefitSynergyPct >= 0 ? '+' : ''}
                  {stackMetrics.benefitSynergyPct.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-physio-text-secondary text-sm">Risk Synergy</span>
                <span className={`font-mono font-bold ${stackMetrics.riskSynergyPct <= 0 ? 'text-physio-accent-success' : 'text-physio-accent-critical'}`}>
                  {stackMetrics.riskSynergyPct >= 0 ? '+' : ''}
                  {stackMetrics.riskSynergyPct.toFixed(1)}%
                </span>
              </div>
              
              <div className="bg-physio-bg-surface/50 p-4 rounded-xl border border-physio-bg-border/50 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs uppercase tracking-wide text-physio-text-secondary">Adj. Benefit</span>
                  <span className="font-bold text-physio-accent-success">{formatMetric(stackMetrics.adjustedBenefit)}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs uppercase tracking-wide text-physio-text-secondary">Adj. Risk</span>
                  <span className="font-bold text-physio-accent-critical">{formatMetric(stackMetrics.adjustedRisk)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-physio-bg-border/50">
                  <span className="text-sm font-bold text-physio-text-primary">Final Ratio</span>
                  <span className="font-bold text-xl text-physio-accent-cyan">{formatMetric(stackMetrics.adjustedRatio)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Export Stack Report */}
          <div className="mt-6 flex justify-end pt-4 border-t border-physio-bg-border/30">
          <PDFExport 
            chartRef={builderRef}
            stackData={{
              compounds: stack.map(item => ({
                id: item.compound,
                dose: item.dose
              })),
              totalBenefit: stackMetrics.totalBenefit,
              totalRisk: stackMetrics.totalRisk,
              benefitSynergy: stackMetrics.benefitSynergyDelta,
              riskSynergy: stackMetrics.riskSynergyDelta,
              benefitSynergyPercent: stackMetrics.benefitSynergyPct,
              riskSynergyPercent: stackMetrics.riskSynergyPct,
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
                { label: 'Scoring', value: stackScoringLabel },
                { label: 'Compounds', value: stack.length },
                { label: 'Adjusted ratio', value: stackMetrics.adjustedRatio },
                { label: 'Net score', value: stackMetrics.netScore }
              ]
            }}
            badgeContext={[]}
          />
        </div>
        </div>
      )}
      </section>

      <section ref={cyclesRef} className="bg-physio-bg-core/30 backdrop-blur-md p-6 rounded-2xl border border-physio-bg-border shadow-lg space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-physio-text-primary">Cycle Workspace</h3>
            <p className="text-sm text-physio-text-secondary">
              Save stacks, reload them later, and compare cycles before running them.
            </p>
            {activeCycle && (
              <p className="text-xs text-physio-text-tertiary mt-1">
                Active cycle: <span className="font-semibold text-physio-text-primary">{activeCycle.name}</span>
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Button
              onClick={handleOpenCycleModal}
              disabled={!hasStack}
              variant="secondary"
              className="border-physio-accent-cyan/50 text-physio-accent-cyan hover:bg-physio-accent-cyan/10 disabled:border-physio-border-subtle disabled:text-physio-text-tertiary disabled:bg-transparent"
            >
              Save current cycle
            </Button>
            <div className="flex-1">
              <select
                value={loadSelection}
                onChange={e => handleLoadSelectionChange(e.target.value)}
                className="w-full bg-physio-bg-surface border border-physio-bg-border rounded-lg px-3 py-2 text-sm text-physio-text-primary focus:outline-none focus:border-physio-accent-cyan"
              >
                <option value="">Load saved cycle...</option>
                {savedCycles.map(cycle => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name} — {formatTimestamp(cycle.updatedAt)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {savedCycles.length === 0 ? (
          <p className="text-sm text-physio-text-tertiary italic border-t border-physio-bg-border/30 pt-4">No saved cycles yet.</p>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              {savedCycles.map(cycle => {
                const meta = savedCycleMeta[cycle.id];
                return (
                  <div
                    key={cycle.id}
                    className={`border rounded-xl p-4 flex items-center justify-between gap-3 bg-physio-bg-surface/30 ${
                      cycle.id === activeCycleId ? 'border-physio-accent-cyan shadow-[0_0_15px_rgba(75,187,247,0.15)]' : 'border-physio-bg-border/50'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-physio-text-primary text-lg">{cycle.name}</p>
                      <p className="text-xs text-physio-text-tertiary mb-2">
                        Updated {formatTimestamp(cycle.updatedAt)}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {meta && (
                          <>
                            <Badge
                              size="sm"
                              variant={meta.net >= 0 ? 'success' : 'critical'}
                            >
                              Net {formatMetric(meta.net)}
                            </Badge>
                            <Badge
                              size="sm"
                              variant="warning"
                            >
                              Ratio {Number.isFinite(meta.ratio) ? formatMetric(meta.ratio) : '—'}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleLoadCycle(cycle.id)}
                      variant="ghost"
                      size="sm"
                      className="text-xs border border-physio-accent-success/30 text-physio-accent-success hover:bg-physio-accent-success/10"
                    >
                      Load
                    </Button>
                    <Button
                      onClick={() => handleDeleteCycle(cycle.id)}
                      variant="ghost"
                      size="sm"
                      className="text-xs border border-physio-accent-critical/30 text-physio-accent-critical hover:bg-physio-accent-critical/10"
                    >
                      Delete
                    </Button>
                  </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-6 border-t border-physio-bg-border/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-physio-text-primary">Compare cycles</h4>
                  <p className="text-xs text-physio-text-tertiary">
                    Pick two saved stacks to see benefit, risk, and net deltas.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <select
                    value={compareSelection.baseline}
                    onChange={e => setCompareSelection(prev => ({ ...prev, baseline: e.target.value }))}
                    className="flex-1 bg-physio-bg-surface border border-physio-bg-border rounded-lg px-3 py-2 text-sm text-physio-text-primary"
                  >
                    <option value="">Baseline cycle…</option>
                    {savedCycles.map(cycle => (
                      <option key={`base-${cycle.id}`} value={cycle.id}>
                        {cycle.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={compareSelection.contender}
                    onChange={e => setCompareSelection(prev => ({ ...prev, contender: e.target.value }))}
                    className="flex-1 bg-physio-bg-surface border border-physio-bg-border rounded-lg px-3 py-2 text-sm text-physio-text-primary"
                  >
                    <option value="">Contender cycle…</option>
                    {savedCycles.map(cycle => (
                      <option key={`contender-${cycle.id}`} value={cycle.id} disabled={cycle.id === compareSelection.baseline}>
                        {cycle.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {comparisonResult && (
                <div className="bg-physio-bg-surface/50 border border-physio-bg-border rounded-xl p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-physio-text-tertiary uppercase tracking-wider font-bold">Baseline</p>
                      <p className="text-lg font-semibold text-physio-text-primary">
                        {comparisonResult.baseline.name} · <span className="font-mono text-base opacity-80">{formatMetric(comparisonResult.baseline.totals.netScore)} net</span>
                      </p>
                    </div>
                    <div className="text-center text-xs text-physio-text-tertiary font-mono bg-physio-bg-border/30 px-2 py-1 rounded-full">VS</div>
                    <div className="text-right">
                      <p className="text-[10px] text-physio-text-tertiary uppercase tracking-wider font-bold">Contender</p>
                      <p className="text-lg font-semibold text-physio-text-primary">
                        {comparisonResult.contender.name} · <span className="font-mono text-base opacity-80">{formatMetric(comparisonResult.contender.totals.netScore)} net</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-physio-text-secondary border-t border-physio-bg-border/30 pt-3">
                    {comparisonResult.deltas.net >= 0 ? 'Adds' : 'Drops'} <strong className={comparisonResult.deltas.net >= 0 ? 'text-physio-accent-success' : 'text-physio-accent-critical'}>{formatMetric(Math.abs(comparisonResult.deltas.net))}</strong> net score,
                    with ΔBenefit {comparisonResult.deltas.benefit >= 0 ? '+' : '-'}
                    {formatMetric(Math.abs(comparisonResult.deltas.benefit))} and ΔRisk{' '}
                    {comparisonResult.deltas.risk >= 0 ? '+' : '-'}
                    {formatMetric(Math.abs(comparisonResult.deltas.risk))}.
                  </div>
                  {comparisonNarrative && (
                    <div className="text-xs text-physio-text-tertiary italic">{comparisonNarrative}</div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {cycleModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-physio-bg-secondary border border-physio-bg-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h4 className="text-xl font-semibold text-physio-text-primary">Save cycle</h4>
            <label className="text-sm text-physio-text-secondary space-y-1 block">
              Name
              <input
                type="text"
                value={cycleDraft.name}
                onChange={e => setCycleDraft(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-physio-bg-core border border-physio-bg-border rounded-lg px-3 py-2 text-sm text-physio-text-primary"
                placeholder="e.g., Spring Recomp 2025"
              />
            </label>
            <label className="text-sm text-physio-text-secondary space-y-1 block">
              Notes
              <textarea
                value={cycleDraft.notes}
                onChange={e => setCycleDraft(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full bg-physio-bg-core border border-physio-bg-border rounded-lg px-3 py-2 text-sm text-physio-text-primary resize-none"
                placeholder="Add reminders about labs, diet, or changes."
              />
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setCycleModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-physio-bg-border text-physio-text-secondary hover:text-physio-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSaveCycle}
                className="px-4 py-2 rounded-lg bg-physio-accent-cyan text-white font-semibold shadow-lg shadow-physio-accent-cyan/20 hover:bg-physio-accent-cyan/90 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Ancillary Protocol */}
      {ancillaryProtocol && (
        <section ref={ancillaryRef} className="space-y-4">
          <OrientationBar items={ancillaryOrientationItems} tone="accent" />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.9fr)]">
            <div className="bg-physio-bg-core/30 backdrop-blur-md p-6 rounded-2xl border border-physio-bg-border shadow-lg space-y-6">
              <h3 className="text-xl font-semibold text-physio-text-primary flex items-center gap-2">
                <span className="w-1.5 h-6 bg-physio-accent-violet rounded-full" />
                Required Ancillary Protocol
              </h3>
              
              {ancillaryProtocol.essential.length > 0 && (
                <div>
                  <h4 className="font-bold text-physio-error mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <span className="text-lg">⚠️</span>
                    Essential (Non-Negotiable)
                  </h4>
                  <div className="space-y-3">
                    {ancillaryProtocol.essential.map((item, idx) => (
                      <div key={idx} className="p-4 bg-physio-bg-secondary/50 rounded-xl border-l-4 border-physio-error">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-physio-text-primary text-lg">{item.drug}</span>
                          <span className="text-sm font-mono text-physio-text-secondary bg-physio-bg-core px-2 py-1 rounded border border-physio-bg-border/50">${item.cost}/week</span>
                        </div>
                        <div className="text-sm text-physio-text-secondary space-y-1.5">
                          <div className="flex gap-2"><strong className="text-physio-text-tertiary w-16">Dosing:</strong> <span>{item.dosing}</span></div>
                          <div className="flex gap-2"><strong className="text-physio-text-tertiary w-16">Purpose:</strong> <span>{item.purpose}</span></div>
                          {item.timing && <div className="flex gap-2"><strong className="text-physio-text-tertiary w-16">Timing:</strong> <span>{item.timing}</span></div>}
                          {item.note && <div className="text-physio-error mt-2 bg-physio-error/5 p-2 rounded text-xs border border-physio-error/20"><strong>Note:</strong> {item.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {ancillaryProtocol.recommended.length > 0 && (
                <div>
                  <h4 className="font-bold text-physio-accent-cyan mb-3 text-sm uppercase tracking-wider">Strongly Recommended</h4>
                  <div className="space-y-3">
                    {ancillaryProtocol.recommended.map((item, idx) => (
                      <div key={idx} className="p-4 bg-physio-bg-secondary/50 rounded-xl border-l-4 border-physio-accent-cyan">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-physio-text-primary text-lg">{item.drug}</span>
                          <span className="text-sm font-mono text-physio-text-secondary bg-physio-bg-core px-2 py-1 rounded border border-physio-bg-border/50">${item.cost}/week</span>
                        </div>
                        <div className="text-sm text-physio-text-secondary space-y-1.5">
                           <div className="flex gap-2"><strong className="text-physio-text-tertiary w-16">Dosing:</strong> <span>{item.dosing}</span></div>
                           <div className="flex gap-2"><strong className="text-physio-text-tertiary w-16">Purpose:</strong> <span>{item.purpose}</span></div>
                          {item.timing && <div className="flex gap-2"><strong className="text-physio-text-tertiary w-16">Timing:</strong> <span>{item.timing}</span></div>}
                          {item.note && <div className="text-physio-accent-cyan mt-2 bg-physio-accent-cyan/5 p-2 rounded text-xs border border-physio-accent-cyan/20"><strong>Note:</strong> {item.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {ancillaryProtocol.optional.length > 0 && (
                <div>
                  <h4 className="font-bold text-physio-accent-mint mb-3 text-sm uppercase tracking-wider">Optional (Context-Dependent)</h4>
                  <div className="space-y-3">
                    {ancillaryProtocol.optional.map((item, idx) => (
                      <div key={idx} className="p-4 bg-physio-bg-secondary/50 rounded-xl border-l-4 border-physio-accent-mint">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-physio-text-primary text-lg">{item.drug}</span>
                          <span className="text-sm font-mono text-physio-text-secondary bg-physio-bg-core px-2 py-1 rounded border border-physio-bg-border/50">${item.cost}/week</span>
                        </div>
                        <div className="text-sm text-physio-text-secondary space-y-1.5">
                           <div className="flex gap-2"><strong className="text-physio-text-tertiary w-16">Dosing:</strong> <span>{item.dosing}</span></div>
                           <div className="flex gap-2"><strong className="text-physio-text-tertiary w-16">Purpose:</strong> <span>{item.purpose}</span></div>
                          {item.timing && <div className="flex gap-2"><strong className="text-physio-text-tertiary w-16">Timing:</strong> <span>{item.timing}</span></div>}
                          {item.note && <div className="text-physio-accent-mint mt-2 bg-physio-accent-mint/5 p-2 rounded text-xs border border-physio-accent-mint/20"><strong>Note:</strong> {item.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 lg:sticky lg:top-24 h-fit">
              <div className="p-5 bg-physio-bg-core/50 backdrop-blur-md rounded-2xl border border-physio-bg-border shadow-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-physio-text-primary text-sm uppercase tracking-wide">Weekly Cost</span>
                  <span className="font-bold text-physio-text-primary text-2xl">${ancillaryProtocol.totalWeeklyCost.toFixed(2)}</span>
                </div>
                <p className="text-xs text-physio-text-tertiary mt-2 border-t border-physio-bg-border/50 pt-2">
                  Estimated weekly spend across essential + recommended support. Actual costs vary.
                </p>
              </div>

              {ancillaryProtocol.monitoring.length > 0 && (
                <div className="p-5 bg-physio-bg-core/50 backdrop-blur-md rounded-2xl border border-physio-accent-violet/30 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-physio-bg-border/50 pb-3">
                    <h4 className="font-bold text-physio-accent-violet text-sm uppercase tracking-wider">Monitoring</h4>
                    <span className="text-xs font-mono bg-physio-accent-violet/10 text-physio-accent-violet px-2 py-1 rounded">
                      {ancillaryProtocol.monitoring.length} LABS
                    </span>
                  </div>
                  <div className="space-y-3">
                    {ancillaryProtocol.monitoring.map((item, idx) => (
                      <div key={idx} className="text-sm text-physio-text-secondary border border-physio-bg-border/50 rounded-xl p-3 bg-physio-bg-secondary/30">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-physio-text-primary">{item.test}</span>
                          <span className="text-[10px] font-bold text-physio-accent-violet bg-physio-accent-violet/5 px-1.5 py-0.5 rounded uppercase">{item.frequency}</span>
                        </div>
                        <div className="space-y-1 text-xs mt-2">
                          <div className="flex gap-1"><span className="text-physio-text-tertiary">Target:</span> {item.targets}</div>
                          <div className="flex gap-1"><span className="text-physio-text-tertiary">Action:</span> {item.action}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const summarizeCycleDelta = (baselineStack, contenderStack, profile) => {
  const baseEval = evaluateStack({ stackInput: baselineStack, profile });
  const contEval = evaluateStack({ stackInput: contenderStack, profile });
  
  if (!baseEval?.totals || !contEval?.totals) return null;

  const baseNet = baseEval.totals.netScore ?? 0;
  const contNet = contEval.totals.netScore ?? 0;
  
  return {
    net: contNet - baseNet,
    benefit: contEval.totals.totalBenefit - baseEval.totals.totalBenefit,
    risk: contEval.totals.totalRisk - baseEval.totals.totalRisk
  };
};

export default StackBuilder;
export { summarizeCycleDelta };
