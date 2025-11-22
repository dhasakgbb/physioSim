import { useMemo } from "react";
// @ts-expect-error - StackContext is currently implemented in JS
import { useStack } from "../../../context/StackContext";
import {
  PATHWAY_FLOW_CONFIG,
  type PathwayFlowNodeConfig,
  type PathwayMetricKey,
  type FlowPolarity,
} from "../../../data/pathwayFlow";

export interface FlowNodeDatum extends PathwayFlowNodeConfig {
  percent: number;
  rawValue: number;
  delta: number;
  status: string;
}

export interface FlowConnectorDatum {
  id: string;
  intensity: number;
  polarity: FlowPolarity;
}

export interface AndrogenStatusSummary {
  occupancy: number;
  saturation: number;
  naturalAxis: number;
  totalLoad: number;
  trend: number;
}

export interface PathwayFlowResult {
  nodes: FlowNodeDatum[];
  connectors: FlowConnectorDatum[];
  androgenStatus: AndrogenStatusSummary;
  isEmpty: boolean;
}

type RawSimulation = {
  timePoints?: number[];
  results?: Record<
    string,
    {
      pd?: Array<{
        pathwayActivation?: Partial<Record<PathwayMetricKey, number>>;
        receptorOccupancy?: { AR?: number };
      }>;
    }
  >;
  aggregate?: {
    totalTestosteroneEquivalent?: number[];
    totalAnabolicLoad?: number[];
    naturalAxis?: number[];
  };
};

type MetricTotals = Record<PathwayMetricKey, number>;

const PATHWAY_KEYS = PATHWAY_FLOW_CONFIG.map((config) => config.metricKey);

const createEmptyTotals = (): MetricTotals =>
  PATHWAY_KEYS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as MetricTotals);

const clampPercent = (value: number, limit = 130): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(limit, Math.round(value)));
};

const describeFlow = (percent: number, polarity: FlowPolarity = "benefit"): string => {
  if (polarity === "risk") {
    if (percent >= 95) return "Critical suppression";
    if (percent >= 70) return "Axis compromised";
    if (percent >= 40) return "Adaptive pressure";
    return "Resilient";
  }

  if (percent >= 95) return "Maximal signal";
  if (percent >= 70) return "High engagement";
  if (percent >= 40) return "Primed";
  if (percent >= 15) return "Warming up";
  return "Dormant";
};

const aggregateAtIndex = (
  raw: RawSimulation | undefined,
  index: number,
): { totals: MetricTotals; occupancy: number } => {
  const totals = createEmptyTotals();
  if (!raw?.results) {
    return { totals, occupancy: 0 };
  }

  let occupancySum = 0;
  let occupancySamples = 0;

  Object.values(raw.results).forEach((result) => {
    const pdPoints = result?.pd;
    if (!pdPoints?.length) return;
    const safeIndex = Math.max(0, Math.min(index, pdPoints.length - 1));
    const pdPoint = pdPoints[safeIndex];
    if (!pdPoint) return;

    PATHWAY_KEYS.forEach((key) => {
      const value = pdPoint.pathwayActivation?.[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        totals[key] += value;
      }
    });

    const occupancy = pdPoint.receptorOccupancy?.AR;
    if (typeof occupancy === "number" && Number.isFinite(occupancy)) {
      occupancySum += occupancy;
      occupancySamples += 1;
    }
  });

  return {
    totals,
    occupancy: occupancySamples ? occupancySum / occupancySamples : 0,
  };
};

export const usePathwayFlowData = (): PathwayFlowResult => {
  const { metrics } = useStack();

  return useMemo(() => {
    const raw = metrics?._raw as RawSimulation | undefined;
    const timePoints = raw?.timePoints ?? [];
    const lastIndex = Math.max(0, timePoints.length - 1);
    const prevIndex = Math.max(0, lastIndex - 4); // ~24h lookback

    const latest = aggregateAtIndex(raw, lastIndex);
    const prior = aggregateAtIndex(raw, prevIndex);

    const nodes: FlowNodeDatum[] = PATHWAY_FLOW_CONFIG.map((config) => {
      const rawValue = latest.totals[config.metricKey] || 0;
      const prevValue = prior.totals[config.metricKey] || 0;
      const percent = clampPercent((rawValue / config.scale) * 100);
      const delta = rawValue - prevValue;
      return {
        ...config,
        rawValue,
        percent,
        delta,
        status: describeFlow(percent, config.polarity ?? "benefit"),
      };
    });

    const connectors: FlowConnectorDatum[] = nodes.slice(0, -1).map((node, index) => {
      const next = nodes[index + 1];
      const polarity: FlowPolarity =
        next.polarity === "risk" || node.polarity === "risk" ? "risk" : "benefit";
      return {
        id: `${node.id}-${next.id}`,
        polarity,
        intensity: clampPercent((node.percent + next.percent) / 2),
      };
    });

    const totalLoadSeries = raw?.aggregate?.totalTestosteroneEquivalent ?? [];
    const anabolicSeries = raw?.aggregate?.totalAnabolicLoad ?? [];
    const axisSeries = raw?.aggregate?.naturalAxis ?? [];

    const latestLoad = totalLoadSeries[lastIndex] ?? 0;
    const previousLoad = totalLoadSeries[prevIndex] ?? latestLoad;
    const totalLoadTrend = latestLoad - previousLoad;

    const saturationPercent = clampPercent(
      ((anabolicSeries[lastIndex] ?? anabolicSeries[anabolicSeries.length - 1] ?? 0) / 120) * 100,
    );

    const androgenStatus: AndrogenStatusSummary = {
      occupancy: clampPercent(latest.occupancy, 100),
      saturation: saturationPercent,
      naturalAxis: clampPercent(axisSeries[lastIndex] ?? 100, 100),
      totalLoad: Math.max(0, Number(latestLoad) || 0),
      trend: totalLoadTrend,
    };

    const isEmpty = !raw || !Object.keys(raw.results || {}).length;

    return {
      nodes,
      connectors,
      androgenStatus,
      isEmpty,
    };
  }, [metrics]);
};
