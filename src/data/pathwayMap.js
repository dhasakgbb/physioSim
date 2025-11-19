export const PATHWAY_NODES = {
  // MECHANISMS (Middle Layer)
  ar_genomic: { label: 'Androgen Receptor', color: '#10b981', description: 'Primary muscle building pathway' },
  non_genomic: { label: 'Non-Genomic / CNS', color: '#f59e0b', description: 'Rapid signaling & strength' },
  estrogen: { label: 'Estrogen (E2)', color: '#ec4899', description: 'Water retention & mood' },
  prolactin: { label: 'Progesterone/Prolactin', color: '#8b5cf6', description: '19-nor pathway' },
  liver: { label: 'Hepatic Processing', color: '#ef4444', description: 'Toxicity filter' },
  cortisol: { label: 'Glucocorticoid Block', color: '#06b6d4', description: 'Anti-catabolic shielding' },
  shbg: { label: 'SHBG Suppression', color: '#3b82f6', description: 'Free hormone amplifier' }
};

// Which compounds hit which nodes? (0-10 intensity)
export const COMPOUND_VECTORS = {
  // --- BASE COMPOUNDS ---
  testosterone: { ar_genomic: 8, estrogen: 6, igf1: 5, shbg: 2 },
  
  // --- 19-NORS ---
  npp: { ar_genomic: 8, prolactin: 7, cortisol: 4, liver: 1 },
  trenbolone: { ar_genomic: 10, cortisol: 9, prolactin: 6, neuro: 8, liver: 4 },
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
  halotestin: { ar_genomic: 2, liver: 10, neuro: 9, non_genomic: 8 },
  
  // --- OTHERS ---
  eq: { ar_genomic: 6, shbg: 3, cortisol: 2, estrogen: 2 },
  
  // --- ANCILLARIES ---
  arimidex: { estrogen: -8 },
  finasteride: { dht: -8 }
};
