import { describe, it, expect } from 'vitest';
import { 
  getInteraction, 
  getInteractionScore, 
  calculateStackSynergy,
  getCompoundInteractions 
} from '../data/interactionMatrix';
import { getAncillaryProtocol } from '../data/sideFxAndAncillaries';
import { compoundData } from '../data/compoundData';

/**
 * Test Suite for Interaction Matrix and Ancillary Protocol Generation
 * Tests scoring, synergy calculations, and protocol generation logic
 */

describe('Interaction Matrix Tests', () => {
  describe('getInteraction', () => {
    it('should return interaction data for known pairs', () => {
      const interaction = getInteraction('testosterone', 'npp');
      expect(interaction).toBeDefined();
      expect(interaction.description).toBeDefined();
      expect(interaction.synergy).toBeDefined();
      expect(interaction.rating).toBeDefined();
    });

    it('should handle reversed compound order', () => {
      const interaction1 = getInteraction('testosterone', 'npp');
      const interaction2 = getInteraction('npp', 'testosterone');
      expect(interaction1).toEqual(interaction2);
    });

    it('should return null for unknown pairs', () => {
      const interaction = getInteraction('unknown1', 'unknown2');
      expect(interaction).toBeNull();
    });

    it('should return null for same compound pair', () => {
      const interaction = getInteraction('testosterone', 'testosterone');
      expect(interaction).toBeNull();
    });
  });

  describe('getInteractionScore', () => {
    it('should return heatmap score for known pairs', () => {
      const score = getInteractionScore('testosterone', 'npp');
      expect(score).toBeDefined();
      expect(score.color).toBeDefined();
      expect(score.symbol).toBeDefined();
      expect(score.label).toBeDefined();
    });

    it('should return compatible score for unknown pairs', () => {
      const score = getInteractionScore('unknown1', 'unknown2');
      expect(score.label).toBe('Compatible');
      expect(score.symbol).toBe('~');
    });

    it('should classify ratings correctly', () => {
      // Test that excellent rating returns green hex color
      const testInteraction = getInteraction('testosterone', 'npp');
      if (testInteraction && testInteraction.rating === 'excellent') {
        const score = getInteractionScore('testosterone', 'npp');
        expect(score.color).toBe('#00AA00');
        expect(score.label).toBe('Excellent Synergy');
      }
    });
  });

  describe('calculateStackSynergy', () => {
    it('should return zero synergy for single compound', () => {
      const synergy = calculateStackSynergy(['testosterone']);
      expect(synergy.benefitSynergy).toBe(0);
      expect(synergy.riskSynergy).toBe(0);
    });

    it('should calculate synergy for two compounds', () => {
      const synergy = calculateStackSynergy(['testosterone', 'npp']);
      expect(typeof synergy.benefitSynergy).toBe('number');
      expect(typeof synergy.riskSynergy).toBe('number');
    });

    it('should accumulate synergy for multiple compounds', () => {
      const synergy = calculateStackSynergy(['testosterone', 'npp', 'masteron']);
      expect(typeof synergy.benefitSynergy).toBe('number');
      expect(typeof synergy.riskSynergy).toBe('number');
    });

    it('should ignore unknown compound pairs', () => {
      const synergy = calculateStackSynergy(['testosterone', 'unknown']);
      expect(synergy.benefitSynergy).toBe(0);
      expect(synergy.riskSynergy).toBe(0);
    });

    it('should handle empty array', () => {
      const synergy = calculateStackSynergy([]);
      expect(synergy.benefitSynergy).toBe(0);
      expect(synergy.riskSynergy).toBe(0);
    });

    it('should apply negative synergy correctly', () => {
      // Test a known incompatible pair if it exists
      const synergy = calculateStackSynergy(['trenbolone', 'npp']);
      // Both are progestins, so should have some risk synergy
      expect(synergy.riskSynergy).toBeGreaterThan(0);
    });
  });

  describe('getCompoundInteractions', () => {
    it('should return all interactions for a compound', () => {
      const interactions = getCompoundInteractions('testosterone');
      expect(typeof interactions).toBe('object');
      expect(Object.keys(interactions).length).toBeGreaterThan(0);
    });

    it('should return empty object for unknown compound', () => {
      const interactions = getCompoundInteractions('unknown');
      expect(interactions).toEqual({});
    });

    it('should include compound data in results', () => {
      const interactions = getCompoundInteractions('testosterone');
      Object.entries(interactions).forEach(([otherCompound, data]) => {
        expect(otherCompound).toBeDefined();
        expect(data.description).toBeDefined();
        expect(data.synergy).toBeDefined();
        expect(data.rating).toBeDefined();
      });
    });
  });
});

