import { CompoundOntologyEntry } from '../types/compoundOntology';

const testosteroneOntology: CompoundOntologyEntry = {
  id: 'testosterone',
  version: '0.1.0',
  aliases: ['test', 'test-e'],
  exposures: [
    {
      id: 'test_e_im_200',
      label: 'Testosterone Enanthate 200 mg IM weekly',
      route: 'IM',
      formulation: 'Esterified',
      ester: 'enanthate',
      schedule: {
        dose: { value: 200, unit: 'mg', normalizedTo: 'mg_per_week', normalizedValue: 200 },
        frequencyHours: 168,
        durationWeeks: 12,
        taperStrategy: 'Flat'
      },
      population: {
        sex: 'Male',
        ageRangeYears: [28, 45],
        trainingStatus: 'Recreational',
        bodyMassKg: {
          measurement: { value: 92, unit: 'kg' },
          evidence: {
            tier: 'Tier2_MetaAnalysis',
            sourceType: 'ObservationalStudy',
            citation: 'PMID: 11836290',
            population: 'n=68 hypogonadal males'
          },
          uncertainty: { kind: 'SD', standardDeviation: 8 }
        }
      },
      measurementWindow: {
        startHoursPostDose: 96,
        endHoursPostDose: 120,
        state: 'SteadyState'
      },
      coInterventions: ['no additional AAS', 'standard AI rescue if needed'],
      normalization: {
        mgPerWeek: 200,
        cMax: {
          value: 1180,
          unit: 'ng/dL',
          normalizedTo: 'total_testosterone',
          normalizedValue: 1180
        },
        cMin: {
          value: 480,
          unit: 'ng/dL'
        }
      },
      evidence: {
        tier: 'Tier2_MetaAnalysis',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 11836290',
        population: 'IM TE, weekly, n=68',
        notes: 'Steady-state approximated from day 35 onwards'
      },
      assumptions: ['steady_state_assumed']
    },
    {
      id: 'test_e_im_600',
      label: 'Testosterone Enanthate 600 mg IM weekly',
      route: 'IM',
      formulation: 'Esterified',
      ester: 'enanthate',
      schedule: {
        dose: { value: 600, unit: 'mg', normalizedTo: 'mg_per_week', normalizedValue: 600 },
        frequencyHours: 168,
        durationWeeks: 12,
        taperStrategy: 'Flat'
      },
      population: {
        sex: 'Male',
        ageRangeYears: [25, 38],
        trainingStatus: 'Advanced',
        bodyMassKg: {
          measurement: { value: 98, unit: 'kg' },
          evidence: {
            tier: 'Tier3_Cohort',
            sourceType: 'ObservationalStudy',
            citation: 'PMID: 20095441',
            population: 'n=24 resistance-trained'
          }
        }
      },
      measurementWindow: {
        startHoursPostDose: 72,
        endHoursPostDose: 120,
        state: 'SteadyState'
      },
      normalization: {
        mgPerWeek: 600,
        cMax: {
          value: 3120,
          unit: 'ng/dL'
        }
      },
      evidence: {
        tier: 'Tier3_Cohort',
        sourceType: 'ObservationalStudy',
        citation: 'PMID: 20095441',
        population: '12-week blast logs'
      },
      assumptions: ['steady_state_assumed', 'single_compound_context']
    }
  ],
  potencyScaling: {
    referenceCompoundId: 'testosterone',
    mgPer100Equivalent: {
      measurement: {
        value: 100,
        unit: 'mg_reference_equivalent',
        normalizedTo: 'per_100mg',
        normalizedValue: 100
      },
      evidence: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 11836290'
      }
    },
    context: 'Defines the baseline for other compounds'
  },
  phenotypeVector: [
    {
      axis: 'Hypertrophy',
      score: {
        measurement: { value: 7.2, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier2_MetaAnalysis',
          sourceType: 'RandomizedControlledTrial',
          citation: 'PMID: 19589964'
        },
        uncertainty: { kind: 'CI', confidenceLevel: 0.9, lower: 6.6, upper: 7.6 }
      }
    },
    {
      axis: 'NeuralDrive',
      score: {
        measurement: { value: 6, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier3_Cohort',
          sourceType: 'ObservationalStudy',
          citation: 'PMID: 21154195'
        }
      }
    },
    {
      axis: 'LipolysisEfficiency',
      score: {
        measurement: { value: 4.8, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier2_MetaAnalysis',
          sourceType: 'ObservationalStudy'
        }
      }
    },
    {
      axis: 'EnduranceCapacity',
      score: {
        measurement: { value: 5.5, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier4_CaseSeries',
          sourceType: 'ObservationalStudy'
        }
      }
    },
    {
      axis: 'GlycogenRetention',
      score: {
        measurement: { value: 6.3, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier3_Cohort',
          sourceType: 'ObservationalStudy'
        }
      }
    }
  ],
  beneficialOutcomes: [
    {
      metric: {
        id: 'lean_mass_delta',
        domain: 'LeanMass',
        label: 'Δ Lean Mass',
        unit: 'kg',
        higherIsBetter: true,
        description: 'DXA-determined lean tissue change over 12 weeks'
      },
      model: 'Hill',
      plateau: { enforceNonDeclineAfterMgPerWeek: 450, slopeCeiling: 0.05 },
      anchors: [
        {
          exposureId: 'test_e_im_200',
          dose: { value: 200, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 200 },
          outcomeValue: {
            measurement: { value: 2.3, unit: 'kg' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 19589964',
              population: 'dose-ranging TE study'
            },
            uncertainty: { kind: 'CI', confidenceLevel: 0.95, lower: 1.6, upper: 2.9 }
          }
        },
        {
          exposureId: 'test_e_im_600',
          dose: { value: 600, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 600 },
          outcomeValue: {
            measurement: { value: 5.0, unit: 'kg' },
            evidence: {
              tier: 'Tier3_Cohort',
              sourceType: 'ObservationalStudy',
              citation: 'PMID: 20095441'
            },
            uncertainty: { kind: 'Range', lower: 4.1, upper: 5.6 }
          }
        }
      ],
      narrative: 'Lean mass accrual plateaus near the 500-600 mg/wk mark as SHBG saturation and caloric limits kick in.'
    },
    {
      metric: {
        id: 'strength_1rm_delta',
        domain: 'Strength',
        label: 'Δ 1RM (kg)',
        unit: 'kg',
        higherIsBetter: true
      },
      model: 'Piecewise',
      anchors: [
        {
          exposureId: 'test_e_im_200',
          dose: { value: 200, unit: 'mg/week' },
          outcomeValue: {
            measurement: { value: 15, unit: 'kg' },
            evidence: {
              tier: 'Tier2_MetaAnalysis',
              sourceType: 'RandomizedControlledTrial'
            }
          }
        },
        {
          exposureId: 'test_e_im_600',
          dose: { value: 600, unit: 'mg/week' },
          outcomeValue: {
            measurement: { value: 32, unit: 'kg' },
            evidence: {
              tier: 'Tier3_Cohort',
              sourceType: 'ObservationalStudy'
            }
          }
        }
      ]
    }
  ],
  riskOutcomes: [
    {
      metric: {
        id: 'hdl_suppression',
        domain: 'Cardiometabolic',
        label: 'HDL Change',
        unit: 'percent',
        higherIsBetter: false,
        description: 'Relative percent change from baseline'
      },
      model: 'Spline',
      anchors: [
        {
          exposureId: 'test_e_im_200',
          dose: { value: 200, unit: 'mg/week' },
          outcomeValue: {
            measurement: { value: -9, unit: 'percent' },
            evidence: {
              tier: 'Tier2_MetaAnalysis',
              sourceType: 'RandomizedControlledTrial'
            },
            uncertainty: { kind: 'Range', lower: -5, upper: -16 }
          }
        },
        {
          exposureId: 'test_e_im_600',
          dose: { value: 600, unit: 'mg/week' },
          outcomeValue: {
            measurement: { value: -22, unit: 'percent' },
            evidence: {
              tier: 'Tier3_Cohort',
              sourceType: 'ObservationalStudy'
            }
          }
        }
      ]
    },
    {
      metric: {
        id: 'hematocrit_increase',
        domain: 'Cardiometabolic',
        label: 'Hematocrit Δ',
        unit: 'percentage_point',
        higherIsBetter: false
      },
      model: 'Hill',
      anchors: [
        {
          exposureId: 'test_e_im_200',
          dose: { value: 200, unit: 'mg/week' },
          outcomeValue: {
            measurement: { value: 3.1, unit: 'percentage_point' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial'
            }
          }
        },
        {
          exposureId: 'test_e_im_600',
          dose: { value: 600, unit: 'mg/week' },
          outcomeValue: {
            measurement: { value: 6.4, unit: 'percentage_point' },
            evidence: {
              tier: 'Tier3_Cohort',
              sourceType: 'ObservationalStudy'
            }
          }
        }
      ]
    }
  ],
  biomarkers: [
    {
      biomarker: 'LDL-C',
      direction: 'Increase',
      magnitude: {
        measurement: { value: 18, unit: 'mg/dL' },
        evidence: {
          tier: 'Tier2_MetaAnalysis',
          sourceType: 'RandomizedControlledTrial'
        }
      },
      recoveryHalfLifeDays: {
        measurement: { value: 21, unit: 'days' },
        evidence: {
          tier: 'Tier4_CaseSeries',
          sourceType: 'ObservationalStudy'
        }
      }
    }
  ],
  dynamics: {
    onsetHours: {
      measurement: { value: 36, unit: 'hours' },
      evidence: {
        tier: 'Tier5_Anecdote',
        sourceType: 'ExpertConsensus',
        notes: 'Subjective reports of libido and strength changes'
      }
    },
    steadyStateDays: {
      measurement: { value: 35, unit: 'days' },
      evidence: {
        tier: 'Tier2_MetaAnalysis',
        sourceType: 'PharmacokineticModel'
      }
    },
    washoutDays: {
      measurement: { value: 28, unit: 'days' },
      evidence: {
        tier: 'Tier3_Cohort',
        sourceType: 'ObservationalStudy'
      }
    },
    accumulationIndex: {
      measurement: { value: 1.8, unit: 'ratio' },
      evidence: {
        tier: 'Tier2_MetaAnalysis',
        sourceType: 'PharmacokineticModel'
      }
    }
  },
  assumptionTags: [
    {
      id: 'steady_state_assumed',
      statement: 'Steady-state concentrations assumed after 4 half-lives regardless of individual CL variability.',
      severity: 'Medium',
      rationale: 'Limited serial bloodwork in recreational cohort.',
      mitigation: 'Flag UI when user half-life selection exceeds steady-state assumption horizon.'
    },
    {
      id: 'single_compound_context',
      statement: 'Benefit/risk anchors assume monotherapy with only TRT-support ancillaries.',
      severity: 'High',
      rationale: 'Stack synergies can inflate both benefit and toxicity curves.',
      mitigation: 'Use interaction engine to apply multipliers when additional compounds are loaded.'
    }
  ],
  auditTrail: {
    created: '2024-07-11',
    createdBy: 'ontology-team',
    lastReviewed: '2024-08-01',
    reviewers: ['clinical-sme', 'data-science'],
    changeNotes: 'Initial hostile-audience-proof scaffold for testosterone.'
  }
};

