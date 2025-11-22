import { COMPOUNDS } from '../data/compounds';

export interface IReceptorSegment {
  id: string;
  name: string;
  color: string;
  totalMg: number;
  boundMg: number;
  spillMg: number;
  affinity: number; // Kd
  bindingScore: number; // 1/Kd
  isDisplaced: boolean;
  startAngle?: number; // Calculated for UI
  endAngle?: number;   // Calculated for UI
}

export interface IReceptorState {
  segments: IReceptorSegment[];
  totalBound: number;
  totalSpillover: number;
  totalCapacity: number;
  isSaturated: boolean;
  displacementWarning: string | null;
}

/**
 * Calculates the competitive displacement state of the Androgen Receptor.
 * Uses a "Sediment Ring" model where high-affinity compounds displace lower-affinity ones.
 * 
 * @param activeStack Array of stack items with { compoundId, dose, frequency }
 * @param geneticCapacity Total daily capacity in mg (Testosterone Equivalents)
 * @returns IReceptorState with sorted segments and displacement data
 */
export function calculateReceptorState(
  activeStack: any[], 
  geneticCapacity: number = 150
): IReceptorState {
  
  // 1. PREPARE THE CONTESTANTS
  // Normalize doses to mg/day and gather affinity data
  const contestants: IReceptorSegment[] = activeStack.map(item => {
    // Handle both legacy and new stack item structures
    const compoundId = item.compound || item.compoundId;
    const compound = COMPOUNDS[compoundId];
    
    if (!compound) return null;

    // Calculate daily dose
    // NEW: frequency is stored as numeric days in the store (1 = daily, 3.5 = E3.5D, 7 = weekly)
    // Legacy: frequency might be a string ('Weekly', 'Daily', 'EOD')
    let dailyDose = item.dose;
    
    if (typeof item.frequency === 'number') {
      // New format: frequency in days
      // dose is the total weekly dose, convert to daily by dividing by 7
      // Then multiply by (frequency / 7) to get the per-injection amount
      // Actually, the dose in the store is the total weekly dose
      // So dailyDose = weeklyDose / 7
      dailyDose = item.dose / 7;
    } else if (typeof item.frequency === 'string') {
      // Legacy format: string frequency
      if (item.frequency === 'Weekly') dailyDose = item.dose / 7;
      if (item.frequency === 'EOD') dailyDose = item.dose / 2;
      // 'Daily' is already /1
    }
    
    // Get Affinity (Kd). Lower Kd = Stronger Binding.
    // Default to Test (1.0) if unknown, or very high (weak) if not AR active
    const arInteraction = compound.pd?.receptorInteractions?.AR;
    const kd = arInteraction?.Kd || 10.0; // 10.0 is very weak
    
    // Binding Score = 1/Kd. Higher is better.
    const bindingScore = 1 / kd;

    return {
      id: item.id || compoundId,
      name: compound.metadata.abbreviation || compound.metadata.name,
      color: compound.metadata.color || '#888',
      totalMg: dailyDose,
      boundMg: 0,
      spillMg: 0,
      affinity: kd,
      bindingScore: bindingScore,
      isDisplaced: false
    };
  }).filter(Boolean) as IReceptorSegment[];

  // 2. SORT BY "BULLY FACTOR" (Competitive Binding)
  // Strongest binders (Highest Binding Score) go first.
  contestants.sort((a, b) => b.bindingScore - a.bindingScore);

    // 3. FILL THE TANK (The "Sediment" Loop)
  let remainingCapacity = geneticCapacity;
  let totalBound = 0;
  let totalSpillover = 0;
  let displacedCompounds: string[] = [];
  
  // Test Kd reference
  const TEST_KD = 1.0;

  const segments = contestants.map(c => {
    const demand = c.totalMg;
    
    // Calculate Binding Efficiency based on Kd
    // Strong binders (Kd <= 1.0) have 100% binding potential (limited only by capacity)
    // Weak binders (Kd > 1.0) have reduced binding potential even with available capacity
    // e.g. Anadrol (Kd 100) -> 1/100 = 1% efficiency
    const bindingEfficiency = Math.min(1.0, TEST_KD / c.affinity);
    
    // The amount that *could* bind if capacity were infinite
    const potentialBound = demand * bindingEfficiency;
    
    // The amount that *actually* binds given remaining capacity
    const boundAmount = Math.min(potentialBound, remainingCapacity);
    
    // The rest is spillover (either due to low affinity OR lack of capacity)
    const spillAmount = demand - boundAmount;
    
    // Update the remaining room for the next (weaker) compound
    remainingCapacity = Math.max(0, remainingCapacity - boundAmount);
    
    totalBound += boundAmount;
    totalSpillover += spillAmount;

    if (spillAmount > 0 && boundAmount < potentialBound) {
       // It was displaced by capacity, not just its own incompetence
       if (remainingCapacity === 0) displacedCompounds.push(c.name);
    }

    return {
      ...c,
      boundMg: boundAmount,
      spillMg: spillAmount,
      isDisplaced: spillAmount > 0 && boundAmount < demand
    };
  });

  // 4. GENERATE WARNING
  let displacementWarning = null;
  if (displacedCompounds.length > 0 && remainingCapacity === 0) {
    // Find the "Bully" (Strongest binder that is fully bound)
    const bully = segments.find(s => s.boundMg === s.totalMg && s.bindingScore > 1.0); // > Test affinity
    // Find the "Victim" (Weakest binder that is displaced)
    const victim = segments.slice().reverse().find(s => s.isDisplaced);
    
    if (bully && victim && bully.name !== victim.name) {
      displacementWarning = `${bully.name} is displacing ${victim.name}`;
    } else if (victim) {
      displacementWarning = `${victim.name} is being displaced due to saturation`;
    }
  }

  return {
    segments,
    totalBound,
    totalSpillover,
    totalCapacity: geneticCapacity,
    isSaturated: remainingCapacity === 0,
    displacementWarning
  };
}
