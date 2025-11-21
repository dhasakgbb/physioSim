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
import { COMPOUND_VECTORS } from "../data/pathwayMap.js";
import {
  calculateCycleMetrics,
  calculateActiveLoad,
  calculateEfficiencyMetrics,
  calculateProjectedGains,
  calculateSystemLoad,
  calculateProjectedLabsWidget,
} from "./simulationEngine.js";
import { DEFAULT_HILL_PARAMS } from "../data/constants.js";

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const CONSTANTS = {
  SATURATION_THRESHOLD: 1500,
  TOXICITY_THRESHOLD: 1200,
  ORAL_TOXICITY_THRESHOLD: 500,
  SUPPRESSION_THRESHOLD: 200,
  ESTROGEN_RATIO_THRESHOLD: 0.4,
  ESTROGEN_LOAD_LIMIT: 1000,
  ORAL_CEILING: 50,
  INJECTABLE_CEILING: 600,
  EVIDENCE_BLEND: 0.4,
};

const PATHWAY_KEY_MAPPING = {
  neuro: "non_genomic",
  nitrogen: "ar_genomic",
  igf1: "ar_genomic",
  anti_e: "estrogen",
  rbc: "liver",
  dht: "non_genomic",
};

const DEFAULT_CONCENTRATIONS = {
  testosterone: 250,
  nandrolone: 200,
  deca: 200,
  npp: 100,
  trenbolone: 100,
  primobolan: 100,
  masteron: 100,
  eq: 200,
  ment: 100,
  dhb: 100,
  boldenone: 200,
};

const DEFAULT_INJECTABLE_CONCENTRATION = 200;
const DEFAULT_EFFICACY = 10;
const MIN_POTENCY = 0.1;
const MIN_EC50 = 1;
const HILL_PARAM_CACHE = new WeakMap();

const safeNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const getCurveMax = (curve = []) => {
  if (!Array.isArray(curve) || !curve.length) return 0;
  return curve.reduce((max, point) => {
    const val = safeNumber(point?.value, 0);
    return val > max ? val : max;
  }, 0);
};

const findHalfMaxDose = (curve = [], halfMax = 0) => {
  if (!Array.isArray(curve) || curve.length < 2 || halfMax <= 0) {
    return 0;
  }

  for (let i = 0; i < curve.length - 1; i++) {
    const current = curve[i];
    const next = curve[i + 1];
    const currentValue = safeNumber(current?.value, 0);
    const nextValue = safeNumber(next?.value, 0);
    const crossesHalf =
      (currentValue - halfMax) === 0 ||
      (nextValue - halfMax) === 0 ||
      (currentValue - halfMax) * (nextValue - halfMax) < 0;

    if (!crossesHalf) continue;

    const currentDose = safeNumber(current?.dose, 0);
    const nextDose = safeNumber(next?.dose, 0);
    const deltaValue = nextValue - currentValue;
    if (Math.abs(deltaValue) < 1e-6) {
      return Math.max(MIN_EC50, nextDose);
    }

    const ratio = (halfMax - currentValue) / deltaValue;
    const interpolatedDose = currentDose + ratio * (nextDose - currentDose);
    if (Number.isFinite(interpolatedDose) && interpolatedDose > 0) {
      return Math.max(MIN_EC50, interpolatedDose);
    }
  }

  return 0;
};

