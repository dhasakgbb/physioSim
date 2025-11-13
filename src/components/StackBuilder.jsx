import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { compoundData } from '../data/compoundData';
import { getAncillaryProtocol } from '../data/sideFxAndAncillaries';
import { goalPresets, interactionPairs } from '../data/interactionEngineData';
import { defaultProfile } from '../utils/personalization';
import { evaluateStack } from '../utils/stackEngine';
import { loadCycles, saveCycle, deleteCycle } from '../utils/cycleStore';
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

const bucketRegistry = {
  lean_mass: { type: 'benefit', label: 'lean-mass benefit' },
  cosmetic: { type: 'benefit', label: 'cosmetic benefit' },
  strength: { type: 'benefit', label: 'strength output' },
  joints: { type: 'benefit', label: 'joint relief' },
  cardio: { type: 'risk', label: 'cardio risk' },
  blood: { type: 'risk', label: 'blood viscosity risk' },
  estrogenic: { type: 'risk', label: 'estrogenic drag' },
  neuro: { type: 'risk', label: 'neuro load' },
  low_e2: { type: 'risk', label: 'low-E2 strain' },
  hepatic: { type: 'risk', label: 'hepatic stress' }
};

const dimensionToBucket = {
  anabolic: 'lean_mass',
  vascularity: 'cosmetic',
  strength: 'strength',
  joint: 'joints',
  bp: 'cardio',
  hematocrit: 'blood',
  bloat: 'estrogenic',
  neuro: 'neuro',
  estrogenic: 'low_e2',
  hepatic: 'hepatic'
};

const formatNarrativeDelta = value => {
  const rounded = Math.abs(value).toFixed(1);
  return `${value >= 0 ? '+' : '-'}${rounded}`;
};

const describeAncillaryDelta = (baseline = null, contender = null) => {
  if (!baseline || !contender) return '';
  const essentialDelta = contender.essential.length - baseline.essential.length;
  const recommendedDelta = contender.recommended.length - baseline.recommended.length;
  const monitoringDelta = contender.monitoring.length - baseline.monitoring.length;
  const costDelta = contender.totalWeeklyCost - baseline.totalWeeklyCost;
  const bits = [];
  if (essentialDelta) {
    bits.push(`${essentialDelta > 0 ? '+' : ''}${essentialDelta} essential`);
  }
  if (recommendedDelta) {
    bits.push(`${recommendedDelta > 0 ? '+' : ''}${recommendedDelta} recommended`);
  }
  if (monitoringDelta) {
    bits.push(`${monitoringDelta > 0 ? '+' : ''}${monitoringDelta} labs`);
  }
  if (Math.abs(costDelta) >= 1) {
    const direction = costDelta >= 0 ? 'higher' : 'lower';
    bits.push(`${direction} $${Math.abs(costDelta).toFixed(2)}/wk`);
  }
  if (!bits.length) return '';
  return `Ancillary plan shifts ${bits.join(', ')}`;
};

const formatStackForProtocol = (stackItems = []) =>
  stackItems.map(item => ({
    compound: item.compound,
    dose: item.dose,
    type: compoundData[item.compound]?.type,
    category: compoundData[item.compound]?.category
  }));

const collectBucketTotals = evaluation => {
  const totals = {};
  Object.values(evaluation?.pairInteractions || {}).forEach(interaction => {
    Object.entries(interaction.deltaDims || {}).forEach(([dimensionKey, delta]) => {
      const bucketKey = dimensionToBucket[dimensionKey];
      if (!bucketKey) return;
      totals[bucketKey] = (totals[bucketKey] || 0) + delta;
    });
  });
  return totals;
};

const collectBucketDrivers = evaluation => {
  const drivers = {};
  Object.entries(evaluation?.pairInteractions || {}).forEach(([pairId, interaction]) => {
    Object.entries(interaction.deltaDims || {}).forEach(([dimensionKey, delta]) => {
      const bucketKey = dimensionToBucket[dimensionKey];
      if (!bucketKey) return;
      if (!drivers[bucketKey]) drivers[bucketKey] = [];
      drivers[bucketKey].push({ pairId, delta });
    });
  });
  return drivers;
};

