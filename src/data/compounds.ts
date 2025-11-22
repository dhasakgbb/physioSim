import { ICompoundSchema, IEsterDefinition } from '../types/physio';

// Helper to calculate Clearance (CL) from Half-Life and Vd
// t1/2 = (ln(2) * Vd) / CL  => CL = (ln(2) * Vd) / t1/2
// Vd in L/kg, t1/2 in hours, CL in mL/min/kg
function calculateCL(halfLifeHours: number, Vd_L_kg: number = 0.6): number {
  if (halfLifeHours <= 0) return 1000; // Instant clearance
  const CL_L_h_kg = (Math.log(2) * Vd_L_kg) / halfLifeHours;
  // Convert L/h/kg to mL/min/kg
  // (L * 1000) / 60
  return (CL_L_h_kg * 1000) / 60;
}

// Common Esters
const ESTERS: Record<string, IEsterDefinition> = {
  propionate: {
    id: 'propionate',
    molecularWeightRatio: 0.8, // Approx
    absorptionModel: 'FirstOrder',
    parameters: { Ka: 0.05 } // t1/2 ~ 14h absorption
  },
  enanthate: {
    id: 'enanthate',
    molecularWeightRatio: 0.7,
    absorptionModel: 'FirstOrder',
    parameters: { Ka: 0.01 } // t1/2 ~ 3-4 days absorption
  },
  cypionate: {
    id: 'cypionate',
    molecularWeightRatio: 0.69,
    absorptionModel: 'FirstOrder',
    parameters: { Ka: 0.008 }
  },
  acetate: {
    id: 'acetate',
    molecularWeightRatio: 0.87,
    absorptionModel: 'FirstOrder',
    parameters: { Ka: 0.1 } // Fast
  },
  decanoate: {
    id: 'decanoate',
    molecularWeightRatio: 0.64,
    absorptionModel: 'FirstOrder',
    parameters: { Ka: 0.005 } // Slow
  },
  undecanoate: {
    id: 'undecanoate',
    molecularWeightRatio: 0.61,
    absorptionModel: 'DualPhase',
    parameters: { Ka_fast: 0.01, Ka_slow: 0.001, fractionFast: 0.2 }
  },
  none: {
    id: 'none',
    molecularWeightRatio: 1.0,
    absorptionModel: 'FirstOrder',
    parameters: { Ka: 10.0 } // Instant
  }
};

