import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  interactionPairs,
  interactionHeatmapModes,
  interactionDimensions,
  defaultSensitivities,
  goalPresets,
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
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import PDFExport from './PDFExport';

const uniqueCompounds = Array.from(
  new Set(Object.values(interactionPairs).flatMap(pair => pair.compounds))
);

const heatmapColorScale = (value, maxValue, mode) => {
  if (maxValue === 0) return '#e5e7eb';
  const normalized = Math.min(value / maxValue, 1);
  if (mode === 'benefit') {
    return `rgba(14,165,233,${0.2 + normalized * 0.8})`;
  }
  if (mode === 'risk') {
    return `rgba(248,113,113,${0.2 + normalized * 0.8})`;
  }
  return `rgba(168,85,247,${0.2 + normalized * 0.8})`;
};

const SurfaceCell = ({ score, marker }) => {
  const capped = Math.max(Math.min(score, 5), -5);
  const hue = capped >= 0 ? 190 : 0;
  const intensity = Math.min(Math.abs(capped) / 5, 1);
  const alpha = 0.2 + intensity * 0.6;
  const color = `hsla(${hue}, 80%, 60%, ${alpha})`;

  return (
    <div
      className="relative w-5 h-5 md:w-6 md:h-6 flex items-center justify-center"
      style={{ backgroundColor: color, border: '1px solid rgba(255,255,255,0.05)' }}
      title={`${score.toFixed(1)} net`}
    >
      {marker && (
        <span className="text-[10px] font-semibold text-white drop-shadow">
          {marker}
        </span>
      )}
    </div>
  );
};

const SectionDivider = () => (
  <div className="h-px bg-physio-bg-border/60 w-full my-2" role="presentation" aria-hidden="true"></div>
);