const trenboloneOntology: CompoundOntologyEntry = {
  id: 'trenbolone',
  version: '0.1.0',
  aliases: ['tren', 'tren-a'],
  exposures: [
    {
      id: 'tren_a_im_200',
      label: 'Trenbolone Acetate 200 mg IM weekly (split doses)',
      route: 'IM',
      formulation: 'Esterified',
      ester: 'acetate',
      schedule: {
        dose: { value: 50, unit: 'mg', normalizedTo: 'mg_per_injection', normalizedValue: 50 },
        frequencyHours: 48,
        durationWeeks: 8,
        taperStrategy: 'Pulse'
      },
      population: {
        sex: 'Male',
        ageRangeYears: [26, 40],
        trainingStatus: 'Advanced',
        bodyMassKg: {
          measurement: { value: 94, unit: 'kg' },
          evidence: {
            tier: 'Tier4_CaseSeries',
            sourceType: 'ObservationalStudy',
            citation: 'PMID: 27834110'
          }
        }
      },
      measurementWindow: {
        startHoursPostDose: 12,
        endHoursPostDose: 24,
        state: 'SteadyState'
      },
      normalization: {
        mgPerWeek: 200,
        cMax: {
          value: 34,
          unit: 'ng/mL',
          normalizedTo: 'serum_trenbolone'
        },
        auc24h: {
          value: 520,
          unit: 'ng·h/mL'
        }
      },
      evidence: {
        tier: 'Tier4_CaseSeries',
        sourceType: 'ObservationalStudy',
        notes: 'Limited human PK; acetate modeled from veterinary data scaled by CL.'
      },
      assumptions: ['steady_state_assumed', 'vet_to_human_scaling']
    },
    {
      id: 'tren_a_im_350',
      label: 'Trenbolone Acetate 350 mg IM weekly',
      route: 'IM',
      formulation: 'Esterified',
      ester: 'acetate',
      schedule: {
        dose: { value: 70, unit: 'mg' },
        frequencyHours: 48,
        durationWeeks: 8,
        taperStrategy: 'Pulse'
      },
      population: {
        sex: 'Male',
        ageRangeYears: [27, 39],
        trainingStatus: 'Advanced'
      },
      measurementWindow: {
        startHoursPostDose: 12,
        endHoursPostDose: 24,
        state: 'SteadyState'
      },
      normalization: {
        mgPerWeek: 350
      },
      evidence: {
        tier: 'Tier5_Anecdote',
        sourceType: 'ExpertConsensus',
        notes: 'Triangulated from 1,200 user logs + limited bovine PK data.'
      },
      assumptions: ['steady_state_assumed', 'tren_rule_plateau']
    }
  ],
  potencyScaling: {
    referenceCompoundId: 'testosterone',
    mgPer100Equivalent: {
      measurement: {
        value: 215,
        unit: 'mg_testosterone_equivalent',
        normalizedTo: 'per_100mg',
        normalizedValue: 215
      },
      evidence: {
        tier: 'Tier4_CaseSeries',
        sourceType: 'ObservationalStudy',
        notes: 'Derived from AR occupancy modeling + real-world hypertrophy ratio logs.'
      },
      uncertainty: { kind: 'Range', lower: 190, upper: 240 }
    },
    context: 'Used to equate tren dosage to testosterone reference for stack load scoring.'
  },
  phenotypeVector: [
    {
      axis: 'Hypertrophy',
      score: {
        measurement: { value: 9.2, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier4_CaseSeries',
          sourceType: 'ObservationalStudy'
        }
      }
    },
    {
      axis: 'NeuralDrive',
      score: {
        measurement: { value: 9.8, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier5_Anecdote',
          sourceType: 'ExpertConsensus'
        },
        caveats: ['Aggression/self-report heavy bias']
      }
    },
    {
      axis: 'LipolysisEfficiency',
      score: {
        measurement: { value: 8.8, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier4_CaseSeries',
          sourceType: 'ObservationalStudy'
        }
      }
    },
    {
      axis: 'EnduranceCapacity',
      score: {
        measurement: { value: 2.2, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier5_Anecdote',
          sourceType: 'ExpertConsensus'
        },
        caveats: ['Reported dyspnea limits work capacity despite RBC gains']
      }
    },
    {
      axis: 'GlycogenRetention',
      score: {
        measurement: { value: 6.9, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier5_Anecdote',
          sourceType: 'ExpertConsensus'
        }
      }
    }
  ],
  beneficialOutcomes: [
    {
      metric: {
        id: 'lean_mass_delta',
        domain: 'LeanMass',
        label: 'Δ Lean Mass',
        unit: 'kg',
        higherIsBetter: true
      },
      model: 'Hill',
      plateau: { enforceNonDeclineAfterMgPerWeek: 300, slopeCeiling: 0.02 },
      anchors: [
        {
          exposureId: 'tren_a_im_200',
          dose: { value: 200, unit: 'mg/week' },
          outcomeValue: {
            measurement: { value: 4.4, unit: 'kg' },
            evidence: {
              tier: 'Tier4_CaseSeries',
              sourceType: 'ObservationalStudy'
            },
            uncertainty: { kind: 'Range', lower: 3.4, upper: 5.4 }
          }
        },
        {
          exposureId: 'tren_a_im_350',
          dose: { value: 350, unit: 'mg/week' },
          outcomeValue: {
            measurement: { value: 5.1, unit: 'kg' },
            evidence: {
              tier: 'Tier5_Anecdote',
              sourceType: 'ExpertConsensus'
            }
          }
        }
      ],
      narrative: 'Benefit curve flattens aggressively past 300 mg due to Tren Rule hard-coded plateau enforcement.'
    },
    {
      metric: {
        id: 'strength_1rm_delta',
        domain: 'Strength',
        label: 'Δ 1RM (kg)',
        unit: 'kg',
        higherIsBetter: true
      },
      model: 'Spline',
      anchors: [
        {
          exposureId: 'tren_a_im_200',
          dose: { value: 200, unit: 'mg/week' },
          outcomeValue: {
            measurement: { value: 28, unit: 'kg' },
            evidence: {
              tier: 'Tier4_CaseSeries',
              sourceType: 'ObservationalStudy'
            }
          }
        },
        {
          exposureId: 'tren_a_im_350',
          dose: { value: 350, unit: 'mg/week' },
          outcomeValue: {
            measurement: { value: 34, unit: 'kg' },
            evidence: {
              tier: 'Tier5_Anecdote',
              sourceType: 'ExpertConsensus'
            }
          }
        }
      ]
    }
  ],
  riskOutcomes: [
    {
      metric: {
        id: 'psychological_strain',
        domain: 'Psychological',
        label: 'Psychological Strain Score',
        unit: 'score_0_10',
        higherIsBetter: false
      },
      model: 'Piecewise',
      anchors: [
        {
          exposureId: 'tren_a_im_200',
          dose: { value: 200, unit: 'mg/week' },
          outcomeValue: {
            measurement: { value: 6.5, unit: 'score_0_10' },
            evidence: {
              tier: 'Tier5_Anecdote',
              sourceType: 'ExpertConsensus'
            },
            caveats: ['Derived from validated mood survey proxies + logbooks']
          }
        },
        {
          exposureId: 'tren_a_im_350',
          dose: { value: 350, unit: 'mg/week' },
          outcomeValue: {
            measurement: { value: 8.1, unit: 'score_0_10' },
            evidence: {
              tier: 'Tier5_Anecdote',
              sourceType: 'ExpertConsensus'
            }
          }
        }
      ]
    },
    {
      metric: {
        id: 'cardio_risk_score',
        domain: 'Cardiometabolic',
        label: 'Composite Cardiometabolic Risk',
        unit: 'score',
        higherIsBetter: false
      },
      model: 'Hill',
      anchors: [
        {
          exposureId: 'tren_a_im_200',
          dose: { value: 200, unit: 'mg/week' },
          outcomeValue: {
            measurement: { value: 3.7, unit: 'score' },
            evidence: {
              tier: 'Tier4_CaseSeries',
              sourceType: 'ObservationalStudy'
            }
          }
        },
        {
          exposureId: 'tren_a_im_350',
          dose: { value: 350, unit: 'mg/week' },
          outcomeValue: {
            measurement: { value: 4.6, unit: 'score' },
            evidence: {
              tier: 'Tier5_Anecdote',
              sourceType: 'ExpertConsensus'
            }
          }
        }
      ]
    }
  ],
  biomarkers: [
    {
      biomarker: 'Prolactin',
      direction: 'Increase',
      magnitude: {
        measurement: { value: 35, unit: 'percent' },
        evidence: {
          tier: 'Tier5_Anecdote',
          sourceType: 'ExpertConsensus'
        }
      },
      recoveryHalfLifeDays: {
        measurement: { value: 10, unit: 'days' },
        evidence: {
          tier: 'Tier4_CaseSeries',
          sourceType: 'ObservationalStudy'
        }
      }
    }
  ],
  dynamics: {
    onsetHours: {
      measurement: { value: 12, unit: 'hours' },
      evidence: {
        tier: 'Tier5_Anecdote',
        sourceType: 'ExpertConsensus'
      }
    },
    steadyStateDays: {
      measurement: { value: 6, unit: 'days' },
      evidence: {
        tier: 'Tier4_CaseSeries',
        sourceType: 'PharmacokineticModel'
      }
    },
    washoutDays: {
      measurement: { value: 10, unit: 'days' },
      evidence: {
        tier: 'Tier4_CaseSeries',
        sourceType: 'ObservationalStudy'
      }
    },
    toleranceHalfLifeDays: {
      measurement: { value: 21, unit: 'days' },
      evidence: {
        tier: 'Tier5_Anecdote',
        sourceType: 'ExpertConsensus'
      }
    },
    hysteresis: {
      direction: 'Clockwise',
      lagHours: 24
    }
  },
  assumptionTags: [
    {
      id: 'steady_state_assumed',
      statement: 'Steady-state derived from extrapolated acetate PK assuming CL = 1.2 L/h.',
      severity: 'High',
      rationale: 'No controlled human PK dataset exists.',
      mitigation: 'Expose manual override + confidence band warnings.',
      evidenceGap: {
        tier: 'Tier5_Anecdote',
        sourceType: 'ExpertConsensus',
        notes: 'Awaiting micro-dosed PK studies.'
      }
    },
    {
      id: 'vet_to_human_scaling',
      statement: 'Clearance scaled from bovine models using allometric factor 0.24.',
      severity: 'Medium',
      rationale: 'Metabolic rate differences may understate human AUC.',
      mitigation: 'Allow user-provided troughs to recalibrate.'
    },
    {
      id: 'tren_rule_plateau',
      statement: 'Benefit curve forced to plateau post 300 mg/week (Trenbolone Rule).',
      severity: 'Low',
      rationale: 'Prevents hypothetical hyperbolic gains lacking evidence.',
      mitigation: 'Tests enforce non-decline behavior; document in README.'
    }
  ],
  auditTrail: {
    created: '2024-07-18',
    createdBy: 'ontology-team',
    lastReviewed: '2024-08-01',
    reviewers: ['clinical-sme'],
    changeNotes: 'Prototype tren rule-compliant surface.'
  }
};

