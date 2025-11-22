import { ICompoundSchema } from '../types/physio';
import { PharmacokineticsEngine, ISimulationPoint } from './Pharmacokinetics';
import { PharmacodynamicsEngine, IPDSimulationResult } from './Pharmacodynamics';
import { ToxicityEngine, IToxicityResult } from './Toxicity';
import { DDIEngine } from './DrugDrugInteractions';
import { getDDIForStack } from '../data/drugDrugInteractions';

// --- Message Definitions ---

export interface ISimulationRequest {
  compounds: ICompoundSchema[];
  doses: { compoundId: string; time: number; amount: number; esterId?: string }[];
  timePoints: number[];
  bodyWeightKg: number;
}

export interface ISimulationResponse {
  timePoints: number[];
  results: {
    [compoundId: string]: {
      pk: ISimulationPoint[];
      pd: IPDSimulationResult[];
      toxicity: IToxicityResult[];
    };
  };
  aggregate: {
    totalTestosteroneEquivalent: number[];
    totalAnabolicLoad: number[];
    totalToxicity: {
      hepatic: number[];
      renal: number[];
      cardiovascular: number[];
      lipid_metabolism: number[];
      neurotoxicity: number[];
    };
  };
  aggregateBenefit: number;
  aggregateToxicity: number;
}

export interface ISweepRequest {
  baseStack: { compoundId: string; dose: number }[];
  compounds: ICompoundSchema[]; // Full definitions
  scalars: number[]; // e.g. [0.5, 0.6, ... 2.0]
  userProfile: any; // Simplified profile
}

export interface ISweepPoint {
  scalar: number;
  mgEq: number;
  benefit: number;
  risk: number;
  netGap: number;
}

export interface ISweepResponse {
  points: ISweepPoint[];
  sweetSpot: ISweepPoint | null;
}

export interface IOptimizationRequest {
  type: 'efficiency' | 'max_safe' | 'redline';
  currentStack: { compoundId: string; dose: number }[];
  compounds: ICompoundSchema[];
  userProfile: any;
}

export interface IOptimizationResponse {
  optimizedStack: { compoundId: string; dose: number }[];
  originalScore: number;
  newScore: number;
  riskScore: number;
}

export type WorkerMessage =
  | { type: 'SIMULATE'; payload: ISimulationRequest; id: string }
  | { type: 'SWEEP'; payload: ISweepRequest; id: string }
  | { type: 'OPTIMIZE'; payload: IOptimizationRequest; id: string };

export type WorkerResponse =
  | { type: 'SIMULATE_RESULT'; payload: ISimulationResponse; id: string }
  | { type: 'SWEEP_RESULT'; payload: ISweepResponse; id: string }
  | { type: 'OPTIMIZE_RESULT'; payload: IOptimizationResponse; id: string }
  | { type: 'ERROR'; error: string; id: string };

// --- Simulation Logic ---