const DrawerChevron = ({ open }) => (
  <svg
    className={`w-4 h-4 text-physio-text-tertiary transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
      clipRule="evenodd"
    />
  </svg>
);

const defaultHeatmapControls = {
  heatmapMode: 'benefit',
  goalPreset: 'lean_mass',
  evidenceBlend: 0.35
};

const InteractionHeatmap = ({
  userProfile,
  onPrefillStack,
  resetSignal = 0,
  onFiltersDirtyChange,
  uiMode = 'simple'
}) => {
  const pairIds = Object.keys(interactionPairs);
  const [selectedPairId, setSelectedPairId] = useState(pairIds[0]);
  const [heatmapMode, setHeatmapMode] = useState(defaultHeatmapControls.heatmapMode);
  const [focusPinned, setFocusPinned] = useState(false);
  const [sensitivities, setSensitivities] = useState(() => ({ ...defaultSensitivities }));
  const [evidenceBlend, setEvidenceBlend] = useState(defaultHeatmapControls.evidenceBlend);
  const [goalPreset, setGoalPreset] = useState(defaultHeatmapControls.goalPreset);
  const [customGoal, setCustomGoal] = useState('lean_mass');
  const [customSelection, setCustomSelection] = useState('');
  const [customCompounds, setCustomCompounds] = useState([]);
  const [customRanges, setCustomRanges] = useState({});
  const [customResults, setCustomResults] = useState([]);
  const [highlightedBand, setHighlightedBand] = useState(null);
  const labUnlocked = uiMode === 'lab' || Boolean(userProfile?.labMode?.enabled);
  const [optimizerCollapsed, setOptimizerCollapsed] = useState(() => !labUnlocked);
  const [contextCollapsed, setContextCollapsed] = useState(true);
  const [heatmapCompact, setHeatmapCompact] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState('matrix');
  const pairDetailRef = useRef(null);
  const controlsSectionRef = useRef(null);
  const heatmapRef = useRef(null);
  const metricsRef = useRef(null);
  const chartsRef = useRef(null);
  const surfacesRef = useRef(null);
  const optimizersRef = useRef(null);

  const allCompoundKeys = useMemo(() => Object.keys(compoundData), []);
  useEffect(() => {
    if (!labUnlocked) {
      setOptimizerCollapsed(true);
    }
  }, [labUnlocked]);

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
    setActiveAnchor('matrix');
  };

  const scrollToSection = useCallback(
    (ref, keyOverride = null) => {
      if (typeof window === 'undefined' || !ref?.current) return;
      const offset = window.innerWidth < 768 ? 64 : 96;
      const targetTop = ref.current.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth'
      });
      if (keyOverride) {
        setActiveAnchor(keyOverride);
      }
    },
    []
  );

  const pairOptions = useMemo(
    () =>
      Object.values(interactionPairs).map(pair => ({
        id: pair.id,
        label: pair.label
      })).sort((a, b) => a.label.localeCompare(b.label)),
    []
  );
  const anchorSections = useMemo(
    () => [
      { key: 'matrix', label: 'Matrix', ref: heatmapRef, available: true },
      { key: 'controls', label: 'Controls', ref: controlsSectionRef, available: true },
      { key: 'metrics', label: 'Metrics', ref: metricsRef, available: true },
      { key: 'charts', label: 'Charts', ref: chartsRef, available: labUnlocked },
      { key: 'surfaces', label: 'Surfaces', ref: surfacesRef, available: labUnlocked },
      { key: 'optimizers', label: 'Optimizers', ref: optimizersRef, available: labUnlocked }
    ],
    [labUnlocked, heatmapRef, controlsSectionRef, metricsRef, chartsRef, surfacesRef, optimizersRef]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let frame = null;
    const evaluateActiveAnchor = () => {
      frame = null;
      const offset = window.innerWidth < 768 ? 80 : 140;
      let current = null;
      anchorSections.forEach(section => {
        if (!section.available || !section.ref?.current) return;
        const rect = section.ref.current.getBoundingClientRect();
        if (rect.top - offset <= 0) {
          current = section.key;
        }
      });
      if (!current) {
        const fallback = anchorSections.find(section => section.available)?.key || 'matrix';
        current = fallback;
      }
      setActiveAnchor(prev => (prev === current ? prev : current));
    };
    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(evaluateActiveAnchor);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    evaluateActiveAnchor();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [anchorSections]);

  const selectedPair = interactionPairs[selectedPairId];
  const dimensionKeys = useMemo(() => {
    const keys = new Set();
    Object.keys(selectedPair?.synergy || {}).forEach(k => keys.add(k));
    Object.keys(selectedPair?.penalties || {}).forEach(k => keys.add(k));
    return Array.from(keys);
  }, [selectedPair]);

  const [selectedDimension, setSelectedDimension] = useState(selectedPair?.defaultDimension || dimensionKeys[0] || null);
  const [primaryCompound, setPrimaryCompound] = useState(selectedPair?.compounds[0]);
  const [doses, setDoses] = useState(() => ({ ...selectedPair?.defaultDoses }));

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
    setHighlightedBand(null);
    if (controlsSectionRef.current) {
      setTimeout(() => {
        scrollToSection(controlsSectionRef, 'controls');
      }, 200);
    }
  };

  const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);

  const deriveDefaultRange = (compoundKey) => {
    const compound = compoundData[compoundKey];
    if (!compound) return { min: 0, max: 1000, base: 0 };
    const curve = compound.benefitCurve || [];
    const positivePoint = curve.find(point => point.dose > 0);
    const minDose = positivePoint?.dose ?? curve[0]?.dose ?? 0;
    const maxDose = curve[curve.length - 1]?.dose ?? (minDose + 500);
    const baseDose = clampValue(
      compound.type === 'oral' ? Math.min(maxDose, Math.max(minDose, 40)) : (minDose + maxDose) / 2,
      minDose,
      maxDose
    );
    return {
      min: Math.round(minDose),
      max: Math.round(maxDose),
      base: Math.round(baseDose)
    };
  };

  const handleAddCustomCompound = () => {
    if (!customSelection || customCompounds.includes(customSelection) || customCompounds.length >= 4) return;
    const defaults = deriveDefaultRange(customSelection);
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

  const handleCustomRangeChange = (compoundKey, field, value) => {
    setCustomRanges(prev => ({
      ...prev,
      [compoundKey]: {
        ...prev[compoundKey],
        [field]: Number(value)
      }
    }));
  };

  const handleRunCustomOptimizer = () => {
    if (!customCompounds.length) return;
    const combo = {
      id: `custom-${Date.now()}`,
      label: 'Custom Stack',
      narrative: 'User-defined stack blueprint',
      compounds: customCompounds,
      doseRanges: customCompounds.reduce((acc, key) => {
        const settings = customRanges[key] || deriveDefaultRange(key);
        acc[key] = [settings.min, settings.max];
        return acc;
      }, {}),
      defaultDoses: customCompounds.reduce((acc, key) => {
        const settings = customRanges[key] || deriveDefaultRange(key);
        acc[key] = settings.base;
        return acc;
      }, {}),
      steps: 3,
      goal: customGoal
    };
    const results = generateCustomStackResults({
      combo,
      profile: userProfile,
      goalOverride: customGoal
    });
    setCustomResults(results);
  };

  useEffect(() => {
    if (!selectedPair) return;
    if (!selectedDimension || !dimensionKeys.includes(selectedDimension)) {
      setSelectedDimension(selectedPair.defaultDimension || dimensionKeys[0] || null);
    }
  }, [selectedPair, dimensionKeys, selectedDimension]);

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
      evidenceBlend,
      presetKey: goalPreset
    });
  }, [selectedPairId, userProfile, sensitivities, evidenceBlend, goalPreset, selectedPair]);

  const surfaceRows = useMemo(() => {
    if (!selectedPair) return [];
    const [compoundA, compoundB] = selectedPair.compounds;
    const grouped = surfaceData.reduce((acc, point) => {
      const key = point[compoundB];
      if (!acc[key]) acc[key] = [];
      acc[key].push(point);
      return acc;
    }, {});
    return Object.keys(grouped)
      .sort((a, b) => Number(b) - Number(a))
      .map(rowKey => grouped[rowKey].sort((a, b) => a[compoundA] - b[compoundA]));
  }, [surfaceData, selectedPair]);

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

  const activeFocusLabel = useMemo(() => {
    const activeMode = interactionHeatmapModes.find(mode => mode.key === heatmapMode);
    return activeMode?.label || 'Focus';
  }, [heatmapMode]);

  const maxHeatmapValue = Math.max(...Object.values(heatmapValues));

  const updateDose = (compoundKey, value) => {
    setDoses(prev => ({
      ...prev,
      [compoundKey]: Number(value)
    }));
  };

  const updateSensitivity = (key, value) => {
    setSensitivities(prev => ({
      ...prev,
      [key]: Number(value)
    }));
  };

  const selectedSurfacePair = interactionPairs[selectedPairId];
  const [compoundAKey, compoundBKey] = selectedPair?.compounds || [];
  const secondarySummary = selectedPair
    ? selectedPair.compounds
        .filter(c => c !== primaryCompound)
        .map(c => `${compoundData[c]?.abbreviation || c} fixed @ ${doses?.[c] ?? selectedPair.defaultDoses?.[c] ?? 0}mg`)
        .join(', ')
    : '';

  const recommendations = useMemo(() => {
    if (!selectedPair) return [];
    const seen = new Set();
    const sorted = [...surfaceData].sort((a, b) => b.score - a.score);
    const top = [];
    for (const point of sorted) {
      const key = `${point[compoundAKey]}-${point[compoundBKey]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      top.push(point);
      if (top.length >= 4) break;
    }
    return top;
  }, [surfaceData, selectedPair, compoundAKey, compoundBKey]);

  const limitedRecommendations = useMemo(
    () => (labUnlocked ? recommendations : recommendations.slice(0, 2)),
    [recommendations, labUnlocked]
  );
  const displayedRecommendations = labUnlocked ? recommendations : limitedRecommendations;

  useEffect(() => {
    setHighlightedBand(null);
  }, [selectedPairId, primaryCompound]);

  useEffect(() => {
    if (labUnlocked) return;
    setCustomCompounds([]);
    setCustomRanges({});
    setCustomResults([]);
    setCustomSelection('');
    setHighlightedBand(null);
  }, [labUnlocked]);

  const setHighlightFromPoint = useCallback(
    point => {
      if (!selectedPair || !point || !primaryCompound) return;
      const [minRange, maxRange] = selectedPair?.doseRanges?.[primaryCompound] || [0, 1000];
      const centerDose = point[primaryCompound];
      if (typeof centerDose !== 'number') return;
      const span = Math.max((maxRange - minRange) * 0.05, 15);
      setHighlightedBand({
        primaryCompound,
        min: clampValue(centerDose - span, minRange, maxRange),
        max: clampValue(centerDose + span, minRange, maxRange)
      });
    },
    [primaryCompound, selectedPair]
  );

  const handleRecommendationInspect = useCallback(
    (point) => {
      if (!point) return;
      setHighlightFromPoint(point);
      scrollToSection(controlsSectionRef, 'controls');
    },
    [controlsSectionRef, scrollToSection, setHighlightFromPoint]
  );

  const handleRecommendationKeyDown = (event, point) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRecommendationInspect(point);
    }
  };

  const handleSendCurrentToStack = () => {
    if (!selectedPair || !onPrefillStack) return;
    const payload = selectedPair.compounds.map(key => ({
      compound: key,
      dose: doses?.[key] ?? selectedPair.defaultDoses?.[key] ?? 0
    }));
    onPrefillStack(payload);
  };

  const handleSendRecommendation = (point) => {
    if (!selectedPair || !onPrefillStack) return;
    const payload = selectedPair.compounds.map(key => ({
      compound: key,
      dose: point[key]
    }));
    onPrefillStack(payload);
  };

  const handleToggleFocusPin = () => {
    setFocusPinned(prev => {
      if (prev) {
        removeStorageKey(HEATMAP_FOCUS_PIN_KEY);
        return false;
      }
      writeJSONStorage(HEATMAP_FOCUS_PIN_KEY, {
        mode: heatmapMode,
        pinnedAt: Date.now()
      });
      return true;
    });
  };

  const tooltipFormatter = (value, name) => {
    if (name === 'Interaction Total') return [`${value.toFixed(2)}`, 'With Interaction'];
    if (name === 'Naïve Sum') return [`${value.toFixed(2)}`, 'Without Interaction'];
    return [`${value.toFixed(2)}`, name];
  };

  const customAvailableCompounds = useMemo(
    () => allCompoundKeys.filter(key => !customCompounds.includes(key)),
    [allCompoundKeys, customCompounds]
  );

  const stackResults = useMemo(
    () =>
      generateStackOptimizerResults({
        profile: userProfile,
        goalOverride: goalPreset
      }),
    [userProfile, goalPreset]
  );

  const pairEvaluation = useMemo(() => {
    if (!selectedPair) return null;
    const payload = selectedPair.compounds.map(compoundKey => ({
      compound: compoundKey,
      dose: doses?.[compoundKey] ?? selectedPair.defaultDoses?.[compoundKey] ?? 0
    }));
    const profile = userProfile || defaultProfile;
    return evaluateStack({
      stackInput: payload,
      profile,
      goalKey: goalPreset
    });
  }, [selectedPair, doses, userProfile, goalPreset]);

  const guardrailByCompound = pairEvaluation?.byCompound || {};
  const guardrailBadge = useMemo(() => {
    if (!selectedPair) return null;
    const statuses = selectedPair.compounds.map(compoundKey => {
      const compoundEval = guardrailByCompound[compoundKey];
      const benefitMeta = compoundEval?.meta?.benefit;
      const riskMeta = compoundEval?.meta?.risk;
      return {
        compoundKey,
        beyond: Boolean(benefitMeta?.beyondEvidence || riskMeta?.beyondEvidence),
        plateau: Boolean(benefitMeta?.nearingPlateau || riskMeta?.nearingPlateau)
      };
    });
    const labelize = keys =>
      keys
        .map(code => compoundData[code]?.abbreviation || compoundData[code]?.name || code)
        .join(', ');
    const beyondKeys = statuses.filter(entry => entry.beyond).map(entry => entry.compoundKey);
    if (beyondKeys.length) {
      return {
        tone: 'error',
        label: 'Outside evidence',
        detail: labelize(beyondKeys)
      };
    }
    const plateauKeys = statuses.filter(entry => entry.plateau).map(entry => entry.compoundKey);
    if (plateauKeys.length) {
      return {
        tone: 'warning',
        label: 'Plateau guardrail',
        detail: labelize(plateauKeys)
      };
    }
    return {
      tone: 'muted',
      label: 'Guardrails nominal',
      detail: labelize(selectedPair.compounds)
    };
  }, [guardrailByCompound, selectedPair]);
  const guardrailToneStyles = {
    error: 'text-physio-error border-physio-error/40 bg-physio-error/5',
    warning: 'text-physio-warning border-physio-warning/40 bg-physio-warning/5',
    muted: 'text-physio-text-tertiary border-physio-bg-border bg-physio-bg-core'
  };

  useEffect(() => {
    if (labUnlocked || !selectedPair) return;
    setDoses(prev => {
      let changed = false;
      const next = { ...prev };
      selectedPair.compounds.forEach(compoundKey => {
        const compoundEval = guardrailByCompound[compoundKey];
        const benefitMeta = compoundEval?.meta?.benefit;
        const riskMeta = compoundEval?.meta?.risk;
        const hardMax = benefitMeta?.hardMax || riskMeta?.hardMax;
        if (hardMax && next[compoundKey] > hardMax) {
          next[compoundKey] = hardMax;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [guardrailByCompound, labUnlocked, selectedPair]);
  const pairTotals = pairEvaluation?.totals || null;
  const baseBenefitValue = Number(pairTotals?.baseBenefit ?? 0);
  const baseRiskValue = Number(pairTotals?.baseRisk ?? 0);
  const adjustedBenefitValue = Number(pairTotals?.totalBenefit ?? baseBenefitValue);
  const adjustedRiskValue = Number(pairTotals?.totalRisk ?? baseRiskValue);
  const benefitDelta = adjustedBenefitValue - baseBenefitValue;
  const riskDelta = adjustedRiskValue - baseRiskValue;

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

  const benefitSynergyPercent = baseBenefitValue > 0 ? (benefitDelta / baseBenefitValue) * 100 : 0;
  const riskSynergyPercent = baseRiskValue > 0 ? (riskDelta / baseRiskValue) * 100 : 0;
  const surfaceMarkerMap = useMemo(() => {
    const map = new Map();
    if (!compoundAKey || !compoundBKey) return map;
    displayedRecommendations.forEach((point, idx) => {
      const key = `${point[compoundAKey]}-${point[compoundBKey]}`;
      map.set(key, idx + 1);
    });
    return map;
  }, [displayedRecommendations, compoundAKey, compoundBKey]);
  const currentPrimaryDose =
    doses?.[primaryCompound] ?? selectedPair?.defaultDoses?.[primaryCompound] ?? 0;
  const pairEvidence = selectedPair?.evidence || {};
  const evidenceTotalWeight = (pairEvidence.clinical ?? 0) + (pairEvidence.anecdote ?? 0);
  const clinicalShare = evidenceTotalWeight
    ? Math.round(((pairEvidence.clinical ?? 0) / evidenceTotalWeight) * 100)
    : Math.round((1 - evidenceBlend) * 100);
  const anecdoteShare = 100 - clinicalShare;
  const netRatio = adjustedRiskValue > 0 ? (adjustedBenefitValue / adjustedRiskValue).toFixed(2) : '—';
  useEffect(() => {
    const storedControls = readJSONStorage(INTERACTION_CONTROL_STORAGE_KEY, null);
    if (storedControls) {
      if (storedControls.goalPreset) setGoalPreset(storedControls.goalPreset);
      if (typeof storedControls.evidenceBlend === 'number') setEvidenceBlend(storedControls.evidenceBlend);
    }
    const pinnedFocus = readJSONStorage(HEATMAP_FOCUS_PIN_KEY, null);
    if (pinnedFocus?.mode) {
      setFocusPinned(true);
      setHeatmapMode(pinnedFocus.mode);
    } else if (storedControls?.heatmapMode) {
      // Migration path for older persisted focus settings
      setHeatmapMode(storedControls.heatmapMode);
    }
  }, []);

  useEffect(() => {
    writeJSONStorage(INTERACTION_CONTROL_STORAGE_KEY, {
      goalPreset,
      evidenceBlend
    });
  }, [goalPreset, evidenceBlend]);

  useEffect(() => {
    if (!focusPinned) return;
    writeJSONStorage(HEATMAP_FOCUS_PIN_KEY, {
      mode: heatmapMode,
      pinnedAt: Date.now()
    });
  }, [focusPinned, heatmapMode]);

  useEffect(() => {
    const dirty =
      heatmapMode !== defaultHeatmapControls.heatmapMode ||
      goalPreset !== defaultHeatmapControls.goalPreset ||
      evidenceBlend !== defaultHeatmapControls.evidenceBlend;
    onFiltersDirtyChange?.(dirty);
  }, [heatmapMode, goalPreset, evidenceBlend, onFiltersDirtyChange]);

  useEffect(() => {
    const pinnedFocus = focusPinned ? readJSONStorage(HEATMAP_FOCUS_PIN_KEY, null) : null;
    const nextMode = pinnedFocus?.mode || defaultHeatmapControls.heatmapMode;
    setHeatmapMode(nextMode);
    setGoalPreset(defaultHeatmapControls.goalPreset);
    setEvidenceBlend(defaultHeatmapControls.evidenceBlend);
    setContextCollapsed(true);
    removeStorageKey(INTERACTION_CONTROL_STORAGE_KEY);
    if (!focusPinned) {
      removeStorageKey(HEATMAP_FOCUS_PIN_KEY);
    }
  }, [resetSignal, focusPinned]);

  const heatmapSectionClasses =
    `bg-physio-bg-secondary border border-physio-bg-border rounded-2xl shadow-lg lg:sticky lg:top-4 lg:z-20 transition-all duration-200 ${heatmapCompact ? 'p-4 space-y-4' : 'p-6 space-y-6'}`;

  return (
    <div className="space-y-8">
      {/* Heatmap / Overview */}
      <section ref={heatmapRef} className={heatmapSectionClasses}>
        <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${heatmapCompact ? 'text-sm' : ''}`}>
          <div>
            <h2 className={`${heatmapCompact ? 'text-xl' : 'text-2xl'} font-bold text-physio-text-primary`}>
              Interaction Matrix
            </h2>
            {!heatmapCompact && (
              <p className="text-sm text-physio-text-secondary">
                Click a cell to load dose-aware synergy modeling for that pair.
              </p>
            )}
          </div>
          {heatmapCompact && (
            <button
              type="button"
              onClick={scrollToMatrix}
              className="px-3 py-1.5 rounded-full border border-physio-bg-border text-xs font-semibold text-physio-text-secondary hover:border-physio-accent-cyan hover:text-physio-accent-cyan transition"
            >
              Back to matrix
            </button>
          )}
        </div>
        {heatmapCompact && selectedPair && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-physio-text-tertiary">
            <span className="font-semibold text-physio-text-primary">{selectedPair.label}</span>
            <span className="px-2 py-0.5 rounded-full bg-physio-bg-core border border-physio-bg-border">
              {goalPresets[goalPreset]?.label || 'Goal'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-physio-bg-core border border-physio-bg-border">
              {clinicalShare}% clinical · {anecdoteShare}% anecdote
            </span>
            <span className="px-2 py-0.5 rounded-full bg-physio-bg-core border border-physio-bg-border text-physio-accent-mint">
              Δ Benefit {benefitSynergyPercent.toFixed(1)}%
            </span>
            <span className="px-2 py-0.5 rounded-full bg-physio-bg-core border border-physio-bg-border text-physio-error">
              Δ Risk {riskSynergyPercent.toFixed(1)}%
            </span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-4 text-xs text-physio-text-secondary">
          <div className="flex flex-wrap gap-4">
            {Object.entries(heatmapScores)
              .filter(([key]) => key !== 'same')
              .map(([key, score]) => (
                <div key={key} className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 flex items-center justify-center rounded-full text-physio-text-primary font-semibold"
                    style={{ backgroundColor: score.color }}
                  >
                    {score.symbol}
                  </span>
                  <span>{score.label}</span>
                </div>
              ))}
          </div>
          <div className="text-xs text-physio-text-tertiary">
            0.00 ≈ neutral • 0.30+ = strong swing
          </div>
        </div>

        <div className={`bg-physio-bg-core/70 border border-physio-bg-border rounded-2xl flex flex-col ${heatmapCompact ? 'p-3 gap-3' : 'p-4 gap-4'}`}>
          <div className={`flex flex-wrap items-center gap-3 ${heatmapCompact ? 'text-[11px]' : ''}`}>
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-wide text-physio-text-tertiary">Heatmap focus</p>
              <button
                type="button"
                onClick={handleToggleFocusPin}
                aria-pressed={focusPinned}
                className={`px-2 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wide transition ${
                  focusPinned
                    ? 'border-physio-accent-cyan text-physio-accent-cyan bg-physio-bg-core shadow-physio-subtle'
                    : 'border-physio-bg-border text-physio-text-tertiary hover:text-physio-text-primary'
                }`}
                title={focusPinned ? `Pinned to ${activeFocusLabel}` : 'Pin your preferred focus'}
              >
                {focusPinned ? `Pinned · ${activeFocusLabel}` : 'Pin focus'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {interactionHeatmapModes.map(mode => (
                <button
                  key={mode.key}
                  onClick={() => setHeatmapMode(mode.key)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition ${
                    heatmapMode === mode.key
                      ? 'border-physio-accent-cyan text-physio-accent-cyan bg-physio-bg-secondary'
                      : 'border-physio-bg-border text-physio-text-tertiary hover:text-physio-text-primary'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
          <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between ${heatmapCompact ? 'gap-2' : 'gap-3 lg:gap-4'}`}>
            <label className="flex items-center gap-2 text-sm text-physio-text-secondary">
              Goal preset
              <select
                value={goalPreset}
                onChange={e => setGoalPreset(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-physio-bg-border bg-physio-bg-core text-physio-text-primary text-sm"
              >
                {Object.entries(goalPresets).map(([key, preset]) => (
                  <option key={key} value={key}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex-1 text-sm text-physio-text-secondary">
              Evidence weighting
              <div className="mt-1 flex items-center gap-3">
                <span className="text-xs text-physio-text-tertiary whitespace-nowrap">
                  Clinical {(1 - evidenceBlend) * 100 >> 0}%
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={evidenceBlend}
                  onChange={e => setEvidenceBlend(Number(e.target.value))}
                  className={`flex-1 ${!labUnlocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                  disabled={!labUnlocked}
                />
                <span className="text-xs text-physio-text-tertiary whitespace-nowrap">
                  Anecdote {(evidenceBlend) * 100 >> 0}%
                </span>
              </div>
              {!labUnlocked && (
                <p className="mt-1 text-[11px] font-semibold text-physio-text-tertiary">
                  Lab mode unlocks custom evidence weighting.
                </p>
              )}
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid gap-0" style={{ gridTemplateColumns: `140px repeat(${uniqueCompounds.length}, 100px)` }}>
              <div className="h-14"></div>
              {uniqueCompounds.map(key => (
                <div
                  key={key}
                  className="h-14 flex items-center justify-center text-sm font-semibold border border-physio-bg-border bg-physio-bg-core"
                  style={{ color: compoundData[key]?.color || '#fff' }}
                >
                  {compoundData[key]?.abbreviation || key}
                </div>
              ))}

              {uniqueCompounds.map(row => (
                <React.Fragment key={row}>
                  <div
                    className="h-14 flex items-center justify-center text-sm font-semibold border border-physio-bg-border bg-physio-bg-core"
                    style={{ color: compoundData[row]?.color || '#fff' }}
                  >
                    {compoundData[row]?.abbreviation || row}
                  </div>
                  {uniqueCompounds.map(col => {
                    const pair = Object.values(interactionPairs).find(p =>
                      (p.compounds[0] === row && p.compounds[1] === col) ||
                      (p.compounds[0] === col && p.compounds[1] === row)
                    );
                    if (!pair) {
                      return (
                        <div key={`${row}-${col}`} className="h-14 border border-physio-bg-border bg-physio-bg-secondary flex items-center justify-center text-xs text-physio-text-tertiary">
                          —
                        </div>
                      );
                    }
                    const value = heatmapValues[pair.id] || 0;
                    const color = heatmapColorScale(value, maxHeatmapValue, heatmapMode);
                    const isSelected = pair.id === selectedPairId;
                    return (
                      <button
                        key={`${row}-${col}`}
                        onClick={() => handlePairChange(pair.id)}
                        className={`h-14 border border-physio-bg-border flex items-center justify-center text-sm font-semibold transition ${
                          isSelected ? 'ring-2 ring-physio-accent-cyan ring-inset' : ''
                        }`}
                        style={{ backgroundColor: color, color: '#0F172A' }}
                        title={pair.label}
                      >
                        {value.toFixed(2)}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-physio-bg-secondary border border-physio-accent-cyan/50 rounded-2xl p-5 shadow-sm">
        <button
          type="button"
          onClick={() => setContextCollapsed(prev => !prev)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <p className="text-xs uppercase tracking-wide text-physio-text-tertiary">Need context?</p>
            <h3 className="text-lg font-semibold text-physio-accent-cyan">Expand to learn how to work the matrix</h3>
          </div>
          <DrawerChevron open={!contextCollapsed} />
        </button>
        {!contextCollapsed && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-physio-text-primary">
            <section className="bg-physio-bg-core rounded-xl border border-physio-bg-border p-4">
              <h4 className="font-semibold text-physio-text-secondary mb-2">Heatmap quick read</h4>
              <ul className="space-y-1.5 text-physio-text-secondary">
                <li><strong>Bright cyan</strong> = strong positive synergy · <strong>deep violet</strong> = risk spike.</li>
                <li>Hover the legend chips to translate symbols to clinical narratives.</li>
                <li>Select any cell to auto-scroll into the pair detail workspace.</li>
              </ul>
            </section>
            <section className="bg-physio-bg-core rounded-xl border border-physio-bg-border p-4">
              <h4 className="font-semibold text-physio-text-secondary mb-2">Normal vs Lab mode</h4>
              <p className="text-physio-text-secondary">
                Normal mode keeps it simple: sliders + net benefit/risk and top three dose picks. Lab Mode unlocks dimension chips,
                the dose sweep, surface grid, and the optimizer. Toggle Lab Mode from the personalization bar whenever you’re ready.
              </p>
            </section>
            <section className="bg-physio-bg-core rounded-xl border border-physio-bg-border p-4">
              <h4 className="font-semibold text-physio-text-secondary mb-2">Pair workflow</h4>
              <ol className="list-decimal list-inside space-y-1.5 text-physio-text-secondary">
                <li>Pick the outcome dimension chip that matches your goal.</li>
                <li>Drag the compound sliders until the sticky summary sparkline hits your target.</li>
                <li>Use the net bar chart to confirm whether synergy is worth the risk delta.</li>
              </ol>
            </section>
            <section className="bg-physio-bg-core rounded-xl border border-physio-bg-border p-4">
              <h4 className="font-semibold text-physio-text-secondary mb-2">Optimizer tips</h4>
              <ul className="space-y-1.5 text-physio-text-secondary">
                <li>Evidence slider shifts weighting between clinical and anecdotal inputs.</li>
                <li>Penalty knobs (estrogen, neuro, cardio…) sharpen the optimizer before you run it.</li>
                <li>Send any recommendation straight to Stack Builder to see whole-stack effects.</li>
              </ul>
            </section>
          </div>
        )}
      </section>

      <nav
        className="sticky top-16 z-30 bg-physio-bg-secondary/95 border border-physio-bg-border rounded-2xl px-4 py-3 shadow-physio-subtle backdrop-blur"
        aria-label="Interaction anchors"
      >
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {anchorSections.map(section => (
            <button
              key={section.key}
              type="button"
              onClick={() => scrollToSection(section.ref, section.key)}
              disabled={!section.available}
              className={`px-3 py-1.5 rounded-full border transition ${
                section.available
                  ? activeAnchor === section.key
                    ? 'bg-physio-accent-cyan/10 border-physio-accent-cyan text-physio-accent-cyan'
                    : 'text-physio-text-secondary border-physio-bg-border hover:border-physio-accent-cyan hover:text-physio-accent-cyan'
                  : 'text-physio-text-tertiary/60 border-dashed border-physio-bg-border/70 cursor-not-allowed'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </nav>

      <div ref={pairDetailRef} className="space-y-8">
      {/* Pair Detail */}
      <section ref={controlsSectionRef} className="bg-physio-bg-secondary border border-physio-bg-border rounded-2xl p-6 shadow-lg space-y-6">
        {selectedPair && (
          <div className="sticky top-4 z-20 bg-physio-bg-secondary border border-physio-bg-border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
            <div className="text-sm text-physio-text-primary flex flex-wrap items-center gap-2">
              <span className="font-semibold">{selectedPair.label}</span>
              <span className="text-physio-text-tertiary">•</span>
              <span>Goal: {goalPresets[goalPreset]?.label || 'Custom goal'}</span>
              <span className="text-physio-text-tertiary">•</span>
              <span>Evidence {clinicalShare}% clinical / {anecdoteShare}% anecdote</span>
            </div>
            <div className="text-xs flex flex-wrap items-center gap-3">
              {guardrailBadge && (
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border font-semibold ${guardrailToneStyles[guardrailBadge.tone]}`}
                  title={`Guardrail status · ${guardrailBadge.detail}`}
                >
                  <span>{guardrailBadge.label}</span>
                  {guardrailBadge.detail && (
                    <span className="text-[10px] font-medium tracking-wide uppercase">{guardrailBadge.detail}</span>
                  )}
                </span>
              )}
              <span className="text-physio-text-tertiary">Δ Benefit {benefitSynergyPercent.toFixed(1)}%</span>
              <span className="text-physio-text-tertiary">Δ Risk {riskSynergyPercent.toFixed(1)}%</span>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-physio-text-primary">{selectedPair?.label}</h2>
            <p className="text-sm text-physio-text-secondary">{selectedPair?.summary}</p>
            <p className="text-xs text-physio-text-tertiary mt-1">
              Interaction model v0.3 • Evidence blend auto-updates (clinical vs anecdote weighting).
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs items-center">
            <div className="px-3 py-1 rounded-lg bg-physio-bg-core border border-physio-bg-border text-physio-text-secondary">
              Evidence mix: clinical {(1 - evidenceBlend) * 100 >> 0}% · anecdote {(evidenceBlend) * 100 >> 0}%
            </div>
            <div className="px-3 py-1 rounded-lg bg-physio-bg-core border border-physio-bg-border text-physio-text-secondary">
              Goal preset: {goalPresets[goalPreset]?.label}
            </div>
            <button
              onClick={handleSendCurrentToStack}
              className="px-3 py-1.5 rounded-lg border border-physio-accent-cyan text-physio-accent-cyan font-semibold hover:bg-physio-accent-cyan/10 transition"
            >
              Send to Stack Builder
            </button>
            <PDFExport
              chartRef={pairDetailRef}
              filename="interaction-report.pdf"
              contextSummary={{
                title: 'Interaction Context',
                items: [
                  { label: 'Goal preset', value: goalPresets[goalPreset]?.label || 'Custom' },
                  {
                    label: 'Heatmap focus',
                    value: interactionHeatmapModes.find(mode => mode.key === heatmapMode)?.label || 'Benefit focus'
                  },
                  { label: 'Evidence mix', value: `${clinicalShare}% clinical / ${anecdoteShare}% anecdote` },
                  { label: 'Δ Benefit', value: `${benefitSynergyPercent.toFixed(1)}%` },
                  { label: 'Δ Risk', value: `${riskSynergyPercent.toFixed(1)}%` }
                ]
              }}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <label className="flex-1 text-xs text-physio-text-secondary">
            Jump to interaction
            <select
              value={selectedPairId}
              onChange={e => handlePairChange(e.target.value)}
              className="mt-1 w-full bg-physio-bg-core border border-physio-bg-border rounded-lg px-3 py-2 text-sm text-physio-text-primary"
            >
              {pairOptions.map(option => (
                <option key={option.id} value={option.id} className="bg-physio-bg-core text-physio-text-primary">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)]">
          <div className="space-y-4">
            {labUnlocked && dimensionKeys.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {dimensionKeys.map(key => {
                  const dim = interactionDimensions[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDimension(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                        selectedDimension === key
                          ? 'border-physio-accent-cyan text-physio-accent-cyan'
                          : 'border-physio-bg-border text-physio-text-tertiary hover:text-physio-text-primary'
                      }`}
                    >
                      {dim?.label || key}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="space-y-4">
              {selectedPair?.compounds.map(compoundKey => {
                const [min, max] = selectedPair?.doseRanges?.[compoundKey] || [0, 1000];
                const doseValue = doses?.[compoundKey] ?? selectedPair?.defaultDoses?.[compoundKey] ?? 0;
                const compoundEval = guardrailByCompound[compoundKey];
                const benefitMeta = compoundEval?.meta?.benefit;
                const riskMeta = compoundEval?.meta?.risk;
                const plateauDose = benefitMeta?.plateauDose || riskMeta?.plateauDose || null;
                const hardMax = benefitMeta?.hardMax || riskMeta?.hardMax || null;
                const nearingPlateau = benefitMeta?.nearingPlateau || riskMeta?.nearingPlateau || false;
                const beyondEvidence = benefitMeta?.beyondEvidence || riskMeta?.beyondEvidence || false;
                const clamped = (() => {
                  const meta = benefitMeta || riskMeta;
                  if (!meta) return false;
                  if (meta.clampedDose === undefined || meta.requestedDose === undefined) return false;
                  return meta.clampedDose !== meta.requestedDose;
                })();
                const sliderMax = !labUnlocked && hardMax ? Math.min(max, hardMax) : max;
                const displayDose = Math.min(doseValue, sliderMax);
                const needsLabUnlock = !labUnlocked && hardMax && sliderMax < max;
                return (
                  <label key={compoundKey} className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4 text-sm space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-physio-text-primary">{compoundData[compoundKey]?.name}</span>
                      <button
                        onClick={() => setPrimaryCompound(compoundKey)}
                        className={`text-xs px-2 py-0.5 rounded border ${
                          primaryCompound === compoundKey ? 'border-physio-accent-cyan text-physio-accent-cyan' : 'border-physio-bg-border text-physio-text-tertiary'
                        }`}
                      >
                        {primaryCompound === compoundKey ? 'Primary Axis' : 'Set Primary'}
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={min}
                        max={sliderMax}
                        step="10"
                        value={displayDose}
                        onChange={e => updateDose(compoundKey, e.target.value)}
                        className="flex-1"
                      />
                      <div className="text-right">
                        <div className="text-physio-text-primary font-semibold">{displayDose} mg</div>
                        <div className="text-xs text-physio-text-tertiary">Range {min}-{sliderMax} mg</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] text-physio-text-tertiary">
                      {nearingPlateau && plateauDose !== null && (
                        <span className="px-2 py-0.5 rounded-full bg-physio-warning/10 border border-physio-warning/40 text-physio-warning font-semibold">
                          Plateau @ {plateauDose} mg
                        </span>
                      )}
                      {beyondEvidence && hardMax !== null && (
                        <span className="px-2 py-0.5 rounded-full bg-physio-error/10 border border-physio-error/30 text-physio-error font-semibold">
                          Outside evidence &gt; {hardMax} mg
                        </span>
                      )}
                      {clamped && (
                        <span className="px-2 py-0.5 rounded-full bg-physio-warning/5 border border-physio-warning/30 text-physio-text-primary font-semibold">
                          Clamped to {benefitMeta?.clampedDose || riskMeta?.clampedDose} mg
                        </span>
                      )}
                      {needsLabUnlock && (
                        <span className="px-2 py-0.5 rounded-full bg-physio-bg-tertiary border border-physio-bg-border text-physio-text-secondary font-semibold">
                          Lab mode unlocks overrides
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 lg:sticky lg:top-4">
            <div className="bg-physio-bg-core border border-physio-bg-border rounded-xl p-4 text-sm text-physio-text-secondary">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-physio-text-tertiary">Goal focus</p>
                  <p className="text-sm font-semibold text-physio-text-primary">
                    {goalPresets[goalPreset]?.label || 'Custom goal'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-physio-text-tertiary">Evidence mix</p>
                  <p className="text-sm font-semibold text-physio-text-primary">
                    {clinicalShare}% clinical · {anecdoteShare}% anecdote
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {labUnlocked && dimensionResult ? (
                <>
                  <div className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4">
                    <div className="text-xs text-physio-text-tertiary">Naïve sum</div>
                    <div className="text-2xl font-bold text-physio-text-primary">{dimensionResult.naive.toFixed(2)}</div>
                    <p className="text-xs text-physio-text-secondary mt-1">Base contributions without interaction.</p>
                  </div>
                  <div className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4">
                    <div className="text-xs text-physio-text-tertiary">Interaction delta</div>
                    <div className={`text-2xl font-bold ${dimensionResult.delta >= 0 ? 'text-physio-accent-mint' : 'text-physio-error'}`}>
                      {dimensionResult.delta >= 0 ? '+' : ''}
                      {dimensionResult.delta.toFixed(2)}
                    </div>
                    <p className="text-xs text-physio-text-secondary mt-1">Correction applied via synergy/penalty layer.</p>
                  </div>
                  <div className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4">
                    <div className="text-xs text-physio-text-tertiary">Total modeled</div>
                    <div className="text-2xl font-bold text-physio-accent-cyan">{dimensionResult.total.toFixed(2)}</div>
                    <p className="text-xs text-physio-text-secondary mt-1">Final value for {interactionDimensions[selectedDimension]?.label}.</p>
                  </div>
                  <div className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4">
                    <div className="text-xs text-physio-text-tertiary">Shape saturation</div>
                    <div className="text-2xl font-bold text-physio-text-primary">
                      {(dimensionResult.doseShape * 100).toFixed(0)}%
                    </div>
                    <p className="text-xs text-physio-text-secondary mt-1">How deep into the interaction well you are.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4">
                    <div className="text-xs text-physio-text-tertiary">Base benefit</div>
                    <div className="text-2xl font-bold text-physio-accent-cyan">{baseBenefitValue.toFixed(2)}</div>
                    <p className="text-xs text-physio-text-secondary mt-1">Current slider impact before synergy.</p>
                  </div>
                  <div className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4">
                    <div className="text-xs text-physio-text-tertiary">Base risk</div>
                    <div className="text-2xl font-bold text-physio-error">{baseRiskValue.toFixed(2)}</div>
                    <p className="text-xs text-physio-text-secondary mt-1">Modeled risk from the same doses.</p>
                  </div>
                  <div className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4">
                    <div className="text-xs text-physio-text-tertiary">Net benefit</div>
                    <div className="text-2xl font-bold text-physio-accent-mint">{adjustedBenefitValue.toFixed(2)}</div>
                    <p className="text-xs text-physio-text-secondary mt-1">After applying current synergy assumptions.</p>
                  </div>
                  <div className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4">
                    <div className="text-xs text-physio-text-tertiary">Benefit : Risk</div>
                    <div className="text-2xl font-bold text-physio-text-primary">
                      {netRatio}
                    </div>
                    <p className="text-xs text-physio-text-secondary mt-1">Higher = more efficient stack.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div ref={metricsRef} className="h-0" aria-hidden="true" />

        <SectionDivider />

        {/* Net benefit vs risk chart */}
        <div className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-physio-text-primary">Net benefit vs. risk</h3>
              <p className="text-xs text-physio-text-tertiary">
                Compares current doses with and without interaction effects.
              </p>
            </div>
            <div className="text-xs text-physio-text-secondary">
              Δ Benefit {benefitSynergyPercent.toFixed(1)}% • Δ Risk {riskSynergyPercent.toFixed(1)}%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pairNetChartData} margin={{ top: 10, left: 0, right: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--physio-bg-border)" />
              <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => Number(value).toFixed(2)} />
              <Legend />
              <Bar dataKey="Base" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="With Synergy" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </div>

        <SectionDivider />

        {!labUnlocked && limitedRecommendations.length > 0 && (
          <div className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-physio-text-primary">Smart dose suggestions</h3>
              <span className="text-xs text-physio-text-tertiary">Top {limitedRecommendations.length} picks</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {limitedRecommendations.map((point, idx) => {
                const benefit = point.benefit;
                const risk = point.risk;
                const ratio = risk > 0 ? (benefit / risk).toFixed(2) : '—';
                return (
                  <div
                    key={`quick-rec-${idx}`}
                    className="border border-physio-bg-border rounded-lg p-3 bg-physio-bg-secondary text-sm space-y-1"
                    onMouseEnter={() => setHighlightFromPoint(point)}
                    onFocus={() => setHighlightFromPoint(point)}
                    onClick={() => handleRecommendationInspect(point)}
                    onKeyDown={(event) => handleRecommendationKeyDown(event, point)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center justify-between text-xs text-physio-text-tertiary gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-physio-bg-core border border-physio-bg-border text-physio-text-secondary">
                          Rec #{idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-physio-bg-core border border-physio-bg-border text-physio-text-secondary">
                          {goalPresets[goalPreset]?.label || 'Goal'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-physio-bg-core border border-physio-bg-border text-physio-text-secondary">
                          {clinicalShare}% clinical
                        </span>
                        <span className={`font-semibold ${point.score >= 0 ? 'text-physio-accent-cyan' : 'text-physio-error'}`}>
                          Net {point.score.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="text-physio-text-primary">
                      {compoundData[compoundAKey]?.abbreviation || compoundAKey}: <strong>{point[compoundAKey]} mg</strong> ·{' '}
                      {compoundData[compoundBKey]?.abbreviation || compoundBKey}: <strong>{point[compoundBKey]} mg</strong>
                    </div>
                    <div className="text-xs text-physio-text-tertiary flex gap-3">
                      <span>Benefit {benefit.toFixed(2)}</span>
                      <span>Risk {risk.toFixed(2)}</span>
                      <span>Ratio {ratio}</span>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setHighlightFromPoint(point);
                        handleSendRecommendation(point);
                      }}
                      className="mt-2 px-3 py-1.5 rounded-lg border border-physio-accent-cyan text-physio-accent-cyan text-xs font-semibold hover:bg-physio-accent-cyan/10"
                    >
                      Load in Stack Builder
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!labUnlocked && (
          <p className="text-xs text-physio-text-tertiary">
            Enable Lab Mode inside the personalization panel to unlock dimension-level analytics, dose surfaces, and the multi-compound optimizer.
          </p>
        )}
        {/* Chart */}
        {labUnlocked && (
          <>
            <div ref={chartsRef} className="h-0" aria-hidden="true" />
            <SectionDivider />
            <div className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-physio-text-primary">Primary Dose Sweep</h3>
                  <p className="text-xs text-physio-text-tertiary">
                    Sweeping {compoundData[primaryCompound]?.abbreviation} while {secondarySummary}
                  </p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--physio-bg-border)" />
                  {highlightedBand && highlightedBand.primaryCompound === primaryCompound && (
                    <ReferenceArea
                      x1={highlightedBand.min}
                      x2={highlightedBand.max}
                      strokeOpacity={0}
                      fill="#fcd34d"
                      fillOpacity={0.15}
                    />
                  )}
                  <XAxis
                    dataKey="dose"
                    label={{ value: `${compoundData[primaryCompound]?.abbreviation} dose`, position: 'insideBottom', offset: -10 }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 6]} />
                  <Tooltip formatter={tooltipFormatter} />
                  <Legend />
                  <ReferenceLine
                    x={currentPrimaryDose}
                    stroke="#f97316"
                    strokeDasharray="4 4"
                    label={{
                      value: `${currentPrimaryDose} mg`,
                      position: 'top',
                      fill: '#f97316',
                      fontSize: 12
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="basePrimary"
                    name={`${compoundData[primaryCompound]?.abbreviation} alone`}
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line type="monotone" dataKey="naive" name="Naïve Sum" stroke="#a5b4fc" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="total" name="Interaction Total" stroke="#34d399" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

{/* Surface + Recommendations */}
{labUnlocked && (
  <>
  <div ref={surfacesRef} className="h-0" aria-hidden="true" />
  <SectionDivider />
  <div className="grid gap-4 lg:grid-cols-2">
            <div className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-physio-text-primary">Dose Surface — Net Score</h3>
                  <p className="text-xs text-physio-text-tertiary">
                    Colored by benefit − risk using the {goalPresets[goalPreset]?.label}.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {Object.entries(goalPresets).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => setGoalPreset(key)}
                      className={`px-3 py-1 rounded-lg border ${
                        goalPreset === key ? 'border-physio-accent-cyan text-physio-accent-cyan' : 'border-physio-bg-border text-physio-text-tertiary'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="flex items-start gap-3">
                  <div
                    className="text-xs text-physio-text-tertiary"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  >
                    {(compoundData[compoundBKey]?.abbreviation || compoundBKey) ?? 'B'} dose (mg)
                  </div>
                  <div className="inline-flex flex-col gap-1">
                    {selectedSurfacePair &&
                      surfaceRows.map((row, idx) => (
                        <div key={idx} className="flex gap-1">
                          {row.map((point, cellIdx) => {
                            const marker = surfaceMarkerMap.get(`${point[compoundAKey]}-${point[compoundBKey]}`);
                            return <SurfaceCell key={cellIdx} score={point.score} marker={marker} />;
                          })}
                        </div>
                      ))}
                  </div>
                </div>
                <p className="text-xs text-physio-text-tertiary text-center mt-2">
                  {(compoundData[compoundAKey]?.abbreviation || compoundAKey) ?? 'A'} dose (mg)
                </p>
              </div>
            </div>
            <div className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-physio-text-primary">Stack suggestions</h3>
                  <p className="text-xs text-physio-text-tertiary">Top interaction waypoints (benefit − risk score)</p>
                </div>
                <span className="text-xs text-physio-text-tertiary">{displayedRecommendations.length} options</span>
              </div>
              <div className="space-y-3">
                {displayedRecommendations.map((point, idx) => {
                  const benefit = point.benefit;
                  const risk = point.risk;
                  const ratio = risk > 0 ? (benefit / risk).toFixed(2) : '—';
                  return (
                    <div
                      key={`lab-rec-${idx}`}
                      className="border border-physio-bg-border rounded-lg p-3 bg-physio-bg-secondary text-sm space-y-1"
                      onMouseEnter={() => setHighlightFromPoint(point)}
                      onFocus={() => setHighlightFromPoint(point)}
                      onClick={() => handleRecommendationInspect(point)}
                      onKeyDown={(event) => handleRecommendationKeyDown(event, point)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-center justify-between text-xs text-physio-text-tertiary gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-physio-bg-core border border-physio-bg-border text-physio-text-secondary">
                            Rec #{idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-physio-bg-core border border-physio-bg-border text-physio-text-secondary">
                            {goalPresets[goalPreset]?.label || 'Goal'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-physio-bg-core border border-physio-bg-border text-physio-text-secondary">
                            {point.score >= 0 ? 'Favorable' : 'Caution'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-physio-bg-core border border-physio-bg-border text-physio-text-secondary">
                            {clinicalShare}% clinical
                          </span>
                          <span className={`font-semibold ${point.score >= 0 ? 'text-physio-accent-cyan' : 'text-physio-error'}`}>
                            Net {point.score.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="text-physio-text-primary">
                        {compoundData[compoundAKey]?.abbreviation || compoundAKey}: <strong>{point[compoundAKey]} mg</strong> ·{' '}
                        {compoundData[compoundBKey]?.abbreviation || compoundBKey}: <strong>{point[compoundBKey]} mg</strong>
                      </div>
                      <div className="text-xs text-physio-text-tertiary flex gap-3">
                        <span>Benefit {benefit.toFixed(2)}</span>
                        <span>Risk {risk.toFixed(2)}</span>
                        <span>Ratio {ratio}</span>
                      </div>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setHighlightFromPoint(point);
                          handleSendRecommendation(point);
                        }}
                        className="mt-2 px-3 py-1.5 rounded-lg border border-physio-accent-cyan text-physio-accent-cyan text-xs font-semibold hover:bg-physio-accent-cyan/10"
                      >
                        Load in Stack Builder
                      </button>
                    </div>
                  );
                })}
                {!displayedRecommendations.length && (
                  <p className="text-xs text-physio-text-tertiary">No recommendation points surfaced for this pairing yet.</p>
                )}
              </div>
            </div>
          </div>
          </>
        )}
      </section>

      {labUnlocked && (
        <>
          <div ref={optimizersRef} className="h-0" aria-hidden="true" />
          <SectionDivider />
          {/* Multi-Compound Optimizer */}
          <section className="bg-physio-bg-secondary border border-physio-bg-border rounded-2xl p-6 shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-physio-text-primary">Multi-Compound Optimizer</h3>
                <p className="text-sm text-physio-text-secondary">
                  Sampling predefined three-compound templates using your personalization + synergy model.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-physio-text-tertiary hidden sm:block">
                  Presets: {stackOptimizerCombos.map(combo => combo.label).join(' • ')}
                </span>
                <button
                  onClick={() => setOptimizerCollapsed(prev => !prev)}
                  className="px-3 py-1.5 rounded-lg border border-physio-accent-cyan text-physio-accent-cyan text-xs font-semibold hover:bg-physio-accent-cyan/10"
                >
                  {optimizerCollapsed ? 'Expand' : 'Collapse'}
                </button>
              </div>
            </div>

            {!optimizerCollapsed && (
              <>

            {stackResults.length === 0 ? (
              <p className="text-sm text-physio-text-tertiary">No stack data available.</p>
            ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {stackResults.map(result => {
              const benefitDelta = result.adjustedBenefit - result.baseBenefit;
              const riskDelta = result.adjustedRisk - result.baseRisk;
              const benefitSynergyPercent =
                result.baseBenefit > 0 ? (benefitDelta / result.baseBenefit) * 100 : 0;
              const riskSynergyPercent =
                result.baseRisk > 0 ? (riskDelta / result.baseRisk) * 100 : 0;
              return (
                <article
                  key={`${result.comboId}-${Object.values(result.doses).join('-')}`}
                  className="border border-physio-bg-border rounded-xl p-4 bg-physio-bg-core flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between text-sm text-physio-text-tertiary">
                    <span>{stackOptimizerCombos.find(combo => combo.id === result.comboId)?.label || result.label}</span>
                    <span className={`font-semibold ${result.score >= 0 ? 'text-physio-accent-cyan' : 'text-physio-error'}`}>
                      Net {result.score.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-physio-text-secondary">
                    {stackOptimizerCombos.find(combo => combo.id === result.comboId)?.narrative || result.narrative}
                  </p>
                  <div className="space-y-1 text-sm text-physio-text-primary">
                    {result.compounds.map(compoundKey => (
                      <div key={compoundKey}>
                        {compoundData[compoundKey]?.abbreviation || compoundKey}: <strong>{result.doses[compoundKey]} mg</strong>
                        <span className="text-xs text-physio-text-tertiary"> {compoundData[compoundKey]?.type === 'oral' ? 'per day' : 'per week'}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-physio-text-secondary">
                    <span>Benefit {result.adjustedBenefit.toFixed(2)}</span>
                    <span>Risk {result.adjustedRisk.toFixed(2)}</span>
                    <span>Ratio {result.ratio.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-physio-text-tertiary">
                    Synergy: {benefitSynergyPercent.toFixed(1)}% benefit · {riskSynergyPercent.toFixed(1)}% risk
                  </div>
                  <button
                    onClick={() =>
                      onPrefillStack?.(
                        result.compounds.map(compoundKey => ({
                          compound: compoundKey,
                          dose: result.doses[compoundKey]
                        }))
                      )
                    }
                    className="mt-2 px-3 py-1.5 rounded-lg border border-physio-accent-cyan text-physio-accent-cyan text-xs font-semibold hover:bg-physio-accent-cyan/10"
                  >
                    Load in Stack Builder
                  </button>
                </article>
              );
            })}
          </div>
        )}
        <div className="border-t border-physio-bg-border pt-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h4 className="text-lg font-semibold text-physio-text-primary">Custom Stack Optimizer</h4>
              <p className="text-xs text-physio-text-secondary">Pick up to four compounds, define dose windows, and let the engine hunt for sweet spots.</p>
            </div>
            <div className="flex gap-2 text-xs items-center">
              <label className="text-physio-text-secondary flex items-center gap-2">
                Goal preset
                <select
                  value={customGoal}
                  onChange={e => setCustomGoal(e.target.value)}
                  className="bg-physio-bg-core border border-physio-bg-border rounded-lg px-2 py-1 text-physio-text-primary"
                >
                  {Object.entries(goalPresets).map(([key, preset]) => (
                    <option key={key} value={key}>{preset.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <select
              value={customSelection}
              onChange={e => setCustomSelection(e.target.value)}
              className="flex-1 bg-physio-bg-core border border-physio-bg-border rounded-lg px-3 py-2 text-sm text-physio-text-primary"
            >
              <option value="">Add compound…</option>
              {customAvailableCompounds.map(key => (
                <option key={key} value={key}>
                  {compoundData[key]?.name || key}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddCustomCompound}
              className="px-4 py-2 rounded-lg border border-physio-accent-cyan text-physio-accent-cyan font-semibold hover:bg-physio-accent-cyan/10 disabled:opacity-40"
              disabled={!customSelection}
            >
              Add
            </button>
            <button
              onClick={() => {
                setCustomCompounds([]);
                setCustomRanges({});
                setCustomResults([]);
              }}
              className="px-4 py-2 rounded-lg border border-physio-bg-border text-physio-text-tertiary hover:text-physio-text-primary"
            >
              Clear
            </button>
          </div>

          {customCompounds.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customCompounds.map(compoundKey => {
                const settings = customRanges[compoundKey] || deriveDefaultRange(compoundKey);
                return (
                  <div key={compoundKey} className="border border-physio-bg-border rounded-lg p-4 bg-physio-bg-core text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-physio-text-primary">{compoundData[compoundKey]?.name}</span>
                      <button
                        onClick={() => handleRemoveCustomCompound(compoundKey)}
                        className="text-xs text-physio-error"
                      >
                        Remove
                      </button>
                    </div>
                    {['min', 'max', 'base'].map(field => (
                      <label key={field} className="text-xs text-physio-text-secondary flex items-center justify-between gap-2">
                        {field === 'base' ? 'Target' : field === 'min' ? 'Min' : 'Max'} dose (mg)
                        <input
                          type="number"
                          value={settings[field]}
                          onChange={e => handleCustomRangeChange(compoundKey, field, e.target.value)}
                          className="w-24 bg-physio-bg-tertiary border border-physio-bg-border rounded px-2 py-1 text-sm text-physio-text-primary"
                        />
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={handleRunCustomOptimizer}
            disabled={!customCompounds.length}
            className="px-4 py-2 rounded-lg bg-physio-accent-cyan text-physio-bg-core font-semibold hover:bg-physio-accent-cyan/80 disabled:bg-physio-bg-border disabled:text-physio-text-tertiary"
          >
            Run custom optimizer
          </button>

          {customResults.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {customResults.map((result, idx) => (
                <article key={`custom-${idx}-${Object.values(result.doses).join('-')}`} className="border border-physio-bg-border rounded-xl p-4 bg-physio-bg-secondary flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs text-physio-text-tertiary">
                    <span>User-defined Stack #{idx + 1}</span>
                    <span className={`font-semibold ${result.score >= 0 ? 'text-physio-accent-cyan' : 'text-physio-error'}`}>
                      Net {result.score.toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-physio-text-primary">
                    {result.compounds.map(compoundKey => (
                      <div key={compoundKey}>
                        {compoundData[compoundKey]?.abbreviation || compoundKey}: <strong>{result.doses[compoundKey]} mg</strong>
                        <span className="text-xs text-physio-text-tertiary"> {compoundData[compoundKey]?.type === 'oral' ? 'per day' : 'per week'}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-physio-text-secondary">
                    <span>Benefit {result.adjustedBenefit.toFixed(2)}</span>
                    <span>Risk {result.adjustedRisk.toFixed(2)}</span>
                    <span>Ratio {result.ratio.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() =>
                      onPrefillStack?.(
                        result.compounds.map(compoundKey => ({
                          compound: compoundKey,
                          dose: result.doses[compoundKey]
                        }))
                      )
                    }
                    className="mt-2 px-3 py-1.5 rounded-lg border border-physio-accent-cyan text-physio-accent-cyan text-xs font-semibold hover:bg-physio-accent-cyan/10"
                  >
                    Load in Stack Builder
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
          </>
        )}
      </section>
      </>
      )}
      </div>

      {/* Controls */}
      {labUnlocked && (
        <>
        <SectionDivider />
      <section className="bg-physio-bg-secondary border border-physio-bg-border rounded-2xl p-6 shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-physio-text-primary">Interaction Penalty Modifiers</h3>
            <p className="text-sm text-physio-text-secondary">Tune sensitivities so the model respects your physiology.</p>
          </div>
          <div className="text-xs text-physio-text-tertiary">
            Evidence blending slider leans toward clinical (left) or anecdote (right).
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'estrogen', label: 'Estrogen Sensitivity', helper: 'Higher = gyno/bloat prone. Amplifies estrogenic penalties.' },
            { key: 'water', label: 'Water Retention Sensitivity', helper: 'Impacts bloat + cosmetic softness penalties.' },
            { key: 'neuro', label: 'Neuro Sensitivity', helper: 'If Tren/Halo wreck your sleep, slide right.' },
            { key: 'cardio', label: 'Cardio / BP Sensitivity', helper: 'Impacts BP + hematocrit penalties.' }
          ].map(field => (
            <label key={field.key} className="border border-physio-bg-border rounded-lg p-4 bg-physio-bg-core text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-physio-text-primary">{field.label}</span>
                <span className="text-xs text-physio-accent-cyan">{sensitivities[field.key].toFixed(2)}×</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={sensitivities[field.key]}
                onChange={e => updateSensitivity(field.key, e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-physio-text-tertiary">{field.helper}</p>
            </label>
          ))}
        </div>

        <div className="border border-physio-bg-border rounded-lg p-4 bg-physio-bg-core text-sm text-physio-text-secondary">
          Evidence weighting now lives in the control strip above the matrix so you can re-balance clinical vs anecdote inputs without scrolling.
        </div>
      </section>
        </>
      )}
    </div>
  );
};

export default InteractionHeatmap;
