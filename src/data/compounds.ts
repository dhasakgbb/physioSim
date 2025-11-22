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
      description: 'The primary male sex hormone and anabolic steroid.',
      basePotency: 1.0,
      baseToxicity: 1.0
    },
    clinical: {
      summary: 'Testosterone is the foundational anabolic steroid. It promotes muscle growth, bone density, and libido.',
      benefitRationale: 'Direct AR agonism and conversion to DHT/Estrogen provides comprehensive physiological support.',
      riskRationale: 'Aromatization to estrogen can cause water retention and gynecomastia. 5AR reduction can accelerate hair loss.'
    },
    pk: {
      Vd: 0.6, // L/kg - Typical for total testosterone distribution
      CL: calculateCL(1.5), // Parent testosterone half-life ~10-100 min IV (1.5h used for calculation)
      proteinBinding: {
        SHBG_Kd: 1.0, // nM - Association constant ~1e9 L/mol indicates high affinity binding
        Albumin_Kd: 10000 // nM - Low affinity, high capacity binding
      },
      absorption: {
        oral: { F: 0.05, Ka: 2.0 } // Very poor oral bioavailability (~5% due to first-pass metabolism)
      },
      esters: {
        enanthate: ESTERS.enanthate, // Half-life ~7-9 days  
        cypionate: ESTERS.cypionate, // Half-life ~8 days
        propionate: ESTERS.propionate,
        sustanon: { ...ESTERS.undecanoate, id: 'sustanon' }
      }
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 0.7, activityType: 'FullAgonist', Emax: 100, EC50: 0.66, Hill_n: 1.0 },
        ER_alpha: { Kd: 5.0, activityType: 'FullAgonist', Emax: 80, EC50: 20, Hill_n: 1.0 }
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: true, Km: 13.7, Vmax_relative: 1.0, isInhibitor: false },
        FiveAlphaReductase_SRD5A: { isSubstrate: true, Km: 94.9, Vmax_relative: 1.0, isInhibitor: false }
      },
      pathwayModulation: {
        genomic: {
          myogenesis: { Emax: 150, EC50: 450, Hill_n: 1.2 },  // High EC50 for "lazy" growth curve
          erythropoiesis: { Emax: 60, EC50: 400, Hill_n: 1.0 },
          lipolysis: { Emax: 40, EC50: 350, Hill_n: 1.0 }
        },
        nonGenomic: {
          cns_activation: { Emax: 50, EC50: 30, Hill_n: 1.5 },
          glycogen_synthesis: { Emax: 60, EC50: 5, Hill_n: 1.0 }  // Low EC50 for "wall" curve
        },
        systemic: {
          HPTA_suppression: { Emax: 100, EC50: 5, Hill_n: 2.5 },  // Increased Hill_n for cooperativity
          SHBG_synthesis_modulation: { Emax: -50, EC50: 20, Hill_n: 1.0 }
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Hill_TC50', parameters: { Emax: 50, TC50: 800, Hill_n: 2.5 } }, // Minimal but scaled for hockey stick
      renal: { modelType: 'Hill_TC50', parameters: { Emax: 80, TC50: 600, Hill_n: 2.5 } }, // Secondary to BP, hockey stick
      cardiovascular: { modelType: 'Hill_TC50', parameters: { Emax: 150, TC50: 400, Hill_n: 2.5 } }, // Hematocrit/BP risk, hockey stick
      lipid_metabolism: { modelType: 'Hill_TC50', parameters: { Emax: 150, TC50: 200, Hill_n: 2.5 } }, // HDL suppression, increased Hill_n
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.0 } } // Androgenic, not directly neurotoxic
    },
    provenance: {
      'pk.Vd': {
        source: 'HumanClinical',
        citation: 'PMID: 11836290 - Population PK/PD modeling of testosterone cypionate',
        confidence: 'High',
        notes: 'V/F = 14.4 kL in 85kg male = ~170L = ~2.0 L/kg; conservative 0.6 L/kg used for free/bioavailable fraction'
      },
      'pk.CL': {
        source: 'HumanClinical',
        citation: 'PMID: 11836290',
        confidence: 'High',
        notes: 'Testosterone cypionate t1/2 = 4.05 days (median). Parent testosterone IV t1/2 ~10-100 min'
      },
      'pk.proteinBinding.SHBG_Kd': {
        source: 'InVitro',
        citation: 'DOI: 10.1210/jcem-68-6-1222 - SHBG binding studies',
        confidence: 'High',
        notes: 'Association constant ~1×10^9 L/mol for testosterone-SHBG binding, corresponding to Kd ~1 nM'
      },
      'pk.proteinBinding.Albumin_Kd': {
        source: 'HumanClinical',
        citation: 'Multiple pharmacology references',
        confidence: 'Medium',
        notes: 'Albumin binds 40-65% of testosterone with low affinity; Kd estimated ~10 μM (10,000 nM)'
      },
      'pk.esters.enanthate': {
        source: 'HumanClinical',
        citation: 'FDA Label - Testosterone Enanthate',
        confidence: 'High',
        notes: 'Half-life 7-9 days IM; peak levels 24-72h post-injection'
      },
      'pk.esters.cypionate': {
        source: 'HumanClinical',
        citation: 'FDA Label - Depo-Testosterone (Testosterone Cypionate)',
        confidence: 'High',
        notes: 'Half-life ~8 days IM; peak levels 48-72h post-injection'
      },
      'pd.receptorInteractions.AR.Kd': {
        source: 'InVitro',
        citation: 'Multiple binding assays; Wikipedia summary cites 0.4-1.0 nM range',
        confidence: 'High',
        notes: 'Competitive binding studies using [³H]-methyltrienolone. Testosterone Kd typically 0.4-1.0 nM (midpoint 0.7 nM used)'
      },
      'pd.receptorInteractions.AR.EC50': {
        source: 'InVitro',
        citation: 'PMID: 16912139, DOI: 10.1210/jcem.86.6.7564',
        confidence: 'High',
        notes: 'Transactivation assays show testosterone EC50 ~0.66 nM for AR activation'
      },
      'pd.enzymaticInteractions.Aromatase_CYP19A1.Km': {
        source: 'InVitro',
        citation: 'ResearchGate - CYP19A1 kinetic studies',
        confidence: 'Medium',
        notes: 'Km = 13.7 nM for aromatase with androstenedione substrate (likely similar for testosterone)'
      },
      'pd.enzymaticInteractions.FiveAlphaReductase_SRD5A.Km': {
        source: 'InVitro',
        citation: 'PMID: 3476542 - 5α-reductase kinetics in human foreskin',
        confidence: 'High',
        notes: 'Km = 94.9 ± 3.5 nM; Vmax = 15.8 ± 1.9 pmol/mg·h for testosterone → DHT conversion'
      },
      'toxicity.hepatic': {
        source: 'HumanClinical',
        citation: 'PMID: 1464627 - Androgenic steroid hepatotoxicity',
        confidence: 'High',
        notes: 'Non-C17α alkylated testosterone (IM/transdermal) has minimal hepatotoxicity; rare cholestasis cases'
      },
      'toxicity.lipid_metabolism': {
        source: 'HumanClinical',
        citation: 'PMID: 11706999 - TRT effects on lipids',
        confidence: 'High',
        notes: 'Dose-dependent HDL decrease, LDL/total cholesterol decrease. Supraphysiologic doses show greater HDL suppression'
      },
      'toxicity.cardiovascular': {
        source: 'HumanClinical',
        citation: 'Multiple clinical trials; mixed evidence on CV risk',
        confidence: 'Medium',
        notes: 'Physiologic TRT shows neutral/beneficial CV effects; supraphysiologic doses may increase risk via lipid changes, hematocrit'
      }
    }
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
      description: 'A 19-nor compound known for joint relief and steady mass gains.',
      basePotency: 1.25,
      baseToxicity: 1.5
    },
    clinical: {
      summary: 'Nandrolone is highly anabolic with low androgenic activity. It is often used for bulking and joint health.',
      benefitRationale: 'Strong nitrogen retention and collagen synthesis promotion.',
      riskRationale: 'Progestogenic activity can cause prolactin-related side effects. Suppressive to HPTA.'
    },
    pk: {
      Vd: 0.6, // L/kg - Similar to testosterone
      CL: 25.8, // mL/min/kg - Calculated from 1.55 L/h/kg serum clearance
      proteinBinding: { SHBG_Kd: 100, Albumin_Kd: 10000 }, // Very low SHBG affinity (~100x weaker than testosterone)
      absorption: {},
      esters: {
        phenylpropionate: ESTERS.propionate, // NPP - similar kinetics to propionate
        decanoate: ESTERS.decanoate // Deca - half-life 6-12 days for ester release
      }
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 0.5, activityType: 'FullAgonist', Emax: 110, EC50: 5, Hill_n: 1.0 }, // Stronger AR binder than testosterone (RBA ~154)
        PR: { Kd: 50.0, activityType: 'FullAgonist', Emax: 50, EC50: 20, Hill_n: 1.0 } // 20% binding affinity relative to progesterone
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: true, Km: 100, Vmax_relative: 0.2, isInhibitor: false }, // ~20% aromatization rate of testosterone
        FiveAlphaReductase_SRD5A: { isSubstrate: true, Km: 10, Vmax_relative: 1.0, isInhibitor: false } // Converts to DHN (weaker metabolite)
      },
      pathwayModulation: {
        genomic: {
          myogenesis: { Emax: 140, EC50: 480, Hill_n: 1.2 },  // High EC50 for lazy growth
          erythropoiesis: { Emax: 40, EC50: 420, Hill_n: 1.0 },
          lipolysis: { Emax: 20, EC50: 380, Hill_n: 1.0 }
        },
        nonGenomic: {
          cns_activation: { Emax: 20, EC50: 50, Hill_n: 1.0 }, // Low CNS effects
          glycogen_synthesis: { Emax: 80, EC50: 8, Hill_n: 1.0 }  // Low EC50 for wall
        },
        systemic: {
          HPTA_suppression: { Emax: 100, EC50: 2, Hill_n: 3.0 }, // Highly suppressive via PR pathway
          SHBG_synthesis_modulation: { Emax: -20, EC50: 50, Hill_n: 1.0 }
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Hill_TC50', parameters: { Emax: 60, TC50: 700, Hill_n: 2.5 } }, // Mild but hockey stick
      renal: { modelType: 'Hill_TC50', parameters: { Emax: 100, TC50: 400, Hill_n: 2.5 } }, // Hockey stick
      cardiovascular: { modelType: 'Hill_TC50', parameters: { Emax: 120, TC50: 350, Hill_n: 2.5 } }, // Moderate CV risk, hockey stick
      lipid_metabolism: { modelType: 'Hill_TC50', parameters: { Emax: 100, TC50: 300, Hill_n: 2.5 } }, // HDL decrease, hockey stick
      neurotoxicity: { modelType: 'Hill_TC50', parameters: { Emax: 80, TC50: 150, Hill_n: 2.5 } } // "Deca Dick", increased Hill_n
    },
    provenance: {
      'pk.CL': {
        source: 'HumanClinical',
        citation: 'PMID: Multiple - Nandrolone decanoate PK studies',
        confidence: 'High',
        notes: 'Mean serum clearance 1.55 L/h/kg = 25.8 mL/min/kg. Decanoate ester t1/2 6-12 days'
      },
      'pk.proteinBinding.SHBG_Kd': {
        source: 'InVitro',
        citation: 'Multiple pharmacology references',
        confidence: 'High',
        notes: 'Nandrolone has very low SHBG affinity (~100x weaker than testosterone); highly protein-bound to albumin'
      },
      'pk.esters.decanoate': {
        source: 'HumanClinical',
        citation: 'DrugBank, Wikipedia - Nandrolone decanoate PK',
        confidence: 'High',
        notes: 'Ester t1/2 6-12 days IM. Duration of action 18-25 days for single 50-100mg dose. Bioavailability 53-73% (highest in gluteal)'
      },
      'pd.receptorInteractions.AR.Kd': {
        source: 'InVitro',
        citation: 'Wikipedia - Nandrolone RBA studies',
        confidence: 'High',
        notes: 'Relative binding affinity 154-155 (DHT=100), indicating stronger AR binding than testosterone. Kd ~0.5 nM estimated'
      },
      'pd.receptorInteractions.PR.Kd': {
        source: 'InVitro',
        citation: 'Wikipedia - Nandrolone progestogenic activity',
        confidence: 'High',
        notes: 'Binding affinity ~20-22% of progesterone (RBA=20 with progesterone=100). Estimated Kd ~50 nM'
      },
      'pd.enzymaticInteractions.Aromatase_CYP19A1.Vmax_relative': {
        source: 'InVitro',
        citation: 'Multiple sources - Nandrolone aromatization studies',
        confidence: 'High',
        notes: 'Aromatization rate ~20% of testosterone due to lack of C19 methyl group. Structurally resistant to standard aromatase process'
      },
      'pd.enzymaticInteractions.FiveAlphaReductase_SRD5A': {
        source: 'InVitro',
        citation: 'Pharmacology literature',
        confidence: 'High',
        notes: 'Converts to 5α-dihydronandrolone (DHN), which has REDUCED AR affinity compared to parent. Opposite of testosterone'
      },
      'toxicity.hepatic': {
        source: 'HumanClinical',
        citation: 'Clinical safety data - multiple sources',
        confidence: 'High',
        notes: 'Non-C17aa structure = low hepatotoxicity. Mild ALT/AST elevations reported at high doses. Rare peliosis hepatis'
      },
      'toxicity.lipid_metabolism': {
        source: 'HumanClinical',
        citation: 'Multiple clinical studies',
        confidence: 'High',
        notes: 'HDL decrease, LDL variable. Less severe lipid impact than C17aa orals. Effects persist post-discontinuation'
      },
      'toxicity.cardiovascular': {
        source: 'HumanClinical',
        citation: 'Clinical literature - cardiac effects',
        confidence: 'Medium',
        notes: 'Hypertension, cardiac hypertrophy with chronic use. Arrhythmogenic potential. Less severe than trenbolone'
      },
      'toxicity.neurotoxicity': {
        source: 'HumanClinical',
        citation: 'Clinical reports - \"Deca Dick\" phenomenon',
        confidence: 'Medium',
        notes: 'Progestogenic activity → prolactin elevation → erectile dysfunction, anhedonia. Well-documented user reports'
      }
    }
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
      description: 'A potent veterinary steroid known for extreme conditioning and strength.',
      basePotency: 2.5,
      baseToxicity: 5.0
    },
    clinical: {
      summary: 'Trenbolone is one of the most powerful steroids available, binding strongly to the AR.',
      benefitRationale: 'Massive increases in nutrient efficiency and muscle hardness via AR agonism and GR antagonism.',
      riskRationale: 'High toxicity profile including severe renal stress, neurotoxicity, and cardiovascular strain. Not approved for human use.'
    },
    pk: {
      Vd: 0.7, // L/kg - Estimated; distributes to liver/kidney in veterinary studies
      CL: calculateCL(3.0 * 24), // Based on trenbolone acetate t1/2 ~3 days (ester release)
      proteinBinding: { SHBG_Kd: 3.0, Albumin_Kd: 10000 }, // Moderate SHBG binding
      absorption: {},
      esters: {
        acetate: ESTERS.acetate, // t1/2 ~3 days (ester release); metabolite 17α-trenbolone t1/2 5-10 days
        enanthate: ESTERS.enanthate,
        hexahydrobenzylcarbonate: { ...ESTERS.enanthate, id: 'hexahydro' } // Parabolan - similar to enanthate
      }
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 0.35, activityType: 'FullAgonist', Emax: 200, EC50: 1.5, Hill_n: 1.5 }, // Equal to DHT affinity (0.25-0.5 nM)
        PR: { Kd: 5.0, activityType: 'FullAgonist', Emax: 60, EC50: 15, Hill_n: 1.0 }, // Progestogenic
        GR: { Kd: 2.0, activityType: 'Antagonist', Emax: 0, EC50: 10, Hill_n: 1.0 } // Anti-catabolic (cortisol antagonist)
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: false, isInhibitor: false }, // Does not aromatize
        FiveAlphaReductase_SRD5A: { isSubstrate: false, isInhibitor: false } // Does not undergo 5α-reduction
      },
      pathwayModulation: {
        genomic: {
          myogenesis: { Emax: 180, EC50: 500, Hill_n: 1.5 },  // High Emax & High EC50
          erythropoiesis: { Emax: 70, EC50: 450, Hill_n: 1.0 },
          lipolysis: { Emax: 120, EC50: 420, Hill_n: 1.5 }
        },
        nonGenomic: {
          cns_activation: { Emax: 100, EC50: 5, Hill_n: 2.0 }, // Aggression/insomnia
          glycogen_synthesis: { Emax: 90, EC50: 6, Hill_n: 1.0 }  // Low EC50 for wall
        },
        systemic: {
          HPTA_suppression: { Emax: 100, EC50: 1, Hill_n: 4.0 }, // Complete shutdown
          SHBG_synthesis_modulation: { Emax: -60, EC50: 10, Hill_n: 1.0 }
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Hill_TC50', parameters: { Emax: 100, TC50: 300, Hill_n: 2.5 } }, // Moderate, hockey stick
      renal: { modelType: 'Hill_TC50', parameters: { Emax: 120, TC50: 80, Hill_n: 2.5 } }, // Severe nephrotoxicity
      cardiovascular: { modelType: 'Hill_TC50', parameters: { Emax: 120, TC50: 60, Hill_n: 2.5 } }, // Severe CV toxicity
      lipid_metabolism: { modelType: 'Hill_TC50', parameters: { Emax: 110, TC50: 50, Hill_n: 2.5 } }, // Severe dyslipidemia
      neurotoxicity: { modelType: 'Hill_TC50', parameters: { Emax: 110, TC50: 50, Hill_n: 2.5 } } // Aggression, insomnia, anxiety
    },
    provenance: {
      'pk.CL': {
        source: 'AnimalModel',
        citation: 'Veterinary literature - Trenbolone acetate PK in cattle',
        confidence: 'Medium',
        notes: 'Activated elimination t1/2 ~3 days for trenbolone acetate IM. Primary metabolite 17α-trenbolone t1/2 5-10 days. No human PK data available'
      },
      'pk.Vd': {
        source: 'AnimalModel',
        citation: 'Veterinary PK studies',
        confidence: 'Low',
        notes: 'Distribution pattern: highest in liver/kidney, lowest in muscle/fat. <1% outside injection site. No human Vd data'
      },
      'pk.esters.acetate': {
        source: 'AnimalModel',
        citation: 'Wikipedia - Trenbolone acetate',
        confidence: 'Medium',
        notes: 'T1/2 ~3 days (ester release) in cattle. Metabolites have longer half-lives (5-10 days for 17α-trenbolone)'
      },
      'pd.receptorInteractions.AR.Kd': {
        source: 'InVitro',
        citation: 'Multiple sources - trenbolone AR binding similar to DHT',
        confidence: 'High',
        notes: 'Binding affinity equal to or comparable to DHT (0.25-0.5 nM). 3-5x higher affinity than testosterone. Kd ~0.35 nM estimated'
      },
      'pd.receptorInteractions.GR': {
        source: 'InVitro',
        citation: 'BenchChem, multiple pharmacology sources',
        confidence: 'High',
        notes: 'Trenbolone acts as glucocorticoid receptor antagonist, blocking cortisol catabolic effects. Reduces adrenal weight and corticosterone'
      },
      'pd.enzymaticInteractions.Aromatase_CYP19A1': {
        source: 'InVitro',
        citation: 'Pharmacology literature',
        confidence: 'High',
        notes: 'Trenbolone does NOT aromatize to estrogens (no C19 methyl group for aromatase). Not a 5α-reductase substrate'
      },
      'toxicity.renal': {
        source: 'HumanClinical',
        citation: 'Case reports - AAS nephrotoxicity',
        confidence: 'High',
        notes: 'Severe nephropathy, AKI, CKD reported. Focal segmental glomerulosclerosis, tubular atrophy, interstitial fibrosis. Elevated creatinine'
      },
      'toxicity.cardiovascular': {
        source: 'HumanClinical',
        citation: 'Case reports and systematic reviews',
        confidence: 'High',
        notes: 'Heart failure, MI, stroke, LVH, dilated cardiomyopathy, arrhythmia, hypertension. Severe dyslipidemia (low HDL, high LDL)'
      },
      'toxicity.neurotoxicity': {
        source: 'HumanClinical',
        citation: 'User reports and case studies',
        confidence: 'Medium',
        notes: 'Aggression ("tren rage"), insomnia, anxiety, mood disturbances. Likely mediated by CNS effects and GR antagonism in brain'
      },
      'clinical.summary': {
        source: 'HumanClinical',
        citation: 'FDA - not approved for human use',
        confidence: 'High',
        notes: 'Trenbolone never advanced to human clinical trials due to severe adverse effects. Veterinary use only (cattle growth promotion)'
      }
    }
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
      structuralFlags: { isC17aa: false, is19Nor: false },
      color: '#10B981',
      description: 'Mild anabolic with low androgenic activity, known for lean gains.',
      basePotency: 0.6,
      baseToxicity: 0.5
    },
    pk: {
      Vd: 0.6, // L/kg
      CL: calculateCL(240), // t1/2 ~10.5 days (enanthate ester) - converted to hours
      proteinBinding: { SHBG_Kd: 5.0, Albumin_Kd: 10000 },
      absorption: { oral: { F: 0.5, Ka: 1.5 } }, // Oral acetate: low F, short t1/2 4-6h
      esters: {
        acetate: { id: 'acetate', releaseHalfLife_Hours: 5.0, peakTime_Hours: 12 }, // Oral form
        enanthate: ESTERS.enanthate // Injectable: t1/2 10.5 days
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
          myogenesis: { Emax: 70, EC50: 450, Hill_n: 1.0 },  // Mild but lazy growth
          erythropoiesis: { Emax: 20, EC50: 400, Hill_n: 1.0 },
          lipolysis: { Emax: 60, EC50: 350, Hill_n: 1.0 }
        },
        nonGenomic: {
          cns_activation: { Emax: 30, EC50: 40, Hill_n: 1.0 },
          glycogen_synthesis: { Emax: 40, EC50: 10, Hill_n: 1.0 }  // Low EC50
        },
        systemic: {
          HPTA_suppression: { Emax: 60, EC50: 50, Hill_n: 1.0 },
          SHBG_synthesis_modulation: { Emax: -30, EC50: 40, Hill_n: 1.0 }
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Hill_TC50', parameters: { Emax: 40, TC50: 900, Hill_n: 2.5 } }, // Very mild, hockey stick
      renal: { modelType: 'Hill_TC50', parameters: { Emax: 50, TC50: 800, Hill_n: 2.5 } }, // Very mild, hockey stick
      cardiovascular: { modelType: 'Hill_TC50', parameters: { Emax: 60, TC50: 700, Hill_n: 2.5 } }, // Mild, hockey stick
      lipid_metabolism: { modelType: 'Hill_TC50', parameters: { Emax: 70, TC50: 600, Hill_n: 2.5 } }, // Mild, hockey stick
      neurotoxicity: { modelType: 'Hill_TC50', parameters: { Emax: 30, TC50: 900, Hill_n: 2.5 } } // Very mild, hockey stick
    },
    provenance: {
      'pk.CL': {
        source: 'HumanClinical',
        citation: 'Wikipedia - Methenolone enanthate PK',
        confidence: 'High',
        notes: 'Biological half-life ~10.5 days for injectable enanthate ester. Oral acetate t1/2 4-6h (requires split dosing)'
      },
      'pd.enzymaticInteractions.Aromatase_CYP19A1': {
        source: 'InVitro',
        citation: 'DHT-derivative pharmacology',
        confidence: 'High',
        notes: 'Non-aromatizing (DHT derivative). No estrogen conversion → no water retention/gyno. Clean, lean gains'
      },
      'clinical.summary': {
        source: 'HumanClinical',
        citation: 'Clinical use patterns',
        confidence: 'Medium',
        notes: 'Mild anabolic (rating 88 vs testosterone 100). Popular for cutting cycles and lean mass preservation with minimal sides'
      }
    }
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
      structuralFlags: { isC17aa: true, is19Nor: false },
      color: '#4F46E5',
      description: 'Classic mass builder, known for rapid size and strength.',
      basePotency: 1.8,
      baseToxicity: 2.0
    },
    pk: {
      Vd: 0.6, // L/kg
      CL: calculateCL(4.0), // Half-life: 3-6 hours (short)
      proteinBinding: { SHBG_Kd: 50.0, Albumin_Kd: 10000 }, // Very low SHBG affinity (~10% of testosterone)
      absorption: { oral: { F: 0.8, Ka: 2.0 } }, // High oral bioavailability via C17aa
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
          myogenesis: { Emax: 120, EC50: 420, Hill_n: 1.2 },  // CACHE-BUST-20251122-1825
          erythropoiesis: { Emax: 50, EC50: 400, Hill_n: 1.0 },
          lipolysis: { Emax: 10, EC50: 450, Hill_n: 1.0 }
        },
        nonGenomic: {
          cns_activation: { Emax: 80, EC50: 10, Hill_n: 1.5 },
          glycogen_synthesis: { Emax: 120, EC50: 4, Hill_n: 1.5 }  // Very low EC50 for rapid wall effect
        },
        systemic: {
          HPTA_suppression: { Emax: 100, EC50: 5, Hill_n: 2.5 },  // Increased Hill_n
          SHBG_synthesis_modulation: { Emax: -70, EC50: 10, Hill_n: 1.0 }
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Hill_TC50', parameters: { Emax: 100, TC50: 50, Hill_n: 2.5 } }, // Increased Hill_n
      renal: { modelType: 'Hill_TC50', parameters: { Emax: 90, TC50: 150, Hill_n: 2.5 } }, // Converted to Hill, increased Hill_n
      cardiovascular: { modelType: 'Hill_TC50', parameters: { Emax: 80, TC50: 80, Hill_n: 2.5 } }, // Increased Hill_n
      lipid_metabolism: { modelType: 'Hill_TC50', parameters: { Emax: 90, TC50: 60, Hill_n: 2.5 } }, // Increased Hill_n
      neurotoxicity: { modelType: 'Hill_TC50', parameters: { Emax: 70, TC50: 200, Hill_n: 2.5 } } // Converted to Hill
    },
    provenance: {
      'pk.CL': {
        source: 'HumanClinical',
        citation: 'Wikipedia - Methenolone enanthate PK',
        confidence: 'High',
        notes: 'Biological half-life ~10.5 days for injectable enanthate ester. Oral acetate t1/2 4-6h (requires split dosing)'
      },
      'pd.enzymaticInteractions.Aromatase_CYP19A1': {
        source: 'InVitro',
        citation: 'DHT-derivative pharmacology',
        confidence: 'High',
        notes: 'Non-aromatizing (DHT derivative). No estrogen conversion → no water retention/gyno. Clean, lean gains'
      },
      'clinical.summary': {
        source: 'HumanClinical',
        citation: 'Clinical use patterns',
        confidence: 'Medium',
        notes: 'Mild anabolic (rating 88 vs testosterone 100). Popular for cutting cycles and lean mass preservation with minimal sides'
      }
    }
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
      structuralFlags: { isC17aa: false, is19Nor: false },
      color: '#D946EF',
      description: 'Cosmetic hardener with anti-estrogenic properties.',
      basePotency: 0.6,
      baseToxicity: 1.2
    },
    pk: {
      Vd: 0.6, // L/kg
      CL: calculateCL(2.5 * 24), // Propionate t1/2 ~2-3 days
      proteinBinding: { SHBG_Kd: 1.0, Albumin_Kd: 10000 }, // Strong DHT binding
      absorption: {},
      esters: {
        propionate: ESTERS.propionate, // t1/2 2-3 days, EOD dosing
        enanthate: ESTERS.enanthate // t1/2 7-10 days, twice weekly
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
    provenance: {
      'pd.enzymaticInteractions': {
        source: 'InVitro',
        citation: 'DHT-derivative pharmacology',
        confidence: 'High',
        notes: 'Non-aromatizing DHT derivative. Anti-estrogenic properties: competes with estrogen for binding sites, may inhibit aromatase'
      },
      'clinical.summary': {
        source: 'HumanClinical',
        citation: 'Historical breast cancer treatment use',
        confidence: 'High',
        notes: 'Originally developed for breast cancer treatment due to anti-estrogenic effects. Now used for cosmetic hardening/definition'
      },
      'pk.esters': {
        source: 'HumanClinical',
        citation: 'Ester PK data',
        confidence: 'High',
        notes: 'Propionate: t1/2 2-3 days (EOD dosing, pre-comp favorite). Enanthate: t1/2 7-10 days (longer cutting cycles)'
      }
    }
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
      structuralFlags: { isC17aa: false, is19Nor: false },
      color: '#84CC16',
      description: 'Veterinary steroid known for steady gains and endurance.',
      basePotency: 0.5,
      baseToxicity: 1.5
    },
    pk: {
      Vd: 0.7, // L/kg - veterinary data
      CL: calculateCL(336), // t1/2 ~14 days (undecylenate ester) - 336 hours
      proteinBinding: { SHBG_Kd: 5.0, Albumin_Kd: 10000 },
      absorption: {},
      esters: {
        undecylenate: { id: 'undecylenate', releaseHalfLife_Hours: 336, peakTime_Hours: 72 } // Very long ester
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
    provenance: {
      'pk.CL': {
        source: 'AnimalModel',
        citation: 'Veterinary literature - Equipoise PK',
        confidence: 'Medium',
        notes: 'Biological half-life ~14 days (undecylenate ester). Remains detectable for months. Veterinary use in horses, livestock'
      },
      'pd.pathwayModulation.genomic.erythropoiesis': {
        source: 'AnimalModel',
        citation: 'Veterinary/clinical observations',
        confidence: 'High',
        notes: 'Markedly enhances RBC production via EPO stimulation. Improves oxygen transport and endurance. Key differentiator'
      },
      'clinical.summary': {
        source: 'AnimalModel',
        citation: 'Veterinary use patterns',
        confidence: 'High',
        notes: 'Appetite stimulation (helps debilitated animals gain weight). Veterinary only - never approved for human use. Banned in performance horses'
      }
    }
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
      structuralFlags: { isC17aa: true, is19Nor: false },
      color: '#7C3AED',
      description: 'Powerful oral for dramatic mass and strength.',
      basePotency: 2.2,
      baseToxicity: 4.5
    },
    pk: {
      Vd: 0.6, // L/kg - estimated
      CL: calculateCL(9.0), // ~9h half-life (estimated from clinical data)
      proteinBinding: { SHBG_Kd: 100.0, Albumin_Kd: 10000 }, // Very low SHBG affinity (Wikipedia)
      absorption: { oral: { F: 0.8, Ka: 1.5 } }, // Well-absorbed orally
      esters: {}
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 100.0, activityType: 'FullAgonist', Emax: 120, EC50: 50, Hill_n: 1.0 }, // Low AR affinity but high efficacy
        ER_alpha: { Kd: 5.0, activityType: 'FullAgonist', Emax: 80, EC50: 20, Hill_n: 1.0 } // Estrogenic effects without aromatization
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: false, isInhibitor: false },
        FiveAlphaReductase_SRD5A: { isSubstrate: false, isInhibitor: false }
      },
      pathwayModulation: {
        genomic: {
          myogenesis: { Emax: 130, EC50: 420, Hill_n: 1.5 }, // HIGH EC50 for lazy growth (FIXED!)
          erythropoiesis: { Emax: 120, EC50: 400, Hill_n: 1.5 }, // RBC
          lipolysis: { Emax: 20, EC50: 450, Hill_n: 1.0 }
        },
        nonGenomic: {
          cns_activation: { Emax: 60, EC50: 20, Hill_n: 1.0 },
          glycogen_synthesis: { Emax: 140, EC50: 4, Hill_n: 1.5 } // LOW EC50 for wall effect (FIXED!)
        },
        systemic: {
          HPTA_suppression: { Emax: 90, EC50: 10, Hill_n: 2.0 },
          SHBG_synthesis_modulation: { Emax: -60, EC50: 20, Hill_n: 1.0 }
        }
      }
    },
    toxicity: {
      hepatic: { modelType: 'Hill_TC50', parameters: { Emax: 100, TC50: 50, Hill_n: 2.5 } }, // Severe hepatotoxicity
      renal: { modelType: 'Coefficient', parameters: { coefficient: 0.1 } }, // Reduced from 0.4
      cardiovascular: { modelType: 'Hill_TC50', parameters: { Emax: 80, TC50: 60, Hill_n: 2.0 } },
      lipid_metabolism: { modelType: 'Hill_TC50', parameters: { Emax: 80, TC50: 50, Hill_n: 2.0 } },
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.05 } } // Reduced from 0.2
    },
    provenance: {
      'clinical.summary': {
        source: 'HumanClinical',
        citation: 'FDA approved for anemia (deficient RBC production)',
        confidence: 'High',
        notes: 'Approved 1960, discontinued 1961 for lipid toxicity, re-approved for current indication. Indications: aplastic anemia, myelofibrosis'
      },
      'pd.pathwayModulation.genomic.erythropoiesis': {
        source: 'HumanClinical',
        citation: 'Clinical mechanism studies',
        confidence: 'High',
        notes: 'Enhances erythropoietin production/excretion. Recent studies suggest may also work via osteopontin downregulation (EPO-independent)'
      },
      'toxicity.hepatic': {
        source: 'HumanClinical',
        citation: 'FDA Label - Anadrol; case reports',
        confidence: 'High',
        notes: 'Severe C17aa hepatotoxicity. Cholestatic hepatitis/jaundice, peliosis hepatis, hepatic tumors (benign/malignant), hepatocellular carcinoma. Dose/duration-dependent'
      },
      'pk.proteinBinding.SHBG_Kd': {
        source: 'InVitro',
        citation: 'Wikipedia - Oxymetholone',
        confidence: 'Medium',
        notes: 'Very low SHBG affinity, similar to other C17aa orals. Highly protein-bound overall'
      }
    }
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
      structuralFlags: { isC17aa: true, is19Nor: false },
      color: '#FB923C',
      description: 'Popular cutting agent for dry, hard muscle.',
      basePotency: 1.5,
      baseToxicity: 3.5
    },
    pk: {
      Vd: 0.6, // L/kg
      CL: calculateCL(9.0), // ~9h half-life oral
      proteinBinding: { SHBG_Kd: 0.1, Albumin_Kd: 10000 }, // Extremely high SHBG affinity - suppresses by 48% in 1 week
      absorption: { oral: { F: 0.9, Ka: 2.0 } }, //High oral bioavailability
      esters: {
        none: ESTERS.none // Suspension
      }
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 4.5, activityType: 'FullAgonist', Emax: 70, EC50: 20, Hill_n: 1.0 }, // 22% affinity of DHT (Wikipedia)
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
      hepatic: { modelType: 'Hill_TC50', parameters: { Emax: 110, TC50: 50, Hill_n: 2.0 } }, // Severe - C17aa
      renal: { modelType: 'Coefficient', parameters: { coefficient: 0.3 } },
      cardiovascular: { modelType: 'Hill_TC50', parameters: { Emax: 90, TC50: 70, Hill_n: 2.0 } },
      lipid_metabolism: { modelType: 'Hill_TC50', parameters: { Emax: 120, TC50: 40, Hill_n: 2.5 } }, // Most severe HDL suppression
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.1 } }
    },
    provenance: {
      'pd.receptorInteractions.AR.Kd': {
        source: 'InVitro',
        citation: 'Wikipedia - Stanozolol AR affinity ~22% of DHT',
        confidence: 'High',
        notes: 'Low AR binding affinity in vitro (22% of DHT), but potent AR activator in cell-based assays. Not 5α-reduced (already DHT derivative)'
      },
      'pk.proteinBinding.SHBG_Kd': {
        source: 'HumanClinical',
        citation: 'Clinical studies - SHBG suppression',
        confidence: 'High',
        notes: 'Extremely effective at lowering SHBG: 48% decrease after 1 week (vs 30% for testosterone). Binds at 5% rate of testosterone, 1% of DHT'
      },
      'toxicity.hepatic': {
        source: 'HumanClinical',
        citation: 'Clinical case reports - C17aa hepatotoxicity',
        confidence: 'High',
        notes: 'Severe hepatotoxicity via C17-alkylation. Cholestatic hepatitis, jaundice, peliosis hepatis, hepatic neoplasms reported even at low doses'
      },
      'toxicity.lipid_metabolism': {
        source: 'HumanClinical',
        citation: 'Clinical data',
        confidence: 'High',
        notes: 'Most severe HDL suppression among common orals. Significant LDL elevation. Atherogenic lipid profile'
      }
    }
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
      description: 'Mild, well-tolerated oral known for strength and hardening.',
      basePotency: 0.8,
      baseToxicity: 1.0
    },
    clinical: {
      summary: 'Oxandrolone is a unique oral steroid with high anabolic activity but low androgenic effects. It is often used for cutting and strength.',
      benefitRationale: 'Promotes phosphocreatine synthesis and lipolysis without significant water retention.',
      riskRationale: 'Hepatotoxic (though less than others) and can skew lipid profiles. Virilization risk is low but present.'
    },
    pk: {
      Vd: 0.5, // L/kg
      CL: calculateCL(9.4), // FDA label: t1/2 9.4-10.4h (young), 13.3h (elderly)
      proteinBinding: { SHBG_Kd: 10.0, Albumin_Kd: 10000 }, // Plasma protein binding 94-97%
      absorption: { oral: { F: 0.97, Ka: 2.0 } }, // ~97% bioavailability (FDA label)
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
    provenance: {
      'pk.absorption.oral.F': {
        source: 'HumanClinical',
        citation: 'FDA Label - Oxandrolone; Wikipedia',
        confidence: 'High',
        notes: '~97% oral bioavailability. Resistant to extensive liver metabolism, contributing to lower hepatotoxicity vs other orals'
      },
      'pk.CL': {
        source: 'HumanClinical',
        citation: 'FDA Label - Oxandrolone',
        confidence: 'High',
        notes: 'Mean elimination t1/2 9.4-10.4h in young adults, 13.3h in elderly. Primarily metabolized by kidneys, less by liver'
      },
      'toxicity.hepatic': {
        source: 'HumanClinical',
        citation: 'FDA Label, clinical studies - burn patients',
        confidence: 'High',
        notes: 'Mildest hepatotoxicity among C17aa orals. Cholestatic hepatitis/jaundice possible but less frequent. FDA-approved for chronic use'
      },
      'clinical.summary': {
        source: 'HumanClinical',
        citation: 'FDA approved for weight gain post-surgery/trauma',
        confidence: 'High',
        notes: 'Schedule III controlled substance. FDA indications: weight gain, corticosteroid catabolism, osteoporosis bone pain'
      }
    }
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
      description: 'Extremely potent oral for rapid mass, highly toxic.',
      basePotency: 3.5,
      baseToxicity: 8.0
    },
    clinical: {
      summary: 'Methasterone is one of the most potent oral steroids ever created. It provides rapid mass and strength gains but is extremely hepatotoxic.',
      benefitRationale: 'Massive glycogen retention and protein synthesis.',
      riskRationale: 'Severe liver toxicity, lipid destruction, and lethargy.'
    },
    pk: {
      Vd: 0.6, // L/kg
      CL: calculateCL(8.0), // Half-life ~8 hours
      proteinBinding: { SHBG_Kd: 5.0, Albumin_Kd: 10000 },
      absorption: { oral: { F: 0.9, Ka: 2.0 } }, // High F via C17aa
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
      hepatic: { modelType: 'Hill_TC50', parameters: { Emax: 150, TC50: 20, Hill_n: 3.0 } }, // EXTREME hepatotoxicity
      renal: { modelType: 'Coefficient', parameters: { coefficient: 0.5 } },
      cardiovascular: { modelType: 'Hill_TC50', parameters: { Emax: 100, TC50: 50, Hill_n: 2.0 } },
      lipid_metabolism: { modelType: 'Hill_TC50', parameters: { Emax: 120, TC50: 30, Hill_n: 2.5 } },
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.5 } } // Severe lethargy
    },
    provenance: {
      'toxicity.hepatic': {
        source: 'HumanClinical',
        citation: 'Case reports - Superdrol hepatotoxicity',
        confidence: 'High',
        notes: 'MOST hepatotoxic oral AAS. Cholestasis, jaundice, acute liver failure documented. Liver transplant evaluations reported. 3-5 week cycles cause severe strain'
      },
      'toxicity.neurotoxicity': {
        source: 'HumanClinical',
        citation: 'User reports - clinical observations',
        confidence: 'High',
        notes: 'Severe lethargy/fatigue frequently reported. Can interfere with daily activities. Likely linked to liver stress'
      },
      'clinical.summary': {
        source: 'HumanClinical',
        citation: 'FDA/WADA - banned substance',
        confidence: 'High',
        notes: 'Never FDA-approved for medical use. Sold as "supplement" before ban. WADA banned. Designer steroid'
      }
    }
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
      description: 'Pure strength and aggression, zero water retention.',
      basePotency: 1.5,
      baseToxicity: 7.0
    },
    pk: {
      Vd: 0.6, // L/kg
      CL: calculateCL(9.0), // Half-life ~9h
      proteinBinding: { SHBG_Kd: 1.0, Albumin_Kd: 10000 },
      absorption: { oral: { F: 0.8, Ka: 2.0 } },
      esters: {}
    },
    pd: {
      receptorInteractions: {
        AR: { Kd: 1.0, activityType: 'FullAgonist', Emax: 80, EC50: 10, Hill_n: 1.0 } // Strong AR binding
      },
      enzymaticInteractions: {
        Aromatase_CYP19A1: { isSubstrate: false, isInhibitor: false },
        FiveAlphaReductase_SRD5A: { isSubstrate: false, isInhibitor: false }
      },
      pathwayModulation: {
        genomic: {
          myogenesis: { Emax: 20, EC50: 50, Hill_n: 1.0 }, // MINIMAL hypertrophy
          erythropoiesis: { Emax: 90, EC50: 10, Hill_n: 1.0 }, // Strong RBC boost
          lipolysis: { Emax: 60, EC50: 20, Hill_n: 1.0 }
        },
        nonGenomic: {
          cns_activation: { Emax: 150, EC50: 5, Hill_n: 2.5 }, // EXTREME CNS stimulation (strength/aggression)
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
      neurotoxicity: { modelType: 'Coefficient', parameters: { coefficient: 0.6 } } // Aggression, irritability
    },
    provenance: {
      'pd.pathwayModulation.nonGenomic.cns_activation': {
        source: 'HumanClinical',
        citation: 'User reports, clinical observations',
        confidence: 'High',
        notes: 'EXTREME aggression/irritability (worse than Trenbolone). CNS stimulation via limbic system. Enhanced focus, pain tolerance, competitiveness. "Roid rage in a bottle"'
      },
      'pd.pathwayModulation.genomic.myogenesis': {
        source: 'HumanClinical',
        citation: 'Clinical pharmacology',
        confidence: 'High',
        notes: 'Minimal muscle hypertrophy despite being AAS. Benefits from CNS stimulation, strength, RBC production - NOT direct muscle growth'
      },
      'clinical.summary': {
        source: 'HumanClinical',
        citation: 'Clinical use patterns',
        confidence: 'High',
        notes: 'Used by powerlifters/strength athletes pre-competition. Strength gains WITHOUT weight gain. Hardening/definition for cutting'
      }
    }
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
      description: 'A derivative of Dianabol that does not aromatize.',
      basePotency: 1.0,
      baseToxicity: 1.5
    },
    pk: {
      Vd: 0.6, // L/kg
      CL: calculateCL(16.0), // Long half-life ~16h
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
    provenance: {
      'pd.enzymaticInteractions.Aromatase_CYP19A1': {
        source: 'InVitro',
        citation: 'Pharmacology literature - 4-chloro modification',
        confidence: 'High',
        notes: 'Non-aromatizing due to 4-chloro group. Structural derivative of Dianabol but WITHOUT estrogenic effects (no water retention/gyno)'
      },
      'clinical.summary': {
        source: 'HumanClinical',
        citation: 'East German State Plan 14.25 doping program',
        confidence: 'High',
        notes: 'Developed by Jenapharm (1961). Used in East German state-sponsored doping 1968-1989. Thousands of athletes unknowingly doped'
      },
      'pk.CL': {
        source: 'HumanClinical',
        citation: 'Pharmacokinetics data',
        confidence: 'Medium',
        notes: 'Longer half-life (~16h) than Dianabol (3-6h). Allows once or twice daily dosing'
      }
    }
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
      description: 'Pure androgen, primarily used for SHBG binding and libido.',
      basePotency: 0.2,
      baseToxicity: 0.5
    },
    pk: {
      Vd: 0.6, // L/kg
      CL: calculateCL(12.0), // t1/2 ~12h oral
      proteinBinding: { SHBG_Kd: 0.5, Albumin_Kd: 10000 }, // VERY high SHBG affinity
      absorption: { oral: { F: 0.95, Ka: 2.0 } }, // High oral bioavailability (1-methylation)
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
    provenance: {
      'pk.CL': {
        source: 'AnimalModel',
        citation: 'Veterinary literature - Equipoise PK',
        confidence: 'Medium',
        notes: 'Biological half-life ~14 days (undecylenate ester). Remains detectable for months. Veterinary use in horses, livestock'
      },
      'pd.pathwayModulation.genomic.erythropoiesis': {
        source: 'AnimalModel',
        citation: 'Veterinary/clinical observations',
        confidence: 'High',
        notes: 'Markedly enhances RBC production via EPO stimulation. Improves oxygen transport and endurance. Key differentiator'
      },
      'clinical.summary': {
        source: 'AnimalModel',
        citation: 'Veterinary use patterns',
        confidence: 'High',
        notes: 'Appetite stimulation (helps debilitated animals gain weight). Veterinary only - never approved for human use. Banned in performance horses'
      }
    }
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
      description: 'Dihydroboldenone. Structurally similar to Primobolan but stronger.',
      basePotency: 2.0,
      baseToxicity: 3.5
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
    provenance: {
      'clinical.summary': {
        source: 'HumanClinical',
        citation: 'Research compound - limited human data',
        confidence: 'Low',
        notes: 'DHB (1-testosterone) is 5α-reduced boldenone. Anabolic rating 200:100 (2x testosterone) claimed but disputed. Non-aromatizing. Notable PIP (post-injection pain)'
      },
      'pd.enzymaticInteractions': {
        source: 'InVitro',
        citation: 'Structural pharmacology',
        confidence: 'High',
        notes: 'Already 5α-reduced (like DHT). Cannot undergo further 5α-reduction or aromatization. Potent AR agonist'
      }
    }
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
      description: 'Trestolone. Extremely potent 19-nor, aromatizes heavily to 7-alpha-methyl-estradiol.',
      basePotency: 3.0,
      baseToxicity: 4.0
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
    provenance: {
      'clinical.summary': {
        source: 'HumanClinical',
        citation: 'Experimental male contraceptive research',
        confidence: 'Medium',
        notes: 'Trestolone (7α-methyl-19-nortestosterone). 10x more potent than testosterone. Under investigation for male contraception'
      },
      'pd.enzymaticInteractions.FiveAlphaReductase_SRD5A': {
        source: 'InVitro',
        citation: 'Pharmacology research - 7α-methyl prevents 5α-reduction',
        confidence: 'High',
        notes: 'NOT 5α-reduced due to 7α-methyl group. Maintains potency without DHT conversion → less prostate enlargement/baldness risk'
      },
      'pd.enzymaticInteractions.Aromatase_CYP19A1': {
        source: 'InVitro',
        citation: 'Clinical/pharmacology research',
        confidence: 'High',
        notes: 'AROMATIZES at high rate to 7α-methylestradiol (potent estrogen). AI often required. Conflicting reports but consensus: significant aromatization'
      },
      'pd.receptorInteractions.PR': {
        source: 'InVitro',
        citation: 'Contraceptive mechanism research',
        confidence: 'High',
        notes: 'Progestogenic activity. Suppresses LH/FSH → azoospermia/oligozoospermia. Key mechanism for male contraception'
      }
    }
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
      description: 'Anastrozole. Non-suicidal aromatase inhibitor.',
      basePotency: 0,
      baseToxicity: 0.1
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
    provenance: {
      'pk.CL': {
        source: 'HumanClinical',
        citation: 'FDA Label - Anastrozole',
        confidence: 'High',
        notes: 'Elimination t1/2 ~50 hours (range 30-60h). Steady-state after 7 days daily dosing. Long half-life allows once-daily dosing'
      },
      'pd.enzymaticInteractions.Aromatase_CYP19A1': {
        source: 'HumanClinical',
        citation: 'FDA Label, clinical trials',
        confidence: 'High',
        notes: '>96% aromatase inhibition at 1mg/day. 80% estradiol suppression within 24h, maintained at 14 days. Non-steroidal AI'
      },
      'clinical.summary': {
        source: 'HumanClinical',
        citation: 'FDA approved for breast cancer',
        confidence: 'High',
        notes: 'Approved for postmenopausal hormone receptor-positive breast cancer. Used off-label with AAS to prevent gynecomastia/water retention'
      }
    }
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
      description: '5-alpha reductase inhibitor. Prevents conversion of Test to DHT.',
      basePotency: 0,
      baseToxicity: 0.1
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
    provenance: {
      'pk.CL': {
        source: 'HumanClinical',
        citation: 'FDA Label - Finasteride',
        confidence: 'High',
        notes: 'Terminal elimination t1/2 5-6 hours (adults), 8h+ (elderly). Oral bioavailability ~65%. Peak plasma 1-2h. Extensively hepatic metabolism (CYP3A4)'
      },
      'pd.enzymaticInteractions.FiveAlphaReductase_SRD5A': {
        source: 'HumanClinical',
        citation: 'FDA Label, clinical pharmacology',
        confidence: 'High',
        notes: 'Inhibits Type II 5α-reductase (and Type III). Competitive inhibitor. 70% serum DHT reduction at 5mg/day. Prevents follicular miniaturization'
      },
      'clinical.summary': {
        source: 'HumanClinical',
        citation: 'FDA approved for BPH and male pattern baldness',
        confidence: 'High',
        notes: 'Approved for benign prostatic hyperplasia (BPH) and androgenetic alopecia. 1mg/day for hair loss, 5mg/day for prostate. Used with AAS to reduce DHT sides'
      }
    }
  }
};
