import { create } from 'zustand';
import { ICompoundSchema } from '../types/physio';
import { ISimulationResponse } from '../engine/simulation.worker';
import { simulationService } from '../engine/SimulationService';
import { COMPOUNDS } from '../data/compounds';

interface IStackItem {
  id: string;
  compoundId: string;
  dose: number; // mg
  frequency: number; // days (e.g. every 3.5 days)
  esterId: string;
}

interface ISimulationState {
  // State
  stack: IStackItem[];
  compounds: Record<string, ICompoundSchema>;
  simulationResults: ISimulationResponse | null;
  isSimulating: boolean;
  error: string | null;

  // Actions
  addToStack: (compoundId: string) => void;
  removeFromStack: (itemId: string) => void;
  updateStackItem: (itemId: string, updates: Partial<IStackItem>) => void;
  runSimulation: () => Promise<void>;
}

export const useSimulationStore = create<ISimulationState>((set, get) => ({
  stack: [],
  compounds: COMPOUNDS,
  simulationResults: null,
  isSimulating: false,
  error: null,

  addToStack: (compoundId) => {
    const compound = get().compounds[compoundId];
    if (!compound) return;

    // Default ester logic
    const defaultEsterId = Object.keys(compound.pk.esters || {})[0] || 'none';

    const newItem: IStackItem = {
      id: crypto.randomUUID(),
      compoundId,
      dose: 100, // Default dose
      frequency: 7, // Default frequency
      esterId: defaultEsterId
    };

    set((state) => ({ stack: [...state.stack, newItem] }));
    get().runSimulation();
  },

  removeFromStack: (itemId) => {
    set((state) => ({ stack: state.stack.filter(item => item.id !== itemId) }));
    get().runSimulation();
  },

  updateStackItem: (itemId, updates) => {
    set((state) => ({
      stack: state.stack.map(item => item.id === itemId ? { ...item, ...updates } : item)
    }));
    get().runSimulation();
  },

  runSimulation: async () => {
    const { stack, compounds } = get();
    if (stack.length === 0) {
      set({ simulationResults: null });
      return;
    }

    set({ isSimulating: true, error: null });

    try {
      // Prepare request
      const activeCompounds = stack.map(item => compounds[item.compoundId]).filter(Boolean);
      
      // Generate doses (Simple daily dosing for now, can be expanded)
      const doses = stack.flatMap(item => {
        // Create a dose every 'frequency' days for 12 weeks
        const doseList = [];
        const freq = item.frequency || 3.5; // days
        const duration = 12 * 7; // 84 days
        for (let t = 0; t < duration; t += freq) {
          // Calculate dose per administration
          // If frequency is 1 (daily), amount = dose / 7
          // If frequency is 3.5 (E3.5D), amount = dose / 2
          // If frequency is 7 (weekly), amount = dose / 1
          // Formula: dose * (frequency / 7)
          const amountPerPin = item.dose * (freq / 7);
          
          doseList.push({
            compoundId: item.compoundId,
            time: t * 24, // hours
            amount: amountPerPin,
            esterId: item.esterId
          });
        }
        return doseList;
      });

      const timePoints = Array.from({ length: 84 * 4 }, (_, i) => i * 6); // 6-hour points

      const results = await simulationService.runSimulation({
        compounds: activeCompounds,
        doses,
        timePoints,
        bodyWeightKg: 85 // Default
      });

      set({ simulationResults: results, isSimulating: false });
    } catch (err: any) {
      console.error("Simulation failed", err);
      set({ error: err.message, isSimulating: false });
    }
  },

  runSweep: async () => {
    const { stack, compounds } = get();
    // Basic implementation - UI will call service directly for now if it needs custom parameters
    // Or we can store sweep results in the store too.
    // For now, let's keep the store focused on the main simulation.
    // The NetEffectChart might want to manage its own async state for sweeps to avoid global flicker.
  },

  runOptimization: async () => {
    // Optimization logic here
    // This will likely involve calling a different service or a different endpoint
    // of the simulation service with optimization parameters.
    // For now, it's a placeholder.
  }
}));
