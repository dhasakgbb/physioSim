import { evaluateStack } from '../src/utils/stackEngine.js';

const runSimulation = (compound, dose, duration = 12) => {
  const stack = [{ compound, dose, frequency: 7, ester: 'enanthate' }]; // Standardized
  return evaluateStack({ stackInput: stack, durationWeeks: duration });
};

console.log("📈 Verifying Dose-Response Curves...");

// TEST 1: Diminishing Returns (Testosterone)
const low = runSimulation('testosterone', 500);
const high = runSimulation('testosterone', 1500); // 3x dose

const benefitRatio = high.totals.totalBenefit / low.totals.totalBenefit;
console.log(`Testosterone 500mg -> 1500mg (3x Dose):`);
console.log(`   Benefit Multiplier: ${benefitRatio.toFixed(2)}x`);

if (benefitRatio < 2.5) {
  console.log("   ✅ PASS: Diminishing returns active (Benefit did not triple).");
} else {
  console.error("   ❌ FAIL: Scaling is linear/unrealistic.");
}

// TEST 2: Toxicity Avalanche (Anadrol)
// Note: Engine treats oral input as Daily dose.
// We use 6 weeks to isolate dose toxicity from duration toxicity.
const lowOral = runSimulation('anadrol', 50, 6); // 50mg/day
const highOral = runSimulation('anadrol', 100, 6); // 100mg/day (2x dose)

const riskRatio = highOral.totals.totalRisk / lowOral.totals.totalRisk;
console.log(`Anadrol 50mg -> 100mg (2x Dose):`);
console.log(`   Risk Multiplier: ${riskRatio.toFixed(2)}x`);

if (riskRatio > 2.2) {
  console.log("   ✅ PASS: Toxicity scaling is super-linear (Risk more than doubled).");
} else {
  console.error("   ❌ FAIL: Toxicity is linear (Should be exponential).");
}