const nandroloneOntology: CompoundOntologyEntry = {
  id: 'nandrolone',
  version: '0.1.0',
  aliases: ['nd', 'deca'],
  exposures: [
    {
      id: 'nandrolone_im_150_q2w_hiv_men',
      label: 'Nandrolone Decanoate 150 mg IM q2w (HIV wasting men)',
      route: 'IM',
      formulation: 'Esterified',
      ester: 'decanoate',
      schedule: {
        dose: { value: 150, unit: 'mg', normalizedTo: 'mg_per_injection', normalizedValue: 150 },
        frequencyHours: 336,
        durationWeeks: 12,
        taperStrategy: 'Flat'
      },
      population: {
        sex: 'Male',
        ageRangeYears: [20, 55],
        trainingStatus: 'Untrained'
      },
      measurementWindow: {
        startHoursPostDose: 168,
        endHoursPostDose: 2016,
        state: 'SteadyState'
      },
      coInterventions: ['Stable HAART background', 'No concomitant testosterone rescue'],
      normalization: {
        mgPerWeek: 75
      },
      evidence: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 16494628',
        population: 'E-1696 multicenter trial, n=303 men with 5–15% involuntary weight loss'
      },
      assumptions: ['nandrolone_steady_state_assumed', 'cachexia_context_dependence']
    },
    {
      id: 'nandrolone_im_100_q2w_hiv_women',
      label: 'Nandrolone Decanoate 100 mg IM q2w (HIV wasting women)',
      route: 'IM',
      formulation: 'Esterified',
      ester: 'decanoate',
      schedule: {
        dose: { value: 100, unit: 'mg', normalizedTo: 'mg_per_injection', normalizedValue: 100 },
        frequencyHours: 336,
        durationWeeks: 12,
        taperStrategy: 'Flat'
      },
      population: {
        sex: 'Female',
        ageRangeYears: [25, 50],
        trainingStatus: 'Untrained'
      },
      measurementWindow: {
        startHoursPostDose: 168,
        endHoursPostDose: 2016,
        state: 'SteadyState'
      },
      coInterventions: ['Background antiretroviral therapy', 'Nutrition counseling provided equally across arms'],
      normalization: {
        mgPerWeek: 50
      },
      evidence: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 15767536',
        population: 'ACTG 329 HIV+ women, n=38'
      },
      assumptions: ['nandrolone_steady_state_assumed', 'cachexia_context_dependence']
    },
    {
      id: 'nandrolone_im_100_qw_hemodialysis',
      label: 'Nandrolone Decanoate 100 mg IM weekly (low-dose epoetin adjunct)',
      route: 'IM',
      formulation: 'Esterified',
      ester: 'decanoate',
      schedule: {
        dose: { value: 100, unit: 'mg', normalizedTo: 'mg_per_week', normalizedValue: 100 },
        frequencyHours: 168,
        durationWeeks: 24,
        taperStrategy: 'Flat'
      },
      population: {
        sex: 'Mixed',
        ageRangeYears: [30, 55],
        trainingStatus: 'Untrained'
      },
      measurementWindow: {
        startHoursPostDose: 0,
        endHoursPostDose: 4032,
        state: 'SteadyState'
      },
      coInterventions: ['rHuEPO 1,000 U SC three times weekly', 'Stable thrice-weekly hemodialysis'],
      normalization: {
        mgPerWeek: 100
      },
      evidence: {
        tier: 'Tier3_Cohort',
        sourceType: 'ObservationalStudy',
        citation: 'PMCID: PMC4531675',
        population: 'n=17 chronic hemodialysis patients refractory to low-dose epoetin'
      },
      assumptions: ['nandrolone_steady_state_assumed', 'epoetin_background']
    },
    {
      id: 'nandrolone_im_200_qw_bodybuilder',
      label: 'Nandrolone Decanoate 200 mg IM weekly (bodybuilder RCT)',
      route: 'IM',
      formulation: 'Esterified',
      ester: 'decanoate',
      schedule: {
        dose: { value: 200, unit: 'mg', normalizedTo: 'mg_per_week', normalizedValue: 200 },
        frequencyHours: 168,
        durationWeeks: 8,
        taperStrategy: 'Flat'
      },
      population: {
        sex: 'Male',
        ageRangeYears: [19, 44],
        trainingStatus: 'Advanced'
      },
      measurementWindow: {
        startHoursPostDose: 336,
        endHoursPostDose: 1344,
        state: 'SteadyState'
      },
      coInterventions: ['No additional AAS permitted', 'Supervised resistance training maintained'],
      normalization: {
        mgPerWeek: 200
      },
      evidence: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 15076791',
        population: 'n=16 experienced male bodybuilders, 4-compartment body composition assessment'
      },
      assumptions: ['nandrolone_steady_state_assumed']
    },
    {
      id: 'nandrolone_poly_stack_hartgens',
      label: 'Self-administered multi-compound stack anchored by nandrolone',
      route: 'IM',
      formulation: 'Blend',
      schedule: {
        dose: { value: 600, unit: 'mg_total_aas_per_week', normalizedTo: 'mg_per_week', normalizedValue: 600 },
        frequencyHours: 168,
        durationWeeks: 8,
        taperStrategy: 'Pyramid'
      },
      population: {
        sex: 'Male',
        ageRangeYears: [21, 39],
        trainingStatus: 'Advanced'
      },
      measurementWindow: {
        startHoursPostDose: 168,
        endHoursPostDose: 1344,
        state: 'SteadyState'
      },
      coInterventions: ['Stack included testosterone esters, stanozolol, orals per self-report'],
      normalization: {
        mgPerWeek: 600
      },
      evidence: {
        tier: 'Tier3_Cohort',
        sourceType: 'ObservationalStudy',
        citation: 'PMID: 15155420',
        population: 'n=19 self-administering bodybuilders followed prospectively'
      },
      assumptions: ['nandrolone_steady_state_assumed', 'poly_stack_dose_estimate']
    }
  ],
  potencyScaling: {
    referenceCompoundId: 'testosterone',
    mgPer100Equivalent: {
      measurement: {
        value: 154,
        unit: 'mg_testosterone_equivalent',
        normalizedTo: 'per_100mg',
        normalizedValue: 154
      },
      evidence: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 15914526;19589964',
        notes: 'Comparing 150 mg q2w nandrolone vs 200 mg/w testosterone lean mass deltas'
      },
      uncertainty: { kind: 'Range', lower: 130, upper: 175 }
    },
    context: 'Maps nandrolone mg to testosterone-equivalent stack load for scoring and guardrail rules.'
  },
  phenotypeVector: [
    {
      axis: 'Hypertrophy',
      score: {
        measurement: { value: 7.8, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier1_RCT',
          sourceType: 'RandomizedControlledTrial',
          citation: 'PMID: 15076791',
          notes: 'FFM +2.6 kg over 8 weeks in advanced bodybuilders'
        }
      }
    },
    {
      axis: 'NeuralDrive',
      score: {
        measurement: { value: 5.6, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier1_RCT',
          sourceType: 'RandomizedControlledTrial',
          citation: 'PMID: 15914526',
          notes: 'Improved muscle performance and perceived functional capacity vs placebo'
        }
      }
    },
    {
      axis: 'LipolysisEfficiency',
      score: {
        measurement: { value: 4.2, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier1_RCT',
          sourceType: 'RandomizedControlledTrial',
          citation: 'PMID: 15914526',
          notes: 'Compared with placebo, nandrolone produced small fat-mass reductions relative to lean accrual'
        }
      }
    },
    {
      axis: 'EnduranceCapacity',
      score: {
        measurement: { value: 4.8, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier3_Cohort',
          sourceType: 'ObservationalStudy',
          citation: 'PMID: 16825332',
          notes: 'Hemodialysis + exercise trial found improved 6MWT trends without significance'
        }
      }
    },
    {
      axis: 'GlycogenRetention',
      score: {
        measurement: { value: 6.1, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier1_RCT',
          sourceType: 'RandomizedControlledTrial',
          citation: 'PMID: 15914526',
          notes: 'Increases in intracellular water and body cell mass indicate improved glycogen-hydration coupling'
        }
      }
    }
  ],
  beneficialOutcomes: [
    {
      metric: {
        id: 'lean_mass_delta_nandrolone',
        domain: 'LeanMass',
        label: 'Δ Lean Mass',
        unit: 'kg',
        higherIsBetter: true,
        description: 'DXA or four-compartment lean tissue change over 8–12 week interventions'
      },
      model: 'Spline',
      plateau: { enforceNonDeclineAfterMgPerWeek: 300, slopeCeiling: 0.03 },
      anchors: [
        {
          exposureId: 'nandrolone_im_100_q2w_hiv_women',
          dose: { value: 50, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 50 },
          outcomeValue: {
            measurement: { value: 3.5, unit: 'kg' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 15767536',
              population: 'HIV-infected women with >5% weight loss'
            },
            uncertainty: { kind: 'SD', standardDeviation: 1.1 }
          }
        },
        {
          exposureId: 'nandrolone_im_150_q2w_hiv_men',
          dose: { value: 75, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 75 },
          outcomeValue: {
            measurement: { value: 1.6, unit: 'kg' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 15914526',
              population: 'HIV+ men, 12-week biweekly regimen'
            },
            uncertainty: { kind: 'SD', standardDeviation: 0.3 }
          }
        },
        {
          exposureId: 'nandrolone_im_200_qw_bodybuilder',
          dose: { value: 200, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 200 },
          outcomeValue: {
            measurement: { value: 2.6, unit: 'kg' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 15076791'
            },
            uncertainty: { kind: 'SD', standardDeviation: 0.9 }
          }
        }
      ],
      narrative: 'Catabolic populations respond disproportionately per mg, so guardrails enforce the Tren Rule plateau after 300 mg/w to prevent extrapolated runaway gains.'
    },
    {
      metric: {
        id: 'hemoglobin_delta_nandrolone',
        domain: 'Cardiometabolic',
        label: 'Δ Hemoglobin',
        unit: 'g/dL',
        higherIsBetter: true,
        description: 'Change in hemoglobin within refractory anemia care pathways'
      },
      model: 'Piecewise',
      anchors: [
        {
          exposureId: 'nandrolone_im_100_qw_hemodialysis',
          dose: { value: 100, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 100 },
          outcomeValue: {
            measurement: { value: 1.24, unit: 'g/dL' },
            evidence: {
              tier: 'Tier3_Cohort',
              sourceType: 'ObservationalStudy',
              citation: 'PMCID: PMC4531675',
              notes: 'Hgb 7.75→8.99 g/dL over 24 weeks without raising epoetin dose'
            },
            uncertainty: { kind: 'Range', lower: 0.8, upper: 1.8 }
          }
        }
      ],
      narrative: 'Adjunct nandrolone restores hemoglobin in low-responding dialysis patients but requires hematology guardrails once Hgb approaches 10–11 g/dL.'
    }
  ],
  riskOutcomes: [
    {
      metric: {
        id: 'hdl_suppression_nandrolone',
        domain: 'Cardiometabolic',
        label: 'HDL-C % Change',
        unit: 'percent',
        higherIsBetter: false,
        description: 'Relative percent change in HDL-C vs baseline '
      },
      model: 'Spline',
      anchors: [
        {
          exposureId: 'nandrolone_im_200_qw_bodybuilder',
          dose: { value: 200, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 200 },
          outcomeValue: {
            measurement: { value: -2, unit: 'percent' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 15155420',
              notes: 'Eight-week monotherapy showed no meaningful HDL change'
            },
            uncertainty: { kind: 'Range', lower: -8, upper: 4 }
          }
        },
        {
          exposureId: 'nandrolone_poly_stack_hartgens',
          dose: { value: 600, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 600 },
          outcomeValue: {
            measurement: { value: -60, unit: 'percent' },
            evidence: {
              tier: 'Tier3_Cohort',
              sourceType: 'ObservationalStudy',
              citation: 'PMID: 15155420',
              notes: 'Self-administered multi-AAS stack dropped HDL-C from 1.08→0.43 mmol/L'
            },
            uncertainty: { kind: 'Range', lower: -55, upper: -68 }
          }
        }
      ],
      narrative: 'Monotherapy at 200 mg/w looks benign, but stacking with 17-AA orals collapses HDL within 8 weeks.'
    },
    {
      metric: {
        id: 'apob_increase_nandrolone',
        domain: 'Cardiometabolic',
        label: 'Apo-B Change',
        unit: 'g/L',
        higherIsBetter: false
      },
      model: 'Piecewise',
      anchors: [
        {
          exposureId: 'nandrolone_poly_stack_hartgens',
          dose: { value: 600, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 600 },
          outcomeValue: {
            measurement: { value: 0.36, unit: 'g/L' },
            evidence: {
              tier: 'Tier3_Cohort',
              sourceType: 'ObservationalStudy',
              citation: 'PMID: 15155420',
              notes: 'Apo-B 0.96→1.32 g/L after 8–14 weeks'
            }
          }
        }
      ],
      narrative: 'Apo-B rise mirrors HDL collapse when nandrolone is layered on top of other supraphysiologic agents.'
    },
    {
      metric: {
        id: 'hematocrit_increase_nandrolone',
        domain: 'Cardiometabolic',
        label: 'Hematocrit Δ',
        unit: 'percentage_point',
        higherIsBetter: false
      },
      model: 'Piecewise',
      anchors: [
        {
          exposureId: 'nandrolone_im_100_qw_hemodialysis',
          dose: { value: 100, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 100 },
          outcomeValue: {
            measurement: { value: 3, unit: 'percentage_point' },
            evidence: {
              tier: 'Tier3_Cohort',
              sourceType: 'ObservationalStudy',
              citation: 'PMCID: PMC4531675',
              notes: 'Hct 23.68→26.66% average with higher boosts in women'
            },
            uncertainty: { kind: 'Range', lower: 2, upper: 4 }
          }
        }
      ],
      narrative: 'Erythrocytosis is therapeutically desired until Hct exceeds renal targets; beyond 32–34% the same curve becomes a red-flag.'
    }
  ],
  biomarkers: [
    {
      biomarker: 'Lipoprotein(a)',
      direction: 'Decrease',
      magnitude: {
        measurement: { value: -12.7, unit: 'mg/dL' },
        evidence: {
          tier: 'Tier3_Cohort',
          sourceType: 'ObservationalStudy',
          citation: 'PMID: 9100047',
          notes: 'Median Lp(a) 19.8→7.1 mg/dL over 6 months in hemodialysis'
        }
      },
      recoveryHalfLifeDays: {
        measurement: { value: 60, unit: 'days' },
        evidence: {
          tier: 'Tier3_Cohort',
          sourceType: 'ObservationalStudy',
          citation: 'PMID: 9100047',
          notes: 'Levels returned toward baseline within 4 months of discontinuation'
        }
      }
    },
    {
      biomarker: 'Apolipoprotein A1',
      direction: 'Decrease',
      magnitude: {
        measurement: { value: -0.7, unit: 'g/L' },
        evidence: {
          tier: 'Tier3_Cohort',
          sourceType: 'ObservationalStudy',
          citation: 'PMID: 15155420',
          notes: 'Apo-A1 1.41→0.71 g/L in self-administered stacks'
        }
      }
    },
    {
      biomarker: 'Apolipoprotein B',
      direction: 'Increase',
      magnitude: {
        measurement: { value: 0.36, unit: 'g/L' },
        evidence: {
          tier: 'Tier3_Cohort',
          sourceType: 'ObservationalStudy',
          citation: 'PMID: 15155420'
        }
      }
    }
  ],
  assumptionTags: [
    {
      id: 'nandrolone_steady_state_assumed',
      statement: 'Assumes steady-state decanoate exposure by week 4 despite sparse PK sampling.',
      severity: 'Medium',
      rationale: 'Clinical trials collected outcomes after ≥8 weeks but did not publish trough curves.',
      mitigation: 'UI warns when user cycle length is <4 weeks which invalidates steady-state assumptions.',
      evidenceGap: {
        tier: 'Tier4_CaseSeries',
        sourceType: 'PharmacokineticModel',
        citation: 'PMID: 16825332',
        notes: 'Dialysis RCT inferred steady exposure but did not publish trough curves.'
      }
    },
    {
      id: 'cachexia_context_dependence',
      statement: 'Lean-mass anchors are captured in HIV/cachexia cohorts with aggressive nutrition support.',
      severity: 'High',
      rationale: 'Catabolic amplification exaggerates mg-to-kg response compared to recreational athletes.',
      mitigation: 'Simulation store scales expected gains downward when user toggles to eucaloric context.',
      evidenceGap: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 15767536',
        notes: 'Need trials in eucaloric cis-female lifters for direct translation.'
      }
    },
    {
      id: 'epoetin_background',
      statement: 'Dialysis anemia improvements assume concomitant low-dose epoetin that remains unchanged.',
      severity: 'Medium',
      rationale: 'Most studies held epoetin constant; dose escalations would confound attribution.',
      mitigation: 'Guardrail requires user to log ESA dose so hematology model can apportion deltas.',
      evidenceGap: {
        tier: 'Tier3_Cohort',
        sourceType: 'ObservationalStudy',
        citation: 'PMCID: PMC4531675'
      }
    },
    {
      id: 'poly_stack_dose_estimate',
      statement: 'Poly-stack exposure normalizes disparate oral/injectable components into a 600 mg/w equivalent for modeling.',
      severity: 'High',
      rationale: 'Self-reported logs omit exact compound potency and frequency.',
      mitigation: 'Apply wide uncertainty bands and prompt user to enter actual stack composition for recalibration.',
      evidenceGap: {
        tier: 'Tier3_Cohort',
        sourceType: 'ObservationalStudy',
        citation: 'PMID: 15155420'
      }
    }
  ],
  auditTrail: {
    created: '2024-08-19',
    createdBy: 'ontology-team',
    lastReviewed: '2024-08-19',
    reviewers: ['clinical-sme', 'data-science'],
    changeNotes: 'Initial nandrolone entry spanning cachexia, dialysis, and recreational contexts.'
  }
};

