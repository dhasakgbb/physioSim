export const interactionDimensions = {
  anabolic: {
    label: 'Lean Mass',
    type: 'benefit',
    color: '#0EA5E9',
    description: 'Pure anabolic synergy, net muscle accrual rate.'
  },
  vascularity: {
    label: 'Vascularity / Cosmetic',
    type: 'benefit',
    color: '#14B8A6',
    description: 'Dryness, vascularity, stage-ready look.'
  },
  strength: {
    label: 'Strength Output',
    type: 'benefit',
    color: '#6366F1',
    description: 'Neural drive + glycogen leverage.'
  },
  joint: {
    label: 'Joint Comfort',
    type: 'benefit',
    color: '#10B981',
    description: 'Synovial relief, soft tissue padding.'
  },
  bp: {
    label: 'Blood Pressure / Cardio',
    type: 'risk',
    color: '#FB923C',
    description: 'Systemic blood pressure, cardiac strain.'
  },
  hematocrit: {
    label: 'Hematocrit / RBC',
    type: 'risk',
    color: '#FACC15',
    description: 'HCT elevation, blood viscosity.'
  },
  bloat: {
    label: 'Estrogenic / Bloat',
    type: 'risk',
    color: '#F97316',
    description: 'Water retention, comfort, visual softness.'
  },
  neuro: {
    label: 'Neuro / Psychological',
    type: 'risk',
    color: '#F472B6',
    description: 'Anxiety, insomnia, aggression.'
  },
  estrogenic: {
    label: 'Estrogen Deficit',
    type: 'risk',
    color: '#EC4899',
    description: 'Too-low E2, libido, joint pain.'
  },
  hepatic: {
    label: 'Hepatic / Lipids',
    type: 'risk',
    color: '#EF4444',
    description: 'Liver enzymes, HDL/LDL destruction.'
  }
};

export const interactionHeatmapModes = [
  { key: 'benefit', label: 'Benefit Focus', description: 'Highlights strong positive synergies.' },
  { key: 'risk', label: 'Risk Focus', description: 'Highlights penalty-heavy stacks.' },
  { key: 'volatility', label: 'Volatility', description: 'Large swings (good or bad) show up hot.' }
];

export const defaultSensitivities = {
  estrogen: 1,
  water: 1,
  neuro: 1,
  cardio: 1
};

export const stackOptimizerCombos = [
  {
    id: 'lean_mass_triple',
    label: 'Lean Mass / Vascularity',
    narrative: 'Classic lean mass cruise with dryness by layering Mast onto Test+EQ.',
    compounds: ['testosterone', 'eq', 'masteron'],
    defaultDoses: { testosterone: 450, eq: 600, masteron: 350 },
    doseRanges: {
      testosterone: [200, 900],
      eq: [300, 900],
      masteron: [200, 500]
    },
    steps: 3,
    goal: 'lean_mass'
  },
  {
    id: 'recomp_tren_stack',
    label: 'Aggressive Recomp',
    narrative: 'High-androgen recomposition: Test base with Tren aggression and Mast dryness.',
    compounds: ['testosterone', 'trenbolone', 'masteron'],
    defaultDoses: { testosterone: 400, trenbolone: 250, masteron: 400 },
    doseRanges: {
      testosterone: [250, 700],
      trenbolone: [150, 400],
      masteron: [200, 500]
    },
    steps: 3,
    goal: 'dry_cosmetic'
  },
  {
    id: 'joint_strength_stack',
    label: 'Joint-Friendly Strength',
    narrative: 'Strength-focused blend where NPP cushions joints and Dbol handles neural drive.',
    compounds: ['testosterone', 'npp', 'dianabol'],
    defaultDoses: { testosterone: 500, npp: 350, dianabol: 30 },
    doseRanges: {
      testosterone: [300, 800],
      npp: [200, 500],
      dianabol: [20, 50]
    },
    steps: 3,
    goal: 'joint_friendly'
  },
  {
    id: 'endurance_cut_stack',
    label: 'Endurance Cut',
    narrative: 'Long, lean cut leveraging EQ endurance plus Anavar hardness on a TRT base.',
    compounds: ['testosterone', 'eq', 'anavar'],
    defaultDoses: { testosterone: 300, eq: 600, anavar: 50 },
    doseRanges: {
      testosterone: [200, 600],
      eq: [400, 900],
      anavar: [30, 60]
    },
    steps: 3,
    goal: 'lean_mass'
  }
];

