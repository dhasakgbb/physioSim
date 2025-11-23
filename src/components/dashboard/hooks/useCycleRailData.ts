import { useMemo } from "react";
import { COMPOUNDS as compoundData } from "../../../data/compounds";
import { getDDIForStack } from "../../../data/drugDrugInteractions";
import {
  computeCycleRailSeries,
  type CycleRailOutputPoint,
} from "../computeCycleRailSeries";
import { applyVolumizationEnvelope } from "../../../engine/volumization";
import type { ICompoundSchema } from "../../../types/physio";

const MIN_EXIT_WEEK = 3;
const EXIT_RATIO = 1;
const LN2 = Math.log(2);

const clampValue = (value: number, min = 0, max = Infinity) =>
  Math.min(max, Math.max(min, value));

type EnvelopeConfig = {
  warmup: number;
  growth: number;
  decay: number;
};

type StackKinetics = {
  tissue: EnvelopeConfig;
  mass: EnvelopeConfig;
  massPulseGain: number;
};

const DEFAULT_KINETICS: StackKinetics = {
  tissue: { warmup: 5, growth: 12, decay: 56 },
  mass: { warmup: 1.5, growth: 5, decay: 21 },
  massPulseGain: 1,
};

const getEliminationHalfLifeDays = (compound?: ICompoundSchema | null) => {
  if (!compound?.pk?.CL || !compound.pk.Vd) {
    return compound?.metadata?.structuralFlags?.isC17aa ? 9 : 5;
  }
  const CL_L_h = (compound.pk.CL / 1000) * 60;
  if (!CL_L_h) return 5;
  const halfLifeHours = (LN2 * compound.pk.Vd) / CL_L_h;
  return clampValue(halfLifeHours / 24, 0.5, 60);
};

const blendDualPhase = (params: Record<string, number | undefined>) => {
  const fast = params.Ka_fast && params.Ka_fast > 0 ? LN2 / params.Ka_fast : 0;
  const slow = params.Ka_slow && params.Ka_slow > 0 ? LN2 / params.Ka_slow : 0;
  const fractionFast = clampValue(params.fractionFast ?? 0.5, 0, 1);
  return fast * fractionFast + slow * (1 - fractionFast);
};

const getAbsorptionHalfLifeDays = (compound?: ICompoundSchema | null, esterId?: string) => {
  const ester = esterId ? compound?.pk?.esters?.[esterId] : undefined;
  let ka: number | null = null;
  if (ester?.parameters) {
    if (typeof ester.parameters.Ka === "number" && ester.parameters.Ka > 0) {
      ka = ester.parameters.Ka;
    } else if (
      typeof ester.parameters.Ka_fast === "number" &&
      typeof ester.parameters.Ka_slow === "number"
    ) {
      const blendedHours = blendDualPhase(ester.parameters);
      return clampValue(blendedHours / 24, 0.25, 14);
    }
  }
  if (!ka && typeof compound?.pk?.absorption?.oral?.Ka === "number") {
    ka = compound.pk.absorption.oral.Ka;
  }
  if (ka && ka > 0) {
    return clampValue((LN2 / ka) / 24, 0.25, 10);
  }
  return 1.5;
};

const deriveStackKinetics = (
  stack: Array<any>,
  compoundsMap: Record<string, ICompoundSchema>,
): StackKinetics => {
  if (!Array.isArray(stack) || !stack.length) return DEFAULT_KINETICS;

  let totalWeight = 0;
  let tissueWarmupSum = 0;
  let tissueGrowthSum = 0;
  let tissueDecaySum = 0;
  let massWarmupSum = 0;
  let massGrowthSum = 0;
  let massDecaySum = 0;
  let massPulseWeighted = 0;

  stack.forEach((entry) => {
    const compoundId = entry?.compoundId || entry?.compound;
    const schema = compoundsMap[compoundId];
    if (!schema) return;
    const weight = Math.max(1, Number(entry?.dose) || 1);
    totalWeight += weight;

    const absorptionHalfLife = getAbsorptionHalfLifeDays(schema, entry?.ester || entry?.esterId);
    const eliminationHalfLife = getEliminationHalfLifeDays(schema);

    tissueWarmupSum += absorptionHalfLife * weight;
    tissueGrowthSum += Math.max(absorptionHalfLife * 2, 4) * weight;
    tissueDecaySum += Math.max(eliminationHalfLife * 3, 18) * weight;

    const oralRoute = schema.metadata?.administrationRoutes?.includes("Oral");
    const aromatizes = Boolean(schema.pd?.enzymaticInteractions?.Aromatase_CYP19A1?.isSubstrate);
    const c17aa = Boolean(schema.metadata?.structuralFlags?.isC17aa);

    const wateryBoost = 1 + (aromatizes ? 0.35 : 0) + (oralRoute ? 0.2 : 0);
    const bloatBoost = c17aa ? 0.3 : 0;

    massWarmupSum += Math.max(0.4, absorptionHalfLife * (oralRoute ? 0.6 : 0.9)) * weight;
    massGrowthSum += Math.max(2, absorptionHalfLife * 1.3) * weight;
    massDecaySum += Math.max(6, eliminationHalfLife * (wateryBoost + bloatBoost)) * weight;
    massPulseWeighted += (wateryBoost + bloatBoost) * weight;
  });

  if (!totalWeight) return DEFAULT_KINETICS;

  return {
    tissue: {
      warmup: clampValue(tissueWarmupSum / totalWeight, 1, 14),
      growth: clampValue(tissueGrowthSum / totalWeight, 4, 28),
      decay: clampValue(tissueDecaySum / totalWeight, 14, 84),
    },
    mass: {
      warmup: clampValue(massWarmupSum / totalWeight, 0.5, 10),
      growth: clampValue(massGrowthSum / totalWeight, 2, 21),
      decay: clampValue(massDecaySum / totalWeight, 7, 56),
    },
    massPulseGain: clampValue(1 + massPulseWeighted / totalWeight, 0.9, 2.5),
  };
};

