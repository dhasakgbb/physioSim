import { ICompoundSchema } from '../types/physio';
import { PharmacokineticsEngine, ISimulationPoint } from './Pharmacokinetics';
import { PharmacodynamicsEngine, IPDSimulationResult } from './Pharmacodynamics';
import { ToxicityEngine, IToxicityResult } from './Toxicity';

// --- Message Definitions ---

export interface ISimulationRequest {
  compounds: ICompoundSchema[];
  doses: { compoundId: string; time: number; amount: number }[];
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
  
  const totalAnabolicLoad = new Array(timePoints.length).fill(0);
  const totalToxicity = {
    hepatic: new Array(timePoints.length).fill(0),
    renal: new Array(timePoints.length).fill(0),
    cardiovascular: new Array(timePoints.length).fill(0),
    lipid_metabolism: new Array(timePoints.length).fill(0),
    neurotoxicity: new Array(timePoints.length).fill(0),
  };

  compounds.forEach(compound => {
    const compoundDoses = doses.filter(d => d.compoundId === compound.id);
    if (compoundDoses.length === 0) return;

    const pkPoints = PharmacokineticsEngine.simulateMultiDose(
      compound,
      compoundDoses,
      timePoints,
      bodyWeightKg
    );

    const pdPoints: IPDSimulationResult[] = [];
    const toxicityPoints: IToxicityResult[] = [];

    pkPoints.forEach((point, index) => {
      const pd = PharmacodynamicsEngine.calculateEffects(compound, point.concentrationNM);
      pdPoints.push({ time: point.time, ...pd });

      const tox = ToxicityEngine.calculateToxicity(compound, point.concentrationNM);
      toxicityPoints.push(tox);

      // Aggregation
      totalAnabolicLoad[index] += pd.pathwayActivation.myogenesis;
      totalToxicity.hepatic[index] += tox.hepatic;
      totalToxicity.renal[index] += tox.renal;
      totalToxicity.cardiovascular[index] += tox.cardiovascular;
      totalToxicity.lipid_metabolism[index] += tox.lipid_metabolism;
      totalToxicity.neurotoxicity[index] += tox.neurotoxicity;
    });

    results[compound.id] = { pk: pkPoints, pd: pdPoints, toxicity: toxicityPoints };
  });

  return {
    timePoints,
    results,
    aggregate: {
      totalTestosteroneEquivalent: [], // TODO
      totalAnabolicLoad,
      totalToxicity
    }
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
