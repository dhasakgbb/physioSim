import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { compoundData } from '../data/compoundData';
import { getAncillaryProtocol } from '../data/sideFxAndAncillaries';
import { interactionPairs } from '../data/interactionEngineData';
import { defaultProfile } from '../utils/personalization';
import { evaluateStack } from '../utils/stackEngine';
import { loadCycles, saveCycle, deleteCycle } from '../utils/cycleStore';
import PDFExport from './PDFExport';
import GuardrailChip from './GuardrailChip';
import NavigationRail from './NavigationRail';
import DoseSlider from './DoseSlider';
import { deriveDoseWindow } from '../utils/doseWindows';

const stackScoringLabel = 'Net benefit − risk';

const OrientationBar = ({ items, tone = 'default' }) => {
  const toneClasses = tone === 'accent'
    ? 'bg-physio-bg-tertiary/50 border-physio-accent-cyan/30 backdrop-blur-sm'
    : 'bg-physio-bg-core/50 border-physio-bg-border/50 backdrop-blur-sm';

  return (
    <div className="sticky top-3 z-30">
      <div className={`${toneClasses} rounded-2xl px-4 py-2 border flex flex-wrap items-center gap-4 text-xs uppercase tracking-wider text-physio-text-tertiary shadow-lg`}>
        {items.map(({ label, value }, index) => (
          <div key={`${label}-${index}`} className="flex items-center gap-2">
            <span className="font-bold">{label}</span>
            <span className="text-physio-text-primary font-mono normal-case bg-white/5 px-1.5 py-0.5 rounded">
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

const pluralize = (count, singular, plural) => (Math.abs(count) === 1 ? singular : plural);

const formatSignedDelta = (delta, singular, plural) => {
  const abs = Math.abs(delta);
  if (!abs) return null;
  const prefix = delta > 0 ? `+${abs}` : `-${abs}`;
  const noun = pluralize(abs, singular, plural);
  return `${prefix} ${noun}`;
};

const describeAncillaryDelta = (baseline = null, contender = null) => {
  if (!baseline || !contender) return '';
  const essentialDelta = contender.essential.length - baseline.essential.length;
  const recommendedDelta = contender.recommended.length - baseline.recommended.length;
  const monitoringDelta = contender.monitoring.length - baseline.monitoring.length;
  const costDelta = contender.totalWeeklyCost - baseline.totalWeeklyCost;

  const clauses = [];
  const essentialText = formatSignedDelta(essentialDelta, 'essential med', 'essential meds');
  if (essentialText) clauses.push(essentialText);
  const recommendedText = formatSignedDelta(recommendedDelta, 'recommended med', 'recommended meds');
  if (recommendedText) clauses.push(recommendedText);
  const labText = formatSignedDelta(monitoringDelta, 'lab draw', 'lab draws');
  if (labText) clauses.push(labText);

  let sentence = '';
  if (clauses.length) {
    sentence = `Ancillary plan shifts ${clauses.join(', ')}`;
  }

  if (Math.abs(costDelta) >= 1) {
    const costPhrase = costDelta >= 0
      ? `costs an extra $${Math.abs(costDelta).toFixed(2)}/wk`
      : `saves $${Math.abs(costDelta).toFixed(2)}/wk`;
    sentence = sentence ? `${sentence}; ${costPhrase}` : `Ancillary plan ${costPhrase}`;
  }

  return sentence;
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
const StackBuilder = ({ prefillStack, userProfile }) => {
  const [stack, setStack] = useState([]);
  const [selectedCompound, setSelectedCompound] = useState('');
  const [dose, setDose] = useState('');
  const [savedCycles, setSavedCycles] = useState(() => loadCycles());
  const [activeCycleId, setActiveCycleId] = useState(null);
  const [cycleModalOpen, setCycleModalOpen] = useState(false);
  const [cycleDraft, setCycleDraft] = useState({ name: '', notes: '' });
  const [compareSelection, setCompareSelection] = useState({ baseline: '', contender: '' });
  const [loadSelection, setLoadSelection] = useState('');
  const stackRef = useRef(null);
  const compoundSelectId = 'stack-builder-compound';
  const doseInputId = 'stack-builder-dose';
  const builderRef = useRef(null);
  const metricsRef = useRef(null);
  const cyclesRef = useRef(null);
  const ancillaryRef = useRef(null);
  const [stackActiveAnchor, setStackActiveAnchor] = useState('builder');

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
        netScore: stackTotals?.netScore ?? 0
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
        netScore: 0
      };
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

  const guardrailNotices = Object.values(guardrailMap);

  const stackChipContext = useMemo(() => {
    const chips = [];
    chips.push({
      label: 'Scoring',
      value: stackScoringLabel,
      tone: 'muted'
    });
    const netTone = stackMetrics.netScore >= 0 ? 'success' : 'error';
    chips.push({
      label: netTone === 'success' ? 'Favorable' : 'Caution',
      value: `Net ${formatMetric(stackMetrics.netScore)}`,
      tone: netTone
    });
    chips.push({
      label: 'Ratio',
      value: stackMetrics.adjustedRatio ? formatMetric(stackMetrics.adjustedRatio) : '—',
      tone: 'warning'
    });
    if (guardrailNotices.length) {
      const notice = guardrailNotices[0];
      chips.push({
        label: notice.beyond ? 'Outside evidence' : 'Plateau',
        value: notice.compound ? (compoundData[notice.compound]?.abbreviation || notice.compound) : '',
        tone: notice.beyond ? 'error' : 'warning'
      });
    }
    return chips;
  }, [stackMetrics, guardrailNotices, compoundData]);

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
      const ratio = totals.totalRisk > 0 ? totals.totalBenefit / totals.totalRisk : totals.totalBenefit;
      meta[cycle.id] = {
        net,
        ratio,
        tone: net >= 0 ? 'success' : 'error',
        label: net >= 0 ? 'Favorable' : 'Caution'
      };
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
    if (!stack.length) return;
    const activeCycle = savedCycles.find(cycle => cycle.id === activeCycleId);
    setCycleDraft({
      name: activeCycle?.name || `Cycle (${stackScoringLabel})`,
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
      profile: baseline.profile || userProfile || defaultProfile
    });
    const contenderEval = evaluateStack({
      stackInput: contender.stack,
      profile: contender.profile || userProfile || defaultProfile
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
  }, [compareSelection, savedCycles, userProfile]);
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

  useEffect(() => {
    const activeSection = stackAnchors.find(section => section.key === stackActiveAnchor && section.available);
    if (activeSection) return;
    const fallback = stackAnchors.find(section => section.available);
    if (fallback) {
      setStackActiveAnchor(fallback.key);
    }
  }, [stackActiveAnchor, stackAnchors]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let frame = null;
    const determineAnchor = () => {
      frame = null;
      const offset = window.innerWidth < 768 ? 90 : 150;
      let current = stackAnchors.find(section => section.available)?.key || 'builder';
      stackAnchors.forEach(section => {
        if (!section.available || !section.ref?.current) return;
        const rect = section.ref.current.getBoundingClientRect();
        if (rect.top - offset <= 0) {
          current = section.key;
        }
      });
      setStackActiveAnchor(prev => (prev === current ? prev : current));
    };
    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(determineAnchor);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    determineAnchor();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [stackAnchors]);
  
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
    const numericDose = typeof newDose === 'number' ? newDose : parseFloat(newDose);
    if (!Number.isFinite(numericDose) || numericDose < 0) return;
    const roundedDose = Math.round(numericDose * 10) / 10;
    setStack(prevStack =>
      prevStack.map(item =>
        item.compound === compoundKey ? { ...item, dose: roundedDose } : item
      )
    );
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
          size="sm"
          className="w-full"
        />
      </div>
      <section ref={builderRef} className="space-y-5">

        {/* Add Compound Section */}
        <div className="bg-physio-bg-core/30 backdrop-blur-md p-6 rounded-2xl border border-physio-bg-border shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-physio-text-primary flex items-center gap-2">
            <span className="w-1.5 h-6 bg-physio-accent-cyan rounded-full" />
            Build Your Stack
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-physio-text-tertiary uppercase tracking-wide mb-2" htmlFor={compoundSelectId}>
                Select Compound
              </label>
              <select
                id={compoundSelectId}
                value={selectedCompound}
                onChange={(e) => setSelectedCompound(e.target.value)}
                className="w-full px-4 py-3 bg-physio-bg-core border border-physio-bg-border rounded-xl text-physio-text-primary focus:outline-none focus:border-physio-accent-cyan transition-colors"
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
              <label className="block text-xs font-bold text-physio-text-tertiary uppercase tracking-wide mb-2" htmlFor={doseInputId}>
                Dose ({selectedCompound ? selectedUnit : 'mg'})
              </label>
              {selectedCompoundMeta ? (
                <div className="bg-physio-bg-secondary/50 border border-physio-bg-border rounded-xl px-4 py-3">
                  <DoseSlider
                    id={doseInputId}
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
                    ariaLabel="Stack dose selector"
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
                      className="ml-auto w-24 px-2 py-1 rounded border border-physio-bg-border bg-physio-bg-core text-xs text-physio-text-primary text-right"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-physio-text-tertiary py-3 italic">
                  Select a compound to unlock the slider.
                </p>
              )}
            </div>
            
            <div className="flex items-end pb-1">
              <button
                onClick={handleAddCompound}
                disabled={!selectedCompound || !dose}
                className="w-full px-4 py-3 bg-physio-accent-cyan hover:bg-physio-accent-cyan/90 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-physio-accent-cyan/20"
              >
                Add to Stack
              </button>
            </div>
          </div>
        </div>
        
        {/* Current Stack */}
        <div className="bg-physio-bg-core/30 backdrop-blur-md p-6 rounded-2xl border border-physio-bg-border shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-physio-text-primary flex items-center gap-2">
             <span className="w-1.5 h-6 bg-physio-accent-violet rounded-full" />
             Current Stack
          </h3>
          
          {stack.length === 0 ? (
            <div className="text-physio-text-tertiary text-center py-12 border-2 border-dashed border-physio-bg-border/50 rounded-xl">
              No compounds in stack. Add compounds above to get started.
            </div>
          ) : (
            <div className="grid gap-3">
              {stack.map(item => {
                const compound = compoundData[item.compound];
                const guardrail = guardrailMap[item.compound];
                const guardrailTone = guardrail?.beyond
                  ? 'border-physio-error/50 bg-physio-error/5'
                  : guardrail?.plateau
                  ? 'border-physio-warning/50 bg-physio-warning/5'
                  : 'border-physio-bg-border/50 bg-physio-bg-secondary/30';
                const doseWindow = deriveDoseWindow(item.compound);
                const sliderMarkers = [
                  doseWindow.base
                    ? { value: doseWindow.base, label: 'Sweet spot', tone: 'accent' }
                    : null,
                  guardrail?.plateauDose
                    ? { value: guardrail.plateauDose, label: 'Plateau', tone: 'warning' }
                    : null,
                  guardrail?.hardMax
                    ? { value: guardrail.hardMax, label: 'Evidence', tone: 'error' }
                    : null
                ].filter(Boolean);
                const unitLabel = compound.type === 'oral' ? 'mg/day' : 'mg/wk';
                return (
                  <div
                    key={item.compound}
                    className={`p-4 rounded-xl border backdrop-blur-sm transition-all hover:border-physio-bg-border ${guardrailTone}`}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                            style={{ backgroundColor: compound.color, color: '#fff' }}
                          >
                            <span className="font-bold text-xs opacity-80">{compound.abbreviation.slice(0,2)}</span>
                          </div>
                          <div>
                            <div className="font-bold text-lg text-physio-text-primary">{compound.name}</div>
                            <div className="text-xs text-physio-text-tertiary uppercase tracking-wider">
                              {compound.type === 'oral' ? 'Oral' : 'Injectable'} • {compound.abbreviation}
                            </div>
                            {guardrail && (
                              <div className="text-[10px] font-bold uppercase tracking-wide mt-1 flex flex-wrap items-center gap-2">
                                {guardrail.plateau && !guardrail.beyond && (
                                  <span className="text-physio-warning bg-physio-warning/10 px-1.5 py-0.5 rounded">
                                    Plateau near {guardrail.plateauDose ? guardrail.plateauDose + 'mg' : 'this dose'}
                                  </span>
                                )}
                                {guardrail.beyond && (
                                  <span className="text-physio-error bg-physio-error/10 px-1.5 py-0.5 rounded">
                                    Outside evidence {guardrail.hardMax ? '(modeled <= ' + guardrail.hardMax + 'mg)' : ''}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveCompound(item.compound)}
                          className="px-3 py-1.5 bg-physio-bg-core border border-physio-bg-border text-physio-text-secondary rounded-lg hover:text-physio-error hover:border-physio-error transition-colors text-xs font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="bg-physio-bg-core/40 rounded-lg p-3 border border-physio-bg-border/30">
                        <DoseSlider
                          id={`stack-dose-${item.compound}`}
                          value={item.dose}
                          min={doseWindow.min}
                          max={doseWindow.max}
                          step={compound.type === 'oral' ? 2 : 10}
                          unit={unitLabel}
                          markers={sliderMarkers}
                          ariaLabel={`${compound.name} dose`}
                          onChange={(nextValue) => handleUpdateDose(item.compound, nextValue)}
                        />
                        <div className="flex justify-between items-end mt-2">
                          <span className="text-[10px] text-physio-text-tertiary uppercase tracking-wide">
                            Range {doseWindow.min}-{doseWindow.max} mg
                          </span>
                          <div className="flex items-baseline gap-1">
                             <span className="text-lg font-bold text-physio-text-primary">{item.dose}</span>
                             <span className="text-xs text-physio-text-secondary">{unitLabel}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section ref={metricsRef}>
        {/* Stack Metrics */}
        {stack.length > 0 && (
          <div className="bg-physio-bg-core/30 backdrop-blur-md p-6 rounded-2xl border border-physio-bg-border shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
              <h3 className="text-xl font-semibold text-physio-text-primary flex items-center gap-2">
                <span className="w-1.5 h-6 bg-physio-accent-mint rounded-full" />
                Stack Metrics
              </h3>
              <div className="text-right">
                <span className="block text-[10px] uppercase tracking-wider text-physio-text-tertiary">Net Score</span>
                <span className={`text-2xl font-bold ${parseFloat(stackMetrics.netScore) >= 0 ? 'text-physio-accent-cyan' : 'text-physio-error'}`}>
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
                <span className="font-mono text-physio-accent-mint">{formatMetric(stackMetrics.totalBenefit)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-physio-text-secondary text-sm">Total Risk</span>
                <span className="font-mono text-physio-error">{formatMetric(stackMetrics.totalRisk)}</span>
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
                <span className={`font-mono font-bold ${stackMetrics.benefitSynergyPct >= 0 ? 'text-physio-accent-mint' : 'text-physio-error'}`}>
                  {stackMetrics.benefitSynergyPct >= 0 ? '+' : ''}
                  {stackMetrics.benefitSynergyPct.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-physio-text-secondary text-sm">Risk Synergy</span>
                <span className={`font-mono font-bold ${stackMetrics.riskSynergyPct <= 0 ? 'text-physio-accent-mint' : 'text-physio-error'}`}>
                  {stackMetrics.riskSynergyPct >= 0 ? '+' : ''}
                  {stackMetrics.riskSynergyPct.toFixed(1)}%
                </span>
              </div>
              
              <div className="bg-physio-bg-secondary/50 p-4 rounded-xl border border-physio-bg-border/50 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs uppercase tracking-wide text-physio-text-secondary">Adj. Benefit</span>
                  <span className="font-bold text-physio-accent-mint">{formatMetric(stackMetrics.adjustedBenefit)}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs uppercase tracking-wide text-physio-text-secondary">Adj. Risk</span>
                  <span className="font-bold text-physio-error">{formatMetric(stackMetrics.adjustedRisk)}</span>
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
                { label: 'Scoring', value: stackScoringLabel },
                { label: 'Compounds', value: stack.length },
                { label: 'Adjusted ratio', value: stackMetrics.adjustedRatio },
                { label: 'Net score', value: stackMetrics.netScore }
              ]
            }}
            badgeContext={stackChipContext}
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
            <button
              onClick={handleOpenCycleModal}
              disabled={!hasStack}
              className="px-4 py-2 rounded-lg border border-physio-accent-cyan/50 text-physio-accent-cyan font-semibold hover:bg-physio-accent-cyan/10 transition-colors disabled:border-physio-bg-border disabled:text-physio-text-tertiary disabled:bg-transparent"
            >
              Save current cycle
            </button>
            <div className="flex-1">
              <select
                value={loadSelection}
                onChange={e => handleLoadSelectionChange(e.target.value)}
                className="w-full bg-physio-bg-secondary border border-physio-bg-border rounded-lg px-3 py-2 text-sm text-physio-text-primary focus:outline-none focus:border-physio-accent-cyan"
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
                    className={`border rounded-xl p-4 flex items-center justify-between gap-3 bg-physio-bg-secondary/30 ${
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
                            <GuardrailChip
                              size="sm"
                              tone={meta.tone}
                              label={meta.label}
                              detail={`Net ${formatMetric(meta.net)}`}
                            />
                            <GuardrailChip
                              size="sm"
                              tone="warning"
                              label="Ratio"
                              detail={Number.isFinite(meta.ratio) ? formatMetric(meta.ratio) : '—'}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLoadCycle(cycle.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-physio-accent-mint/30 text-physio-accent-mint hover:bg-physio-accent-mint/10 transition-colors font-semibold"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDeleteCycle(cycle.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-physio-error/30 text-physio-error hover:bg-physio-error/10 transition-colors"
                    >
                      Delete
                    </button>
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
                    className="flex-1 bg-physio-bg-secondary border border-physio-bg-border rounded-lg px-3 py-2 text-sm text-physio-text-primary"
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
                    className="flex-1 bg-physio-bg-secondary border border-physio-bg-border rounded-lg px-3 py-2 text-sm text-physio-text-primary"
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
                <div className="bg-physio-bg-secondary/50 border border-physio-bg-border rounded-xl p-5 space-y-3">
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
                    {comparisonResult.deltas.net >= 0 ? 'Adds' : 'Drops'} <strong className={comparisonResult.deltas.net >= 0 ? 'text-physio-accent-mint' : 'text-physio-error'}>{formatMetric(Math.abs(comparisonResult.deltas.net))}</strong> net score,
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

export default StackBuilder;
export { summarizeCycleDelta };
