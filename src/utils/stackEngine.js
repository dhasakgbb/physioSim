import {
  evaluateCompoundResponse,
  evaluatePairDimension,
} from "./interactionEngine.js";
import {
  interactionDimensions,
  interactionPairs,
  defaultSensitivities,
} from "../data/interactionEngineData.js";
import {
  normalizeStackInput,
  resolvePairKey,
} from "../data/interactionMatrix.js";
import { defaultProfile } from "./personalization.js";
import { compoundData } from "../data/compoundData.js";

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const CONSTANTS = {
  SATURATION_THRESHOLD: 1500, // Increased for Open Class realism
  TOXICITY_THRESHOLD: 1200,
  ORAL_TOXICITY_THRESHOLD: 500,
  SUPPRESSION_THRESHOLD: 200,
  ESTROGEN_RATIO_THRESHOLD: 0.4,
  ESTROGEN_LOAD_LIMIT: 1000,
  ORAL_CEILING: 50,
  INJECTABLE_CEILING: 600,
  EVIDENCE_BLEND: 0.4,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Returns the full result schema with default zero values.
 * Ensures UI components never crash due to missing keys.
 */
const getEmptyResult = () => ({
  byCompound: {},
  pairInteractions: {},
  warnings: [],
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
    brRatio: 0,
    wastedMg: 0,
    saturationPenalty: 1.0,
    toxicityMultiplier: 1.0,
    protocolPenalty: 0,
    maxSuppression: 0,
    genomicBenefit: 0,
    nonGenomicBenefit: 0,
  },
});

/**
 * Determines if a compound usage is effectively oral.
 * Includes standard orals and Oral Primobolan (Acetate).
 */
const isOralUsage = (meta, code, ester) => {
  return meta.type === "oral" || (code === "primobolan" && ester === "acetate");
};

/**
 * Normalizes dose to a weekly equivalent.
 * Orals (Daily) * 7. Injectables (Weekly) * 1.
 */
const getWeeklyDose = (dose, isOral) => {
  return isOral ? dose * 7 : dose;
};

/**
 * Calculates the stability penalty based on injection frequency vs half-life.
 * Penalizes infrequent pinning of short esters.
 */
const calculateStabilityPenalty = (meta, esterKey, frequency, isOral) => {
  if (isOral) return 1.0; // Orals assumed daily/stable

  const freq = frequency || 1; // Default 1 pin/week
  const halfLifeHours =
    meta.esters?.[esterKey]?.halfLife || meta.halfLife || 24;
  const halfLifeDays = halfLifeHours / 24;
  const injectionInterval = 7 / freq;

  let penalty = 1.0;

  // Penalty if interval exceeds half-life (creating peaks/troughs)
  if (injectionInterval > halfLifeDays) {
    penalty = 1 + (injectionInterval - halfLifeDays) * 0.1;
  }

  // Extra penalty for volatile blends (e.g., Sustanon) if infrequent
  const isVolatileBlend = meta.esters?.[esterKey]?.isBlend;
  if (isVolatileBlend && freq < 3) {
    penalty += 0.2;
  }

  return penalty;
};

/**
 * Calculates global protocol penalties (Safety Checks).
 * Handles Oral Toxicity, Estrogen Management, and Renal Stress.
 */