export const interactionPairs = {
  testosterone_npp: {
    id: 'testosterone_npp',
    compounds: ['testosterone', 'npp'],
    label: 'Testosterone + NPP',
    summary: 'Classic mass stack: Test base with nandrolone joint relief and fullness.',
    defaultDimension: 'anabolic',
    doseRanges: {
      testosterone: [0, 1000],
      npp: [0, 600]
    },
    defaultDoses: {
      testosterone: 500,
      npp: 300
    },
    synergy: {
      anabolic: 0.3,
      joint: 0.45,
      strength: 0.2
    },
    penalties: {
      bloat: 0.25,
      estrogenic: 0.2,
      neuro: 0.12
    },
    dimensionWeights: {
      anabolic: { testosterone: 1, npp: 0.8 },
      joint: { npp: 1 },
      strength: { testosterone: 0.7, npp: 0.4 },
      bloat: { testosterone: 0.7, npp: 0.6 },
      estrogenic: { testosterone: 0.8, npp: 0.4 },
      neuro: { npp: 0.5 }
    },
    doseModel: {
      type: 'hill',
      params: { d50A: 350, d50B: 250, n: 2.1 }
    },
    evidence: {
      clinical: 0.45,
      anecdote: 0.55,
      updated: '2025-01'
    },
    narratives: {
      highlight: 'NPP bolsters connective tissue and adds lean tissue density on top of a Test base.',
      caution: 'Dual estrogen/progestin management required; prolactin creeps fast above 350mg.'
    }
  },
  testosterone_eq: {
    id: 'testosterone_eq',
    compounds: ['testosterone', 'eq'],
    label: 'Testosterone + EQ',
    summary: 'Classic lean-mass + endurance stack with RBC watch-outs.',
    defaultDimension: 'anabolic',
    doseRanges: {
      testosterone: [0, 1000],
      eq: [0, 1000]
    },
    defaultDoses: {
      testosterone: 400,
      eq: 500
    },
    synergy: {
      anabolic: 0.35,
      vascularity: 0.45
    },
    penalties: {
      bp: 0.25,
      hematocrit: 0.4,
      bloat: 0.12
    },
    dimensionWeights: {
      anabolic: { testosterone: 1, eq: 0.85 },
      vascularity: { eq: 1, testosterone: 0.3 },
      bp: { testosterone: 0.6, eq: 0.8 },
      hematocrit: { eq: 1, testosterone: 0.4 },
      bloat: { testosterone: 0.7 }
    },
    doseModel: {
      type: 'hill',
      params: { d50A: 350, d50B: 450, n: 2 }
    },
    evidence: {
      clinical: 0.55,
      anecdote: 0.45,
      updated: '2025-02'
    },
    narratives: {
      highlight: 'EQ amplifies lean mass per mg and adds vascularity when RBC is managed.',
      caution: 'Hematocrit climbs quickly; blood donation cadence becomes the limiting factor.'
    }
  },
  testosterone_trenbolone: {
    id: 'testosterone_trenbolone',
    compounds: ['testosterone', 'trenbolone'],
    label: 'Testosterone + Tren',
    summary: 'Aggressive recomp engine with enormous neuro/cardio tax.',
    defaultDimension: 'strength',
    doseRanges: {
      testosterone: [0, 900],
      trenbolone: [0, 600]
    },
    defaultDoses: {
      testosterone: 500,
      trenbolone: 250
    },
    synergy: {
      anabolic: 0.45,
      strength: 0.55,
      vascularity: 0.3
    },
    penalties: {
      neuro: 0.55,
      bp: 0.4,
      hepatic: 0.2
    },
    dimensionWeights: {
      anabolic: { testosterone: 0.8, trenbolone: 1 },
      strength: { trenbolone: 1, testosterone: 0.5 },
      vascularity: { trenbolone: 0.6, testosterone: 0.2 },
      neuro: { trenbolone: 1 },
      bp: { testosterone: 0.6, trenbolone: 0.7 },
      hepatic: { trenbolone: 0.4 }
    },
    doseModel: {
      type: 'hill',
      params: { d50A: 350, d50B: 200, n: 2.4 }
    },
    evidence: {
      clinical: 0.25,
      anecdote: 0.75,
      updated: '2025-02'
    },
    narratives: {
      highlight: 'Tren’s androgen receptor efficiency spikes when backed by ample Test, enabling drastic recomp.',
      caution: 'Psychological volatility and BP load explode beyond 300mg Tren if Test stays high; cap duration to 10-12 weeks.'
    }
  },
  testosterone_masteron: {
    id: 'testosterone_masteron',
    compounds: ['testosterone', 'masteron'],
    label: 'Testosterone + Masteron',
    summary: 'Test base with cosmetic hardness and anti-estrogen support.',
    defaultDimension: 'vascularity',
    doseRanges: {
      testosterone: [0, 900],
      masteron: [0, 600]
    },
    defaultDoses: {
      testosterone: 450,
      masteron: 400
    },
    synergy: {
      vascularity: 0.5,
      anabolic: 0.15
    },
    penalties: {
      estrogenic: 0.25,
      neuro: 0.1
    },
    dimensionWeights: {
      vascularity: { masteron: 1, testosterone: 0.4 },
      anabolic: { testosterone: 1, masteron: 0.3 },
      estrogenic: { masteron: 0.9, testosterone: 0.4 },
      neuro: { masteron: 0.2 }
    },
    doseModel: {
      type: 'hill',
      params: { d50A: 350, d50B: 300, n: 2 }
    },
    evidence: {
      clinical: 0.35,
      anecdote: 0.65,
      updated: '2025-02'
    },
    narratives: {
      highlight: 'Masteron trims water and adds graininess while the Test base preserves libido and drive.',
      caution: 'Low E2 risk if total aromatizing dose is modest; monitor joints/libido when running high Mast ratios.'
    }
  },
  testosterone_primobolan: {
    id: 'testosterone_primobolan',
    compounds: ['testosterone', 'primobolan'],
    label: 'Testosterone + Primo',
    summary: 'High-safety lean tissue stack favored for long cruises.',
    defaultDimension: 'anabolic',
    doseRanges: {
      testosterone: [0, 900],
      primobolan: [0, 800]
    },
    defaultDoses: {
      testosterone: 350,
      primobolan: 500
    },
    synergy: {
      anabolic: 0.2,
      vascularity: 0.25
    },
    penalties: {
      bp: 0.12,
      hepatic: 0.05
    },
    dimensionWeights: {
      anabolic: { primobolan: 0.9, testosterone: 0.6 },
      vascularity: { primobolan: 1 },
      bp: { testosterone: 0.5 },
      hepatic: { primobolan: 0.2 }
    },
    doseModel: {
      type: 'hill',
      params: { d50A: 300, d50B: 450, n: 2 }
    },
    evidence: {
      clinical: 0.4,
      anecdote: 0.6,
      updated: '2025-01'
    },
    narratives: {
      highlight: 'Primo extends the anabolic curve without aromatase baggage, perfect for long recomp blocks.',
      caution: 'Under-dosed raws common; verify supply. Mild but cumulative RBC impact when run >16 weeks.'
    }
  },
  trenbolone_masteron: {
    id: 'trenbolone_masteron',
    compounds: ['trenbolone', 'masteron'],
    label: 'Tren + Masteron',
    summary: 'Ultra-dry cosmetic synergy with estrogen deficit risk.',
    defaultDimension: 'vascularity',
    doseRanges: {
      trenbolone: [0, 600],
      masteron: [0, 600]
    },
    defaultDoses: {
      trenbolone: 250,
      masteron: 400
    },
    synergy: {
      vascularity: 0.55,
      strength: 0.25
    },
    penalties: {
      estrogenic: 0.4,
      neuro: 0.35,
      hepatic: 0.15
    },
    dimensionWeights: {
      vascularity: { masteron: 1, trenbolone: 0.4 },
      strength: { trenbolone: 1 },
      estrogenic: { masteron: 0.9, trenbolone: 0.4 },
      neuro: { trenbolone: 1 },
      hepatic: { trenbolone: 0.5, masteron: 0.2 }
    },
    doseModel: {
      type: 'hill',
      params: { d50A: 200, d50B: 300, n: 2.2 }
    },
    evidence: {
      clinical: 0.2,
      anecdote: 0.8,
      updated: '2025-01'
    },
    narratives: {
      highlight: 'Stage hardness and dryness shoot up when Tren’s aggression is balanced by Mast’s anti-estrogenic edge.',
      caution: 'Too little baseline Test drives estrogen deficit: libido crash, flat mood, joint pain.'
    }
  },
  trenbolone_eq: {
    id: 'trenbolone_eq',
    compounds: ['trenbolone', 'eq'],
    label: 'Tren + EQ',
    summary: 'Endurance + recomp mashup for contest preps with high RBC vigilance.',
    defaultDimension: 'anabolic',
    doseRanges: {
      trenbolone: [0, 600],
      eq: [0, 1000]
    },
    defaultDoses: {
      trenbolone: 250,
      eq: 600
    },
    synergy: {
      anabolic: 0.3,
      vascularity: 0.35
    },
    penalties: {
      bp: 0.5,
      hematocrit: 0.6,
      neuro: 0.3
    },
    dimensionWeights: {
      anabolic: { trenbolone: 1, eq: 0.6 },
      vascularity: { eq: 1, trenbolone: 0.4 },
      bp: { eq: 0.8, trenbolone: 0.5 },
      hematocrit: { eq: 1 },
      neuro: { trenbolone: 1 }
    },
    doseModel: {
      type: 'hill',
      params: { d50A: 220, d50B: 500, n: 2.1 }
    },
    evidence: {
      clinical: 0.2,
      anecdote: 0.8,
      updated: '2025-02'
    },
    narratives: {
      highlight: 'EQ’s appetite/endurance dampens Tren lethargy, enabling brutal prep blocks.',
      caution: 'RBC and BP skyrocket; mandatory phlebotomy schedule and cardiology-level monitoring.'
    }
  },
  npp_dianabol: {
    id: 'npp_dianabol',
    compounds: ['npp', 'dianabol'],
    label: 'NPP + Dbol',
    summary: 'Joint-friendly brute strength with massive bloat and BP penalties.',
    defaultDimension: 'strength',
    doseRanges: {
      npp: [0, 600],
      dianabol: [0, 80]
    },
    defaultDoses: {
      npp: 300,
      dianabol: 30
    },
    synergy: {
      strength: 0.5,
      joint: 0.25
    },
    penalties: {
      bloat: 0.55,
      bp: 0.4,
      hepatic: 0.45
    },
    dimensionWeights: {
      strength: { npp: 0.8, dianabol: 1 },
      joint: { npp: 1 },
      bloat: { dianabol: 1 },
      bp: { npp: 0.5, dianabol: 0.9 },
      hepatic: { dianabol: 1 }
    },
    doseModel: {
      type: 'hill',
      params: { d50A: 250, d50B: 35, n: 2.4 }
    },
    evidence: {
      clinical: 0.15,
      anecdote: 0.85,
      updated: '2024-12'
    },
    narratives: {
      highlight: 'Explosive strength jumps with knees and elbows thanking you thanks to NPP.',
      caution: 'Bloat and BP skyrocket beyond 30mg Dbol; hepatic strain is the hard stop.'
    }
  },
  trenbolone_npp: {
    id: 'trenbolone_npp',
    compounds: ['trenbolone', 'npp'],
    label: 'Tren + NPP',
    summary: 'Hybrid 19-nor stack where Tren provides density/hardness and NPP restores fullness + joint comfort when doses stay sane.',
    defaultDimension: 'anabolic',
    doseRanges: {
      trenbolone: [0, 600],
      npp: [0, 600]
    },
    defaultDoses: {
      trenbolone: 320,
      npp: 240
    },
    synergy: {
      anabolic: 0.42,
      strength: 0.28,
      joint: 0.35
    },
    penalties: {
      neuro: 0.55,
      bp: 0.38,
      hematocrit: 0.3
    },
    dimensionWeights: {
      anabolic: { trenbolone: 1, npp: 0.65 },
      strength: { trenbolone: 1, npp: 0.25 },
      joint: { npp: 1 },
      neuro: { trenbolone: 1 },
      bp: { trenbolone: 0.75, npp: 0.35 },
      hematocrit: { trenbolone: 0.45, npp: 0.55 }
    },
    doseModel: {
      type: 'hill',
      params: { d50A: 280, d50B: 260, n: 2.25 }
    },
    evidence: {
      clinical: 0.18,
      anecdote: 0.82,
      updated: '2025-03'
    },
    narratives: {
      highlight: 'Moderate Tren paired with mid-range NPP rides the “synergy ridge” for hardness + pumps while joints stay happy.',
      caution: 'Dual 19-nor suppression is unforgiving—treat high-dose/high-duration blocks as structurally expensive and monitor BP, HCT, prolactin, and sleep relentlessly.'
    },
    phaseAtlas: {
      subtitle: 'Tren + NPP conceptual atlas',
      title: 'Phase Map · Benefit vs Risk Surfaces',
      description: 'Normalized 0–1 dose space using your personalization. Thinking tool only, not medical advice.',
      benefitCaption: 'Golden mist shows total benefit. Riding from P1 → P3 yields the biggest delta.',
      riskCaption: 'Orange flare shows cumulative burden. The P4 corner is the cliff—reserve it for short experiments.',
      phases: [
        {
          id: 'P0',
          a: 0,
          b: 0,
          title: 'Cruise / no 19-nors',
          summary: 'Baseline TRT + support meds. All response comes from lifestyle, not 19-nors.'
        },
        {
          id: 'P1',
          a: 0.4,
          b: 0,
          title: 'Tren-only (moderate)',
          summary: 'Tren doing the heavy lifting at ~0.4 relative dose. Already near the top of the Tren benefit curve.'
        },
        {
          id: 'P2',
          a: 0.8,
          b: 0,
          title: 'Tren-only (high)',
          summary: 'Big jump in dose for marginal benefit, sharp risk inflection. Pure “Tren wall climbing”.'
        },
        {
          id: 'P3',
          a: 0.5,
          b: 0.3,
          title: 'Balanced ridge',
          summary: 'Moderate Tren with moderate NPP. Hardness + pumps + joint comfort. This is the sweet ridge.'
        },
        {
          id: 'P4',
          a: 0.8,
          b: 0.8,
          title: 'Both high',
          summary: 'Maxed-ish Tren and NPP. Top of the benefit mountain, but hugging the risk cliff.'
        }
      ]
    }
  },
  testosterone_dianabol: {
    id: 'testosterone_dianabol',
    compounds: ['testosterone', 'dianabol'],
    label: 'Test + Dbol',
    summary: 'Classic mass + strength kickstart with heavy estrogenic burden.',
    defaultDimension: 'strength',
    doseRanges: {
      testosterone: [0, 900],
      dianabol: [0, 60]
    },
    defaultDoses: {
      testosterone: 500,
      dianabol: 30
    },
    synergy: {
      strength: 0.55,
      anabolic: 0.3
    },
    penalties: {
      bloat: 0.6,
      bp: 0.4,
      hepatic: 0.35
    },
    dimensionWeights: {
      strength: { testosterone: 0.7, dianabol: 1 },
      anabolic: { testosterone: 1, dianabol: 0.8 },
      bloat: { dianabol: 1 },
      bp: { testosterone: 0.5, dianabol: 0.8 },
      hepatic: { dianabol: 1 }
    },
    doseModel: {
      type: 'hill',
      params: { d50A: 400, d50B: 25, n: 2.2 }
    },
    evidence: {
      clinical: 0.3,
      anecdote: 0.7,
      updated: '2024-12'
    },
    narratives: {
      highlight: 'Dbol multiplies Test’s acute glycogen swell, translating to 2-3 week strength ramps.',
      caution: 'Estrogenic/bloat management becomes the limiting factor; liver strain beyond 40mg is exponential.'
    }
  },
  testosterone_anadrol: {
    id: 'testosterone_anadrol',
    compounds: ['testosterone', 'anadrol'],
    label: 'Test + Anadrol',
    summary: 'Seismic strength and fullness with immediate BP/hepatic warnings.',
    defaultDimension: 'strength',
    doseRanges: {
      testosterone: [0, 900],
      anadrol: [0, 100]
    },
    defaultDoses: {
      testosterone: 500,
      anadrol: 50
    },
    synergy: {
      strength: 0.6,
      anabolic: 0.25
    },
    penalties: {
      bp: 0.55,
      hepatic: 0.5,
      bloat: 0.5
    },
    dimensionWeights: {
      strength: { testosterone: 0.7, anadrol: 1 },
      anabolic: { testosterone: 1, anadrol: 0.6 },
      bp: { anadrol: 1, testosterone: 0.5 },
      hepatic: { anadrol: 1 },
      bloat: { anadrol: 0.9, testosterone: 0.4 }
    },
    doseModel: {
      type: 'hill',
      params: { d50A: 400, d50B: 40, n: 2.3 }
    },
    evidence: {
      clinical: 0.25,
      anecdote: 0.75,
      updated: '2025-02'
    },
    narratives: {
      highlight: 'Powerlifters bank on the immediate leverage boost from Anadrol stacked atop Test.',
      caution: 'BP and hepatic markers skyrocket—treat >50mg as redline territory.'
    }
  },
  eq_anavar: {
    id: 'eq_anavar',
    compounds: ['eq', 'anavar'],
    label: 'EQ + Anavar',
    summary: 'Slow-burn lean gains with low aromatase burden and cardio focus.',
    defaultDimension: 'anabolic',
    doseRanges: {
      eq: [0, 1000],
      anavar: [0, 80]
    },
    defaultDoses: {
      eq: 600,
      anavar: 50
    },
    synergy: {
      anabolic: 0.22,
      vascularity: 0.35
    },
    penalties: {
      hepatic: 0.25,
      bp: 0.2
    },
    dimensionWeights: {
      anabolic: { eq: 1, anavar: 0.5 },
      vascularity: { eq: 0.7, anavar: 0.9 },
      hepatic: { anavar: 1 },
      bp: { eq: 0.7 }
    },
    doseModel: {
      type: 'hill',
      params: { d50A: 500, d50B: 40, n: 2 }
    },
    evidence: {
      clinical: 0.35,
      anecdote: 0.65,
      updated: '2025-01'
    },
    narratives: {
      highlight: 'Anavar adds neural drive and hardness to EQ’s appetite/endurance platform.',
      caution: 'Despite mild branding, hepatic stress accrues when Anavar is held beyond 8 weeks.'
    }
  },
  masteron_primobolan: {
    id: 'masteron_primobolan',
    compounds: ['masteron', 'primobolan'],
    label: 'Masteron + Primo',
    summary: 'Ultra-clean cosmetic stack for long cuts with minimal systemic stress.',
    defaultDimension: 'vascularity',
    doseRanges: {
      masteron: [200, 600],
      primobolan: [300, 800]
    },
    defaultDoses: {
      masteron: 400,
      primobolan: 500
    },
    synergy: {
      vascularity: 0.55,
      joint: 0.2
    },
    penalties: {
      estrogenic: 0.2,
      hepatic: 0.05
    },
    dimensionWeights: {
      vascularity: { masteron: 1, primobolan: 0.6 },
      joint: { primobolan: 0.4 },
      estrogenic: { masteron: 0.9 },
      hepatic: { primobolan: 0.1 }
    },
    doseModel: {
      type: 'hill',
      params: { d50A: 350, d50B: 450, n: 2 }
    },
    evidence: {
      clinical: 0.35,
      anecdote: 0.65,
      updated: '2025-02'
    },
    narratives: {
      highlight: 'Primo’s slow, dry tissue plus Masteron’s anti-estrogenic hardness keeps physiques sharp for months.',
      caution: 'Extremely low aromatase context; ensure a baseline Test/TRT dose to protect mood and joints.'
    }
  },
  eq_primobolan: {
    id: 'eq_primobolan',
    compounds: ['eq', 'primobolan'],
    label: 'EQ + Primo',
    summary: 'Endurance-driven lean build with pristine lipid impact.',
    defaultDimension: 'anabolic',
    doseRanges: {
      eq: [400, 900],
      primobolan: [400, 800]
    },
    defaultDoses: {
      eq: 600,
      primobolan: 600
    },
    synergy: {
      anabolic: 0.25,
      vascularity: 0.3
    },
    penalties: {
      hematocrit: 0.45,
      bp: 0.2
    },
    dimensionWeights: {
      anabolic: { eq: 1, primobolan: 0.7 },
      vascularity: { eq: 0.8, primobolan: 0.6 },
      hematocrit: { eq: 1 },
      bp: { eq: 0.5 }
    },
    doseModel: {
      type: 'hill',
      params: { d50A: 500, d50B: 500, n: 2.1 }
    },
    evidence: {
      clinical: 0.3,
      anecdote: 0.7,
      updated: '2025-02'
    },
    narratives: {
      highlight: 'Pairs two mild compounds for marathon recomp blocks where appetite and endurance stay high.',
      caution: 'Hematocrit remains the limiting factor—donation cadence is mandatory past week 10.'
    }
  },
  testosterone_winstrol: {
    id: 'testosterone_winstrol',
    compounds: ['testosterone', 'winstrol'],
    label: 'Testosterone + Winstrol',
    summary: 'Contest cut combo: Test maintains fullness while Winny peels water.',
    defaultDimension: 'vascularity',
    doseRanges: {
      testosterone: [200, 700],
      winstrol: [20, 70]
    },
    defaultDoses: {
      testosterone: 400,
      winstrol: 50
    },
    synergy: {
      vascularity: 0.4,
      strength: 0.25
    },
    penalties: {
      joint: 0.35,
      hepatic: 0.4
    },
    dimensionWeights: {
      vascularity: { winstrol: 1, testosterone: 0.3 },
      strength: { testosterone: 0.7, winstrol: 0.9 },
      joint: { winstrol: 1 },
      hepatic: { winstrol: 1 }
    },
    doseModel: {
      type: 'hill',
      params: { d50A: 300, d50B: 40, n: 2.3 }
    },
    evidence: {
      clinical: 0.25,
      anecdote: 0.75,
      updated: '2025-02'
    },
    narratives: {
      highlight: 'Adds crispness and tendon-drive near showtime without flattening muscle thanks to Test support.',
      caution: 'Expect joint dryness and hepatic strain after week 4; keep Winny short.'
    }
  },
  trenbolone_winstrol: {
    id: 'trenbolone_winstrol',
    compounds: ['trenbolone', 'winstrol'],
    label: 'Tren + Winstrol',
    summary: 'Nuclear dryness stack: maximum hardness with brutal joint/neuro toll.',
    defaultDimension: 'vascularity',
    doseRanges: {
      trenbolone: [0, 400],
      winstrol: [20, 70]
    },
    defaultDoses: {
      trenbolone: 250,
      winstrol: 40
    },
    synergy: {
      vascularity: 0.6,
      strength: 0.3
    },
    penalties: {
      neuro: 0.5,
      joint: 0.45,
      hepatic: 0.45
    },
    dimensionWeights: {
      vascularity: { winstrol: 1, trenbolone: 0.5 },
      strength: { trenbolone: 1, winstrol: 0.8 },
      neuro: { trenbolone: 1 },
      joint: { winstrol: 1 },
      hepatic: { winstrol: 1 }
    },
    doseModel: {
      type: 'hill',
      params: { d50A: 220, d50B: 35, n: 2.4 }
    },
    evidence: {
      clinical: 0.2,
      anecdote: 0.8,
      updated: '2025-02'
    },
    narratives: {
      highlight: 'Stage-ready dryness in 4 weeks; Winstrol amplifies Tren’s neural drive for peak strength.',
      caution: 'Combines the worst joint + neuro + hepatic penalties—reserve for short, supervised blasts.'
    }
  },
  testosterone_halotestin: {
    id: 'testosterone_halotestin',
    compounds: ['testosterone', 'halotestin'],
    label: 'Testosterone + Halo',
    summary: 'Meet-week aggression stack for lifters needing maximal CNS output.',
    defaultDimension: 'strength',
    doseRanges: {
      testosterone: [300, 700],
      halotestin: [5, 30]
    },
    defaultDoses: {
      testosterone: 500,
      halotestin: 20
    },
    synergy: {
      strength: 0.65,
      vascularity: 0.2
    },
    penalties: {
      neuro: 0.55,
      hepatic: 0.6,
      bp: 0.35
    },
    dimensionWeights: {
      strength: { halotestin: 1, testosterone: 0.6 },
      vascularity: { halotestin: 0.6 },
      neuro: { halotestin: 1 },
      hepatic: { halotestin: 1 },
      bp: { testosterone: 0.5, halotestin: 0.4 }
    },
    doseModel: {
      type: 'hill',
      params: { d50A: 350, d50B: 15, n: 2.5 }
    },
    evidence: {
      clinical: 0.15,
      anecdote: 0.85,
      updated: '2025-02'
    },
    narratives: {
      highlight: 'Halotestin stacks on TRT/Test background deliver unmatched neural aggression for meet day.',
      caution: 'Toxicity limits use to 10-14 days; monitor BP and hepatic labs closely.'
    }
  },
  trenbolone_halotestin: {
    id: 'trenbolone_halotestin',
    compounds: ['trenbolone', 'halotestin'],
    label: 'Tren + Halo',
    summary: 'Only for the insane: max CNS drive with crippling neuro/hepatic risk.',
    defaultDimension: 'strength',
    doseRanges: {
      trenbolone: [150, 400],
      halotestin: [5, 30]
    },
    defaultDoses: {
      trenbolone: 250,
      halotestin: 15
    },
    synergy: {
      strength: 0.7,
      vascularity: 0.2
    },
    penalties: {
      neuro: 0.65,
      hepatic: 0.65,
      bp: 0.4
    },
    dimensionWeights: {
      strength: { trenbolone: 1, halotestin: 0.9 },
      vascularity: { halotestin: 0.6 },
      neuro: { trenbolone: 1 },
      hepatic: { halotestin: 1 },
      bp: { trenbolone: 0.5, halotestin: 0.5 }
    },
    doseModel: {
      type: 'hill',
      params: { d50A: 220, d50B: 12, n: 2.4 }
    },
    evidence: {
      clinical: 0.1,
      anecdote: 0.9,
      updated: '2025-02'
    },
    narratives: {
      highlight: 'Contest peak for elite strength athletes chasing sheer aggression.',
      caution: 'Stack is neurologically volatile and liver-toxic—should only be used briefly under supervision.'
    }
  },
  testosterone_superdrol: {
    id: 'testosterone_superdrol',
    compounds: ['testosterone', 'superdrol'],
    label: 'Test + Superdrol',
    summary: 'Explosive mass and strength with extreme hepatic burden.',
    defaultDimension: 'strength',
    doseRanges: { testosterone: [200, 900], superdrol: [0, 30] },
    defaultDoses: { testosterone: 500, superdrol: 20 },
    synergy: { strength: 0.7, anabolic: 0.55 },
    penalties: { hepatic: 0.75, bp: 0.5, neuro: 0.3 },
    dimensionWeights: {
      strength: { superdrol: 1, testosterone: 0.6 },
      anabolic: { testosterone: 1, superdrol: 0.9 },
      hepatic: { superdrol: 1 },
      bp: { superdrol: 0.8, testosterone: 0.5 },
      neuro: { superdrol: 0.6 }
    },
    doseModel: { type: 'hill', params: { d50A: 400, d50B: 15, n: 2.5 } },
    evidence: { clinical: 0.1, anecdote: 0.9, updated: '2025-03' },
    narratives: {
      highlight: 'Superdrol delivers massive strength and fullness in 3-4 weeks when backed by Test.',
      caution: 'Liver toxicity is extreme—treat >20mg as redline, limit to 4 weeks max.'
    }
  },
  superdrol_anadrol: {
    id: 'superdrol_anadrol',
    compounds: ['superdrol', 'anadrol'],
    label: 'Superdrol + Anadrol',
    summary: 'DANGEROUS: Dual methylated orals - liver suicide stack.',
    defaultDimension: 'hepatic',
    doseRanges: { superdrol: [0, 30], anadrol: [0, 100] },
    defaultDoses: { superdrol: 10, anadrol: 50 },
    synergy: { strength: 0.1 },
    penalties: { hepatic: 1.2, bp: 0.7 },
    dimensionWeights: {
      strength: { superdrol: 0.5, anadrol: 0.5 },
      hepatic: { superdrol: 1, anadrol: 1 },
      bp: { anadrol: 1, superdrol: 0.6 }
    },
    doseModel: { type: 'hill', params: { d50A: 15, d50B: 40, n: 3 } },
    evidence: { clinical: 0, anecdote: 1, updated: '2025-03' },
    narratives: {
      highlight: 'None - this combination is universally discouraged.',
      caution: 'Dual C17-aa methylation causes exponential liver enzyme elevation. Not recommended.'
    }
  },
  testosterone_turinabol: {
    id: 'testosterone_turinabol',
    compounds: ['testosterone', 'turinabol'],
    label: 'Test + Turinabol',
    summary: 'Clean performance stack with moderate hepatic burden.',
    defaultDimension: 'anabolic',
    doseRanges: { testosterone: [200, 900], turinabol: [0, 80] },
    defaultDoses: { testosterone: 500, turinabol: 50 },
    synergy: { anabolic: 0.3, vascularity: 0.25 },
    penalties: { hepatic: 0.35, bp: 0.2 },
    dimensionWeights: {
      anabolic: { testosterone: 1, turinabol: 0.7 },
      vascularity: { turinabol: 0.8 },
      hepatic: { turinabol: 1 },
      bp: { testosterone: 0.5, turinabol: 0.3 }
    },
    doseModel: { type: 'hill', params: { d50A: 400, d50B: 45, n: 2.1 } },
    evidence: { clinical: 0.2, anecdote: 0.8, updated: '2025-03' },
    narratives: {
      highlight: 'Tbol adds dry lean gains without aromatization, ideal for athletic performance.',
      caution: 'Hepatic stress accumulates beyond 60mg or >8 weeks.'
    }
  },
  turinabol_anavar: {
    id: 'turinabol_anavar',
    compounds: ['turinabol', 'anavar'],
    label: 'Turinabol + Anavar',
    summary: 'Performance-focused dual oral with managed hepatic load.',
    defaultDimension: 'vascularity',
    doseRanges: { turinabol: [0, 80], anavar: [0, 80] },
    defaultDoses: { turinabol: 40, anavar: 50 },
    synergy: { vascularity: 0.35, anabolic: 0.2 },
    penalties: { hepatic: 0.5, bp: 0.15 },
    dimensionWeights: {
      vascularity: { anavar: 1, turinabol: 0.6 },
      anabolic: { turinabol: 0.7, anavar: 0.6 },
      hepatic: { turinabol: 0.8, anavar: 0.7 },
      bp: { turinabol: 0.3, anavar: 0.2 }
    },
    doseModel: { type: 'hill', params: { d50A: 45, d50B: 45, n: 2 } },
    evidence: { clinical: 0.15, anecdote: 0.85, updated: '2025-03' },
    narratives: {
      highlight: 'Two mild orals stack well for athletes seeking lean gains without heavy bloat.',
      caution: 'Dual oral hepatic load requires liver support and monitoring.'
    }
  },
  testosterone_proviron: {
    id: 'testosterone_proviron',
    compounds: ['testosterone', 'proviron'],
    label: 'Test + Proviron',
    summary: 'Free Testosterone amplifier; SHBG binding synergy.',
    defaultDimension: 'vascularity',
    doseRanges: { testosterone: [200, 900], proviron: [0, 75] },
    defaultDoses: { testosterone: 500, proviron: 50 },
    synergy: { vascularity: 0.3, strength: 0.15 },
    penalties: { estrogenic: -0.1 }, // Negative penalty = benefit (reduces E2 sides)
    dimensionWeights: {
      vascularity: { proviron: 1, testosterone: 0.5 },
      strength: { testosterone: 0.8, proviron: 0.4 },
      estrogenic: { proviron: -0.5 } // Anti-estrogenic effect
    },
    doseModel: { type: 'hill', params: { d50A: 400, d50B: 40, n: 2 } },
    evidence: { clinical: 0.4, anecdote: 0.6, updated: '2025-03' },
    narratives: {
      highlight: 'Proviron binds SHBG, freeing more testosterone. Adds hardness and libido support with minimal toxicity.',
      caution: 'Excellent addition to any Test base - standard "glue" for advanced stacks.'
    }
  },
  npp_proviron: {
    id: 'npp_proviron',
    compounds: ['npp', 'proviron'],
    label: 'NPP + Proviron',
    summary: 'Functional synergy; Proviron mitigates "Deca Dick".',
    defaultDimension: 'joint',
    doseRanges: { npp: [200, 600], proviron: [0, 75] },
    defaultDoses: { npp: 350, proviron: 50 },
    synergy: { joint: 0.1, vascularity: 0.2 },
    penalties: { neuro: -0.15 }, // Reduces libido/mood issues
    dimensionWeights: {
      joint: { npp: 1 },
      vascularity: { proviron: 0.8 },
      neuro: { proviron: -0.6 } // Counteracts DHN metabolite issues
    },
    doseModel: { type: 'hill', params: { d50A: 300, d50B: 40, n: 2 } },
    evidence: { clinical: 0.3, anecdote: 0.7, updated: '2025-03' },
    narratives: {
      highlight: 'Proviron provides DHT androgenicity that NPP lacks, maintaining libido and mood.',
      caution: 'Highly recommended to prevent sexual dysfunction from 19-nors.'
    }
  },
  trenbolone_proviron: {
    id: 'trenbolone_proviron',
    compounds: ['trenbolone', 'proviron'],
    label: 'Tren + Proviron',
    summary: 'Elite cosmetic stack with libido preservation.',
    defaultDimension: 'vascularity',
    doseRanges: { trenbolone: [150, 600], proviron: [0, 75] },
    defaultDoses: { trenbolone: 300, proviron: 50 },
    synergy: { vascularity: 0.4, strength: 0.2 },
    penalties: { estrogenic: -0.05 },
    dimensionWeights: {
      vascularity: { proviron: 1, trenbolone: 0.6 },
      strength: { trenbolone: 1, proviron: 0.3 },
      estrogenic: { proviron: -0.4 }
    },
    doseModel: { type: 'hill', params: { d50A: 250, d50B: 40, n: 2.2 } },
    evidence: { clinical: 0.2, anecdote: 0.8, updated: '2025-03' },
    narratives: {
      highlight: 'Proviron enhances Tren\'s cosmetic effects while providing DHT support for libido.',
      caution: 'Excellent for contest prep - maintains hardness and sex drive.'
    }
  },
  superdrol_turinabol: {
    id: 'superdrol_turinabol',
    compounds: ['superdrol', 'turinabol'],
    label: 'Superdrol + Turinabol',
    summary: 'Dual oral with extreme hepatic burden.',
    defaultDimension: 'hepatic',
    doseRanges: { superdrol: [0, 30], turinabol: [0, 80] },
    defaultDoses: { superdrol: 10, turinabol: 40 },
    synergy: { strength: 0.15, anabolic: 0.1 },
    penalties: { hepatic: 0.8, bp: 0.4 },
    dimensionWeights: {
      strength: { superdrol: 0.8, turinabol: 0.5 },
      anabolic: { superdrol: 0.7, turinabol: 0.6 },
      hepatic: { superdrol: 1, turinabol: 0.7 },
      bp: { superdrol: 0.6, turinabol: 0.3 }
    },
    doseModel: { type: 'hill', params: { d50A: 15, d50B: 45, n: 2.5 } },
    evidence: { clinical: 0, anecdote: 1, updated: '2025-03' },
    narratives: {
      highlight: 'Minimal - dual methylated stress outweighs marginal synergy.',
      caution: 'High hepatic burden. Use only at very low doses for short duration.'
    }
  }
};
