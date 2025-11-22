import {
  ISimulationRequest,
  ISimulationResponse,
  ISweepRequest,
  ISweepResponse,
  IOptimizationRequest,
  IOptimizationResponse,
  WorkerMessage,
  WorkerResponse
} from './simulation.worker';

export class SimulationService {
  private worker: Worker;
  private pendingRequests: Map<string, { resolve: (data: any) => void; reject: (err: any) => void }>;

  constructor() {
    this.pendingRequests = new Map();
    this.worker = new Worker(new URL('./simulation.worker.ts', import.meta.url), {
      type: 'module',
    });

    this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { id, type } = e.data;
      const pending = this.pendingRequests.get(id);
      
      if (pending) {
        if (type === 'ERROR') {
          pending.reject(new Error((e.data as any).error));
        } else {
          pending.resolve(e.data.payload);
        }
        this.pendingRequests.delete(id);
      }
    };

    this.worker.onerror = (error) => {
      console.error('Worker error:', error);
    };
  }

  private send<T>(type: WorkerMessage['type'], payload: any): Promise<T> {
    const id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.worker.postMessage({ type, payload, id });
    });
  }

  public async runSimulation(request: ISimulationRequest): Promise<ISimulationResponse> {
    return this.send<ISimulationResponse>('SIMULATE', request);
  }

  /**
   * Helper to convert a high-level stack definition into a raw simulation request with scheduled doses.
   */
  public async runStackSimulation(
    stack: { compoundId: string; dose: number; frequency: number; ester?: string }[],
    compounds: any[], // ICompoundSchema[]
    durationDays: number,
    bodyWeightKg: number = 85
  ): Promise<ISimulationResponse> {
    const doses: { compoundId: string; time: number; amount: number; esterId?: string }[] = [];
    const timePoints = Array.from({ length: durationDays * 24 }, (_, i) => i); // Hourly points

    stack.forEach(item => {
      const compound = compounds.find(c => c.id === item.compoundId);
      if (!compound || !item.dose) return;

      // Frequency: 1 = daily, 3.5 = E3.5D, 7 = weekly
      // If frequency is 0 or undefined, assume single dose? No, assume daily if not specified or handle logic.
      // In UI: 1=Daily, 2=EOD, 3.5=2x/wk, 7=Weekly.
      // Wait, the UI values are: 1 (Daily), 1.5 (???), 2 (EOD), 3.5 (2x/wk), 7 (Weekly).
      // Let's standardize: frequency = days between doses.
      // UI "Frequency" select values:
      // 1 -> Daily (interval 1)
      // 2 -> EOD (interval 2)
      // 3.5 -> 2x/wk (interval 3.5)
      // 7 -> Weekly (interval 7)
      
      const interval = item.frequency || 1; 
      
      for (let t = 0; t < durationDays * 24; t += interval * 24) {
        doses.push({
          compoundId: item.compoundId,
          time: t,
          amount: item.dose,
          esterId: item.ester
        });
      }
    });

    const request: ISimulationRequest = {
      compounds,
      doses,
      timePoints,
      bodyWeightKg
    };

    return this.runSimulation(request);
  }

  public async runSweep(request: ISweepRequest): Promise<ISweepResponse> {
    return this.send<ISweepResponse>('SWEEP', request);
  }

  public async runOptimization(request: IOptimizationRequest): Promise<IOptimizationResponse> {
    return this.send<IOptimizationResponse>('OPTIMIZE', request);
  }

  public terminate() {
    this.worker.terminate();
  }
}

export const simulationService = new SimulationService();
