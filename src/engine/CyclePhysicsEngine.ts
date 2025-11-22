import { COMPOUNDS } from '../data/compounds';
import { ICompoundSchema } from '../types/physio';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface StackItem {
  compoundId: string;
  doseMg: number;
  frequency: number; // Days between doses (1 = daily, 3.5 = E3.5D, 7 = weekly)
  isOral: boolean;
  ester?: string; // e.g., "enanthate", "acetate"
}

export interface UserProfile {
  lbm_lbs: number; // Lean body mass (sets genetic ceiling)
  liverResilience: number; // 0.8-1.2 scalar for toxicity tolerance
  bodyWeightKg?: number; // Optional, defaults to 80kg
}

export interface DailyDataPoint {
  day: number;
  serumTotal: number; // Active mg circulating
  genomicTissue: number; // Green line (capped, slow)
  volumization: number; // Water/glycogen component
  totalMass: number; // Indigo line (tissue + volumization)
  toxicity: number; // Red line (cumulative debt)
  stabilityScore: number; // 0-100 (serum stability metric)
}

interface DoseEvent {
  day: number;
  compoundId: string;
  doseMg: number;
  ester?: string;
  isOral: boolean;
}

// ============================================================================
// MATH KERNELS
// ============================================================================

/**
 * Bateman Function: Calculate serum concentration from a single dose
 * Returns mg remaining from a single dose at time t
 * 
 * @param dose - Dose amount in mg
 * @param t - Time since dose in days
 * @param ka - Absorption rate constant (1/day)
 * @param ke - Elimination rate constant (1/day)
 */
const calcRelease = (dose: number, t: number, ka: number, ke: number): number => {
  if (t < 0) return 0;
  
  // Edge case: ka equals ke (rarely happens but mathematically possible)
  if (Math.abs(ka - ke) < 0.0001) {
    return dose * ke * t * Math.exp(-ke * t);
  }
  
  // Standard Bateman equation
  return (dose * ka / (ka - ke)) * (Math.exp(-ke * t) - Math.exp(-ka * t));
}

/**
 * Convert active drug mass (mg) to nanomolar concentration (nM)
 * 
 * Pharmacological Formula:
 * 1. mg/L = active_mg / Vd_L
 * 2. nM = (mg/L) × (1,000,000 / MW_g_mol)
 * 
 * @param activeMg - Active drug mass in body (mg)
 * @param Vd_L_kg - Volume of distribution (L/kg)
 * @param bodyWeightKg - Body weight (kg)
 * @param molecularWeight - Molecular weight (g/mol)
 * @returns Concentration in nanomolar (nM)
 */
const mgToNanomolar = (
  activeMg: number,
  Vd_L_kg: number,
  bodyWeightKg: number,
  molecularWeight: number
): number => {
  if (activeMg <= 0 || molecularWeight <= 0) return 0;
  
  const Vd_L_total = Vd_L_kg * bodyWeightKg;
  const concentration_mg_L = activeMg / Vd_L_total;
  const concentration_nM = (concentration_mg_L * 1_000_000) / molecularWeight;
  
  return concentration_nM;
};

/**
 * Hill Equation: Convert concentration to receptor/pathway response
 * Returns signal strength (0 to Emax)
 * 
 * @param concentration - Active concentration in nM (STANDARDIZED)
 * @param EC50 - Concentration at 50% effect (nM)
 * @param n - Hill coefficient (steepness)
 * @param Emax - Maximum effect
 */
const calcResponse = (
  concentration: number, 
  EC50: number, 
  n: number, 
  Emax: number
): number => {
  if (concentration <= 0) return 0;
  
  const num = Math.pow(concentration, n);
  const den = Math.pow(EC50, n) + num;
  
  return Emax * (num / den);
};

// ============================================================================
// KINETICS HELPER
// ============================================================================

/**
 * Extract kinetic parameters (Ka, Ke) from compound data
 */
