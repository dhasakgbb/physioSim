/**
 * simulationEngine.js
 * THE PHYSICS ENGINE (v2 - Integration Ready)
 * Implements:
 * 1. Dose Normalization (Frequency -> Weekly Mg)
 * 2. Pharmacokinetics (Steady State Accumulation)
 * 3. Diminishing Returns (Saturation Curves)
 * 4. Full Lab Panel Coverage (Matches legacy UI contract)
 */

import { compoundData as defaultCompoundData } from "../data/compoundData.js";

export const SATURATION_THRESHOLD_1 = 1500;
export const SATURATION_THRESHOLD_2 = 2500;
export const TOXICITY_CEILING = 3000;
const ORGAN_SHIELD_CAP = 0.6;
const RECEPTOR_KI_OVERRIDES = {
  testosterone: 0.9, // nM (reference)
  nandrolone: 0.65,
  trenbolone: 0.3,
  ment: 0.4,
};
const TESTOSTERONE_KI_NM = 0.9;
const TESTOSTERONE_AFFINITY_SCORE = 5;
const MIN_KI = 0.05;
const RECEPTOR_BINDING_MG_SCALE = 400;
const BASELINE_SHBG_NMOL = 35;
const MIN_SHBG_NMOL = 5;
const MAX_SHBG_NMOL = 120;
const SHBG_BINDING_CAPACITY = 1.4;
const SHBG_BINDING_SCALE = 120;
const DEFAULT_AROMATASE_VMAX = 220;
const DEFAULT_AROMATASE_KM = 500;
const MIN_SUBSTRATE_MG = 1;
const TOXICITY_SUPRA_LINEAR_EXPONENT = 1.5;

const DAILY_FREQUENCY = 7;

const SUPPORT_SHIELD_SPECS = {
  tudca: {
    hepatic: (dailyMg) => 0.5 * Math.min(1, dailyMg / 1000),
    renal: () => 0,
  },
  nac: {
    hepatic: (dailyMg) => 0.2 * Math.min(1, dailyMg / 1200),
    renal: (dailyMg) => 0.4 * Math.min(1, dailyMg / 1200),
  },
};

const deriveKiValue = (compoundId, compoundMeta) => {
  if (!compoundMeta || typeof compoundMeta !== "object") {
    return TESTOSTERONE_KI_NM;
  }

  const explicitKi = Number(compoundMeta.binding?.ki);
  if (Number.isFinite(explicitKi) && explicitKi > 0) {
    return Math.max(MIN_KI, explicitKi);
  }

  if (RECEPTOR_KI_OVERRIDES[compoundId]) {
    return RECEPTOR_KI_OVERRIDES[compoundId];
  }

  const affinityScore = Number(compoundMeta.pathways?.ar_affinity);
  if (Number.isFinite(affinityScore) && affinityScore > 0) {
    const normalizedScore = Math.max(0.5, affinityScore);
    const relative = TESTOSTERONE_AFFINITY_SCORE / normalizedScore;
    return Math.max(MIN_KI, Number((TESTOSTERONE_KI_NM * relative).toFixed(3)));
  }

  return TESTOSTERONE_KI_NM;
};

const computeBindingTerm = (saturationMg, kiValue) => {
  if (!Number.isFinite(saturationMg) || saturationMg <= 0) return 0;
  const normalizedConcentration = saturationMg / RECEPTOR_BINDING_MG_SCALE;
  if (normalizedConcentration <= 0) return 0;
  return normalizedConcentration / Math.max(MIN_KI, kiValue);
};

const clampScore = (value = 0, precision = 2) =>
  Number(Number(value || 0).toFixed(precision));

const applySupraLinearDrag = (value = 0) =>
  Math.pow(Math.max(0, Number(value) || 0), TOXICITY_SUPRA_LINEAR_EXPONENT);

const CNS_STATE_DETAILS = {
  CALM: "Minimal adrenergic load; baseline neural readiness.",
  PRIMED: "Drive exceeds drag—sessions feel sharp and aggressive.",
  "GOD MODE": "Sympathetic surge with low drag, ideal for peak attempts.",
  "WIRED BUT TIRED": "Drive is high but toxicity is eroding output.",
  "FRIED CNS": "Fatigue dominates, signaling imminent performance collapse.",
  OVERREACHED: "Drag is overtaking drive; recovery window is overdue.",
  BALANCED: "Drive and fatigue in equilibrium.",
};

const classifyCnsState = (drive, fatigue, net) => {
  if (drive < 0.8 && fatigue < 1.1) return "CALM";
  if (drive >= 4.5 && net >= 1.5 && fatigue <= drive * 0.65) return "GOD MODE";
  if (drive >= 3 && net >= 0.5 && fatigue <= drive * 0.8) return "PRIMED";
  if (drive >= 3 && fatigue >= drive * 0.85) return "WIRED BUT TIRED";
  if (net <= -1.5 && fatigue > drive) return "FRIED CNS";
  if (fatigue > drive) return "OVERREACHED";
  return "BALANCED";
};

const describeCnsState = (state) => CNS_STATE_DETAILS[state] || CNS_STATE_DETAILS.BALANCED;