const calculateGlobalPenalties = (activeCompounds, currentRisk) => {
  let penalty = 0;

  // 1. Oral Toxicity (Hepatic Stress)
  let totalOralToxicityLoad = 0;
  const orals = activeCompounds.filter((c) => c.isOral);

  orals.forEach((c) => {
    const tier = c.meta.toxicityTier ?? 2;
    totalOralToxicityLoad += c.weeklyDose * tier;
  });

  if (totalOralToxicityLoad > CONSTANTS.ORAL_TOXICITY_THRESHOLD) {
    const excess = totalOralToxicityLoad - CONSTANTS.ORAL_TOXICITY_THRESHOLD;
    penalty += excess * 0.003;
  }

  if (orals.length > 1) {
    penalty += (orals.length - 1) * 1.0; // Synergy penalty
  }

  // 2. Estrogen & Suppression Balance
  let totalEstrogenLoad = 0;
  let totalSuppressives = 0;

  activeCompounds.forEach((c) => {
    const factor = c.meta.flags?.aromatization || 0;
    totalEstrogenLoad += c.weeklyDose * factor;

    if (c.meta.flags?.isSuppressive) {
      totalSuppressives += c.weeklyDose;
    }
  });

  // Penalty: "Crashed E2" (High Suppression, Low Estrogen)
  if (totalSuppressives > CONSTANTS.SUPPRESSION_THRESHOLD) {
    const estrogenRatio =
      totalSuppressives > 0 ? totalEstrogenLoad / totalSuppressives : 0;

    if (estrogenRatio < CONSTANTS.ESTROGEN_RATIO_THRESHOLD) {
      const deficitSeverity =
        1 - estrogenRatio / CONSTANTS.ESTROGEN_RATIO_THRESHOLD;
      penalty += deficitSeverity * 3.0;
    }
  }

  // Penalty: "Estrogen Overload"
  if (totalEstrogenLoad > CONSTANTS.ESTROGEN_LOAD_LIMIT) {
    const excess = totalEstrogenLoad - CONSTANTS.ESTROGEN_LOAD_LIMIT;
    penalty += Math.min(excess / 1000, 2.0);
  }

  // 3. Renal Stress (Trenbolone + BP Drivers)
  const hasRenalToxic = activeCompounds.some((c) => c.meta.flags?.isRenalToxic);
  const hasHeavyBP = activeCompounds.some((c) => c.meta.flags?.isHeavyBP);
  const hasHighEQ = activeCompounds.some(
    (c) => c.code === "eq" && c.dose > 600,
  );

  if (hasRenalToxic && (hasHeavyBP || hasHighEQ)) {
    penalty += 2.0;
  }

  return penalty;
};

/**
 * Generates specific warnings for dangerous combinations.
 */
