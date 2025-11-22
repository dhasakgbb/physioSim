import { GRAPH_TIERS, type GraphTier } from "../../data/constants.js";

const DISPLAY_CEILING = 92;

const ANABOLIC_ALPHA = 0.14;
const ANABOLIC_DECAY = 0.98;
const TOXICITY_ALPHA = 0.12;
const TOXICITY_DECAY = 0.96;
const TOXICITY_EXPONENT = 1.1;
const EFFICIENCY_HIGH = 0.8;
const EFFICIENCY_MEDIUM = 0.2;

export interface CycleRailInputPoint {
  day: number;
  anabolic: number;
  toxicityRaw: number;
  doseEfficiency?: number;
  naturalAxis?: number;
}

export interface CycleRailMeta {
  scaleLabel: string;
  scaleMax: number;
}

export interface CycleRailOutputPoint {
  day: number;
  anabolic: number;
  toxicity: number;
  netGap: number;
  riskRatio: number;
  rawAnabolic: number;
  rawToxicity: number;
  cumulativeMomentum: number;
  cumulativeLoad: number;
  naturalPercent: number;
  naturalScaled: number;
  doseEfficiency: number;
  efficiencyZone: "low" | "medium" | "high";
  efficiencyHighFill: number;
  efficiencyMediumFill: number;
  efficiencyLowFill: number;
}

export interface CycleRailSeriesResult {
  points: CycleRailOutputPoint[];
  meta: CycleRailMeta;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const pickActiveTier = (peak: number): GraphTier => {
  const defaultTier = GRAPH_TIERS[GRAPH_TIERS.length - 1];
  if (!Number.isFinite(peak) || peak <= 0) {
    return defaultTier;
  }
  return (
    GRAPH_TIERS.find((tier: GraphTier) => peak < tier.threshold) ?? defaultTier
  );
};

export const computeCycleRailSeries = (
  dailyData: CycleRailInputPoint[] = [],
): CycleRailSeriesResult => {
  const safeData = Array.isArray(dailyData) ? dailyData : [];
  const peakLoad = safeData.reduce((max, day) => {
    const anabolic = Number.isFinite(day?.anabolic) ? day.anabolic : 0;
    const tox = Number.isFinite(day?.toxicityRaw) ? day.toxicityRaw : 0;
    return Math.max(max, anabolic, tox);
  }, 0);

  const tier = pickActiveTier(peakLoad || 1);
  const scaleCeiling = tier.yMax || 1;

  let currentAnabolicMomentum = 0;
  let currentSystemicLoad = 0;

  const points: CycleRailOutputPoint[] = safeData.map((day) => {
    const rawAnabolic = Math.max(0, Number(day?.anabolic) || 0);
    const saturatedInput = Math.log10(rawAnabolic + 1) * 100;
    currentAnabolicMomentum =
      currentAnabolicMomentum * ANABOLIC_DECAY + saturatedInput * ANABOLIC_ALPHA;
    const normalizedAnabolicPct = Math.min(
      100,
      ((currentAnabolicMomentum / scaleCeiling) * 100 * 2.5) || 0,
    );
    const anabolic = (normalizedAnabolicPct / 100) * DISPLAY_CEILING;

    const rawToxicity = Math.max(0, Number(day?.toxicityRaw) || 0);
    const compoundedRisk = Math.pow(rawToxicity, TOXICITY_EXPONENT);
    currentSystemicLoad =
      currentSystemicLoad * TOXICITY_DECAY + compoundedRisk * TOXICITY_ALPHA;
    const normalizedRiskPct = (currentSystemicLoad / scaleCeiling) * 100;
    const toxicity = (normalizedRiskPct / 100) * DISPLAY_CEILING;

    const naturalPercent = clamp(Number(day?.naturalAxis) || 100, 0, 100);
    const naturalScaled = (naturalPercent / 100) * DISPLAY_CEILING;

    const doseEfficiency = Math.max(0, Number(day?.doseEfficiency) || 0);
    let efficiencyZone: "low" | "medium" | "high" = "low";
    if (doseEfficiency > EFFICIENCY_HIGH) efficiencyZone = "high";
    else if (doseEfficiency > EFFICIENCY_MEDIUM) efficiencyZone = "medium";

    const efficiencyHighFill = efficiencyZone === "high" ? DISPLAY_CEILING : 0;
    const efficiencyMediumFill = efficiencyZone === "medium" ? DISPLAY_CEILING : 0;
    const efficiencyLowFill = efficiencyZone === "low" ? DISPLAY_CEILING : 0;

    const riskRatio = anabolic > 0 ? toxicity / anabolic : 0;
    const netGap = anabolic - toxicity;

    return {
      day: Number(day?.day) || 0,
      anabolic,
      toxicity,
      netGap,
      riskRatio,
      rawAnabolic,
      rawToxicity,
      cumulativeMomentum: currentAnabolicMomentum,
      cumulativeLoad: currentSystemicLoad,
      naturalPercent,
      naturalScaled,
      doseEfficiency,
      efficiencyZone,
      efficiencyHighFill,
      efficiencyMediumFill,
      efficiencyLowFill,
    };
  });

  return {
    points,
    meta: {
      scaleLabel: tier.label,
      scaleMax: scaleCeiling,
    },
  };
};
