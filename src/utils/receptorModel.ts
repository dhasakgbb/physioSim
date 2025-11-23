import { ISimulationResponse } from "../engine/simulation.worker";
import { ICompoundSchema } from "../types/physio";
import {
  BASE_VECTOR_SCORES,
  ZERO_VECTORS,
  CompoundVectors,
} from "../data/compoundVectors";

const SAMPLE_WINDOW_DAYS = 7;
const DEFAULT_STEP_HOURS = 6;
const RECEPTOR_CAPACITY_PCT = 100;
const BASE_FREE_CONCENTRATION_NM = 12; // Approximate free serum concentration for physiologic TRT
const POTENCY_FLOOR = 0.35;
const POTENCY_CEILING = 2.8;
const FORCE_EXPONENT = 0.85; // Softens the curve so modest doses don't insta-cap
const BINDING_FORCE_CAP = 3.5; // Beyond this, assume receptor recycling is overwhelmed
const SPILLOVER_PCT_CAP = 110;
const MIN_EFFECTIVE_KD = 0.01;

const clamp = (value: number, min = 0, max = 120) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));
const clampScalar = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
const normalizePotency = (schema?: ICompoundSchema) =>
  Math.min(POTENCY_CEILING, Math.max(POTENCY_FLOOR, schema?.metadata?.basePotency ?? 1));

const isDhtLineage = (schema?: ICompoundSchema) =>
  Boolean(schema?.metadata?.family?.toLowerCase().includes("dht"));

const getAromataseFactor = (schema?: ICompoundSchema) => {
  const arom = schema?.pd?.enzymaticInteractions?.Aromatase_CYP19A1;
  if (!arom?.isSubstrate) return 0;
  const vmax = arom.Vmax_relative ?? 1;
  return clampScalar(vmax / 2.5, 0.1, 1.1);
};

const getFiveArFactor = (schema?: ICompoundSchema) => {
  if (isDhtLineage(schema)) return 1.1;
  const fiveAR = schema?.pd?.enzymaticInteractions?.FiveAlphaReductase_SRD5A;
  if (fiveAR?.isSubstrate) {
    return clampScalar((fiveAR.Vmax_relative ?? 1) / 2, 0.2, 0.9);
  }
  return 0.1;
};

const getProgestinFactor = (schema?: ICompoundSchema) => {
  const pr = schema?.pd?.receptorInteractions?.PR;
  if (!pr) return 0;
  const activity = pr.Emax ?? 50;
  return clampScalar(activity / 120, 0.15, 1.0);
};

const getGRFactor = (schema?: ICompoundSchema) => {
  const gr = schema?.pd?.receptorInteractions?.GR;
  if (!gr || gr.activityType !== "Antagonist") return 0;
  const potency = Math.abs(gr.Emax ?? 60);
  return clampScalar(potency / 120, 0.2, 1.0);
};

const computeLigandForce = (concNM: number, kd: number, schema?: ICompoundSchema) => {
  if (concNM <= 0 || kd <= 0) return 0;
  const potency = normalizePotency(schema);
  const effectiveKd = Math.max(MIN_EFFECTIVE_KD, kd * (BASE_FREE_CONCENTRATION_NM / potency));
  const normalized = concNM / effectiveKd;
  return Math.pow(Math.max(normalized, 0), FORCE_EXPONENT);
};


const safeDivide = (num: number, denom: number, fallback = 0) =>
  denom !== 0 ? num / denom : fallback;

type PathwayId =
  | "genomic"
  | "nonGenomic"
  | "antiCatabolic"
  | "estrogenic"
  | "progestogenic"
  | "androgenic"
  | "hepaticLoad"
  | "renalPressure"
  | "hematocrit"
  | "cnsDrive"
  | "lipidSkew"
  | "nutrientPartitioning";

interface StatusPreset {
  high: number;
  mid: number;
  labels: {
    high: string;
    mid: string;
    low: string;
  };
}

