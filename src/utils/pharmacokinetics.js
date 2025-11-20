import { compoundData } from "../data/compoundData";

/**
 * Simulates serum levels for a stack of compounds over time.
 * @param {Array} stack - Array of compound objects { compound, dose, frequency, ester }
 * @param {number} durationWeeks - Duration of the simulation in weeks
 * @returns {Array} - Array of data points { hour, day, [compound]: level, total }
 */
export const simulateSerum = (stack, durationWeeks = 28) => {
  const hoursTotal = durationWeeks * 7 * 24;
  const dataPoints = [];

  // Track Depot (Oil in muscle) vs Active (Serum)
  let activeLevels = {};
  let depotLevels = {};

  stack.forEach((c) => {
    activeLevels[c.compound] = 0;
    depotLevels[c.compound] = 0;
  });

  for (let hour = 0; hour <= hoursTotal; hour += 4) {
    let totalSystemicLoad = 0;
    let point = { hour, day: (hour / 24).toFixed(1) };

    stack.forEach((item) => {
      const meta = compoundData[item.compound];
      if (!meta) return;

      // Use ester-specific half-life if available, otherwise default
      const esterKey = item.ester;
      const esterData = meta.esters && meta.esters[esterKey];
      const hl = esterData ? esterData.halfLife : (meta.halfLife || 24);

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
      // Fast esters (Prop) absorb fast (0.15), Slow esters (Deca) absorb slow (0.05)
      // Orals (HL < 12) absorb almost instantly (0.8)
      const absorptionRate = hl < 12 ? 0.8 : hl < 48 ? 0.15 : 0.05;

      const absorbed = depotLevels[item.compound] * absorptionRate;
      depotLevels[item.compound] -= absorbed;
      activeLevels[item.compound] += absorbed;

      // 3. ELIMINATION: Decay the Serum
      activeLevels[item.compound] *= Math.pow(0.5, 4 / hl);

      // Record Point
      point[item.compound] = activeLevels[item.compound];
      totalSystemicLoad += activeLevels[item.compound];
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
