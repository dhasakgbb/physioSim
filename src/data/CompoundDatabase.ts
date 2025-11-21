import { compoundData } from "./compoundData";

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
  trenbolone: { hypertrophy: 9, neural: 10, lipolysis: 9, endurance: 2, glycogen: 7 },
  eq: { hypertrophy: 5, neural: 4, lipolysis: 6, endurance: 10, glycogen: 5 },
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

const LEGACY_DATA = compoundData as Record<string, any>;
const LEGACY_IDS = Object.keys(LEGACY_DATA);

const normalizeType = (legacyType?: string, category?: string): CompoundType => {
  if (category === "ancillary") return "Ancillary";
  if (legacyType?.toLowerCase() === "oral") return "Oral";
  return "Injectable";
};

const deriveHalfLife = (source: any): number => {
  if (typeof source?.halfLife === "number") return source.halfLife;
  const defaultEsterKey = source?.defaultEster;
  if (defaultEsterKey && source?.esters?.[defaultEsterKey]?.halfLife) {
    return source.esters[defaultEsterKey].halfLife;
  }
  const firstEsterKey = Object.keys(source?.esters || {})[0];
  if (firstEsterKey && source.esters[firstEsterKey]?.halfLife) {
    return source.esters[firstEsterKey].halfLife;
  }
  return 24; // fallback: 1 day
};

const resolveBioavailability = (type: CompoundType, source: any): number => {
  if (type === "Injectable") return 1;
  const legacy = typeof source?.bioavailability === "number" ? source.bioavailability : null;
  if (legacy != null) return legacy;
  if (type === "Ancillary") return 1;
  return 0.85;
};

const buildCompound = (id: string): Compound => {
  const source = LEGACY_DATA[id];
  if (!source) {
    throw new Error(`Compound '${id}' not found in legacy database`);
  }

  const type = normalizeType(source.type, source.category);
  const bioavailability = resolveBioavailability(type, source);
  const vectors = VECTOR_SCORES[id] ?? ZERO_VECTORS;

  return {
    id,
    name: source.name ?? id,
    type,
    bioavailability,
    halfLife: deriveHalfLife(source),
    vectors,
    color: source.color,
    abbreviation: source.abbreviation,
    category: source.category,
    pathway: source.pathway,
    bindingAffinity: source.bindingAffinity,
    defaultEster: source.defaultEster,
    esters: source.esters,
    suppressiveFactor: source.suppressiveFactor,
    flags: source.flags,
    biomarkers: source.biomarkers,
    methodology: source.methodology,
    varianceDrivers: source.varianceDrivers,
    benefitCurve: source.benefitCurve,
    riskCurve: source.riskCurve,
    sideEffectProfile: source.sideEffectProfile,
    ancillaryRequirements: source.ancillaryRequirements,
    evidenceProvenance: source.evidenceProvenance,
    modelConfidence: source.modelConfidence,
  };
};

export const COMPOUND_LIBRARY: Compound[] = LEGACY_IDS.map(buildCompound);

export const COMPOUND_INDEX: Record<string, Compound> = COMPOUND_LIBRARY.reduce(
  (acc, compound) => {
    acc[compound.id] = compound;
    return acc;
  },
  {} as Record<string, Compound>,
);