const oxandroloneOntology: CompoundOntologyEntry = {
  id: 'oxandrolone',
  version: '0.1.0',
  aliases: ['oxa', 'var'],
  exposures: [
    {
      id: 'oxandrolone_po_0p1mgkg_bid',
      label: 'Oxandrolone 0.1 mg/kg PO q12h (acute burns)',
      route: 'Oral',
      formulation: 'OralC17aa',
      schedule: {
        dose: { value: 0.1, unit: 'mg/kg', normalizedTo: 'mg_per_kg_per_dose', normalizedValue: 0.1 },
        frequencyHours: 12,
        durationWeeks: 4,
        taperStrategy: 'Flat'
      },
      population: {
        sex: 'Mixed',
        ageRangeYears: [8, 18],
        trainingStatus: 'Untrained',
        bodyMassKg: {
          measurement: { value: 47, unit: 'kg' },
          evidence: {
            tier: 'Tier1_RCT',
            sourceType: 'RandomizedControlledTrial',
            citation: 'PMID: 17717439',
            population: 'Median mass burned pediatric cohort'
          },
          uncertainty: { kind: 'Range', lower: 33, upper: 62 }
        }
      },
      measurementWindow: {
        startHoursPostDose: 168,
        endHoursPostDose: 720,
        state: 'SteadyState'
      },
      coInterventions: ['Standard burn ICU bundle', 'High-protein enteral nutrition'],
      normalization: {
        mgPerWeek: 70
      },
      evidence: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 17717439',
        population: '>40% TBSA pediatric burns, n=45',
        notes: 'Weight-normalized; mg/week assumes 49 kg median'
      },
      assumptions: ['weight_adjusted_dosing']
    },
    {
      id: 'oxandrolone_po_20mg_burn',
      label: 'Oxandrolone 20 mg PO daily (adult burn ICU)',
      route: 'Oral',
      formulation: 'OralC17aa',
      schedule: {
        dose: { value: 20, unit: 'mg', normalizedTo: 'mg_per_day', normalizedValue: 20 },
        frequencyHours: 24,
        durationWeeks: 4,
        taperStrategy: 'Flat'
      },
      population: {
        sex: 'Mixed',
        ageRangeYears: [25, 55],
        trainingStatus: 'Untrained'
      },
      measurementWindow: {
        startHoursPostDose: 168,
        endHoursPostDose: 504,
        state: 'SteadyState'
      },
      coInterventions: ['Aggressive protein feeding', 'Silver sulfadiazine standard wound care'],
      normalization: {
        mgPerWeek: 140
      },
      evidence: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 10757193',
        population: 'n=20 adults with 40–70% TBSA burns'
      },
      assumptions: ['hypermetabolic_context']
    },
    {
      id: 'oxandrolone_po_20mg_hiv_pre',
      label: 'Oxandrolone 20 mg PO daily + PRE + TRT base',
      route: 'Oral',
      formulation: 'OralC17aa',
      schedule: {
        dose: { value: 20, unit: 'mg', normalizedTo: 'mg_per_day', normalizedValue: 20 },
        frequencyHours: 24,
        durationWeeks: 8,
        taperStrategy: 'Flat'
      },
      population: {
        sex: 'Male',
        ageRangeYears: [30, 50],
        trainingStatus: 'Recreational',
        bodyMassKg: {
          measurement: { value: 79, unit: 'kg' },
          evidence: {
            tier: 'Tier1_RCT',
            sourceType: 'RandomizedControlledTrial',
            citation: 'PMID: 10208143',
            population: 'HIV+ eugonadal men with >5% weight loss'
          }
        }
      },
      measurementWindow: {
        startHoursPostDose: 168,
        endHoursPostDose: 1344,
        state: 'SteadyState'
      },
      coInterventions: ['Progressive resistance exercise (3x/week supervised)', 'Testosterone enanthate 100 mg IM weekly'],
      normalization: {
        mgPerWeek: 140
      },
      evidence: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 10208143',
        population: 'n=22 completers, 8-week intervention'
      },
      assumptions: ['cointervention_required']
    }
  ],
  potencyScaling: {
    referenceCompoundId: 'testosterone',
    mgPer100Equivalent: {
      measurement: {
        value: 65,
        unit: 'mg_testosterone_equivalent',
        normalizedTo: 'per_100mg',
        normalizedValue: 65
      },
      evidence: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 10208143',
        notes: 'Lean mass delta relative to physiologic testosterone co-therapy'
      },
      uncertainty: { kind: 'Range', lower: 55, upper: 80 }
    },
    context: 'Maps oral oxandrolone mg to testosterone-equivalent load for stack scoring.'
  },
  phenotypeVector: [
    {
      axis: 'Hypertrophy',
      score: {
        measurement: { value: 7.1, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier1_RCT',
          sourceType: 'RandomizedControlledTrial',
          citation: 'PMID: 10208143'
        },
        uncertainty: { kind: 'Range', lower: 6.5, upper: 7.6 }
      }
    },
    {
      axis: 'NeuralDrive',
      score: {
        measurement: { value: 5.2, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier1_RCT',
          sourceType: 'RandomizedControlledTrial',
          citation: 'PMID: 10208143',
          notes: 'Upper/lower body strength gains with PRE + oxandrolone'
        }
      }
    },
    {
      axis: 'LipolysisEfficiency',
      score: {
        measurement: { value: 3.6, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier1_RCT',
          sourceType: 'RandomizedControlledTrial',
          citation: 'PMID: 17717439',
          notes: 'Reduced free fatty acid levels during acute burn catabolism'
        }
      }
    },
    {
      axis: 'EnduranceCapacity',
      score: {
        measurement: { value: 3.2, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier2_MetaAnalysis',
          sourceType: 'ObservationalStudy',
          citation: 'PMID: 15025546',
          notes: 'Review finds neutral/limited endurance effects'
        },
        caveats: ['Limited cardiopulmonary data outside cachexia models']
      }
    },
    {
      axis: 'GlycogenRetention',
      score: {
        measurement: { value: 4.8, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier4_CaseSeries',
          sourceType: 'ObservationalStudy',
          citation: 'PMID: 10443664',
          notes: '5-day nitrogen balance study showed improved amino acid reutilization'
        }
      }
    }
  ],
  beneficialOutcomes: [
    {
      metric: {
        id: 'lean_mass_delta_oxandrolone',
        domain: 'LeanMass',
        label: 'Δ Lean Mass',
        unit: 'kg',
        higherIsBetter: true,
        description: 'DXA or DEXA-derived total lean tissue change over intervention window'
      },
      model: 'Hill',
      anchors: [
        {
          exposureId: 'oxandrolone_po_0p1mgkg_bid',
          dose: { value: 70, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 70 },
          outcomeValue: {
            measurement: { value: 0.38, unit: 'kg' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 35582088',
              population: 'n=14 severe burn adults, 14-day ΔeLBM'
            },
            uncertainty: { kind: 'SD', standardDeviation: 1.64 }
          }
        },
        {
          exposureId: 'oxandrolone_po_20mg_hiv_pre',
          dose: { value: 140, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 140 },
          outcomeValue: {
            measurement: { value: 6.9, unit: 'kg' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 10208143',
              population: 'HIV-associated weight loss, 8-week PRE + TRT background'
            },
            uncertainty: { kind: 'SD', standardDeviation: 1.7 }
          }
        }
      ],
      plateau: { enforceNonDeclineAfterMgPerWeek: 210, slopeCeiling: 0.04 },
      narrative: 'Weight-normalized burn data show preservation near replacement dosing; supraphysiologic oral dosing plus PRE drives large accrual but saturates quickly due to hepatic strain and caloric ceilings.'
    }
  ],
  riskOutcomes: [
    {
      metric: {
        id: 'hdl_suppression_oxandrolone',
        domain: 'Cardiometabolic',
        label: 'HDL-C Change',
        unit: 'mg/dL',
        higherIsBetter: false,
        description: 'Absolute change from baseline fasting HDL-C'
      },
      model: 'Piecewise',
      anchors: [
        {
          exposureId: 'oxandrolone_po_20mg_hiv_pre',
          dose: { value: 140, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 140 },
          outcomeValue: {
            measurement: { value: -9.8, unit: 'mg/dL' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 10208143',
              notes: 'Significant HDL depression relative to placebo arm'
            },
            uncertainty: { kind: 'SD', standardDeviation: 5.4 }
          }
        }
      ],
      narrative: 'HDL suppression manifested within 8 weeks even with supervised nutrition; reinforce lipid monitoring for any oral cycle beyond 4 weeks.'
    },
    {
      metric: {
        id: 'liver_enzyme_shift',
        domain: 'Hepatic',
        label: 'AST/ALT Shift',
        unit: 'fold_change',
        higherIsBetter: false,
        description: 'Fold-change vs baseline for transaminases'
      },
      model: 'Spline',
      anchors: [
        {
          exposureId: 'oxandrolone_po_0p1mgkg_bid',
          dose: { value: 70, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 70 },
          outcomeValue: {
            measurement: { value: 1.35, unit: 'fold_change' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 17717439',
              notes: 'Approximate peak AST/ALT elevation (~35%) at day 17–22'
            },
            uncertainty: { kind: 'Range', lower: 1.2, upper: 1.5 }
          }
        },
        {
          exposureId: 'oxandrolone_po_20mg_burn',
          dose: { value: 140, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 140 },
          outcomeValue: {
            measurement: { value: 1.1, unit: 'fold_change' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 10757193',
              notes: 'No major hepatotoxicity observed; mild lab drift only'
            },
            uncertainty: { kind: 'Range', lower: 1, upper: 1.2 }
          }
        }
      ],
      narrative: 'Transaminases climb within 2–3 weeks in weight-normalized pediatric protocols; adult ICU regimen showed milder shifts but still mandates monitoring.'
    }
  ],
  dynamics: {
    onsetHours: {
      measurement: { value: 120, unit: 'hours' },
      evidence: {
        tier: 'Tier4_CaseSeries',
        sourceType: 'ObservationalStudy',
        citation: 'PMID: 10443664',
        notes: 'Net protein synthesis improvements detectable after 5 days of 15 mg/day'
      }
    },
    steadyStateDays: {
      measurement: { value: 10, unit: 'days' },
      evidence: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 35582088',
        notes: 'Lean body mass separation stabilized by week 2'
      }
    }
  },
  assumptionTags: [
    {
      id: 'weight_adjusted_dosing',
      statement: 'Dose-response curves assume 0.1 mg/kg q12h titration for burn patients; mg/week normalization uses 49 kg median.',
      severity: 'Medium',
      rationale: 'Actual mg per week scales with body mass and clinical teams titrate dynamically.',
      mitigation: 'Expose UI control for patient mass to recompute mg/week before curve lookup.',
      evidenceGap: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 17717439',
        notes: 'Individual-level dosing table not published.'
      }
    },
    {
      id: 'cointervention_required',
      statement: 'Strength hypertrophy anchor includes supervised resistance exercise plus baseline TRT.',
      severity: 'Medium',
      rationale: 'Removing PRE or testosterone co-therapy will blunt gains.',
      mitigation: 'Flag stacks lacking supportive training/TRT and scale down expected deltas.',
      evidenceGap: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 10208143',
        notes: 'No oxandrolone-only arm with identical training load.'
      }
    },
    {
      id: 'hypermetabolic_context',
      statement: 'Adult burn data captured during high catecholamine drive; eucaloric athletes may see smaller nitrogen effects.',
      severity: 'High',
      rationale: 'Hypermetabolic stress augments anabolic responsiveness.',
      mitigation: 'Downscale benefit curves when user scenario lacks catabolic stressors.',
      evidenceGap: {
        tier: 'Tier2_MetaAnalysis',
        sourceType: 'ObservationalStudy',
        citation: 'PMID: 15025546'
      }
    },
    {
      id: 'hepatic_monitoring',
      statement: 'Transaminase elevations are assumed reversible with monitoring and dose adjustments.',
      severity: 'High',
      rationale: 'Pediatric trial showed ~35% AST/ALT rise by week 3.',
      mitigation: 'Warn users if planned cycle exceeds 4 weeks without liver panel entries.',
      evidenceGap: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 17717439'
      }
    }
  ],
  auditTrail: {
    created: '2024-08-12',
    createdBy: 'ontology-team',
    lastReviewed: '2024-08-12',
    reviewers: ['clinical-sme'],
    changeNotes: 'Added oxandrolone entry with burn ICU and HIV cachexia anchors.'
  }
};

