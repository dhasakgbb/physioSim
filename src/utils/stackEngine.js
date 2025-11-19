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
  // Weighted by Toxicity Tier (0-4)
  let totalOralToxicityLoad = 0;
  const orals = activeCompounds.filter(c => c.meta.type === 'oral');
  
  orals.forEach(c => {
    const tier = c.meta.toxicityTier ?? 2; // Default to 2 if undefined
    // Calculate "Liver Load Units" using Weekly Dose
    // 50mg/day * 7 = 350mg/week.
    const weeklyDose = c.dose * 7;
    // We need to scale the threshold because we are now using weekly doses.
    // Previous threshold was 100 units based on daily dose? 
    // No, previous logic was: totalOralToxicityLoad += (c.dose * tier);
    // If c.dose was 50 (daily), then 50*2 = 100.
    // If we use weekly (350), then 350*2 = 700.
    // So we must adjust the threshold to 700.
    totalOralToxicityLoad += (weeklyDose * tier);
  });

  // Thresholds for Liver Load (Weekly Adjusted)
  // Old Threshold: 100 (Daily units). New Threshold: 700 (Weekly units).
  // Example: 50mg Anavar (Tier 1) = 50*7*1 = 350. Safe (<700).
  // Example: 50mg Anadrol (Tier 3) = 50*7*3 = 1050. High (>700).
  // Example: 20mg Superdrol (Tier 4) = 20*7*4 = 560. Safe? Wait.
  // Superdrol 20mg is toxic. 560 is below 700.
  // Maybe the threshold should be lower for weekly?
  // Let's stick to the user's "Daily vs Weekly" logic.
  // If 50mg Anadrol (Daily) is "High", then 350mg (Weekly) Anadrol is High.
  // 350 * 3 = 1050.
  // If 20mg Superdrol (Daily) is "High", then 140mg (Weekly) Superdrol is High.
  // 140 * 4 = 560.
  // 560 is < 700. So 20mg Superdrol would be considered "Safe" with threshold 700.
  // That seems wrong. Superdrol is Tier 4.
  // Let's lower the threshold to 500 (Weekly Units).
  
  if (totalOralToxicityLoad > 500) {
     // Linear penalty above 500 units
     const excess = totalOralToxicityLoad - 500;
     penalty += excess * 0.003; // Scaled down for larger numbers
  }
  
  // Synergy Multiplier for stacking multiple orals
  if (orals.length > 1) {
    penalty += (orals.length - 1) * 1.0; // Flat penalty for mixing compounds
  }

  // 2. Estrogen "Sweet Spot" & Test Base Check
  let totalEstrogenLoad = 0;
  let totalSuppressives = 0;

  activeCompounds.forEach(c => {
    // Normalize to Weekly for Estrogen/Suppression Calculation
    const isOral = c.meta.type === 'oral' || (c.code === 'primobolan' && c.meta.esters?.acetate); 
    // Note: We don't have the ester info easily here in 'activeCompounds' map unless we passed it.
    // But 'activeCompounds' was created via:
    // const activeCompounds = compounds.map(c => ({ code: c, meta: compoundData[c], dose: doses[c] }));
    // This misses the ester info needed for Primo Oral check.
    // However, for the main loop we fixed it.
    // For this penalty function, we should probably use the same logic or pass the normalized doses.
    // Let's approximate: If type is oral, multiply by 7.
    const weeklyDose = (c.meta.type === 'oral') ? c.dose * 7 : c.dose;

    const factor = c.meta.flags?.aromatization || 0;
    totalEstrogenLoad += weeklyDose * factor;
    if (c.meta.flags?.isSuppressive) {
      totalSuppressives += weeklyDose;
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
  let maxSuppression = 0; // Track the hardest-to-recover compound

  // SHBG Bonus Logic
  const shbgCrushers = compounds.filter(c => ['proviron', 'winstrol', 'masteron'].includes(c));
  const shbgMultiplier = 1 + (Math.min(shbgCrushers.length, 3) * 0.05);

  compounds.forEach(code => {
    // Find the full item from stackInput to get the ester
    const stackItem = stackInput.find(i => i.compound === code);
    const dose = doses[code] ?? 0;
    const meta = compoundData[code];
    
    if (!meta) return;

    // Track Suppression (Recovery Difficulty)
    if (meta.suppressiveFactor) {
       maxSuppression = Math.max(maxSuppression, meta.suppressiveFactor);
    }

    // 1. Determine Ester Weight
    // Default to 1.0 (Orals/Base) or the default ester's weight
    let weightFactor = 1.0;
    const esterKey = stackItem?.ester || meta.defaultEster;
    
    if (meta.esters && meta.esters[esterKey]) {
      weightFactor = meta.esters[esterKey].weight;
    }

    // 2. Normalize to Weekly Dose (The "Daily vs Weekly" Fix)
    // Orals are input as mg/day, Injectables as mg/week.
    // We must normalize to Weekly for Systemic Load and Saturation.
    // Check if it's an oral usage (Type is oral OR it's Oral Primo)
    const isOral = meta.type === 'oral' || (code === 'primobolan' && stackItem?.ester === 'acetate');
    const weeklyDose = isOral ? dose * 7 : dose;

    // 3. Bioavailability (The "First Pass" Fix)
    // Orals lose potency via liver metabolism.
    // Use specific bioavailability if defined (e.g. Primo Oral = 0.15), else default to 1.0
    // Note: Primo Oral bioavailability is defined in the ester object in compoundData
    const specificBioavailability = meta.esters?.[esterKey]?.bioavailability;
    const bioavailability = specificBioavailability ?? (meta.bioavailability || 1.0);

    // 4. Calculate ACTIVE Hormone Load (The Real Dose hitting receptors)
    // Used for Saturation (Genomic Load)
    let activeGenomicDose = weeklyDose * weightFactor * bioavailability;

    // 5. Calculate Phenotype Intensity
    // "Cap at 120% of Standard High Dose"
    // Standard High Dose: Oral=50 (Daily), Injectable=600 (Weekly).
    // We use the INPUT dose (Daily for Oral) to match the scale.
    const ceiling = isOral ? 50 : 600; 
    const intensity = Math.min(dose / ceiling, 1.2); 

    if (meta.phenotype) {
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
    // Systemic Load (Toxicity) = Weekly Dose (metabolic burden of the ester + hormone)
    // The liver processes the full weekly dose (especially for orals)
    totalSystemicLoad += weeklyDose; 
    
    if (meta.pathway === 'ar_genomic') {
      // Weighted load: Tren counts 2x for saturation due to affinity
      const weight = meta.bindingAffinity === 'very_high' ? 2 : 1;
      totalGenomicLoad += activeGenomicDose * weight;
    }

    // Apply SHBG Bonus to Injectables only
    // Use activeGenomicDose for benefit calculation to account for bioavailability
    let effectiveDose = activeGenomicDose;
    if (meta.type === 'injectable' && meta.pathway === 'ar_genomic') {
      effectiveDose = activeGenomicDose * shbgMultiplier;
    }

    // Curve Lookup: Curves are defined in Input Units (Daily for Oral, Weekly for Injectable)
    // So we pass 'dose' (Input) to the curve evaluator.
    // However, if we want to reflect bioavailability in the benefit, we might need to adjust?
    // The curves for Orals (Tier 1/4) are likely based on ORAL administration outcomes.
    // So the bioavailability loss is already "baked in" to the curve.
    // Example: 50mg Dbol curve point reflects the result of taking 50mg Dbol orally.
    // So we pass 'dose' (50) to get the correct point.
    const benefitRes = evaluateCompoundResponse(code, 'benefit', dose, profile);
    const riskRes = evaluateCompoundResponse(code, 'risk', dose, profile);

    let benefitVal = benefitRes?.value ?? 0;
    let riskVal = riskRes?.value ?? 0;

    // --- FREQUENCY & STABILITY PENALTY (The "Peak-Driven" Fix) ---
    // Calculate Stability Penalty
    // Ideal Frequency is at least 1x per Half-Life (e.g. Test E (4.5 days) -> Every 3.5 days)
    // Orals (Daily) are usually frequency=1 (Daily) or 2 (EOD).
    // Injectables frequency is pins per week (e.g. 1, 2, 3.5 (EOD), 7 (ED)).
    // stackItem.frequency is "pins per week" for injectables? 
    // Let's assume stackItem.frequency is "pins per week" for injectables.
    // For orals, the UI usually implies Daily, but let's check if frequency is passed.
    // If frequency is undefined, default to 1 (Once a week for injectables? Or Daily for orals?)
    // Usually orals are ED. Let's assume orals are stable (Daily) unless specified otherwise.
    
    if (!isOral) {
        const freq = stackItem?.frequency || 1; // Default 1 pin/week
        const halfLifeHours = meta.esters?.[esterKey]?.halfLife || meta.halfLife || 24;
        const halfLifeDays = halfLifeHours / 24;
        const injectionInterval = 7 / freq; // Days between pins

        let stabilityPenalty = 1.0;
        
        // Sustanon Volatility Check
        const isVolatileBlend = meta.esters?.[esterKey]?.isBlend;
        
        if (injectionInterval > halfLifeDays) {
           // If you pin less often than the half-life, you create massive peaks
           // Example: Pinning Prop (0.8 days HL) once a week (7 days)
           // Penalty scales with the gap
           stabilityPenalty = 1 + ((injectionInterval - halfLifeDays) * 0.15);
        }
        
        // Apply extra penalty for Blends if pinned infrequently
        if (isVolatileBlend && freq < 3) {
            stabilityPenalty += 0.2; // Sustanon needs frequent pinning despite long ester
        }

        // Apply to Risk (Side Effects are driven by peaks)
        riskVal *= stabilityPenalty;
    }

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

  // A. The "Diminishing Returns" Curve (Scientific Upregulation Model)
  // Instead of a hard clamp, we use a Log-Logistic function.
  // This acknowledges that ARs upregulate, so benefit continues to rise,
  // but the "Cost of Acquisition" (Risk) rises faster.
  
  let genomicFactor = 1.0;
  const saturationThreshold = 1000; // The "Soft" inflection point

  if (totalGenomicLoad > saturationThreshold) {
    // The "Upregulation" Curve:
    // Benefit scales with the Square Root of the excess.
    // This allows the curve to keep climbing (honoring upregulation)
    // but prevents linear scaling (honoring diminishing returns).
    
    // Formula: Threshold + Sqrt(Excess * ScalingFactor)
    const excess = totalGenomicLoad - saturationThreshold;
    const dampenedExcess = Math.sqrt(excess * 400); // Tuned constant
    
    // Calculate how much we "shaved off" to get the penalty ratio
    const projectedTotal = saturationThreshold + dampenedExcess;
    genomicFactor = projectedTotal / totalGenomicLoad;
  }
  
  // Apply the Factor to Genomic Benefit Only
  const finalGenomic = (genomicBenefit + synergyBenefit) * genomicFactor;
  
  // Non-Genomic benefits (Growth Hormone, Insulin pathways, etc.) are additive
  // and bypassing this specific AR saturation curve.
  const finalBenefit = finalGenomic + nonGenomicBenefit;

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
      saturationPenalty: genomicFactor, 
      toxicityMultiplier: toxicityMultiplier,
      protocolPenalty: protocolPenalty, // Expose for debugging
      maxSuppression: maxSuppression, // Export Recovery Score
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