const buildCnsProfile = (
  { compounds = [], systemLoadTotal = 0, totalSaturationMg = 0 },
  freeFractionLookup = {},
) => {
  let driveAccumulator = 0;
  let neuroToxicPressure = 0;

  if (Array.isArray(compounds)) {
    compounds.forEach(({ id, key, data, weeklyDose = 0, saturationMg = 0 }) => {
      if (!data) return;
      const lookupKey = key || id;
      const resolvedFraction = Number(freeFractionLookup[lookupKey]);
      const safeFraction = Number.isFinite(resolvedFraction)
        ? resolvedFraction
        : 1;
      const freeFraction = Math.min(1, Math.max(0, safeFraction));
      const adjustedWeeklyDose = weeklyDose * freeFraction;
      const adjustedSaturation = saturationMg * freeFraction;
      const androgenicRating = Math.max(0, Number(data.androgenicRating) || 0);
      if (androgenicRating > 0 && adjustedWeeklyDose > 0) {
        const driveDoseScalar = Math.pow(Math.max(adjustedWeeklyDose, 0) / 200, 0.85);
        driveAccumulator += androgenicRating * driveDoseScalar;
      }

      const neuroToxicity =
        Number(data.neuroToxicity) ||
        Number(data.toxicity?.neuro) ||
        Number(data.biomarkers?.neurotoxicity) ||
        0;
      if (neuroToxicity > 0 && adjustedSaturation > 0) {
        const toxDoseScalar = Math.pow(Math.max(adjustedSaturation, 0) / 350, 0.9);
        neuroToxicPressure += Math.max(0, neuroToxicity) * toxDoseScalar;
      }
    });
  }

  const driveScore = clampScore(driveAccumulator);
  const mgPressure = Math.max(0, totalSaturationMg / TOXICITY_CEILING);
  const systemicDrag = Math.pow(mgPressure, 1.05) * 3.0;
  const normalizedSystemLoad = Number.isFinite(systemLoadTotal)
    ? systemLoadTotal
    : 0;
  const loadDrag = Math.max(0, normalizedSystemLoad / 100) * 2.4;
  const neuroDrag = Math.pow(Math.max(neuroToxicPressure / 6, 0), 1.05) * 1.8;
  const fatigueScore = clampScore(systemicDrag + loadDrag + neuroDrag);
  const netScore = clampScore(driveScore - fatigueScore);
  const state = classifyCnsState(driveScore, fatigueScore, netScore);

  return {
    drive: driveScore,
    fatigue: fatigueScore,
    net: netScore,
    state,
    detail: describeCnsState(state),
    signals: {
      neuroToxicLoad: clampScore(neuroToxicPressure),
      mgPressure: clampScore(mgPressure, 3),
    },
  };
};

export const calculateOrganSupport = (activeCompounds = []) => {
  const shields = { hepatic: 0, renal: 0 };
  if (!Array.isArray(activeCompounds) || !activeCompounds.length) {
    return shields;
  }

  activeCompounds.forEach((drug) => {
    if (!drug) return;
    const type = String(drug.type || "").toLowerCase();
    if (type !== "support") return;
    const calc = SUPPORT_SHIELD_SPECS[drug.id];
    if (!calc) return;
    const dailyMg = (Number(drug.activeMg) || 0) / 7;
    if (dailyMg <= 0) return;
    shields.hepatic += calc.hepatic ? calc.hepatic(dailyMg) : 0;
    shields.renal += calc.renal ? calc.renal(dailyMg) : 0;
  });

  shields.hepatic = Math.min(ORGAN_SHIELD_CAP, shields.hepatic);
  shields.renal = Math.min(ORGAN_SHIELD_CAP, shields.renal);
  return shields;
};

export const calculateShbgDynamics = ({
  compounds = [],
  estradiol = 25,
  baselineShbg = BASELINE_SHBG_NMOL,
} = {}) => {
  const defaultState = {
    shbgLevel: baselineShbg,
    suppressionFactor: 0,
    inductionFactor: 0,
    bindingCapacity: baselineShbg * SHBG_BINDING_CAPACITY,
    totalDemand: 0,
    utilizedCapacity: 0,
    compoundFreeFractions: {},
    compounds: [],
  };

  if (!Array.isArray(compounds) || !compounds.length) {
    return defaultState;
  }

  let androgenicPressure = 0;
  let estrogenicPressure = Math.max(0, estradiol - 25);
  const bindingDemands = [];

  compounds.forEach((compound) => {
    const data = compound?.data;
    if (!data) return;
    const compoundKey = compound?.key || compound?.id;
    const saturationMg = Math.max(0, Number(compound.saturationMg) || 0);
    if (saturationMg <= 0) return;

    const androgenicRating = Math.max(0, Number(data.androgenicRating) || 0);
    const shbgReliefScore = Math.max(0, Number(data.shbgRelief) || 0);
    const shbgBindingScore = Math.max(0, Number(data.pathways?.shbg_binding) || 0);
    const aromScore = Math.max(0, Number(data.metabolic?.aromatization) || 0);

    androgenicPressure += saturationMg * (androgenicRating * 0.015 + shbgReliefScore * 0.02 + shbgBindingScore * 0.01);
    estrogenicPressure += saturationMg * aromScore * 0.002;

    const isBindable = data.shbgBindable !== false;
    if (isBindable && shbgBindingScore > 0) {
      const demand = shbgBindingScore * (saturationMg / SHBG_BINDING_SCALE);
      if (demand > 0) {
        bindingDemands.push({
          key: compoundKey,
          id: compound.id,
          label: data.abbreviation || data.name || compound.id,
          demand,
          saturationMg,
        });
      }
    }
  });

  const suppressionFactor = Math.min(0.85, androgenicPressure / 8000);
  const inductionFactor = Math.min(1.5, estrogenicPressure / 60);
  const rawShbgLevel = baselineShbg * (1 - suppressionFactor) + inductionFactor;
  const shbgLevel = clampScore(
    Math.min(MAX_SHBG_NMOL, Math.max(MIN_SHBG_NMOL, rawShbgLevel)),
    2,
  );

  const bindingCapacity = shbgLevel * SHBG_BINDING_CAPACITY;
  const totalDemand = bindingDemands.reduce((sum, entry) => sum + entry.demand, 0);
  const utilizedCapacity = Math.min(totalDemand, bindingCapacity);
  const compoundFreeFractions = {};
  const shbgOccupancy = [];

  if (totalDemand > 0) {
    bindingDemands.forEach((entry) => {
      const share = entry.demand / totalDemand;
      const allocated = share * utilizedCapacity;
      const boundFraction = Math.min(0.98, allocated / entry.demand);
      const freeFraction = clampScore(1 - boundFraction, 4);
      compoundFreeFractions[entry.key || entry.id] = freeFraction;
      shbgOccupancy.push({
        compound: entry.id,
        label: entry.label,
        demand: clampScore(entry.demand, 3),
        boundFraction: clampScore(boundFraction, 4),
        freeFraction,
      });
    });
  }

  return {
    shbgLevel,
    suppressionFactor: clampScore(suppressionFactor, 4),
    inductionFactor: clampScore(inductionFactor, 4),
    bindingCapacity: clampScore(bindingCapacity, 3),
    totalDemand: clampScore(totalDemand, 3),
    utilizedCapacity: clampScore(utilizedCapacity, 3),
    compoundFreeFractions,
    compounds: shbgOccupancy,
  };
};

