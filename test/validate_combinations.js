import { evaluateStack } from "../src/utils/stackEngine.js";
import { defaultProfile } from "../src/utils/personalization.js";
import { compoundData } from "../src/data/compoundData.js";

const scenarios = [
  {
    name: "TRT Cruise",
    stack: [{ compound: "testosterone", dose: 150 }],
  },
  {
    name: "First Cycle (Standard)",
    stack: [{ compound: "testosterone", dose: 500 }],
  },
  {
    name: "High Test Blast",
    stack: [{ compound: "testosterone", dose: 1000 }],
  },
  {
    name: "Classic Cut (Test/Mast/Var)",
    stack: [
      { compound: "testosterone", dose: 350 },
      { compound: "masteron", dose: 400 },
      { compound: "anavar", dose: 50 },
    ],
  },
  {
    name: "The 'Kitchen Sink' (High Load)",
    stack: [
      { compound: "testosterone", dose: 500 },
      { compound: "trenbolone", dose: 400 },
      { compound: "masteron", dose: 400 },
      { compound: "anavar", dose: 50 },
    ],
  },
  {
    name: "ABUSE: Open Class Monster",
    stack: [
      { compound: "testosterone", dose: 1500 },
      { compound: "trenbolone", dose: 800 },
      { compound: "anadrol", dose: 100 },
    ],
  },
  {
    name: "ABUSE: Oral Only (Liver Death)",
    stack: [
      { compound: "dianabol", dose: 50 },
      { compound: "winstrol", dose: 50 },
      { compound: "superdrol", dose: 20 },
    ],
  },
];

console.log("\n🧪 PHYSIOSIM ENGINE VALIDATION SUITE 🧪");
console.log("=========================================");

scenarios.forEach((scenario) => {
  const result = evaluateStack({
    stackInput: scenario.stack,
    profile: defaultProfile,
  });

  const { totalBenefit, totalRisk, netScore, saturationPenalty } =
    result.totals;

  // Determine Verdict
  let verdict = "✅ OPTIMAL";
  if (netScore < 0) verdict = "🛑 NET NEGATIVE";
  else if (netScore < 1.5 && totalRisk < 1) verdict = "✅ HEALTHY / TRT";
  else if (netScore < 2) verdict = "⚠️ DIMINISHING";
  else if (totalRisk > 10) verdict = "☣️ TOXIC";

  console.log(`\nScenario: ${scenario.name}`);
  console.log(
    `Stack: ${scenario.stack.map((s) => `${s.dose}mg ${compoundData[s.compound].name}`).join(", ")}`,
  );
  console.log(`-----------------------------------------`);
  console.log(`Benefit:    ${totalBenefit.toFixed(2)}`);
  console.log(`Risk:       ${totalRisk.toFixed(2)}`);
  console.log(`Net Score:  ${netScore.toFixed(2)}`);
  console.log(
    `Saturation: ${(saturationPenalty * 100).toFixed(0)}% efficiency`,
  );
  console.log(`VERDICT:    ${verdict}`);
});

console.log("\n=========================================");
console.log("Validation Complete.");
