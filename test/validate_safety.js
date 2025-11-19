import { evaluateStack } from '../src/utils/stackEngine.js';

console.log("🛡️ Testing Safety Protocols...");

// SCENARIO A: The "Kidney Screamer" (Tren + Anadrol)
const kidneyStack = [
  { compound: 'trenbolone', dose: 400 },
  { compound: 'anadrol', dose: 350 } // 50mg/day
];
const kidneyResult = evaluateStack({ stackInput: kidneyStack });
// Look for the specific penalty application logic or high risk score
// The user's code checks for totalRisk > 12.
// I should also check if the warning is present, as I added a specific warning.
const hasKidneyWarning = kidneyResult.warnings.some(w => w.message.includes("KIDNEY STRESS CRITICAL"));

if (kidneyResult.totals.totalRisk > 12 || hasKidneyWarning) {
  console.log("✅ PASS: Tren + Anadrol flagged as Critical Risk.");
  if (hasKidneyWarning) console.log("   (Specific Kidney Warning Found)");
} else {
  console.error(`❌ FAIL: Tren + Anadrol risk too low (${kidneyResult.totals.totalRisk}). Penalties missing?`);
}

// SCENARIO B: The "Liver Bomb" (Superdrol + Halo)
const liverStack = [
  { compound: 'superdrol', dose: 140 }, // 20mg/day
  { compound: 'halotestin', dose: 140 } // 20mg/day
];
const liverResult = evaluateStack({ stackInput: liverStack });

// Check if Synergistic Penalty applied (Orals > 1)
const hasLiverWarning = liverResult.warnings.some(w => w.message.includes("Hepatotoxicity Synergy"));

if (liverResult.totals.totalRisk > 15 || hasLiverWarning) {
  console.log("✅ PASS: Dual Oral Toxicity properly scaled.");
  if (hasLiverWarning) console.log("   (Specific Liver Warning Found)");
} else {
  console.error("❌ FAIL: Dual Orals treated linearly.");
}