const deriveHillParams = (meta = {}) => {
  if (!meta || typeof meta !== "object") {
    return {
      emax: DEFAULT_EFFICACY,
      ec50: DEFAULT_HILL_PARAMS.D50,
      hillCoefficient: DEFAULT_HILL_PARAMS.N,
    };
  }

  if (HILL_PARAM_CACHE.has(meta)) {
    return HILL_PARAM_CACHE.get(meta);
  }

  const customSignal = meta.signal || meta.signalModel || {};
  const emaxCandidate = safeNumber(
    customSignal.emax ?? meta.emax ?? meta.maxSignal,
    0,
  );
  const curveMax = getCurveMax(meta.benefitCurve);
  const emax = Math.max(0, emaxCandidate || curveMax || DEFAULT_EFFICACY);

  const explicitEc50 = safeNumber(customSignal.ec50 ?? meta.ec50, 0);
  let ec50 = explicitEc50;
  if (!ec50 || ec50 <= 0) {
    const potency = Math.max(
      MIN_POTENCY,
      safeNumber(customSignal.potency ?? meta.potency ?? meta.basePotency, 1),
    );
    const derivedFromCurve = findHalfMaxDose(meta.benefitCurve, emax / 2);
    ec50 = derivedFromCurve || DEFAULT_HILL_PARAMS.D50 / potency;
  }
  ec50 = Math.max(MIN_EC50, ec50);

  const hillCoefficient = Math.max(
    0.5,
    safeNumber(
      customSignal.hillCoefficient ??
        customSignal.n ??
        meta.hillCoefficient ??
        DEFAULT_HILL_PARAMS.N,
      DEFAULT_HILL_PARAMS.N,
    ),
  );

  const params = { emax, ec50, hillCoefficient };
  HILL_PARAM_CACHE.set(meta, params);
  return params;
};

const hillResponse = (dose, { emax, ec50, hillCoefficient }) => {
  const concentration = Math.max(0, safeNumber(dose, 0));
  if (concentration <= 0 || !Number.isFinite(emax) || emax <= 0) return 0;
  const n = hillCoefficient || DEFAULT_HILL_PARAMS.N;
  const poweredDose = Math.pow(concentration, n);
  const poweredEc50 = Math.pow(Math.max(MIN_EC50, ec50), n);
  if (!Number.isFinite(poweredDose) || !Number.isFinite(poweredEc50)) return 0;
  const denominator = poweredEc50 + poweredDose;
  if (denominator <= 0) return 0;
  return (emax * poweredDose) / denominator;
};

export const evaluateHillSignal = (dose, meta) => {
  const params = deriveHillParams(meta);
  const value = hillResponse(dose, params);
  return { value, params };
};

const buildPhysicsStack = (activeCompounds, stackInput = []) => {
  if (!Array.isArray(activeCompounds) || !activeCompounds.length) return [];
  const lookup = Object.create(null);
  stackInput.forEach((item) => {
    if (item?.compound) lookup[item.compound] = item;
  });

  return activeCompounds.map((entry) => {
    const source = lookup[entry.code] || {};
    const isOral = Boolean(entry.isOral);
    const rawFrequency = source.frequency ?? entry.frequency;
    const normalizedFrequency = isOral ? 7 : Math.max(rawFrequency || 1, 1);
    const baseDosage = isOral
      ? source.dose ?? entry.dose ?? entry.weeklyDose / normalizedFrequency
      : (entry.weeklyDose || 0) / normalizedFrequency;

    return {
      id: entry.code,
      dosage: Number.isFinite(baseDosage) ? baseDosage : 0,
      frequency: normalizedFrequency,
      ester: source.ester || entry.ester || entry.meta?.defaultEster,
    };
  });
};