const buildEnvelope = (day: number, config: EnvelopeConfig): number => {
  if (!config) return 1;
  const warmup = Math.max(0.25, config.warmup);
  const growth = Math.max(0.25, config.growth);
  const decay = Math.max(0.25, config.decay);
  if (day <= warmup) {
    return clampValue(day / warmup, 0, 1);
  }
  const plateauEnd = warmup + growth;
  if (day <= plateauEnd) {
    const progress = (day - warmup) / growth;
    return 1 + 0.12 * Math.sin(progress * Math.PI * 0.5);
  }
  const declineProgress = (day - plateauEnd) / decay;
  return clampValue(1 - 0.7 * Math.min(1, declineProgress), 0.25, 1);
};

type CycleRailChartPoint = CycleRailOutputPoint & {
  volumizationBonus: number;
  totalMass: number;
  massEffect?: number;
};

interface UseCycleRailDataParams {
  stack: Array<any> | undefined;
  metrics: any;
  durationWeeks: number;
}

export const useCycleRailData = ({
  stack = [],
  metrics,
  durationWeeks,
}: UseCycleRailDataParams) => {
  const stackSignature = useMemo(() => {
    if (!stack?.length) return "empty";
    return stack
      .map((item) =>
        [
          item.compoundId || item.compound,
          item.dose,
          item.frequency || 0,
          item.ester || item.esterId || "",
        ].join(":"),
      )
      .join("|");
  }, [stack]);

  const activeCompoundIds = useMemo(() => {
    if (!stack?.length) return [];
    return Array.from(
      new Set(
        stack
          .map((s) => s.compoundId || s.compound)
          .filter((value): value is string => Boolean(value)),
      ),
    );
  }, [stack]);

  const activeInteractions = useMemo(() => getDDIForStack(activeCompoundIds), [activeCompoundIds]);

  const showC17OralBadge = useMemo(() => {
    if (!activeCompoundIds.length) return false;
    const c17OralCount = activeCompoundIds.filter((id) => {
      const meta = compoundData[id]?.metadata;
      return meta?.structuralFlags?.isC17aa && meta?.administrationRoutes?.includes("Oral");
    }).length;
    return c17OralCount >= 2;
  }, [activeCompoundIds]);

  const aggregate = metrics?._raw?.aggregate;

  const macroSeries = useMemo(() => {
    if (!aggregate?.totalAnabolicLoad?.length || !stack?.length) {
      return { points: [], meta: null };
    }
    if (!aggregate.totalToxicity) {
      return { points: [], meta: null };
    }

    const pointsPerDay = 4; // 6-hour spacing
    const maxSimDays = aggregate.totalAnabolicLoad.length / pointsPerDay;
    const targetDays = Math.min(durationWeeks * 7, maxSimDays);

    const hepaticSeries = aggregate.totalToxicity?.hepatic ?? [];
    const renalSeries = aggregate.totalToxicity?.renal ?? [];
    const cardiovascularSeries = aggregate.totalToxicity?.cardiovascular ?? [];
    const lipidSeries = aggregate.totalToxicity?.lipid_metabolism ?? [];
    const neuroSeries = aggregate.totalToxicity?.neurotoxicity ?? [];
    const marginalSeries = aggregate.marginalAnabolicLoad ?? [];
    const naturalAxisSeries = aggregate.naturalAxis ?? [];

    const rawPoints = aggregate.totalAnabolicLoad
      .map((load: number, index: number) => {
        if (index % pointsPerDay !== 0) return null;
        const day = index / pointsPerDay;
        if (day > targetDays) return null;
        const hepatic = hepaticSeries[index] || 0;
        const renal = renalSeries[index] || 0;
        const cv = cardiovascularSeries[index] || 0;
        const lipid = lipidSeries[index] || 0;
        const neuro = neuroSeries[index] || 0;
        const organSum = hepatic + renal + cv + lipid + neuro;
        const doseEfficiency = marginalSeries[index] ?? marginalSeries[index - 1] ?? 0;
        const naturalAxis = naturalAxisSeries[index] ?? naturalAxisSeries[index - 1] ?? 100;
        return {
          day,
          anabolic: load,
          toxicityRaw: organSum,
          doseEfficiency,
          naturalAxis,
        };
      })
      .filter(Boolean);

    return computeCycleRailSeries(rawPoints);
  }, [aggregate, durationWeeks, stack?.length, stackSignature]);

  const volumizedPoints = useMemo<CycleRailChartPoint[]>(
    () => applyVolumizationEnvelope<CycleRailOutputPoint>(macroSeries.points) as CycleRailChartPoint[],
    [macroSeries.points],
  );

  const kinetics = useMemo(() => deriveStackKinetics(stack, compoundData), [stack, stackSignature]);

  const chartData = useMemo<CycleRailChartPoint[]>(() => {
    if (!stack?.length) return [];

    let maxVolumeIntensity = 0;
    let prevVolBonus = 0;

    const enriched = volumizedPoints.map((point) => {
      const tissueSignal = Math.max(0, point.rawAnabolic ?? 0);
      const volBonus = Math.max(0, point.volumizationBonus ?? 0);
      const deltaWater = Math.max(0, volBonus - prevVolBonus);
      prevVolBonus = volBonus;

      const glycogenSignal = Math.max(0, (point.doseEfficiency ?? 0) - 0.35) * 80;
      const oralBloatBias = Math.max(0, (point.rawToxicity ?? 0) - (point.rawAnabolic ?? 0) * 0.3) * 0.015;

      const volumeIntensity = tissueSignal * 0.35 + deltaWater * 2.5 + glycogenSignal + oralBloatBias;
      maxVolumeIntensity = Math.max(maxVolumeIntensity, volumeIntensity);

      return { ...point, volumeIntensity };
    });

    const anchor = Math.max(50, graphMeta?.scaleMax ?? 400);
    const massNormalizer = Math.max(maxVolumeIntensity, 1);
    const riskNormalizer = anchor * 1.8;

    const tissueNormalizer = anchor;
    const massScale = anchor * 0.9;

    const adjusted = enriched.map((point) => {
      const tissueEnvelope = buildEnvelope(point.day, kinetics.tissue);
      const massEnvelope = buildEnvelope(point.day, kinetics.mass);

      const tissueEffectRaw = Math.max(0, point.rawAnabolic ?? 0) * tissueEnvelope;
      const riskEffectRaw = Math.max(0, point.cumulativeLoad ?? 0);
      const massBase = Math.max(0, point.volumeIntensity);
      const massEffectRaw = (massBase / massNormalizer) * massEnvelope * (kinetics.massPulseGain || 1) * massScale;

      return {
        ...point,
        tissueEffectRaw,
        riskEffectRaw,
        massEffectRaw,
      };
    });

    return adjusted.map((point) => ({
      ...point,
      tissueEffect: clampValue((point.tissueEffectRaw / tissueNormalizer) * 100, 0, 100),
      riskEffect: clampValue((point.riskEffectRaw / riskNormalizer) * 100, 0, 100),
      massEffect: clampValue((point.massEffectRaw / massScale) * 100, 0, 100),
    }));
  }, [stack?.length, volumizedPoints, kinetics, graphMeta]);

  const graphMeta = macroSeries.meta ?? null;

  const optimalExit = useMemo(() => {
    if (!chartData.length) return null;
    const crossoverIndex = chartData.findIndex((point) => {
      const week = Math.floor(point.day / 7);
      if (week < MIN_EXIT_WEEK) return false;
      return point.riskEffect >= EXIT_RATIO * point.tissueEffect;
    });

    const candidate = crossoverIndex >= 0 ? chartData[crossoverIndex] : chartData[chartData.length - 1];

    if (!candidate || !Number.isFinite(candidate.day)) return null;

    return {
      ...candidate,
      week: Math.floor(candidate.day / 7),
    };
  }, [chartData]);

  return {
    chartData,
    graphMeta,
    optimalExit,
    activeInteractions,
    showC17OralBadge,
    stackSignature,
  };
};