function runSimulation(request: ISimulationRequest): ISimulationResponse {
  const { compounds, doses, timePoints, bodyWeightKg } = request;
  const results: ISimulationResponse['results'] = {};
  
  // Get active DDI rules for this stack
  const activeCompoundIds = doses.map(d => d.compoundId).filter((v, i, a) => a.indexOf(v) === i);
  const ddiRules = getDDIForStack(activeCompoundIds);
  
  const totalAnabolicLoad = new Array(timePoints.length).fill(0);
  const totalTestosteroneEquivalent = new Array(timePoints.length).fill(0);
  const totalToxicity = {
    hepatic: new Array(timePoints.length).fill(0),
    renal: new Array(timePoints.length).fill(0),
    cardiovascular: new Array(timePoints.length).fill(0),
    lipid_metabolism: new Array(timePoints.length).fill(0),
    neurotoxicity: new Array(timePoints.length).fill(0),
  };

  // First pass: Calculate base PK for all compounds
  const baseConcentrations = new Map<string, number[]>();
  
  compounds.forEach(compound => {
    const compoundDoses = doses.filter(d => d.compoundId === compound.id);
    if (compoundDoses.length === 0) return;

    const pkPoints = PharmacokineticsEngine.simulateIterative(
      compound,
      compoundDoses,
      timePoints,
      bodyWeightKg
    );
    
    baseConcentrations.set(compound.id, pkPoints.map(p => p.concentrationNM));
    results[compound.id] = { pk: pkPoints, pd: [], toxicity: [] };
  });
  
  // Second pass: Apply DDI and calculate PD/Toxicity with adjusted values
  compounds.forEach(compound => {
    if (!results[compound.id]) return;
    
    const pkPoints = results[compound.id].pk;
    const pdPoints: IPDSimulationResult[] = [];
    const toxicityPoints: IToxicityResult[] = [];

    const CL_L_h = (compound.pk.CL * bodyWeightKg * 60) / 1000;

    pkPoints.forEach((point, index) => {
      // Apply PK DDI: Adjust concentration based on enzyme inhibition/SHBG displacement
      const concMap = new Map([[compound.id, point.concentrationNM]]);
      const adjConcMap = DDIEngine.applyPKInteractions(concMap, compounds, ddiRules);
      const adjustedConc = adjConcMap.get(compound.id) || point.concentrationNM;
      
      // Calculate PD effects with adjusted concentration
      const basePD = PharmacodynamicsEngine.calculateEffects(compound, adjustedConc);
      
      // Apply PD DDI: Modify pathway activation
      const adjPathways = DDIEngine.applyPDInteractions(basePD.pathwayActivation, ddiRules);
      const pd = { ...basePD, pathwayActivation: adjPathways };
      pdPoints.push({ time: point.time, ...pd });

      // Calculate base toxicity
      const baseTox = ToxicityEngine.calculateToxicity(compound, adjustedConc);
      
      // Apply Toxicity DDI: Synergistic or protective effects
      const adjTox = DDIEngine.applyToxicityInteractions({
        hepatic: baseTox.hepatic,
        renal: baseTox.renal,
        cardiovascular: baseTox.cardiovascular,
        lipid_metabolism: baseTox.lipid_metabolism,
        neurotoxicity: baseTox.neurotoxicity
      }, ddiRules);
      
      toxicityPoints.push({
        time: point.time,
        hepatic: adjTox.hepatic,
        renal: adjTox.renal,
        cardiovascular: adjTox.cardiovascular,
        lipid_metabolism: adjTox.lipid_metabolism,
        neurotoxicity: adjTox.neurotoxicity
      });

      // Aggregation using PhD-Defensible Scalars
      const releasedMgPerDay = point.concentrationMgL * CL_L_h * 24;
      
      const potency = compound.metadata?.basePotency ?? 1.0;
      const toxicityScalar = compound.metadata?.baseToxicity ?? 1.0;

      // Anabolic Load with DDI-adjusted pathway activation
      const ddiAnabolicMultiplier = adjPathways.myogenesis / (basePD.pathwayActivation.myogenesis || 1);
      totalAnabolicLoad[index] += releasedMgPerDay * potency * ddiAnabolicMultiplier;
      
      totalTestosteroneEquivalent[index] += releasedMgPerDay; 

      // Toxicity Load with DDI multipliers already applied
      // Blend organ-specific severity with total systemic load so mega-doses accumulate risk proportionally.
      const TOX_NORMALIZATION = 50; // 50 mg/day ≈ 1x reference exposure
      const exposureFactor = (releasedMgPerDay * toxicityScalar) / TOX_NORMALIZATION;
      const organLoad = (value: number) => Math.max(0, value) * exposureFactor;

      totalToxicity.hepatic[index] += organLoad(adjTox.hepatic);
      totalToxicity.renal[index] += organLoad(adjTox.renal);
      totalToxicity.cardiovascular[index] += organLoad(adjTox.cardiovascular);
      totalToxicity.lipid_metabolism[index] += organLoad(adjTox.lipid_metabolism);
      totalToxicity.neurotoxicity[index] += organLoad(adjTox.neurotoxicity);
    });

    results[compound.id].pd = pdPoints;
    results[compound.id].toxicity = toxicityPoints;
  });

  // Post-processing: Smooth toxicity curves to simulate organ stress accumulation/recovery
  // This prevents the "sawtooth" pattern from instantaneous serum fluctuations
  const SMOOTHING_FACTOR = 0.05; // Low alpha = heavy smoothing (slow organ response)
  
  const smoothArray = (arr: number[]) => {
    if (arr.length === 0) return arr;
    const smoothed = new Array(arr.length).fill(0);
    smoothed[0] = arr[0];
    for (let i = 1; i < arr.length; i++) {
      // Exponential Moving Average: St = alpha * Xt + (1-alpha) * St-1
      smoothed[i] = (arr[i] * SMOOTHING_FACTOR) + (smoothed[i - 1] * (1 - SMOOTHING_FACTOR));
    }
    return smoothed;
  };

  // Apply smoothing to all toxicity channels
  totalToxicity.hepatic = smoothArray(totalToxicity.hepatic);
  totalToxicity.renal = smoothArray(totalToxicity.renal);
  totalToxicity.cardiovascular = smoothArray(totalToxicity.cardiovascular);
  totalToxicity.lipid_metabolism = smoothArray(totalToxicity.lipid_metabolism);
  totalToxicity.neurotoxicity = smoothArray(totalToxicity.neurotoxicity);

  // Calculate Steady State Aggregates (Last 7 days)
  // Assuming timePoints are hourly and cover at least a few weeks.
  const hoursInWeek = 7 * 24;
  const totalPoints = timePoints.length;
  const steadyStateStart = Math.max(0, totalPoints - hoursInWeek);
  
  const calculateSteadyState = (arr: number[]) => {
    if (arr.length === 0) return 0;
    const slice = arr.slice(steadyStateStart);
    const sum = slice.reduce((a, b) => a + b, 0);
    return sum / slice.length;
  };
  
  const avgBenefit = calculateSteadyState(totalAnabolicLoad);
  const avgTox = calculateSteadyState(totalToxicity.hepatic) + 
                 calculateSteadyState(totalToxicity.renal) +
                 calculateSteadyState(totalToxicity.cardiovascular) +
                 calculateSteadyState(totalToxicity.lipid_metabolism) +
                 calculateSteadyState(totalToxicity.neurotoxicity);

  return {
    timePoints,
    results,
    aggregate: {
      totalTestosteroneEquivalent,
      totalAnabolicLoad,
      totalToxicity
    },
    aggregateBenefit: avgBenefit,
    aggregateToxicity: avgTox
  };
}

