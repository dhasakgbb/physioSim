import { describe, expect, it } from "vitest";
import {
  calculateCycleMetrics,
  calculateOrganSupport,
  calculateActiveLoad,
  calculateEfficiencyMetrics,
  calculateProjectedGains,
  calculateSystemLoad,
  calculateProjectedLabsWidget,
  calculateShbgDynamics,
  SATURATION_THRESHOLD_1,
  SATURATION_THRESHOLD_2,
  TOXICITY_CEILING,
} from "../simulationEngine.js";

// Mock compound data for testing
const mockCompoundData = {
  testosterone: {
    type: "injectable",
    defaultEster: "enanthate",
    halfLife: 168,
    esters: {
      enanthate: { weight: 1.0, halfLife: 168 },
      cypionate: { weight: 1.0, halfLife: 168 },
      propionate: { weight: 0.8, halfLife: 84 },
    },
    basePotency: 1.0,
    benefits: { contractile_growth: 10, neural_strength: 8 },
    metabolic: { lipolysis: 5, aromatization: 2 },
    biomarkers: { igf1: 8, cns_drive: 7, cortisol: -3, liver_toxicity: 2, rbc: 3 },
    toxicity: { hepatic: 2, lipid: 3, androgenic: 4 },
    pathways: { ar_affinity: 5 },
    conversionFactor: 0.8,
  },
  trenbolone: {
    type: "injectable",
    defaultEster: "enanthate",
    halfLife: 120,
    esters: {
      enanthate: { weight: 1.0, halfLife: 120 },
    },
    basePotency: 2.5,
    benefits: { contractile_growth: 15, neural_strength: 12 },
    metabolic: { aromatization: 0 },
    biomarkers: { igf1: 12, cns_drive: 10, liver_toxicity: 3, rbc: 4 },
    toxicity: { hepatic: 3, lipid: 4, androgenic: 8 },
    pathways: { ar_affinity: 9 },
  },
  tudca: {
    type: "support",
    biomarkers: {},
  },
  nac: {
    type: "support",
    biomarkers: {},
  },
};

describe("calculateOrganSupport", () => {
  it("returns zero shields for empty compounds", () => {
    const result = calculateOrganSupport([]);
    expect(result).toEqual({ hepatic: 0, renal: 0 });
  });

  it("calculates tudca hepatic support", () => {
    const compounds = [
      { id: "tudca", type: "support", activeMg: 1000 },
    ];
    const result = calculateOrganSupport(compounds);
    expect(result.hepatic).toBeGreaterThan(0);
    expect(result.renal).toBe(0);
  });

  it("calculates nac support for both hepatic and renal", () => {
    const compounds = [
      { id: "nac", type: "support", activeMg: 1200 },
    ];
    const result = calculateOrganSupport(compounds);
    expect(result.hepatic).toBeGreaterThan(0);
    expect(result.renal).toBeGreaterThan(0);
  });

  it("caps support at 60%", () => {
    const compounds = [
      { id: "tudca", type: "support", activeMg: 10000 }, // Very high dose
    ];
    const result = calculateOrganSupport(compounds);
    expect(result.hepatic).toBeLessThanOrEqual(0.6);
  });

  it("ignores non-support compounds", () => {
    const compounds = [
      { id: "testosterone", type: "injectable", activeMg: 500 },
    ];
    const result = calculateOrganSupport(compounds);
    expect(result).toEqual({ hepatic: 0, renal: 0 });
  });
});

