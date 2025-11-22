import { useMemo } from "react";
import { useStack } from "../context/StackContext";

type PathwayLoads = Record<string, number | undefined>;
type ProjectedLabs = Record<string, number | undefined>;
type LoadLevel = "stable" | "elevated" | "critical";

export interface SystemLoadCategory {
  id: string;
  label: string;
  description: string;
  percent: number;
  level: LoadLevel;
  gradient: string;
  readout: string;
}

export interface SystemLoadResult {
  categories: SystemLoadCategory[];
  systemIndex: number;
  systemLevel: LoadLevel;
  dominantCategory: SystemLoadCategory | null;
}

type CategoryConfig = {
  id: string;
  label: string;
  description: string;
  gradient: string;
  limit?: number;
  computeValue: (loads: PathwayLoads, labs: ProjectedLabs) => number;
  formatReadout?: (value: number, labs: ProjectedLabs, limit?: number) => string;
};

const clampPercent = (value: number, limit?: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (!limit || limit <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / limit) * 100)));
};

const formatCapacityReadout = (value: number, limit?: number): string => {
  if (!Number.isFinite(value) || value <= 0) return "Minimal load";
  if (!limit || limit <= 0) return `${Math.round(value)} units`;
  return `${Math.round(value)} / ${limit} capacity`;
};

const getLevel = (percent: number): LoadLevel => {
  if (percent >= 80) return "critical";
  if (percent >= 55) return "elevated";
  return "stable";
};

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    id: "androgenic",
    label: "Androgenic",
    description: "AR saturation & genomic signaling load",
    gradient: "from-indigo-500 via-indigo-400 to-sky-400",
    limit: 500,
    computeValue: (loads) => loads.ar_genomic || 0,
  },
  {
    id: "cardiovascular",
    label: "Cardiovascular",
    description: "Blood viscosity, BP and lipid strain",
    gradient: "from-rose-500 via-amber-400 to-yellow-300",
    limit: 260,
    computeValue: (loads, labs) => {
      const heartLoad = loads.heart || 0;
      const hematocrit = labs.hematocrit ?? 45;
      const ldl = labs.ldl ?? 100;
      const hematocritPenalty = Math.max(0, hematocrit - 46) * 4;
      const ldlPenalty = Math.max(0, ldl - 110) * 0.8;
      return heartLoad + hematocritPenalty + ldlPenalty;
    },
    formatReadout: (value, labs) => {
      const hematocrit = labs.hematocrit ?? 45;
      return `${Math.round(value)} load • HCT ${hematocrit.toFixed(1)}%`;
    },
  },
  {
    id: "neuro",
    label: "Neuro / CNS",
    description: "Non-genomic drive, stimulants & neurotoxicity",
    gradient: "from-purple-500 via-fuchsia-500 to-pink-400",
    limit: 210,
    computeValue: (loads, labs) => {
      const base = (loads.non_genomic || 0) + (loads.neuro || 0);
      const neuroRisk = labs.neuroRisk ?? 0;
      const neuroPenalty = Math.max(0, neuroRisk - 2) * 12;
      return base + neuroPenalty;
    },
  },
  {
    id: "hepatic",
    label: "Hepatic",
    description: "Oral throughput & enzyme burden",
    gradient: "from-orange-500 via-amber-500 to-yellow-400",
    limit: 170,
    computeValue: (loads, labs) => {
      const liverLoad = loads.liver || 0;
      const ast = labs.ast ?? 25;
      const alt = labs.alt ?? 25;
      const astPenalty = Math.max(0, ast - 40) * 2;
      const altPenalty = Math.max(0, alt - 45) * 2.5;
      return liverLoad + astPenalty + altPenalty;
    },
  },
  {
    id: "renal",
    label: "Nephrological",
    description: "Filtration stress & BP-mediated kidney load",
    gradient: "from-teal-400 via-cyan-400 to-sky-300",
    limit: 2,
    computeValue: (_, labs) => Math.max(0, (labs.creatinine ?? 1) - 1),
    formatReadout: (_, labs) => {
      const creatinine = labs.creatinine ?? 1;
      return `Creatinine ${creatinine.toFixed(1)} mg/dL`;
    },
  },
];

const PRESSURE_TO_CATEGORY: Record<string, string> = {
  Cardiovascular: "cardiovascular",
  Hepatic: "hepatic",
  Renal: "renal",
  "Neuro / CNS": "neuro",
};

