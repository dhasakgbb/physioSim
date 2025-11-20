// Cool-toned categorical color palette for pathways
const CATEGORICAL_COLORS = {
  ar_genomic: '#3b82f6',    // Blue
  neuro: '#0891b2',         // Teal
  non_genomic: '#06b6d4',  // Cyan
  estrogen: '#8b5cf6',     // Purple
  prolactin: '#6366f1',    // Indigo
  progesterone: '#7c3aed', // Violet
  liver: '#0ea5e9',         // Sky blue
  cortisol: '#0891b2',      // Teal
  shbg: '#4f46e5',         // Blue violet
};

export const PATHWAY_NODES = {
  // MECHANISMS (Middle Layer) - Using categorical colors (cool tones)
  ar_genomic: {
    label: "Androgen Receptor",
    color: CATEGORICAL_COLORS.ar_genomic,
    description: "Primary muscle building pathway",
  },
  neuro: {
    label: "Neuro / CNS Stress",
    color: CATEGORICAL_COLORS.neuro,
    description: "Adrenergic signaling & toxicity",
  },
  non_genomic: {
    label: "Non-Genomic / CNS",
    color: CATEGORICAL_COLORS.non_genomic,
    description: "Rapid signaling & strength",
  },
  estrogen: {
    label: "Estrogen (E2)",
    color: CATEGORICAL_COLORS.estrogen,
    description: "Water retention & mood",
  },
  prolactin: {
    label: "Prolactin",
    color: CATEGORICAL_COLORS.prolactin,
    description: "Lactation & sexual side effects",
  },
  progesterone: {
    label: "Progesterone",
    color: CATEGORICAL_COLORS.progesterone,
    description: "19-nor pathway & mood",
  },
  liver: {
    label: "Hepatic Processing",
    color: CATEGORICAL_COLORS.liver,
    description: "Toxicity filter",
  },
  cortisol: {
    label: "Glucocorticoid Block",
    color: CATEGORICAL_COLORS.cortisol,
    description: "Anti-catabolic shielding",
  },
  shbg: {
    label: "SHBG Suppression",
    color: CATEGORICAL_COLORS.shbg,
    description: "Free hormone amplifier",
  },
};

// Which compounds hit which nodes? (0-10 intensity)
export const COMPOUND_VECTORS = {
  // --- BASE COMPOUNDS ---
  testosterone: { ar_genomic: 8, estrogen: 6, igf1: 5, shbg: 2, neuro: 3 },

  // --- 19-NORS ---
  npp: { ar_genomic: 8, prolactin: 6, progesterone: 4, cortisol: 4, liver: 1 },
  trenbolone: { ar_genomic: 10, progesterone: 8, cortisol: 9, prolactin: 6, neuro: 9, liver: 4 },
  ment: { ar_genomic: 10, estrogen: 9, prolactin: 6, igf1: 8 },

  // --- DHT DERIVATIVES ---
  masteron: { ar_genomic: 5, shbg: 6, anti_e: 4, liver: 1 },
  primobolan: { ar_genomic: 6, nitrogen: 7, shbg: 2, liver: 1 },
  winstrol: { non_genomic: 6, shbg: 9, liver: 6, ar_genomic: 4 },
  anavar: { ar_genomic: 4, shbg: 5, liver: 2, non_genomic: 3, cortisol: 3 },
  proviron: { shbg: 10, ar_genomic: 4, neuro: 5, liver: 1 },
  dhb: { ar_genomic: 9, liver: 4, cortisol: 5 },

  // --- ORALS ---
  dianabol: { non_genomic: 9, estrogen: 8, liver: 7, ar_genomic: 3 },
  anadrol: { non_genomic: 10, estrogen: 7, liver: 9, ar_genomic: 2 },
  superdrol: { non_genomic: 9, liver: 9, ar_genomic: 5, igf1: 4 },
  turinabol: { ar_genomic: 5, liver: 4, non_genomic: 5, shbg: 3 },
  halotestin: { ar_genomic: 2, liver: 10, neuro: 10, non_genomic: 8 },

  // --- OTHERS ---
  eq: { ar_genomic: 6, shbg: 3, cortisol: 2, estrogen: 2 },

  // --- ANCILLARIES ---
  arimidex: { estrogen: -8 },
  finasteride: { dht: -8 },
};
