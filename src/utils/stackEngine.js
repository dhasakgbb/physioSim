import { evaluateCompoundResponse, evaluatePairDimension } from './interactionEngine';
import {
  interactionDimensions,
  interactionPairs,
  defaultSensitivities
} from '../data/interactionEngineData';
import { normalizeStackInput, resolvePairKey } from '../data/interactionMatrix';
import { defaultProfile } from './personalization';
import { compoundData } from '../data/compoundData';

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

// NEW: Global Penalty Logic
const calculateGlobalPenalties = (compounds, doses, currentRisk) => {
  let penalty = 0;
  const activeCompounds = compounds.map(c => ({ code: c, meta: compoundData[c], dose: doses[c] }));

  // 1. Multiplicative Oral Toxicity (Hepatic Stress)
  const orals = activeCompounds.filter(c => c.meta.type === 'oral');
  if (orals.length > 1) {
    // If 2+ orals, add 50% of their combined risk as a "Synergy Penalty"
    // We don't have exact risk score per compound here easily without recalculating, 
    // so we use a heuristic based on dose count.
    penalty += (orals.length - 1) * 1.5; 
  }

  // 2. Estrogen "Sweet Spot" & Test Base Check
  // Factors: Test=1, Dbol=2, Ment=3, EQ=0.5, Adrol=0.5 (Paradoxical), Others=0
  const aromatizationMap = {
    testosterone: 1.0,
    dianabol: 2.0,
    anadrol: 0.5, // Paradoxical
    eq: 0.5,
    npp: 0.2,
    deca: 0.2,
    ment: 3.0
  };

  let totalEstrogenLoad = 0;
  let totalSuppressives = 0;

  activeCompounds.forEach(c => {
    const factor = aromatizationMap[c.code] || 0;
    totalEstrogenLoad += c.dose * factor;
    if (['trenbolone', 'npp', 'deca', 'ment', 'rad140', 'lgd4033'].includes(c.code)) {
      totalSuppressives += c.dose;
    }
  });

  // Penalty A: "Crashed E2" (No Test Base)
  // If running suppressives (>200mg) with negligible estrogen (<100mg Test equivalent)
  if (totalSuppressives > 200 && totalEstrogenLoad < 100) {
    penalty += 3.0; // Massive penalty for "No Test Base" with suppressives
  }

  // Penalty B: "Estrogen Overload"
  // If estrogen load > 1000mg Test equivalent, management becomes exponential
  if (totalEstrogenLoad > 1000) {
    penalty += 1.0;
  }

  // 3. Renal Stress (Trenbolone + BP Drivers)
  const hasTren = activeCompounds.some(c => c.code === 'trenbolone');
  const hasHeavyBP = activeCompounds.some(c => ['anadrol', 'dianabol'].includes(c.code));
  const hasHighEQ = activeCompounds.some(c => c.code === 'eq' && c.dose > 600);

  if (hasTren && (hasHeavyBP || hasHighEQ)) {
    penalty += 2.0; // "Kidney Screamer" penalty
  }

  return penalty;
};

export const evaluateStack = ({
  stackInput = [],
  profile = defaultProfile,
  sensitivities = defaultSensitivities,
  evidenceBlend = 0.4,
  disableInteractions = false
} = {}) => {
  const { compounds, doses } = normalizeStackInput(stackInput);
  if (!compounds.length) {
    return baseResult();
  }

  const byCompound = {};
  const benefitDims = { base: 0 };
  const riskDims = { base: 0 };

  // 1. Check for SHBG Crushers (Proviron/Winstrol)
  const shbgCrusher = compounds.find(c => ['proviron', 'winstrol'].includes(c));
  const shbgBonus = shbgCrusher ? 1.1 : 1.0; // 10% Potency Boost to injectables if SHBG is crushed

  compounds.forEach(code => {
    const dose = doses[code] ?? 0;
    const compoundMeta = compoundData[code];
    
    // 2. Apply SHBG Bonus to Injectables ONLY (Orals don't bind SHBG the same way)
    let effectiveDose = dose;
    // Safety check: ensure compoundMeta exists before accessing properties
    if (compoundMeta && compoundMeta.type === 'injectable' && compoundMeta.pathway === 'ar_genomic') {
      effectiveDose = dose * shbgBonus;
    }

    const benefitRes = evaluateCompoundResponse(code, 'benefit', effectiveDose, profile);
    const riskRes = evaluateCompoundResponse(code, 'risk', effectiveDose, profile);
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

  const synergyBenefitSum = Object.entries(benefitDims)
    .filter(([key]) => key !== 'base')
    .reduce((acc, [, value]) => acc + value, 0);
  const synergyRiskSum = Object.entries(riskDims)
    .filter(([key]) => key !== 'base')
    .reduce((acc, [, value]) => acc + value, 0);

  const baseBenefit = benefitDims.base;
  const baseRisk = riskDims.base;
  
  // Apply Global Penalties
  const globalPenalty = calculateGlobalPenalties(compounds, doses, baseRisk + synergyRiskSum);
  
  const totalBenefit = baseBenefit + synergyBenefitSum;
  const totalRisk = baseRisk + synergyRiskSum + globalPenalty; // Add global penalty here

  const weightedBenefit = totalBenefit;
  const weightedRisk = totalRisk;

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
      brRatio,
      globalPenalty // Expose this for debugging/UI if needed
    }
  };
};