const michaelisMentenRate = (substrateMg = 0, vmax = 0, km = DEFAULT_AROMATASE_KM) => {
  const substrate = Math.max(0, substrateMg);
  if (substrate <= 0 || vmax <= 0) return 0;
  const denominator = km + substrate;
  if (denominator <= 0) return 0;
  return (vmax * substrate) / denominator;
};

const computeAromatizationKinetics = ({
  substrateMg = 0,
  aromataseScalar = 1,
  baselineEstradiol = 0,
  inhibitor = 1,
  methylLoad = 0,
}) => {
  const normalizedScalar = Math.max(0.25, Math.min(4, Number(aromataseScalar) || 1));
  const inhibition = Math.max(0.05, Math.min(1, Number(inhibitor) || 1));
  const effectiveVmax = DEFAULT_AROMATASE_VMAX * normalizedScalar * inhibition;
  const effectiveKm = DEFAULT_AROMATASE_KM / normalizedScalar;
  const substrate = Math.max(0, substrateMg);
  const conversion = substrate > 0
    ? michaelisMentenRate(Math.max(MIN_SUBSTRATE_MG, substrate), effectiveVmax, effectiveKm)
    : 0;
  const estradiol = Math.min(
    350,
    Math.max(5, baselineEstradiol + conversion + Math.max(0, methylLoad) * 0.05),
  );
  return {
    estradiol,
    conversion,
    effectiveVmax,
    effectiveKm,
    substrateMg: substrate,
  };
};

/**
 * Phase 1 Normalizer: converts arbitrary slider inputs into weekly active mg with decay factors.
 */
export const calculateActiveLoad = (stack = [], compoundLookup = defaultCompoundData) => {
  if (!Array.isArray(stack) || !stack.length) return [];

  const normalized = [];

  stack.forEach((item) => {
    if (!item?.id) return;
    const drugData = compoundLookup[item.id];
    if (!drugData) return;

    const doseValue = Number(item.dose ?? item.dosage ?? 0);
    if (!Number.isFinite(doseValue) || doseValue <= 0) return;

    const freq = item.frequency;
    let weeklyDose = doseValue;

    if (typeof freq === "number" && Number.isFinite(freq)) {
      weeklyDose = doseValue * Math.max(freq, 0);
    } else if (typeof freq === "string") {
      const key = freq.trim().toLowerCase();
      if (key.includes("daily") || key === "ed") {
        weeklyDose = doseValue * DAILY_FREQUENCY;
      } else if (key === "eod") {
        weeklyDose = doseValue * (DAILY_FREQUENCY / 2);
      } else if (key.includes("per day")) {
        const match = key.match(/(\d+(?:\.\d+)?)\s*(x|times)?/);
        if (match) {
          const perDay = Number(match[1]);
          if (Number.isFinite(perDay)) weeklyDose = doseValue * perDay * DAILY_FREQUENCY;
        } else {
          weeklyDose = doseValue * DAILY_FREQUENCY;
        }
      } else {
        weeklyDose = doseValue;
      }
    }

    const esterKey = item.ester || drugData.defaultEster;
    const ester = drugData.esters?.[esterKey];
    const esterWeight = ester?.weight ?? 1.0;
    const activeMg = weeklyDose * esterWeight;

    // Calculate saturation for efficiency modeling
    const esterHalfLife = ester?.halfLife || drugData.halfLife || 168;
    const frequencyPerWeek = getWeeklyFrequency(freq);
    const saturationMg = getSaturationLevel(activeMg, esterHalfLife, frequencyPerWeek);
    const saturationRatio = activeMg > 0 ? saturationMg / activeMg : 1;
    const efficiencyFactor = saturationRatio > 1
      ? 1 + Math.log10(saturationRatio)
      : saturationRatio;
    const toxicityLoad = applySupraLinearDrag(Math.max(activeMg, 0) / 500) +
      (drugData.type === "oral" ? 0.05 : 0);

    normalized.push({
      ...drugData,
      id: item.id,
      rawDose: weeklyDose,
      activeMg,
      saturationMg,
      esterHalfLife,
      efficiencyFactor,
      saturationRatio,
      toxicityLoad,
    });
  });

  return normalized;
};

/**
 * Phase 2: Dose Efficiency widget data (Signal vs Drag for the chart overlay).
 */
export const calculateEfficiencyMetrics = (activeCompounds = []) => {
  if (!Array.isArray(activeCompounds) || !activeCompounds.length) {
    return { anabolic: "0.0", toxicity: "0.0", netGap: "0.0", isCritical: false };
  }

  let totalAnabolicSignal = 0;
  let totalSystemToxicity = 0;

  activeCompounds.forEach((drug) => {
    if (!drug) return;
    const potency = Number(drug.basePotency) || 0;
    const efficiency = Number(drug.efficiencyFactor) || 0;
    const signal = potency * efficiency * 10;
    totalAnabolicSignal += signal;

    const toxicityVector = drug.toxicity || {};
    const toxicityScore = Object.values(toxicityVector).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const toxicityLoad = Number(drug.toxicityLoad) || 0;
    const drag = toxicityScore * toxicityLoad;
    totalSystemToxicity += drag;
  });

  const netGap = totalAnabolicSignal - totalSystemToxicity;

  return {
    anabolic: totalAnabolicSignal.toFixed(1),
    toxicity: totalSystemToxicity.toFixed(1),
    netGap: netGap.toFixed(1),
    isCritical: netGap < -5,
  };
};

/**
 * Phase 3: Projected Gains sliders (Hypertrophy, Strength, Fat Loss, Fullness).
 */
