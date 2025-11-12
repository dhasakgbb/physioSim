import { compoundData } from '../data/compoundData';
import { personalizeScore } from './personalization';
import { interactionDimensions, interactionPairs, goalPresets } from '../data/interactionEngineData';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const interpolateCurvePoint = (curve = [], dose) => {
  if (!curve.length) return null;
  if (dose <= curve[0].dose) return curve[0];
  if (dose >= curve[curve.length - 1].dose) return curve[curve.length - 1];

  for (let i = 0; i < curve.length - 1; i++) {
    const current = curve[i];
    const next = curve[i + 1];
    if (dose >= current.dose && dose <= next.dose) {
      const ratio = (dose - current.dose) / (next.dose - current.dose);
      const value = current.value + ratio * (next.value - current.value);
      const ci = (current.ci ?? 0) + ratio * ((next.ci ?? 0) - (current.ci ?? 0));
      return { dose, value, ci };
    }
  }

  return curve[curve.length - 1];
};

export const evaluateCompoundResponse = (compoundKey, curveType, dose, profile) => {
  const compound = compoundData[compoundKey];
  if (!compound) return 0;
  const curve = curveType === 'risk' ? compound.riskCurve : compound.benefitCurve;
  const point = interpolateCurvePoint(curve, dose);
  if (!point) return 0;
  const personalized = personalizeScore({
    compoundKey,
    curveType,
    dose,
    baseValue: point.value,
    baseCi: point.ci,
    profile
  });
  return personalized.value;
};

const hillTerm = (dose, d50 = 300, n = 2) => {
  if (dose <= 0) return 0;
  return Math.pow(dose, n) / (Math.pow(dose, n) + Math.pow(d50, n));
};

const dimensionSensitivityKey = {
  bloat: 'water',
  estrogenic: 'estrogen',
  bp: 'cardio',
  hematocrit: 'cardio',
  neuro: 'neuro',
  hepatic: 'cardio'
};

export const evaluatePairDimension = ({
  pairId,
  dimensionKey,
  doses,
  profile,
  sensitivities,
  evidenceBlend
}) => {
  const pair = interactionPairs[pairId];
  if (!pair) return null;

  const dimension = interactionDimensions[dimensionKey];
  if (!dimension) return null;

  const [compoundA, compoundB] = pair.compounds;
  const doseA = doses[compoundA] ?? 0;
  const doseB = doses[compoundB] ?? 0;

  const weights = pair.dimensionWeights?.[dimensionKey] || {};

  const baseA = evaluateCompoundResponse(
    compoundA,
    dimension.type === 'risk' ? 'risk' : 'benefit',
    doseA,
    profile
  ) * (weights[compoundA] ?? 1);

  const baseB = evaluateCompoundResponse(
    compoundB,
    dimension.type === 'risk' ? 'risk' : 'benefit',
    doseB,
    profile
  ) * (weights[compoundB] ?? 1);

  const naive = baseA + baseB;

  const coeffSource = dimension.type === 'risk' ? pair.penalties : pair.synergy;
  const rawCoeff = coeffSource?.[dimensionKey] ?? 0;

  const modelParams = pair.doseModel?.params || {};
  const n = modelParams.n ?? 2;
  const d50A = modelParams.d50A ?? 300;
  const d50B = modelParams.d50B ?? 300;

  const doseShape = hillTerm(doseA, d50A, n) * hillTerm(doseB, d50B, n);

  const sensitivityKey = dimensionSensitivityKey[dimensionKey];
  const sensitivityMultiplier = sensitivityKey ? sensitivities[sensitivityKey] ?? 1 : 1;

  const evidence = pair.evidence || { clinical: 0.5, anecdote: 0.5 };
  const evidenceTotal = (evidence.clinical ?? 0) + (evidence.anecdote ?? 0) || 1;
  const clinicalWeight = clamp(1 - evidenceBlend, 0, 1);
  const anecdoteWeight = clamp(evidenceBlend, 0, 1);
  const evidenceScalar =
    ((evidence.clinical ?? 0) * clinicalWeight + (evidence.anecdote ?? 0) * anecdoteWeight) / evidenceTotal;

  const delta = rawCoeff * doseShape * sensitivityMultiplier * evidenceScalar;
  const total = dimension.type === 'risk' ? clamp(naive + Math.abs(delta), 0, 6) : clamp(naive + delta, 0, 6);

  return {
    dimensionKey,
    type: dimension.type,
    baseA,
    baseB,
    naive,
    delta,
    total,
    doseShape
  };
};