const PATHWAY_STATUS: Record<PathwayId, StatusPreset> = {
  genomic: {
    high: 85,
    mid: 45,
    labels: { high: "Maximal", mid: "Active", low: "Low" },
  },
  nonGenomic: {
    high: 70,
    mid: 30,
    labels: { high: "Spillover", mid: "Active", low: "Low" },
  },
  antiCatabolic: {
    high: 65,
    mid: 30,
    labels: { high: "Shielded", mid: "Active", low: "Low" },
  },
  estrogenic: {
    high: 55,
    mid: 25,
    labels: { high: "Elevated", mid: "Managed", low: "Controlled" },
  },
  progestogenic: {
    high: 60,
    mid: 25,
    labels: { high: "Elevated", mid: "Active", low: "Inactive" },
  },
  androgenic: {
    high: 65,
    mid: 30,
    labels: { high: "Elevated", mid: "Responsive", low: "Low" },
  },
  hepaticLoad: {
    high: 70,
    mid: 35,
    labels: { high: "Strained", mid: "Warning", low: "Stable" },
  },
  renalPressure: {
    high: 60,
    mid: 30,
    labels: { high: "Critical", mid: "Watch", low: "Stable" },
  },
  hematocrit: {
    high: 65,
    mid: 35,
    labels: { high: "High", mid: "Watch", low: "Normal" },
  },
  cnsDrive: {
    high: 70,
    mid: 35,
    labels: { high: "High", mid: "Moderate", low: "Low" },
  },
  lipidSkew: {
    high: 65,
    mid: 30,
    labels: { high: "Degrading", mid: "Shifting", low: "Stable" },
  },
  nutrientPartitioning: {
    high: 70,
    mid: 35,
    labels: { high: "Efficient", mid: "Active", low: "Low" },
  },
};

const describeStatus = (value: number, preset: StatusPreset) => {
  if (value >= preset.high) return preset.labels.high;
  if (value >= preset.mid) return preset.labels.mid;
  return preset.labels.low;
};

interface OrganStress {
  hepatic?: number;
  renal?: number;
  cardiovascular?: number;
  lipid?: number;
  neuro?: number;
}

export interface ReceptorContributor {
  compoundId: string;
  name: string;
  color?: string;
  occupancyPct: number;
  spilloverPct: number;
  affinity?: number | null;
  relativeForce: number;
  overflow: OverflowBreakdown;
}

export interface PathwayMetric {
  value: number;
  status: string;
}

export interface SerumLevels {
  receptor: {
    capacity: number;
    boundPct: number;
    spilloverPct: number;
    efficiencyPct: number;
    adaptationPhase: 1 | 2 | 3;
    adaptationRate: number;
    isHardCap: boolean;
    contributors: ReceptorContributor[];
    currentContributors: ReceptorContributor[];
    timeline: Array<{ time: number; boundPct: number; spilloverPct: number }>;
  };
  pathways: Record<PathwayId, PathwayMetric>;
}

interface ComputeSerumInput {
  simulation: ISimulationResponse;
  compounds: Record<string, ICompoundSchema>;
  organStress?: OrganStress;
}

type OverflowChannels = {
  aromatase: number;
  fiveAR: number;
  progestin: number;
  gr: number;
  residual: number;
};

export type OverflowBreakdown = OverflowChannels;

type ContributionAccumulator = {
  boundPct: number;
  spilloverPct: number;
  bindingForce: number;
  overflow: OverflowChannels;
};

const getVector = (compoundId: string): CompoundVectors =>
  BASE_VECTOR_SCORES[compoundId] || ZERO_VECTORS;

const buildPathwayMetric = (id: PathwayId, value: number): PathwayMetric => ({
  value: clamp(value),
  status: describeStatus(clamp(value), PATHWAY_STATUS[id]),
});

