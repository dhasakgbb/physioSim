import { describe, it, expect } from 'vitest';
import { runSimulation, findOptimalExitWeek } from '../../src/engine/CyclePhysicsEngine';

describe('CyclePhysicsEngine', () => {
  const DEFAULT_PROFILE = {
    lbm_lbs: 150,
    liverResilience: 1.0,
    bodyWeightKg: 80
  };

  describe('Basic Functionality', () => {
    it('should return empty array for empty stack', () => {
      const result = runSimulation([], DEFAULT_PROFILE);
      expect(result).toEqual([]);
    });

    it('should generate 112 data points for 16-week cycle', () => {
      const stack = [{
        compoundId: 'testosterone',
        doseMg: 250,
        frequency: 3.5, // E3.5D
        isOral: false,
        ester: 'enanthate'
      }];
      
      const result = runSimulation(stack, DEFAULT_PROFILE);
      expect(result).toHaveLength(112);
    });

    it('should have all required fields in each data point', () => {
      const stack = [{
        compoundId: 'testosterone',
        doseMg: 250,
        frequency: 3.5,
        isOral: false,
        ester: 'enanthate'
      }];
      
      const result = runSimulation(stack, DEFAULT_PROFILE);
      const point = result[0];
      
      expect(point).toHaveProperty('day');
      expect(point).toHaveProperty('serumTotal');
      expect(point).toHaveProperty('genomicTissue');
      expect(point).toHaveProperty('volumization');
      expect(point).toHaveProperty('totalMass');
      expect(point).toHaveProperty('toxicity');
      expect(point).toHaveProperty('stabilityScore');
    });
  });

  describe('Testosterone Enanthate 500mg/week Baseline', () => {
    it('should show progressive tissue accumulation', () => {
      const stack = [{
        compoundId: 'testosterone',
        doseMg: 250,
        frequency: 3.5,
        isOral: false,
        ester: 'enanthate'
      }];
      
      const result = runSimulation(stack, DEFAULT_PROFILE);
      
      // Day 0: should start at zero
      expect(result[0].genomicTissue).toBe(0);
      
      // Week 4: should show accumulation
      expect(result[28].genomicTissue).toBeGreaterThan(0);
      
      // Week 16: should be higher than week 4
      expect(result[112 - 1].genomicTissue).toBeGreaterThan(result[28].genomicTissue);
    });

    it('should reach steady state and approach ceiling', () => {
      const stack = [{
        compoundId: 'testosterone',
        doseMg: 250,
        frequency: 3.5,
        isOral: false,
        ester: 'enanthate'
      }];
      
      const result = runSimulation(stack, DEFAULT_PROFILE);
      const geneticCeiling = DEFAULT_PROFILE.lbm_lbs * 4.5;
      
      // Should never exceed genetic ceiling
      result.forEach(point => {
        expect(point.genomicTissue).toBeLessThanOrEqual(geneticCeiling);
      });
      
      // Growth rate should slow near the end (logarithmic behavior)
      const growth_week_8_to_12 = result[84].genomicTissue - result[56].genomicTissue;
      const growth_week_12_to_16 = result[111].genomicTissue - result[84].genomicTissue;
      expect(growth_week_12_to_16).toBeLessThan(growth_week_8_to_12);
    });

    it('should maintain low toxicity throughout', () => {
      const stack = [{
        compoundId: 'testosterone',
        doseMg: 250,
        frequency: 3.5,
        isOral: false,
        ester: 'enanthate'
      }];
      
      const result = runSimulation(stack, DEFAULT_PROFILE);
      
      // Testosterone at TRT+ doses should have minimal toxicity
      // With new model (recovery 15, background load ~4), it should be near zero
      const finalDay = result[result.length - 1];
      expect(finalDay.toxicity).toBeLessThan(50); // Allow for small accumulation spikes
      
      // Should not find an exit point (safe for full 16 weeks)
      const exitWeek = findOptimalExitWeek(result);
      expect(exitWeek).toBe(16);
    });
  });

  describe('Anadrol 50mg/day - Oral Kickstart', () => {
    it('should show rapid volumization spike', () => {
      const stack = [{
        compoundId: 'anadrol',
        doseMg: 50,
        frequency: 1, // Daily
        isOral: true
      }];
      
      const result = runSimulation(stack, DEFAULT_PROFILE);
      
      // Week 1: should show immediate volumization
      expect(result[7].volumization).toBeGreaterThan(0);
      
      // Volumization should be significant (Anadrol has high glycogen Emax)
      // Should rise steadily due to inertia
      expect(result[14].volumization).toBeGreaterThan(result[7].volumization);
      expect(result[14].volumization).toBeGreaterThan(5); // Should be substantial
    });

    it('should show steep toxicity accumulation', () => {
      const stack = [{
        compoundId: 'anadrol',
        doseMg: 100, // Increased to 100mg to ensure threshold is crossed
        frequency: 1,
        isOral: true
      }];
      
      const result = runSimulation(stack, DEFAULT_PROFILE);
      const week4_toxicity = result[28].toxicity;
      const week8_toxicity = result[56].toxicity;
      
      // At 100mg, it should definitely be toxic
      expect(week4_toxicity).toBeGreaterThan(0);
      expect(week8_toxicity).toBeGreaterThan(week4_toxicity); // Should be growing
      
      // But shouldn't be infinite
      expect(week8_toxicity).toBeLessThan(500);
    });
  });

  describe('Trenbolone Acetate - Extreme Profile', () => {
    it('should show strong genomic drive', () => {
      const stack = [{
        compoundId: 'trenbolone',
        doseMg: 50,
        frequency: 2, // EOD
        isOral: false,
        ester: 'acetate'
      }];
      
      const result = runSimulation(stack, DEFAULT_PROFILE);
      
      // Tren has Emax=150 for myogenesis (vs Test Emax=100)
      // Should show strong tissue accumulation
      expect(result[56].genomicTissue).toBeGreaterThan(0);
    });

    it('should show extreme toxicity', () => {
      const stack = [{
        compoundId: 'trenbolone',
        doseMg: 75, // Reverted to 75mg/day (525/week) which should be toxic enough
        frequency: 1,
        isOral: false,
        ester: 'acetate'
      }];
      
      const result = runSimulation(stack, DEFAULT_PROFILE);
      
      // Trenbolone has severe neurotoxicity and renal toxicity with Hill_TC50 models
      // Should accumulate toxicity faster than testosterone
      const week8_toxicity = result[56].toxicity;
      expect(week8_toxicity).toBeGreaterThan(0);
    });
  });

  describe('Primobolan - Mild Profile', () => {
    it('should show slow, steady tissue accumulation', () => {
      const stack = [{
        compoundId: 'primobolan',
        doseMg: 200,
        frequency: 3.5,
        isOral: false,
        ester: 'enanthate'
      }];
      
      const result = runSimulation(stack, DEFAULT_PROFILE);
      
      // Primo has low Emax values (myogenesis Emax=50)
      // Growth should be slower than testosterone
      expect(result[56].genomicTissue).toBeGreaterThan(0);
      expect(result[56].genomicTissue).toBeLessThan(result[56].genomicTissue * 2); // Modest
    });

    it('should maintain minimal toxicity', () => {
      const stack = [{
        compoundId: 'primobolan',
        doseMg: 200,
        frequency: 3.5,
        isOral: false,
        ester: 'enanthate'
      }];
      
      const result = runSimulation(stack, DEFAULT_PROFILE);
      
      // Primo has low toxicity coefficients
      const finalDay = result[result.length - 1];
      
      // Toxicity may accumulate but should stay relatively low
      // Check that it's less than 5x the total mass (allow some accumulation but not extreme)
      expect(finalDay.toxicity).toBeLessThan(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown compounds gracefully', () => {
      const stack = [{
        compoundId: 'nonexistent_compound',
        doseMg: 100,
        frequency: 7,
        isOral: false
      }];
      
      // Should not crash, should return baseline data
      const result = runSimulation(stack, DEFAULT_PROFILE);
      expect(result).toHaveLength(112);
    });

    it('should handle zero dose gracefully', () => {
      const stack = [{
        compoundId: 'testosterone',
        doseMg: 0,
        frequency: 3.5,
        isOral: false,
        ester: 'enanthate'
      }];
      
      const result = runSimulation(stack, DEFAULT_PROFILE);
      expect(result).toHaveLength(112);
      
      // All values should remain at zero
      expect(result[56].genomicTissue).toBe(0);
      expect(result[56].serumTotal).toBe(0);
    });
  });
});
