import { compoundData } from "../data/compoundData.js";
import { personalizeScore } from "./personalization.js";
import {
  interactionDimensions,
  interactionPairs,
} from "../data/interactionEngineData.js";
import {
  DEFAULT_HILL_PARAMS,
  MAX_SCORE_CLAMP,
  DEFAULT_EVIDENCE_WEIGHT,
  DEFAULT_MAX_DOSE,
  DIMENSION_TYPES,
} from "../data/constants.js";

/**
 * Clamps a value between a minimum and maximum.
 * @param {number} value - The value to clamp.
 * @param {number} min - The minimum allowed value.
 * @param {number} max - The maximum allowed value.
 * @returns {number} The clamped value.
 */
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Gets the dose of the last point in a curve.
 * @param {Array<{dose: number, value: number}>} curve - The curve data points.
 * @returns {number} The dose of the last point, or 0 if empty.
 */
export const getCurveCap = (curve = []) => {
  if (!curve.length) return 0;
  return curve[curve.length - 1]?.dose ?? 0;
};

/**
 * Derives the plateau dose from a curve.
 * Uses the penultimate dose to avoid asymptote artifacts.
 * @param {Array<{dose: number, value: number}>} curve - The curve data points.
 * @returns {number} The plateau dose.
 */
export const derivePlateauDose = (curve = []) => {
  if (!curve.length) return 0;
  if (curve.length === 1) return curve[0].dose;
  // Use the penultimate dose as plateau proxy to avoid asymptote artifacts.
  return curve[Math.max(0, curve.length - 2)].dose;
};

/**
 * Gets the plateau dose for a compound's benefit curve.
 * @param {Object} compound - The compound object.
 * @returns {number} The plateau dose.
 */
export const getPlateauDose = (compound) =>
  derivePlateauDose(compound?.benefitCurve || []);

/**
 * Calculates the hard maximum dose to consider for a compound.
 * @param {Object} compound - The compound object.
 * @returns {number} The hard max dose.
 */
export const getHardMax = (compound) => {
  if (!compound) return 0;
  const plateauDose = getPlateauDose(compound);
  return Math.max(
    getCurveCap(compound.benefitCurve),
    getCurveCap(compound.riskCurve),
    plateauDose,
  );
};

/**
 * Interpolates a value on a curve for a given dose.
 * @param {Array<{dose: number, value: number, ci?: number}>} curve - The curve data points.
 * @param {number} dose - The dose to interpolate for.
 * @returns {{dose: number, value: number, ci: number}|null} The interpolated point or null if curve is empty.
 */
const interpolateCurvePoint = (curve = [], dose) => {
  if (!curve.length) return null;
  if (dose <= curve[0].dose) return curve[0];
  if (dose >= curve[curve.length - 1].dose) return curve[curve.length - 1];

  for (let i = 0; i < curve.length - 1; i++) {
    const current = curve[i];
    const next = curve[i + 1];
    if (dose >= current.dose && dose <= next.dose) {
      const ratio = (dose - current.dose) / (next.dose - current.dose);
      const value = current.value + ratio * (next.value - current.value);
      const ci =
        (current.ci ?? 0) + ratio * ((next.ci ?? 0) - (current.ci ?? 0));
      return { dose, value, ci };
    }
  }

  return curve[curve.length - 1];
};

/**
 * Evaluates the response of a compound at a given dose.
 * @param {string} compoundKey - The key of the compound.
 * @param {'benefit'|'risk'} curveType - The type of curve to evaluate.
 * @param {number} dose - The dose amount.
 * @param {Object} profile - The user profile for personalization.
 * @returns {Object} The evaluation result including value, ci, and metadata.
 */