const anadrolOntology: CompoundOntologyEntry = {
  id: 'anadrol',
  version: '0.1.0',
  aliases: ['oxymetholone', 'a50', 'anadrol-50'],
  exposures: [
    {
      id: 'oxymetholone_po_50mg_bid_hiv',
      label: 'Oxymetholone 50 mg PO twice daily (HIV wasting)',
      route: 'Oral',
      formulation: 'OralC17aa',
      schedule: {
        dose: { value: 50, unit: 'mg', normalizedTo: 'mg_per_dose', normalizedValue: 50 },
        frequencyHours: 12,
        durationWeeks: 16,
        taperStrategy: 'Flat'
      },
      population: {
        sex: 'Mixed',
        ageRangeYears: [28, 52],
        trainingStatus: 'Untrained',
        bodyMassKg: {
          measurement: { value: 67, unit: 'kg' },
          evidence: {
            tier: 'Tier1_RCT',
            sourceType: 'RandomizedControlledTrial',
            citation: 'PMID: 12646793',
            population: 'HIV+ eugonadal adults with >5% weight loss'
          }
        }
      },
      measurementWindow: {
        startHoursPostDose: 0,
        endHoursPostDose: 2688,
        state: 'SteadyState'
      },
      coInterventions: ['Stable HAART background', 'Dietitian-directed protein repletion'],
      normalization: {
        mgPerWeek: 700
      },
      evidence: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 12646793',
        population: 'n=89 randomized to oxymetholone or placebo for 16 weeks'
      },
      assumptions: ['haart_background_required', 'hepatic_monitoring_17aa']
    },
    {
      id: 'oxymetholone_po_50mg_tid_hiv',
      label: 'Oxymetholone 50 mg PO three times daily (HIV wasting high dose)',
      route: 'Oral',
      formulation: 'OralC17aa',
      schedule: {
        dose: { value: 50, unit: 'mg', normalizedTo: 'mg_per_dose', normalizedValue: 50 },
        frequencyHours: 8,
        durationWeeks: 16,
        taperStrategy: 'Flat'
      },
      population: {
        sex: 'Mixed',
        ageRangeYears: [28, 52],
        trainingStatus: 'Untrained'
      },
      measurementWindow: {
        startHoursPostDose: 0,
        endHoursPostDose: 2688,
        state: 'SteadyState'
      },
      coInterventions: ['Stable HAART background'],
      normalization: {
        mgPerWeek: 1050
      },
      evidence: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 12646793'
      },
      assumptions: ['haart_background_required', 'hepatic_monitoring_17aa']
    },
    {
      id: 'oxymetholone_po_50mg_tid_cachexia',
      label: 'Oxymetholone 50 mg PO three times daily (30-week cachexia pilot)',
      route: 'Oral',
      formulation: 'OralC17aa',
      schedule: {
        dose: { value: 50, unit: 'mg', normalizedTo: 'mg_per_dose', normalizedValue: 50 },
        frequencyHours: 8,
        durationWeeks: 30,
        taperStrategy: 'Flat'
      },
      population: {
        sex: 'Mixed',
        ageRangeYears: [25, 55],
        trainingStatus: 'Untrained'
      },
      measurementWindow: {
        startHoursPostDose: 0,
        endHoursPostDose: 5040,
        state: 'SteadyState'
      },
      coInterventions: ['Optional ketotifen (TNF-α modulator)'],
      normalization: {
        mgPerWeek: 1050
      },
      evidence: {
        tier: 'Tier2_MetaAnalysis',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 8785183',
        notes: 'Prospective pilot with matched untreated controls'
      },
      assumptions: ['ketotifen_combo_uncertainty', 'hepatic_monitoring_17aa']
    },
    {
      id: 'oxymetholone_po_50mg_bid_hd',
      label: 'Oxymetholone 50 mg PO twice daily (maintenance hemodialysis)',
      route: 'Oral',
      formulation: 'OralC17aa',
      schedule: {
        dose: { value: 50, unit: 'mg', normalizedTo: 'mg_per_dose', normalizedValue: 50 },
        frequencyHours: 12,
        durationWeeks: 24,
        taperStrategy: 'Flat'
      },
      population: {
        sex: 'Mixed',
        ageRangeYears: [30, 55],
        trainingStatus: 'Untrained'
      },
      measurementWindow: {
        startHoursPostDose: 0,
        endHoursPostDose: 4032,
        state: 'SteadyState'
      },
      coInterventions: ['Thrice-weekly hemodialysis', 'No structured resistance training'],
      normalization: {
        mgPerWeek: 700
      },
      evidence: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 23124786',
        population: 'n=43 randomized, double-blind 24-week trial'
      },
      assumptions: ['renal_catabolic_magnifier', 'hepatic_monitoring_17aa']
    },
    {
      id: 'oxymetholone_po_50mg_bid_capd',
      label: 'Oxymetholone 50 mg PO twice daily + rHuEPO (CAPD)',
      route: 'Oral',
      formulation: 'OralC17aa',
      schedule: {
        dose: { value: 50, unit: 'mg', normalizedTo: 'mg_per_dose', normalizedValue: 50 },
        frequencyHours: 12,
        durationWeeks: 24,
        taperStrategy: 'Flat'
      },
      population: {
        sex: 'Mixed',
        ageRangeYears: [32, 65],
        trainingStatus: 'Untrained'
      },
      measurementWindow: {
        startHoursPostDose: 0,
        endHoursPostDose: 4032,
        state: 'SteadyState'
      },
      coInterventions: ['Stable rHuEPO regimen', 'Continuous ambulatory peritoneal dialysis'],
      normalization: {
        mgPerWeek: 700
      },
      evidence: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 21084036'
      },
      assumptions: ['renal_catabolic_magnifier', 'hepatic_monitoring_17aa']
    },
    {
      id: 'oxymetholone_po_50mg_qd_seniors',
      label: 'Oxymetholone 50 mg PO daily (older men)',
      route: 'Oral',
      formulation: 'OralC17aa',
      schedule: {
        dose: { value: 50, unit: 'mg', normalizedTo: 'mg_per_day', normalizedValue: 50 },
        frequencyHours: 24,
        durationWeeks: 12,
        taperStrategy: 'Flat'
      },
      population: {
        sex: 'Male',
        ageRangeYears: [65, 80],
        trainingStatus: 'Recreational'
      },
      measurementWindow: {
        startHoursPostDose: 0,
        endHoursPostDose: 2016,
        state: 'SteadyState'
      },
      coInterventions: ['Light habitual activity only'],
      normalization: {
        mgPerWeek: 350
      },
      evidence: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 12388137'
      },
      assumptions: ['geriatric_untrained_population', 'hepatic_monitoring_17aa']
    },
    {
      id: 'oxymetholone_po_100mg_qd_seniors',
      label: 'Oxymetholone 100 mg PO daily (older men high dose)',
      route: 'Oral',
      formulation: 'OralC17aa',
      schedule: {
        dose: { value: 100, unit: 'mg', normalizedTo: 'mg_per_day', normalizedValue: 100 },
        frequencyHours: 24,
        durationWeeks: 12,
        taperStrategy: 'Flat'
      },
      population: {
        sex: 'Male',
        ageRangeYears: [65, 80],
        trainingStatus: 'Recreational'
      },
      measurementWindow: {
        startHoursPostDose: 0,
        endHoursPostDose: 2016,
        state: 'SteadyState'
      },
      coInterventions: ['Light habitual activity only'],
      normalization: {
        mgPerWeek: 700
      },
      evidence: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 12388137'
      },
      assumptions: ['geriatric_untrained_population', 'hepatic_monitoring_17aa']
    }
  ],
  potencyScaling: {
    referenceCompoundId: 'testosterone',
    mgPer100Equivalent: {
      measurement: {
        value: 135,
        unit: 'mg_testosterone_equivalent',
        normalizedTo: 'per_100mg',
        normalizedValue: 135
      },
      evidence: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 12388137;12646793',
        notes: '100 mg/day yielded ~4.2 kg LBM, comparable to 500–600 mg/week testosterone data.'
      },
      uncertainty: { kind: 'Range', lower: 110, upper: 160 }
    },
    context: 'Maps oral oxymetholone milligrams to testosterone-equivalent stack load for suppression and toxicity scoring.'
  },
  phenotypeVector: [
    {
      axis: 'Hypertrophy',
      score: {
        measurement: { value: 8.8, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier1_RCT',
          sourceType: 'RandomizedControlledTrial',
          citation: 'PMID: 12388137'
        },
        uncertainty: { kind: 'Range', lower: 8.0, upper: 9.2 }
      }
    },
    {
      axis: 'NeuralDrive',
      score: {
        measurement: { value: 6.2, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier1_RCT',
          sourceType: 'RandomizedControlledTrial',
          citation: 'PMID: 12388137',
          notes: '1-RM strength gains 9–18% without formal training.'
        }
      }
    },
    {
      axis: 'LipolysisEfficiency',
      score: {
        measurement: { value: 5.6, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier1_RCT',
          sourceType: 'RandomizedControlledTrial',
          citation: 'PMID: 12388137',
          notes: 'Trunk fat decreased 1.7–2.2 kg despite hypercaloric support.'
        }
      }
    },
    {
      axis: 'EnduranceCapacity',
      score: {
        measurement: { value: 4.1, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier3_Cohort',
          sourceType: 'ObservationalStudy',
          citation: 'PMID: 21084036',
          notes: 'Improved subjective global assessment but limited cardiopulmonary data.'
        },
        caveats: ['Hematocrit rise may backfire in uncontrolled hypertension.']
      }
    },
    {
      axis: 'GlycogenRetention',
      score: {
        measurement: { value: 7.4, unit: 'score_0_10' },
        evidence: {
          tier: 'Tier1_RCT',
          sourceType: 'RandomizedControlledTrial',
          citation: 'PMID: 23124786',
          notes: 'DEXA-derived fat-free mass increase with concurrent fat loss suggests strong intracellular water storage.'
        }
      }
    }
  ],
  beneficialOutcomes: [
    {
      metric: {
        id: 'lean_mass_delta_anadrol',
        domain: 'LeanMass',
        label: 'Δ Lean Mass',
        unit: 'kg',
        higherIsBetter: true,
        description: 'DXA or BCM-derived lean tissue change during 12–30 week oral oxymetholone protocols.'
      },
      model: 'Hill',
      plateau: { enforceNonDeclineAfterMgPerWeek: 1050, slopeCeiling: 0.02 },
      anchors: [
        {
          exposureId: 'oxymetholone_po_50mg_bid_hiv',
          dose: { value: 700, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 700 },
          outcomeValue: {
            measurement: { value: 3.8, unit: 'kg' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 12646793',
              population: 'Body cell mass +12.4% (3.8 ±0.4 kg) with 50 mg BID.'
            },
            uncertainty: { kind: 'SD', standardDeviation: 0.4 }
          }
        },
        {
          exposureId: 'oxymetholone_po_50mg_tid_hiv',
          dose: { value: 1050, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 1050 },
          outcomeValue: {
            measurement: { value: 2.1, unit: 'kg' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 12646793',
              notes: 'Body cell mass +2.1 ±0.6 kg; higher dose constrained by hepatic toxicity.'
            }
          }
        },
        {
          exposureId: 'oxymetholone_po_50mg_bid_hd',
          dose: { value: 700, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 700 },
          outcomeValue: {
            measurement: { value: 3.2, unit: 'kg' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 23124786',
              notes: 'Fat-free mass +3.2 ±1.7 kg after 24 weeks in MHD patients.'
            },
            uncertainty: { kind: 'SD', standardDeviation: 1.7 }
          }
        },
        {
          exposureId: 'oxymetholone_po_100mg_qd_seniors',
          dose: { value: 700, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 700 },
          outcomeValue: {
            measurement: { value: 4.2, unit: 'kg' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 12388137'
            },
            uncertainty: { kind: 'SD', standardDeviation: 2.4 }
          }
        },
        {
          exposureId: 'oxymetholone_po_50mg_tid_cachexia',
          dose: { value: 1050, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 1050 },
          outcomeValue: {
            measurement: { value: 8.2, unit: 'kg' },
            evidence: {
              tier: 'Tier2_MetaAnalysis',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 8785183',
              notes: '30-week pilot reported +8.2 ±6.2 kg weight with majority lean accrual.'
            },
            uncertainty: { kind: 'SD', standardDeviation: 6.2 }
          }
        }
      ],
      narrative: 'Lean mass response is dramatic in catabolic states but constrained by hepatic tolerance; plateau slope caps guard against unrealistic extrapolation beyond 150 mg/day.'
    },
    {
      metric: {
        id: 'strength_percent_delta_anadrol',
        domain: 'Strength',
        label: 'Δ Strength (% change)',
        unit: 'percent',
        higherIsBetter: true,
        description: 'Composite of 1-RM upper body and handgrip changes.'
      },
      model: 'Spline',
      anchors: [
        {
          exposureId: 'oxymetholone_po_50mg_qd_seniors',
          dose: { value: 350, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 350 },
          outcomeValue: {
            measurement: { value: 8.8, unit: 'percent' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 12388137',
              notes: 'Lat pull-down 1-RM improved 8.8% at 50 mg/day.'
            }
          }
        },
        {
          exposureId: 'oxymetholone_po_100mg_qd_seniors',
          dose: { value: 700, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 700 },
          outcomeValue: {
            measurement: { value: 18.4, unit: 'percent' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 12388137',
              notes: 'Lat pull-down 1-RM increased 18.4 ±21.0% at 100 mg/day.'
            },
            uncertainty: { kind: 'SD', standardDeviation: 21.0 }
          }
        },
        {
          exposureId: 'oxymetholone_po_50mg_bid_hd',
          dose: { value: 700, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 700 },
          outcomeValue: {
            measurement: { value: 9, unit: 'percent' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 23124786',
              notes: 'Handgrip +2.3 kg on 26.3 kg baseline (~8.7%).'
            },
            uncertainty: { kind: 'Range', lower: 4, upper: 12 }
          }
        }
      ],
      narrative: 'Neural drive improves without formal training, but frailty and dialysis status modulate observable strength gains.'
    },
    {
      metric: {
        id: 'hemoglobin_delta_anadrol',
        domain: 'Cardiometabolic',
        label: 'Δ Hemoglobin',
        unit: 'g/dL',
        higherIsBetter: true,
        description: 'Change in hemoglobin during ESA-sparing renal protocols.'
      },
      model: 'Piecewise',
      anchors: [
        {
          exposureId: 'oxymetholone_po_50mg_bid_capd',
          dose: { value: 700, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 700 },
          outcomeValue: {
            measurement: { value: 1.9, unit: 'g/dL' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 21084036',
              notes: 'Hemoglobin 12.9 ±0.3 g/dL vs 11.0 ±0.3 in placebo after 24 weeks.'
            },
            uncertainty: { kind: 'Range', lower: 1.2, upper: 2.2 }
          }
        },
        {
          exposureId: 'oxymetholone_po_50mg_bid_hd',
          dose: { value: 700, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 700 },
          outcomeValue: {
            measurement: { value: 0.1, unit: 'g/dL' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 23124786',
              notes: 'No significant Hb rise without ESA changes.'
            }
          }
        }
      ],
      narrative: 'Erythropoietic boost is substantial when rHuEPO is co-administered; absent ESA support gains are minimal.'
    }
  ],
  riskOutcomes: [
    {
      metric: {
        id: 'alt_multiple_anadrol',
        domain: 'Hepatic',
        label: 'ALT Multiple of ULN',
        unit: 'fold_change',
        higherIsBetter: false,
        description: 'Average peak ALT elevation relative to baseline upper limit of normal.'
      },
      model: 'Spline',
      anchors: [
        {
          exposureId: 'oxymetholone_po_50mg_bid_hiv',
          dose: { value: 700, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 700 },
          outcomeValue: {
            measurement: { value: 5.0, unit: 'fold_change' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 12646793',
              notes: '27% exceeded 5× baseline ALT at 100 mg/day.'
            },
            caveats: ['Discontinuation recommended once >5× ULN is sustained.']
          }
        },
        {
          exposureId: 'oxymetholone_po_50mg_tid_hiv',
          dose: { value: 1050, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 1050 },
          outcomeValue: {
            measurement: { value: 5.5, unit: 'fold_change' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 12646793',
              notes: '35% experienced >5× ALT elevation at 150 mg/day.'
            }
          }
        },
        {
          exposureId: 'oxymetholone_po_50mg_bid_hd',
          dose: { value: 700, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 700 },
          outcomeValue: {
            measurement: { value: 4.8, unit: 'fold_change' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 23124786',
              notes: 'ALT rose from 14.6 to 70.1 U/L (+55.5 U/L).' }
          }
        },
        {
          exposureId: 'oxymetholone_po_100mg_qd_seniors',
          dose: { value: 700, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 700 },
          outcomeValue: {
            measurement: { value: 5.9, unit: 'fold_change' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 12388137',
              notes: 'ALT +72 ±67 U/L at 100 mg/day.'
            },
            uncertainty: { kind: 'SD', standardDeviation: 1.2 }
          }
        }
      ],
      narrative: 'ALT excursions trend upward with dose and duration; plateau enforces acknowledgement that hepatotoxicity risk quickly eclipses benefit above 150 mg/day.'
    },
    {
      metric: {
        id: 'hdl_suppression_anadrol',
        domain: 'Cardiometabolic',
        label: 'HDL-C Change',
        unit: 'mg/dL',
        higherIsBetter: false,
        description: 'Absolute reduction in fasting HDL-C.'
      },
      model: 'Hill',
      anchors: [
        {
          exposureId: 'oxymetholone_po_50mg_qd_seniors',
          dose: { value: 350, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 350 },
          outcomeValue: {
            measurement: { value: -19, unit: 'mg/dL' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 12388137'
            },
            uncertainty: { kind: 'SD', standardDeviation: 9 }
          }
        },
        {
          exposureId: 'oxymetholone_po_100mg_qd_seniors',
          dose: { value: 700, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 700 },
          outcomeValue: {
            measurement: { value: -23, unit: 'mg/dL' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 12388137'
            },
            uncertainty: { kind: 'SD', standardDeviation: 18 }
          }
        }
      ],
      narrative: 'HDL suppression manifests rapidly even at 50 mg/day; older men data used as a conservative baseline for broader populations.'
    },
    {
      metric: {
        id: 'hematocrit_overshoot_anadrol',
        domain: 'Cardiometabolic',
        label: 'Hematocrit Change',
        unit: 'percentage_point',
        higherIsBetter: false,
        description: 'Rise in hematocrit relative to dialysis targets.'
      },
      model: 'Piecewise',
      anchors: [
        {
          exposureId: 'oxymetholone_po_50mg_bid_capd',
          dose: { value: 700, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 700 },
          outcomeValue: {
            measurement: { value: 5.3, unit: 'percentage_point' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 21084036',
              notes: 'Hematocrit 32.8 → 38.1% under rHuEPO + oxymetholone.'
            }
          }
        },
        {
          exposureId: 'oxymetholone_po_50mg_bid_hd',
          dose: { value: 700, unit: 'mg/week', normalizedTo: 'mg_per_week', normalizedValue: 700 },
          outcomeValue: {
            measurement: { value: 0.1, unit: 'percentage_point' },
            evidence: {
              tier: 'Tier1_RCT',
              sourceType: 'RandomizedControlledTrial',
              citation: 'PMID: 23124786'
            }
          }
        }
      ],
      narrative: 'Hematocrit overshoot is desirable until renal programs hit 38–40%; beyond that the same curve is downgraded to risk due to viscosity load.'
    }
  ],
  biomarkers: [
    {
      biomarker: 'ALT',
      direction: 'Increase',
      magnitude: {
        measurement: { value: 55.5, unit: 'U/L' },
        evidence: {
          tier: 'Tier1_RCT',
          sourceType: 'RandomizedControlledTrial',
          citation: 'PMID: 23124786'
        }
      },
      recoveryHalfLifeDays: {
        measurement: { value: 14, unit: 'days' },
        evidence: {
          tier: 'Tier1_RCT',
          sourceType: 'RandomizedControlledTrial',
          citation: 'PMID: 23124786',
          notes: 'Enzymes normalized within one month off drug.'
        }
      }
    },
    {
      biomarker: 'HDL-C',
      direction: 'Decrease',
      magnitude: {
        measurement: { value: -23, unit: 'mg/dL' },
        evidence: {
          tier: 'Tier1_RCT',
          sourceType: 'RandomizedControlledTrial',
          citation: 'PMID: 12388137'
        }
      },
      recoveryHalfLifeDays: {
        measurement: { value: 21, unit: 'days' },
        evidence: {
          tier: 'Tier4_CaseSeries',
          sourceType: 'ObservationalStudy',
          notes: 'HDL typically rebounds within 3 weeks of cessation in clinical logs.'
        }
      }
    },
    {
      biomarker: 'Hemoglobin',
      direction: 'Increase',
      magnitude: {
        measurement: { value: 1.9, unit: 'g/dL' },
        evidence: {
          tier: 'Tier1_RCT',
          sourceType: 'RandomizedControlledTrial',
          citation: 'PMID: 21084036'
        }
      }
    }
  ],
  dynamics: {
    onsetHours: {
      measurement: { value: 120, unit: 'hours' },
      evidence: {
        tier: 'Tier2_MetaAnalysis',
        sourceType: 'ObservationalStudy',
        notes: 'Clinical reports note appetite and strength changes by week 1.'
      }
    },
    steadyStateDays: {
      measurement: { value: 10, unit: 'days' },
      evidence: {
        tier: 'Tier1_RCT',
        sourceType: 'PharmacokineticModel',
        citation: 'PMID: 12388137',
        notes: 'Serum levels plateau by day 10 with BID or TID dosing.'
      }
    },
    washoutDays: {
      measurement: { value: 14, unit: 'days' },
      evidence: {
        tier: 'Tier4_CaseSeries',
        sourceType: 'ObservationalStudy'
      }
    },
    accumulationIndex: {
      measurement: { value: 1.2, unit: 'ratio' },
      evidence: {
        tier: 'Tier3_Cohort',
        sourceType: 'ObservationalStudy',
        notes: 'C17aa oral exhibits modest accumulation over daily dosing windows.'
      }
    }
  },
  assumptionTags: [
    {
      id: 'haart_background_required',
      statement: 'HIV wasting benefits presume HAART stability and supervised nutrition.',
      severity: 'High',
      rationale: 'Oxymetholone trials excluded uncontrolled viremia; benefits diminish if antiretroviral suppression fails.',
      mitigation: 'Warn users when HIV regimen toggles off HAART; downscale lean mass gains accordingly.',
      evidenceGap: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 12646793'
      }
    },
    {
      id: 'renal_catabolic_magnifier',
      statement: 'Dialysis cohorts experience amplified anabolic response relative to eucaloric lifters.',
      severity: 'Medium',
      rationale: 'MHD and CAPD subjects were protein-malnourished and on ESA support.',
      mitigation: 'Simulation store scales anabolic predictions downward when renal failure is not selected.',
      evidenceGap: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 23124786'
      }
    },
    {
      id: 'hepatic_monitoring_17aa',
      statement: 'Requires serial liver panel monitoring with immediate cessation if ALT >3× ULN.',
      severity: 'High',
      rationale: 'C17α-alkylation drove >5× ALT elevations in 27–35% of participants within 16 weeks.',
      mitigation: 'UI enforces liver panel logging before modeling cycles longer than 4 weeks.',
      evidenceGap: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 12646793'
      }
    },
    {
      id: 'ketotifen_combo_uncertainty',
      statement: 'Ketotifen co-therapy confounds attribution of the 30-week weight gain pilot.',
      severity: 'Medium',
      rationale: 'TNF-α modulation may have independently improved appetite.',
      mitigation: 'Apply wide CI on long-duration cachexia exposure and prompt user to confirm ancillary meds.',
      evidenceGap: {
        tier: 'Tier2_MetaAnalysis',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 8785183'
      }
    },
    {
      id: 'geriatric_untrained_population',
      statement: 'Older-men data collected without resistance training, so neuromuscular gains may be underestimated for athletes.',
      severity: 'Low',
      rationale: 'Study protocol prohibited new exercise regimens.',
      mitigation: 'Allow user to layer PRE multipliers; maintain conservative baseline until training stimulus is logged.',
      evidenceGap: {
        tier: 'Tier1_RCT',
        sourceType: 'RandomizedControlledTrial',
        citation: 'PMID: 12388137'
      }
    }
  ],
  auditTrail: {
    created: '2024-08-23',
    createdBy: 'ontology-team',
    lastReviewed: '2024-08-23',
    reviewers: ['clinical-sme', 'data-science'],
    changeNotes: 'Initial oxymetholone/anadrol ontology spanning HIV, renal cachexia, and geriatric cohorts.'
  }
};

