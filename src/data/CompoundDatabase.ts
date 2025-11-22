import { COMPOUNDS } from "./compounds";

export type CompoundType = "Injectable" | "Oral" | "Ancillary";

// The 5 Physiological Vectors (Scale 0-10)
export interface CompoundVectors {
  hypertrophy: number; // Tissue Accretion (Nitrogen Retention)
  neural: number; // CNS Stimulation (Strength/Aggression)
  lipolysis: number; // Adipose Oxidation (Hardening)
  endurance: number; // RBC Production (Work Capacity)
  glycogen: number; // Intracellular Hydration (Fullness/Pump)
}

export interface CompoundEster {
  label: string;
  halfLife: number;
  weight: number;
  slug: string;
  bioavailability?: number;
  isBlend?: boolean;
}

export interface Compound {
  id: string;
  name: string;
  type: CompoundType;
  bioavailability: number; // 1.0 for injectables, 0.8-0.9 for most orals
  halfLife: number; // In hours
  vectors: CompoundVectors;
  color?: string;
  abbreviation?: string;
  category?: string;
  pathway?: string;
  bindingAffinity?: string;
  defaultEster?: string;
  esters?: Record<string, CompoundEster>;
  suppressiveFactor?: number;
  flags?: Record<string, unknown>;
  biomarkers?: Record<string, number>;
  methodology?: unknown;
  varianceDrivers?: string[];
  benefitCurve?: unknown[];
  riskCurve?: unknown[];
  sideEffectProfile?: unknown;
  ancillaryRequirements?: unknown;
  evidenceProvenance?: Record<string, number>;
  modelConfidence?: number;
}

const ZERO_VECTORS: CompoundVectors = {
  hypertrophy: 0,
  neural: 0,
  lipolysis: 0,
  endurance: 0,
  glycogen: 0,
};

const VECTOR_SCORES: Record<string, CompoundVectors> = {
  testosterone: { hypertrophy: 7, neural: 6, lipolysis: 5, endurance: 6, glycogen: 6 },
  npp: { hypertrophy: 8, neural: 3, lipolysis: 3, endurance: 5, glycogen: 9 },
  nandrolone: { hypertrophy: 8, neural: 3, lipolysis: 3, endurance: 5, glycogen: 9 }, // Alias for npp/deca
  trenbolone: { hypertrophy: 9, neural: 10, lipolysis: 9, endurance: 2, glycogen: 7 },
  eq: { hypertrophy: 5, neural: 4, lipolysis: 6, endurance: 10, glycogen: 5 },
  equipoise: { hypertrophy: 5, neural: 4, lipolysis: 6, endurance: 10, glycogen: 5 },
  masteron: { hypertrophy: 4, neural: 8, lipolysis: 9, endurance: 6, glycogen: 2 },
  primobolan: { hypertrophy: 6, neural: 5, lipolysis: 7, endurance: 7, glycogen: 3 },
  dhb: { hypertrophy: 8, neural: 7, lipolysis: 7, endurance: 6, glycogen: 4 },
  ment: { hypertrophy: 10, neural: 7, lipolysis: 4, endurance: 5, glycogen: 10 },
  dianabol: { hypertrophy: 8, neural: 6, lipolysis: 2, endurance: 4, glycogen: 10 },
  anadrol: { hypertrophy: 10, neural: 8, lipolysis: 1, endurance: 3, glycogen: 10 },
  winstrol: { hypertrophy: 5, neural: 7, lipolysis: 8, endurance: 6, glycogen: 1 },
  anavar: { hypertrophy: 6, neural: 7, lipolysis: 9, endurance: 8, glycogen: 4 },
  superdrol: { hypertrophy: 9, neural: 6, lipolysis: 6, endurance: 3, glycogen: 10 },
  halotestin: { hypertrophy: 2, neural: 10, lipolysis: 7, endurance: 5, glycogen: 1 },
  turinabol: { hypertrophy: 6, neural: 5, lipolysis: 5, endurance: 8, glycogen: 3 },
  proviron: { hypertrophy: 1, neural: 4, lipolysis: 5, endurance: 2, glycogen: 1 },
  arimidex: { hypertrophy: 0, neural: 0, lipolysis: 0, endurance: 0, glycogen: 0 },
  finasteride: { hypertrophy: 0, neural: 0, lipolysis: 0, endurance: 0, glycogen: 0 },
};

const normalizeType = (classification?: string): CompoundType => {
  if (classification === "Ancillary") return "Ancillary";
  // Check administration routes for Oral
  // This is a simplification, but works for now based on schema
  return "Injectable"; // Default
};

const buildCompound = (id: string): Compound => {
  const source = COMPOUNDS[id];
  if (!source) {
    // Fallback for IDs that might be aliases or missing
    // console.warn(`Compound '${id}' not found in new database`);
    return {
        id,
        name: id,
        type: "Injectable",
        bioavailability: 1,
        halfLife: 24,
        vectors: VECTOR_SCORES[id] || ZERO_VECTORS,
        color: "#9ca3af"
    };
  }

  const type = source.metadata.administrationRoutes.includes("Oral") ? "Oral" : "Injectable";
  const vectors = VECTOR_SCORES[id] ?? ZERO_VECTORS;
  
  // Map esters
  const esters: Record<string, CompoundEster> = {};
  if (source.pk.esters) {
      Object.entries(source.pk.esters).forEach(([key, val]) => {
          esters[key] = {
              label: key,
              halfLife: 24, // Placeholder, need to calculate from Ka or store in schema
              weight: val.molecularWeightRatio,
              slug: key
          };
      });
  }

  return {
    id,
    name: source.metadata.name,
    type,
    bioavailability: source.pk.absorption.oral?.F || 1,
    halfLife: 24, // Placeholder
    vectors,
    color: source.metadata.color,
    abbreviation: source.metadata.abbreviation,
    category: source.metadata.family,
    pathway: "ar_genomic", // Default
    esters,
    // ... map other fields if needed
  };
};

export const COMPOUND_LIBRARY: Compound[] = Object.keys(COMPOUNDS).map(buildCompound);

export const COMPOUND_INDEX: Record<string, Compound> = COMPOUND_LIBRARY.reduce(
  (acc, compound) => {
    acc[compound.id] = compound;
    return acc;
  },
  {} as Record<string, Compound>,
);
