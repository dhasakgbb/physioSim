import { evaluateCompoundResponse, evaluatePairDimension } from './interactionEngine';
import {
  interactionDimensions,
  interactionPairs,
  defaultSensitivities
} from '../data/interactionEngineData';
import { normalizeStackInput, resolvePairKey } from '../data/interactionMatrix';
import { defaultProfile } from './personalization';
import { compoundData } from '../data/compoundData';
import { MAX_PHENOTYPE_SCORE } from '../data/constants';

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
  let totalEstrogenLoad = 0;
  let totalSuppressives = 0;

  activeCompounds.forEach(c => {
    const factor = c.meta.flags?.aromatization || 0;
    totalEstrogenLoad += c.dose * factor;
    if (c.meta.flags?.isSuppressive) {
      totalSuppressives += c.dose;
    }
  });

  // Penalty A: "Crashed E2" (No Test Base)
  // Gradual penalty based on the ratio of suppressives to aromatizing compounds
  // This avoids sharp spikes in the chart
  if (totalSuppressives > 200) {
    const estrogenRatio = totalEstrogenLoad / totalSuppressives;
    // If ratio < 0.4 (e.g., 200mg Test for 500mg Tren), apply penalty
    // Penalty scales from 0 to 3.0 as ratio approaches 0
    if (estrogenRatio < 0.4) {
      const deficitSeverity = 1 - (estrogenRatio / 0.4); // 0 to 1
      penalty += deficitSeverity * 3.0; // Smooth curve from 0 to 3.0
    }
  }

  // Penalty B: "Estrogen Overload"
  // If estrogen load > 1000mg Test equivalent, management becomes exponential
  if (totalEstrogenLoad > 1000) {
    const excess = totalEstrogenLoad - 1000;
    penalty += Math.min(excess / 1000, 2.0); // Gradual up to 2.0
  }

  // 3. Renal Stress (Trenbolone + BP Drivers)
  const hasRenalToxic = activeCompounds.some(c => c.meta.flags?.isRenalToxic);
  const hasHeavyBP = activeCompounds.some(c => c.meta.flags?.isHeavyBP);
  const hasHighEQ = activeCompounds.some(c => c.code === 'eq' && c.dose > 600);

  if (hasRenalToxic && (hasHeavyBP || hasHighEQ)) {
    penalty += 2.0; // "Kidney Screamer" penalty
  }

  return penalty;
};

// NEW: Metabolite & Interaction Warnings (Scientific Safety)
const getInteractionWarnings = (compounds) => {
  const warnings = [];
  const codes = new Set(compounds);

  // 1. The "Deca Dick" / 5-AR Inhibitor Trap
  if (codes.has('npp') || codes.has('deca')) {
    warnings.push({
      type: 'metabolite',
      level: 'critical',
      message: '⚠️ 5-AR Inhibitor Contraindication: Nandrolone converts to DHN (weak androgen) via 5-alpha reductase. Taking Finasteride/Dutasteride blocks this, leaving potent Nandrolone to bind to scalp follicles. This GREATLY INCREASES hair loss risk.'
    });
  }

  // 2. The "19-Nor" Prolactin Synergy
  const nors = compounds.filter(c => ['npp', 'deca', 'trenbolone'].includes(c));
  if (nors.length > 1) {
    warnings.push({
      type: 'synergy',
      level: 'high',
      message: '⚠️ 19-Nor Stacking: Combining multiple 19-nor compounds (Tren, Deca, NPP) creates exponential prolactin and HPTA suppression risk. Dopamine agonists (Cabergoline) likely mandatory.'
    });
  }

  // 3. Oral Hepatotoxicity Synergy
  const orals = compounds.filter(c => compoundData[c]?.type === 'oral');
  if (orals.length > 1) {
    warnings.push({
      type: 'toxicity',
      level: 'high',
      message: '⚠️ Hepatotoxicity Synergy: Multiple C17-aa orals compete for the same hepatic enzymes. Toxicity is multiplicative, not additive. Ensure TUDCA/NAC doses are doubled.'
    });
  }

  return warnings;
};

