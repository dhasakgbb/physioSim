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

export const useSystemLoad = (): SystemLoadResult => {
  const { metrics } = useStack() as { metrics?: Record<string, any> };

  return useMemo<SystemLoadResult>(() => {
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

    const systemIndex = categories.length
      ? Math.round(
          categories.reduce((sum, cat) => sum + cat.percent, 0) /
            categories.length,
        )
      : 0;

    const systemLevel = getLevel(systemIndex);

    const dominantCategory = categories.reduce<SystemLoadCategory | null>(
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
      dominantCategory,
    };
  }, [metrics]);
};