export const COMPOUNDS: Record<string, ICompoundSchema> = {
  testosterone: {
    id: 'testosterone',
    metadata: {
      name: 'Testosterone',
      abbreviation: 'Test',
      classification: 'AAS',
      family: 'Testosterone-derived',
      administrationRoutes: ['IM', 'Transdermal'],
      chemicalProperties: {
        molecularWeight: 288.42,
        PubChem_CID: 6013
      },
      structuralFlags: { isC17aa: false, is19Nor: false },
      color: '#3B82F6',
      description: 'The primary male sex hormone and anabolic steroid.'
    },
    clinical: {
      summary: 'Testosterone is the foundational anabolic steroid. It promotes muscle growth, bone density, and libido.',
      benefitRationale: 'Direct AR agonism and conversion to DHT/Estrogen provides comprehensive physiological support.',
      riskRationale: 'Aromatization to estrogen can cause water retention and gynecomastia. 5AR reduction can accelerate hair loss.'
    },
    pk: {
      Vd: 0.6,
      CL: calculateCL(1.5), // IV half-life is short (~10-100 min), but effective half-life with ester is different. 
                            // Here we define the PARENT compound PK. 
                            // Test base half-life is very short (~10-100 mins). Let's say 1.5h.
      proteinBinding: {
        SHBG_Kd: 1.0, // nM (High affinity)
        Albumin_Kd: 10000 // nM (Low affinity)
      },
      absorption: {
        oral: { F: 0.05, Ka: 2.0 } // Very poor oral bioavailability
      },
      esters: {
        propionate: ESTERS.propionate,
        enanthate: ESTERS.enanthate,
        cypionate: ESTERS.cypionate,
        sustanon: { ...ESTERS.undecanoate, id: 'sustanon' } // Placeholder for blend
      }
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 1.0, activityType: 'FullAgonist', Emax: 100, EC50: 10, Hill_n: 1.0 },
        ER_alpha: { Kd: 5.0, activityType: 'FullAgonist', Emax: 80, EC50: 20, Hill_n: 1.0 } // Via aromatization (modeled separately ideally, but here as direct for simplicity if needed)
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: true, Km: 25, Vmax_relative: 1.0, isInhibitor: false },
        FiveAlphaReductase_SRD5A: { isSubstrate: true, Km: 15, Vmax_relative: 1.0, isInhibitor: false }
      },
      pathwayModulation: {
        genomic: {
          myogenesis: { Emax: 100, EC50: 10, Hill_n: 1.2 },
          erythropoiesis: { Emax: 60, EC50: 15, Hill_n: 1.0 },
          lipolysis: { Emax: 40, EC50: 20, Hill_n: 1.0 }
        },
        nonGenomic: {
          cns_activation: { Emax: 50, EC50: 30, Hill_n: 1.5 },
          glycogen_synthesis: { Emax: 60, EC50: 15, Hill_n: 1.0 }
        },
        systemic: {
          HPTA_suppression: { Emax: 100, EC50: 5, Hill_n: 2.0 }, // Sensitive
          SHBG_synthesis_modulation: { Emax: -50, EC50: 20, Hill_n: 1.0 }
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Coefficient', parameters: { coefficient: 0.1 } },
      renal: { modelType: 'Coefficient', parameters: { coefficient: 0.2 } },
      cardiovascular: { modelType: 'Hill_TC50', parameters: { Emax: 100, TC50: 200, Hill_n: 2.0 } },
      lipid_metabolism: { modelType: 'Hill_TC50', parameters: { Emax: 100, TC50: 150, Hill_n: 1.5 } },
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.2 } }
    },
    provenance: {}
  },

  nandrolone: {
    id: 'nandrolone',
    metadata: {
      name: 'Nandrolone',
      abbreviation: 'Deca',
      classification: 'AAS',
      family: '19-nor',
      administrationRoutes: ['IM'],
      chemicalProperties: { molecularWeight: 274.4, PubChem_CID: 6129 },
      structuralFlags: { isC17aa: false, is19Nor: true },
      color: '#F59E0B',
      description: 'A 19-nor compound known for joint relief and steady mass gains.'
    },
    clinical: {
      summary: 'Nandrolone is highly anabolic with low androgenic activity. It is often used for bulking and joint health.',
      benefitRationale: 'Strong nitrogen retention and collagen synthesis promotion.',
      riskRationale: 'Progestogenic activity can cause prolactin-related side effects. Suppressive to HPTA.'
    },
    pk: {
      Vd: 0.6,
      CL: calculateCL(2.0), // Slightly longer base half-life
      proteinBinding: { SHBG_Kd: 100, Albumin_Kd: 10000 }, // Low SHBG binding
      absorption: {},
      esters: {
        phenylpropionate: ESTERS.propionate, // Reuse prop kinetics approx
        decanoate: ESTERS.decanoate
      }
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 0.5, activityType: 'FullAgonist', Emax: 110, EC50: 8, Hill_n: 1.0 }, // Stronger binder
        PR: { Kd: 10.0, activityType: 'FullAgonist', Emax: 50, EC50: 20, Hill_n: 1.0 } // Progestogenic
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: true, Km: 100, Vmax_relative: 0.2, isInhibitor: false }, // Low aromatization
        FiveAlphaReductase_SRD5A: { isSubstrate: true, Km: 10, Vmax_relative: 1.0, isInhibitor: false } // Converts to DHN
      },
      pathwayModulation: {
        genomic: {
          myogenesis: { Emax: 120, EC50: 8, Hill_n: 1.2 },
          erythropoiesis: { Emax: 40, EC50: 20, Hill_n: 1.0 },
          lipolysis: { Emax: 20, EC50: 30, Hill_n: 1.0 }
        },
        nonGenomic: {
          cns_activation: { Emax: 20, EC50: 50, Hill_n: 1.0 }, // Low CNS
          glycogen_synthesis: { Emax: 80, EC50: 10, Hill_n: 1.0 }
        },
        systemic: {
          HPTA_suppression: { Emax: 100, EC50: 2, Hill_n: 3.0 }, // Very suppressive
          SHBG_synthesis_modulation: { Emax: -20, EC50: 50, Hill_n: 1.0 }
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Coefficient', parameters: { coefficient: 0.1 } },
      renal: { modelType: 'Coefficient', parameters: { coefficient: 0.3 } },
      cardiovascular: { modelType: 'Hill_TC50', parameters: { Emax: 80, TC50: 300, Hill_n: 1.5 } },
      lipid_metabolism: { modelType: 'Hill_TC50', parameters: { Emax: 80, TC50: 250, Hill_n: 1.5 } },
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.4 } } // "Deca Dick" / Mood
    },
    provenance: {}
  },

  trenbolone: {
    id: 'trenbolone',
    metadata: {
      name: 'Trenbolone',
      abbreviation: 'Tren',
      classification: 'AAS',
      family: '19-nor',
      administrationRoutes: ['IM'],
      chemicalProperties: { molecularWeight: 270.37, PubChem_CID: 66359 },
      structuralFlags: { isC17aa: false, is19Nor: true },
      color: '#EF4444',
      description: 'A potent veterinary steroid known for extreme conditioning and strength.'
    },
    clinical: {
      summary: 'Trenbolone is one of the most powerful steroids available, binding strongly to the AR.',
      benefitRationale: 'Massive increases in nutrient efficiency and muscle hardness.',
      riskRationale: 'High toxicity profile including renal stress, neurotoxicity, and cardiovascular strain.'
    },
    pk: {
      Vd: 0.7,
      CL: calculateCL(1.0),
      proteinBinding: { SHBG_Kd: 5.0, Albumin_Kd: 10000 },
      absorption: {},
      esters: {
        acetate: ESTERS.acetate,
        enanthate: ESTERS.enanthate,
        hexahydrobenzylcarbonate: { ...ESTERS.enanthate, id: 'hexahydro' } // Parabolan
      }
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 0.1, activityType: 'FullAgonist', Emax: 200, EC50: 2, Hill_n: 1.5 }, // Massive binding & efficacy
        PR: { Kd: 5.0, activityType: 'FullAgonist', Emax: 60, EC50: 15, Hill_n: 1.0 },
        GR: { Kd: 2.0, activityType: 'Antagonist', Emax: 0, EC50: 10, Hill_n: 1.0 } // Anti-catabolic (Cortisol blocker)
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: false, isInhibitor: false },
        FiveAlphaReductase_SRD5A: { isSubstrate: false, isInhibitor: false }
      },
      pathwayModulation: {
        genomic: {
          myogenesis: { Emax: 150, EC50: 2, Hill_n: 1.5 },
          erythropoiesis: { Emax: 70, EC50: 10, Hill_n: 1.0 },
          lipolysis: { Emax: 100, EC50: 5, Hill_n: 1.5 }
        },
        nonGenomic: {
          cns_activation: { Emax: 100, EC50: 5, Hill_n: 2.0 }, // Aggression
          glycogen_synthesis: { Emax: 90, EC50: 5, Hill_n: 1.0 }
        },
        systemic: {
          HPTA_suppression: { Emax: 100, EC50: 1, Hill_n: 4.0 }, // Shutdown
          SHBG_synthesis_modulation: { Emax: -60, EC50: 10, Hill_n: 1.0 }
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Coefficient', parameters: { coefficient: 0.3 } },
      renal: { modelType: 'Hill_TC50', parameters: { Emax: 100, TC50: 100, Hill_n: 2.0 } },
      cardiovascular: { modelType: 'Hill_TC50', parameters: { Emax: 100, TC50: 80, Hill_n: 2.0 } },
      lipid_metabolism: { modelType: 'Hill_TC50', parameters: { Emax: 100, TC50: 50, Hill_n: 2.0 } },
      neurotoxicity: { modelType: 'Hill_TC50', parameters: { Emax: 100, TC50: 60, Hill_n: 2.0 } }
    },
    provenance: {}
  },
  
  primobolan: {
    id: 'primobolan',
    metadata: {
      name: 'Primobolan',
      abbreviation: 'Primo',
      classification: 'AAS',
      family: 'DHT-derived',
      administrationRoutes: ['IM', 'Oral'],
      chemicalProperties: { molecularWeight: 302.45 },
      structuralFlags: { isC17aa: false, is19Nor: false }
    },
    pk: {
      Vd: 0.6,
      CL: calculateCL(2.0),
      proteinBinding: { SHBG_Kd: 2.0, Albumin_Kd: 10000 },
      absorption: { oral: { F: 0.7, Ka: 1.5 } }, // Acetate oral
      esters: {
        enanthate: ESTERS.enanthate,
        acetate: ESTERS.acetate
      }
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 2.0, activityType: 'FullAgonist', Emax: 60, EC50: 20, Hill_n: 1.0 }
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: false, isInhibitor: false },
        FiveAlphaReductase_SRD5A: { isSubstrate: false, isInhibitor: false }
      },
      pathwayModulation: {
        genomic: {
          myogenesis: { Emax: 50, EC50: 20, Hill_n: 1.0 },
          erythropoiesis: { Emax: 20, EC50: 50, Hill_n: 1.0 },
          lipolysis: { Emax: 60, EC50: 15, Hill_n: 1.0 }
        },
        nonGenomic: {
          cns_activation: { Emax: 30, EC50: 40, Hill_n: 1.0 },
          glycogen_synthesis: { Emax: 40, EC50: 30, Hill_n: 1.0 }
        },
        systemic: {
          HPTA_suppression: { Emax: 60, EC50: 50, Hill_n: 1.0 },
          SHBG_synthesis_modulation: { Emax: -30, EC50: 40, Hill_n: 1.0 }
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Coefficient', parameters: { coefficient: 0.1 } },
      renal: { modelType: 'Coefficient', parameters: { coefficient: 0.1 } },
      cardiovascular: { modelType: 'Coefficient', parameters: { coefficient: 0.1 } },
      lipid_metabolism: { modelType: 'Coefficient', parameters: { coefficient: 0.2 } },
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.1 } }
    },
    provenance: {}
  },

  dianabol: {
    id: 'dianabol',
    metadata: {
      name: 'Dianabol',
      abbreviation: 'Dbol',
      classification: 'AAS',
      family: 'Testosterone-derived',
      administrationRoutes: ['Oral'],
      chemicalProperties: { molecularWeight: 300.44 },
      structuralFlags: { isC17aa: true, is19Nor: false }
    },
    pk: {
      Vd: 0.6,
      CL: calculateCL(4.0), // 4h half-life
      proteinBinding: { SHBG_Kd: 5.0, Albumin_Kd: 10000 },
      absorption: { oral: { F: 0.8, Ka: 2.0 } },
      esters: {}
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 5.0, activityType: 'FullAgonist', Emax: 100, EC50: 10, Hill_n: 1.0 },
        ER_alpha: { Kd: 2.0, activityType: 'FullAgonist', Emax: 120, EC50: 5, Hill_n: 1.5 } // Methyl-estradiol
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: true, Km: 10, Vmax_relative: 2.0, isInhibitor: false },
        FiveAlphaReductase_SRD5A: { isSubstrate: false, isInhibitor: false }
      },
      pathwayModulation: {
        genomic: {
          myogenesis: { Emax: 100, EC50: 10, Hill_n: 1.2 },
          erythropoiesis: { Emax: 50, EC50: 20, Hill_n: 1.0 },
          lipolysis: { Emax: 10, EC50: 100, Hill_n: 1.0 }
        },
        nonGenomic: {
          cns_activation: { Emax: 80, EC50: 10, Hill_n: 1.5 },
          glycogen_synthesis: { Emax: 100, EC50: 5, Hill_n: 1.5 }
        },
        systemic: {
          HPTA_suppression: { Emax: 100, EC50: 5, Hill_n: 2.0 },
          SHBG_synthesis_modulation: { Emax: -70, EC50: 10, Hill_n: 1.0 }
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Hill_TC50', parameters: { Emax: 100, TC50: 50, Hill_n: 2.0 } },
      renal: { modelType: 'Coefficient', parameters: { coefficient: 0.5 } },
      cardiovascular: { modelType: 'Hill_TC50', parameters: { Emax: 80, TC50: 80, Hill_n: 1.5 } },
      lipid_metabolism: { modelType: 'Hill_TC50', parameters: { Emax: 90, TC50: 60, Hill_n: 1.5 } },
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.3 } }
    },
    provenance: {}
  },

  masteron: {
    id: 'masteron',
    metadata: {
      name: 'Masteron',
      abbreviation: 'Mast',
      classification: 'AAS',
      family: 'DHT-derived',
      administrationRoutes: ['IM'],
      chemicalProperties: { molecularWeight: 304.47, PubChem_CID: 15201 },
      structuralFlags: { isC17aa: false, is19Nor: false }
    },
    pk: {
      Vd: 0.6,
      CL: calculateCL(1.0), // Fast clearance of base
      proteinBinding: { SHBG_Kd: 0.5, Albumin_Kd: 10000 }, // High SHBG affinity
      absorption: {},
      esters: {
        propionate: ESTERS.propionate,
        enanthate: ESTERS.enanthate
      }
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 0.4, activityType: 'FullAgonist', Emax: 80, EC50: 10, Hill_n: 1.0 },
        ER_alpha: { Kd: 10.0, activityType: 'Antagonist', Emax: 0, EC50: 20, Hill_n: 1.0 } // SERM-like
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: false, isInhibitor: true, Ki: 50 }, // AI activity
        FiveAlphaReductase_SRD5A: { isSubstrate: false, isInhibitor: false }
      },
      pathwayModulation: {
        genomic: {
          myogenesis: { Emax: 60, EC50: 15, Hill_n: 1.0 },
          erythropoiesis: { Emax: 30, EC50: 30, Hill_n: 1.0 },
          lipolysis: { Emax: 80, EC50: 10, Hill_n: 1.0 } // Hardening
        },
        nonGenomic: {
          cns_activation: { Emax: 70, EC50: 20, Hill_n: 1.2 },
          glycogen_synthesis: { Emax: 50, EC50: 20, Hill_n: 1.0 }
        },
        systemic: {
          HPTA_suppression: { Emax: 50, EC50: 30, Hill_n: 1.0 },
          SHBG_synthesis_modulation: { Emax: -40, EC50: 20, Hill_n: 1.0 }
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Coefficient', parameters: { coefficient: 0.1 } },
      renal: { modelType: 'Coefficient', parameters: { coefficient: 0.1 } },
      cardiovascular: { modelType: 'Coefficient', parameters: { coefficient: 0.2 } }, // Lipid impact
      lipid_metabolism: { modelType: 'Hill_TC50', parameters: { Emax: 80, TC50: 100, Hill_n: 1.5 } },
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.2 } }
    },
    provenance: {}
  },

  equipoise: {
    id: 'equipoise',
    metadata: {
      name: 'Equipoise',
      abbreviation: 'EQ',
      classification: 'AAS',
      family: 'Testosterone-derived',
      administrationRoutes: ['IM'],
      chemicalProperties: { molecularWeight: 286.41, PubChem_CID: 13344 },
      structuralFlags: { isC17aa: false, is19Nor: false }
    },
    pk: {
      Vd: 0.7,
      CL: calculateCL(2.0),
      proteinBinding: { SHBG_Kd: 5.0, Albumin_Kd: 10000 },
      absorption: {},
      esters: {
        undecylenate: {
          id: 'undecylenate',
          molecularWeightRatio: 0.6, // Approx
          absorptionModel: 'FirstOrder',
          parameters: { Ka: 0.004 } // Very slow (weeks)
        },
        cypionate: ESTERS.cypionate
      }
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 0.7, activityType: 'FullAgonist', Emax: 80, EC50: 15, Hill_n: 1.0 }
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: true, Km: 50, Vmax_relative: 0.5, isInhibitor: false }, // Low aromatization
        FiveAlphaReductase_SRD5A: { isSubstrate: true, Km: 20, Vmax_relative: 0.8, isInhibitor: false }
      },
      pathwayModulation: {
        genomic: {
          myogenesis: { Emax: 70, EC50: 20, Hill_n: 1.0 },
          erythropoiesis: { Emax: 100, EC50: 10, Hill_n: 1.5 }, // RBC boost
          lipolysis: { Emax: 40, EC50: 30, Hill_n: 1.0 }
        },
        nonGenomic: {
          cns_activation: { Emax: 40, EC50: 40, Hill_n: 1.0 }, // Anxiety potential
          glycogen_synthesis: { Emax: 70, EC50: 20, Hill_n: 1.0 }
        },
        systemic: {
          HPTA_suppression: { Emax: 70, EC50: 20, Hill_n: 1.5 },
          SHBG_synthesis_modulation: { Emax: -40, EC50: 30, Hill_n: 1.0 }
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Coefficient', parameters: { coefficient: 0.1 } },
      renal: { modelType: 'Coefficient', parameters: { coefficient: 0.3 } }, // BP/Kidney
      cardiovascular: { modelType: 'Hill_TC50', parameters: { Emax: 60, TC50: 150, Hill_n: 1.5 } }, // Hematocrit
      lipid_metabolism: { modelType: 'Coefficient', parameters: { coefficient: 0.2 } },
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.3 } } // Anxiety
    },
    provenance: {}
  },

  anadrol: {
    id: 'anadrol',
    metadata: {
      name: 'Anadrol',
      abbreviation: 'Adrol',
      classification: 'AAS',
      family: 'DHT-derived',
      administrationRoutes: ['Oral'],
      chemicalProperties: { molecularWeight: 332.48, PubChem_CID: 6010 },
      structuralFlags: { isC17aa: true, is19Nor: false }
    },
    pk: {
      Vd: 0.6,
      CL: calculateCL(9.0), // ~9h half-life
      proteinBinding: { SHBG_Kd: 10.0, Albumin_Kd: 10000 },
      absorption: { oral: { F: 0.8, Ka: 1.5 } },
      esters: {}
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 100.0, activityType: 'FullAgonist', Emax: 120, EC50: 50, Hill_n: 1.0 }, // Low affinity, high efficacy via non-genomic?
        ER_alpha: { Kd: 5.0, activityType: 'FullAgonist', Emax: 80, EC50: 20, Hill_n: 1.0 } // Estrogenic via crosstalk
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: false, isInhibitor: false },
        FiveAlphaReductase_SRD5A: { isSubstrate: false, isInhibitor: false }
      },
      pathwayModulation: {
        genomic: {
          myogenesis: { Emax: 130, EC50: 15, Hill_n: 1.5 }, // Strong mass builder
          erythropoiesis: { Emax: 120, EC50: 5, Hill_n: 1.5 }, // RBC
          lipolysis: { Emax: 20, EC50: 50, Hill_n: 1.0 }
        },
        nonGenomic: {
          cns_activation: { Emax: 60, EC50: 20, Hill_n: 1.0 },
          glycogen_synthesis: { Emax: 120, EC50: 10, Hill_n: 1.5 } // Fullness
        },
        systemic: {
          HPTA_suppression: { Emax: 90, EC50: 10, Hill_n: 2.0 },
          SHBG_synthesis_modulation: { Emax: -60, EC50: 20, Hill_n: 1.0 }
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Hill_TC50', parameters: { Emax: 120, TC50: 40, Hill_n: 2.5 } }, // Very toxic
      renal: { modelType: 'Coefficient', parameters: { coefficient: 0.4 } },
      cardiovascular: { modelType: 'Hill_TC50', parameters: { Emax: 100, TC50: 60, Hill_n: 2.0 } }, // BP
      lipid_metabolism: { modelType: 'Hill_TC50', parameters: { Emax: 100, TC50: 50, Hill_n: 2.0 } },
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.2 } }
    },
    provenance: {}
  },

  winstrol: {
    id: 'winstrol',
    metadata: {
      name: 'Winstrol',
      abbreviation: 'Winny',
      classification: 'AAS',
      family: 'DHT-derived',
      administrationRoutes: ['Oral', 'IM'],
      chemicalProperties: { molecularWeight: 328.49, PubChem_CID: 25249 },
      structuralFlags: { isC17aa: true, is19Nor: false }
    },
    pk: {
      Vd: 0.6,
      CL: calculateCL(9.0), // ~9h half-life oral (24h inj)
      proteinBinding: { SHBG_Kd: 0.1, Albumin_Kd: 10000 }, // Crushes SHBG (High affinity)
      absorption: { oral: { F: 0.9, Ka: 2.0 } },
      esters: {
        none: ESTERS.none // Suspension
      }
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 1.8, activityType: 'FullAgonist', Emax: 70, EC50: 20, Hill_n: 1.0 },
        GR: { Kd: 10.0, activityType: 'Antagonist', Emax: 0, EC50: 50, Hill_n: 1.0 } // Anti-progesterone/cortisol?
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: false, isInhibitor: false },
        FiveAlphaReductase_SRD5A: { isSubstrate: false, isInhibitor: false }
      },
      pathwayModulation: {
        genomic: {
          myogenesis: { Emax: 60, EC50: 20, Hill_n: 1.0 },
          erythropoiesis: { Emax: 40, EC50: 30, Hill_n: 1.0 },
          lipolysis: { Emax: 90, EC50: 10, Hill_n: 1.2 } // Drying
        },
        nonGenomic: {
          cns_activation: { Emax: 50, EC50: 30, Hill_n: 1.0 },
          glycogen_synthesis: { Emax: 50, EC50: 30, Hill_n: 1.0 }
        },
        systemic: {
          HPTA_suppression: { Emax: 60, EC50: 30, Hill_n: 1.5 },
          SHBG_synthesis_modulation: { Emax: -90, EC50: 5, Hill_n: 2.0 } // Massive reduction
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Hill_TC50', parameters: { Emax: 100, TC50: 50, Hill_n: 2.0 } },
      renal: { modelType: 'Coefficient', parameters: { coefficient: 0.3 } },
      cardiovascular: { modelType: 'Hill_TC50', parameters: { Emax: 90, TC50: 70, Hill_n: 2.0 } }, // Lipids
      lipid_metabolism: { modelType: 'Hill_TC50', parameters: { Emax: 120, TC50: 40, Hill_n: 2.5 } }, // Worst for HDL
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.1 } }
    },
    provenance: {}
  },

  anavar: {
    id: 'anavar',
    metadata: {
      name: 'Anavar',
      abbreviation: 'Var',
      classification: 'AAS',
      family: 'DHT-derived',
      administrationRoutes: ['Oral'],
      chemicalProperties: { molecularWeight: 306.44, PubChem_CID: 5878 },
      structuralFlags: { isC17aa: true, is19Nor: false },
      color: '#FCD34D',
      description: 'Mild, well-tolerated oral known for strength and hardening.'
    },
    clinical: {
      summary: 'Oxandrolone is a unique oral steroid with high anabolic activity but low androgenic effects. It is often used for cutting and strength.',
      benefitRationale: 'Promotes phosphocreatine synthesis and lipolysis without significant water retention.',
      riskRationale: 'Hepatotoxic (though less than others) and can skew lipid profiles. Virilization risk is low but present.'
    },
    pk: {
      Vd: 0.5,
      CL: calculateCL(9.0),
      proteinBinding: { SHBG_Kd: 10.0, Albumin_Kd: 10000 },
      absorption: { oral: { F: 0.95, Ka: 2.0 } },
      esters: {}
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 2.0, activityType: 'FullAgonist', Emax: 60, EC50: 30, Hill_n: 1.0 }
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: false, isInhibitor: false },
        FiveAlphaReductase_SRD5A: { isSubstrate: false, isInhibitor: false }
      },
      pathwayModulation: {
        genomic: {
          myogenesis: { Emax: 40, EC50: 30, Hill_n: 1.0 },
          erythropoiesis: { Emax: 20, EC50: 50, Hill_n: 1.0 },
          lipolysis: { Emax: 80, EC50: 20, Hill_n: 1.0 }
        },
        nonGenomic: {
          cns_activation: { Emax: 30, EC50: 50, Hill_n: 1.0 },
          glycogen_synthesis: { Emax: 60, EC50: 20, Hill_n: 1.0 } // CP synthesis
        },
        systemic: {
          HPTA_suppression: { Emax: 40, EC50: 50, Hill_n: 1.0 },
          SHBG_synthesis_modulation: { Emax: -30, EC50: 40, Hill_n: 1.0 }
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Hill_TC50', parameters: { Emax: 60, TC50: 100, Hill_n: 1.5 } }, // Mild
      renal: { modelType: 'Coefficient', parameters: { coefficient: 0.4 } }, // Kidney stress
      cardiovascular: { modelType: 'Hill_TC50', parameters: { Emax: 60, TC50: 100, Hill_n: 1.5 } },
      lipid_metabolism: { modelType: 'Hill_TC50', parameters: { Emax: 80, TC50: 80, Hill_n: 1.5 } },
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.1 } }
    },
    provenance: {}
  },

  superdrol: {
    id: 'superdrol',
    metadata: {
      name: 'Superdrol',
      abbreviation: 'Sdrol',
      classification: 'AAS',
      family: 'DHT-derived',
      administrationRoutes: ['Oral'],
      chemicalProperties: { molecularWeight: 318.45 },
      structuralFlags: { isC17aa: true, is19Nor: false },
      color: '#DC2626',
      description: 'Extremely potent oral for rapid mass, highly toxic.'
    },
    clinical: {
      summary: 'Methasterone is one of the most potent oral steroids ever created. It provides rapid mass and strength gains but is extremely hepatotoxic.',
      benefitRationale: 'Massive glycogen retention and protein synthesis.',
      riskRationale: 'Severe liver toxicity, lipid destruction, and lethargy.'
    },
    pk: {
      Vd: 0.6,
      CL: calculateCL(8.0),
      proteinBinding: { SHBG_Kd: 5.0, Albumin_Kd: 10000 },
      absorption: { oral: { F: 0.9, Ka: 2.0 } },
      esters: {}
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 0.5, activityType: 'FullAgonist', Emax: 150, EC50: 5, Hill_n: 1.5 }
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: false, isInhibitor: false },
        FiveAlphaReductase_SRD5A: { isSubstrate: false, isInhibitor: false }
      },
      pathwayModulation: {
        genomic: {
          myogenesis: { Emax: 140, EC50: 5, Hill_n: 1.5 },
          erythropoiesis: { Emax: 60, EC50: 20, Hill_n: 1.0 },
          lipolysis: { Emax: 30, EC50: 50, Hill_n: 1.0 }
        },
        nonGenomic: {
          cns_activation: { Emax: 40, EC50: 30, Hill_n: 1.0 },
          glycogen_synthesis: { Emax: 150, EC50: 5, Hill_n: 2.0 } // Extreme fullness
        },
        systemic: {
          HPTA_suppression: { Emax: 100, EC50: 5, Hill_n: 3.0 },
          SHBG_synthesis_modulation: { Emax: -80, EC50: 10, Hill_n: 1.5 }
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Hill_TC50', parameters: { Emax: 150, TC50: 20, Hill_n: 3.0 } }, // Severe
      renal: { modelType: 'Coefficient', parameters: { coefficient: 0.5 } },
      cardiovascular: { modelType: 'Hill_TC50', parameters: { Emax: 100, TC50: 50, Hill_n: 2.0 } },
      lipid_metabolism: { modelType: 'Hill_TC50', parameters: { Emax: 120, TC50: 30, Hill_n: 2.5 } },
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.4 } } // Lethargy
    },
    provenance: {}
  },

  halotestin: {
    id: 'halotestin',
    metadata: {
      name: 'Halotestin',
      abbreviation: 'Halo',
      classification: 'AAS',
      family: 'Testosterone-derived',
      administrationRoutes: ['Oral'],
      chemicalProperties: { molecularWeight: 336.44 },
      structuralFlags: { isC17aa: true, is19Nor: false },
      color: '#7F1D1D',
      description: 'Pure strength and aggression, zero water retention.'
    },
    pk: {
      Vd: 0.6,
      CL: calculateCL(9.0),
      proteinBinding: { SHBG_Kd: 1.0, Albumin_Kd: 10000 },
      absorption: { oral: { F: 0.8, Ka: 2.0 } },
      esters: {}
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 1.0, activityType: 'FullAgonist', Emax: 80, EC50: 10, Hill_n: 1.0 }
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: false, isInhibitor: false },
        FiveAlphaReductase_SRD5A: { isSubstrate: false, isInhibitor: false }
      },
      pathwayModulation: {
        genomic: {
          myogenesis: { Emax: 20, EC50: 50, Hill_n: 1.0 }, // Poor mass builder
          erythropoiesis: { Emax: 80, EC50: 10, Hill_n: 1.0 },
          lipolysis: { Emax: 60, EC50: 20, Hill_n: 1.0 }
        },
        nonGenomic: {
          cns_activation: { Emax: 150, EC50: 5, Hill_n: 2.0 }, // Extreme aggression
          glycogen_synthesis: { Emax: 20, EC50: 50, Hill_n: 1.0 }
        },
        systemic: {
          HPTA_suppression: { Emax: 80, EC50: 20, Hill_n: 1.5 },
          SHBG_synthesis_modulation: { Emax: -50, EC50: 30, Hill_n: 1.0 }
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Hill_TC50', parameters: { Emax: 120, TC50: 30, Hill_n: 2.5 } },
      renal: { modelType: 'Coefficient', parameters: { coefficient: 0.3 } },
      cardiovascular: { modelType: 'Hill_TC50', parameters: { Emax: 90, TC50: 60, Hill_n: 2.0 } },
      lipid_metabolism: { modelType: 'Hill_TC50', parameters: { Emax: 100, TC50: 50, Hill_n: 2.0 } },
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.5 } }
    },
    provenance: {}
  },

  turinabol: {
    id: 'turinabol',
    metadata: {
      name: 'Turinabol',
      abbreviation: 'Tbol',
      classification: 'AAS',
      family: 'Testosterone-derived',
      administrationRoutes: ['Oral'],
      chemicalProperties: { molecularWeight: 334.88 },
      structuralFlags: { isC17aa: true, is19Nor: false },
      color: '#60A5FA',
      description: 'A derivative of Dianabol that does not aromatize.'
    },
    pk: {
      Vd: 0.6,
      CL: calculateCL(16.0), // Long half life ~16h
      proteinBinding: { SHBG_Kd: 5.0, Albumin_Kd: 10000 },
      absorption: { oral: { F: 0.9, Ka: 1.5 } },
      esters: {}
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 2.0, activityType: 'FullAgonist', Emax: 70, EC50: 20, Hill_n: 1.0 }
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: false, isInhibitor: false },
        FiveAlphaReductase_SRD5A: { isSubstrate: false, isInhibitor: false }
      },
      pathwayModulation: {
        genomic: {
          myogenesis: { Emax: 60, EC50: 20, Hill_n: 1.0 },
          erythropoiesis: { Emax: 40, EC50: 30, Hill_n: 1.0 },
          lipolysis: { Emax: 40, EC50: 30, Hill_n: 1.0 }
        },
        nonGenomic: {
          cns_activation: { Emax: 40, EC50: 40, Hill_n: 1.0 },
          glycogen_synthesis: { Emax: 50, EC50: 30, Hill_n: 1.0 }
        },
        systemic: {
          HPTA_suppression: { Emax: 60, EC50: 30, Hill_n: 1.0 },
          SHBG_synthesis_modulation: { Emax: -40, EC50: 30, Hill_n: 1.0 }
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Hill_TC50', parameters: { Emax: 70, TC50: 80, Hill_n: 1.5 } },
      renal: { modelType: 'Coefficient', parameters: { coefficient: 0.2 } },
      cardiovascular: { modelType: 'Hill_TC50', parameters: { Emax: 50, TC50: 120, Hill_n: 1.5 } },
      lipid_metabolism: { modelType: 'Hill_TC50', parameters: { Emax: 60, TC50: 100, Hill_n: 1.5 } },
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.1 } }
    },
    provenance: {}
  },

  proviron: {
    id: 'proviron',
    metadata: {
      name: 'Proviron',
      abbreviation: 'Prov',
      classification: 'AAS',
      family: 'DHT-derived',
      administrationRoutes: ['Oral'],
      chemicalProperties: { molecularWeight: 304.47 },
      structuralFlags: { isC17aa: false, is19Nor: false }, // Methylated at C1
      color: '#9CA3AF',
      description: 'Pure androgen, primarily used for SHBG binding and libido.'
    },
    pk: {
      Vd: 0.6,
      CL: calculateCL(12.0),
      proteinBinding: { SHBG_Kd: 0.1, Albumin_Kd: 10000 }, // Highest affinity
      absorption: { oral: { F: 0.6, Ka: 2.0 } },
      esters: {}
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 0.4, activityType: 'FullAgonist', Emax: 40, EC50: 10, Hill_n: 1.0 } // Strong binder, weak anabolic
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: false, isInhibitor: true, Ki: 30 }, // Mild AI
        FiveAlphaReductase_SRD5A: { isSubstrate: false, isInhibitor: false }
      },
      pathwayModulation: {
        genomic: {
          myogenesis: { Emax: 10, EC50: 100, Hill_n: 1.0 },
          erythropoiesis: { Emax: 20, EC50: 50, Hill_n: 1.0 },
          lipolysis: { Emax: 50, EC50: 20, Hill_n: 1.0 }
        },
        nonGenomic: {
          cns_activation: { Emax: 60, EC50: 20, Hill_n: 1.0 }, // Libido
          glycogen_synthesis: { Emax: 10, EC50: 100, Hill_n: 1.0 }
        },
        systemic: {
          HPTA_suppression: { Emax: 30, EC50: 50, Hill_n: 1.0 }, // Mild
          SHBG_synthesis_modulation: { Emax: -20, EC50: 50, Hill_n: 1.0 }
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Coefficient', parameters: { coefficient: 0.05 } }, // Not C17aa
      renal: { modelType: 'Coefficient', parameters: { coefficient: 0.1 } },
      cardiovascular: { modelType: 'Coefficient', parameters: { coefficient: 0.1 } },
      lipid_metabolism: { modelType: 'Coefficient', parameters: { coefficient: 0.1 } },
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.1 } }
    },
    provenance: {}
  },

  dhb: {
    id: 'dhb',
    metadata: {
      name: 'DHB',
      abbreviation: 'DHB',
      classification: 'AAS',
      family: 'Testosterone-derived',
      administrationRoutes: ['IM'],
      chemicalProperties: { molecularWeight: 288.42 },
      structuralFlags: { isC17aa: false, is19Nor: false },
      color: '#8B5CF6',
      description: 'Dihydroboldenone. Structurally similar to Primobolan but stronger.'
    },
    pk: {
      Vd: 0.6,
      CL: calculateCL(2.0),
      proteinBinding: { SHBG_Kd: 2.0, Albumin_Kd: 10000 },
      absorption: {},
      esters: {
        cypionate: ESTERS.cypionate
      }
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 0.5, activityType: 'FullAgonist', Emax: 100, EC50: 10, Hill_n: 1.0 }
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: false, isInhibitor: false },
        FiveAlphaReductase_SRD5A: { isSubstrate: false, isInhibitor: false }
      },
      pathwayModulation: {
        genomic: {
          myogenesis: { Emax: 90, EC50: 10, Hill_n: 1.0 },
          erythropoiesis: { Emax: 60, EC50: 20, Hill_n: 1.0 },
          lipolysis: { Emax: 70, EC50: 15, Hill_n: 1.0 }
        },
        nonGenomic: {
          cns_activation: { Emax: 50, EC50: 30, Hill_n: 1.0 },
          glycogen_synthesis: { Emax: 60, EC50: 20, Hill_n: 1.0 }
        },
        systemic: {
          HPTA_suppression: { Emax: 80, EC50: 10, Hill_n: 1.5 },
          SHBG_synthesis_modulation: { Emax: -50, EC50: 20, Hill_n: 1.0 }
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Coefficient', parameters: { coefficient: 0.1 } },
      renal: { modelType: 'Coefficient', parameters: { coefficient: 0.4 } }, // Kidney stress reported
      cardiovascular: { modelType: 'Hill_TC50', parameters: { Emax: 70, TC50: 100, Hill_n: 1.5 } },
      lipid_metabolism: { modelType: 'Hill_TC50', parameters: { Emax: 70, TC50: 100, Hill_n: 1.5 } },
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.2 } }
    },
    provenance: {}
  },

  ment: {
    id: 'ment',
    metadata: {
      name: 'MENT',
      abbreviation: 'Trest',
      classification: 'AAS',
      family: '19-nor',
      administrationRoutes: ['IM', 'Transdermal'],
      chemicalProperties: { molecularWeight: 288.42 },
      structuralFlags: { isC17aa: false, is19Nor: true },
      color: '#EC4899',
      description: 'Trestolone. Extremely potent 19-nor, aromatizes heavily to 7-alpha-methyl-estradiol.'
    },
    pk: {
      Vd: 0.6,
      CL: calculateCL(0.7), // Very fast clearance
      proteinBinding: { SHBG_Kd: 100, Albumin_Kd: 10000 }, // Does not bind SHBG
      absorption: {},
      esters: {
        acetate: ESTERS.acetate,
        enanthate: ESTERS.enanthate
      }
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 0.1, activityType: 'FullAgonist', Emax: 250, EC50: 1, Hill_n: 1.5 }, // Strongest binder
        PR: { Kd: 2.0, activityType: 'FullAgonist', Emax: 80, EC50: 10, Hill_n: 1.0 },
        ER_alpha: { Kd: 1.0, activityType: 'FullAgonist', Emax: 150, EC50: 5, Hill_n: 1.5 } // Potent estrogen
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: true, Km: 10, Vmax_relative: 2.0, isInhibitor: false }, // Aromatizes to 7a-methyl-E2
        FiveAlphaReductase_SRD5A: { isSubstrate: true, isInhibitor: false } // Reduces to weaker androgen
      },
      pathwayModulation: {
        genomic: {
          myogenesis: { Emax: 200, EC50: 1, Hill_n: 1.5 },
          erythropoiesis: { Emax: 80, EC50: 10, Hill_n: 1.0 },
          lipolysis: { Emax: 50, EC50: 20, Hill_n: 1.0 }
        },
        nonGenomic: {
          cns_activation: { Emax: 80, EC50: 10, Hill_n: 1.5 },
          glycogen_synthesis: { Emax: 150, EC50: 5, Hill_n: 1.5 }
        },
        systemic: {
          HPTA_suppression: { Emax: 100, EC50: 0.1, Hill_n: 5.0 }, // Instant shutdown
          SHBG_synthesis_modulation: { Emax: -50, EC50: 20, Hill_n: 1.0 }
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Coefficient', parameters: { coefficient: 0.2 } },
      renal: { modelType: 'Coefficient', parameters: { coefficient: 0.2 } },
      cardiovascular: { modelType: 'Hill_TC50', parameters: { Emax: 100, TC50: 50, Hill_n: 2.0 } }, // Water retention/BP
      lipid_metabolism: { modelType: 'Hill_TC50', parameters: { Emax: 90, TC50: 60, Hill_n: 1.5 } },
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.3 } }
    },
    provenance: {}
  },

  arimidex: {
    id: 'arimidex',
    metadata: {
      name: 'Arimidex',
      abbreviation: 'Adex',
      classification: 'AI',
      family: 'Non-steroidal',
      administrationRoutes: ['Oral'],
      chemicalProperties: { molecularWeight: 293.37 },
      structuralFlags: { isC17aa: false, is19Nor: false },
      color: '#9CA3AF',
      description: 'Anastrozole. Non-suicidal aromatase inhibitor.'
    },
    pk: {
      Vd: 0.8,
      CL: calculateCL(48.0), // ~2 days
      proteinBinding: { SHBG_Kd: 10000, Albumin_Kd: 10000 },
      absorption: { oral: { F: 0.8, Ka: 1.0 } },
      esters: {}
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 10000, activityType: 'Antagonist', Emax: 0, EC50: 0, Hill_n: 1.0 }
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: false, isInhibitor: true, Ki: 1.0, inhibitionType: 'Competitive' },
        FiveAlphaReductase_SRD5A: { isSubstrate: false, isInhibitor: false }
      },
      pathwayModulation: {
        genomic: { myogenesis: { Emax: 0, EC50: 0, Hill_n: 1.0 }, erythropoiesis: { Emax: 0, EC50: 0, Hill_n: 1.0 }, lipolysis: { Emax: 0, EC50: 0, Hill_n: 1.0 } },
        nonGenomic: { cns_activation: { Emax: 0, EC50: 0, Hill_n: 1.0 }, glycogen_synthesis: { Emax: 0, EC50: 0, Hill_n: 1.0 } },
        systemic: { HPTA_suppression: { Emax: 0, EC50: 0, Hill_n: 1.0 }, SHBG_synthesis_modulation: { Emax: 0, EC50: 0, Hill_n: 1.0 } }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Coefficient', parameters: { coefficient: 0.05 } },
      renal: { modelType: 'Coefficient', parameters: { coefficient: 0.05 } },
      cardiovascular: { modelType: 'Coefficient', parameters: { coefficient: 0.1 } }, // Low E2 issues
      lipid_metabolism: { modelType: 'Coefficient', parameters: { coefficient: 0.2 } }, // HDL impact
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.1 } }
    },
    provenance: {}
  },

  finasteride: {
    id: 'finasteride',
    metadata: {
      name: 'Finasteride',
      abbreviation: 'Fin',
      classification: 'Ancillary',
      family: 'Non-steroidal',
      administrationRoutes: ['Oral'],
      chemicalProperties: { molecularWeight: 372.55 },
      structuralFlags: { isC17aa: false, is19Nor: false },
      color: '#9CA3AF',
      description: '5-alpha reductase inhibitor. Prevents conversion of Test to DHT.'
    },
    pk: {
      Vd: 0.8,
      CL: calculateCL(6.0),
      proteinBinding: { SHBG_Kd: 10000, Albumin_Kd: 10000 },
      absorption: { oral: { F: 0.65, Ka: 1.5 } },
      esters: {}
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 10000, activityType: 'Antagonist', Emax: 0, EC50: 0, Hill_n: 1.0 }
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: false, isInhibitor: false },
        FiveAlphaReductase_SRD5A: { isSubstrate: false, isInhibitor: true, Ki: 0.5, inhibitionType: 'Competitive' }
      },
      pathwayModulation: {
        genomic: { myogenesis: { Emax: 0, EC50: 0, Hill_n: 1.0 }, erythropoiesis: { Emax: 0, EC50: 0, Hill_n: 1.0 }, lipolysis: { Emax: 0, EC50: 0, Hill_n: 1.0 } },
        nonGenomic: { cns_activation: { Emax: 0, EC50: 0, Hill_n: 1.0 }, glycogen_synthesis: { Emax: 0, EC50: 0, Hill_n: 1.0 } },
        systemic: { HPTA_suppression: { Emax: 0, EC50: 0, Hill_n: 1.0 }, SHBG_synthesis_modulation: { Emax: 0, EC50: 0, Hill_n: 1.0 } }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Coefficient', parameters: { coefficient: 0.01 } },
      renal: { modelType: 'Coefficient', parameters: { coefficient: 0.01 } },
      cardiovascular: { modelType: 'Coefficient', parameters: { coefficient: 0.01 } },
      lipid_metabolism: { modelType: 'Coefficient', parameters: { coefficient: 0.01 } },
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.2 } } // PFS risk
    },
    provenance: {}
  }
};
