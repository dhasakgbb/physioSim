import { describe, it, expect } from 'vitest';
import { calculateFrontLoad, simulateSerum } from '../pharmacokinetics';
import { compoundData } from '../../data/compoundData';

describe('Pharmacokinetics Engine', () => {
  describe('calculateFrontLoad', () => {
    it('should calculate correct front-load for Testosterone Enanthate', () => {
      // Test E: HL = 4.5 days (108 hours)
      // Frequency: 3.5 days (E3.5D)
      // k = ln(2) / 4.5 = 0.154
      // tau = 3.5
      // R = 1 / (1 - e^(-0.154 * 3.5)) = 1 / (1 - 0.58) = 1 / 0.42 = ~2.38
      // Dose per pin = 250mg (500mg/wk)
      // Front Load = 250 * 2.38 = ~595mg
      
      const result = calculateFrontLoad('testosterone', 500, 3.5);
      expect(result).toBeDefined();
      expect(result.compound).toBe('testosterone');
      expect(result.maintenanceDose).toBeCloseTo(250, 0);
      // Allow some floating point variance, but check range
      expect(result.frontLoadDose).toBeGreaterThan(500); 
      expect(result.frontLoadDose).toBeLessThan(700);
    });

    it('should return null for invalid compound', () => {
      const result = calculateFrontLoad('invalid_compound', 500);
      expect(result).toBeNull();
    });
  });

  describe('simulateSerum', () => {
    it('should generate data points for duration', () => {
      const stack = [{ compound: 'testosterone', dose: 500, frequency: 3.5 }];
      const data = simulateSerum(stack, 4); // 4 weeks
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].hour).toBe(0);
      expect(data[data.length - 1].hour).toBe(4 * 7 * 24);
    });

    it('should show accumulation over time for long esters', () => {
      const stack = [{ compound: 'testosterone', dose: 500, frequency: 3.5 }];
      const data = simulateSerum(stack, 12);
      
      // Level at week 1 should be lower than week 6
      // Find approximate points
      const week1Level = data.find(d => Math.abs(d.day - 7) < 0.2).total;
      const week6Level = data.find(d => Math.abs(d.day - 42) < 0.2).total;
      
      expect(week6Level).toBeGreaterThan(week1Level);
    });
  });
});
