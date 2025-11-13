import { stackOptimizerCombos } from '../data/interactionEngineData';
import { evaluateStack } from './stackEngine';

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
  const baseValue = clamp(base, min, max);
  if (!samples.includes(baseValue)) {
    samples.push(baseValue);
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
  return combinations.map(sample => {
    const stackEntries = compounds.map((compoundKey, idx) => ({
      compound: compoundKey,
      dose: sample[idx]
    }));

    const evaluation = evaluateStack({
      stackInput: stackEntries,
      profile,
      goalKey: presetKey
    });
    const totals = evaluation.totals;

    return {
      comboId: id,
      label,
      narrative: narrative || '',
      compounds,
      doses: stackEntries.reduce((acc, item) => {
        acc[item.compound] = item.dose;
        return acc;
      }, {}),
      evaluation,
      baseBenefit: totals.baseBenefit,
      baseRisk: totals.baseRisk,
      adjustedBenefit: totals.totalBenefit,
      adjustedRisk: totals.totalRisk,
      score: totals.netScore,
      ratio: totals.brRatio,
      presetKey
    };
  });
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
