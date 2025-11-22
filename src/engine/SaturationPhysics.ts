// SaturationPhysics.ts
// Implements the Saturation & Spillover physics engine
// Based on Signal Flow Architecture: "What happens when the tank is full"

export interface ISaturationMetrics {
  // Core metrics
  activeDose: number;          // Total active dose (mg)
  receptorCapacity: number;    // Current receptor capacity (mg) - may upregulate
  saturation: number;          // Amount that fits (mg)
  spillover: number;           // Amount that overflows (mg)
  
  // Efficiency
  efficiencyPct: number;       // Efficiency % = (Capacity / TotalDose) * 100
  
  // Adaptation
  adaptationRate: number;      // Current upregulation rate (%/week)
  adaptationPhase: 1 | 2 | 3;  // Phase 1: Surge, Phase 2: Strain, Phase 3: Ceiling
  
  // Spillover routing
  spilloverToCNS: number;      // Immediate overflow to CNS
  spilloverToToxicity: number; // Accumulative overflow (multiplied by 1.5x)
  spilloverToRetention: number; // Anti-catabolic overflow (water/glycogen)
  
  // Status
  isSaturated: boolean;
  isHardCap: boolean;          // Phase 3: Nuclear bottleneck reached
}

/**
 * Calculates receptor saturation metrics using the "Viscous Damper" model.
 * Efficiency creates a "Knee Curve" drop-off when capacity is exceeded.
 * 
 * @param activeDose Total active dose (mg) adjusted by binding affinity
 * @param baseCapacity Baseline receptor capacity (mg)
 * @param weeksElapsed Weeks since cycle start (for adaptation calculation)
 * @returns Complete saturation metrics
 */
export function calculateSaturation(
  activeDose: number,
  baseCapacity: number = 100,
  weeksElapsed: number = 0
): ISaturationMetrics {
  // 1. EFFICIENCY EQUATION
  // Efficiency % = (ReceptorCapacity / TotalActiveDose) * 100
  // When ActiveDose > Capacity, efficiency crashes (Knee Curve)
  
  // 2. UPRECULATION CURVE (Logarithmic Resistance)
  // Phase 1: Surge - Saturation hits 100%. Body upregulates +5% per week
  // Phase 2: Strain - Saturation at 150%. Upregulation slows to +1.5% per week
  // Phase 3: Ceiling - Hard cap. Nuclear bottleneck reached
  
  let currentCapacity = baseCapacity;
  let adaptationRate = 0;
  let adaptationPhase: 1 | 2 | 3 = 1;
  
  // Calculate saturation percentage relative to base capacity
  const saturationPct = baseCapacity > 0 ? (activeDose / baseCapacity) * 100 : 0;
  
  if (activeDose > baseCapacity) {
    // Phase 1: The Surge (100% - 150% saturation)
    if (saturationPct >= 100 && saturationPct < 150) {
      adaptationPhase = 1;
      adaptationRate = weeksElapsed > 0 ? 5.0 : 0; // % per week, only if time elapsed
      // Upregulation: +5% per week, capped by time elapsed
      if (weeksElapsed > 0) {
        const maxUpregulation = Math.min(weeksElapsed * 5.0, 50); // Cap at 50% increase
        currentCapacity = baseCapacity * (1 + maxUpregulation / 100);
      }
    }
    // Phase 2: The Strain (150% - 200% saturation)
    else if (saturationPct >= 150 && saturationPct < 200) {
      adaptationPhase = 2;
      adaptationRate = weeksElapsed > 0 ? 1.5 : 0; // % per week (slowed)
      if (weeksElapsed > 0) {
        // Phase 1 already contributed up to 50%, now add Phase 2
        const phase1Weeks = Math.min(10, (150 - 100) / 5); // Weeks to reach 150%
        const phase2Weeks = Math.max(0, weeksElapsed - phase1Weeks);
        const phase2Upregulation = Math.min(phase2Weeks * 1.5, 20); // Additional 20% max
        currentCapacity = baseCapacity * (1.5 + phase2Upregulation / 100);
      }
    }
    // Phase 3: The Ceiling (200%+ saturation)
    else if (saturationPct >= 200) {
      adaptationPhase = 3;
      adaptationRate = 0.2; // Minimal adaptation (plateau)
      // Hard cap at ~70% total upregulation (nuclear bottleneck)
      currentCapacity = baseCapacity * 1.7;
    }
  }
  
  // Calculate saturation and spillover with current capacity
  const saturation = Math.min(activeDose, currentCapacity);
  const spillover = Math.max(0, activeDose - currentCapacity);
  
  // Efficiency calculation
  const efficiencyPct = activeDose > 0 
    ? Math.round((currentCapacity / activeDose) * 100)
    : 100;
  
  // Spillover routing
  const { cns, toxicity, retention } = routeSpillover(spillover);
  
  const isSaturated = activeDose > currentCapacity;
  const isHardCap = adaptationPhase === 3 && saturationPct >= 200;
  
  return {
    activeDose,
    receptorCapacity: currentCapacity,
    saturation,
    spillover,
    efficiencyPct,
    adaptationRate,
    adaptationPhase,
    spilloverToCNS: cns,
    spilloverToToxicity: toxicity,
    spilloverToRetention: retention,
    isSaturated,
    isHardCap,
  };
}

/**
 * Routes spillover to different pathways based on priority:
 * 1. CNS (Immediate) - Unbound hormone binds to membrane receptors
 * 2. Toxicity (Accumulative) - Liver processes unbound hormone (1.5x multiplier)
 * 3. Water/Glycogen (Anti-Catabolic) - Cortisol receptor binding
 * 
 * @param spilloverMg Amount of spillover in mg
 * @returns Routed spillover amounts
 */
function routeSpillover(spilloverMg: number): {
  cns: number;
  toxicity: number;
  retention: number;
} {
  if (spilloverMg <= 0) {
    return { cns: 0, toxicity: 0, retention: 0 };
  }
  
  // Priority 1: Overflow to CNS (Immediate) - 40% of spillover
  const cns = spilloverMg * 0.4;
  
  // Priority 2: Overflow to Toxicity (Accumulative) - 35% of spillover, then multiplied by 1.5x
  // Unbound drugs are more toxic than bound ones
  const toxicity = (spilloverMg * 0.35) * 1.5;
  
  // Priority 3: Overflow to Water/Glycogen (Anti-Catabolic) - 25% of spillover
  const retention = spilloverMg * 0.25;
  
  return { cns, toxicity, retention };
}

/**
 * Formats adaptation phase description for UI
 */
export function getAdaptationPhaseLabel(phase: 1 | 2 | 3): string {
  switch (phase) {
    case 1:
      return "THE SURGE";
    case 2:
      return "THE STRAIN";
    case 3:
      return "THE CEILING";
    default:
      return "BASELINE";
  }
}

/**
 * Gets status label based on saturation state
 */
export function getSaturationStatus(metrics: ISaturationMetrics): {
  status: string;
  color: string;
  bgColor: string;
} {
  if (metrics.isHardCap) {
    return {
      status: "SATURATED (HARD CAP)",
      color: "text-red-400",
      bgColor: "bg-red-500/10",
    };
  }
  
  if (metrics.isSaturated) {
    return {
      status: "SATURATION_SPILLOVER",
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/10",
    };
  }
  
  return {
    status: "GENOMIC_OPTIMAL",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  };
}
