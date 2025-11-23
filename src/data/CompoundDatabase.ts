import { COMPOUNDS } from "./compounds";
import { COMPOUND_ONTOLOGY, deriveLegacyVectors } from "./compoundOntology";
import { BASE_VECTOR_SCORES, ZERO_VECTORS, CompoundVectors } from "./compoundVectors";

export type { CompoundVectors } from "./compoundVectors";

export type CompoundType = "Injectable" | "Oral" | "Ancillary";

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

const VECTOR_SCORES: Record<string, CompoundVectors> = { ...BASE_VECTOR_SCORES };

Object.values(COMPOUND_ONTOLOGY).forEach(entry => {
  const derived = deriveLegacyVectors(entry);
  VECTOR_SCORES[entry.id] = derived;
  entry.aliases?.forEach(alias => {
    VECTOR_SCORES[alias] = derived;
  });
});

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
