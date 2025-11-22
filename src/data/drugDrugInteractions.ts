import { IDrugDrugInteraction } from '../types/physio';

/**
 * Drug-Drug Interaction Registry
 * 
 * Comprehensive evidence-based interaction rules for compound combinations.
 * Applied during simulation to modify PK/PD/Toxicity calculations.
 * 
 * Organization:
 * - Hepatotoxicity (C17aa + C17aa, C17aa + 19-nor)
 * - Endocrine (AI interactions, SHBG effects, 5AR inhibition)
 * - Progestogenic/Prolactin (19-nor combinations)
 * - Anti-estrogenic synergies (DHT derivatives)
 */
export const DRUG_DRUG_INTERACTIONS: IDrugDrugInteraction[] = [
  
  // ============================================================
  // HEPATOTOXICITY INTERACTIONS
  // ============================================================
  
  // [CRITICAL] C17aa Injectable + C17aa Oral - EXTREME SYNERGY
  {
    id: 'tren_anadrol_hepatotox',
    compounds: ['trenbolone', 'anadrol'],
    effects: {
      toxicity: {
        type: 'Synergistic',
        organ: 'hepatic',
        multiplier: 2.2 // Most severe combination
      }
    },
    metadata: {
      severity: 'Critical',
      mechanism: 'C17-methylated 19-nor (Tren) + C17aa oral (Anadrol) = extreme bile salt export pump inhibition. Both cause cholestatic hepatitis via distinct but additive mechanisms.',
      recommendations: [
        'AVOID combination if possible',
        'If used: Reduce Anadrol to 25mg/day maximum',
        'TUDCA 1000mg/day MANDATORY',
        'Weekly AST/ALT monitoring',
        'Limit to 4-6 weeks maximum',
        'Discontinue immediately if AST/ALT >3x normal'
      ],
      provenance: {
        source: 'HumanClinical',
        citation: 'Case reports of 19-nor + C17aa oral hepatotoxicity',
        confidence: 'High',
        notes: 'Well-documented in clinical literature. Multiple case reports of acute cholestasis'
      }
    }
  },

  {
    id: 'tren_superdrol_hepatotox',
    compounds: ['trenbolone', 'superdrol'],
    effects: {
      toxicity: {
        type: 'Synergistic',
        organ: 'hepatic',
        multiplier: 2.5 // Most toxic oral (Superdrol) + most toxic injectable
      }
    },
    metadata: {
      severity: 'Critical',
      mechanism: 'Superdrol is the most hepatotoxic oral AAS. Combined with Tren creates extreme liver stress. Multiple reports of acute liver failure.',
      recommendations: [
        'DO NOT COMBINE - documented liver failure cases',
        'If absolutely必 used: max 10mg Superdrol + low Tren',
        'TUDCA 1500mg/day',
        'Daily liver monitoring'
      ],
      provenance: {
        source: 'HumanClinical',
        citation: 'Superdrol hepatotoxicity case reports',
        confidence: 'High',
        notes: 'Superdrol alone causes severe hepatotoxicity. Combination with Tren is extraordinarily dangerous'
      }
    }
  },

  // Generic C17aa Oral + C17aa Oral
  {
    id: 'oral_oral_hepatotox',
    compounds: ['anavar', 'winstrol'],
    effects: {
      toxicity: {
        type: 'Synergistic',
        organ: 'hepatic',
        multiplier: 1.7
      }
    },
    metadata: {
      severity: 'Warning',
      mechanism: 'Dual C17-alkylation doubles first-pass hepatic stress. Both inhibit bile transporters (ATP8B1/ABCB11).',
      recommendations: [
        'Avoid stacking two oral steroids',
        'If used: keep doses low and cycle short (≤6 weeks)',
        'TUDCA 500-750mg/day',
        'Monitor AST/ALT biweekly'
      ],
      provenance: {
        source: 'HumanClinical',
        citation: 'Multiple oral AAS stacking hepatotoxicity',
        confidence: 'High',
        notes: 'Dose-dependent synergistic toxicity confirmed in clinical observations'
      }
    }
  },

  // Apply same hepatotox pattern to all C17aa oral combinations
  {
    id: 'dianabol_anavar_hepatotox',
    compounds: ['dianabol', 'anavar'],
    effects: {
      toxicity: { type: 'Synergistic', organ: 'hepatic', multiplier: 1.6 }
    },
    metadata: {
      severity: 'Warning',
      mechanism: 'Dual C17aa oral stress. Dbol aromatizes (water retention stress) + Anavar renal metabolism (still C17aa).',
      recommendations: ['Prefer one oral at a time', 'TUDCA 500mg/day', 'Max 6 weeks'],
      provenance: { source: 'HumanClinical', citation: 'Oral AAS hepatotoxicity', confidence: 'High' }
    }
  },

  {
    id: 'winstrol_halotestin_hepatotox',
    compounds: ['winstrol', 'halotestin'],
    effects: {
      toxicity: { type: 'Synergistic', organ: 'hepatic', multiplier: 1.9 }
    },
    metadata: {
      severity: 'Critical',
      mechanism: 'Both highly hepatotoxic C17aa compounds. Halo has extreme toxicity profile.',
      recommendations: ['Strongly discourage combination', 'TUDCA 1000mg/day if used', 'Weekly labs'],
      provenance: { source: 'HumanClinical', citation: 'Halotestin hepatotoxicity case reports', confidence: 'High' }
    }
  },

  // ============================================================
  // AROMATASE INHIBITOR INTERACTIONS
  // ============================================================
  
  {
    id: 'ai_test_e2_suppression',
    compounds: ['arimidex', 'testosterone'],
    effects: {
      pk: {
        type: 'EnzymeInhibition',
        target: 'CYP19A1',
        inhibitionPercent: 96,
        affectedCompound: 'testosterone'
      }
    },
    metadata: {
      severity: 'Info',
      mechanism: 'Anastrozole inhibits aromatase by 96%, preventing testosterone conversion to estradiol. Can reduce E2 by 80%.',
      recommendations: [
        'Monitor estradiol levels (target 20-30 pg/mL)',
        'Too low E2 → joint pain, low libido, poor lipids',
        'Start 0.25mg E3D, adjust based on bloodwork',
        'Symptoms of crashed E2: achy joints, low libido, erectile dysfunction'
      ],
      provenance: {
        source: 'HumanClinical',
        citation: 'FDA Label - Anastrozole',
        confidence: 'High'
      }
    }
  },

  {
    id: 'ai_dianabol_e2',
    compounds: ['arimidex', 'dianabol'],
    effects: {
      pk: {
        type: 'EnzymeInhibition',
        target: 'CYP19A1',
        inhibitionPercent: 96,
        affectedCompound: 'dianabol'
      }
    },
    metadata: {
      severity: 'Info',
      mechanism: 'Dbol readily aromatizes (Emax 80). AI blocks this conversion, reducing water retention and gyno risk.',
      recommendations: ['AI commonly needed with Dbol >30mg/day', 'Monitor E2 levels'],
      provenance: { source: 'HumanClinical', citation: 'AI + aromatizing AAS', confidence: 'High' }
    }
  },

  {
    id: 'ai_equipoise_e2',
    compounds: ['arimidex', 'equipoise'],
    effects: {
      pk: {
        type: 'EnzymeInhibition',
        target: 'CYP19A1',
        inhibitionPercent: 96,
        affectedCompound: 'equipoise'
      }
    },
    metadata: {
      severity: 'Info',
      mechanism: 'Equipoise aromatizes ~50% the rate of Test. AI may not be needed at moderate doses.',
      recommendations: ['Often don\'t need AI with EQ alone', 'Monitor E2 if stacked with Test'],
      provenance: { source: 'AnimalModel', citation: 'Boldenone aromatization studies', confidence: 'Medium' }
    }
  },

  // AI + Nandrolone - SPECIAL CASE (Low E2 risk)
  {
    id: 'ai_nandrolone_low_e2',
    compounds: ['arimidex', 'nandrolone'],
    effects: {
      toxicity: {
        type: 'Synergistic',
        organ: 'cardiovascular', // Joint pain, libido issues manifested as general health decline
        multiplier: 1.4
      }
    },
    metadata: {
      severity: 'Warning',
      mechanism: 'Nandrolone aromatizes at ~20% the rate of Test. AI can crash E2 → "Deca Dick" (erectile dysfunction), severe joint pain, mood issues.',
      recommendations: [
        'AVOID AI with Nandrolone-only cycles',
        'If using AI with Test+Nandrolone: be very conservative',
        'Target E2 higher end of range (30-40 pg/mL) for joint lubrication',
        'Low E2 + Nandrolone = severe sexual dysfunction and joint pain'
      ],
      provenance: {
        source: 'HumanClinical',
        citation: 'Nandrolone + AI low estrogen complications',
        confidence: 'High',
        notes: 'Well-documented "Deca Dick" phenomenon exacerbated by E2 suppression'
      }
    }
  },

  // ============================================================
  // SHBG & PROTEIN BINDING INTERACTIONS
  // ============================================================
  
  {
    id: 'proviron_test_shbg',
    compounds: ['proviron', 'testosterone'],
    effects: {
      pk: {
        type: 'ProteinBindingDisplacement',
        shbgDisplacementFactor: 1.3, // 30% more free testosterone
        affectedCompound: 'testosterone'
      }
    },
    metadata: {
      severity: 'Info',
      mechanism: 'Proviron has extremely high SHBG affinity (Kd 0.5nM), displacing testosterone and increasing free (bioavailable) fraction by ~30%.',
      recommendations: [
        'Enhances libido and androgenic effects without raising total Test dose',
        'Typical dose: 25-50mg/day',
        'No need to increase testosterone dose',
        'Useful for libido enhancement on cycle'
      ],
      provenance: {
        source: 'HumanClinical',
        citation: 'Mesterolone SHBG binding pharmacology',
        confidence: 'High'
      }
    }
  },

  {
    id: 'proviron_nandrolone_shbg',
    compounds: ['proviron', 'nandrolone'],
    effects: {
      pk: {
        type: 'ProteinBindingDisplacement',
        shbgDisplacementFactor: 1.25,
        affectedCompound: 'nandrolone'
      }
    },
    metadata: {
      severity: 'Info',
      mechanism: 'Proviron frees up Nandrolone from SHBG, potentially helping with "Deca Dick" by increasing free hormone availability.',
      recommendations: ['May help mitigate Deca Dick', 'Not a substitute for adequate testosterone base'],
      provenance: { source: 'ExpertHeuristic', citation: 'Clinical observations', confidence: 'Medium' }
    }
  },

  // ============================================================
  // 5α-REDUCTASE INHIBITION
  // ============================================================
  
  {
    id: 'fin_test_dht',
    compounds: ['finasteride', 'testosterone'],
    effects: {
      pk: {
        type: 'EnzymeInhibition',
        target: 'SRD5A',
        inhibitionPercent: 70,
        affectedCompound: 'testosterone'
      }
    },
    metadata: {
      severity: 'Warning',
      mechanism: 'Finasteride blocks 70% of DHT conversion from testosterone (Type II 5α-reductase). Reduces hair loss/prostate but may impact libido/erections.',
      recommendations: [
        'Use ONLY if experiencing hair loss or BPH symptoms',
        'Monitor for low DHT sides (libido, erection quality, mood)',
        '1mg/day for hair, 5mg/day for prostate',
        'Post-Finasteride Syndrome (PFS) risk - use cautiously'
      ],
      provenance: {
        source: 'HumanClinical',
        citation: 'FDA Label - Finasteride',
        confidence: 'High'
      }
    }
  },

  // ============================================================
  // 19-NOR PROGESTOGENIC/PROLACTIN INTERACTIONS
  // ============================================================
  
  {
    id: 'tren_nandrolone_prolactin',
    compounds: ['trenbolone', 'nandrolone'],
    effects: {
      toxicity: {
        type: 'Synergistic',
        organ: 'neurotoxicity', // Prolactin effects manifest as neurological/sexual
        multiplier: 1.6
      }
    },
    metadata: {
      severity: 'Warning',
      mechanism: 'Both are 19-nor steroids with progestogenic activity. Combined use increases prolactin elevation risk → gynecomastia, sexual dysfunction, mood issues.',
      recommendations: [
        'Avoid combining two 19-nors',
        'If used: keep doses moderate',
        'Consider cabergoline 0.25mg 2x/week for prolactin control',
        'Monitor for: nipple sensitivity, low libido, erectile dysfunction, anorgasmia'
      ],
      provenance: {
        source: 'HumanClinical',
        citation: '19-nor progestogenic/prolactin effects',
        confidence: 'High',
        notes: 'Both Nandrolone and Trenbolone elevate prolactin through different mechanisms (direct PR binding + TRH stimulation)'
      }
    }
  },

  {
    id: 'nandrolone_ment_prolactin',
    compounds: ['nandrolone', 'ment'],
    effects: {
      toxicity: {
        type: 'Synergistic',
        organ: 'neurotoxicity',
        multiplier: 1.7
      }
    },
    metadata: {
      severity: 'Critical',
      mechanism: 'MENT is 10x more potent and highly progestogenic. Combined with Nandrolone creates extreme prolactin elevation risk.',
      recommendations: ['Strongly discourage combination', 'Cabergoline essential if attempted'],
      provenance: { source: 'HumanClinical', citation: 'MENT progestogenic activity', confidence: 'Medium' }
    }
  },

  // ============================================================
  // DHT DERIVATIVE ANTI-ESTROGENIC SYNERGIES
  // ============================================================
  
  {
    id: 'masteron_test_anti_estrogen',
    compounds: ['masteron', 'testosterone'],
    effects: {
      pd: {
        type: 'ReceptorCompetition',
        pathway: 'myogenesis',
        multiplier: 1.1 // Mild synergy from E2 control
      }
    },
    metadata: {
      severity: 'Info',
      mechanism: 'Masteron competes with estrogen at receptor sites (anti-estrogenic). Reduces water retention, enhances muscle hardness without lowering total E2.',
      recommendations: [
        'Popular for cutting/contest prep',
        'Provides cosmetic "hardening" effect',
        'May reduce AI needs slightly',
        'Typical dose: 400-600mg/week'
      ],
      provenance: {
        source: 'HumanClinical',
        citation: 'Drostanolone anti-estrogenic properties',
        confidence: 'High',
        notes: 'Originally used for breast cancer treatment due to anti-estrogenic effects'
      }
    }
  },

  {
    id: 'proviron_dbol_anti_estrogen',
    compounds: ['proviron', 'dianabol'],
    effects: {
      pd: {
        type: 'ReceptorCompetition',
        pathway: 'myogenesis',
        multiplier: 1.05
      }
    },
    metadata: {
      severity: 'Info',
      mechanism: 'Proviron competes with E2 at receptors, helping manage Dbol\'s heavy aromatization without completely blocking estrogen.',
      recommendations: ['Can reduce bloat from Dbol', 'Not as effective as AI for E2 control'],
      provenance: { source: 'ExpertHeuristic', citation: 'Clinical use patterns', confidence: 'Medium' }
    }
  },

  // ============================================================
  // CARDIOVASCULAR INTERACTIONS
  // ============================================================
  
  {
    id: 'tren_winstrol_cardiovascular',
    compounds: ['trenbolone', 'winstrol'],
    effects: {
      toxicity: {
        type: 'Synergistic',
        organ: 'cardiovascular',
        multiplier: 1.6
      }
    },
    metadata: {
      severity: 'Critical',
      mechanism: 'Winstrol causes severe HDL suppression (48% in 1 week). Tren increases BP/LVH. Combined = extreme CV stress.',
      recommendations: [
        'Monitor BP daily',
        'Lipid panel every 4 weeks',
        'Cardio/LISS essential',
        'Consider fish oil 4g/day, niacin for HDL support'
      ],
      provenance: {
        source: 'HumanClinical',
        citation: 'Stanozolol HDL suppression + Trenbolone CV effects',
        confidence: 'High'
      }
    }
  },

  // ============================================================
  // RENAL TOXICITY
  // ============================================================
  
  {
    id: 'tren_anavar_renal',
    compounds: ['trenbolone', 'anavar'],
    effects: {
      toxicity: {
        type: 'Synergistic',
        organ: 'renal',
        multiplier: 1.4
      }
    },
    metadata: {
      severity: 'Warning',
      mechanism: 'Trenbolone causes direct nephrotoxicity. Anavar metabolized primarily by kidneys. Combined renal stress.',
      recommendations: [
        'Hydration critical (1+ gallon/day)',
        'Monitor creatinine/BUN',
        'Reduce protein intake if creatinine elevated'
      ],
      provenance: {
        source: 'HumanClinical',
        citation: 'Trenbolone nephrotoxicity + Oxandrolone renal metabolism',
        confidence: 'Medium'
      }
    }
  }
];

/**
 * Get active DDI rules for a given stack of compounds
 * 
 * @param compoundIds Array of compound IDs in the stack
 * @returns Array of applicable DDI rules
 */
export function getDDIForStack(compoundIds: string[]): IDrugDrugInteraction[] {
  if (compoundIds.length < 2) return [];
  
  return DRUG_DRUG_INTERACTIONS.filter(ddi => {
    const [c1, c2] = ddi.compounds;
    return (
      (compoundIds.includes(c1) && compoundIds.includes(c2)) ||
      (compoundIds.includes(c2) && compoundIds.includes(c1))
    );
  });
}