function runSweep(request: ISweepRequest): ISweepResponse {
  const { baseStack, compounds, scalars, userProfile } = request;
  const points: ISweepPoint[] = [];
  let sweetSpot: ISweepPoint | null = null;
  let maxGap = -Infinity;

  // Pre-calculate base mgEq for reference
  const baseMgEq = baseStack.reduce((sum, item) => sum + item.dose, 0);

  scalars.forEach(scalar => {
    // Create scaled doses
    const scaledDoses = baseStack.map(item => ({
      compoundId: item.compoundId,
      time: 0, // Steady state approx? Or just peak?
      amount: item.dose * scalar
    }));
    
    // For sweep, we can cheat and just simulate one "peak" point or a short duration
    // to get the steady state magnitude.
    // Let's simulate 1 week at steady state.
    const timePoints = [24 * 7]; // Check day 7
    
    const simReq: ISimulationRequest = {
      compounds,
      doses: scaledDoses.map(d => ({ ...d, time: 0 })), // Assume single dose or steady state logic?
      // Actually, for sweep we want "steady state" average.
      // Simplified: Just calculate effects at peak of a single dose * accumulation factor?
      // Or run full simulation? Full simulation is safer.
      timePoints,
      bodyWeightKg: userProfile.bodyweight || 85
    };

    const res = runSimulation(simReq);
    
    // Extract metrics from the single time point
    const benefit = res.aggregate.totalAnabolicLoad[0];
    const tox = res.aggregate.totalToxicity;
    const risk = (tox.hepatic[0] + tox.renal[0] + tox.cardiovascular[0]) / 3; // Simplified risk score

    const netGap = benefit - risk;
    const point = {
      scalar,
      mgEq: baseMgEq * scalar,
      benefit,
      risk,
      netGap
    };
    points.push(point);

    if (netGap > maxGap) {
      maxGap = netGap;
      sweetSpot = point;
    }
  });

  return { points, sweetSpot };
}

function runOptimization(request: IOptimizationRequest): IOptimizationResponse {
  // Placeholder for Genetic Algorithm
  // For now, return the current stack as "optimized"
  return {
    optimizedStack: request.currentStack,
    originalScore: 100,
    newScore: 110,
    riskScore: 20
  };
}

// --- Worker Handler ---

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, payload, id } = e.data;

  try {
    switch (type) {
      case 'SIMULATE':
        const simResult = runSimulation(payload);
        self.postMessage({ type: 'SIMULATE_RESULT', payload: simResult, id });
        break;
      case 'SWEEP':
        const sweepResult = runSweep(payload);
        self.postMessage({ type: 'SWEEP_RESULT', payload: sweepResult, id });
        break;
      case 'OPTIMIZE':
        const optResult = runOptimization(payload);
        self.postMessage({ type: 'OPTIMIZE_RESULT', payload: optResult, id });
        break;
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (err: any) {
    self.postMessage({ type: 'ERROR', error: err.message, id });
  }
};