const WIDGET_CATEGORY_CONFIGS = [
  {
    id: "androgenic",
    key: "androgenic" as const,
    label: "Androgenic",
    description: "AR saturation & DHT pressure",
    gradient: "from-indigo-500 via-indigo-400 to-sky-400",
  },
  {
    id: "cardio",
    key: "cardio" as const,
    label: "Cardiovascular",
    description: "Lipids, BP and plasma volume",
    gradient: "from-rose-500 via-amber-400 to-yellow-300",
  },
  {
    id: "neuro",
    key: "neuro" as const,
    label: "Neuro / CNS",
    description: "Neurotoxicity & central drive",
    gradient: "from-purple-500 via-fuchsia-500 to-pink-400",
  },
  {
    id: "hepatic",
    key: "hepatic" as const,
    label: "Hepatic",
    description: "Oral metabolism & enzyme burden",
    gradient: "from-orange-500 via-amber-500 to-yellow-400",
  },
  {
    id: "renal",
    key: "renal" as const,
    label: "Nephrological",
    description: "Filtration stress",
    gradient: "from-teal-400 via-cyan-400 to-sky-300",
  },
  {
    id: "estrogenic",
    key: "estrogenic" as const,
    label: "Estrogenic",
    description: "Estradiol pressure & water retention",
    gradient: "from-pink-500 via-rose-400 to-amber-200",
  },
  {
    id: "progestogenic",
    key: "progestogenic" as const,
    label: "Progestogenic",
    description: "Progesterone receptor & prolactin stress",
    gradient: "from-green-500 via-emerald-400 to-teal-300",
  },
];

