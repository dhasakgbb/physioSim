import { compoundData } from '../data/compoundData';

const DEFAULT_INJECTABLE_MAX = 1200;
const DEFAULT_ORAL_MAX = 100;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const deriveDoseWindow = (compoundKey) => {
  const compound = compoundData[compoundKey];
  if (!compound) {
    return {
      min: 0,
      max: DEFAULT_INJECTABLE_MAX,
      base: 0
    };
  }

  const curve = compound.benefitCurve?.length ? compound.benefitCurve : compound.riskCurve || [];
  if (!curve.length) {
    const defaultMax = compound.type === 'oral' ? DEFAULT_ORAL_MAX : DEFAULT_INJECTABLE_MAX;
    return {
      min: 0,
      max: defaultMax,
      base: clamp(defaultMax * 0.4, 0, defaultMax)
    };
  }

  const sortedCurve = [...curve].sort((a, b) => a.dose - b.dose);
  const firstPoint = sortedCurve[0];
  const lastPoint = sortedCurve[sortedCurve.length - 1];
  const positivePoint = sortedCurve.find(point => point.dose > 0);

  const minDose = positivePoint?.dose ?? firstPoint?.dose ?? 0;
  const maxDose = lastPoint?.dose ?? (minDose + (compound.type === 'oral' ? DEFAULT_ORAL_MAX : DEFAULT_INJECTABLE_MAX) / 2);
  const baseDose = clamp(
    compound.type === 'oral' ? Math.min(maxDose, Math.max(minDose, 40)) : (minDose + maxDose) / 2,
    minDose,
    maxDose
  );

  return {
    min: Math.round(minDose),
    max: Math.round(maxDose),
    base: Math.round(baseDose)
  };
};
