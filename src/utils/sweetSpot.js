import { compoundData } from '../data/compoundData';
import { personalizeScore } from './personalization';

const interpolatePoint = (curve, dose) => {
  if (!curve || !curve.length) return null;
  const exact = curve.find(point => point.dose === dose);
  if (exact) return exact;

  for (let i = 0; i < curve.length - 1; i++) {
    const current = curve[i];
    const next = curve[i + 1];
    if (dose >= current.dose && dose <= next.dose) {
      const ratio = (dose - current.dose) / (next.dose - current.dose);
      const value = current.value + ratio * (next.value - current.value);
      const ci = (current.ci ?? 0) + ratio * ((next.ci ?? 0) - (current.ci ?? 0));
      return { dose, value, ci };
    }
  }

  if (dose < curve[0].dose) return curve[0];
  return curve[curve.length - 1];
};

export const buildPersonalizedCurvePoints = (compoundKey, profile) => {
  const compound = compoundData[compoundKey];
  if (!compound) return [];

  const doses = new Set();
  compound.benefitCurve.forEach(point => doses.add(point.dose));
  compound.riskCurve.forEach(point => doses.add(point.dose));
  const sortedDoses = Array.from(doses).sort((a, b) => a - b);

  return sortedDoses.map(dose => {
    const benefitPoint = interpolatePoint(compound.benefitCurve, dose);
    const riskPoint = interpolatePoint(compound.riskCurve, dose);
    if (!benefitPoint || !riskPoint) return null;

    const benefit = personalizeScore({
      compoundKey,
      curveType: 'benefit',
      dose,
      baseValue: benefitPoint.value,
      baseCi: benefitPoint.ci,
      profile
    });

    const risk = personalizeScore({
      compoundKey,
      curveType: 'risk',
      dose,
      baseValue: riskPoint.value,
      baseCi: riskPoint.ci,
      profile
    });

    return {
      dose,
      benefit: benefit.value,
      risk: risk.value
    };
  }).filter(Boolean);
};

export const findSweetSpotRange = (compoundKey, profile) => {
  const points = buildPersonalizedCurvePoints(compoundKey, profile);
  if (points.length < 2) return null;

  let maxNet = -Infinity;
  let bestIndex = 0;

  points.forEach((point, index) => {
    const net = point.benefit - point.risk;
    point.net = net;
    if (net > maxNet) {
      maxNet = net;
      bestIndex = index;
    }
  });

  if (!Number.isFinite(maxNet)) return null;

  const tolerance = Math.max(0.3, maxNet * 0.15);
  const threshold = maxNet - tolerance;
  const eligiblePoints = points.filter(point => point.net >= threshold);

  const optimalStart = Math.min(...eligiblePoints.map(point => point.dose));
  const optimalEnd = Math.max(...eligiblePoints.map(point => point.dose));

  let warningDose = null;
  for (let i = 1; i < points.length; i++) {
    const deltaBenefit = points[i].benefit - points[i - 1].benefit;
    const deltaRisk = points[i].risk - points[i - 1].risk;
    if (deltaRisk - deltaBenefit > 0.05) {
      warningDose = points[i].dose;
      break;
    }
  }

  const compound = compoundData[compoundKey];

  return {
    compoundKey,
    name: compound?.name ?? compoundKey,
    abbreviation: compound?.abbreviation ?? compoundKey,
    unit: compound?.type === 'oral' ? 'mg/day' : 'mg/week',
    optimalRange: [optimalStart, optimalEnd],
    warningDose,
    peakDose: points[bestIndex].dose,
    peakNet: maxNet
  };
};