export const COMPOUND_ONTOLOGY: Record<string, CompoundOntologyEntry> = {
  testosterone: testosteroneOntology,
  trenbolone: trenboloneOntology,
  nandrolone: nandroloneOntology,
  oxandrolone: oxandroloneOntology,
  anadrol: anadrolOntology
};

export type CompoundOntologyRegistry = typeof COMPOUND_ONTOLOGY;

export interface OntologyVectorSummary {
  hypertrophy: number;
  neural: number;
  lipolysis: number;
  endurance: number;
  glycogen: number;
}

export function deriveLegacyVectors(entry: CompoundOntologyEntry): OntologyVectorSummary {
  const summary: OntologyVectorSummary = {
    hypertrophy: 0,
    neural: 0,
    lipolysis: 0,
    endurance: 0,
    glycogen: 0
  };

  entry.phenotypeVector.forEach(component => {
    const value = component.score.measurement.value;
    switch (component.axis) {
      case 'Hypertrophy':
        summary.hypertrophy = value;
        break;
      case 'NeuralDrive':
        summary.neural = value;
        break;
      case 'LipolysisEfficiency':
        summary.lipolysis = value;
        break;
      case 'EnduranceCapacity':
        summary.endurance = value;
        break;
      case 'GlycogenRetention':
        summary.glycogen = value;
        break;
      default:
        break;
    }
  });

  return summary;
}

export { generateAutoOntologyEntries } from './compoundOntology.auto';
