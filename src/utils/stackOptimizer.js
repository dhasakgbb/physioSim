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

/**
 * GENETIC ALGORITHM OPTIMIZATION
 * Evolves populations of stacks to find optimal configurations.
 * Can optimize both compound selection and dosages.
 * (Async via Web Worker)
 */
export const findGeneticAlgorithmSolution = (availableCompounds, profile, options = {}) => {
  return runWorkerTask('GENETIC_ALGORITHM', {
    availableCompounds,
    profile,
    options: {
      populationSize: 50,
      generations: 100,
      ...options
    }
  });
};

/**
 * MULTI-OBJECTIVE OPTIMIZATION (NSGA-II)
 * Finds Pareto-optimal solutions balancing muscle gain vs side effects.
 * Returns multiple solutions representing different trade-offs.
 * (Async via Web Worker)
 */
export const findMultiObjectiveSolutions = (availableCompounds, profile, options = {}) => {
  return runWorkerTask('MULTI_OBJECTIVE', {
    availableCompounds,
    profile,
    options: {
      populationSize: 100,
      generations: 150,
      ...options
    }
  });
};

/**
 * ADVANCED STACK OPTIMIZATION
 * Combines genetic algorithm with multi-objective optimization
 * for comprehensive protocol design.
 */
export const findAdvancedOptimization = async (availableCompounds, profile, goals) => {
  const { primaryGoal, constraints } = goals;

  if (primaryGoal === 'balanced') {
    // Use multi-objective optimization for balanced approach
    return await findMultiObjectiveSolutions(availableCompounds, profile, {
      populationSize: constraints?.populationSize || 100,
      generations: constraints?.generations || 150
    });
  } else if (primaryGoal === 'maximum_gain') {
    // Use genetic algorithm focused on muscle gain
    return await findGeneticAlgorithmSolution(availableCompounds, profile, {
      populationSize: constraints?.populationSize || 75,
      generations: constraints?.generations || 120,
      fitnessWeights: { muscleGain: 0.8, sideEffects: -0.2 }
    });
  } else if (primaryGoal === 'minimum_risk') {
    // Use genetic algorithm focused on minimizing side effects
    return await findGeneticAlgorithmSolution(availableCompounds, profile, {
      populationSize: constraints?.populationSize || 75,
      generations: constraints?.generations || 120,
      fitnessWeights: { muscleGain: 0.3, sideEffects: -0.7 }
    });
  }

  // Default to multi-objective for general optimization
  return await findMultiObjectiveSolutions(availableCompounds, profile);
};

// Legacy wrappers for backward compatibility if needed, 
// but we will update the UI to use findOptimalConfiguration directly.
export const findMaxSafePower = (s, p) => findOptimalConfiguration(s, p, 'safe');
export const findAbsoluteMaxPower = (s, p) => findOptimalConfiguration(s, p, 'extreme');


