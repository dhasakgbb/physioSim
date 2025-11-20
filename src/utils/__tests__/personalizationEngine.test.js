import { describe, it, expect } from "vitest";
import { evaluateStack } from "../stackEngine";
import { defaultProfile } from "../personalization";

describe("Personalization Engine (Doctor-Grade Simulation)", () => {
  
  // Baseline: 1000mg Testosterone Enanthate
  const baselineStack = [
    { compound: "testosterone", dose: 1000, ester: "enanthate" }
  ];

  it("Case 1: Body Weight / LBM (The 'Dilution' Factor)", () => {
    // User A: Standard Reference Man (160lb LBM approx)
    // 90kg (200lb) @ 15% BF = ~170lb LBM
    const userStandard = { ...defaultProfile, bodyweight: 90, bodyFat: 15 };
    
    // User B: IFBB Pro (Mass Monster)
    // 136kg (300lb) @ 10% BF = ~270lb LBM
    const userPro = { ...defaultProfile, bodyweight: 136, bodyFat: 10 };

    // We need a dose high enough to saturate the Standard user but NOT the Pro
    // Standard Threshold ~1500. Pro Threshold ~2500.
    // Note: Enanthate weight is ~0.7, so 2000mg = 1400mg active (below threshold).
    // Let's use 3000mg (2100mg active).
    const highDoseStack = [{ compound: "testosterone", dose: 3000, ester: "enanthate" }];

    const resStandard = evaluateStack({ stackInput: highDoseStack, profile: userStandard });
    const resPro = evaluateStack({ stackInput: highDoseStack, profile: userPro });

    // The Pro has more LBM, so their Saturation Threshold is higher.
    // Therefore, 2000mg is LESS saturated for them (higher genomic factor).
    // Also, Toxicity is diluted (lower toxicity multiplier).
    
    console.log(`Standard Saturation: ${resStandard.totals.saturationPenalty}`);
    console.log(`Pro Saturation: ${resPro.totals.saturationPenalty}`);
    
    expect(resPro.totals.saturationPenalty).toBeGreaterThan(resStandard.totals.saturationPenalty);
    expect(resPro.totals.toxicityMultiplier).toBeLessThan(resStandard.totals.toxicityMultiplier);
  });

  it("Case 2: Body Fat (The 'Aromatase' Multiplier)", () => {
    // User A: Lean (10% BF)
    const userLean = { ...defaultProfile, bodyFat: 10 };
    
    // User B: High Body Fat (25% BF)
    const userHighBF = { ...defaultProfile, bodyFat: 25 };

    // We need to check the internal risk calculation or the warnings/estrogen load.
    // Since we don't expose 'estrogenLoad' directly in totals, we can check the 'risk' of an aromatizing compound.
    // Testosterone aromatizes.
    
    const resLean = evaluateStack({ stackInput: baselineStack, profile: userLean });
    const resHighBF = evaluateStack({ stackInput: baselineStack, profile: userHighBF });

    // High BF should have significantly higher risk due to Aromatase Scalar
    console.log(`Lean Risk: ${resLean.totals.totalRisk}`);
    console.log(`High BF Risk: ${resHighBF.totals.totalRisk}`);

    expect(resHighBF.totals.totalRisk).toBeGreaterThan(resLean.totals.totalRisk);
  });

  it("Case 3: Gender (The 'Virilization' Cliff)", () => {
    // Female User taking 50mg Testosterone (High dose for female)
    const femaleStack = [{ compound: "testosterone", dose: 50, ester: "propionate" }];
    const userFemale = { ...defaultProfile, gender: "female", bodyweight: 60 };
    
    // Male User taking 50mg Testosterone (TRT/Low dose)
    const userMale = { ...defaultProfile, gender: "male", bodyweight: 90 };

    const resFemale = evaluateStack({ stackInput: femaleStack, profile: userFemale });
    const resMale = evaluateStack({ stackInput: femaleStack, profile: userMale });

    // Female should have MASSIVE benefit (relative to baseline) but HIGH risk (Virilization)
    // Male should have low benefit (TRT) and negligible risk
    
    console.log(`Female Benefit: ${resFemale.totals.totalBenefit}, Risk: ${resFemale.totals.totalRisk}`);
    console.log(`Male Benefit: ${resMale.totals.totalBenefit}, Risk: ${resMale.totals.totalRisk}`);

    expect(resFemale.totals.totalBenefit).toBeGreaterThan(resMale.totals.totalBenefit * 5); // Expecting ~10x
    expect(resFemale.totals.totalRisk).toBeGreaterThan(resMale.totals.totalRisk * 2);
  });

  it("Case 4: Age (The 'Resilience' Decay)", () => {
    // User A: 25 years old
    const userYoung = { ...defaultProfile, age: 25 };
    
    // User B: 55 years old
    const userOld = { ...defaultProfile, age: 55 };

    const resYoung = evaluateStack({ stackInput: baselineStack, profile: userYoung });
    const resOld = evaluateStack({ stackInput: baselineStack, profile: userOld });

    // Older user should have higher risk due to organ stress and recovery penalties
    console.log(`Young Risk: ${resYoung.totals.totalRisk}`);
    console.log(`Old Risk: ${resOld.totals.totalRisk}`);

    expect(resOld.totals.totalRisk).toBeGreaterThan(resYoung.totals.totalRisk);
  });

  it("Case 5: Experience (The 'Sensitivity' Curve)", () => {
    // User A: Novice
    const userNovice = { ...defaultProfile, experience: "none" };
    
    // User B: Pro
    const userPro = { ...defaultProfile, experience: "blast_cruise" };

    // 500mg Test
    const stack = [{ compound: "testosterone", dose: 500 }];

    const resNovice = evaluateStack({ stackInput: stack, profile: userNovice });
    const resPro = evaluateStack({ stackInput: stack, profile: userPro });

    // Novice: Higher Response (Multiplier 1.2)
    // Pro: Lower Response (Multiplier 0.8)
    
    console.log(`Novice Benefit: ${resNovice.totals.totalBenefit}`);
    console.log(`Pro Benefit: ${resPro.totals.totalBenefit}`);

    expect(resNovice.totals.totalBenefit).toBeGreaterThan(resPro.totals.totalBenefit);
  });

});