export const evaluateCompoundResponse = (
  compoundKey,
  curveType,
  dose,
  profile,
) => {
  const compound = compoundData[compoundKey];
  if (!compound) {
    return {
      value: 0,
      ci: 0,
      meta: { missing: true, clampedDose: 0, requestedDose: dose },
    };
  }
  const curve =
    curveType === DIMENSION_TYPES.RISK
      ? compound.riskCurve
      : compound.benefitCurve;
  const plateauDose = getPlateauDose(compound);
  const hardMax = getHardMax(compound);
  const clampedDose = Math.min(Math.max(dose, 0), hardMax || dose || 0);
  const point = interpolateCurvePoint(curve, clampedDose);
  if (!point) {
    return {
      value: 0,
      ci: 0,
      meta: {
        clampedDose,
        requestedDose: dose,
        plateauDose,
        hardMax,
        nearingPlateau: false,
        beyondEvidence: dose > hardMax,
      },
    };
  }
  const personalized = personalizeScore({
    compoundKey,
    curveType,
    dose: clampedDose,
    baseValue: point.value,
    baseCi: point.ci,
    profile,
  });
  const nearingPlateau = plateauDose ? clampedDose >= plateauDose : false;
  const beyondEvidence = hardMax ? dose > hardMax : false;
  return {
    value: personalized.value,
    ci: personalized.ci ?? 0,
    meta: {
      clampedDose,
      requestedDose: dose,
      plateauDose,
      hardMax,
      nearingPlateau,
      beyondEvidence,
    },
  };
};

/**
 * Calculates the Hill equation term.
 * @param {number} dose - The dose.
 * @param {number} d50 - The dose at 50% response.
 * @param {number} n - The Hill coefficient.
 * @returns {number} The calculated term.
 */
const hillTerm = (
  dose,
  d50 = DEFAULT_HILL_PARAMS.D50,
  n = DEFAULT_HILL_PARAMS.N,
) => {
  if (dose <= 0) return 0;
  return Math.pow(dose, n) / (Math.pow(dose, n) + Math.pow(d50, n));
};

const dimensionSensitivityKey = {
  bloat: "water",
  estrogenic: "estrogen",
  bp: "cardio",
  hematocrit: "cardio",
  neuro: "neuro",
  hepatic: "cardio",
};

/**
 * Evaluates a specific dimension of interaction between two compounds.
 * @param {Object} params - The parameters.
 * @param {string} params.pairId - The interaction pair ID.
 * @param {string} params.dimensionKey - The dimension key (e.g., 'bloat').
 * @param {Object} params.doses - Map of compound keys to doses.
 * @param {Object} params.profile - User profile.
 * @param {Object} params.sensitivities - User sensitivities.
 * @param {number} params.evidenceBlend - Weight for anecdotal vs clinical evidence.
 * @returns {Object|null} The evaluation result or null if invalid.
 */