const clampWidgetPercent = (value: unknown): number => {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

export const useSystemLoad = (scrubbedPoint?: any): SystemLoadResult => {
  const { metrics } = useStack() as { metrics?: Record<string, any> };

  return useMemo<SystemLoadResult>(() => {
    // 1. Try to use raw simulation data (New Engine)
    if (metrics?._raw?.aggregate) {
      const agg = metrics._raw.aggregate;
      const len = agg.totalAnabolicLoad?.length || 0;
      
      // Determine time index
      // timePoints are in 6-hour intervals: [0, 6, 12, 18, 24, ...]
      // So day 0 = index 0, day 1 = index 4, day 2 = index 8, etc.
      let index = len - 1;
      if (scrubbedPoint && typeof scrubbedPoint.day === 'number') {
        // Convert days to 6-hour intervals: 1 day = 4 intervals (24/6)
        index = Math.min(Math.round(scrubbedPoint.day * 4), len - 1);
      }
      index = Math.max(0, index);

      // Extract values at index
      const hepatic = agg.totalToxicity?.hepatic?.[index] || 0;
      const cardio = agg.totalToxicity?.cardiovascular?.[index] || 0;
      const neuro = agg.totalToxicity?.neurotoxicity?.[index] || 0;
      const renal = agg.totalToxicity?.renal?.[index] || 0;
      const lipid = agg.totalToxicity?.lipid_metabolism?.[index] || 0;
      const anabolic = agg.totalAnabolicLoad?.[index] || 0;

      // Construct derived loads
      const pathwayLoads: PathwayLoads = {
        liver: hepatic,
        heart: cardio,
        neuro: neuro,
        ar_genomic: anabolic * 10, // Scale up for display? Anabolic load is usually small number
        non_genomic: neuro * 0.5, // Heuristic
      };

      // Construct derived labs (Same heuristic as RightInspector)
      // Use smaller multipliers to match the fixed RightInspector calculations
      const labs: ProjectedLabs = {
        hdl: Math.max(0, 60 - (lipid * 0.1)),
        ldl: 90 + (lipid * 0.1),
        ast: Math.max(0, 22 + (hepatic * 0.05)),
        alt: Math.max(0, 24 + (hepatic * 0.05)),
        creatinine: Math.max(0.5, 1.0 + (renal * 0.005)),
        neuroRisk: neuro * 0.1,
        hematocrit: Math.min(60, 45 + (cardio * 0.02)),
      };

      // Compute categories using configs
      const categories = CATEGORY_CONFIGS.map((config) => {
        const rawValue = Math.max(0, config.computeValue(pathwayLoads, labs));
        const percent = clampPercent(rawValue, config.limit);
        const level = getLevel(percent);
        const readout = config.formatReadout
          ? config.formatReadout(rawValue, labs, config.limit)
          : formatCapacityReadout(rawValue, config.limit);

        return {
          id: config.id,
          label: config.label,
          description: config.description,
          percent,
          level,
          gradient: config.gradient,
          readout,
        };
      });

      // Calculate system index
      const fallbackIndex = categories.length
        ? Math.round(
            categories.reduce((sum, cat) => sum + cat.percent, 0) /
              categories.length,
          )
        : 0;
      
      const systemIndex = fallbackIndex; // Simplified
      const systemLevel = getLevel(systemIndex);
      
      const fallbackDominant = categories.reduce<SystemLoadCategory | null>(
        (acc, cat) => {
          if (!acc || cat.percent > acc.percent) return cat;
          return acc;
        },
        null,
      );

      return {
        categories,
        systemIndex,
        systemLevel,
        dominantCategory: fallbackDominant,
      };
    }

    // 2. Fallback to Legacy Metrics (if _raw is missing)
    const widgetVectors = metrics?.analytics?.systemLoadVectors;
    if (widgetVectors) {
      const categories = WIDGET_CATEGORY_CONFIGS.map((config) => {
        const percent = clampWidgetPercent(widgetVectors[config.key]);
        const level = getLevel(percent);
        return {
          id: config.id,
          label: config.label,
          description: config.description,
          percent,
          level,
          gradient: config.gradient,
          readout: `${percent}% load`,
        };
      });

      const dominantCategory = categories.reduce<SystemLoadCategory | null>(
        (acc, cat) => (cat.percent > (acc?.percent ?? -1) ? cat : acc),
        null,
      );

      const snapshotTotal = Number(metrics?.analytics?.systemLoad?.total);
      const systemIndex = Number.isFinite(snapshotTotal)
        ? Math.max(0, Math.min(100, Math.round(snapshotTotal)))
        : dominantCategory?.percent ?? 0;

      const systemLevel = getLevel(systemIndex);

      return {
        categories,
        systemIndex,
        systemLevel,
        dominantCategory,
      };
    }

    const systemSnapshot = metrics?.analytics?.systemLoad;
    const pathwayLoads: PathwayLoads = metrics?.analytics?.pathwayLoads ?? {};
    const labs: ProjectedLabs = {
      hematocrit: 45,
      ldl: 100,
      ast: 25,
      alt: 25,
      creatinine: 1,
      neuroRisk: 0,
      ...(metrics?.analytics?.projectedLabs ?? {}),
    };

    const categories = CATEGORY_CONFIGS.map((config) => {
      const rawValue = Math.max(0, config.computeValue(pathwayLoads, labs));
      const percent = clampPercent(rawValue, config.limit);
      const level = getLevel(percent);
      const readout = config.formatReadout
        ? config.formatReadout(rawValue, labs, config.limit)
        : formatCapacityReadout(rawValue, config.limit);

      return {
        id: config.id,
        label: config.label,
        description: config.description,
        percent,
        level,
        gradient: config.gradient,
        readout,
      };
    });

    const fallbackIndex = categories.length
      ? Math.round(
          categories.reduce((sum, cat) => sum + cat.percent, 0) /
            categories.length,
        )
      : 0;

    const fallbackDominant = categories.reduce<SystemLoadCategory | null>(
      (acc, cat) => {
        if (!acc || cat.percent > acc.percent) return cat;
        return acc;
      },
      null,
    );

    const snapshotTotal = Number(systemSnapshot?.total);
    const systemIndex = Number.isFinite(snapshotTotal)
      ? Math.max(0, Math.min(100, Math.round(snapshotTotal)))
      : fallbackIndex;

    const systemLevel = getLevel(systemIndex);

    const dominantCategoryId = systemSnapshot?.dominantPressure
      ? PRESSURE_TO_CATEGORY[systemSnapshot.dominantPressure]
      : null;

    const dominantCategory = dominantCategoryId
      ? categories.find((cat) => cat.id === dominantCategoryId) || fallbackDominant
      : fallbackDominant;

    return {
      categories,
      systemIndex,
      systemLevel,
      dominantCategory,
    };
  }, [metrics, scrubbedPoint]);
};
