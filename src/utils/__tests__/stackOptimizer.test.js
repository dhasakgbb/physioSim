import { describe, it, expect } from 'vitest';
import { generateStackOptimizerResults, generateCustomStackResults } from '../../utils/stackOptimizer';
import { defaultProfile } from '../../utils/personalization';

describe('stackOptimizer', () => {
  it('returns ranked templates', () => {
    const results = generateStackOptimizerResults({ profile: defaultProfile });
    expect(results.length).toBeGreaterThan(0);
    for (let i = 1; i < results.length; i += 1) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it('optimizes a custom combo definition', () => {
    const combo = {
      id: 'custom-test',
      label: 'Test + Primo',
      compounds: ['testosterone', 'primobolan'],
      doseRanges: {
        testosterone: [300, 600],
        primobolan: [400, 700]
      },
      defaultDoses: {
        testosterone: 400,
        primobolan: 500
      },
      steps: 2,
      goal: 'lean_mass'
    };
    const results = generateCustomStackResults({ combo, profile: defaultProfile });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].compounds).toEqual(['testosterone', 'primobolan']);
  });
});