const selectTopBucket = (bucketDelta, targetType) => {
  const entries = Object.entries(bucketDelta).filter(([bucketKey, value]) => bucketRegistry[bucketKey]?.type === targetType);
  if (!entries.length) return null;
  const sorted =
    targetType === 'benefit'
      ? entries.sort((a, b) => b[1] - a[1])
      : entries.sort((a, b) => a[1] - b[1]);
  if (targetType === 'benefit') {
    return sorted.find(([, value]) => value >= 0.4) || null;
  }
  return sorted.find(([, value]) => value <= -0.4) || null;
};

const pickDriverLabel = (bucketKey, drivers) => {
  const entries = drivers[bucketKey];
  if (!entries || !entries.length) return null;
  const top = [...entries].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  const pair = interactionPairs[top.pairId];
  if (pair?.label) return pair.label;
  if (pair?.compounds?.length) {
    return pair.compounds
      .map(code => compoundData[code]?.abbreviation || compoundData[code]?.name || code)
      .join(' + ');
  }
  return null;
};

const summarizeCycleDelta = ({
  baselineEval,
  contenderEval,
  contenderName,
  baselineAncillary = null,
  contenderAncillary = null
}) => {
  if (!baselineEval || !contenderEval) return null;
  const baselineBuckets = collectBucketTotals(baselineEval);
  const contenderBuckets = collectBucketTotals(contenderEval);
  const bucketKeys = new Set([...Object.keys(baselineBuckets), ...Object.keys(contenderBuckets)]);
  const bucketDelta = {};
  bucketKeys.forEach(bucketKey => {
    bucketDelta[bucketKey] = (contenderBuckets[bucketKey] || 0) - (baselineBuckets[bucketKey] || 0);
  });
  const drivers = collectBucketDrivers(contenderEval);
  const benefitBucket = selectTopBucket(bucketDelta, 'benefit');
  const riskBucket = selectTopBucket(bucketDelta, 'risk');
  const ancillarySentence = describeAncillaryDelta(baselineAncillary, contenderAncillary);
  if (!benefitBucket && !riskBucket && !ancillarySentence) return null;

  let narrative = '';
  if (benefitBucket) {
    const [bucketKey, value] = benefitBucket;
    narrative += `${contenderName} adds ${formatNarrativeDelta(value)} ${bucketRegistry[bucketKey].label}`;
  }
  if (riskBucket) {
    const [bucketKey, value] = riskBucket;
    const clausePrefix = benefitBucket ? ' but ' : `${contenderName} also adds `;
    narrative += `${clausePrefix}${formatNarrativeDelta(Math.abs(value))} ${bucketRegistry[bucketKey].label}`;
  }

  const dominantBucket =
    benefitBucket && riskBucket
      ? Math.abs(benefitBucket[1]) >= Math.abs(riskBucket[1])
        ? benefitBucket[0]
        : riskBucket[0]
      : benefitBucket
      ? benefitBucket[0]
      : riskBucket
      ? riskBucket[0]
      : null;
  const driverLabel = dominantBucket ? pickDriverLabel(dominantBucket, drivers) : null;
  if (driverLabel) {
    narrative += ` driven by ${driverLabel}`;
  }

  if (ancillarySentence) {
    narrative += narrative ? `. ${ancillarySentence}` : ancillarySentence;
  }

  return narrative || null;
};

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
const StackBuilder = ({ prefillStack, userProfile, initialGoalPreset = 'lean_mass', uiMode = 'simple' }) => {
  const [stack, setStack] = useState([]);
  const [selectedCompound, setSelectedCompound] = useState('');
  const [dose, setDose] = useState('');
  const [goalPreset, setGoalPreset] = useState(initialGoalPreset);
  const [savedCycles, setSavedCycles] = useState(() => loadCycles());
  const [activeCycleId, setActiveCycleId] = useState(null);
  const [cycleModalOpen, setCycleModalOpen] = useState(false);
  const [cycleDraft, setCycleDraft] = useState({ name: '', notes: '' });
  const [compareSelection, setCompareSelection] = useState({ baseline: '', contender: '' });
  const [loadSelection, setLoadSelection] = useState('');
  const stackRef = useRef(null);
  const compoundSelectId = 'stack-builder-compound';
  const doseInputId = 'stack-builder-dose';
  const goalSelectId = 'stack-builder-goal';

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
    if (prefillStack.goalPreset) {
      setGoalPreset(prefillStack.goalPreset);
    }
  }, [prefillStack]);
  
  const stackEvaluation = useMemo(() => {
    if (!stack.length) return null;
    const profile = userProfile || defaultProfile;
    return evaluateStack({
      stackInput: stack,
      profile,
      goalKey: goalPreset
    });
  }, [stack, userProfile, goalPreset]);

  const stackTotals = stackEvaluation?.totals;
  const baseBenefit = stackTotals?.baseBenefit ?? 0;
  const baseRisk = stackTotals?.baseRisk ?? 0;
  const adjustedBenefit = stackTotals?.totalBenefit ?? baseBenefit;
  const adjustedRisk = stackTotals?.totalRisk ?? baseRisk;
  const benefitDelta = adjustedBenefit - baseBenefit;
  const riskDelta = adjustedRisk - baseRisk;
  const benefitRiskRatio = baseRisk > 0 ? baseBenefit / baseRisk : baseBenefit;
  const adjustedRatio = adjustedRisk > 0 ? adjustedBenefit / adjustedRisk : adjustedBenefit;
  const benefitSynergyPct = baseBenefit > 0 ? (benefitDelta / baseBenefit) * 100 : 0;
  const riskSynergyPct = baseRisk > 0 ? (riskDelta / baseRisk) * 100 : 0;
  const stackMetrics = stackEvaluation
    ? {
        totalBenefit: baseBenefit,
        totalRisk: baseRisk,
        benefitRiskRatio,
        benefitSynergyPct,
        riskSynergyPct,
        benefitSynergyDelta: benefitDelta,
        riskSynergyDelta: riskDelta,
        adjustedBenefit,
        adjustedRisk,
        adjustedRatio,
        goalScore: stackTotals?.netScore ?? 0
      }
    : {
        totalBenefit: 0,
        totalRisk: 0,
        benefitRiskRatio: 0,
        benefitSynergyPct: 0,
        riskSynergyPct: 0,
        benefitSynergyDelta: 0,
        riskSynergyDelta: 0,
        adjustedBenefit: 0,
        adjustedRisk: 0,
        adjustedRatio: 0,
      goalScore: 0
      };

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

  const guardrailNotices = Object.values(guardrailMap);

  const handleLoadCycle = (cycleId) => {
    if (!cycleId) return;
    const record = savedCycles.find(cycle => cycle.id === cycleId);
    if (!record) return;
    setStack(record.stack || []);
    setGoalPreset(record.goalPreset || 'lean_mass');
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
      goalPreset,
      stack,
      profile: userProfile || defaultProfile
    });
    refreshCycles();
    setActiveCycleId(record?.id || null);
    setCycleModalOpen(false);
    setCycleDraft({ name: '', notes: '' });
  };

  const handleOpenCycleModal = () => {
    if (!stack.length) return;
    const activeCycle = savedCycles.find(cycle => cycle.id === activeCycleId);
    setCycleDraft({
      name: activeCycle?.name || `Cycle (${goalPresets[goalPreset]?.label || 'Custom'})`,
      notes: ''
    });
    setCycleModalOpen(true);
  };

  const comparisonResult = useMemo(() => {
    const baseline = savedCycles.find(cycle => cycle.id === compareSelection.baseline);
    const contender = savedCycles.find(cycle => cycle.id === compareSelection.contender);
    if (!baseline || !contender) return null;
    const baselineEval = evaluateStack({
      stackInput: baseline.stack,
      profile: baseline.profile || userProfile || defaultProfile,
      goalKey: baseline.goalPreset || goalPreset
    });
    const contenderEval = evaluateStack({
      stackInput: contender.stack,
      profile: contender.profile || userProfile || defaultProfile,
      goalKey: contender.goalPreset || goalPreset
    });
    const baselineAncillary = getAncillaryProtocol(formatStackForProtocol(baseline.stack));
    const contenderAncillary = getAncillaryProtocol(formatStackForProtocol(contender.stack));
    return {
      baseline: { ...baseline, totals: baselineEval.totals, evaluation: baselineEval, ancillary: baselineAncillary },
      contender: { ...contender, totals: contenderEval.totals, evaluation: contenderEval, ancillary: contenderAncillary },
      deltas: {
        benefit: contenderEval.totals.totalBenefit - baselineEval.totals.totalBenefit,
        risk: contenderEval.totals.totalRisk - baselineEval.totals.totalRisk,
        net: contenderEval.totals.netScore - baselineEval.totals.netScore
      }
    };
  }, [compareSelection, savedCycles, userProfile, goalPreset]);
  const comparisonNarrative = useMemo(() => {
    if (!comparisonResult) return null;
    return summarizeCycleDelta({
      baselineEval: comparisonResult.baseline.evaluation,
      contenderEval: comparisonResult.contender.evaluation,
      contenderName: comparisonResult.contender.name || 'Contender cycle',
      baselineAncillary: comparisonResult.baseline.ancillary,
      contenderAncillary: comparisonResult.contender.ancillary
    });
  }, [comparisonResult]);
  
  // Calculate ancillary protocol
  const ancillaryProtocol = useMemo(() => {
    if (stack.length === 0) return null;

    return getAncillaryProtocol(formatStackForProtocol(stack));
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

  const handleLoadSelectionChange = (value) => {
    setLoadSelection(value);
    if (value) {
      handleLoadCycle(value);
      setLoadSelection('');
    }
  };
  
  // Get available compounds (not in stack)
  const availableCompounds = Object.keys(compoundData).filter(
    key => !stack.some(item => item.compound === key)
  );
  
  // Separate injectables and orals
  const injectables = availableCompounds.filter(key => compoundData[key].type === 'injectable');
  const orals = availableCompounds.filter(key => compoundData[key].type === 'oral');
  const goalLabel = goalPresets[goalPreset]?.label || 'Custom goal';
  const formatMetric = (value, digits = 2) => Number(value ?? 0).toFixed(digits);
  const labViewEnabled = uiMode === 'lab' || Boolean(userProfile?.labMode?.enabled);
  const hasStack = stack.length > 0;
  const activeCycle = savedCycles.find(cycle => cycle.id === activeCycleId) || null;

  const builderOrientationItems = [
    ...(activeCycle
      ? [
          { label: 'Editing', value: activeCycle.name },
          {
            label: 'Cycle goal',
            value: goalPresets[activeCycle.goalPreset]?.label || 'Custom'
          },
          { label: 'Updated', value: formatTimestamp(activeCycle.updatedAt) },
          { label: 'Preset', value: (activeCycle.goalPreset || 'custom').toUpperCase() }
        ]
      : []),
    { label: 'Active goal', value: goalLabel },
    { label: 'Compounds', value: hasStack ? stack.length : 0 },
    { label: 'Final ratio', value: hasStack ? formatMetric(stackMetrics.adjustedRatio) : '—' },
    { label: 'Goal score', value: hasStack ? formatMetric(stackMetrics.goalScore) : '—' }
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
                const guardrail = guardrailMap[item.compound];
                const guardrailTone = guardrail?.beyond
                  ? 'border-physio-error/70 bg-physio-error/10'
                  : guardrail?.plateau
                  ? 'border-physio-warning/70 bg-physio-warning/10'
                  : 'border-physio-bg-border';
                return (
                  <div
                    key={item.compound}
                    className={`flex items-center justify-between p-4 bg-physio-bg-core rounded-lg border ${guardrailTone}`}
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
                        {guardrail && (
                          <div className="text-xs font-semibold mt-1 flex items-center gap-2">
                            {guardrail.plateau && !guardrail.beyond && (
                              <span className="text-physio-warning">
                                Plateau near {guardrail.plateauDose ? guardrail.plateauDose + 'mg' : 'this dose'}
                              </span>
                            )}
                            {guardrail.beyond && (
                              <span className="text-physio-error">
                                Outside evidence {guardrail.hardMax ? '(modeled <= ' + guardrail.hardMax + 'mg)' : ''}
                              </span>
                            )}
                          </div>
                        )}
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
              {guardrailNotices.length > 0 && (
                <div className="mt-4 bg-physio-bg-core border border-physio-warning/40 rounded-lg p-4 text-sm text-physio-text-secondary">
                  <p className="font-semibold text-physio-warning mb-2">Dose guardrails</p>
                  <ul className="space-y-1">
                    {guardrailNotices.map(notice => (
                      <li key={notice.compound} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="text-physio-text-primary font-medium">
                          {compoundData[notice.compound]?.name || notice.compound}
                        </span>
                        <span className="text-xs sm:text-sm">
                          {notice.beyond
                            ? `Requested dose exceeds modeled evidence${notice.hardMax ? ` (cap ${notice.hardMax}mg)` : ''}.`
                            : `Diminishing returns beyond ~${notice.plateauDose || 'current'}mg — mostly risk accumulation.`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
                <span className="font-semibold text-physio-accent-mint text-lg">{formatMetric(stackMetrics.totalBenefit)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
                <span className="text-physio-text-secondary">Total Risk:</span>
                <span className="font-semibold text-physio-error text-lg">{formatMetric(stackMetrics.totalRisk)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
                <span className="text-physio-text-secondary">Benefit:Risk Ratio:</span>
                <span className="font-semibold text-physio-accent-cyan text-lg">{formatMetric(stackMetrics.benefitRiskRatio)}</span>
              </div>
            </div>
            
            {/* Synergy-Adjusted Metrics */}
            <div className="space-y-3">
              <h4 className="font-semibold text-physio-text-secondary mb-2">Synergy-Adjusted Scores</h4>
              <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
                <span className="text-physio-text-secondary">Benefit Synergy:</span>
                <span className={`font-semibold text-lg ${stackMetrics.benefitSynergyPct >= 0 ? 'text-physio-accent-mint' : 'text-physio-error'}`}>
                  {stackMetrics.benefitSynergyPct >= 0 ? '+' : ''}
                  {stackMetrics.benefitSynergyPct.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
                <span className="text-physio-text-secondary">Risk Synergy:</span>
                <span className={`font-semibold text-lg ${stackMetrics.riskSynergyPct <= 0 ? 'text-physio-accent-mint' : 'text-physio-error'}`}>
                  {stackMetrics.riskSynergyPct >= 0 ? '+' : ''}
                  {stackMetrics.riskSynergyPct.toFixed(1)}%
                </span>
              </div>
              <div className="bg-physio-bg-tertiary p-3 rounded mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-physio-text-secondary font-medium">Adjusted Benefit:</span>
                  <span className="font-bold text-physio-accent-mint">{formatMetric(stackMetrics.adjustedBenefit)}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-physio-text-secondary font-medium">Adjusted Risk:</span>
                  <span className="font-bold text-physio-error">{formatMetric(stackMetrics.adjustedRisk)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-physio-accent-cyan">
                  <span className="text-physio-text-secondary font-medium">Final Ratio:</span>
                  <span className="font-bold text-physio-accent-cyan text-lg">{formatMetric(stackMetrics.adjustedRatio)}</span>
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
                {formatMetric(stackMetrics.goalScore)}
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

      <div className="bg-physio-bg-secondary p-6 rounded-lg shadow-sm border border-physio-bg-border space-y-4">
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
            <button
              onClick={handleOpenCycleModal}
              disabled={!hasStack}
              className="px-4 py-2 rounded-md border border-physio-accent-cyan text-physio-accent-cyan font-semibold disabled:border-physio-bg-border disabled:text-physio-text-tertiary"
            >
              Save current cycle
            </button>
            <div className="flex-1">
              <label className="text-xs text-physio-text-tertiary uppercase tracking-wide">Load saved cycle</label>
              <select
                value={loadSelection}
                onChange={e => handleLoadSelectionChange(e.target.value)}
                className="mt-1 w-full bg-physio-bg-tertiary border border-physio-bg-border rounded-md px-3 py-2 text-sm text-physio-text-primary"
              >
                <option value="">Select cycle…</option>
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
          <p className="text-sm text-physio-text-tertiary">No saved cycles yet. Start by building a stack and hit “Save current cycle”.</p>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              {savedCycles.map(cycle => (
                <div
                  key={cycle.id}
                  className={`border rounded-lg p-3 flex items-center justify-between gap-3 ${
                    cycle.id === activeCycleId ? 'border-physio-accent-cyan' : 'border-physio-bg-border'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-physio-text-primary">{cycle.name}</p>
                    <p className="text-xs text-physio-text-tertiary">
                      Goal: {goalPresets[cycle.goalPreset]?.label || 'Custom'} · Updated {formatTimestamp(cycle.updatedAt)}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 rounded-full border border-physio-bg-border text-[10px] text-physio-text-secondary">
                        Preset { (cycle.goalPreset || 'custom').toUpperCase() }
                      </span>
                      {cycle.notes && (
                        <span className="px-2 py-0.5 rounded-full border border-physio-bg-border text-[10px] text-physio-text-secondary">
                          Notes saved
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLoadCycle(cycle.id)}
                      className="text-xs px-2 py-1 rounded border border-physio-accent-mint text-physio-accent-mint font-semibold"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDeleteCycle(cycle.id)}
                      className="text-xs px-2 py-1 rounded border border-physio-error text-physio-error"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {labViewEnabled && (
            <div className="pt-4 border-t border-physio-bg-border space-y-3">
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
                    className="flex-1 bg-physio-bg-tertiary border border-physio-bg-border rounded-md px-3 py-2 text-sm text-physio-text-primary"
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
                    className="flex-1 bg-physio-bg-tertiary border border-physio-bg-border rounded-md px-3 py-2 text-sm text-physio-text-primary"
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
                <div className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-xs text-physio-text-tertiary uppercase tracking-wide">Baseline</p>
                      <p className="text-lg font-semibold text-physio-text-primary">
                        {comparisonResult.baseline.name} · {formatMetric(comparisonResult.baseline.totals.netScore)} net
                      </p>
                    </div>
                    <div className="text-center text-sm text-physio-text-tertiary">vs</div>
                    <div className="text-right">
                      <p className="text-xs text-physio-text-tertiary uppercase tracking-wide">Contender</p>
                      <p className="text-lg font-semibold text-physio-text-primary">
                        {comparisonResult.contender.name} · {formatMetric(comparisonResult.contender.totals.netScore)} net
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-physio-text-secondary">
                    {comparisonResult.deltas.net >= 0 ? 'Adds' : 'Drops'} {formatMetric(Math.abs(comparisonResult.deltas.net))} goal score,
                    with ΔBenefit {comparisonResult.deltas.benefit >= 0 ? '+' : '-'}
                    {formatMetric(Math.abs(comparisonResult.deltas.benefit))} and ΔRisk{' '}
                    {comparisonResult.deltas.risk >= 0 ? '+' : '-'}
                    {formatMetric(Math.abs(comparisonResult.deltas.risk))}.
                  </div>
                  {comparisonNarrative && (
                    <div className="text-xs text-physio-text-tertiary">{comparisonNarrative}</div>
                  )}
                </div>
              )}
            </div>
            )}
          </>
        )}
      </div>

      {cycleModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-physio-bg-secondary border border-physio-bg-border rounded-2xl p-6 w-full max-w-md space-y-4">
            <h4 className="text-xl font-semibold text-physio-text-primary">Save cycle</h4>
            <label className="text-sm text-physio-text-secondary space-y-1">
              Name
              <input
                type="text"
                value={cycleDraft.name}
                onChange={e => setCycleDraft(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-physio-bg-tertiary border border-physio-bg-border rounded-md px-3 py-2 text-sm text-physio-text-primary"
                placeholder="e.g., Spring Recomp 2025"
              />
            </label>
            <label className="text-sm text-physio-text-secondary space-y-1">
              Notes
              <textarea
                value={cycleDraft.notes}
                onChange={e => setCycleDraft(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full bg-physio-bg-tertiary border border-physio-bg-border rounded-md px-3 py-2 text-sm text-physio-text-primary resize-none"
                placeholder="Add reminders about labs, diet, or changes."
              />
            </label>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCycleModalOpen(false)}
                className="px-4 py-2 rounded-md border border-physio-bg-border text-physio-text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSaveCycle}
                className="px-4 py-2 rounded-md bg-physio-accent-cyan text-white font-semibold"
              >
                Save
              </button>
            </div>
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
export { summarizeCycleDelta };
