import { evaluateStack } from './stackEngine';
import { compoundData } from '../data/compoundData';

/**
 * Findlay the mathematical "Sweet Spot" for the current stack.
 * Strategy: Gradient Ascent / Coarse Grid Search
 * Maximizes Net Score (ROI).
 */
const findPeakEfficiency = (currentStack, userProfile) => {
  let bestStack = JSON.parse(JSON.stringify(currentStack));
  let currentResult = evaluateStack({ stackInput: currentStack, profile: userProfile });
  let bestScore = currentResult.totals.netScore;

  let improved = true;
  let passes = 0;
  const MAX_PASSES = 5;

  while (improved && passes < MAX_PASSES) {
    improved = false;
    passes++;

    currentStack.forEach((item, index) => {
      const meta = compoundData[item.compound];
      if (!meta) return;

      const minDose = meta.type === 'oral' ? 10 : 100;
      const maxDose = meta.type === 'oral' ? 100 : 1200;
      const step = meta.type === 'oral' ? 10 : 50;

      for (let dose = minDose; dose <= maxDose; dose += step) {
        const tempStack = JSON.parse(JSON.stringify(bestStack));
        tempStack[index].dose = dose;
        
        const res = evaluateStack({ stackInput: tempStack, profile: userProfile });
        
        if (res.totals.netScore > bestScore) {
          bestScore = res.totals.netScore;
          bestStack[index].dose = dose;
          improved = true;
        }
      }
    });
  }

  return {
    optimizedStack: bestStack,
    originalScore: currentResult.totals.netScore,
    newScore: bestScore,
    improvement: bestScore - currentResult.totals.netScore,
    isDifferent: bestScore > currentResult.totals.netScore
  };
};

/**
 * THE MULTI-VARIABLE SOLVER
 * Optimizes the dosages of the *currently selected compounds* to maximize outcomes.
 * Uses a "Coarse-to-Fine" grid search to handle combinatorial complexity efficiently.
 */
