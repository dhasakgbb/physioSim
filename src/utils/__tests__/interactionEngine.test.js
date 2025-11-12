import { describe, it, expect } from 'vitest';
import { evaluatePairDimension, generatePrimaryCurveSeries } from '../../utils/interactionEngine';
import { defaultProfile } from '../../utils/personalization';

const baseSensitivities = {
  estrogen: 1,
  water: 1,
  neuro: 1,
  cardio: 1
};

describe('interactionEngine', () => {
  it('evaluates pair dimension with personalization applied', () => {
    const result = evaluatePairDimension({
      pairId: 'testosterone_eq',
      dimensionKey: 'anabolic',
      doses: { testosterone: 400, eq: 500 },
      profile: defaultProfile,
      sensitivities: baseSensitivities,
      evidenceBlend: 0.4
    });

    expect(result).toBeTruthy();
    expect(result.total).toBeGreaterThan(0);
    expect(result).toHaveProperty('delta');
  });

  it('generates primary curve series for charting', () => {
    const data = generatePrimaryCurveSeries({
      pairId: 'testosterone_eq',
      dimensionKey: 'anabolic',
      primaryCompound: 'testosterone',
      doses: { testosterone: 300, eq: 500 },
      profile: defaultProfile,
      sensitivities: baseSensitivities,
      evidenceBlend: 0.3
    });

    expect(data.length).toBeGreaterThan(3);
    expect(data[0]).toHaveProperty('total');
    expect(data[0]).toHaveProperty('naive');
  });
});