describe('Ancillary Protocol Tests', () => {
  describe('getAncillaryProtocol', () => {
    it('should return protocol for testosterone-only stack', () => {
      const stack = [
        { compound: 'testosterone', dose: 500, type: 'injectable', category: 'base' }
      ];
      const protocol = getAncillaryProtocol(stack);
      
      expect(protocol).toBeDefined();
      expect(protocol.essential).toBeDefined();
      expect(protocol.recommended).toBeDefined();
      expect(protocol.optional).toBeDefined();
      expect(protocol.monitoring).toBeDefined();
      expect(protocol.totalWeeklyCost).toBeGreaterThan(0);
    });

    it('should require AI for high-dose aromatizing compounds', () => {
      const stack = [
        { compound: 'testosterone', dose: 750, type: 'injectable', category: 'base' }
      ];
      const protocol = getAncillaryProtocol(stack);
      
      const hasAI = protocol.essential.some(item => 
        item.drug.includes('Anastrozole') || item.drug.includes('Aromasin')
      ) || protocol.recommended.some(item => 
        item.drug.includes('Anastrozole') || item.drug.includes('Aromasin')
      );
      
      expect(hasAI).toBe(true);
    });

    it('should require dopamine agonist for progestins', () => {
      const stack = [
        { compound: 'testosterone', dose: 500, type: 'injectable', category: 'base' },
        { compound: 'npp', dose: 400, type: 'injectable', category: 'progestin' }
      ];
      const protocol = getAncillaryProtocol(stack);
      
      const hasCaber = protocol.essential.some(item => 
        item.drug.includes('Cabergoline')
      ) || protocol.recommended.some(item => 
        item.drug.includes('Cabergoline')
      );
      
      expect(hasCaber).toBe(true);
    });

    it('should require liver support for oral compounds', () => {
      const stack = [
        { compound: 'testosterone', dose: 500, type: 'injectable', category: 'base' },
        { compound: 'dianabol', dose: 50, type: 'oral', category: 'oral' }
      ];
      const protocol = getAncillaryProtocol(stack);
      
      const hasLiverSupport = protocol.essential.some(item => 
        item.drug.includes('TUDCA') || item.drug.includes('NAC')
      ) || protocol.recommended.some(item => 
        item.drug.includes('TUDCA') || item.drug.includes('NAC')
      );
      
      expect(hasLiverSupport).toBe(true);
    });

    it('should scale costs properly', () => {
      const smallStack = [
        { compound: 'testosterone', dose: 250, type: 'injectable', category: 'base' }
      ];
      
      const largeStack = [
        { compound: 'testosterone', dose: 750, type: 'injectable', category: 'base' },
        { compound: 'npp', dose: 400, type: 'injectable', category: 'progestin' },
        { compound: 'masteron', dose: 400, type: 'injectable', category: 'androgen' }
      ];
      
      const smallProtocol = getAncillaryProtocol(smallStack);
      const largeProtocol = getAncillaryProtocol(largeStack);
      
      expect(largeProtocol.totalWeeklyCost).toBeGreaterThan(smallProtocol.totalWeeklyCost);
    });

    it('should include blood work recommendations', () => {
      const stack = [
        { compound: 'testosterone', dose: 500, type: 'injectable', category: 'base' }
      ];
      const protocol = getAncillaryProtocol(stack);
      
      expect(protocol.monitoring.length).toBeGreaterThan(0);
      protocol.monitoring.forEach(item => {
        expect(item.test).toBeDefined();
        expect(item.frequency).toBeDefined();
        expect(item.targets).toBeDefined();
        expect(item.action).toBeDefined();
      });
    });

    it('should handle empty stack', () => {
      const protocol = getAncillaryProtocol([]);
      
      expect(protocol.essential.length).toBe(0);
      expect(protocol.recommended.length).toBeGreaterThanOrEqual(0);
      expect(protocol.totalWeeklyCost).toBeGreaterThanOrEqual(0);
    });

    it('should not duplicate ancillaries', () => {
      const stack = [
        { compound: 'testosterone', dose: 500, type: 'injectable', category: 'base' },
        { compound: 'eq', dose: 600, type: 'injectable', category: 'base' }
      ];
      const protocol = getAncillaryProtocol(stack);
      
      const allDrugs = [
        ...protocol.essential.map(item => item.drug),
        ...protocol.recommended.map(item => item.drug),
        ...protocol.optional.map(item => item.drug)
      ];
      
      const uniqueDrugs = new Set(allDrugs);
      expect(allDrugs.length).toBe(uniqueDrugs.size);
    });
  });
});