const getKinetics = (
  compound: ICompoundSchema,
  isOral: boolean,
  ester?: string
): { ka: number; ke: number } => {
  let ka = 0.01; // Default slow absorption
  let ke = 0.1; // Default elimination
  
  // Calculate Ke from clearance: ke = CL / Vd
  // CL is in mL/min/kg, need to convert to 1/day
  // ke = (CL * 60 * 24 / 1000) / Vd
  const Vd_L_kg = compound.pk.Vd;
  const CL_mL_min_kg = compound.pk.CL;
  const CL_L_day_kg = (CL_mL_min_kg * 60 * 24) / 1000;
  ke = CL_L_day_kg / Vd_L_kg;
  
  // Get Ka based on route and ester
  if (isOral && compound.pk.absorption?.oral) {
    // Oral absorption: Ka from absorption data
    // Convert from 1/hour to 1/day
    ka = compound.pk.absorption.oral.Ka * 24;
  } else if (ester && compound.pk.esters && compound.pk.esters[ester]) {
    // Injectable: Ka from ester parameters
    const esterDef = compound.pk.esters[ester];
    if (esterDef.parameters?.Ka) {
      // Convert from 1/hour to 1/day
      ka = esterDef.parameters.Ka * 24;
    } else if (esterDef.releaseHalfLife_Hours) {
      // Calculate Ka from half-life: ka = ln(2) / t1/2
      const t_half_days = esterDef.releaseHalfLife_Hours / 24;
      ka = Math.log(2) / t_half_days;
    }
  } else {
    // No ester specified, assume instant release
    ka = 10.0; // Very fast absorption (instant)
  }
  
  return { ka, ke };
};

// ============================================================================
// PATHWAY PARAMETER EXTRACTORS
// ============================================================================

/**
 * Extract genomic pathway parameters for muscle growth
 */
const getGenomicParams = (compound: ICompoundSchema) => {
  const myogenesis = compound.pd?.pathwayModulation?.genomic?.myogenesis;
  
  return {
    Emax: myogenesis?.Emax || 0,
    EC50: myogenesis?.EC50 || 100, // High default = weak effect
    Hill_n: myogenesis?.Hill_n || 1.0
  };
};

/**
 * Extract volumization parameters (glycogen, water retention)
 */
const getVolumizationParams = (compound: ICompoundSchema) => {
  const glycogenSynthesis = compound.pd?.pathwayModulation?.nonGenomic?.glycogen_synthesis;
  const GR = compound.pd?.receptorInteractions?.GR;
  const ER_alpha = compound.pd?.receptorInteractions?.ER_alpha;
  
  // Glycogen storage potential
  const glycogenPotency = glycogenSynthesis?.Emax || 0;
  
  // Anti-catabolic (GR antagonism - Trenbolone effect)
  const antiCatabolicBonus = (GR?.activityType === 'Antagonist') ? GR.Emax * 0.5 : 0;
  
  // Estrogenic water retention
  const estrogenicWater = (ER_alpha?.activityType === 'FullAgonist') ? ER_alpha.Emax * 0.3 : 0;
  
  return {
    glycogenPotency,
    antiCatabolicBonus,
    estrogenicWater
  };
};

/**
 * Calculate daily toxicity load for a compound
 * @param dailyMg - The dose amount taken TODAY (not serum concentration)
 */
