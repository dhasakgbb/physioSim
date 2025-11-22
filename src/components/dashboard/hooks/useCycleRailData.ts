import { useMemo } from "react";
import { COMPOUNDS as compoundData } from "../../../data/compounds";
import { getDDIForStack } from "../../../data/drugDrugInteractions";
import {
  computeCycleRailSeries,
  type CycleRailOutputPoint,
} from "../computeCycleRailSeries";
import { applyVolumizationEnvelope } from "../../../engine/volumization";

type CycleRailChartPoint = CycleRailOutputPoint & {
  volumizationBonus: number;
  totalMass: number;
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
        [item.compoundId || item.compound, item.dose, item.frequency || 0].join(":"),
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

  const chartData = useMemo<CycleRailChartPoint[]>(() => {
    if (!stack?.length) return [];
    return volumizedPoints;
  }, [stack?.length, volumizedPoints]);

  const graphMeta = macroSeries.meta ?? null;

  const optimalExit = useMemo(() => {
    if (!chartData.length) return null;
    const crossoverIndex = chartData.findIndex((point) => point.toxicity >= point.anabolic);
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