const findOptimalConfiguration = (currentStack, userProfile, mode = 'safe') => {
  // Mode: 'safe' (Max Benefit where Net Score > 0.1)
  // Mode: 'extreme' (Max Benefit Period, ignore Safety)

  let bestStack = JSON.parse(JSON.stringify(currentStack));
  let maxBenefit = 0;
  let bestNetScore = -Infinity;
  let bestRisk = 0;

  // 1. Define Search Ranges for Each Compound
  const searchSpace = currentStack.map(item => {
    const meta = compoundData[item.compound];
    const isOral = meta.type === 'oral';
    
    // Dynamic Limits based on Mode
    let min = isOral ? 10 : 100;
    let max = isOral ? 100 : 1200;
    let coarseStep = isOral ? 20 : 200;
    let fineStep = isOral ? 5 : 25;

    if (mode === 'extreme') {
      max = isOral ? 200 : 5000; // Higher limits for Redline
      coarseStep = isOral ? 25 : 500; // Coarser steps to cover the huge range
      fineStep = isOral ? 5 : 50;
    }

    return {
      id: item.compound,
      min,
      max,
      coarseStep,
      fineStep
    };
  });

  // -------------------------------------------------------
  // PHASE 1: COARSE GRID SEARCH (The Wide Net)
  // -------------------------------------------------------
  
  const generateCombinations = (index, currentConfig) => {
    if (index === searchSpace.length) {
      return [currentConfig];
    }
    
    const params = searchSpace[index];
    const configs = [];
    
    for (let dose = params.min; dose <= params.max; dose += params.coarseStep) {
      const nextConfigs = generateCombinations(index + 1, [...currentConfig, dose]);
      configs.push(...nextConfigs);
    }
    return configs;
  };

  // Generate all coarse permutations
  const coarsePermutations = generateCombinations(0, []);
  
  // Find the "Winner" of the coarse pass
  let bestCoarseConfig = null;
  
  coarsePermutations.forEach(doses => {
    const tempStack = currentStack.map((item, i) => ({ ...item, dose: doses[i] }));
    const res = evaluateStack({ stackInput: tempStack, profile: userProfile });
    
    const benefit = res.totals.totalBenefit;
    const net = res.totals.netScore;
    
    let isBetter = false;
    
    if (mode === 'safe') {
       // Must be positive Net Score, then maximize Benefit
       if (net > 0.1) {
         if (benefit > maxBenefit) isBetter = true;
       }
    } else {
       // Extreme Mode: Maximize Benefit
       if (benefit > maxBenefit) isBetter = true;
    }

    if (isBetter) {
      maxBenefit = benefit;
      bestNetScore = net;
      bestRisk = res.totals.totalRisk;
      bestCoarseConfig = doses;
    }
  });

  // If no safe configuration found in coarse pass (and we are in safe mode), 
  // we might need to fallback or try the current stack.
  if (!bestCoarseConfig) {
    // Fallback: If 'safe' mode failed to find anything, return current (or maybe try to optimize down?)
    // For now, let's assume the user's current stack is the baseline.
    return { 
      optimizedStack: currentStack, 
      originalBenefit: evaluateStack({ stackInput: currentStack, profile: userProfile }).totals.totalBenefit,
      newBenefit: evaluateStack({ stackInput: currentStack, profile: userProfile }).totals.totalBenefit,
      isDifferent: false,
      warning: mode === 'safe' ? 'No safe configuration found within limits.' : undefined
    };
  }


  // -------------------------------------------------------
  // PHASE 2: FINE TUNING (The Microscope)
  // -------------------------------------------------------
  // Hill Climb around the coarse winner
  
  let improving = true;
  let loops = 0;
  
  // Load the coarse winner into our "Best" slot
  bestStack = currentStack.map((item, i) => ({ ...item, dose: bestCoarseConfig[i] }));

  while (improving && loops < 50) {
    improving = false;
    loops++;

    bestStack.forEach((item, i) => {
      const params = searchSpace[i];
      const currentDose = item.dose;
      
      // Test Up and Down
      const steps = [currentDose - params.fineStep, currentDose + params.fineStep];
      
      steps.forEach(testDose => {
        if (testDose < params.min || testDose > params.max) return;

        const testStack = JSON.parse(JSON.stringify(bestStack));
        testStack[i].dose = testDose;
        
        const res = evaluateStack({ stackInput: testStack, profile: userProfile });
        const benefit = res.totals.totalBenefit;
        const net = res.totals.netScore;

        let isBetter = false;
        if (mode === 'safe') {
           if (net > 0.1 && benefit > maxBenefit) isBetter = true;
           // Recovery: If we are currently unsafe (due to coarse grid granularity), prefer safer
           if (bestNetScore <= 0.1 && net > bestNetScore) isBetter = true; 
        } else {
           if (benefit > maxBenefit) isBetter = true;
        }

        if (isBetter) {
          bestStack[i].dose = testDose;
          maxBenefit = benefit;
          bestNetScore = net;
          bestRisk = res.totals.totalRisk;
          improving = true;
        }
      });
    });
  }

  // Result
  const originalRes = evaluateStack({ stackInput: currentStack, profile: userProfile });
  
  return {
    optimizedStack: bestStack,
    originalBenefit: originalRes.totals.totalBenefit,
    newBenefit: maxBenefit,
    riskScore: bestRisk,
    mode: mode === 'safe' ? 'max_safe' : 'absolute_max', // Map back to UI expected strings
    isDifferent: maxBenefit > originalRes.totals.totalBenefit,
    warning: mode === 'extreme' && bestRisk > 20 ? 'Extreme Toxicity Warning' : undefined
  };
};

// ============================================================================
// GENETIC ALGORITHM OPTIMIZATION
// ============================================================================

/**
 * Genetic Algorithm for Stack Optimization
 * Evolves populations of stacks to find optimal configurations
 */