const calcToxicityLoad = (
  compound: ICompoundSchema,
  dailyMg: number,
  liverResilience: number
): number => {
  let load = 0;
  
  // Hepatic toxicity (most important for orals)
  const hepatic = compound.toxicity?.hepatic;
  if (hepatic) {
    if (hepatic.modelType === 'Coefficient') {
      load += dailyMg * (hepatic.parameters.coefficient || 0) * 0.5; // Reduced from 1.0
    } else if (hepatic.modelType === 'Hill_TC50') {
      const response = calcResponse(
        dailyMg,
        hepatic.parameters.TC50 || 100,
        hepatic.parameters.Hill_n || 1.5,
        hepatic.parameters.Emax || 100
      );
      load += response * 0.1; // Reduced from 0.2
    }
  }
  
  // Renal toxicity
  const renal = compound.toxicity?.renal;
  if (renal) {
    if (renal.modelType === 'Coefficient') {
      load += dailyMg * (renal.parameters.coefficient || 0) * 0.5;
    } else if (renal.modelType === 'Hill_TC50') {
      const response = calcResponse(
        dailyMg,
        renal.parameters.TC50 || 100,
        renal.parameters.Hill_n || 1.5,
        renal.parameters.Emax || 100
      );
      load += response * 0.1;
    }
  }
  
  // Cardiovascular toxicity
  const cardiovascular = compound.toxicity?.cardiovascular;
  if (cardiovascular) {
    if (cardiovascular.modelType === 'Coefficient') {
      load += dailyMg * (cardiovascular.parameters.coefficient || 0) * 0.5;
    } else if (cardiovascular.modelType === 'Hill_TC50') {
      const response = calcResponse(
        dailyMg,
        cardiovascular.parameters.TC50 || 100,
        cardiovascular.parameters.Hill_n || 1.5,
        cardiovascular.parameters.Emax || 100
      );
      load += response * 0.1;
    }
  }
  
  // Neurotoxicity (Trenbolone, stimulants)
  const neuro = compound.toxicity?.neurotoxicity;
  if (neuro) {
    if (neuro.modelType === 'Coefficient') {
      load += dailyMg * (neuro.parameters.coefficient || 0) * 0.5;
    } else if (neuro.modelType === 'Hill_TC50') {
      const response = calcResponse(
        dailyMg,
        neuro.parameters.TC50 || 100,
        neuro.parameters.Hill_n || 1.5,
        neuro.parameters.Emax || 100
      );
      load += response * 0.1;
    }
  }
  
  // Apply liver resilience modifier
  return load / liverResilience;
};

// ============================================================================
// MAIN SIMULATION ENGINE
// ============================================================================

/**
 * Run the full cycle physics simulation
 * 
 * @param stack - Array of compounds with dosing information
 * @param profile - User physiological profile
 * @param days - Simulation duration (default 112 = 16 weeks)
 */
