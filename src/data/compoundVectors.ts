export interface CompoundVectors {
  hypertrophy: number; // Tissue Accretion (Nitrogen Retention)
  neural: number; // CNS Stimulation (Strength/Aggression)
  lipolysis: number; // Adipose Oxidation (Hardening)
  endurance: number; // RBC Production (Work Capacity)
  glycogen: number; // Intracellular Hydration (Fullness/Pump)
}

export const ZERO_VECTORS: CompoundVectors = {
  hypertrophy: 0,
  neural: 0,
  lipolysis: 0,
  endurance: 0,
  glycogen: 0,
};

export const BASE_VECTOR_SCORES: Record<string, CompoundVectors> = {
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