const getInteractionWarnings = (compounds) => {
  const warnings = [];
  const codes = new Set(compounds);

  // 1. 5-AR Inhibitor Trap (Deca/NPP + Finasteride)
  const hasFinasteride = codes.has("finasteride");
  const hasNandrolone = codes.has("npp") || codes.has("deca");

  if (hasFinasteride && hasNandrolone) {
    warnings.push({
      type: "metabolite",
      level: "critical",
      message:
        "⚠️ HAIR LOSS NUCLEAR WINTER: You are combining Finasteride with Nandrolone. Finasteride blocks 5-AR, preventing Nandrolone from converting to DHN (hair safe). It remains as pure Nandrolone, which is HIGHLY ANDROGENIC in the scalp. You are maximizing hair loss.",
    });
  } else if (hasNandrolone) {
    warnings.push({
      type: "metabolite",
      level: "warning",
      message:
        "⚠️ 5-AR Interaction Note: Nandrolone converts to DHN (hair safe). Do NOT take Finasteride with this stack, or you will accelerate hair loss.",
    });
  } else if (hasFinasteride && codes.has("testosterone")) {
    warnings.push({
      type: "safety",
      level: "success",
      message:
        "✅ Hair Safe Protocol: Finasteride is blocking Testosterone conversion to DHT. This significantly reduces hair loss risk.",
    });
  }

  // 2. 19-Nor Synergy
  const nors = compounds.filter((c) =>
    ["npp", "deca", "trenbolone"].includes(c),
  );
  if (nors.length > 1) {
    warnings.push({
      type: "synergy",
      level: "high",
      message:
        "⚠️ 19-Nor Stacking: Combining multiple 19-nor compounds (Tren, Deca, NPP) creates exponential prolactin and HPTA suppression risk. Dopamine agonists (Cabergoline) likely mandatory.",
    });
  }

  // 3. No Test Base (Hormonal Crash Risk)
  // We check if there are suppressive compounds but insufficient estrogen/testosterone
  // This mirrors the logic in calculateGlobalPenalties but provides the text warning
  let totalEstrogenLoad = 0;
  let totalSuppressives = 0;
  // We need to re-calculate these sums briefly for the warning check
  // Note: In a perfect world we'd pass these in, but for now we re-iterate for safety
  compounds.forEach((c) => {
    const meta = compoundData[c];
    if (!meta) return;
    // Approximate weekly dose for the check (assuming standard usage)
    // We don't have exact doses here easily without re-parsing, but we can check presence
    // Actually, let's just check for "Suppressive without Test/Dbol/HCG"
    // Simpler heuristic for the warning text:
    if (meta.flags?.isSuppressive) totalSuppressives++;
    if (meta.flags?.aromatization > 0) totalEstrogenLoad++;
  });

  if (totalSuppressives > 0 && totalEstrogenLoad === 0) {
    warnings.push({
      type: "hormonal",
      level: "critical",
      message:
        "⚠️ NO TEST BASE DETECTED: You are running suppressive compounds without a Testosterone base (or aromatizing equivalent). This guarantees crashed Estrogen (E2), lethargy, libido loss, and joint pain. Add Testosterone.",
    });
  }

  // 3. Oral Hepatotoxicity Synergy
  const orals = compounds.filter((c) => compoundData[c]?.type === "oral");
  if (orals.length > 1) {
    warnings.push({
      type: "toxicity",
      level: "high",
      message:
        "⚠️ Hepatotoxicity Synergy: Multiple C17-aa orals compete for the same hepatic enzymes. Toxicity is multiplicative, not additive. Ensure TUDCA/NAC doses are doubled.",
    });
  }

  // 4. Renal Stress (Trenbolone + BP Drivers)
  // Trenbolone is renal toxic. Anadrol/Dbol/EQ drive BP. The combo is kidney suicide.
  const hasRenalToxic = compounds.some(
    (c) => compoundData[c]?.flags?.isRenalToxic,
  );
  const hasHeavyBP = compounds.some((c) => compoundData[c]?.flags?.isHeavyBP);
  const hasHighEQ = compounds.some((c) => c === "eq"); // EQ is a BP driver at high doses

  if (hasRenalToxic && (hasHeavyBP || hasHighEQ)) {
    warnings.push({
      type: "toxicity",
      level: "critical",
      message:
        "⚠️ KIDNEY STRESS CRITICAL: You are stacking Trenbolone (Renal Toxic) with a heavy Blood Pressure driver (Anadrol/Dbol/EQ). This creates a 'Renal Clamp' effect—high BP forces blood into inflamed kidneys. Glomerular filtration rate (GFR) may crash.",
    });
  }

  return warnings;
};

// ============================================================================
// MAIN ENGINE
// ============================================================================