export const computeHeatmapValue = ({ pairId, mode, profile, sensitivities, evidenceBlend }) => {
  const pair = interactionPairs[pairId];
  if (!pair) return 0;
  const doses = pair.defaultDoses;
  const keys = Object.keys(interactionDimensions);

  let benefitSum = 0;
  let riskSum = 0;

  keys.forEach(dimKey => {
    const dimension = interactionDimensions[dimKey];
    if (!dimension) return;
    if (dimension.type === 'benefit' && pair.synergy?.[dimKey]) {
      const res = evaluatePairDimension({
        pairId,
        dimensionKey: dimKey,
        doses,
        profile,
        sensitivities,
        evidenceBlend
      });
      if (res) benefitSum += Math.abs(res.delta);
    }
    if (dimension.type === 'risk' && pair.penalties?.[dimKey]) {
      const res = evaluatePairDimension({
        pairId,
        dimensionKey: dimKey,
        doses,
        profile,
        sensitivities,
        evidenceBlend
      });
      if (res) riskSum += Math.abs(res.delta);
    }
  });

  if (mode === 'benefit') return benefitSum;
  if (mode === 'risk') return riskSum;
  return benefitSum + riskSum;
};

export const generatePrimaryCurveSeries = ({
  pairId,
  dimensionKey,
  primaryCompound,
  doses,
  profile,
  sensitivities,
  evidenceBlend,
  sampleCount = 20
}) => {
  const pair = interactionPairs[pairId];
  if (!pair) return [];
  const [compoundA, compoundB] = pair.compounds;
  const secondaryCompound = primaryCompound === compoundA ? compoundB : compoundA;
  const range = pair.doseRanges?.[primaryCompound] || [0, 1000];
  const [minDose, maxDose] = range;
  const step = (maxDose - minDose) / sampleCount;

  const data = [];
  for (let dose = minDose; dose <= maxDose + 1; dose += step) {
    const pointDoses = {
      ...doses,
      [primaryCompound]: clamp(dose, minDose, maxDose),
      [secondaryCompound]: doses[secondaryCompound]
    };
    const res = evaluatePairDimension({
      pairId,
      dimensionKey,
      doses: pointDoses,
      profile,
      sensitivities,
      evidenceBlend
    });
    if (!res) continue;
    const dimension = interactionDimensions[dimensionKey];
    const basePrimary = evaluateCompoundResponse(
      primaryCompound,
      dimension?.type === 'risk' ? 'risk' : 'benefit',
      pointDoses[primaryCompound],
      profile
    );
    data.push({
      dose: Math.round(pointDoses[primaryCompound]),
      basePrimary,
      naive: res.naive,
      total: res.total
    });
  }
  return data;
};

const aggregateScore = ({ pairId, doses, profile, sensitivities, evidenceBlend, presetKey }) => {
  const pair = interactionPairs[pairId];
  const preset = goalPresets[presetKey] || goalPresets.lean_mass;
  const dimensionKeys = [
    ...Object.keys(pair.synergy || {}),
    ...Object.keys(pair.penalties || {})
  ];

  let benefitScore = 0;
  let riskScore = 0;

  dimensionKeys.forEach(key => {
    const dimension = interactionDimensions[key];
    if (!dimension) return;
    const res = evaluatePairDimension({
      pairId,
      dimensionKey: key,
      doses,
      profile,
      sensitivities,
      evidenceBlend
    });
    if (!res) return;
    if (dimension.type === 'benefit') {
      benefitScore += (preset.benefitWeights?.[key] ?? 0) * res.total;
    } else {
      riskScore += (preset.riskWeights?.[key] ?? 0) * res.total;
    }
  });

  return {
    score: benefitScore - riskScore,
    benefit: benefitScore,
    risk: riskScore
  };
};

export const buildSurfaceData = ({
  pairId,
  profile,
  sensitivities,
  evidenceBlend,
  presetKey,
  steps = 12
}) => {
  const pair = interactionPairs[pairId];
  if (!pair) return [];
  const [compoundA, compoundB] = pair.compounds;
  const [minA, maxA] = pair.doseRanges?.[compoundA] || [0, 1000];
  const [minB, maxB] = pair.doseRanges?.[compoundB] || [0, 1000];
  const stepA = (maxA - minA) / steps;
  const stepB = (maxB - minB) / steps;

  const data = [];
  for (let a = minA; a <= maxA + 1; a += stepA) {
    for (let b = minB; b <= maxB + 1; b += stepB) {
      const doses = {
        [compoundA]: Math.round(a),
        [compoundB]: Math.round(b)
      };
      const aggregate = aggregateScore({
        pairId,
        doses,
        profile,
        sensitivities,
        evidenceBlend,
        presetKey
      });
      data.push({
        [compoundA]: Math.round(a),
        [compoundB]: Math.round(b),
        score: aggregate.score,
        benefit: aggregate.benefit,
        risk: aggregate.risk
      });
    }
  }
  return data;
};
