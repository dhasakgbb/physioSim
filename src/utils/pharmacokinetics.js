import { compoundData } from "../data/compoundData.js";

const DEFAULT_DURATION_DAYS = 42;

const getHalfLifeHours = (meta, esterKey) => {
  if (!meta) return 24;
  if (esterKey && meta.esters && meta.esters[esterKey]?.halfLife) {
    return meta.esters[esterKey].halfLife;
  }
  return meta.halfLife || 24;
};

export const getSteadyStateDurationDays = (stack = []) => {
  if (!Array.isArray(stack) || stack.length === 0) return DEFAULT_DURATION_DAYS;
  const longestHalfLifeDays = stack.reduce((max, item) => {
    const meta = compoundData[item.compound];
    if (!meta) return max;
    const halfLifeHours = getHalfLifeHours(meta, item.ester);
    return Math.max(max, halfLifeHours / 24);
  }, 0);

  if (longestHalfLifeDays <= 0) return DEFAULT_DURATION_DAYS;

  // Roughly 5-6 half-lives to reach >97% steady state.
  const steadyStateDays = longestHalfLifeDays * 6;
  return Math.min(Math.max(steadyStateDays, 28), 140);
};

/**
 * Simulates serum levels for a stack of compounds over time.
 * @param {Array} stack - Array of compound objects { compound, dose, frequency, ester }
 * @returns {Array} - Array of data points { hour, day, [compound]: level, total }
 */
export const simulateSerum = (
  stack,
  options = {},
) => {
  const durationDays = options.durationDays || getSteadyStateDurationDays(stack);
  const hoursTotal = durationDays * 24;
  const dataPoints = [];
  const metabolismMultiplier = options.metabolismMultiplier ?? 1;

  // Track Depot (Oil in muscle) vs Active (Serum)
  let activeLevels = {};
  let depotLevels = {};

  stack.forEach((c) => {
    activeLevels[c.compound] = 0;
    depotLevels[c.compound] = 0;
  });

  for (let hour = 0; hour <= hoursTotal; hour += 4) {
    let totalSystemicLoad = 0;
    let point = { hour, day: Number((hour / 24).toFixed(2)) };

    stack.forEach((item) => {
      const meta = compoundData[item.compound];
      if (!meta) return;

      const esterKey = item.ester;
      const hl = getHalfLifeHours(meta, esterKey);

      const freqDays = item.frequency || 3.5;
      const freqHours = freqDays * 24;

      // 1. INJECTION EVENT: Add to DEPOT, not Serum
      // We check if this specific hour is an injection time
      if (hour % Math.round(freqHours) < 4) {
        // Calculate dose per pin based on weekly total
        // If it's a front-load (Day 0), we might need special handling,
        // but for now we assume the stack defines the steady protocol.
        // TODO: Support specific front-load instructions in the stack object later.
        const dosePerPin = (item.dose / 7) * freqDays;

        // Check for front-load override
        let actualDose = dosePerPin;
        if (hour === 0 && item.frontLoadDose) {
          actualDose = item.frontLoadDose;
        }

        depotLevels[item.compound] += actualDose;
      }

      // 2. ABSORPTION: Transfer from Depot to Active
      // Continuous Absorption Model (Doctor-Grade)
      // We model the absorption rate (ka) as inversely proportional to the ester's half-life.
      // Shorter esters (Prop) release faster. Longer esters (Deca) release slower.
      // Formula: ka ~= 3.0 / halfLifeHours.
      // Calibration:
      // - Prop (24h): 3/24 = 0.125 (Close to old 0.15)
      // - Enanthate (108h): 3/108 = 0.027 (Slower than old 0.05, more realistic smoothing)
      // - Undecanoate (800h): 3/800 = 0.00375 (Very slow trickle)
      // - Orals (<12h): 0.8 (Instant)
      const absorptionRate = hl < 12 ? 0.8 : 3.0 / hl;

      const absorbed = depotLevels[item.compound] * absorptionRate;
      depotLevels[item.compound] -= absorbed;
      activeLevels[item.compound] += absorbed;

      // 3. ELIMINATION: Decay the Serum
      activeLevels[item.compound] *= Math.pow(0.5, 4 / hl);

      // Record Point
      const observedLevel = activeLevels[item.compound] * metabolismMultiplier;
      point[item.compound] = observedLevel;
      totalSystemicLoad += observedLevel;
    });

    point.total = totalSystemicLoad;
    dataPoints.push(point);
  }
  return dataPoints;
};

/**
 * Calculates the optimal front-load dose to reach steady state immediately.
 * Formula: D_load = D_maint * (1 / (1 - e^(-k * tau)))
 * where k = ln(2) / half-life
 * and tau = injection interval
 *
 * Simplified heuristic: Accumulation Ratio = 1.44 * HalfLife / Frequency
 * FrontLoad = WeeklyDose * (HalfLife / 7) * Factor?
 *
 * Let's use the accumulation ratio approach.
 * At steady state, Peak = Dose / (1 - e^-k*tau)
 * We want the first shot to hit that Peak.
 */
export const calculateFrontLoad = (
  compoundKey,
  weeklyDose,
  frequencyDays = 3.5,
  esterKey = null
) => {
  const meta = compoundData[compoundKey];
  if (!meta) return null;

  // Use ester-specific half-life if available
  let halfLifeHours = meta.halfLife || 24;
  if (esterKey && meta.esters && meta.esters[esterKey]) {
    halfLifeHours = meta.esters[esterKey].halfLife;
  }

  const halfLifeDays = halfLifeHours / 24;

  // Elimination rate constant (k)
  const k = Math.log(2) / halfLifeDays;

  // Injection interval (tau)
  const tau = frequencyDays;

  // Accumulation Factor (R)
  // R = 1 / (1 - e^(-k * tau))
  // This tells us how many times higher the steady state peak is compared to a single dose peak.
  const accumulationFactor = 1 / (1 - Math.exp(-k * tau));

  // The maintenance dose per pin
  const dosePerPin = (weeklyDose / 7) * frequencyDays;

  // The required front load is the target peak.
  // Target Peak = DosePerPin * AccumulationFactor
  const frontLoadDose = dosePerPin * accumulationFactor;

  // Calculate time to steady state without front load (approx 5 * half-life)
  const timeToSteadyState = 5 * halfLifeDays;

  return {
    compound: compoundKey,
    maintenanceDose: dosePerPin,
    frontLoadDose: Math.round(frontLoadDose),
    accumulationFactor: accumulationFactor.toFixed(2),
    timeSavedDays: Math.round(timeToSteadyState),
    message: `Front-load ${Math.round(
      frontLoadDose
    )}mg to hit peak levels immediately. Saves ~${Math.round(
      timeToSteadyState / 7
    )} weeks of ramp-up.`,
  };
};