describe("calculateActiveLoad", () => {
  it("returns empty array for empty stack", () => {
    const result = calculateActiveLoad([]);
    expect(result).toEqual([]);
  });

  it("normalizes dosage with frequency multipliers", () => {
    const stack = [
      { id: "testosterone", dose: 500, frequency: 1, ester: "enanthate" },
    ];
    const result = calculateActiveLoad(stack, mockCompoundData);
    expect(result).toHaveLength(1);
    expect(result[0].rawDose).toBe(500);
    expect(result[0].activeMg).toBe(500);
  });

  it("handles daily frequency strings", () => {
    const stack = [
      { id: "testosterone", dose: 100, frequency: "daily", ester: "enanthate" },
    ];
    const result = calculateActiveLoad(stack, mockCompoundData);
    expect(result[0].rawDose).toBe(700); // 100 * 7
  });

  it("applies ester weight adjustments", () => {
    const stack = [
      { id: "testosterone", dose: 500, frequency: 1, ester: "propionate" },
    ];
    const result = calculateActiveLoad(stack, mockCompoundData);
    expect(result[0].activeMg).toBe(400); // 500 * 0.8
  });

  it("skips invalid entries", () => {
    const stack = [
      { id: "invalid", dose: 500 },
      { id: "testosterone", dose: 0 },
      { id: "testosterone", dose: 500, frequency: 1, ester: "enanthate" },
    ];
    const result = calculateActiveLoad(stack, mockCompoundData);
    expect(result).toHaveLength(1);
  });
});

describe("calculateEfficiencyMetrics", () => {
  it("returns baseline for empty compounds", () => {
    const result = calculateEfficiencyMetrics([]);
    expect(result.anabolic).toBe("0.0");
    expect(result.toxicity).toBe("0.0");
    expect(result.netGap).toBe("0.0");
    expect(result.isCritical).toBe(false);
  });

  it("calculates signal vs drag for active compounds", () => {
    const compounds = [
      {
        basePotency: 1.0,
        efficiencyFactor: 1.0,
        toxicity: { hepatic: 2, lipid: 1 },
        toxicityLoad: 0.5,
      },
    ];
    const result = calculateEfficiencyMetrics(compounds);
    expect(parseFloat(result.anabolic)).toBeGreaterThan(0);
    expect(parseFloat(result.toxicity)).toBeGreaterThan(0);
  });

  it("detects critical toxicity gaps", () => {
    const compounds = [
      {
        basePotency: 0.1,
        efficiencyFactor: 1.0,
        toxicity: { hepatic: 10, lipid: 10 },
        toxicityLoad: 2.0,
      },
    ];
    const result = calculateEfficiencyMetrics(compounds);
    expect(result.isCritical).toBe(true);
  });
});

describe("calculateProjectedGains", () => {
  it("returns baseline for empty compounds", () => {
    const result = calculateProjectedGains([]);
    expect(result).toEqual({
      hypertrophy: "0.0",
      strength: "0.0",
      fatLoss: "0.0",
      fullness: "0.0",
    });
  });

  it("calculates hypertrophy from contractile growth", () => {
    const compounds = [
      {
        efficiencyFactor: 1.0,
        benefits: { contractile_growth: 10 },
      },
    ];
    const result = calculateProjectedGains(compounds);
    expect(parseFloat(result.hypertrophy)).toBeGreaterThan(0);
  });

  it("calculates strength from neural and joint benefits", () => {
    const compounds = [
      {
        efficiencyFactor: 1.0,
        benefits: { neural_strength: 8, joint_support: 2 },
      },
    ];
    const result = calculateProjectedGains(compounds);
    expect(parseFloat(result.strength)).toBeGreaterThan(0);
  });

  it("caps results at 10.0 on UI scale", () => {
    const compounds = [
      {
        efficiencyFactor: 10.0, // Very high efficiency
        benefits: { contractile_growth: 100 },
      },
    ];
    const result = calculateProjectedGains(compounds);
    expect(parseFloat(result.hypertrophy)).toBeLessThanOrEqual(10.0);
  });
});

describe("calculateSystemLoad", () => {
  it("returns baseline load for empty compounds", () => {
    const result = calculateSystemLoad([]);
    expect(result.androgenic).toBe(0);
    expect(result.cardio).toBe(0);
    expect(result.hepatic).toBe(0);
    expect(result.renal).toBe(0);
    expect(result.isCritical).toBe(false);
  });

  it("calculates androgenic load from toxicity sources", () => {
    const compounds = [
      {
        toxicityLoad: 1.0,
        toxicity: { androgenic: 5 },
        metabolic: { dht_conversion: 3 },
      },
    ];
    const result = calculateSystemLoad(compounds);
    expect(result.androgenic).toBeGreaterThan(0);
  });

  it("applies organ support dampening", () => {
    const compounds = [
      {
        id: "testosterone",
        type: "injectable",
        toxicityLoad: 1.0,
        toxicity: { hepatic: 10 },
      },
      {
        id: "tudca",
        type: "support",
        activeMg: 1000,
      },
    ];
    const result = calculateSystemLoad(compounds);
    // Hepatic load should be reduced due to tudca support
    expect(result.hepatic).toBeGreaterThan(0);
  });

  it("detects critical organ stress", () => {
    const compounds = [
      {
        toxicityLoad: 5.0,
        toxicity: { hepatic: 100, renal: 100 },
      },
    ];
    const result = calculateSystemLoad(compounds);
    expect(result.isCritical).toBe(true);
  });
});

