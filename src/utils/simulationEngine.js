/**
 * simulationEngine.js
 * THE PHYSICS ENGINE (v2 - Integration Ready)
 * Implements:
 * 1. Dose Normalization (Frequency -> Weekly Mg)
 * 2. Pharmacokinetics (Steady State Accumulation)
 * 3. Diminishing Returns (Saturation Curves)
 * 4. Full Lab Panel Coverage (Matches legacy UI contract)
 */

export const SATURATION_THRESHOLD_1 = 1500;
export const SATURATION_THRESHOLD_2 = 2500;
export const TOXICITY_CEILING = 3000;

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

  compounds.forEach((compound) => {
    const { data, saturationMg, weeklyDose } = compound;
    const loadRatio = saturationMg / 500;
    const relativePotency = efficiencyRatio * loadRatio;
    const isOral = data.type === "oral";
    const dailyDose = weeklyDose / 7 || 0;
    const toxicityTier = data.toxicityTier ?? 1;

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
    if (data.flags?.aromatization) {
      totalAromatizableLoad += saturationMg * data.flags.aromatization;
    }
    if (data.flags?.createsMethylEstrogen) {
      methylEstrogenLoad += saturationMg;
    }
    if (data.biomarkers?.prolactin > 0) {
      nor19Load += saturationMg * data.biomarkers.prolactin;
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
      const oralRatio = Math.max(1, dailyDose / 25);
      const oralHepaticSurge = Math.pow(oralRatio, 1.35) * (6 * toxicityTier);
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
  });

  projectedLabs.prolactin += nor19Load * 0.05;

  const aromPressure = totalAromatizableLoad / 350;
  const aiMitigation = 1 / (1 + antiEstrogenStrength * 0.6);
  const unmanagedEstradiol = 25 + Math.pow(Math.max(0, aromPressure), 1.35) * 35;
  const estradiolValue = Math.min(
    350,
    unmanagedEstradiol * aiMitigation + methylEstrogenLoad * 0.05,
  );
  projectedLabs.e2 = estradiolValue;
  projectedLabs.estradiol = estradiolValue;

  const rawTotalToxicity =
    systemLoad.cardiovascular + systemLoad.hepatic + systemLoad.renal + systemLoad.neuro;
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
  ];

  pressures.sort((a, b) => b.val - a.val);
  systemLoad.dominantPressure = pressures[0].val > 5 ? pressures[0].label : "Balanced";

  projectedLabs.neuroRisk = Math.min(10, Math.round(systemLoad.neuro / 10));

  projectedLabs.shbg = Math.max(5, projectedLabs.shbg);
  projectedLabs.hdl = Math.max(5, projectedLabs.hdl);
  projectedLabs.hematocrit = Math.min(65, projectedLabs.hematocrit);
  projectedLabs.creatinine = Math.min(5.0, projectedLabs.creatinine);

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