export const evaluatePairDimension = ({
  pairId,
  dimensionKey,
  doses,
  profile,
  sensitivities,
  evidenceBlend,
}) => {
  const pair = interactionPairs[pairId];
  if (!pair) return null;

  const dimension = interactionDimensions[dimensionKey];
  if (!dimension) return null;

  const [compoundA, compoundB] = pair.compounds;
  const doseA = doses[compoundA] ?? 0;
  const doseB = doses[compoundB] ?? 0;

  const weights = pair.dimensionWeights?.[dimensionKey] || {};

  const baseAResponse = evaluateCompoundResponse(
    compoundA,
    dimension.type === DIMENSION_TYPES.RISK
      ? DIMENSION_TYPES.RISK
      : DIMENSION_TYPES.BENEFIT,
    doseA,
    profile,
  );
  const baseA = (baseAResponse?.value ?? 0) * (weights[compoundA] ?? 1);

  const baseBResponse = evaluateCompoundResponse(
    compoundB,
    dimension.type === DIMENSION_TYPES.RISK
      ? DIMENSION_TYPES.RISK
      : DIMENSION_TYPES.BENEFIT,
    doseB,
    profile,
  );
  const baseB = (baseBResponse?.value ?? 0) * (weights[compoundB] ?? 1);

  const naive = baseA + baseB;

  const coeffSource =
    dimension.type === DIMENSION_TYPES.RISK ? pair.penalties : pair.synergy;
  const rawCoeff = coeffSource?.[dimensionKey] ?? 0;

  const modelParams = pair.doseModel?.params || {};
  const n = modelParams.n ?? DEFAULT_HILL_PARAMS.N;
  const d50A = modelParams.d50A ?? DEFAULT_HILL_PARAMS.D50;
  const d50B = modelParams.d50B ?? DEFAULT_HILL_PARAMS.D50;

  const doseShape = hillTerm(doseA, d50A, n) * hillTerm(doseB, d50B, n);

  const sensitivityKey = dimensionSensitivityKey[dimensionKey];
  const sensitivityMultiplier = sensitivityKey
    ? (sensitivities[sensitivityKey] ?? 1)
    : 1;

  const evidence = pair.evidence || {
    clinical: DEFAULT_EVIDENCE_WEIGHT,
    anecdote: DEFAULT_EVIDENCE_WEIGHT,
  };
  const evidenceTotal =
    (evidence.clinical ?? 0) + (evidence.anecdote ?? 0) || 1;
  const clinicalWeight = clamp(1 - evidenceBlend, 0, 1);
  const anecdoteWeight = clamp(evidenceBlend, 0, 1);
  const evidenceScalar =
    ((evidence.clinical ?? 0) * clinicalWeight +
      (evidence.anecdote ?? 0) * anecdoteWeight) /
    evidenceTotal;

  const delta = rawCoeff * doseShape * sensitivityMultiplier * evidenceScalar;
  // Increased clamp from 6 to 15 to match new high-dose ceiling
  const total =
    dimension.type === DIMENSION_TYPES.RISK
      ? clamp(naive + Math.abs(delta), 0, MAX_SCORE_CLAMP)
      : clamp(naive + delta, 0, MAX_SCORE_CLAMP);

  return {
    dimensionKey,
    type: dimension.type,
    baseA,
    baseB,
    naive,
    delta,
    total,
    doseShape,
  };
};

/**
 * Computes the total heatmap value for a pair.
 * @param {Object} params - Parameters.
 * @returns {number} The computed value.
 */
export const computeHeatmapValue = ({
  pairId,
  mode,
  profile,
  sensitivities,
  evidenceBlend,
}) => {
  const pair = interactionPairs[pairId];
  if (!pair) return 0;
  const doses = pair.defaultDoses;
  const keys = Object.keys(interactionDimensions);

  let benefitSum = 0;
  let riskSum = 0;

  keys.forEach((dimKey) => {
    const dimension = interactionDimensions[dimKey];
    if (!dimension) return;
    if (dimension.type === DIMENSION_TYPES.BENEFIT && pair.synergy?.[dimKey]) {
      const res = evaluatePairDimension({
        pairId,
        dimensionKey: dimKey,
        doses,
        profile,
        sensitivities,
        evidenceBlend,
      });
      if (res) benefitSum += Math.abs(res.delta);
    }
    if (dimension.type === DIMENSION_TYPES.RISK && pair.penalties?.[dimKey]) {
      const res = evaluatePairDimension({
        pairId,
        dimensionKey: dimKey,
        doses,
        profile,
        sensitivities,
        evidenceBlend,
      });
      if (res) riskSum += Math.abs(res.delta);
    }
  });

  if (mode === DIMENSION_TYPES.BENEFIT) return benefitSum;
  if (mode === DIMENSION_TYPES.RISK) return riskSum;
  return benefitSum + riskSum;
};

/**
 * Generates data for a primary curve series.
 * @param {Object} params - Parameters.
 * @returns {Array} Array of data points.
 */
