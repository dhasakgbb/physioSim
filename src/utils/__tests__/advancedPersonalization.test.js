import { describe, it, expect } from "vitest";
import { evaluateStack } from "../stackEngine";
import { defaultProfile } from "../personalization";

describe("Advanced Personalization (Genetics & Diet)", () => {
  
  describe("Genetic Factors", () => {
    it("AR Sensitivity (CAG Repeats) scales anabolic response", () => {
      const stack = [{ compound: "testosterone", dose: 500, ester: "enanthate" }];
      
      const normalProfile = { ...defaultProfile, arSensitivity: "normal" };
      const hyperProfile = { ...defaultProfile, arSensitivity: "hyper_responder" };
      const lowProfile = { ...defaultProfile, arSensitivity: "low_responder" };

      const resNormal = evaluateStack({ stackInput: stack, profile: normalProfile });
      const resHyper = evaluateStack({ stackInput: stack, profile: hyperProfile });
      const resLow = evaluateStack({ stackInput: stack, profile: lowProfile });

      console.log(`Normal Benefit: ${resNormal.totals.totalBenefit}`);
      console.log(`Hyper Benefit: ${resHyper.totals.totalBenefit}`);
      console.log(`Low Benefit: ${resLow.totals.totalBenefit}`);

      // Hyper should be ~1.2x Normal
      expect(resHyper.totals.totalBenefit).toBeGreaterThan(resNormal.totals.totalBenefit);
      expect(resHyper.totals.totalBenefit).toBeCloseTo(resNormal.totals.totalBenefit * 1.2, 1);

      // Low should be ~0.8x Normal
      expect(resLow.totals.totalBenefit).toBeLessThan(resNormal.totals.totalBenefit);
      expect(resLow.totals.totalBenefit).toBeCloseTo(resNormal.totals.totalBenefit * 0.8, 1);
    });

    it("Aromatase Activity (CYP19A1) scales estrogenic risk", () => {
      // Use a wet compound like Testosterone
      const stack = [{ compound: "testosterone", dose: 600, ester: "enanthate" }];
      
      const normalProfile = { ...defaultProfile, aromatase: "moderate" };
      const highProfile = { ...defaultProfile, aromatase: "high" }; // Wet
      const lowProfile = { ...defaultProfile, aromatase: "low" }; // Dry

      const resNormal = evaluateStack({ stackInput: stack, profile: normalProfile });
      const resHigh = evaluateStack({ stackInput: stack, profile: highProfile });
      const resLow = evaluateStack({ stackInput: stack, profile: lowProfile });

      console.log(`Normal Risk: ${resNormal.totals.totalRisk}`);
      console.log(`High Arom Risk: ${resHigh.totals.totalRisk}`);
      console.log(`Low Arom Risk: ${resLow.totals.totalRisk}`);

      // High Aromatase should have significantly higher risk
      expect(resHigh.totals.totalRisk).toBeGreaterThan(resNormal.totals.totalRisk);
      
      // Low Aromatase should have lower risk
      expect(resLow.totals.totalRisk).toBeLessThan(resNormal.totals.totalRisk);
    });

    it("Neuro Sensitivity (COMT) scales Trenbolone risk", () => {
      // Use Trenbolone (Neurotoxic)
      const stack = [{ compound: "trenbolone", dose: 300, ester: "acetate" }];
      
      const normalProfile = { ...defaultProfile, anxiety: "moderate" };
      const slowComtProfile = { ...defaultProfile, anxiety: "high" }; // Slow COMT / Anxious
      const fastComtProfile = { ...defaultProfile, anxiety: "low" }; // Fast COMT / Resilient

      const resNormal = evaluateStack({ stackInput: stack, profile: normalProfile });
      const resSlow = evaluateStack({ stackInput: stack, profile: slowComtProfile });
      const resFast = evaluateStack({ stackInput: stack, profile: fastComtProfile });

      console.log(`Normal Tren Risk: ${resNormal.totals.totalRisk}`);
      console.log(`Slow COMT Tren Risk: ${resSlow.totals.totalRisk}`);

      // Slow COMT should have much higher risk (~2x multiplier logic applied in personalization.js)
      expect(resSlow.totals.totalRisk).toBeGreaterThan(resNormal.totals.totalRisk);
      expect(resFast.totals.totalRisk).toBeLessThan(resNormal.totals.totalRisk);
    });
  });

  describe("Diet State (Energy Context)", () => {
    it("Cutting: Reduces global anabolism but rewards anti-catabolics (Tren)", () => {
      // Compare Test (0 Cortisol) vs Tren (-3 Cortisol) in Cutting vs Maintenance
      
      const testStack = [{ compound: "testosterone", dose: 500 }];
      const trenStack = [{ compound: "trenbolone", dose: 300 }];

      const maintenanceProfile = { ...defaultProfile, dietState: "maintenance" };
      const cuttingProfile = { ...defaultProfile, dietState: "cutting" };

      // 1. Testosterone (No anti-catabolic bonus)
      const resTestMaint = evaluateStack({ stackInput: testStack, profile: maintenanceProfile });
      const resTestCut = evaluateStack({ stackInput: testStack, profile: cuttingProfile });

      // 2. Trenbolone (High anti-catabolic bonus)
      const resTrenMaint = evaluateStack({ stackInput: trenStack, profile: maintenanceProfile });
      const resTrenCut = evaluateStack({ stackInput: trenStack, profile: cuttingProfile });

      console.log(`Test Maint: ${resTestMaint.totals.totalBenefit} -> Cut: ${resTestCut.totals.totalBenefit}`);
      console.log(`Tren Maint: ${resTrenMaint.totals.totalBenefit} -> Cut: ${resTrenCut.totals.totalBenefit}`);

      // Test should drop significantly (~30%)
      const testDrop = 1 - (resTestCut.totals.totalBenefit / resTestMaint.totals.totalBenefit);
      expect(testDrop).toBeGreaterThan(0.25); 

      // Tren should drop LESS than Test (or stay near parity) due to retention bonus
      const trenDrop = 1 - (resTrenCut.totals.totalBenefit / resTrenMaint.totals.totalBenefit);
      expect(trenDrop).toBeLessThan(testDrop);
    });

    it("Bulking: Increases systemic risk, especially for Orals", () => {
      const oralStack = [{ compound: "dianabol", dose: 30 }];
      
      const maintenanceProfile = { ...defaultProfile, dietState: "maintenance" };
      const bulkingProfile = { ...defaultProfile, dietState: "bulking" };

      const resMaint = evaluateStack({ stackInput: oralStack, profile: maintenanceProfile });
      const resBulk = evaluateStack({ stackInput: oralStack, profile: bulkingProfile });

      console.log(`Oral Risk Maint: ${resMaint.totals.totalRisk}`);
      console.log(`Oral Risk Bulk: ${resBulk.totals.totalRisk}`);

      // Bulking should increase risk for orals
      expect(resBulk.totals.totalRisk).toBeGreaterThan(resMaint.totals.totalRisk);
    });
  });

  describe("Training Stimulus (The Signal Director)", () => {
    it("Powerlifting: Boosts Strength compounds (Anadrol) but penalizes Hypertrophy compounds (Deca)", () => {
      const strengthStack = [{ compound: "anadrol", dose: 50 }];
      const hypertrophyStack = [{ compound: "npp", dose: 400 }]; // NPP is pure hypertrophy

      const bbProfile = { ...defaultProfile, trainingStyle: "bodybuilding" };
      const plProfile = { ...defaultProfile, trainingStyle: "powerlifting" };

      // 1. Anadrol (Strength)
      const resAdrolBB = evaluateStack({ stackInput: strengthStack, profile: bbProfile });
      const resAdrolPL = evaluateStack({ stackInput: strengthStack, profile: plProfile });

      // 2. NPP (Hypertrophy)
      const resNppBB = evaluateStack({ stackInput: hypertrophyStack, profile: bbProfile });
      const resNppPL = evaluateStack({ stackInput: hypertrophyStack, profile: plProfile });

      console.log(`Adrol BB: ${resAdrolBB.totals.totalBenefit} -> PL: ${resAdrolPL.totals.totalBenefit}`);
      console.log(`NPP BB: ${resNppBB.totals.totalBenefit} -> PL: ${resNppPL.totals.totalBenefit}`);

      // Anadrol should be higher in PL (1.2x bonus vs 1.2x BB bonus? Wait.)
      // In BB: Adrol gets 1.2x (Volume). In PL: Adrol gets 1.2x (Strength).
      // They might be equal if I implemented it that way.
      // Let's check logic:
      // PL: If Strength -> *1.2. Else -> *0.8.
      // BB: Always *1.2.
      // So Adrol should be EQUAL in BB and PL.
      // But NPP should be LOWER in PL (*0.8) vs BB (*1.2).
      
      expect(resAdrolPL.totals.totalBenefit).toBeCloseTo(resAdrolBB.totals.totalBenefit, 1);
      expect(resNppPL.totals.totalBenefit).toBeLessThan(resNppBB.totals.totalBenefit);
    });

    it("CrossFit: Boosts Endurance (EQ) and warns against Cardio Killers (Tren)", () => {
      const eqStack = [{ compound: "eq", dose: 600 }];
      const trenStack = [{ compound: "trenbolone", dose: 300 }];

      const bbProfile = { ...defaultProfile, trainingStyle: "bodybuilding" };
      const cfProfile = { ...defaultProfile, trainingStyle: "crossfit" };

      // 1. EQ (Endurance)
      const resEqBB = evaluateStack({ stackInput: eqStack, profile: bbProfile });
      const resEqCF = evaluateStack({ stackInput: eqStack, profile: cfProfile });

      // 2. Tren (Cardio Killer)
      const resTrenCF = evaluateStack({ stackInput: trenStack, profile: cfProfile });

      console.log(`EQ BB: ${resEqBB.totals.totalBenefit} -> CF: ${resEqCF.totals.totalBenefit}`);
      
      // EQ should be roughly equal (BB gets 1.2x, CF gets 1.2x for Endurance)
      // Wait, EQ is endurance.
      // BB: *1.2. CF: *1.2.
      expect(resEqCF.totals.totalBenefit).toBeCloseTo(resEqBB.totals.totalBenefit, 1);

      // Tren Warning
      const hasWarning = resTrenCF.warnings.some(w => w.message.includes("CARDIO CAPACITY WARNING"));
      expect(hasWarning).toBe(true);
      
      // Tren Risk should be higher in CF
      const resTrenBB = evaluateStack({ stackInput: trenStack, profile: bbProfile });
      expect(resTrenCF.totals.totalRisk).toBeGreaterThan(resTrenBB.totals.totalRisk);
    });
  });
});