const geneticAlgorithmOptimization = (availableCompounds, userProfile, options = {}) => {
  const {
    populationSize = 50,
    generations = 100,
    tournamentSize = 5,
    crossoverRate = 0.8,
    mutationRate = 0.1,
    elitismRate = 0.1
  } = options;

  // Initialize population
  let population = initializePopulation(availableCompounds, populationSize, userProfile);

  for (let gen = 0; gen < generations; gen++) {
    // Evaluate fitness
    const evaluatedPopulation = population.map(stack => ({
      stack,
      fitness: evaluateStackFitness(stack, userProfile)
    }));

    // Sort by fitness (descending)
    evaluatedPopulation.sort((a, b) => b.fitness.total - a.fitness.total);

    // Elitism - keep best individuals
    const eliteCount = Math.floor(populationSize * elitismRate);
    const newPopulation = evaluatedPopulation.slice(0, eliteCount).map(item => item.stack);

    // Generate rest of population through selection, crossover, mutation
    while (newPopulation.length < populationSize) {
      // Tournament selection
      const parent1 = tournamentSelection(evaluatedPopulation, tournamentSize);
      const parent2 = tournamentSelection(evaluatedPopulation, tournamentSize);

      // Crossover
      let offspring = parent1.stack;
      if (Math.random() < crossoverRate) {
        offspring = crossover(parent1.stack, parent2.stack);
      }

      // Mutation
      if (Math.random() < mutationRate) {
        offspring = mutate(offspring, availableCompounds);
      }

      newPopulation.push(offspring);
    }

    population = newPopulation;
  }

  // Return best solution
  const bestSolution = population.map(stack => ({
    stack,
    fitness: evaluateStackFitness(stack, userProfile)
  })).sort((a, b) => b.fitness.total - a.fitness.total)[0];

  return {
    optimizedStack: bestSolution.stack,
    fitness: bestSolution.fitness,
    algorithm: 'genetic_algorithm',
    generations: generations,
    populationSize: populationSize
  };
};

/**
 * Multi-Objective Genetic Algorithm (NSGA-II)
 * Optimizes for multiple conflicting objectives: muscle gain vs side effects
 */
const multiObjectiveOptimization = (availableCompounds, userProfile, options = {}) => {
  const {
    populationSize = 100,
    generations = 150,
    tournamentSize = 5,
    crossoverRate = 0.9,
    mutationRate = 0.05
  } = options;

  let population = initializePopulation(availableCompounds, populationSize, userProfile);

  for (let gen = 0; gen < generations; gen++) {
    // Evaluate objectives for all individuals
    const evaluatedPopulation = population.map(stack => ({
      stack,
      objectives: evaluateMultiObjectives(stack, userProfile)
    }));

    // Fast non-dominated sorting
    const fronts = fastNonDominatedSort(evaluatedPopulation);

    // Calculate crowding distance for each front
    fronts.forEach(front => {
      calculateCrowdingDistance(front);
    });

    // Select parents using tournament selection with crowding comparison
    const newPopulation = [];
    const combinedPopulation = [...fronts.flat()];

    while (newPopulation.length < populationSize) {
      const parent1 = crowdingTournamentSelection(combinedPopulation, tournamentSize);
      const parent2 = crowdingTournamentSelection(combinedPopulation, tournamentSize);

      // Crossover and mutation
      let offspring = parent1.stack;
      if (Math.random() < crossoverRate) {
        offspring = crossover(parent1.stack, parent2.stack);
      }

      if (Math.random() < mutationRate) {
        offspring = mutate(offspring, availableCompounds);
      }

      newPopulation.push(offspring);
    }

    population = newPopulation;
  }

  // Return Pareto front (non-dominated solutions)
  const finalPopulation = population.map(stack => ({
    stack,
    objectives: evaluateMultiObjectives(stack, userProfile)
  }));

  const paretoFront = fastNonDominatedSort(finalPopulation)[0] || [];

  return {
    paretoFront: paretoFront.map(item => ({
      stack: item.stack,
      objectives: item.objectives,
      fitness: item.objectives.muscleGain - item.objectives.sideEffects // Simple combined score
    })),
    algorithm: 'nsga2_multi_objective',
    generations: generations,
    populationSize: populationSize
  };
};

// ============================================================================
// GENETIC ALGORITHM UTILITIES
// ============================================================================

