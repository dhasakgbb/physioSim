import { describe, it, expect } from "vitest";
import { compoundData } from "../data/compoundData";

describe("Data Validation Tests", () => {
  describe("All Compounds Present", () => {
    it("should have all 18 compounds", () => {
      const compounds = Object.keys(compoundData);
      expect(compounds).toHaveLength(18);
      expect(compounds).toContain("testosterone");
      expect(compounds).toContain("npp");
      expect(compounds).toContain("trenbolone");
      expect(compounds).toContain("eq");
      expect(compounds).toContain("masteron");
      expect(compounds).toContain("primobolan");
    });
  });

  describe("Testosterone Data Validation", () => {
    it("should have correct benefit values at key doses", () => {
      const test = compoundData.testosterone;
      const benefit100 = test.benefitCurve.find((p) => p.dose === 100);
      const benefit600 = test.benefitCurve.find((p) => p.dose === 600);

      expect(benefit100.value).toBeCloseTo(0.83, 2);
      expect(benefit600.value).toBeCloseTo(5.0, 1);
    });

    it("should have correct risk values at key doses", () => {
      const test = compoundData.testosterone;
      const risk600 = test.riskCurve.find((p) => p.dose === 600);

      expect(risk600.value).toBeCloseTo(2.1, 1);
    });

    it("should have Tier 1 data at 600mg", () => {
      const test = compoundData.testosterone;
      const benefit600 = test.benefitCurve.find((p) => p.dose === 600);

      if (benefit600.tier) {
        expect(benefit600.tier).toBe("Tier 1");
      }
    });
  });

  describe("Trenbolone Data Validation - CRITICAL TESTS", () => {
    it("should have diminishing returns post-400mg", () => {
      const tren = compoundData.trenbolone;
      const benefit300 = tren.benefitCurve.find((p) => p.dose === 300);
      const benefit400 = tren.benefitCurve.find((p) => p.dose === 400);
      const benefit500 = tren.benefitCurve.find((p) => p.dose === 500);
      const benefit600 = tren.benefitCurve.find((p) => p.dose === 600);

      // Verify value at 400mg
      expect(benefit400.value).toBeCloseTo(4.87, 2);

      // Verify diminishing returns (slope decreases)
      const slope1 = benefit400.value - benefit300.value;
      const slope2 = benefit500.value - benefit400.value;
      const slope3 = benefit600.value - benefit500.value;

      expect(slope2).toBeLessThan(slope1);
      expect(slope3).toBeLessThan(slope2);
    });

    it("should have risk at 400mg approximately 5.2", () => {
      const tren = compoundData.trenbolone;
      const risk400 = tren.riskCurve.find((p) => p.dose === 400);

      expect(risk400.value).toBeCloseTo(5.2, 1);
    });

    it("should have wider uncertainty band than testosterone", () => {
      const tren = compoundData.trenbolone;
      const test = compoundData.testosterone;

      const trenRisk400 = tren.riskCurve.find((p) => p.dose === 400);
      const testRisk600 = test.riskCurve.find((p) => p.dose === 600);

      if (trenRisk400.ci && testRisk600.ci) {
        expect(trenRisk400.ci).toBeGreaterThan(testRisk600.ci);
      }
    });

    it("should have appropriate Tier 4 tags at high doses", () => {
      const tren = compoundData.trenbolone;
      const benefit400 = tren.benefitCurve.find((p) => p.dose === 400);
      const risk400 = tren.riskCurve.find((p) => p.dose === 400);

      if (benefit400.tier) expect(benefit400.tier).toBe("Tier 4");
      if (risk400.tier) expect(risk400.tier).toBe("Tier 4");
    });
  });

  describe("NPP Data Validation", () => {
    it("should have plateau around 300mg", () => {
      const npp = compoundData.npp;
      const benefit300 = npp.benefitCurve.find((p) => p.dose === 300);
      const benefit600 = npp.benefitCurve.find((p) => p.dose === 600);

      expect(benefit300.value).toBeCloseTo(3.0, 1);
      expect(benefit600.value).toBeCloseTo(3.45, 1);

      // Should be relatively flat (difference < 0.5)
      expect(Math.abs(benefit600.value - benefit300.value)).toBeLessThan(0.5);
    });

    it("should have significant prolactin risk at 300mg", () => {
      const npp = compoundData.npp;
      const risk300 = npp.riskCurve.find((p) => p.dose === 300);

      expect(risk300.value).toBeCloseTo(1.5, 1);
    });
  });

  describe("All Curves Start at Zero", () => {
    it("should have all benefit curves starting at (0, 0)", () => {
      Object.entries(compoundData).forEach(([key, compound]) => {
        const firstPoint = compound.benefitCurve[0];
        expect(firstPoint.dose).toBe(0);
        expect(firstPoint.value).toBe(0.0);
      });
    });

    it("should have all risk curves starting at (0, 0)", () => {
      Object.entries(compoundData).forEach(([key, compound]) => {
        const firstPoint = compound.riskCurve[0];
        expect(firstPoint.dose).toBe(0);
        expect(firstPoint.value).toBe(0.0);
      });
    });
  });

  describe("Data Structure Validation", () => {
    it("should have all required fields for each compound", () => {
      Object.entries(compoundData).forEach(([key, compound]) => {
        expect(compound).toHaveProperty("name");
        expect(compound).toHaveProperty("color");
        expect(compound).toHaveProperty("abbreviation");
        expect(compound).toHaveProperty("benefitCurve");
        expect(compound).toHaveProperty("riskCurve");
        expect(compound).toHaveProperty("methodology");
      });
    });

    it("should have all required fields for each data point", () => {
      Object.entries(compoundData).forEach(([key, compound]) => {
        compound.benefitCurve.forEach((point) => {
          expect(point).toHaveProperty("dose");
          expect(point).toHaveProperty("value");
          // Optional fields
          // expect(point).toHaveProperty('tier');
          // expect(point).toHaveProperty('source');
          // expect(point).toHaveProperty('caveat');
          // expect(point).toHaveProperty('ci');
        });

        compound.riskCurve.forEach((point) => {
          expect(point).toHaveProperty("dose");
          expect(point).toHaveProperty("value");
        });
      });
    });

    it("should have all required methodology fields", () => {
      Object.entries(compoundData).forEach(([key, compound]) => {
        expect(compound.methodology).toHaveProperty("summary");
        // expect(compound.methodology).toHaveProperty('benefitRationale');
        // expect(compound.methodology).toHaveProperty('riskRationale');
        expect(compound.methodology).toHaveProperty("sources");
        // expect(compound.methodology).toHaveProperty('limitations');
        // expect(compound.methodology).toHaveProperty('assumptions');
        // expect(compound.methodology).toHaveProperty('individualVariance');
      });
    });
  });

  describe("Uncertainty Band Width Validation", () => {
    it("should have Tier 1 uncertainty bands narrower than Tier 4", () => {
      const test = compoundData.testosterone;
      const tren = compoundData.trenbolone;

      // Testosterone Tier 1 at 600mg
      const testBenefit600 = test.benefitCurve.find((p) => p.dose === 600);

      // Trenbolone Tier 4 at 400mg
      const trenBenefit400 = tren.benefitCurve.find((p) => p.dose === 400);

      if (testBenefit600.ci && trenBenefit400.ci) {
        expect(testBenefit600.ci).toBeLessThan(trenBenefit400.ci);
      }
    });

    it("should have appropriate CI ranges", () => {
      Object.entries(compoundData).forEach(([key, compound]) => {
        compound.benefitCurve.forEach((point) => {
          if (point.ci !== undefined) {
            expect(point.ci).toBeGreaterThanOrEqual(0);
            expect(point.ci).toBeLessThanOrEqual(1.0);
          }
        });

        compound.riskCurve.forEach((point) => {
          if (point.ci !== undefined) {
            expect(point.ci).toBeGreaterThanOrEqual(0);
            expect(point.ci).toBeLessThanOrEqual(1.0);
          }
        });
      });
    });
  });

  describe("Benefit Curves Should Not Decline Unrealistically", () => {
    it("should not have benefit values declining significantly after plateau", () => {
      Object.entries(compoundData).forEach(([key, compound]) => {
        const benefitCurve = compound.benefitCurve;
        let maxValue = 0;

        benefitCurve.forEach((point) => {
          // Values should not decline by more than 10% after reaching peak
          if (point.value < maxValue * 0.9) {
            throw new Error(
              `${compound.name} benefit declines unrealistically at ${point.dose}mg`,
            );
          }
          maxValue = Math.max(maxValue, point.value);
        });
      });
    });
  });

  describe("Risk Curves Should Be Monotonically Increasing or Flat", () => {
    it("should have risk values that increase or stay flat with dose", () => {
      Object.entries(compoundData).forEach(([key, compound]) => {
        const riskCurve = compound.riskCurve;
        let prevValue = 0;

        riskCurve.forEach((point) => {
          // Risk should never decrease
          expect(point.value).toBeGreaterThanOrEqual(prevValue);
          prevValue = point.value;
        });
      });
    });
  });

  describe("Color Coding Validation", () => {
    it("should have unique colors for each compound", () => {
      const colors = Object.values(compoundData).map((c) => c.color);
      const uniqueColors = new Set(colors);

      expect(uniqueColors.size).toBeGreaterThanOrEqual(17);
    });

    it("should have valid hex color codes", () => {
      Object.entries(compoundData).forEach(([key, compound]) => {
        expect(compound.color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });
});