export const calculateProjectedGains = (activeCompounds = []) => {
  const totals = {
    hypertrophy: 0,
    strength: 0,
    fatLoss: 0,
    fullness: 0,
  };

  if (!Array.isArray(activeCompounds) || !activeCompounds.length) {
    return {
      hypertrophy: "0.0",
      strength: "0.0",
      fatLoss: "0.0",
      fullness: "0.0",
    };
  }

  activeCompounds.forEach((drug) => {
    if (!drug) return;
    const efficiency = Number(drug.efficiencyFactor) || 0;
    const benefits = drug.benefits || {};
    const metabolic = drug.metabolic || {};

    totals.hypertrophy += (Number(benefits.contractile_growth) || 0) * efficiency;
    const neural = Number(benefits.neural_strength) || 0;
    const joint = Number(benefits.joint_support) || 0;
    totals.strength += neural * efficiency + joint * 0.2;
    totals.fatLoss += (Number(metabolic.lipolysis) || 0) * efficiency;
    const sarco = Number(benefits.sarcoplasmic_vol) || 0;
    const glycogen = Number(metabolic.glycogen_load) || 0;
    totals.fullness += sarco * efficiency + glycogen * 0.5;
  });

  const clampToUi = (value) => Math.min(10, value / 10).toFixed(1);

  return {
    hypertrophy: clampToUi(totals.hypertrophy),
    strength: clampToUi(totals.strength),
    fatLoss: clampToUi(totals.fatLoss),
    fullness: clampToUi(totals.fullness),
  };
};

/**
 * Phase 4: System Load bars (organ stress vectors).
 */
export const calculateSystemLoad = (activeCompounds = []) => {
  const load = {
    androgenic: 0,
    cardio: 0,
    neuro: 0,
    hepatic: 0,
    renal: 0,
    estrogenic: 0,
    progestogenic: 0,
  };

  const organSupport = calculateOrganSupport(activeCompounds);
  if (Array.isArray(activeCompounds)) {
    const positive = (value) => Math.max(0, Number(value) || 0);
    const accumulate = (current, addition) =>
      addition > 0 ? current + applySupraLinearDrag(addition) : current;
    activeCompounds.forEach((drug) => {
      if (!drug) return;
      const toxMod = Number(drug.toxicityLoad) || 0;
      const metabolic = drug.metabolic || {};
      const toxicity = drug.toxicity || {};

      const androgenicSource =
        toxicity.androgenic ?? metabolic.dht_conversion ?? 0;
      load.androgenic = accumulate(load.androgenic, positive(androgenicSource) * toxMod);
      load.cardio = accumulate(load.cardio, positive(toxicity.lipid) * toxMod);
      load.cardio = accumulate(load.cardio, positive(metabolic.diuretic_effect) * 0.5);
      load.neuro = accumulate(load.neuro, positive(toxicity.neuro) * toxMod);
      load.hepatic = accumulate(load.hepatic, positive(toxicity.hepatic) * toxMod);
      load.renal = accumulate(load.renal, positive(toxicity.renal) * toxMod);
      const estrogenicSource = positive(metabolic.aromatization);
      if (estrogenicSource) {
        load.estrogenic = accumulate(load.estrogenic, estrogenicSource * toxMod);
      }
      const progestogenicSource = positive(toxicity.progestogenic);
      if (progestogenicSource) {
        load.progestogenic = accumulate(
          load.progestogenic,
          progestogenicSource * toxMod,
        );
      }
    });
  }

  const dampen = (value, shield) => Math.max(0, value * (1 - Math.max(0, shield || 0)));
  const hepaticLoad = dampen(load.hepatic, organSupport.hepatic);
  const renalLoad = dampen(load.renal, organSupport.renal);

  const scaleLoad = (val, multiplier = 4) => Math.min(100, val * multiplier);
  const toPercent = (val, multiplier) => Math.round(scaleLoad(val, multiplier));

  return {
    androgenic: toPercent(load.androgenic),
    cardio: toPercent(load.cardio),
    neuro: toPercent(load.neuro),
    hepatic: toPercent(hepaticLoad, 8),
    renal: toPercent(renalLoad),
    estrogenic: toPercent(load.estrogenic, 5),
    progestogenic: toPercent(load.progestogenic, 5),
    isCritical: hepaticLoad > 20 || renalLoad > 20,
  };
};
/**
 * Phase 5: Projected Labs data (HDL, LDL, AST/ALT proxy, Estradiol).
 */