const calculateInjectionLogistics = (activeCompounds = []) => {
  let totalWeeklyVolume = 0;
  let maxPerInjection = 0;
  let maxPipScore = 0;
  let hasWeeklyMegaShot = false;
  const perInjectionShots = [];

  activeCompounds.forEach((entry) => {
    const { meta, weeklyDose, code, frequency } = entry;
    if (!meta || meta.type !== "injectable") return;

    const concentration =
      meta.concentration ||
      DEFAULT_CONCENTRATIONS[code] ||
      DEFAULT_CONCENTRATIONS[meta.category] ||
      DEFAULT_INJECTABLE_CONCENTRATION;

    if (!concentration || concentration <= 0) return;

    const weeklyMl = weeklyDose / concentration;
    if (!Number.isFinite(weeklyMl) || weeklyMl <= 0) return;

    totalWeeklyVolume += weeklyMl;

    const intervalDays = Math.max(Number(frequency) || 7, 0.5);
    const injectionsPerWeek = Math.max(1, 7 / intervalDays);
    const perInjectionMl = weeklyMl / injectionsPerWeek;
    maxPerInjection = Math.max(maxPerInjection, perInjectionMl);
    perInjectionShots.push({ code, perInjectionMl, intervalDays });

    if (intervalDays >= 6 && perInjectionMl > 5) {
      hasWeeklyMegaShot = true;
    }

    const pipScore = meta.biomarkers?.pip || 0;
    maxPipScore = Math.max(maxPipScore, pipScore);
  });

  const warnings = [];
  if (hasWeeklyMegaShot) {
    warnings.push({
      level: "critical",
      message:
        "High injection volume (>5 mL) scheduled for single weekly pins. Split the dose across multiple sites to avoid tissue damage.",
    });
  }

  if (maxPerInjection > 3.5) {
    warnings.push({
      level: "warning",
      message:
        "Injection volume above 3.5 mL per shot detected. Consider dividing doses to reduce PIP and scar tissue.",
    });
  }

  if (totalWeeklyVolume > 12) {
    warnings.push({
      level: "warning",
      message:
        "Total weekly oil volume exceeds 12 mL. Assess ester choices or concentration to keep injections manageable.",
    });
  }

  if (maxPipScore >= 4) {
    warnings.push({
      level: "warning",
      message:
        "High PIP compound detected. Rotate injection sites and dilute with carrier oil if possible.",
    });
  }

  return {
    totalWeeklyVolume: Number(totalWeeklyVolume.toFixed(2)),
    maxPerInjection: Number(maxPerInjection.toFixed(2)),
    maxPipScore,
    warnings,
  };
};

/**
 * Calculates signaling pathway loads for visualization.
 * Centralized logic for "Signaling Network".
 */
const calculatePathwayLoads = (activeCompounds) => {
  const pathwayLoads = {
    ar_genomic: 0,
    non_genomic: 0,
    estrogen: 0,
    prolactin: 0,
    liver: 0,
    cortisol: 0,
    shbg: 0,
    neuro: 0, // Added to track raw neuro load
    heart: 0, // Added for VitalSigns consistency
  };

  activeCompounds.forEach(({ code, meta, weeklyDose }) => {
    const vector = COMPOUND_VECTORS[code] || {};
    // Standardize Dose Factor with Engine (Weekly Dose / 300)
    // Apply Non-Linear Saturation Curve (Power Law)
    // Effect = Dose^0.85. This simulates receptor saturation / diminishing returns.
    // 300mg -> 1.0
    // 600mg -> 1.8 (not 2.0)
    // 1000mg -> 2.7 (not 3.3)
    const linearFactor = weeklyDose / 300;
    const doseFactor = Math.pow(linearFactor, 0.85);

    // --- HEART LOGIC (Manual Calculation) ---
    if (code === "eq" || code === "testosterone") {
      pathwayLoads.heart += doseFactor * 1.5;
    }
    if (code === "trenbolone") {
      pathwayLoads.heart += doseFactor * 2.5;
    }
    if (code === "anadrol" || code === "dianabol") {
      pathwayLoads.heart += doseFactor * 2.0;
    }

    Object.entries(vector).forEach(([rawKey, rawStrength]) => {
      const key = PATHWAY_KEY_MAPPING[rawKey] || rawKey;
      const strength = Math.abs(rawStrength) * doseFactor;

      if (pathwayLoads[key] !== undefined) {
        pathwayLoads[key] += strength;
      }
    });
  });

  // Apply Unit Scalar to convert "Engine Units" to UI Scale
  // Calibrated so 1000mg+ stack sits at ~60-70% saturation
  // 8 units (300mg Test) -> 100 mgEq
  // Scalar = 12.5
  Object.keys(pathwayLoads).forEach((key) => {
    pathwayLoads[key] *= 12.5;
  });

  return pathwayLoads;
};

/**
 * Calculates user-specific scalars based on biological profile.
 * Implements "Doctor-Grade" simulation logic.
 */
