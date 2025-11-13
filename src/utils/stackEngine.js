import { evaluateCompoundResponse, evaluatePairDimension } from './interactionEngine';
import {
  interactionDimensions,
  interactionPairs,
  goalPresets,
  defaultSensitivities
} from '../data/interactionEngineData';
import { normalizeStackInput, resolvePairKey } from '../data/interactionMatrix';
import { defaultProfile } from './personalization';

const sumWeights = weights => Object.values(weights || {}).reduce((acc, val) => acc + val, 0);

const baseResult = () => ({
  byCompound: {},
  pairInteractions: {},
  totals: {
    benefitDims: { base: 0 },
    riskDims: { base: 0 },
    baseBenefit: 0,
    baseRisk: 0,
    totalBenefit: 0,
    totalRisk: 0,
    weightedBenefit: 0,
    weightedRisk: 0,
    netScore: 0,
    brRatio: 0
  }
});

export const evaluateStack = ({
  stackInput = [],
  profile = defaultProfile,
  goalKey = 'lean_mass',
  sensitivities = defaultSensitivities,
  evidenceBlend = 0.4,
  disableInteractions = false
} = {}) => {
  const preset = goalPresets[goalKey] || goalPresets.lean_mass;
  const { compounds, doses } = normalizeStackInput(stackInput);
  if (!compounds.length) {
    return baseResult();
  }

  const byCompound = {};
  const benefitDims = { base: 0 };
  const riskDims = { base: 0 };

  compounds.forEach(code => {
    const dose = doses[code] ?? 0;
    const benefitRes = evaluateCompoundResponse(code, 'benefit', dose, profile);
    const riskRes = evaluateCompoundResponse(code, 'risk', dose, profile);
    const benefitValue = benefitRes?.value ?? 0;
    const riskValue = riskRes?.value ?? 0;

    byCompound[code] = {
      benefit: benefitValue,
      risk: riskValue,
      meta: {
        benefit: benefitRes?.meta,
        risk: riskRes?.meta
      }
    };

    benefitDims.base += benefitValue;
    riskDims.base += riskValue;
  });

  const pairInteractions = {};
  if (!disableInteractions && compounds.length > 1) {
    compounds.forEach((compoundA, i) => {
      for (let j = i + 1; j < compounds.length; j++) {
        const compoundB = compounds[j];
        const pairId = resolvePairKey(compoundA, compoundB);
        if (!pairId) continue;
        const pair = interactionPairs[pairId];
        if (!pair) continue;

        const deltaDims = {};
        const dimensionKeys = [
          ...Object.keys(pair.synergy || {}),
          ...Object.keys(pair.penalties || {})
        ];
        const pairDoses = {
          [compoundA]: doses[compoundA] ?? 0,
          [compoundB]: doses[compoundB] ?? 0
        };

        dimensionKeys.forEach(dimensionKey => {
          const dimension = interactionDimensions[dimensionKey];
          if (!dimension) return;
          const result = evaluatePairDimension({
            pairId,
            dimensionKey,
            doses: pairDoses,
            profile,
            sensitivities,
            evidenceBlend
          });
          if (!result?.delta) return;
          const signedDelta = dimension.type === 'risk' ? -Math.abs(result.delta) : result.delta;
          deltaDims[dimensionKey] = signedDelta;
          if (dimension.type === 'benefit') {
            benefitDims[dimensionKey] = (benefitDims[dimensionKey] || 0) + result.delta;
          } else {
            riskDims[dimensionKey] = (riskDims[dimensionKey] || 0) + Math.abs(result.delta);
          }
        });

        if (Object.keys(deltaDims).length) {
          pairInteractions[pairId] = { deltaDims };
        }
      }
    });
  }

  const benefitWeightSum = sumWeights(preset?.benefitWeights);
  const riskWeightSum = sumWeights(preset?.riskWeights);

  const synergyBenefitSum = Object.entries(benefitDims)
    .filter(([key]) => key !== 'base')
    .reduce((acc, [, value]) => acc + value, 0);
  const synergyRiskSum = Object.entries(riskDims)
    .filter(([key]) => key !== 'base')
    .reduce((acc, [, value]) => acc + value, 0);

  const baseBenefit = benefitDims.base;
  const baseRisk = riskDims.base;
  const totalBenefit = baseBenefit + synergyBenefitSum;
  const totalRisk = baseRisk + synergyRiskSum;

  let weightedBenefit = baseBenefit * (benefitWeightSum || 1);
  let weightedRisk = baseRisk * (riskWeightSum || 1);

  Object.entries(preset?.benefitWeights || {}).forEach(([dimensionKey, weight]) => {
    weightedBenefit += (benefitDims[dimensionKey] || 0) * weight;
  });
  Object.entries(preset?.riskWeights || {}).forEach(([dimensionKey, weight]) => {
    weightedRisk += (riskDims[dimensionKey] || 0) * weight;
  });

  const netScore = weightedBenefit - weightedRisk;
  const brRatio = totalRisk > 0 ? totalBenefit / totalRisk : totalBenefit;

  return {
    byCompound,
    pairInteractions,
    totals: {
      benefitDims,
      riskDims,
      baseBenefit,
      baseRisk,
      totalBenefit,
      totalRisk,
      weightedBenefit,
      weightedRisk,
      netScore,
      brRatio
    }
  };
};