export const calculateProjectedLabsWidget = (activeCompounds = [], supplementalLabs = {}) => {
  const organSupport = calculateOrganSupport(activeCompounds);
  const baselineHematocrit = Number(
    supplementalLabs.hematocrit ?? supplementalLabs.hct,
  );
  const initialHematocrit = Number.isFinite(baselineHematocrit)
    ? baselineHematocrit
    : 45;
  const baselinePsa = Number(supplementalLabs.psa);
  const initialPsa = Number.isFinite(baselinePsa) ? baselinePsa : 1.0;
  const baselineEgfrInput = Number(supplementalLabs.egfr);
  const initialEgfr = Number.isFinite(baselineEgfrInput) ? baselineEgfrInput : 95;

  const labs = {
    hdl: Number(supplementalLabs.hdl) || 55,
    ldl: Number(supplementalLabs.ldl) || 90,
    ast: Number(supplementalLabs.ast) || 25,
    alt: Number(supplementalLabs.alt) || 25,
    e2: Number(supplementalLabs.e2 ?? supplementalLabs.estradiol) || 25,
    hematocrit: initialHematocrit,
    hct: initialHematocrit,
    creatinine: Number(supplementalLabs.creatinine) || 1.0,
    psa: initialPsa,
    egfr: initialEgfr,
  };
  const baselineAst = labs.ast;
  const baselineAlt = labs.alt;
  const baselineCreatinine = labs.creatinine;
  const baselineEgfr = labs.egfr;
  const deriveEgfrFromCreatinine = (creatinine) => {
    const normalized = Math.max(0.5, Math.min(3, creatinine));
    const estimated = 125 - (normalized - 0.7) * 65;
    return Math.max(20, Math.min(125, estimated));
  };

  if (!Array.isArray(activeCompounds) || !activeCompounds.length) {
    return formatLabs(labs);
  }

  let aromasinOffset = 0;

  activeCompounds.forEach((drug) => {
    if (!drug) return;
    if (drug.flags?.isAI) {
      aromasinOffset += (Number(drug.activeMg) || 0) * 2;
    }
  });

  activeCompounds.forEach((drug) => {
    if (!drug) return;
    const activeMg = Number(drug.activeMg) || 0;
    if (!activeMg) return;

    const doseMod = activeMg / 100;
    const toxicity = drug.toxicity || {};
    const metabolic = drug.metabolic || {};

    labs.hdl -= (Number(toxicity.lipid) || 0) * doseMod * 2;
    labs.ldl += (Number(toxicity.lipid) || 0) * doseMod * 3;
    const hepaticToxicity = Math.max(0, Number(toxicity.hepatic) || 0);
    labs.ast += hepaticToxicity * doseMod * 5;

    const e2Rise = (Number(metabolic.aromatization) || 0) * doseMod * 10;
    labs.e2 += Math.max(0, e2Rise - aromasinOffset);

    const rbcDriverRaw =
      metabolic.erythropoiesis ??
      metabolic.rbc_impact ??
      (drug.pathways?.ar_affinity ?? 0) * 0.2;
    const rbcDriver = Number(rbcDriverRaw) || 0;
    if (rbcDriver) {
      labs.hematocrit += rbcDriver * doseMod * 0.8;
    }

    const androgenicLoadRaw =
      drug.toxicity?.androgenic ?? metabolic.dht_conversion ?? 0;
    const androgenicLoad = Number(androgenicLoadRaw) || 0;
    if (androgenicLoad) {
      labs.psa += androgenicLoad * doseMod * 0.05;
    }
  });

  if (organSupport.hepatic > 0) {
    const astDelta = labs.ast - baselineAst;
    if (astDelta > 0) {
      labs.ast = baselineAst + astDelta * (1 - organSupport.hepatic);
    }
    const altDelta = labs.alt - baselineAlt;
    if (altDelta > 0) {
      labs.alt = baselineAlt + altDelta * (1 - organSupport.hepatic);
    }
  }

  if (organSupport.renal > 0) {
    const creatinineDelta = labs.creatinine - baselineCreatinine;
    if (creatinineDelta > 0) {
      labs.creatinine = baselineCreatinine + creatinineDelta * (1 - organSupport.renal);
    }
  }

  const derivedEgfr = deriveEgfrFromCreatinine(labs.creatinine);
  labs.egfr = Math.min(baselineEgfr, derivedEgfr);

  labs.hematocrit = Math.min(65, labs.hematocrit);
  labs.hct = labs.hematocrit;
  labs.psa = Math.max(0, labs.psa);

  return formatLabs(labs);
};
const classifyLabStatus = (value, { criticalHigh, warningHigh, warningLow, criticalLow }) => {
  if (!Number.isFinite(value)) return "good";
  if (criticalLow !== undefined && value <= criticalLow) return "critical";
  if (warningLow !== undefined && value <= warningLow) return "bad";
  if (criticalHigh !== undefined && value >= criticalHigh) return "critical";
  if (warningHigh !== undefined && value >= warningHigh) return "bad";
  return "good";
};

const formatLabs = (labs) => {
  const hdl = Math.max(10, labs.hdl);
  const entries = {
    hdl: {
      value: Number(hdl.toFixed(0)),
      status: classifyLabStatus(hdl, { warningLow: 40, criticalLow: 20 }),
    },
    ldl: {
      value: Number(labs.ldl.toFixed(0)),
      status: classifyLabStatus(labs.ldl, { warningHigh: 160, criticalHigh: 190 }),
    },
    ast: {
      value: Number(labs.ast.toFixed(0)),
      status: classifyLabStatus(labs.ast, { warningHigh: 120, criticalHigh: 200 }),
    },
    alt: {
      value: Number(labs.alt.toFixed(0)),
      status: classifyLabStatus(labs.alt, { warningHigh: 120, criticalHigh: 200 }),
    },
    e2: {
      value: Number(labs.e2.toFixed(0)),
      status: classifyLabStatus(labs.e2, {
        warningHigh: 50,
        criticalHigh: 80,
        warningLow: 15,
        criticalLow: 10,
      }),
    },
    hematocrit: {
      value: Number(labs.hematocrit.toFixed(1)),
      status: classifyLabStatus(labs.hematocrit, { warningHigh: 52, criticalHigh: 54 }),
    },
    creatinine: {
      value: Number(labs.creatinine.toFixed(2)),
      status: classifyLabStatus(labs.creatinine, { warningHigh: 1.3, criticalHigh: 1.5 }),
    },
    egfr: {
      value: Number(labs.egfr.toFixed(0)),
      status: classifyLabStatus(labs.egfr, { warningLow: 60, criticalLow: 45 }),
    },
    psa: {
      value: Number((labs.psa ?? 1).toFixed(2)),
      status: classifyLabStatus(labs.psa, { warningHigh: 4, criticalHigh: 10 }),
    },
  };

  return entries;
};

export const getWeeklyFrequency = (freq) => {
  if (!freq) return 1;
  if (typeof freq === "number" && Number.isFinite(freq)) {
    return Math.max(freq, 0);
  }
  const key = String(freq).trim().toUpperCase();

  const map = {
    ED: 7.0,
    QD: 7.0,
    EOD: 3.5,
    QW: 1.0,
    "2X/WK": 2.0,
    "3X/WK": 3.0,
    "3.5X/WK": 3.5,
    Q3D: 7 / 3,
    Q4D: 7 / 4,
  };

  if (key.includes("TWICE")) return 2.0;
  if (key.includes("WEEKLY")) return 1.0;
  if (key.includes("DAILY")) return 7.0;

  return map[key] || 1.0;
};

export const getActiveMg = (dose, esterKey, compound) => {
  if (!compound || !compound.esters) return dose;
  const esterData = compound.esters[esterKey];
  const weight = esterData ? esterData.weight : 1.0;
  return dose * weight;
};

const HOURS_PER_WEEK = 24 * 7;
const MAX_ACCUMULATION_RATIO = 6.0;