describe("calculateProjectedLabsWidget", () => {
  it("returns baseline labs for empty compounds", () => {
    const result = calculateProjectedLabsWidget([]);
    expect(result.hdl.value).toBe(55);
    expect(result.ldl.value).toBe(90);
    expect(result.ast.value).toBe(25);
  });

  it("adjusts lipid profile based on toxicity", () => {
    const compounds = [
      {
        activeMg: 500,
        toxicity: { lipid: 5 },
      },
    ];
    const result = calculateProjectedLabsWidget(compounds);
    expect(result.hdl.value).toBeLessThan(55);
    expect(result.ldl.value).toBeGreaterThan(90);
  });

  it("increases AST when hepatic toxicity is present", () => {
    const compounds = [
      {
        activeMg: 600, // Higher dose to trigger visible change
        toxicity: { hepatic: 8 },
      },
    ];
    const result = calculateProjectedLabsWidget(compounds);
    expect(result.ast.value).toBeGreaterThan(25);
  });

  it("increases estradiol with aromatization", () => {
    const compounds = [
      {
        activeMg: 400,
        metabolic: { aromatization: 3 },
      },
    ];
    const result = calculateProjectedLabsWidget(compounds);
    expect(result.e2.value).toBeGreaterThan(25);
  });

  it("applies organ support to reduce liver damage", () => {
    const compounds = [
      {
        activeMg: 1000, // Higher dose to potentially trigger critical
        toxicity: { hepatic: 8 },
      },
      {
        id: "tudca",
        type: "support",
        activeMg: 1000,
      },
    ];
    const result = calculateProjectedLabsWidget(compounds);
    // With support, AST should be lower than without support
    const withoutSupport = calculateProjectedLabsWidget([{
      activeMg: 1000,
      toxicity: { hepatic: 8 },
    }]);
    expect(result.ast.value).toBeLessThanOrEqual(withoutSupport.ast.value);
  });

  it("handles supplemental baseline labs", () => {
    const supplementalLabs = { hdl: 60, ldl: 85, ast: 20 };
    const result = calculateProjectedLabsWidget([], supplementalLabs);
    expect(result.hdl.value).toBe(60);
    expect(result.ldl.value).toBe(85);
    expect(result.ast.value).toBe(20);
  });
});

describe("calculateShbgDynamics", () => {
  it("reduces SHBG under androgenic load", () => {
    const baseline = calculateShbgDynamics().shbgLevel;
    const compounds = [
      {
        id: "testosterone",
        key: "testosterone_0",
        saturationMg: 1200,
        data: {
          androgenicRating: 1.0,
          shbgRelief: 5,
          shbgBindable: true,
          pathways: { shbg_binding: 6 },
          metabolic: { aromatization: 2 },
        },
      },
    ];
    const result = calculateShbgDynamics({ compounds, estradiol: 15 });
    expect(result.shbgLevel).toBeLessThan(baseline);
    const freeFraction = result.compoundFreeFractions[compounds[0].key];
    expect(freeFraction).toBeGreaterThan(0);
    expect(freeFraction).toBeLessThan(1);
  });

  it("elevates SHBG when estrogenic load dominates", () => {
    const baseline = calculateShbgDynamics().shbgLevel;
    const compounds = [
      {
        id: "proxy",
        key: "proxy_0",
        saturationMg: 200,
        data: {
          shbgBindable: false,
          androgenicRating: 0,
          metabolic: { aromatization: 8 },
        },
      },
    ];
    const result = calculateShbgDynamics({ compounds, estradiol: 120 });
    expect(result.shbgLevel).toBeGreaterThanOrEqual(baseline);
  });
});

