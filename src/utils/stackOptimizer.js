import { stackOptimizerCombos, goalPresets } from '../data/interactionEngineData';
import { evaluateCompoundResponse } from './interactionEngine';
import { calculateStackSynergy } from '../data/interactionMatrix';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const buildDoseSamples = (min, max, steps, base) => {
  if (steps <= 1) return [clamp(base, min, max)];
  const span = max - min;
  if (span <= 0) return [clamp(base, min, max)];
  const increment = span / (steps - 1);
  const samples = [];
  for (let i = 0; i < steps; i++) {
    samples.push(Math.round(min + i * increment));
  }
  if (!samples.includes(clamp(base, min, max))) {
    samples.push(clamp(base, min, max));
  }
  return samples;
};

const cartesianProduct = (arrays) =>
  arrays.reduce((acc, curr) => {
    const res = [];
    acc.forEach(prefix => {
      curr.forEach(item => {
        res.push([...prefix, item]);
      });
    });
    return res;
  }, [[]]);

const computeBaseScores = (compounds, doses, profile) => {
  let benefit = 0;
  let risk = 0;
  compounds.forEach(compoundKey => {
    benefit += evaluateCompoundResponse(compoundKey, 'benefit', doses[compoundKey], profile);
    risk += evaluateCompoundResponse(compoundKey, 'risk', doses[compoundKey], profile);
  });
  return { benefit, risk };
};

const applySynergy = (benefit, risk, compoundKeys) => {
  const synergy = calculateStackSynergy(compoundKeys);
  const adjustedBenefit = benefit * (1 + (synergy.benefitSynergy || 0));
  const adjustedRisk = risk * (1 + (synergy.riskSynergy || 0));
  return {
    adjustedBenefit,
    adjustedRisk,
    synergy
  };
};

const scoreStack = (benefit, risk, presetKey) => {
  const preset = goalPresets[presetKey] || goalPresets.lean_mass;
  const benefitWeight =
    Object.values(preset.benefitWeights || {}).reduce((acc, value) => acc + value, 0) || 1;
  const riskWeight =
    Object.values(preset.riskWeights || {}).reduce((acc, value) => acc + value, 0) || 1;

  const score = benefit * benefitWeight - risk * riskWeight;
  const ratio = risk > 0 ? benefit / risk : benefit;
  return { score, ratio };
};

const optimizeCombo = ({ combo, profile, goalOverride }) => {
  const { compounds, doseRanges, defaultDoses = {}, steps = 3, id, label, narrative, goal } = combo;
  if (!compounds?.length) return [];
  const presetKey = goalOverride || goal || 'lean_mass';

  const samples = compounds.map(compoundKey => {
    const [min, max] = doseRanges?.[compoundKey] || [0, 1000];
    const base = defaultDoses[compoundKey] ?? (min + max) / 2;
    return buildDoseSamples(min, max, steps, base);
  });

  const combinations = cartesianProduct(samples);
  const results = combinations.map(sample => {
    const doses = {};
    compounds.forEach((compoundKey, idx) => {
      doses[compoundKey] = sample[idx];
    });

    const base = computeBaseScores(compounds, doses, profile);
    const withSynergy = applySynergy(base.benefit, base.risk, compounds);
    const scoring = scoreStack(withSynergy.adjustedBenefit, withSynergy.adjustedRisk, presetKey);

    return {
      comboId: id,
      label,
      narrative: narrative || '',
      compounds,
      doses,
      baseBenefit: base.benefit,
      baseRisk: base.risk,
      adjustedBenefit: withSynergy.adjustedBenefit,
      adjustedRisk: withSynergy.adjustedRisk,
      synergy: withSynergy.synergy,
      score: scoring.score,
      ratio: scoring.ratio,
      presetKey
    };
  });

  return results;
};

export const runStackOptimizer = ({ combos, profile, goalOverride }) => {
  const results = [];
  combos.forEach(combo => {
    results.push(...optimizeCombo({ combo, profile, goalOverride }));
  });
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
};

export const generateStackOptimizerResults = ({ profile, goalOverride }) =>
  runStackOptimizer({ combos: stackOptimizerCombos, profile, goalOverride });

export const generateCustomStackResults = ({ combo, profile, goalOverride }) =>
  runStackOptimizer({ combos: [combo], profile, goalOverride }).slice(0, 3);