export const evaluateStack = ({
  stackInput = [],
  profile = defaultProfile,
  sensitivities = defaultSensitivities,
  evidenceBlend = CONSTANTS.EVIDENCE_BLEND,
  disableInteractions = false,
  durationWeeks = 12,
} = {}) => {
  // 0. Validation & Normalization
  const { compounds, doses } = normalizeStackInput(stackInput);
  if (!compounds.length) return getEmptyResult();

  // 1. State Initialization
  const state = {
    genomicBenefit: 0,
    nonGenomicBenefit: 0,
    rawRiskSum: 0,
    totalGenomicLoad: 0,
    totalSystemicLoad: 0,
    wastedMg: 0,
    maxSuppression: 0,
    byCompound: {},
    activeCompounds: [], // For global penalties
  };

  // Calculate Duration Penalties
  // 1. Oral Toxicity is Exponential over time (Safe baseline ~6 weeks)
  const oralDurationPenalty =
    durationWeeks > 6 ? Math.pow(durationWeeks / 6, 1.5) : 1.0;

  // 2. HPTA Suppression is Linear over time (Recovery gets harder)
  const suppressionPenalty = Math.max(0, (durationWeeks - 12) / 4) * 0.5;

  // SHBG Logic (Dose Dependent)
  let shbgCrushScore = 0;
  if (doses["proviron"]) shbgCrushScore += (doses["proviron"] * 7) / 350; // 50mg/day = 1.0
  if (doses["winstrol"]) shbgCrushScore += (doses["winstrol"] * 7) / 350; // 50mg/day = 1.0
  if (doses["masteron"]) shbgCrushScore += doses["masteron"] / 400; // 400mg/week = 1.0

  // Cap the multiplier to avoid game-breaking numbers (max 20% boost)
  const shbgMultiplier = 1 + Math.min(shbgCrushScore, 2.0) * 0.1;

  // 2. Primary Compound Loop
  compounds.forEach((code) => {
    const stackItem = stackInput.find((i) => i.compound === code);
    const dose = doses[code] ?? 0;
    const meta = compoundData[code];

    if (!meta) return;

    // A. Metadata & Normalization
    const esterKey = stackItem?.ester || meta.defaultEster;
    const isOral = isOralUsage(meta, code, esterKey);
    const weeklyDose = getWeeklyDose(dose, isOral);

    // Store for Global Penalties
    state.activeCompounds.push({ code, meta, dose, weeklyDose, isOral });

    // B. Bioavailability & Active Dose
    const specificBioavailability = meta.esters?.[esterKey]?.bioavailability;
    const bioavailability =
      specificBioavailability ?? (meta.bioavailability || 1.0);
    const weightFactor = meta.esters?.[esterKey]?.weight || 1.0;

    const activeGenomicDose = weeklyDose * weightFactor * bioavailability;
    state.wastedMg += weeklyDose - activeGenomicDose;

    // D. Load Tracking
    state.totalSystemicLoad += weeklyDose;
    if (meta.pathway === "ar_genomic") {
      const weight = meta.bindingAffinity === "very_high" ? 2 : 1;
      state.totalGenomicLoad += activeGenomicDose * weight;
    }
    if (meta.suppressiveFactor) {
      state.maxSuppression = Math.max(
        state.maxSuppression,
        meta.suppressiveFactor,
      );
    }

    // E. Benefit & Risk Evaluation (Curve Lookup)
    const benefitRes = evaluateCompoundResponse(code, "benefit", dose, profile);
    const riskRes = evaluateCompoundResponse(code, "risk", dose, profile);

    let benefitVal = benefitRes?.value ?? 0;
    let riskVal = riskRes?.value ?? 0;

    // Apply SHBG Bonus (Injectables only)
    if (meta.type === "injectable" && meta.pathway === "ar_genomic") {
      // Note: Benefit curves are pre-calibrated, but this boosts efficiency
      // We apply it as a multiplier to the outcome
      benefitVal *= shbgMultiplier;
    }

    // Apply Stability Penalty
    const stabilityPenalty = calculateStabilityPenalty(
      meta,
      esterKey,
      stackItem?.frequency,
      isOral,
    );
    riskVal *= stabilityPenalty;

    // Apply Oral Duration Penalty
    if (isOral) {
      riskVal *= oralDurationPenalty;
    }

    // F. Bucket Sorting
    if (meta.pathway === "non_genomic") {
      state.nonGenomicBenefit += benefitVal;
    } else {
      state.genomicBenefit += benefitVal;
    }
    state.rawRiskSum += riskVal;

    state.byCompound[code] = {
      benefit: benefitVal,
      risk: riskVal,
      meta: { benefit: benefitRes?.meta, risk: riskRes?.meta },
    };
  });

  // 3. Interaction Synergies (O(N^2))
  let synergyBenefit = 0;
  let synergyRisk = 0;
  const pairInteractions = {};

  if (!disableInteractions && compounds.length > 1) {
    compounds.forEach((compoundA, i) => {
      for (let j = i + 1; j < compounds.length; j++) {
        const compoundB = compounds[j];
        const pairId = resolvePairKey(compoundA, compoundB);
        if (!pairId || !interactionPairs[pairId]) continue;

        const pair = interactionPairs[pairId];
        const deltaDims = {};
        const dimensionKeys = [
          ...Object.keys(pair.synergy || {}),
          ...Object.keys(pair.penalties || {}),
        ];
        const pairDoses = {
          [compoundA]: doses[compoundA] ?? 0,
          [compoundB]: doses[compoundB] ?? 0,
        };

        dimensionKeys.forEach((dimKey) => {
          const dim = interactionDimensions[dimKey];
          if (!dim) return;

          const res = evaluatePairDimension({
            pairId,
            dimensionKey: dimKey,
            doses: pairDoses,
            profile,
            sensitivities,
            evidenceBlend,
          });

          if (res?.delta) {
            deltaDims[dimKey] = res.delta;
            if (dim.type === "benefit") synergyBenefit += res.delta;
            else synergyRisk += Math.abs(res.delta);
          }
        });

        if (Object.keys(deltaDims).length)
          pairInteractions[pairId] = { deltaDims };
      }
    });
  }

  // 4. Advanced Modeling (Saturation & Toxicity)

  // A. Genomic Saturation (Log-Logistic Upregulation)
  let genomicFactor = 1.0;
  if (state.totalGenomicLoad > CONSTANTS.SATURATION_THRESHOLD) {
    const excess = state.totalGenomicLoad - CONSTANTS.SATURATION_THRESHOLD;
    // Logarithmic Diminishing Returns: Smooth transition from slope 1.0 to slope ~0
    // Formula: Threshold + Scale * ln(1 + excess/Scale)
    // Scale = 2500 pushes the "hard diminishing returns" out to ~4000mg+
    const scale = 2500;
    const dampenedExcess = scale * Math.log(1 + excess / scale);
    const projectedTotal = CONSTANTS.SATURATION_THRESHOLD + dampenedExcess;
    genomicFactor = projectedTotal / state.totalGenomicLoad;
  }

  const finalGenomic = (state.genomicBenefit + synergyBenefit) * genomicFactor;
  const finalBenefit = finalGenomic + state.nonGenomicBenefit;

  // B. Toxicity Avalanche
  let toxicityMultiplier = 1.0;
  if (state.totalSystemicLoad > CONSTANTS.TOXICITY_THRESHOLD) {
    const excessRisk = state.totalSystemicLoad - CONSTANTS.TOXICITY_THRESHOLD;
    toxicityMultiplier = 1 + Math.pow(excessRisk / 1500, 1.5);
  }

  const finalRisk = (state.rawRiskSum + synergyRisk) * toxicityMultiplier;

  // 5. Global Safety Protocols
  const protocolPenalty = calculateGlobalPenalties(
    state.activeCompounds,
    finalRisk,
  );
  const adjustedRisk = finalRisk + protocolPenalty + suppressionPenalty;

  // 2. Apply Time-Based Toxicity Scaling (The "Time Machine" Logic)
  // Liver/Kidney stress compounds over time.
  // Formula: If duration > 8 weeks, risk scales non-linearly.
  const timePenaltyFactor =
    durationWeeks > 8 ? Math.pow(durationWeeks / 8, 1.5) : 1.0;

  // Apply to the adjustedRisk
  // We apply this AFTER the protocol penalties
  const chronicRisk = adjustedRisk * timePenaltyFactor;

  // 6. Final Scoring
  const netScore = finalBenefit - chronicRisk;
  const brRatio =
    chronicRisk > 0.1 ? finalBenefit / chronicRisk : finalBenefit; // Prevent div/0

  // 7. Construct Result
  return {
    byCompound: state.byCompound,
    pairInteractions,
    warnings: getInteractionWarnings(compounds),
    totals: {
      baseBenefit: state.genomicBenefit + state.nonGenomicBenefit,
      baseRisk: state.rawRiskSum,
      totalBenefit: Number(finalBenefit.toFixed(2)),
      totalRisk: Number(chronicRisk.toFixed(2)),
      netScore: Number(netScore.toFixed(2)),
      brRatio: Number(brRatio.toFixed(2)),

      // Debug & Visualization Metrics
      saturationPenalty: genomicFactor,
      toxicityMultiplier,
      protocolPenalty,
      maxSuppression: state.maxSuppression,
      genomicBenefit: Number(finalGenomic.toFixed(2)),
      nonGenomicBenefit: Number(state.nonGenomicBenefit.toFixed(2)),
      wastedMg: Number(state.wastedMg.toFixed(1)),
    },
  };
};