const calculateUserScalars = (profile) => {
  // 1. Body Composition (Capacity)
  // LBM = Weight * (1 - BodyFat%)
  // Normalized to 160lb LBM (Standard Reference Man)
  const weight = profile.bodyweight || 90; // Default 90kg (~200lb)
  const bodyFat = profile.bodyFat || 15; // Default 15%
  const lbm = weight * 2.2 * (1 - bodyFat / 100); // Convert kg to lbs for formula
  const capacityScalar = Math.max(0.5, lbm / 160); // Floor at 0.5x

  // 2. Aromatase Activity (Estrogen Risk)
  // Fat tissue contains aromatase. 12% is neutral.
  // Formula: (BodyFat / 12)^1.5
  const aromataseScalar = Math.pow(Math.max(5, bodyFat) / 12, 1.5);

  // 3. Age Decay (Resilience)
  // Age 25 is peak.
  const age = profile.age || 30;
  const agePenalty = Math.max(0, (age - 30) * 0.02); // General organ stress
  const recoveryPenalty = Math.max(0, (age - 30) / 5); // HPTA recovery drag

  // 4. Experience Level (Sensitivity)
  let responseMultiplier = 1.0;
  let sideEffectSensitivity = 1.0;
  let saturationCeilingMult = 1.0;

  switch (profile.experience) {
    case 'none': // Virgin
      responseMultiplier = 1.2;
      sideEffectSensitivity = 1.5;
      break;
    case 'test_only': // Intermediate
      responseMultiplier = 1.0;
      sideEffectSensitivity = 1.0;
      break;
    case 'multi_compound': // Advanced
      responseMultiplier = 0.9;
      saturationCeilingMult = 1.5;
      break;
    case 'blast_cruise': // Pro
      responseMultiplier = 0.8;
      saturationCeilingMult = 2.0;
      break;
    default:
      break;
  }

  // 5. Gender (Virilization)
  const isFemale = profile.gender === 'female';

  return {
    capacityScalar,
    aromataseScalar,
    agePenalty,
    recoveryPenalty,
    responseMultiplier,
    sideEffectSensitivity,
    saturationCeilingMult,
    isFemale
  };
};

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

const calculateShbgSynergy = (stackInput = [], compoundDictionary = compoundData) => {
  if (!Array.isArray(stackInput) || !stackInput.length) {
    return { multiplier: 1.0, score: 0, contributions: [] };
  }

  let totalReliefScore = 0;
  const contributions = [];

  stackInput.forEach((entry) => {
    if (!entry) return;
    const compoundKey = entry.compound || entry.id;
    if (!compoundKey) return;
    const cmp = compoundDictionary[compoundKey];
    if (!cmp) return;
    const reliefScore = Number(cmp.shbgRelief) || 0;
    if (reliefScore <= 0) return;

    const doseValue = Number(entry.dose ?? entry.weeklyDose ?? entry.rawDose ?? 0);
    if (!Number.isFinite(doseValue) || doseValue <= 0) return;

    const esterKey = entry.ester || cmp.defaultEster;
    const isOral = isOralUsage(cmp, compoundKey, esterKey);
    const weeklyDose = getWeeklyDose(doseValue, isOral);
    const dailyDose = Math.max(0, weeklyDose / 7);
    if (dailyDose <= 0) return;

    const doseScalar = Math.log(dailyDose + 1) / 3.5;
    if (doseScalar <= 0) return;

    const contribution = reliefScore * doseScalar;
    totalReliefScore += contribution;
    contributions.push({
      compound: compoundKey,
      label: cmp.abbreviation || cmp.name || compoundKey,
      reliefScore: Number(contribution.toFixed(2)),
    });
  });

  if (totalReliefScore <= 0) {
    return { multiplier: 1.0, score: 0, contributions: [] };
  }

  contributions.sort((a, b) => b.reliefScore - a.reliefScore);

  const rawMultiplier = 1 + totalReliefScore / 25;
  const multiplier = Math.min(1.35, rawMultiplier);

  return {
    multiplier,
    score: totalReliefScore,
    contributions,
  };
};

/**
 * Calculates the stability penalty based on injection frequency vs half-life.
 * Penalizes infrequent pinning of short esters.
 */
