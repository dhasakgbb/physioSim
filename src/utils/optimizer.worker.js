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

// Message Handler
self.onmessage = (e) => {
  const { type, payload, id } = e.data;
  
  try {
    let result;
    if (type === 'PEAK_EFFICIENCY') {
      result = findPeakEfficiency(payload.stack, payload.profile);
    } else if (type === 'OPTIMAL_CONFIG') {
      result = findOptimalConfiguration(payload.stack, payload.profile, payload.mode);
    }
    
    self.postMessage({ type: 'SUCCESS', id, payload: result });
  } catch (error) {
    self.postMessage({ type: 'ERROR', id, error: error.message });
  }
};