const initializePopulation = (availableCompounds, size, userProfile) => {
  const population = [];

  for (let i = 0; i < size; i++) {
    const stack = [];
    // Randomly select 2-5 compounds
    const numCompounds = Math.floor(Math.random() * 4) + 2;
    const selectedCompounds = shuffle([...availableCompounds]).slice(0, numCompounds);

    selectedCompounds.forEach(compound => {
      const meta = compoundData[compound];
      const isOral = meta.type === 'oral';
      const minDose = isOral ? 10 : 100;
      const maxDose = isOral ? 100 : 800;

      stack.push({
        compound,
        dose: Math.floor(Math.random() * (maxDose - minDose)) + minDose,
        ester: meta.defaultEster || 'enanthate',
        frequency: 3.5 // Default frequency
      });
    });

    population.push(stack);
  }

  return population;
};

const evaluateStackFitness = (stack, userProfile) => {
  const result = evaluateStack({ stackInput: stack, profile: userProfile });
  return {
    total: result.totals.netScore,
    benefit: result.totals.totalBenefit,
    risk: result.totals.totalRisk,
    muscleGain: result.totals.totalBenefit,
    sideEffects: result.totals.totalRisk
  };
};

const evaluateMultiObjectives = (stack, userProfile) => {
  const result = evaluateStack({ stackInput: stack, profile: userProfile });
  return {
    muscleGain: result.totals.totalBenefit,
    sideEffects: result.totals.totalRisk,
    netScore: result.totals.netScore,
    efficiency: result.totals.netScore > 0 ? result.totals.totalBenefit / result.totals.totalRisk : 0
  };
};

const tournamentSelection = (population, tournamentSize) => {
  const tournament = [];
  for (let i = 0; i < tournamentSize; i++) {
    tournament.push(population[Math.floor(Math.random() * population.length)]);
  }
  return tournament.reduce((best, current) =>
    current.fitness.total > best.fitness.total ? current : best
  );
};

const crossover = (parent1, parent2) => {
  const child = [];
  const maxLength = Math.max(parent1.length, parent2.length);

  for (let i = 0; i < maxLength; i++) {
    if (i < parent1.length && i < parent2.length) {
      // Blend doses from both parents
      const dose1 = parent1[i].dose;
      const dose2 = parent2[i].dose;
      const blendedDose = Math.round((dose1 + dose2) / 2);

      child.push({
        ...parent1[i],
        dose: Math.max(10, Math.min(1000, blendedDose)) // Clamp to reasonable range
      });
    } else if (i < parent1.length) {
      child.push({ ...parent1[i] });
    } else if (i < parent2.length) {
      child.push({ ...parent2[i] });
    }
  }

  return child;
};

const mutate = (stack, availableCompounds) => {
  const mutatedStack = JSON.parse(JSON.stringify(stack));

  // Randomly mutate one compound's dose
  if (mutatedStack.length > 0) {
    const randomIndex = Math.floor(Math.random() * mutatedStack.length);
    const item = mutatedStack[randomIndex];
    const meta = compoundData[item.compound];
    const isOral = meta.type === 'oral';

    // Gaussian mutation
    const mutationStrength = isOral ? 20 : 100;
    const newDose = item.dose + (Math.random() - 0.5) * mutationStrength * 2;

    // Clamp to valid range
    const minDose = isOral ? 10 : 50;
    const maxDose = isOral ? 150 : 1200;
    item.dose = Math.max(minDose, Math.min(maxDose, Math.round(newDose)));
  }

  return mutatedStack;
};

// ============================================================================
// MULTI-OBJECTIVE OPTIMIZATION UTILITIES (NSGA-II)
// ============================================================================