export const getAccumulationRatio = (halfLifeHours, frequencyPerWeek = 1) => {
  if (!Number.isFinite(halfLifeHours) || halfLifeHours <= 0) return 1.0;
  const dosesPerWeek = Number.isFinite(frequencyPerWeek) && frequencyPerWeek > 0 ? frequencyPerWeek : 1.0;
  const tauHours = HOURS_PER_WEEK / dosesPerWeek;
  const eliminationRate = Math.log(2) / halfLifeHours;
  if (!Number.isFinite(eliminationRate) || eliminationRate <= 0) return 1.0;
  const decay = Math.exp(-eliminationRate * tauHours);
  const denominator = 1 - decay;
  if (denominator <= 1e-6) return MAX_ACCUMULATION_RATIO;
  const ratio = 1 / denominator;
  if (!Number.isFinite(ratio) || ratio <= 0) return 1.0;
  return Math.min(MAX_ACCUMULATION_RATIO, Math.max(1.0, ratio));
};

export const getSaturationLevel = (activeMg, halfLifeHours, frequencyPerWeek = 1) => {
  if (!Number.isFinite(activeMg) || activeMg <= 0) return 0;
  const accumulationRatio = getAccumulationRatio(halfLifeHours, frequencyPerWeek);
  return activeMg * accumulationRatio;
};