export const generatePrimaryCurveSeries = ({
  pairId,
  dimensionKey,
  primaryCompound,
  doses,
  profile,
  sensitivities,
  evidenceBlend,
  sampleCount = 20,
}) => {
  const pair = interactionPairs[pairId];
  if (!pair) return [];
  const [compoundA, compoundB] = pair.compounds;
  const secondaryCompound =
    primaryCompound === compoundA ? compoundB : compoundA;
  const range = pair.doseRanges?.[primaryCompound] || [0, DEFAULT_MAX_DOSE];
  const [minDose, maxDose] = range;
  const step = (maxDose - minDose) / sampleCount;

  const data = [];
  for (let dose = minDose; dose <= maxDose + 1; dose += step) {
    const pointDoses = {
      ...doses,
      [primaryCompound]: clamp(dose, minDose, maxDose),
      [secondaryCompound]: doses[secondaryCompound],
    };
    const res = evaluatePairDimension({
      pairId,
      dimensionKey,
      doses: pointDoses,
      profile,
      sensitivities,
      evidenceBlend,
    });
    if (!res) continue;
    const dimension = interactionDimensions[dimensionKey];
    const basePrimary =
      evaluateCompoundResponse(
        primaryCompound,
        dimension?.type === DIMENSION_TYPES.RISK
          ? DIMENSION_TYPES.RISK
          : DIMENSION_TYPES.BENEFIT,
        pointDoses[primaryCompound],
        profile,
      )?.value ?? 0;
    data.push({
      dose: Math.round(pointDoses[primaryCompound]),
      basePrimary,
      naive: res.naive,
      total: res.total,
    });
  }
  return data;
};

const aggregateScore = ({
  pairId,
  doses,
  profile,
  sensitivities,
  evidenceBlend,
}) => {
  const pair = interactionPairs[pairId];
  const dimensionKeys = [
    ...Object.keys(pair.synergy || {}),
    ...Object.keys(pair.penalties || {}),
  ];

  let benefitScore = 0;
  let riskScore = 0;

  dimensionKeys.forEach((key) => {
    const dimension = interactionDimensions[key];
    if (!dimension) return;
    const res = evaluatePairDimension({
      pairId,
      dimensionKey: key,
      doses,
      profile,
      sensitivities,
      evidenceBlend,
    });
    if (!res) return;
    if (dimension.type === DIMENSION_TYPES.BENEFIT) {
      benefitScore += res.total;
    } else {
      riskScore += res.total;
    }
  });

  return {
    score: benefitScore - riskScore,
    benefit: benefitScore,
    risk: riskScore,
  };
};

/**
 * Builds surface data for 3D visualization or heatmaps.
 * @param {Object} params - Parameters.
 * @returns {Array} Array of data points.
 */
export const buildSurfaceData = ({
  pairId,
  profile,
  sensitivities,
  evidenceBlend,
  steps = 12,
}) => {
  const pair = interactionPairs[pairId];
  if (!pair) return [];
  const [compoundA, compoundB] = pair.compounds;
  const [minA, maxA] = pair.doseRanges?.[compoundA] || [0, DEFAULT_MAX_DOSE];
  const [minB, maxB] = pair.doseRanges?.[compoundB] || [0, DEFAULT_MAX_DOSE];
  const stepA = (maxA - minA) / steps;
  const stepB = (maxB - minB) / steps;

  const data = [];
  for (let a = minA; a <= maxA + 1; a += stepA) {
    for (let b = minB; b <= maxB + 1; b += stepB) {
      const doses = {
        [compoundA]: Math.round(a),
        [compoundB]: Math.round(b),
      };
      const aggregate = aggregateScore({
        pairId,
        doses,
        profile,
        sensitivities,
        evidenceBlend,
      });
      data.push({
        [compoundA]: Math.round(a),
        [compoundB]: Math.round(b),
        score: aggregate.score,
        benefit: aggregate.benefit,
        risk: aggregate.risk,
      });
    }
  }
  return data;
};