describe('Data Integrity Tests', () => {
  describe('All compounds have interaction data', () => {
    it('should have at least one interaction for each injectable compound', () => {
      const injectables = Object.keys(compoundData).filter(
        key => compoundData[key].type === 'injectable'
      );
      
      injectables.forEach(compound => {
        const interactions = getCompoundInteractions(compound);
        expect(Object.keys(interactions).length).toBeGreaterThan(0);
      });
    });

    it('should have interaction ratings in valid range', () => {
      const validRatings = ['excellent', 'good', 'compatible', 'caution', 'dangerous', 'forbidden'];
      const allCompounds = Object.keys(compoundData);
      
      allCompounds.forEach(comp1 => {
        allCompounds.forEach(comp2 => {
          if (comp1 !== comp2) {
            const interaction = getInteraction(comp1, comp2);
            if (interaction) {
              expect(validRatings).toContain(interaction.rating);
            }
          }
        });
      });
    });
  });

  describe('Synergy values are reasonable', () => {
    it('should have synergy values between -1 and 1', () => {
      const allCompounds = Object.keys(compoundData);
      
      allCompounds.forEach(comp1 => {
        allCompounds.forEach(comp2 => {
          if (comp1 !== comp2) {
            const interaction = getInteraction(comp1, comp2);
            if (interaction) {
              expect(interaction.synergy.benefit).toBeGreaterThanOrEqual(-1);
              expect(interaction.synergy.benefit).toBeLessThanOrEqual(1);
              expect(interaction.synergy.risk).toBeGreaterThanOrEqual(-1);
              expect(interaction.synergy.risk).toBeLessThanOrEqual(1);
            }
          }
        });
      });
    });

    it('should calculate synergy values for known stacks', () => {
      // Test + Tren has positive benefit synergy (0.1)
      const synergy = calculateStackSynergy(['testosterone', 'trenbolone']);
      expect(synergy.benefitSynergy).toBeGreaterThan(0);
      expect(synergy.riskSynergy).toBeGreaterThan(0);
    });

    it('should have risk synergy for known problematic stacks', () => {
      // Tren + NPP (two progestins) should have increased risk
      const synergy = calculateStackSynergy(['trenbolone', 'npp']);
      expect(synergy.riskSynergy).toBeGreaterThan(0);
    });
  });

  describe('Ancillary protocol data consistency', () => {
    it('should have consistent cost data', () => {
      const stack = [
        { compound: 'testosterone', dose: 500, type: 'injectable', category: 'base' }
      ];
      const protocol = getAncillaryProtocol(stack);
      
      [...protocol.essential, ...protocol.recommended, ...protocol.optional].forEach(item => {
        expect(item.cost).toBeGreaterThanOrEqual(0);
      });
      
      expect(protocol.totalWeeklyCost).toBeGreaterThan(0);
    });

    it('should provide dosing information for all ancillaries', () => {
      const stack = [
        { compound: 'testosterone', dose: 500, type: 'injectable', category: 'base' },
        { compound: 'npp', dose: 400, type: 'injectable', category: 'progestin' }
      ];
      const protocol = getAncillaryProtocol(stack);
      
      [...protocol.essential, ...protocol.recommended, ...protocol.optional].forEach(item => {
        expect(item.dosing).toBeDefined();
        expect(item.dosing.length).toBeGreaterThan(0);
      });
    });

    it('should structure ancillary data correctly', () => {
      const stack = [
        { compound: 'testosterone', dose: 500, type: 'injectable', category: 'base' }
      ];
      const protocol = getAncillaryProtocol(stack);
      
      [...protocol.essential, ...protocol.recommended, ...protocol.optional].forEach(item => {
        // Each ancillary should have required fields
        expect(typeof item.drug).toBe('string');
        expect(item.drug.length).toBeGreaterThan(0);
        expect(typeof item.dosing).toBe('string');
        expect(item.dosing.length).toBeGreaterThan(0);
        expect(typeof item.purpose).toBe('string');
        expect(item.purpose.length).toBeGreaterThan(0);
        expect(typeof item.cost).toBe('number');
        expect(item.cost).toBeGreaterThanOrEqual(0);
      });
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  it('should handle undefined compounds gracefully', () => {
    expect(() => getInteraction(undefined, 'testosterone')).not.toThrow();
    expect(() => getInteractionScore(null, 'testosterone')).not.toThrow();
  });

  it('should handle null stack in ancillary protocol', () => {
    expect(() => getAncillaryProtocol(null)).not.toThrow();
  });

  it('should handle extremely high doses', () => {
    const stack = [
      { compound: 'testosterone', dose: 10000, type: 'injectable', category: 'base' }
    ];
    const protocol = getAncillaryProtocol(stack);
    expect(protocol).toBeDefined();
    expect(protocol.essential.length).toBeGreaterThan(0);
  });

  it('should handle zero dose', () => {
    const stack = [
      { compound: 'testosterone', dose: 0, type: 'injectable', category: 'base' }
    ];
    const protocol = getAncillaryProtocol(stack);
    expect(protocol).toBeDefined();
  });

  it('should handle mixed injectable and oral stack', () => {
    const stack = [
      { compound: 'testosterone', dose: 500, type: 'injectable', category: 'base' },
      { compound: 'anavar', dose: 50, type: 'oral', category: 'oral' }
    ];
    const protocol = getAncillaryProtocol(stack);
    
    expect(protocol).toBeDefined();
    expect(protocol.essential.length).toBeGreaterThan(0);
    expect(protocol.monitoring.length).toBeGreaterThan(0);
  });
});