export const computeSerumLevels = ({
  simulation,
  compounds,
  organStress = {},
}: ComputeSerumInput): SerumLevels | null => {
  if (!simulation || !simulation.timePoints?.length) {
    return null;
  }

  const { timePoints, results } = simulation;
  const stepHours = timePoints.length > 1
    ? Math.max(1, timePoints[1] - timePoints[0])
    : DEFAULT_STEP_HOURS;
  const windowPoints = Math.max(1, Math.round((SAMPLE_WINDOW_DAYS * 24) / stepHours));
  const startIndex = Math.max(0, timePoints.length - windowPoints);

  const contributions = new Map<string, ContributionAccumulator>();
  const liveSnapshot = new Map<string, ContributionAccumulator>();
  const ensureContributionEntry = (compoundId: string): ContributionAccumulator => {
    const existing = contributions.get(compoundId);
    if (existing) return existing;
    const seed: ContributionAccumulator = {
      boundPct: 0,
      spilloverPct: 0,
      bindingForce: 0,
      overflow: {
        aromatase: 0,
        fiveAR: 0,
        progestin: 0,
        gr: 0,
        residual: 0,
      },
    };
    contributions.set(compoundId, seed);
    return seed;
  };
  const timeline: Array<{ time: number; boundPct: number; spilloverPct: number }> = [];

  for (let idx = startIndex; idx < timePoints.length; idx += 1) {
    let totalForce = 0;
    const ligands: Array<{
      compoundId: string;
      force: number;
      schema?: ICompoundSchema;
    }> = [];

    Object.entries(results || {}).forEach(([compoundId, payload]) => {
      const schema = compounds?.[compoundId];
      const kd = schema?.pd?.receptorInteractions?.AR?.Kd;
      if (!schema || !kd || kd <= 0) return;

      const pkSeries = payload.pk || [];
      if (!pkSeries.length) return;
      const sample = pkSeries[Math.min(idx, pkSeries.length - 1)];
      const conc = sample?.concentrationNM ?? 0;
      if (conc <= 0) return;

      const force = computeLigandForce(conc, kd, schema);
      if (!Number.isFinite(force) || force <= 0) return;

      ligands.push({ compoundId, force, schema });
      totalForce += force;
    });

    if (!ligands.length) {
      timeline.push({ time: timePoints[idx], boundPct: 0, spilloverPct: 0 });
      continue;
    }

    const denominator = 1 + totalForce;
    const boundCapacity = clampScalar((totalForce / denominator) * RECEPTOR_CAPACITY_PCT, 0, RECEPTOR_CAPACITY_PCT);
    const spilloverForce = Math.max(0, totalForce - BINDING_FORCE_CAP);
    const spilloverCapacity = spilloverForce <= 0
      ? 0
      : clampScalar((spilloverForce / (spilloverForce + 1)) * SPILLOVER_PCT_CAP, 0, SPILLOVER_PCT_CAP);

    if (idx === timePoints.length - 1) {
      liveSnapshot.clear();
    }

    ligands.forEach(({ compoundId, force, schema }) => {
      const boundShare = denominator > 0 ? (force / denominator) * RECEPTOR_CAPACITY_PCT : 0;
      const normalizedBoundShare = Math.min(boundShare, boundCapacity);
      const distributedSpill = spilloverCapacity > 0 && totalForce > 0
        ? (force / totalForce) * spilloverCapacity
        : 0;
      const totalSpill = Math.max(0, distributedSpill);

      const existing = ensureContributionEntry(compoundId);
      existing.boundPct += normalizedBoundShare;
      existing.bindingForce += force;
      existing.spilloverPct += totalSpill;

      const overflow = existing.overflow;
      const aromFactor = getAromataseFactor(schema);
      const fiveFactor = getFiveArFactor(schema);
      const progFactor = getProgestinFactor(schema);
      const grFactor = getGRFactor(schema);
      const routedShare = aromFactor + fiveFactor + progFactor + grFactor;
      const aromAmount = totalSpill * aromFactor;
      const fiveAmount = totalSpill * fiveFactor;
      const progAmount = totalSpill * progFactor;
      const grAmount = totalSpill * grFactor;
      const residualAmount = totalSpill * Math.max(0, 1 - Math.min(1, routedShare));

      overflow.aromatase += aromAmount;
      overflow.fiveAR += fiveAmount;
      overflow.progestin += progAmount;
      overflow.gr += grAmount;
      overflow.residual += residualAmount;

      if (idx === timePoints.length - 1) {
        liveSnapshot.set(compoundId, {
          boundPct: normalizedBoundShare,
          spilloverPct: totalSpill,
          bindingForce: force,
          overflow: {
            aromatase: aromAmount,
            fiveAR: fiveAmount,
            progestin: progAmount,
            gr: grAmount,
            residual: residualAmount,
          },
        });
      }
    });

    timeline.push({ time: timePoints[idx], boundPct: boundCapacity, spilloverPct: spilloverCapacity });
  }

  if (!timeline.length) {
    return {
      receptor: {
        capacity: RECEPTOR_CAPACITY_PCT,
        boundPct: 0,
        spilloverPct: 0,
        efficiencyPct: 0,
        adaptationPhase: 1,
        adaptationRate: 0,
        isHardCap: false,
        contributors: [],
        currentContributors: [],
        timeline: [],
      },
      pathways: Object.fromEntries(
        (Object.keys(PATHWAY_STATUS) as PathwayId[]).map((key) => [
          key,
          buildPathwayMetric(key, 0),
        ]),
      ) as Record<PathwayId, PathwayMetric>,
    };
  }

  const sampleCount = Math.max(1, timeline.length);
  const lastPoint = timeline[timeline.length - 1];
  const firstPoint = timeline[0];
  const adaptationRate = (lastPoint.boundPct - firstPoint.boundPct) / Math.max(1, sampleCount - 1);
  const efficiencyPct = safeDivide(
    lastPoint.boundPct,
    lastPoint.boundPct + lastPoint.spilloverPct,
    0,
  ) * 100;

  const contributors: ReceptorContributor[] = Array.from(contributions.entries())
    .map(([compoundId, acc]) => {
      const schema = compounds?.[compoundId];
      const avgBound = acc.boundPct / sampleCount;
      const avgSpill = acc.spilloverPct / sampleCount;
      const avgForce = acc.bindingForce / sampleCount;
      const avgOverflow: OverflowBreakdown = {
        aromatase: acc.overflow.aromatase / sampleCount,
        fiveAR: acc.overflow.fiveAR / sampleCount,
        progestin: acc.overflow.progestin / sampleCount,
        gr: acc.overflow.gr / sampleCount,
        residual: acc.overflow.residual / sampleCount,
      };
      return {
        compoundId,
        name: schema?.metadata?.name || compoundId,
        color: schema?.metadata?.color,
        occupancyPct: avgBound,
        spilloverPct: avgSpill,
        affinity: schema?.pd?.receptorInteractions?.AR?.Kd ?? null,
        relativeForce: avgForce,
        overflow: avgOverflow,
      };
    })
    .sort((a, b) => b.occupancyPct - a.occupancyPct);

  const currentContributors: ReceptorContributor[] = Array.from(liveSnapshot.entries())
    .map(([compoundId, snapshot]) => {
      const schema = compounds?.[compoundId];
      return {
        compoundId,
        name: schema?.metadata?.name || compoundId,
        color: schema?.metadata?.color,
        occupancyPct: snapshot.boundPct,
        spilloverPct: snapshot.spilloverPct,
        affinity: schema?.pd?.receptorInteractions?.AR?.Kd ?? null,
        relativeForce: snapshot.bindingForce,
        overflow: { ...snapshot.overflow },
      };
    })
    .sort((a, b) => b.occupancyPct - a.occupancyPct);

  const vectorTotals: CompoundVectors = { ...ZERO_VECTORS };
  let estrogenicLoad = 0;
  let progestogenicLoad = 0;
  let androgenicLoad = 0;
  let antiCatabolicLoad = 0;
  let nutrientBias = 0;

  contributors.forEach((contributor) => {
    const schema = compounds?.[contributor.compoundId];
    const vectors = getVector(contributor.compoundId);
    const weight = contributor.occupancyPct / 100;
    const overflow = contributor.overflow;

    vectorTotals.hypertrophy += weight * vectors.hypertrophy;
    vectorTotals.neural += weight * vectors.neural;
    vectorTotals.lipolysis += weight * vectors.lipolysis;
    vectorTotals.endurance += weight * vectors.endurance;
    vectorTotals.glycogen += weight * vectors.glycogen;

    if (!schema) return;

    const arom = schema.pd?.enzymaticInteractions?.Aromatase_CYP19A1;
    const aromPotential = arom?.isSubstrate ? (arom?.Vmax_relative ?? 1) : 0;
    if (aromPotential > 0) {
      estrogenicLoad += (weight + contributor.spilloverPct / 150) * aromPotential * 40;
    }
    if (overflow.aromatase > 0) {
      estrogenicLoad += overflow.aromatase * 0.9;
    }

    const pr = schema.pd?.receptorInteractions?.PR;
    if (pr) {
      const prFactor = Math.max(0.2, (pr.Emax ?? 50) / 100);
      progestogenicLoad += weight * prFactor * 60;
    }

    if (schema.metadata?.family?.toLowerCase().includes("19-nor")) {
      progestogenicLoad += contributor.spilloverPct * 0.4;
    }
    if (overflow.progestin > 0) {
      progestogenicLoad += overflow.progestin * 0.85;
    }

    const gr = schema.pd?.receptorInteractions?.GR;
    if (gr && gr.activityType === "Antagonist") {
      const grFactor = Math.max(0.4, (gr.Emax ?? 60) / 100);
      antiCatabolicLoad += weight * grFactor * 90;
    }
    if (overflow.gr > 0) {
      antiCatabolicLoad += overflow.gr * 0.8;
    }

    const fiveAR = schema.pd?.enzymaticInteractions?.FiveAlphaReductase_SRD5A;
    const dhtBias = schema.metadata?.family?.toLowerCase().includes("dht")
      ? 1.3
      : fiveAR?.isSubstrate
        ? 1
        : 0.6;
    androgenicLoad += (weight * 100 + contributor.spilloverPct) * 0.4 * dhtBias;
    if (overflow.fiveAR > 0) {
      androgenicLoad += overflow.fiveAR * 0.75 * dhtBias;
    }

    nutrientBias += (schema.metadata?.basePotency ?? 1) * weight + overflow.residual * 0.05;
  });

  const hepaticLoad = clamp((organStress.hepatic ?? 0) * 0.6);
  const renalPressure = clamp(
    (organStress.renal ?? 0) * 0.5 + (organStress.cardiovascular ?? 0) * 0.25,
  );
  const lipidSkew = clamp((organStress.lipid ?? 0) * 0.8);
  const hematocritLoad = clamp(vectorTotals.endurance * 12);
  const cnsDrive = clamp(vectorTotals.neural * 10 + lastPoint.spilloverPct * 0.5);
  const nutrientPartitioning = clamp(
    vectorTotals.glycogen * 10 + lastPoint.boundPct * 0.3 + nutrientBias * 3,
  );

  const pathways: Record<PathwayId, PathwayMetric> = {
    genomic: buildPathwayMetric("genomic", lastPoint.boundPct),
    nonGenomic: buildPathwayMetric(
      "nonGenomic",
      lastPoint.spilloverPct * 1.1 + vectorTotals.neural * 4,
    ),
    antiCatabolic: buildPathwayMetric("antiCatabolic", antiCatabolicLoad),
    estrogenic: buildPathwayMetric("estrogenic", estrogenicLoad),
    progestogenic: buildPathwayMetric("progestogenic", progestogenicLoad || 2),
    androgenic: buildPathwayMetric("androgenic", androgenicLoad),
    hepaticLoad: buildPathwayMetric("hepaticLoad", hepaticLoad),
    renalPressure: buildPathwayMetric("renalPressure", renalPressure),
    hematocrit: buildPathwayMetric("hematocrit", hematocritLoad),
    cnsDrive: buildPathwayMetric("cnsDrive", cnsDrive),
    lipidSkew: buildPathwayMetric("lipidSkew", lipidSkew),
    nutrientPartitioning: buildPathwayMetric(
      "nutrientPartitioning",
      nutrientPartitioning,
    ),
  } as Record<PathwayId, PathwayMetric>;

  const adaptationPhase: 1 | 2 | 3 = lastPoint.spilloverPct > 35
    ? 3
    : lastPoint.boundPct > 55
      ? 2
      : 1;

  const serum: SerumLevels = {
    receptor: {
      capacity: RECEPTOR_CAPACITY_PCT,
      boundPct: clamp(lastPoint.boundPct, 0, 120),
      spilloverPct: clamp(lastPoint.spilloverPct, 0, 120),
      efficiencyPct: clamp(efficiencyPct, 0, 100),
      adaptationPhase,
      adaptationRate,
      isHardCap: lastPoint.spilloverPct > 75 || lastPoint.boundPct > 95,
      contributors,
      currentContributors: currentContributors.length ? currentContributors : contributors,
      timeline,
    },
    pathways,
  };

  return serum;
};
