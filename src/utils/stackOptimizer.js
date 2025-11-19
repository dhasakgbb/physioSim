import { evaluateStack } from './stackEngine';
import { compoundData } from '../data/compoundData';

/**
 * Findlay the mathematical "Sweet Spot" for the current stack.
 * Strategy: Gradient Ascent / Coarse Grid Search
 */
export const findPeakEfficiency = (currentStack, userProfile) => {
  // 1. Deep copy the stack to avoid mutation
  let bestStack = JSON.parse(JSON.stringify(currentStack));
  let currentResult = evaluateStack({ stackInput: currentStack, profile: userProfile });
  let bestScore = currentResult.totals.netScore;
  let bestRatio = currentResult.totals.brRatio;

  // 2. Optimization Loop
  // We iterate through each compound and test dosages +/- 50% to find the local maximum.
  // This is a simplified hill-climb.
  
  let improved = true;
  let passes = 0;
  const MAX_PASSES = 5; // Prevent infinite loops

  while (improved && passes < MAX_PASSES) {
    improved = false;
    passes++;

    currentStack.forEach((item, index) => {
      const meta = compoundData[item.compound];
      if (!meta) return;

      // Define search window (e.g., 50mg to 1000mg)
      const minDose = meta.type === 'oral' ? 10 : 100;
      const maxDose = meta.type === 'oral' ? 100 : 1200;
      const step = meta.type === 'oral' ? 10 : 50;

      // Sweep doses
      for (let dose = minDose; dose <= maxDose; dose += step) {
        const tempStack = JSON.parse(JSON.stringify(bestStack));
        tempStack[index].dose = dose;
        
        const res = evaluateStack({ stackInput: tempStack, profile: userProfile });
        
        // Criteria: Higher Net Score OR (Same Score with Lower Risk)
        if (res.totals.netScore > bestScore) {
          bestScore = res.totals.netScore;
          bestRatio = res.totals.brRatio;
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
 * "The Redline Solver"
 * Scales the current stack upwards until Risk equals Benefit (Net Score ~ 0).
 * This identifies the theoretical maximum capacity of the cycle.
 */
export const findMaxTolerableLimit = (currentStack, userProfile) => {
  // TWO-PASS GRID SEARCH STRATEGY
  // Pass 1: Coarse Global Search to find the "mountain"
  // Pass 2: Fine Local Search to find the "peak"
  
  const stackSize = currentStack.length;
  const MAX_ITERATIONS = 200000; // Increased cap
  let iterations = 0;

  // 1. Define Search Helper
  const getDimensions = (stack, center = null, range = null, fineStep = null) => {
    return stack.map((item, i) => {
      const meta = compoundData[item.compound];
      const isOral = meta?.type === 'oral';
      
      let min, max, step;

      if (center) {
        // Local Search (Fine Tuning)
        const currentDose = center[i].dose;
        const rangeVal = range || (isOral ? 50 : 400);
        step = fineStep || (isOral ? 5 : 25);
        
        // Ensure we stay within bounds
        min = Math.max(isOral ? 5 : 50, currentDose - rangeVal);
        max = Math.min(isOral ? 150 : 3000, currentDose + rangeVal);
      } else {
        // Global Search (Coarse)
        // Dynamic step sizing based on complexity
        let coarseStep = isOral ? 20 : 200;
        if (stackSize >= 3) coarseStep = isOral ? 25 : 250;
        if (stackSize >= 4) coarseStep = isOral ? 50 : 500;

        min = isOral ? 10 : 100;
        max = isOral ? 150 : 2500;
        step = coarseStep;
      }

      const steps = [];
      for (let d = min; d <= max; d += step) {
        steps.push(d);
      }
      return steps;
    });
  };

  let bestResult = null;
  let maxBenefit = -1;
  const initialEval = evaluateStack({ stackInput: currentStack, profile: userProfile });

  const runSearch = (dims) => {
    const searchRecursive = (depth, currentDoses) => {
      if (iterations >= MAX_ITERATIONS) return;

      if (depth === dims.length) {
        iterations++;
        
        const candidateStack = currentStack.map((item, i) => ({
          ...item,
          dose: currentDoses[i]
        }));

        const res = evaluateStack({ stackInput: candidateStack, profile: userProfile });
        
        // CRITERIA:
        // 1. Net Score >= -0.15 (Break-even point)
        // 2. Risk < 9.8 (Safety ceiling)
        // 3. Maximize Total Benefit (Anabolic Power)
        if (res.totals.netScore >= -0.15 && res.totals.totalRisk < 9.8) {
          if (res.totals.totalBenefit > maxBenefit) {
            maxBenefit = res.totals.totalBenefit;
            bestResult = {
              optimizedStack: candidateStack,
              originalScore: initialEval.totals.netScore,
              newScore: res.totals.netScore,
              benefit: res.totals.totalBenefit,
              isDifferent: true,
              type: 'redline'
            };
          }
        }
        return;
      }

      const steps = dims[depth];
      for (let dose of steps) {
        currentDoses[depth] = dose;
        searchRecursive(depth + 1, currentDoses);
        if (iterations >= MAX_ITERATIONS) return;
      }
    };
    searchRecursive(0, []);
  };

  // --- EXECUTE PASS 1: COARSE ---
  const coarseDims = getDimensions(currentStack);
  runSearch(coarseDims);

  // --- EXECUTE PASS 2: FINE ---
  if (bestResult) {
    // Reset iterations to allow full fine search
    iterations = 0;
    const fineDims = getDimensions(
      currentStack, 
      bestResult.optimizedStack, 
      stackSize >= 3 ? 300 : 400, // Range +/-
      stackSize >= 3 ? 50 : 25    // Fine Step (25mg precision)
    );
    runSearch(fineDims);
  }

  // Fallback
  if (!bestResult) {
    return {
      optimizedStack: currentStack,
      originalScore: initialEval.totals.netScore,
      newScore: initialEval.totals.netScore,
      isDifferent: false,
      type: 'redline'
    };
  }

  return bestResult;
};