const calculateStabilityPenalty = (meta, esterKey, frequency, isOral) => {
  if (isOral) return 1.0; // Orals assumed daily/stable

  // frequency is "Days Interval" (1=ED, 3.5=2x/Wk, 7=1x/Wk)
  const intervalDays = frequency || 7; // Default to 1x/Wk (7 days) if undefined
  
  const halfLifeHours =
    meta.esters?.[esterKey]?.halfLife || meta.halfLife || 24;
  const halfLifeDays = halfLifeHours / 24;
  
  // The injection interval is simply the frequency in days
  const injectionInterval = intervalDays;

  let penalty = 1.0;

  // Penalty if interval exceeds half-life (creating peaks/troughs)
  if (injectionInterval > halfLifeDays) {
    penalty = 1 + (injectionInterval - halfLifeDays) * 0.1;
  }

  // Extra penalty for volatile blends (e.g., Sustanon) if infrequent
  // Previously: freq < 3 (pins/week). 3 pins/week = every 2.33 days.
  // So if interval > 2.5 days, we penalize.
  const isVolatileBlend = meta.esters?.[esterKey]?.isBlend;
  if (isVolatileBlend && intervalDays > 2.5) {
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
const getInteractionWarnings = (compounds, profile = defaultProfile) => {
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

  // 5. CrossFit Cardio Warning
  if (profile.trainingStyle === "crossfit") {
    const hasCardioKiller = codes.has("trenbolone") || codes.has("anadrol");
    if (hasCardioKiller) {
      warnings.push({
        type: "performance",
        level: "critical",
        message: "⚠️ CARDIO CAPACITY WARNING: You are training for Endurance (CrossFit) but using Trenbolone or Anadrol. These compounds drastically reduce cardiovascular output (Tren Cough / Back Pumps). Your WOD times will suffer.",
      });
    }
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
} = {}) => {
  // 0. Validation & Normalization
  const { compounds, doses } = normalizeStackInput(stackInput);
  if (!compounds.length) return getEmptyResult();

  // 0.5. Calculate User Scalars (The "Simulation" Layer)
  const {
    capacityScalar,
    aromataseScalar,
    agePenalty,
    recoveryPenalty,
    responseMultiplier,
    sideEffectSensitivity,
    saturationCeilingMult,
    isFemale
  } = calculateUserScalars(profile);

  // Adjust Thresholds based on Scalars
  const adjustedSaturationThreshold = CONSTANTS.SATURATION_THRESHOLD * capacityScalar * saturationCeilingMult;
  const adjustedToxicityThreshold = CONSTANTS.TOXICITY_THRESHOLD * capacityScalar;

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
    neuralDriveScore: 0,
  };

  // In the steady state model we assume compounds are held long enough to saturate,
  // so time-based multipliers collapse into the profile-specific recovery penalty only.
  const suppressionPenalty = recoveryPenalty;

  const shbgSynergy = calculateShbgSynergy(stackInput, compoundData);
  const baseFreeHormoneMultiplier = 1.0;
  const freeHormoneMultiplier = shbgSynergy?.multiplier || 1.0;
  const shbgSynergyAnalytics = (() => {
    if (!shbgSynergy || shbgSynergy.score <= 0) return null;
    const synergyMultiplier = Number((shbgSynergy.multiplier || 1).toFixed(3));
    const percentBoost = Math.max(0, Math.round((synergyMultiplier - 1) * 100));
    return {
      multiplier: synergyMultiplier,
      synergyMultiplier,
      percentBoost,
      score: Number(shbgSynergy.score.toFixed(2)),
      sources: shbgSynergy.contributions,
      contributions: shbgSynergy.contributions,
      baseFreeHormoneMultiplier: Number(baseFreeHormoneMultiplier.toFixed(3)),
      combinedFreeHormoneMultiplier: Number(freeHormoneMultiplier.toFixed(3)),
    };
  })();

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
    state.activeCompounds.push({
      code,
      meta,
      dose,
      weeklyDose,
      isOral,
      ester: esterKey,
      frequency: stackItem?.frequency,
    });

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
    const androgenicRating = Math.max(0, Number(meta.androgenicRating) || 0);
    if (androgenicRating > 0) {
      const driveDoseScalar = Math.pow(Math.max(0, weeklyDose) / 200, 0.85);
      state.neuralDriveScore += androgenicRating * driveDoseScalar;
    }
    if (meta.suppressiveFactor) {
      state.maxSuppression = Math.max(
        state.maxSuppression,
        meta.suppressiveFactor,
      );
    }

    // E. Benefit & Risk Evaluation (Curve Lookup)
    const receivesFreeHormoneBoost = Boolean(meta.shbgBindable) && meta.type === "injectable";
    const benefitDose = receivesFreeHormoneBoost
      ? dose * freeHormoneMultiplier
      : dose;

    const benefitRes = evaluateCompoundResponse(
      code,
      "benefit",
      benefitDose,
      profile,
    );
    const riskRes = evaluateCompoundResponse(code, "risk", dose, profile);

    const hillSignal = evaluateHillSignal(benefitDose, meta);

    let benefitVal = Number.isFinite(hillSignal?.value)
      ? hillSignal.value
      : benefitRes?.value ?? 0;
    let riskVal = riskRes?.value ?? 0;

    // Apply Experience Multipliers
    benefitVal *= responseMultiplier;
    riskVal *= sideEffectSensitivity;

    // Apply Aromatase Scalar (Body Fat Impact)
    if (meta.flags?.aromatization > 0) {
      riskVal *= aromataseScalar;
    }

    // Apply Gender Logic (The "Virilization Cliff")
    if (isFemale) {
      // Benefit: Females respond massively to small doses
      benefitVal *= 10.0;

      // Risk: Virilization Cliff
      // If dose > 20mg/week (approx), risk skyrockets
      // We replace the standard risk curve with this cliff
      const virilizationThreshold = 20;
      if (weeklyDose > virilizationThreshold) {
         const excess = weeklyDose - virilizationThreshold;
         // Exponential penalty: 50mg = (30)^1.5 approx 160 points of risk
         riskVal = Math.pow(excess, 1.8) * 0.5; 
      } else {
         riskVal *= 0.5; // Low risk below threshold
      }
    }

    // Apply Stability Penalty
    const stabilityPenalty = calculateStabilityPenalty(
      meta,
      esterKey,
      stackItem?.frequency,
      isOral,
    );
    riskVal *= stabilityPenalty;

    // Apply Diet State Logic (Cutting vs Bulking)
    if (profile.dietState === "cutting") {
      // Cutting: Anabolism drops 30% globally
      // BUT Anti-catabolic compounds (Cortisol blockers) get a reprieve
      // Tren (-3), NPP (-1), Test (0)
      const cortisolScore = meta.biomarkers?.cortisol || 0;
      let retentionBonus = 0;
      
      if (cortisolScore < 0) {
        // Convert negative cortisol score to positive bonus
        // -3 (Tren) -> 0.3 bonus -> 1.0 multiplier (No penalty)
        // -1 (NPP) -> 0.1 bonus -> 0.8 multiplier
        retentionBonus = Math.abs(cortisolScore) * 0.1;
      }
      
      const cuttingMultiplier = 0.7 + retentionBonus;
      benefitVal *= Math.min(cuttingMultiplier, 1.2); // Cap bonus at 1.2x
      
    } else if (profile.dietState === "bulking") {
      // Bulking: Systemic stress increases due to caloric load
      // Orals get hit harder (liver processing food + drugs)
      if (isOral) {
        riskVal *= 1.2;
      } else {
        riskVal *= 1.1;
      }
    }

    // Apply Training Style Logic (The "Signal Director")
    const trainingStyle = profile.trainingStyle || "bodybuilding";
    const strengthCompounds = new Set(["halotestin", "anadrol", "dianabol", "trenbolone", "superdrol", "testosterone", "ment"]);
    const enduranceCompounds = new Set(["eq", "turinabol", "primobolan", "testosterone", "winstrol", "anavar"]);
    const neuroToxicCompounds = new Set(["trenbolone", "halotestin", "superdrol"]);

    if (trainingStyle === "powerlifting") {
      // Powerlifting: Strength is King.
      // Strength compounds get a bonus. Pure hypertrophy compounds get a penalty.
      if (strengthCompounds.has(code)) {
        benefitVal *= 1.2;
      } else {
        benefitVal *= 0.8; // Penalty for non-strength compounds (e.g. Deca/EQ don't add raw force as well)
      }
      
      // CNS Stress increases (Heavy loads + Neurotoxic drugs = Fried CNS)
      if (neuroToxicCompounds.has(code)) {
        riskVal *= 1.2;
      }

    } else if (trainingStyle === "bodybuilding") {
      // Bodybuilding: Volume is King.
      // Hypertrophy is the goal for EVERYTHING.
      benefitVal *= 1.2; // Global bonus (Volume drives growth)
      
      // Joint Stress decreases (Lighter weights, better connection)
      riskVal *= 0.9;

    } else if (trainingStyle === "crossfit") {
      // CrossFit: Endurance/Work Capacity is King.
      if (enduranceCompounds.has(code)) {
        benefitVal *= 1.2;
      }
      
      // Cardio Capacity Warning (Tren/Anadrol)
      if (code === "trenbolone" || code === "anadrol") {
        riskVal *= 1.5; // Massive penalty for destroying cardio
        // We'll add a specific warning later in the warnings section, 
        // but here we mathematically penalize the score.
      }
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
      meta: {
        benefit: benefitRes?.meta,
        risk: riskRes?.meta,
        signalModel: hillSignal?.params,
      },
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
  if (state.totalGenomicLoad > adjustedSaturationThreshold) {
    const excess = state.totalGenomicLoad - adjustedSaturationThreshold;
    // Logarithmic Diminishing Returns: Smooth transition from slope 1.0 to slope ~0
    // Formula: Threshold + Scale * ln(1 + excess/Scale)
    // Scale = 2500 pushes the "hard diminishing returns" out to ~4000mg+
    const scale = 2500;
    const dampenedExcess = scale * Math.log(1 + excess / scale);
    const projectedTotal = adjustedSaturationThreshold + dampenedExcess;
    genomicFactor = projectedTotal / state.totalGenomicLoad;
  }

  const finalGenomic = (state.genomicBenefit + synergyBenefit) * genomicFactor;
  const finalBenefit = finalGenomic + state.nonGenomicBenefit;

  // B. Toxicity Avalanche
  let toxicityMultiplier = 1.0;
  if (state.totalSystemicLoad > adjustedToxicityThreshold) {
    const excessRisk = state.totalSystemicLoad - adjustedToxicityThreshold;
    toxicityMultiplier = 1 + Math.pow(excessRisk / 1500, 1.5);
  }

  const finalRisk = (state.rawRiskSum + synergyRisk) * toxicityMultiplier;

  // 5. Global Safety Protocols
  const protocolPenalty = calculateGlobalPenalties(
    state.activeCompounds,
    finalRisk,
  );
  
  // Apply Age Penalty to final risk
  const ageAdjustedRisk = finalRisk * (1 + agePenalty);

  const adjustedRisk = ageAdjustedRisk + protocolPenalty + suppressionPenalty;

  const chronicRisk = adjustedRisk;

  // 6. Final Scoring
  const netScore = finalBenefit - chronicRisk;
  const brRatio =
    chronicRisk > 0.1 ? finalBenefit / chronicRisk : finalBenefit; // Prevent div/0

  // 7. Calculate Analytics (Labs & Pathways)
  const pathwayLoads = calculatePathwayLoads(state.activeCompounds);
  const physicsStack = buildPhysicsStack(state.activeCompounds, stackInput);
  const physicsMetrics = calculateCycleMetrics(physicsStack, compoundData, {
    aromataseScalar,
  });
  const projectedLabs = physicsMetrics.projectedLabs;
  const legacySystemLoad = physicsMetrics.systemLoad;
  const cnsProfile = physicsMetrics.cnsProfile;
  const receptorCompetition = physicsMetrics.receptorCompetition;
  const shbgDynamics = physicsMetrics.shbgDynamics;

  const logistics = calculateInjectionLogistics(state.activeCompounds);

  const helperInput = state.activeCompounds.map((entry) => ({
    id: entry.code,
    dose: entry.weeklyDose,
    frequency: 1,
    ester: entry.ester,
  }));

  const activeLoadPayload = helperInput.length
    ? calculateActiveLoad(helperInput, compoundData)
    : [];

  const doseEfficiencyMetrics = calculateEfficiencyMetrics(activeLoadPayload);
  const projectedGainsWidget = calculateProjectedGains(activeLoadPayload);
  const systemLoadVectors = calculateSystemLoad(activeLoadPayload);
  const labsWidget = calculateProjectedLabsWidget(activeLoadPayload, projectedLabs);

  const summarizedSystemLoad = (() => {
    if (!systemLoadVectors) return legacySystemLoad;
    const entries = [
      { label: "Androgenic", value: systemLoadVectors.androgenic || 0 },
      { label: "Cardiovascular", value: systemLoadVectors.cardio || 0 },
      { label: "Neuro / CNS", value: systemLoadVectors.neuro || 0 },
      { label: "Hepatic", value: systemLoadVectors.hepatic || 0 },
      { label: "Renal", value: systemLoadVectors.renal || 0 },
      { label: "Estrogenic", value: systemLoadVectors.estrogenic || 0 },
      { label: "Progestogenic", value: systemLoadVectors.progestogenic || 0 },
    ];
    const dominant = entries.reduce(
      (current, entry) =>
        entry.value > (current?.value ?? -Infinity) ? entry : current,
      null,
    );
    const total = Math.max(
      0,
      Math.min(
        100,
        entries.reduce((max, entry) => (entry.value > max ? entry.value : max), 0),
      ),
    );
    return {
      total: Math.round(total),
      dominantPressure: dominant?.label || "Balanced",
    };
  })();

  const fatigueScalar = Math.max(0, state.totalSystemicLoad / adjustedToxicityThreshold);
  const systemicStress = Math.max(
    summarizedSystemLoad?.total ?? legacySystemLoad?.total ?? 0,
    0,
  ) / 100;
  const fatigueScore = Math.pow(fatigueScalar, 1.1) * 2.5 + systemicStress * 2.0;
  const fallbackDrive = Number(state.neuralDriveScore.toFixed(2));
  const fallbackFatigue = Number(fatigueScore.toFixed(2));
  const fallbackNet = Number((state.neuralDriveScore - fatigueScore).toFixed(2));
  const workoutQuality = cnsProfile
    ? {
        drive: Number(cnsProfile.drive.toFixed(2)),
        fatigue: Number(cnsProfile.fatigue.toFixed(2)),
        net: Number(cnsProfile.net.toFixed(2)),
        state: cnsProfile.state,
        detail: cnsProfile.detail,
      }
    : {
        drive: fallbackDrive,
        fatigue: fallbackFatigue,
        net: fallbackNet,
        state: fallbackDrive > fallbackFatigue ? "BALANCED" : "OVERREACHED",
        detail:
          fallbackDrive > fallbackFatigue
            ? "Drive and fatigue in equilibrium."
            : "Fatigue is overtaking neural output.",
      };

  // 8. Construct Result
  const interactionWarnings = getInteractionWarnings(compounds, profile);
  const combinedWarnings = [
    ...interactionWarnings,
    ...logistics.warnings.map((warn) => ({
      type: "logistics",
      level: warn.level === "critical" ? "critical" : "warning",
      message: warn.message,
    })),
  ];

  return {
    byCompound: state.byCompound,
    pairInteractions,
    warnings: combinedWarnings,
    analytics: {
      projectedLabs,
      pathwayLoads,
      systemLoad: summarizedSystemLoad,
      systemLoadVectors,
      labsWidget,
      doseEfficiency: doseEfficiencyMetrics,
      projectedGains: projectedGainsWidget,
      logistics,
      physicsMeta: physicsMetrics.meta,
      physicsGains: physicsMetrics.projectedGains,
      physicsSystemLoad: legacySystemLoad,
      cnsProfile,
      workoutQuality,
      shbgSynergy: shbgSynergyAnalytics,
      receptorCompetition,
      shbgDynamics,
    },
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
