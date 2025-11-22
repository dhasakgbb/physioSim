/**
 * Calculates the concentration at time t for a single dose using a one-compartment model with first-order absorption.
 * Formula: C(t) = (F * D * ka / (Vd * (ka - kel))) * (exp(-kel * t) - exp(-ka * t))
 * 
 * @param t Time since administration (hours)
 * @param dose Dose in mg
 * @param F Bioavailability (0-1)
 * @param ka Absorption rate constant (1/h)
 * @param kel Elimination rate constant (1/h)
 * @param Vd Volume of distribution (L)
 * @returns Concentration in mg/L (equivalent to ug/mL)
 */
export function oneCompartmentFirstOrderAbsorption(
  t: number,
  dose: number,
  F: number,
  ka: number,
  kel: number,
  Vd: number
): number {
  if (t < 0) return 0;
  if (ka === kel) {
    // Special case where ka == kel (unlikely but mathematically possible)
    // C(t) = (F * D / Vd) * kel * t * exp(-kel * t)
    return (F * dose / Vd) * kel * t * Math.exp(-kel * t);
  }
  const multiplier = (F * dose * ka) / (Vd * (ka - kel));
  return multiplier * (Math.exp(-kel * t) - Math.exp(-ka * t));
}

/**
 * Calculates the concentration at time t for a single dose using a one-compartment model with IV bolus.
 * Formula: C(t) = (D / Vd) * exp(-kel * t)
 * 
 * @param t Time since administration (hours)
 * @param dose Dose in mg
 * @param kel Elimination rate constant (1/h)
 * @param Vd Volume of distribution (L)
 * @returns Concentration in mg/L
 */
export function oneCompartmentIVBolus(
  t: number,
  dose: number,
  kel: number,
  Vd: number
): number {
  if (t < 0) return 0;
  return (dose / Vd) * Math.exp(-kel * t);
}

/**
 * Hill Equation for Pharmacodynamics
 * E = Emax * C^n / (EC50^n + C^n)
 * 
 * @param C Concentration
 * @param Emax Maximum effect
 * @param EC50 Concentration at 50% effect
 * @param n Hill coefficient
 * @returns Effect value
 */
export function hillEquation(C: number, Emax: number, EC50: number, n: number): number {
  if (C <= 0) return 0;
  const cn = Math.pow(C, n);
  const ec50n = Math.pow(EC50, n);
  return (Emax * cn) / (ec50n + cn);
}

/**
 * Converts mg/L (or ug/mL) to nM (nanomolar)
 * @param concentration_mg_L Concentration in mg/L
 * @param molecularWeight Molecular weight in g/mol
 * @returns Concentration in nM
 */
export function convertMgLToNM(concentration_mg_L: number, molecularWeight: number): number {
  // mg/L = g/m^3 = ug/mL
  // Molarity (M) = (g/L) / MW
  // nM = M * 1e9
  // (mg/L) / 1000 = g/L
  // ((mg/L) / 1000 / MW) * 1e9 = (mg/L / MW) * 1e6
  return (concentration_mg_L / molecularWeight) * 1e6;
}