export const calculateCycleMetrics = (
  activeStack,
  compoundData,
  options = {},
) => {
  const { aromataseScalar = 1 } = options || {};
  let totalActiveMg = 0;
  let totalSaturationMg = 0;

  const compounds = activeStack
    .map((item, index) => {
      const data = compoundData[item.id];
      if (!data) return null;

      const freqMultiplier = getWeeklyFrequency(item.frequency);
      const weeklyDose = (item.dosage || 0) * freqMultiplier;
      const activeMg = getActiveMg(weeklyDose, item.ester, data);
      const esterHalfLife = data.esters?.[item.ester]?.halfLife || data.halfLife;
      const saturationMg = getSaturationLevel(activeMg, esterHalfLife, freqMultiplier);

      totalActiveMg += activeMg;
      totalSaturationMg += saturationMg;

      return {
        ...item,
        key: item.stackInstanceId || item.stackId || `${item.id}_${index}`,
        data,
        weeklyDose,
        activeMg,
        saturationMg,
        esterHalfLife,
      };
    })
    .filter(Boolean);

  let effectiveLoad = 0;
  if (totalSaturationMg <= SATURATION_THRESHOLD_1) {
    effectiveLoad = totalSaturationMg;
  } else if (totalSaturationMg <= SATURATION_THRESHOLD_2) {
    effectiveLoad =
      SATURATION_THRESHOLD_1 + (totalSaturationMg - SATURATION_THRESHOLD_1) * 0.7;
  } else {
    const base =
      SATURATION_THRESHOLD_1 +
      (SATURATION_THRESHOLD_2 - SATURATION_THRESHOLD_1) * 0.7;
    effectiveLoad = base + (totalSaturationMg - SATURATION_THRESHOLD_2) * 0.3;
  }

  const efficiencyRatio = totalSaturationMg > 0 ? effectiveLoad / totalSaturationMg : 1.0;

  const projectedGains = { hypertrophy: 0, strength: 0, fatLoss: 0, composite: 0 };
  const systemLoad = {
    cardiovascular: 0,
    hepatic: 0,
    neuro: 0,
    renal: 0,
    estrogenic: 0,
    progestogenic: 0,
    total: 0,
    dominantPressure: "Balanced",
  };

  const projectedLabs = {
    totalTestosterone: 0,
    e2: 0,
    estradiol: 25,
    hdl: 50,
    ldl: 90,
    alt: 25,
    ast: 22,
    hematocrit: 45,
    prolactin: 12,
    shbg: BASELINE_SHBG_NMOL,
    creatinine: 0.9,
    neuroRisk: 0,
  };

  let totalAromatizableLoad = 0;
  let antiEstrogenStrength = 0;
  let methylEstrogenLoad = 0;
  let nor19Load = 0;
  let oralStressLoad = 0;
  let suppressiveLoad = 0;
  let progestinDoseLoad = 0;

  compounds.forEach((compound) => {
    const { data, saturationMg, weeklyDose } = compound;
    const loadRatio = saturationMg / 500;
    const isOral = data.type === "oral";
    const dailyDose = weeklyDose / 7 || 0;
    const toxicityTier = data.toxicityTier ?? 1;

    systemLoad.cardiovascular += (data.biomarkers?.rbc || 0) * loadRatio * 2.5;
    systemLoad.hepatic += (data.biomarkers?.liver_toxicity || 0) * loadRatio * 5.0;
    systemLoad.renal += (data.biomarkers?.renal_toxicity || 0) * loadRatio * 4.0;
    systemLoad.neuro += (data.biomarkers?.neurotoxicity || 0) * loadRatio * 4.0;

    if (data.conversionFactor) {
      projectedLabs.totalTestosterone += saturationMg * data.conversionFactor;
    }
    const aromatizationFlag = Number(data.flags?.aromatization) || 0;
    if (aromatizationFlag) {
      const aromLoad = saturationMg * aromatizationFlag;
      totalAromatizableLoad += aromLoad;
      compound.aromatizationLoad = aromLoad;
    }
        const estrogenicityFlag = Number(data.flags?.estrogenicity) || 0;
        const estrogenicVector = Math.max(0, aromatizationFlag + estrogenicityFlag);
        if (estrogenicVector) {
          systemLoad.estrogenic += estrogenicVector * loadRatio * 4.5;
        }
    if (data.flags?.createsMethylEstrogen) {
      methylEstrogenLoad += saturationMg;
    }
    if (data.biomarkers?.prolactin > 0) {
      nor19Load += saturationMg * data.biomarkers.prolactin;
    }
    const progestogenicToxicity = Math.max(0, Number(data.toxicity?.progestogenic) || 0);
    if (progestogenicToxicity) {
      progestinDoseLoad += progestogenicToxicity * loadRatio;
    }

    const baseHdlPenalty = loadRatio * 4;
    const hdlPenalty = data.type === "oral" ? baseHdlPenalty * 2.5 : baseHdlPenalty;
    projectedLabs.hdl -= hdlPenalty;
    projectedLabs.ldl += loadRatio * 10;

    const baseLiverToxicity = data.biomarkers?.liver_toxicity || 0;
    if (baseLiverToxicity > 0) {
      projectedLabs.alt += baseLiverToxicity * loadRatio * 18;
      projectedLabs.ast += baseLiverToxicity * loadRatio * 15;
      systemLoad.hepatic += baseLiverToxicity * loadRatio * 6;
    }

    if (isOral && dailyDose > 10) {
      const oralRatio = Math.max(0, dailyDose / 25);
      const oralHepaticSurge = applySupraLinearDrag(oralRatio) * (6 * toxicityTier);
      projectedLabs.alt += oralHepaticSurge * 2.2;
      projectedLabs.ast += oralHepaticSurge * 1.8;
      systemLoad.hepatic += oralHepaticSurge * 0.9;
      oralStressLoad += oralHepaticSurge * 1.5;
    }

    projectedLabs.creatinine += (data.biomarkers?.renal_toxicity || 0) * loadRatio * 0.1;
    projectedLabs.hematocrit += (data.biomarkers?.rbc || 0) * loadRatio * 1.5;

    if (data.biomarkers?.anti_e) {
      antiEstrogenStrength += data.biomarkers.anti_e * loadRatio;
    }
    if (data.flags?.isAI) {
      antiEstrogenStrength += saturationMg * 10;
    }

    const suppressiveFactor = Number(data.suppressiveFactor) || 0;
    if (suppressiveFactor > 0) {
      suppressiveLoad += suppressiveFactor * loadRatio;
    }
  });
  const suppressionScore = Math.min(1, suppressiveLoad / 5.5);
  const endogenousStatus = Math.max(0, 1 - suppressionScore);
  const baselineEstradiol = 25 * endogenousStatus;
  const aromataseProfileScalar = Math.max(0.25, Number(aromataseScalar) || 1);
  const aiInhibitionFactor = 1 / (1 + antiEstrogenStrength * 0.6);
  const aromataseConfig = {
    baselineEstradiol,
    aromataseScalar: aromataseProfileScalar,
    inhibitor: aiInhibitionFactor,
    methylLoad: methylEstrogenLoad,
  };

  const preliminaryAromatase = computeAromatizationKinetics({
    ...aromataseConfig,
    substrateMg: Math.max(0, totalAromatizableLoad),
  });

  const firstShbgPass = calculateShbgDynamics({
    compounds,
    estradiol: preliminaryAromatase.estradiol,
    baselineShbg: BASELINE_SHBG_NMOL,
  });

  const freeAromatizableLoad = Array.isArray(compounds)
    ? compounds.reduce((sum, compound) => {
        if (!compound?.aromatizationLoad) return sum;
        const lookupKey = compound.key || compound.id;
        const rawFraction = Number(
          firstShbgPass.compoundFreeFractions?.[lookupKey],
        );
        const safeFraction = Number.isFinite(rawFraction) ? rawFraction : 1;
        const clampedFraction = Math.max(0, Math.min(1, safeFraction));
        return sum + compound.aromatizationLoad * clampedFraction;
      }, 0)
    : 0;

  const aromataseResult = computeAromatizationKinetics({
    ...aromataseConfig,
    substrateMg: Math.max(0, freeAromatizableLoad),
  });

  const estradiolValue = aromataseResult.estradiol;
  projectedLabs.e2 = estradiolValue;
  projectedLabs.estradiol = estradiolValue;

  const normalizedNorLoad = nor19Load / 600;
  const normalizedProgestinLoad = progestinDoseLoad / 8;
  const estrogenAssist = Math.max(0, (estradiolValue - 35) / 50);
  const progestogenicLoadScore = Math.max(
    0,
    normalizedNorLoad + normalizedProgestinLoad + estrogenAssist,
  );
  systemLoad.progestogenic = Math.min(
    100,
    systemLoad.progestogenic + progestogenicLoadScore * 12,
  );
  projectedLabs.prolactin = Math.min(60, 12 + progestogenicLoadScore * 6);

  const shbgDynamics = calculateShbgDynamics({
    compounds,
    estradiol: estradiolValue,
    baselineShbg: BASELINE_SHBG_NMOL,
  });
  const freeFractionLookup = shbgDynamics.compoundFreeFractions || {};
  projectedLabs.shbg = shbgDynamics.shbgLevel;

  const receptorBindingTerms = [];
  let totalBindingTerm = 0;

  compounds.forEach((compound) => {
    const { data, saturationMg = 0 } = compound;
    if (!data || saturationMg <= 0) return;
    const lookupKey = compound.key || compound.id;
    const lookupValue = Number(freeFractionLookup[lookupKey]);
    const freeFraction = Math.min(1, Math.max(0, Number.isFinite(lookupValue) ? lookupValue : 1));
    compound.freeFraction = freeFraction;
    const freeSaturationMg = saturationMg * freeFraction;
    if (freeSaturationMg <= 0) return;
    const freeLoadRatio = freeSaturationMg / 500;
    const relativePotency = efficiencyRatio * freeLoadRatio;

    projectedGains.hypertrophy += (data.biomarkers?.igf1 || 0) * relativePotency * 1.5;
    projectedGains.strength += (data.biomarkers?.cns_drive || 1) * relativePotency * 1.2;
    projectedGains.fatLoss += (data.biomarkers?.cortisol < 0 ? 1 : 0) * relativePotency;

    const bindingKi = deriveKiValue(compound.id, data);
    const bindingTerm = computeBindingTerm(freeSaturationMg, bindingKi);
    if (bindingTerm > 0) {
      receptorBindingTerms.push({
        compoundId: compound.id,
        label: data.abbreviation || data.name || compound.id,
        ki: bindingKi,
        bindingTerm,
        saturationMg: freeSaturationMg,
      });
      totalBindingTerm += bindingTerm;
    }
  });

  const testosteroneEntries = compounds.filter((entry) => entry.id === "testosterone");
  const totalTestosteroneOutput = Math.max(0, projectedLabs.totalTestosterone);
  if (testosteroneEntries.length) {
    const avgFree = testosteroneEntries.reduce(
      (sum, entry) => sum + (entry.freeFraction ?? 1),
      0,
    ) / testosteroneEntries.length;
    const clampedRatio = clampScore(avgFree, 4);
    projectedLabs.freeTestFraction = clampedRatio;
    projectedLabs.freeTestosterone = clampScore(
      totalTestosteroneOutput * clampedRatio,
      2,
    );
  } else {
    projectedLabs.freeTestFraction = clampScore(1, 4);
    projectedLabs.freeTestosterone = clampScore(totalTestosteroneOutput, 2);
  }

  const receptorCompetition = (() => {
    if (!receptorBindingTerms.length) {
      return {
        totalOccupancy: 0,
        freeFraction: 1,
        denominator: 1,
        compounds: [],
      };
    }
    const denominator = 1 + totalBindingTerm;
    const compoundsOccupancy = receptorBindingTerms
      .map((entry) => {
        const occupancy = entry.bindingTerm / denominator;
        return {
          compound: entry.compoundId,
          label: entry.label,
          occupancy: Number(occupancy.toFixed(4)),
          ki: Number(entry.ki.toFixed(3)),
          saturationMg: Number(entry.saturationMg.toFixed(2)),
        };
      })
      .sort((a, b) => b.occupancy - a.occupancy);
    const totalOccupancy = compoundsOccupancy.reduce((sum, item) => sum + item.occupancy, 0);
    return {
      totalOccupancy: Number(totalOccupancy.toFixed(4)),
      freeFraction: Number(Math.max(0, 1 - totalOccupancy).toFixed(4)),
      denominator: Number(denominator.toFixed(4)),
      compounds: compoundsOccupancy,
    };
  })();

  const rawTotalToxicity =
    systemLoad.cardiovascular +
    systemLoad.hepatic +
    systemLoad.renal +
    systemLoad.neuro +
    systemLoad.estrogenic +
    systemLoad.progestogenic;
  let systemLoadTotal = Math.round((rawTotalToxicity / 60) * 100);
  systemLoadTotal += oralStressLoad;
  const mgPressure = totalSaturationMg / TOXICITY_CEILING;
  if (mgPressure > 0.4) {
    systemLoadTotal += Math.pow(mgPressure - 0.4, 1.1) * 140;
  }

  const pressures = [
    { label: "Cardiovascular", val: systemLoad.cardiovascular },
    { label: "Hepatic", val: systemLoad.hepatic },
    { label: "Renal", val: systemLoad.renal },
    { label: "Neuro / CNS", val: systemLoad.neuro },
    { label: "Estrogenic", val: systemLoad.estrogenic },
    { label: "Progestogenic", val: systemLoad.progestogenic },
  ];

  pressures.sort((a, b) => b.val - a.val);
  systemLoad.dominantPressure = pressures[0].val > 5 ? pressures[0].label : "Balanced";

  projectedLabs.neuroRisk = Math.min(10, Math.round(systemLoad.neuro / 10));

  projectedLabs.shbg = Math.max(5, projectedLabs.shbg);
  projectedLabs.hdl = Math.max(5, projectedLabs.hdl);
  projectedLabs.hematocrit = Math.min(65, projectedLabs.hematocrit);
  projectedLabs.creatinine = Math.min(5.0, projectedLabs.creatinine);

  const viscosityOverload = Math.max(0, projectedLabs.hematocrit - 52);
  if (viscosityOverload > 0) {
    systemLoad.cardiovascular += viscosityOverload * 2.5;
  }
  const acuteViscosity = Math.max(0, projectedLabs.hematocrit - 55);
  if (acuteViscosity > 0) {
    systemLoad.cardiovascular += acuteViscosity * 3;
  }

  let criticalPenaltyMultiplier = 1.0;

  if (projectedLabs.hdl < 40) {
    criticalPenaltyMultiplier += 0.3;
    if (projectedLabs.hdl < 20) {
      criticalPenaltyMultiplier += 0.6;
    }
  }

  if (projectedLabs.ldl > 160) {
    criticalPenaltyMultiplier += 0.2;
    if (projectedLabs.ldl > 190) {
      criticalPenaltyMultiplier += 0.3;
    }
  }

  if (projectedLabs.alt > 120 || projectedLabs.ast > 120) {
    criticalPenaltyMultiplier += 0.4;
    if (projectedLabs.alt > 200 || projectedLabs.ast > 200) {
      criticalPenaltyMultiplier += 0.4;
    }
  }

  if (projectedLabs.creatinine > 1.5) {
    criticalPenaltyMultiplier += 0.5;
  }

  if (projectedLabs.hematocrit > 54) {
    criticalPenaltyMultiplier += 0.3;
    if (projectedLabs.hematocrit > 56) {
      criticalPenaltyMultiplier += 0.4;
    }
  }

  systemLoadTotal = Math.round(systemLoadTotal * criticalPenaltyMultiplier);
  systemLoad.total = Math.min(100, systemLoadTotal);

  const rawGains =
    projectedGains.hypertrophy + projectedGains.strength + projectedGains.fatLoss;
  projectedGains.composite = Math.min(10.0, Number((rawGains / 10).toFixed(1)));

  const cnsProfile = buildCnsProfile({
    compounds,
    systemLoadTotal: systemLoad.total,
    totalSaturationMg,
  }, freeFractionLookup);

  return {
    projectedGains,
    systemLoad,
    projectedLabs,
    cnsProfile,
    receptorCompetition,
    shbgDynamics,
    meta: {
      totalActiveMg,
      totalSaturationMg,
      efficiencyRatio,
      aromatase: {
        baselineEstradiol,
        suppressionScore,
        profileScalar: aromataseProfileScalar,
        inhibitor: aiInhibitionFactor,
        totalSubstrateMg: Math.max(0, totalAromatizableLoad),
        freeSubstrateMg: Math.max(0, freeAromatizableLoad),
        estradiol: estradiolValue,
      },
    },
  };
};