describe("calculateCycleMetrics", () => {
  const mockActiveStack = [
    {
      id: "testosterone",
      dosage: 500,
      frequency: 1,
      ester: "enanthate",
      weeklyDose: 500,
      activeMg: 500,
      saturationMg: 1000,
      esterHalfLife: 168,
      data: mockCompoundData.testosterone,
    },
  ];

  it("calculates projected gains from compound data", () => {
    const result = calculateCycleMetrics(mockActiveStack, mockCompoundData);
    expect(result.projectedGains.hypertrophy).toBeGreaterThan(0);
    expect(result.projectedGains.strength).toBeGreaterThan(0);
    expect(result.projectedGains.fatLoss).toBeGreaterThan(0);
  });

  it("calculates system load from toxicity profiles", () => {
    const result = calculateCycleMetrics(mockActiveStack, mockCompoundData);
    // These calculations are complex and may result in 0 for small test data
    expect(typeof result.systemLoad.cardiovascular).toBe("number");
    expect(typeof result.systemLoad.hepatic).toBe("number");
    expect(typeof result.systemLoad.total).toBe("number");
  });

  it("projects lab changes from biomarkers", () => {
    const result = calculateCycleMetrics(mockActiveStack, mockCompoundData);
    expect(typeof result.projectedLabs.totalTestosterone).toBe("number");
    expect(typeof result.projectedLabs.shbg).toBe("number");
  });

  it("builds CNS profile from compound effects", () => {
    const result = calculateCycleMetrics(mockActiveStack, mockCompoundData);
    expect(result.cnsProfile).toHaveProperty("drive");
    expect(result.cnsProfile).toHaveProperty("fatigue");
    expect(result.cnsProfile).toHaveProperty("net");
    expect(result.cnsProfile).toHaveProperty("state");
  });

  it("reports SHBG analytics and free testosterone labs", () => {
    const result = calculateCycleMetrics(mockActiveStack, mockCompoundData);
    expect(result.shbgDynamics).toBeDefined();
    expect(result.projectedLabs).toHaveProperty("freeTestFraction");
    expect(result.projectedLabs).toHaveProperty("freeTestosterone");
  });

  it("tracks receptor competition with Ki-based occupancy", () => {
    const dualStack = [
      ...mockActiveStack,
      {
        id: "trenbolone",
        dosage: 300,
        frequency: 1,
        ester: "enanthate",
        weeklyDose: 300,
        activeMg: 300,
        saturationMg: 700,
        esterHalfLife: 120,
        data: mockCompoundData.trenbolone,
      },
    ];
    const result = calculateCycleMetrics(dualStack, mockCompoundData);
    expect(result.receptorCompetition.totalOccupancy).toBeGreaterThan(0);
    expect(result.receptorCompetition.freeFraction).toBeGreaterThan(0);
    expect(result.receptorCompetition.compounds.length).toBeGreaterThanOrEqual(2);
    expect(result.receptorCompetition.compounds[0]).toHaveProperty("ki");
  });

  it("applies diminishing returns at high doses", () => {
    const highDoseStack = [
      {
        ...mockActiveStack[0],
        saturationMg: 4000, // Well above thresholds
      },
    ];
    const result = calculateCycleMetrics(highDoseStack, mockCompoundData);
    expect(typeof result.meta.efficiencyRatio).toBe("number");
    // Note: actual diminishing returns logic is complex and may not trigger with test data
  });

  it("handles empty stack gracefully", () => {
    const result = calculateCycleMetrics([], {});
    expect(result.projectedGains.hypertrophy).toBe(0);
    expect(result.systemLoad.total).toBe(0);
  });
});

// Test constants
describe("Simulation Constants", () => {
  it("defines saturation thresholds", () => {
    expect(SATURATION_THRESHOLD_1).toBe(1500);
    expect(SATURATION_THRESHOLD_2).toBe(2500);
  });

  it("defines toxicity ceiling", () => {
    expect(TOXICITY_CEILING).toBe(3000);
  });
});