export const evaluateStack = ({
  stackInput = [],
  profile = defaultProfile,
  sensitivities = defaultSensitivities,
  evidenceBlend = 0.4,
  disableInteractions = false
} = {}) => {
  const { compounds, doses } = normalizeStackInput(stackInput);
  if (!compounds.length) return baseResult();

  // 1. Calculate Raw Sums (Linear)
  const byCompound = {};
  
  // 1. TRACKING BUCKETS (The "Positive" Upgrade)
  let genomicBenefit = 0;      // Subject to Saturation
  let nonGenomicBenefit = 0;   // Bypasses Saturation
  let rawRiskSum = 0;
  
  let totalGenomicLoad = 0;    // For calculating Saturation %
  let totalSystemicLoad = 0;   // For calculating Risk %

  // 1. INITIALIZE TRACKER
  const phenotype = { hypertrophy: 0, strength: 0, endurance: 0, conditioning: 0 };

  // SHBG Bonus Logic
  const shbgCrushers = compounds.filter(c => ['proviron', 'winstrol', 'masteron'].includes(c));
  const shbgMultiplier = 1 + (Math.min(shbgCrushers.length, 3) * 0.05);

  compounds.forEach(code => {
    // Find the full item from stackInput to get the ester
    const stackItem = stackInput.find(i => i.compound === code);
    const dose = doses[code] ?? 0;
    const meta = compoundData[code];
    
    if (!meta) return;

    // 1. Determine Ester Weight
    // Default to 1.0 (Orals/Base) or the default ester's weight
    let weightFactor = 1.0;
    const esterKey = stackItem?.ester || meta.defaultEster;
    
    if (meta.esters && meta.esters[esterKey]) {
      weightFactor = meta.esters[esterKey].weight;
    }

    // 2. Calculate ACTIVE Hormone Load (The Real Dose)
    let activeDose = dose * weightFactor;

    // 2. INSERT THIS LOGIC TO CALCULATE SCORES
    if (meta.phenotype) {
       // Calculate Intensity (Cap at 120% of "Standard High Dose")
       const ceiling = meta.type === 'oral' ? 50 : 600; 
       const intensity = Math.min(activeDose / ceiling, 1.2); 

       phenotype.hypertrophy += meta.phenotype.hypertrophy * intensity;
       phenotype.strength += meta.phenotype.strength * intensity;
       phenotype.conditioning += meta.phenotype.conditioning * intensity;
       
       // Endurance Logic (Tren Penalty)
       if (code === 'trenbolone') {
         phenotype.endurance -= (10 - meta.phenotype.endurance) * intensity;
       } else {
         phenotype.endurance += meta.phenotype.endurance * intensity;
       }
    }

    // Track Loads
    // Systemic Load (Toxicity) = Raw Dose (metabolic burden of the ester + hormone)
    // Genomic Load (Saturation) = Active Dose (receptor binding)
    totalSystemicLoad += dose; 
    
    if (meta.pathway === 'ar_genomic') {
      // Weighted load: Tren counts 2x for saturation due to affinity
      const weight = meta.bindingAffinity === 'very_high' ? 2 : 1;
      totalGenomicLoad += activeDose * weight;
    }

    // Apply SHBG Bonus to Injectables only
    let effectiveDose = activeDose;
    if (meta.type === 'injectable' && meta.pathway === 'ar_genomic') {
      effectiveDose = activeDose * shbgMultiplier;
    }

    const benefitRes = evaluateCompoundResponse(code, 'benefit', effectiveDose, profile);
    const riskRes = evaluateCompoundResponse(code, 'risk', effectiveDose, profile);

    const benefitVal = benefitRes?.value ?? 0;
    const riskVal = riskRes?.value ?? 0;

    // --- BUCKET SORTING (The Scientific Fix) ---
    if (meta.pathway === 'non_genomic') {
      nonGenomicBenefit += benefitVal; // This is "Free" growth, bypasses AR saturation
    } else {
      genomicBenefit += benefitVal;    // This hits the ceiling  
    }
    
    rawRiskSum += riskVal;

    byCompound[code] = {
      benefit: benefitVal,
      risk: riskVal,
      meta: { benefit: benefitRes?.meta, risk: riskRes?.meta }
    };
  });

  // 2. Calculate Interaction Synergies (Linear)
  let synergyBenefit = 0;
  let synergyRisk = 0;
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
        const dimensionKeys = [...Object.keys(pair.synergy || {}), ...Object.keys(pair.penalties || {})];
        
        const pairDoses = { [compoundA]: doses[compoundA] ?? 0, [compoundB]: doses[compoundB] ?? 0 };

        dimensionKeys.forEach(dimKey => {
          const dim = interactionDimensions[dimKey];
          if (!dim) return;
          const res = evaluatePairDimension({
            pairId, dimensionKey: dimKey, doses: pairDoses,
            profile, sensitivities, evidenceBlend
          });
          if (!res?.delta) return;

          deltaDims[dimKey] = res.delta;
          if (dim.type === 'benefit') synergyBenefit += res.delta;
          else synergyRisk += Math.abs(res.delta);
        });

        if (Object.keys(deltaDims).length) pairInteractions[pairId] = { deltaDims };
      }
    });
  }

  // =================================================================================
  // 3. THE "PATHWAY BYPASS" LOGIC (Scientific Accuracy)
  // =================================================================================

  // A. The Saturation Ceiling (ONLY applies to AR/Genomic Pathway)
  const saturationThreshold = 1000;
  let saturationPenalty = 1.0;

  if (totalGenomicLoad > saturationThreshold) {
    const excess = totalGenomicLoad - saturationThreshold;
    saturationPenalty = 1 / (1 + (excess / 800)); 
  }
  
  // THE FIX: Apply penalty ONLY to Genomic Benefit
  // Non-Genomic Benefit + Synergy is added ON TOP (The "Positive" Aspect)
  const finalGenomic = genomicBenefit * saturationPenalty;
  const finalBenefit = finalGenomic + nonGenomicBenefit + synergyBenefit;

  // B. The Toxicity Avalanche (Applies to ALL compounds)
  const toxicityThreshold = 1200;
  let toxicityMultiplier = 1.0;
  if (totalSystemicLoad > toxicityThreshold) {
    const excessRisk = totalSystemicLoad - toxicityThreshold;
    toxicityMultiplier = 1 + Math.pow((excessRisk / 1500), 1.5);
  }

  // Apply Avalanche to Risk
  const finalRisk = (rawRiskSum + synergyRisk) * toxicityMultiplier;

  // -------------------------------------------------------
  // 4. Apply Specific "Protocol Failure" Penalties
  // -------------------------------------------------------
  // This catches things like "No Test Base", "Crashed E2", "Kidney Screamer"
  const protocolPenalty = calculateGlobalPenalties(compounds, doses, finalRisk);
  // We add this directly to risk to make the red line jump visually
  const adjustedRisk = finalRisk + protocolPenalty; 

  // 5. Generate Warnings
  const warnings = getInteractionWarnings(compounds);

  // 6. Final Tally
  const netScore = finalBenefit - adjustedRisk; // Use adjustedRisk
  const brRatio = adjustedRisk > 0 ? finalBenefit / adjustedRisk : finalBenefit;

  return {
    byCompound,
    pairInteractions,
    warnings, // Export warnings
    totals: {
      baseBenefit: genomicBenefit + nonGenomicBenefit,
      baseRisk: rawRiskSum,
      totalBenefit: Number(finalBenefit.toFixed(2)),
      totalRisk: Number(adjustedRisk.toFixed(2)), // Export the penalized risk
      netScore: Number(netScore.toFixed(2)),
      brRatio: Number(brRatio.toFixed(2)),
      // Return these for UI debugging/visualization
      saturationPenalty: saturationPenalty, 
      toxicityMultiplier: toxicityMultiplier,
      protocolPenalty: protocolPenalty, // Expose for debugging
      // NEW: Export pathway breakdown for chart tooltips
      genomicBenefit: Number(finalGenomic.toFixed(2)),
      nonGenomicBenefit: Number(nonGenomicBenefit.toFixed(2)),
      // Phenotype Profile
      phenotype: {
        hypertrophy: Math.min(Number(phenotype.hypertrophy.toFixed(2)), MAX_PHENOTYPE_SCORE),
        strength: Math.min(Number(phenotype.strength.toFixed(2)), MAX_PHENOTYPE_SCORE),
        endurance: Math.min(Number(phenotype.endurance.toFixed(2)), MAX_PHENOTYPE_SCORE),
        conditioning: Math.min(Number(phenotype.conditioning.toFixed(2)), MAX_PHENOTYPE_SCORE)
      }
    }
  };
};