export const runSimulation = (
  stack: StackItem[],
  profile: UserProfile,
  days: number = 112
): DailyDataPoint[] => {
  
  // Early return for empty stack
  if (!stack || stack.length === 0) {
    return [];
  }
  
  const timeline: DailyDataPoint[] = [];
  
  // User-specific constants
  // GENETIC_LIMIT is now calculated inside the loop relative to total mass
  
  // Simulation State
  let currentTissue = 0; // Genomic tissue (green line state)
  let toxicityDebt = 0; // Toxicity debt (red line state)
  let currentVolumization = 0; // Volumization state (blue line state)
  let currentSmoothedLoad = 0; // Smoothed toxicity load state
  
  // Pre-calculate dosing schedule
  const schedule: DoseEvent[] = [];
  stack.forEach(item => {
    for (let d = 0; d < days; d += item.frequency) {
      schedule.push({
        day: Math.floor(d),
        compoundId: item.compoundId,
        doseMg: item.doseMg,
        ester: item.ester,
        isOral: item.isOral
      });
    }
  });
  
  // Day-by-day integration
  for (let t = 0; t < days; t++) {
    // 1. Calculate Total Active Serum & Daily Dose
    const serumByCompound: Record<string, number> = {};
    const doseByCompound: Record<string, number> = {};
    
    schedule.forEach(event => {
      // Track daily dose (for toxicity)
      if (event.day === t) {
        doseByCompound[event.compoundId] = (doseByCompound[event.compoundId] || 0) + event.doseMg;
      }

      // Track active serum (for PD)
      if (t < event.day) return;
      
      const compound = COMPOUNDS[event.compoundId];
      if (!compound) return;
      
      const timeSinceDose = t - event.day;
      const { ka, ke } = getKinetics(compound, event.isOral, event.ester);
      
      let activeMg = 0;
      
      // For orals with fast kinetics, use AVERAGE concentration over dosing interval
      // instead of trough (which would be near zero for daily dosing)
      if (event.isOral && compound.pk.absorption?.oral) {
        // Calculate average steady-state concentration for this dose
        // Integrate Bateman function from timeSinceDose to timeSinceDose+1 day
        // Simplified: use midpoint (12h after dose) as representative
        const midpointTime = timeSinceDose + 0.5;
        activeMg = calcRelease(event.doseMg, midpointTime, ka, ke);
      } else {
        // Injectables: use exact point sample (peaks and troughs smooth out)
        activeMg = calcRelease(event.doseMg, timeSinceDose, ka, ke);
      }
      
      // PK Debug logging
      if (t === 28 && event.compoundId === 'anadrol' && timeSinceDose < 2) {
        console.log(`[PK Debug Day ${t}] ${event.compoundId}:`, {
          doseMg: event.doseMg,
          isOral: event.isOral,
          ka,
          ke,
          timeSinceDose,
          activeMg,
          method: event.isOral ? 'midpoint' : 'point-sample'
        });
      }

      
      serumByCompound[event.compoundId] = (serumByCompound[event.compoundId] || 0) + activeMg;
    });

    // 2. Calculate PD Effects based on Totals (IN NANOMOLAR UNITS)
    let dailyGenomicDrive = 0;
    let dailyVolumizationSignal = 0;
    let dailyToxicityLoad = 0;

    // User body weight for Vd calculations
    const bodyWeightKg = profile.bodyWeightKg || 80;

    // Iterate over active compounds
    Object.keys(serumByCompound).forEach(compoundId => {
      const compound = COMPOUNDS[compoundId];
      const activeMg = serumByCompound[compoundId];
      const dailyDose = doseByCompound[compoundId] || 0;

      if (!compound || activeMg <= 0) return;

      // Convert mg → nM for pharmacologically standardized calculations
      const molecularWeight = compound.metadata?.chemicalProperties?.molecularWeight || 300;
      const Vd_L_kg = compound.pk.Vd;
      const concentration_nM = mgToNanomolar(activeMg, Vd_L_kg, bodyWeightKg, molecularWeight);

      // Genomic Drive (Muscle Growth) - Using nM concentrations
      const genomicParams = getGenomicParams(compound);
      const genomicSignal = calcResponse(
        concentration_nM,  // NOW IN nM
        genomicParams.EC50,  // EC50 should be in nM (e.g., ~450 nM)
        genomicParams.Hill_n,
        genomicParams.Emax
      );
      
      // Browser debug logging (will appear in DevTools console)
      if (t % 28 === 0 && compoundId === Object.keys(serumByCompound)[0]) {
        console.log(`[Day ${t}] ${compoundId}:`, {
          activeMg,
          concentration_nM: concentration_nM.toFixed(2),
          EC50: genomicParams.EC50,
          genomicSignal: genomicSignal.toFixed(2),
          currentTissue
        });
      }
      
      dailyGenomicDrive += genomicSignal;

      // Volumization (Glycogen/Water) - Using nM concentrations
      const volParams = getVolumizationParams(compound);
      const volEC50 = volParams.glycogenPotency > 0 ? 10 : 999;
      const volEmax = volParams.glycogenPotency + volParams.antiCatabolicBonus + volParams.estrogenicWater;
      const volSignal = calcResponse(
        concentration_nM,  // NOW IN nM
        volEC50,  // Low EC50 (~10 nM) for "wall" effect
        1.0,
        volEmax
      );
      
      if (t % 28 === 0 && compoundId === Object.keys(serumByCompound)[0]) {
        console.log(`[Volumization Day ${t}]`, {
          compoundId,
          volParams,
          volEC50,
          volEmax,
          volSignal,
          concentration_nM
        });
      }
      
      dailyVolumizationSignal += volSignal;

      // Toxicity (Based on Daily Dose for orals, nM concentration for injectables)
      const toxLoad = calcToxicityLoad(compound, dailyDose > 0 ? dailyDose : activeMg * 0.005, profile.liverResilience);
      dailyToxicityLoad += toxLoad;
    });
    
    // 3. Update State Accumulators
    
    // 3. Update State Accumulators
    
    // Genomic Tissue (Diminishing Returns)
    // Ceiling is based on genetic potential (e.g., 20% above natural baseline)
    const GENETIC_LIMIT = profile.lbm_lbs * 1.20; 
    const currentTotalLBM = profile.lbm_lbs + currentTissue;
    const spaceToGrow = Math.max(0, GENETIC_LIMIT - currentTotalLBM);

    // Growth slows down as you approach the limit
    const GENOMIC_RESPONSE_SCALE = 40; // Normalizes the drive to roughly weekly pound changes
    const growthRate = 0.9; // Tuned for ~12 lbs over a 16-week blast with diminishing returns
    const growthLimiter = Math.max(1, profile.lbm_lbs * 0.25);
    const normalizedDrive = dailyGenomicDrive / GENOMIC_RESPONSE_SCALE;
    const effectiveGrowth = Math.max(0, normalizedDrive * growthRate * Math.min(1, spaceToGrow / growthLimiter));
    currentTissue += effectiveGrowth;
    
    // Volumization (Physiological Inertia)
    const targetVolumization = dailyVolumizationSignal * 1.5;
    const VOLUMIZATION_INERTIA = 0.98; 
    
    if (t === 0) {
      currentVolumization = targetVolumization;
    } else {
      currentVolumization = (currentVolumization * VOLUMIZATION_INERTIA) + (targetVolumization * (1 - VOLUMIZATION_INERTIA));
    }
    
    // Toxicity Debt (Continuous Accumulation Model)
    // Remove the "Threshold Gate". All load adds stress, body recovers constant amount.
    const LIVER_RECOVERY_CAPACITY = 15.0 * profile.liverResilience; // Increased recovery capacity
    
    // Smooth the load first (metabolic inertia)
    const TOXICITY_INERTIA = 0.90;
    currentSmoothedLoad = (currentSmoothedLoad * TOXICITY_INERTIA) + (dailyToxicityLoad * (1 - TOXICITY_INERTIA));
    
    // Calculate net change
    const netToxicityChange = currentSmoothedLoad - LIVER_RECOVERY_CAPACITY;
    
    if (netToxicityChange > 0) {
      // Accumulate debt (stress exceeds recovery)
      // Cap the acceleration to prevent infinite runaway, but allow growth
      toxicityDebt += netToxicityChange;
    } else {
      // Recover debt (recovery exceeds stress)
      // Recovery is limited by the available capacity
      toxicityDebt = Math.max(0, toxicityDebt + netToxicityChange);
    }
    
    // Calculate total serum for stability metric
    const dailySerum = Object.values(serumByCompound).reduce((a, b) => a + b, 0);

    // Calculate serum stability (CV of recent serum levels)
    let stabilityScore = 100;
    if (t >= 7) {
      const recentSerum = timeline.slice(Math.max(0, t - 7), t).map(p => p.serumTotal);
      const mean = recentSerum.reduce((a, b) => a + b, 0) / recentSerum.length;
      const variance = recentSerum.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentSerum.length;
      const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
      stabilityScore = Math.max(0, Math.min(100, 100 - cv * 200));
    }
    
    // Push daily snapshot
    timeline.push({
      day: t,
      serumTotal: Math.round(dailySerum * 10) / 10,
      genomicTissue: Math.round(currentTissue * 10) / 10,
      volumization: Math.round(currentVolumization * 10) / 10,
      totalMass: Math.round((profile.lbm_lbs + currentTissue + currentVolumization) * 10) / 10,  // Include baseline!
      toxicity: Math.round(toxicityDebt * 10) / 10,
      stabilityScore: Math.round(stabilityScore)
    });
  }
  
  return timeline;
};

/**
 * Find the optimal exit week (when toxicity crosses total mass)
 */
export const findOptimalExitWeek = (timeline: DailyDataPoint[]): number => {
  const crossoverIndex = timeline.findIndex(d => d.toxicity > d.totalMass);
  return crossoverIndex !== -1 ? Math.floor(crossoverIndex / 7) : 16;
};
