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
const RECEPTOR_AFFINITY_OVERRIDES = {
  testosterone: 1.0,
  nandrolone: 1.5,
  trenbolone: 5.0,
  ment: 4.0,
};
const DEFAULT_AFFINITY = 1.0;
const RECEPTOR_CEILING = 2600;

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

    if (aromatizationFlag) {
      const aromLoad = saturationMg * aromatizationFlag;
      totalAromatizableLoad += aromLoad;
      if (affinityMultiplier <= 1.2) {
        lowAffinityAromLoad += aromLoad;
      }
    }
    const efficiencyFactor = saturationRatio > 1
      ? 1 + Math.log10(saturationRatio)
      : saturationRatio;
    const toxicityLoad = Math.pow(Math.max(activeMg, 0) / 500, 1.5) + (drugData.type === "oral" ? 0.05 : 0);

    normalized.push({
      ...drugData,
      id: item.id,
      rawDose: weeklyDose,
      activeMg,
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
    activeCompounds.forEach((drug) => {
      if (!drug) return;
      const toxMod = Number(drug.toxicityLoad) || 0;
      const metabolic = drug.metabolic || {};
      const toxicity = drug.toxicity || {};

      const androgenicSource =
        toxicity.androgenic ?? metabolic.dht_conversion ?? 0;
      load.androgenic += positive(androgenicSource) * toxMod;
      load.cardio += positive(toxicity.lipid) * toxMod + positive(metabolic.diuretic_effect) * 0.5;
      load.neuro += positive(toxicity.neuro) * toxMod;
      load.hepatic += positive(toxicity.hepatic) * toxMod;
      load.renal += positive(toxicity.renal) * toxMod;
      const estrogenicSource = positive(metabolic.aromatization);
      if (estrogenicSource) {
        load.estrogenic += estrogenicSource * toxMod;
      }
      const progestogenicSource = positive(toxicity.progestogenic);
      if (progestogenicSource) {
        load.progestogenic += progestogenicSource * toxMod;
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
      status: classifyLabStatus(hdl, { warningLow: 45, criticalLow: 30 }),
    },
    ldl: {
      value: Number(labs.ldl.toFixed(0)),
      status: classifyLabStatus(labs.ldl, { warningHigh: 130, criticalHigh: 160 }),
    },
    ast: {
      value: Number(labs.ast.toFixed(0)),
      status: classifyLabStatus(labs.ast, { warningHigh: 50, criticalHigh: 80 }),
    },
    alt: {
      value: Number(labs.alt.toFixed(0)),
      status: classifyLabStatus(labs.alt, { warningHigh: 50, criticalHigh: 80 }),
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
      status: classifyLabStatus(labs.hematocrit, { warningHigh: 50, criticalHigh: 55 }),
    },
    creatinine: {
      value: Number(labs.creatinine.toFixed(2)),
      status: classifyLabStatus(labs.creatinine, { warningHigh: 1.3, criticalHigh: 1.6 }),
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

const getSaturationLevel = (activeMg, halfLifeHours) => {
  if (!halfLifeHours) return activeMg;
  const accumulationFactor = 1.0 + (halfLifeHours / 168.0);
  return activeMg * accumulationFactor;
};

export const calculateCycleMetrics = (activeStack, compoundData) => {
  let totalActiveMg = 0;
  let totalSaturationMg = 0;

  const compounds = activeStack
    .map((item) => {
      const data = compoundData[item.id];
      if (!data) return null;

      const freqMultiplier = getWeeklyFrequency(item.frequency);
      const weeklyDose = (item.dosage || 0) * freqMultiplier;
      const activeMg = getActiveMg(weeklyDose, item.ester, data);
      const esterHalfLife = data.esters?.[item.ester]?.halfLife || data.halfLife;
      const saturationMg = getSaturationLevel(activeMg, esterHalfLife);

      totalActiveMg += activeMg;
      totalSaturationMg += saturationMg;

      return {
        ...item,
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
    shbg: 35,
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
  let totalAffinityLoad = 0;
  let lowAffinityAromLoad = 0;

  compounds.forEach((compound) => {
    const { data, saturationMg, weeklyDose } = compound;
    const loadRatio = saturationMg / 500;
    const relativePotency = efficiencyRatio * loadRatio;
    const isOral = data.type === "oral";
    const dailyDose = weeklyDose / 7 || 0;
    const toxicityTier = data.toxicityTier ?? 1;
    const affinityMultiplier =
      RECEPTOR_AFFINITY_OVERRIDES[compound.id] ??
      (data.pathways?.ar_affinity ? data.pathways.ar_affinity / 5 : DEFAULT_AFFINITY);
    const affinityLoad = saturationMg * affinityMultiplier;
    totalAffinityLoad += affinityLoad;

    projectedGains.hypertrophy += (data.biomarkers?.igf1 || 0) * relativePotency * 1.5;
    projectedGains.strength += (data.biomarkers?.cns_drive || 1) * relativePotency * 1.2;
    projectedGains.fatLoss += (data.biomarkers?.cortisol < 0 ? 1 : 0) * relativePotency;

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
      if (affinityMultiplier <= 1.2) {
        lowAffinityAromLoad += aromLoad;
      }
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

    projectedLabs.shbg -= loadRatio * 12;
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
      const oralHepaticSurge = Math.pow(oralRatio, 1.5) * (6 * toxicityTier);
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

  if (totalAffinityLoad > RECEPTOR_CEILING && lowAffinityAromLoad > 0) {
    const spillRatio = Math.min(
      1,
      (totalAffinityLoad - RECEPTOR_CEILING) / totalAffinityLoad,
    );
    const extraArom = lowAffinityAromLoad * spillRatio * 0.6;
    totalAromatizableLoad += extraArom;
  }

  const aromPressure = totalAromatizableLoad / 350;
  const aiMitigation = 1 / (1 + antiEstrogenStrength * 0.6);
  const suppressionScore = Math.min(1, suppressiveLoad / 5.5);
  const endogenousStatus = Math.max(0, 1 - suppressionScore);
  const baselineEstradiol = 25 * endogenousStatus;
  const aromatizedEstradiol = Math.pow(Math.max(0, aromPressure), 1.35) * 35;
  const unmanagedEstradiol = baselineEstradiol + aromatizedEstradiol;
  const estradiolValue = Math.min(
    350,
    unmanagedEstradiol * aiMitigation + methylEstrogenLoad * 0.05,
  );
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

  if (projectedLabs.hdl < 30) {
    criticalPenaltyMultiplier += 0.3;
    if (projectedLabs.hdl < 20) {
      criticalPenaltyMultiplier += 0.6;
    }
  }

  if (projectedLabs.ldl > 180) {
    criticalPenaltyMultiplier += 0.3;
  }

  if (projectedLabs.alt > 80 || projectedLabs.ast > 80) {
    criticalPenaltyMultiplier += 0.4;
  }

  if (projectedLabs.creatinine > 1.4) {
    criticalPenaltyMultiplier += 0.5;
  }

  if (projectedLabs.hematocrit > 55) {
    criticalPenaltyMultiplier += 0.3;
    if (projectedLabs.hematocrit > 57) {
      criticalPenaltyMultiplier += 0.4;
    }
  }

  systemLoadTotal = Math.round(systemLoadTotal * criticalPenaltyMultiplier);
  systemLoad.total = Math.min(100, systemLoadTotal);

  const rawGains =
    projectedGains.hypertrophy + projectedGains.strength + projectedGains.fatLoss;
  projectedGains.composite = Math.min(10.0, Number((rawGains / 10).toFixed(1)));

  return {
    projectedGains,
    systemLoad,
    projectedLabs,
    meta: { totalActiveMg, totalSaturationMg, efficiencyRatio },
  };
};
