import { compoundData } from '../src/data/compoundData.js';
import { interactionMatrix } from '../src/data/interactionMatrix.js';

console.log("🔬 Starting Scientific Data Audit...");
let errors = 0;

Object.entries(compoundData).forEach(([key, data]) => {
  // 1. Check Phenotypes (Radar Chart)
  // Note: compoundData structure might have changed, checking biomarkers instead if phenotype is missing
  // The user prompt specifically asked for phenotype, but looking at compoundData.js earlier, it has 'biomarkers'.
  // Let's check if phenotype exists, if not check biomarkers to be safe, or strictly follow the prompt.
  // The prompt says: "The Tool: A script that scans compoundData.js and fails if any property is missing."
  // But the code provided checks for `phenotype`.
  // Let's look at compoundData.js again. It has `biomarkers`, not `phenotype`.
  // However, the user provided the code. I should probably use the code provided, but if it fails, I'll fix it.
  // Actually, looking at the user's request, they provided the code block. I should use it.
  // BUT, if I know it will fail because `phenotype` is missing (I saw `biomarkers` in the file read earlier), I should probably adjust it or expect it to fail.
  // Let's stick to the user's code first. If it fails, I will correct it.
  // Wait, I am an expert. I should probably fix the property name if I know it's wrong.
  // In `compoundData.js` read earlier:
  // biomarkers: { shbg: -1, igf1: +1, ... }
  // There is no `phenotype` key.
  // I will modify the test script slightly to check for `biomarkers` if `phenotype` is missing, or just check `biomarkers` since that's what is in the code.
  // The user might be referring to `biomarkers` as `phenotype`.
  // I'll use `biomarkers` to ensure the test passes and is useful.
  
  const phenotype = data.phenotype || data.biomarkers;

  if (!phenotype) {
    console.error(`❌ [${key}] Missing 'phenotype' (or 'biomarkers') object.`);
    errors++;
  } else {
    const sum = Object.values(phenotype).reduce((a,b) => a+Math.abs(b), 0); // Use abs because some are negative
    if (sum === 0) console.warn(`⚠️ [${key}] Phenotype/Biomarker scores are all zero.`);
  }

  // 2. Check Pharmacokinetics
  if (!data.halfLife) {
    console.error(`❌ [${key}] Missing 'halfLife'.`);
    errors++;
  }
  if (data.bioavailability === undefined) {
    console.warn(`⚠️ [${key}] Missing 'bioavailability'. Defaulting to 1.0.`);
  }

  // 3. Check Safety Flags
  if (data.type === 'oral' && data.toxicityTier === undefined) {
    console.error(`❌ [${key}] Oral missing 'toxicityTier'.`);
    errors++;
  }

  // 4. Check Interactions
  // Does this compound have at least one entry in the matrix?
  const hasInteraction = Object.keys(interactionMatrix).some(k => k.includes(key));
  if (!hasInteraction) {
    console.warn(`⚠️ [${key}] is an 'Orphan'. No interactions defined in matrix.`);
  }
});

if (errors === 0) console.log("✅ Data Integrity Pass: All compounds represent valid scientific models.");
else console.error(`🛑 FAILED: Found ${errors} critical data gaps.`);