const fastNonDominatedSort = (population) => {
  const fronts = [[]];
  const dominationCount = new Array(population.length).fill(0);
  const dominatedSolutions = population.map(() => []);

  // Calculate domination relationships
  for (let i = 0; i < population.length; i++) {
    for (let j = 0; j < population.length; j++) {
      if (i === j) continue;

      const obj1 = population[i].objectives;
      const obj2 = population[j].objectives;

      // Check if solution i dominates solution j
      const iDominatesJ = (obj1.muscleGain >= obj2.muscleGain && obj1.sideEffects <= obj2.sideEffects) &&
                         (obj1.muscleGain > obj2.muscleGain || obj1.sideEffects < obj2.sideEffects);

      // Check if solution j dominates solution i
      const jDominatesI = (obj2.muscleGain >= obj1.muscleGain && obj2.sideEffects <= obj1.sideEffects) &&
                         (obj2.muscleGain > obj1.muscleGain || obj2.sideEffects < obj1.sideEffects);

      if (iDominatesJ) {
        dominatedSolutions[i].push(j);
      } else if (jDominatesI) {
        dominationCount[i]++;
      }
    }

    if (dominationCount[i] === 0) {
      population[i].rank = 0;
      fronts[0].push(population[i]);
    }
  }

  // Generate subsequent fronts
  let currentFront = 0;
  while (fronts[currentFront].length > 0) {
    const nextFront = [];

    for (const solution of fronts[currentFront]) {
      const solutionIndex = population.indexOf(solution);

      for (const dominatedIndex of dominatedSolutions[solutionIndex]) {
        dominationCount[dominatedIndex]--;
        if (dominationCount[dominatedIndex] === 0) {
          population[dominatedIndex].rank = currentFront + 1;
          nextFront.push(population[dominatedIndex]);
        }
      }
    }

    currentFront++;
    if (nextFront.length > 0) {
      fronts.push(nextFront);
    }
  }

  return fronts;
};

const calculateCrowdingDistance = (front) => {
  if (front.length === 0) return;

  // Initialize crowding distance
  front.forEach(solution => {
    solution.crowdingDistance = 0;
  });

  // Sort by each objective and calculate crowding distance
  const objectives = ['muscleGain', 'sideEffects'];

  objectives.forEach(obj => {
    // Sort front by objective
    front.sort((a, b) => a.objectives[obj] - b.objectives[obj]);

    // Set boundary solutions
    front[0].crowdingDistance = Infinity;
    front[front.length - 1].crowdingDistance = Infinity;

    // Calculate crowding distance for intermediate solutions
    if (front.length > 2) {
      const objRange = front[front.length - 1].objectives[obj] - front[0].objectives[obj];

      for (let i = 1; i < front.length - 1; i++) {
        const distance = (front[i + 1].objectives[obj] - front[i - 1].objectives[obj]) / objRange;
        front[i].crowdingDistance += distance;
      }
    }
  });
};

const crowdingTournamentSelection = (population, tournamentSize) => {
  const tournament = [];
  for (let i = 0; i < tournamentSize; i++) {
    tournament.push(population[Math.floor(Math.random() * population.length)]);
  }

  // Select winner based on rank and crowding distance
  return tournament.reduce((winner, candidate) => {
    if (candidate.rank < winner.rank) return candidate;
    if (candidate.rank > winner.rank) return winner;
    if (candidate.crowdingDistance > winner.crowdingDistance) return candidate;
    return winner;
  });
};

const shuffle = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ============================================================================
// MESSAGE HANDLER (UPDATED)
// ============================================================================

// Message Handler
self.onmessage = (e) => {
  const { type, payload, id } = e.data;

  try {
    let result;
    if (type === 'PEAK_EFFICIENCY') {
      result = findPeakEfficiency(payload.stack, payload.profile);
    } else if (type === 'OPTIMAL_CONFIG') {
      result = findOptimalConfiguration(payload.stack, payload.profile, payload.mode);
    } else if (type === 'GENETIC_ALGORITHM') {
      result = geneticAlgorithmOptimization(payload.availableCompounds, payload.profile, payload.options);
    } else if (type === 'MULTI_OBJECTIVE') {
      result = multiObjectiveOptimization(payload.availableCompounds, payload.profile, payload.options);
    }

    self.postMessage({ type: 'SUCCESS', id, payload: result });
  } catch (error) {
    self.postMessage({ type: 'ERROR', id, error: error.message });
  }
};
