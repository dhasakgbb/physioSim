import OptimizerWorker from './optimizer.worker.js?worker';

let worker;
const pending = new Map();

const getWorker = () => {
  if (!worker) {
    worker = new OptimizerWorker();
    worker.onmessage = (e) => {
      const { type, id, payload, error } = e.data;
      if (pending.has(id)) {
        const { resolve, reject } = pending.get(id);
        pending.delete(id);
        if (type === 'SUCCESS') resolve(payload);
        else reject(new Error(error));
      }
    };
  }
  return worker;
};

const runWorkerTask = (type, payload) => {
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).substr(2, 9);
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ type, id, payload });
  });
};

/**
 * Findlay the mathematical "Sweet Spot" for the current stack.
 * Strategy: Gradient Ascent / Coarse Grid Search
 * Maximizes Net Score (ROI).
 * (Async via Web Worker)
 */
export const findPeakEfficiency = (stack, profile) => {
  return runWorkerTask('PEAK_EFFICIENCY', { stack, profile });
};

/**
 * THE MULTI-VARIABLE SOLVER
 * Optimizes the dosages of the *currently selected compounds* to maximize outcomes.
 * Uses a "Coarse-to-Fine" grid search to handle combinatorial complexity efficiently.
 * (Async via Web Worker)
 */
export const findOptimalConfiguration = (stack, profile, mode = 'safe') => {
  return runWorkerTask('OPTIMAL_CONFIG', { stack, profile, mode });
};

// Legacy wrappers for backward compatibility if needed, 
// but we will update the UI to use findOptimalConfiguration directly.
export const findMaxSafePower = (s, p) => findOptimalConfiguration(s, p, 'safe');
export const findAbsoluteMaxPower = (s, p) => findOptimalConfiguration(s, p, 'extreme');


