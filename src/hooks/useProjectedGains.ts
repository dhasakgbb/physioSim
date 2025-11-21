import { useMemo } from "react";
import { useStack } from "../context/StackContext";
import {
  COMPOUND_INDEX,
  type Compound,
  type CompoundVectors,
} from "../data/CompoundDatabase";

const VECTOR_KEYS: Array<keyof CompoundVectors> = [
  "hypertrophy",
  "neural",
  "lipolysis",
  "endurance",
  "glycogen",
];

const VECTOR_LABELS: Record<keyof CompoundVectors, { title: string; label: string }> = {
  hypertrophy: {
    title: "Hypertrophy",
    label: "Myofibrillar Hypertrophy",
  },
  neural: {
    title: "Strength",
    label: "Neural Drive",
  },
  lipolysis: {
    title: "Fat Loss",
    label: "Lipolysis",
  },
  endurance: {
    title: "Work Capacity",
    label: "RBC / Endurance",
  },
  glycogen: {
    title: "Fullness",
    label: "Glycogen Retention",
  },
};

const MAX_SAFE_VECTOR_LOAD = 15;
const INTENSITY_SCALE = 10;
const SUPRA_CAP = 11;
const INJECTABLE_REFERENCE = 500; // mg/week
const ORAL_REFERENCE = 350; // mg/week equivalent (50mg/day)
const DIMINISHING_THRESHOLD = 1000; // mg/week
const HIGH_DOSE_CURVE_STRENGTH = 1.25;

const createEmptyTotals = (): CompoundVectors => ({
  hypertrophy: 0,
  neural: 0,
  lipolysis: 0,
  endurance: 0,
  glycogen: 0,
});

const applyHighDoseCurve = (ratio: number): number => {
  if (!Number.isFinite(ratio) || ratio <= 0) return 0;
  if (ratio <= 1) return ratio;
  return 1 + Math.log10(ratio) * HIGH_DOSE_CURVE_STRENGTH;
};

const computeLoadFactor = (compound: Compound | undefined, dose: number | undefined): number => {
  if (!compound || !dose || Number.isNaN(dose)) return 0;
  if (compound.type === "Ancillary") return 0;

  const reference = compound.type === "Injectable" ? INJECTABLE_REFERENCE : ORAL_REFERENCE;
  const normalizedDose = compound.type === "Injectable" ? dose : dose * 7;
  const ratio = normalizedDose / reference;

  return applyHighDoseCurve(ratio);
};

const round = (value: number, precision = 1): number =>
  Number(value.toFixed(precision));

const normalizeIntensity = (raw: number): number => {
  if (!raw || raw <= 0) return 0;
  const scaled = (raw / MAX_SAFE_VECTOR_LOAD) * INTENSITY_SCALE;
  return round(Math.min(scaled, SUPRA_CAP));
};

export interface ProjectedVectorMetric {
  key: keyof CompoundVectors;
  title: string;
  label: string;
  raw: number;
  intensity: number; // 0-11 (supra allowed)
}

export interface ProjectedGainsResult {
  totals: CompoundVectors;
  vectors: ProjectedVectorMetric[];
  netScore: number; // Average intensity on 0-10 scale (11 possible internally)
}

const computeWeeklyDose = (entry: { compound?: string; dose?: number }): number => {
  if (!entry?.compound || !entry?.dose || Number.isNaN(entry.dose)) return 0;
  const compound = COMPOUND_INDEX[entry.compound];
  if (!compound) return 0;
  if (compound.type === "Ancillary") return 0;
  if (compound.type === "Injectable") {
    return entry.dose;
  }
  return entry.dose * 7;
};

export const useProjectedGains = (): ProjectedGainsResult => {
  const { stack } = useStack();

  const rawTotals = useMemo(() => {
    const aggregate = createEmptyTotals();

    (stack || []).forEach((entry: { compound?: string; dose?: number }) => {
      if (!entry?.compound) return;
      const compound = COMPOUND_INDEX[entry.compound];
      if (!compound?.vectors) return;

      const loadFactor = computeLoadFactor(compound, entry.dose);
      if (loadFactor <= 0) return;

      VECTOR_KEYS.forEach((key) => {
        aggregate[key] += compound.vectors[key] * loadFactor;
      });
    });

    return aggregate;
  }, [stack]);

  const totalWeeklyMg = useMemo(() => {
    return (stack || []).reduce((sum: number, entry: { compound?: string; dose?: number }) => {
      return sum + computeWeeklyDose(entry);
    }, 0);
  }, [stack]);

  const diminishingMultiplier = useMemo(() => {
    if (totalWeeklyMg <= DIMINISHING_THRESHOLD || totalWeeklyMg <= 0) return 1;
    const linearFactor = totalWeeklyMg / DIMINISHING_THRESHOLD;
    const logFactor = 1 + Math.log10(linearFactor);
    const multiplier = logFactor / linearFactor;
    return Math.max(0, Math.min(multiplier, 1));
  }, [totalWeeklyMg]);

  const dampenedTotals = useMemo(() => {
    const next = createEmptyTotals();
    VECTOR_KEYS.forEach((key) => {
      next[key] = rawTotals[key] * diminishingMultiplier;
    });
    return next;
  }, [rawTotals, diminishingMultiplier]);

  const vectors = useMemo<ProjectedVectorMetric[]>(() => {
    return VECTOR_KEYS.map((key) => {
      const raw = round(dampenedTotals[key]);
      const intensity = normalizeIntensity(dampenedTotals[key]);
      return {
        key,
        title: VECTOR_LABELS[key].title,
        label: VECTOR_LABELS[key].label,
        raw,
        intensity,
      };
    });
  }, [dampenedTotals]);

  const netScore = round(
    vectors.reduce((sum, vector) => sum + vector.intensity, 0) /
      (vectors.length || 1),
  );

  return {
    totals: dampenedTotals,
    vectors,
    netScore,
  };
};
