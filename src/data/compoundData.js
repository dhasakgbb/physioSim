/**
 * Complete AAS Dose-Response Data
 * Refactored for Linear Simulation Engine (2025 Standard)
 *
 * CHANGES:
 * - Consolidated Nandrolone (NPP/Deca)
 * - Added Renal Toxicity Biomarkers
 * - Corrected Halotestin Pharmacokinetics
 * - Added SERMs, HCG, and Caber
 */

export const compoundData = {
  testosterone: {
    name: "Testosterone",
    color: "#0066CC",
    abbreviation: "Test",
    type: "injectable",
    bioavailability: 1.0,
    suppressiveFactor: 2,
    flags: { aromatization: 1.0, isSuppressive: true },
    defaultEster: "enanthate",
    esters: {
      propionate: {
        label: "Propionate",
        halfLife: 19,
        weight: 0.83,
        slug: "Prop",
      },
      enanthate: {
        label: "Enanthate",
        halfLife: 108, // 4.5 days (pharma) -> functional modeling often treats as 7 days
        weight: 0.72,
        slug: "Enanthate",
      },
      cypionate: {
        label: "Cypionate",
        halfLife: 120, // 5 days
        weight: 0.7,
        slug: "Cyp",
      },
      sustanon: {
        label: "Sustanon 250",
        halfLife: 216,
        weight: 0.74,
        slug: "Sust",
        isBlend: true,
      },
    },
    category: "base",
    pathway: "ar_genomic",
    bindingAffinity: "moderate",
    biomarkers: {
      shbg: -1,
      igf1: +1,
      rbc: +1,
      cortisol: 0,
      prolactin: 0,
      e2_conversion: +2,
      renal_toxicity: 0,
    },
    halfLife: 108,
    modelConfidence: 0.95,
    evidenceProvenance: { human: 5, animal: 1, aggregate: 4 },
    benefitCurve: [
      { dose: 0, value: 0.0, tier: "Tier 0", source: "Baseline", ci: 0.0 },
      {
        dose: 100,
        value: 0.83,
        tier: "Tier 1",
        source: "Bhasin et al.",
        ci: 0.15,
      },
      {
        dose: 300,
        value: 2.5,
        tier: "Tier 1",
        source: "Bhasin et al.",
        ci: 0.15,
      },
      {
        dose: 600,
        value: 5.0,
        tier: "Tier 1",
        source: "Bhasin et al.",
        ci: 0.15,
      },
      {
        dose: 800,
        value: 6.1,
        tier: "Tier 3",
        source: "Extrapolated",
        ci: 0.5,
      },
      {
        dose: 1000,
        value: 6.9,
        tier: "Tier 3",
        source: "Extrapolated",
        ci: 0.5,
      },
      {
        dose: 1500,
        value: 8.2,
        tier: "Tier 3",
        source: "Extrapolated",
        ci: 0.5,
      },
      {
        dose: 3000,
        value: 10.0,
        tier: "Tier 3",
        source: "Extrapolated",
        ci: 0.5,
      },
    ],
    riskCurve: [
      { dose: 0, value: 0.0, tier: "Tier 0", source: "Baseline", ci: 0.0 },
      { dose: 100, value: 0.2, tier: "Tier 1", source: "Bhasin", ci: 0.2 },
      { dose: 300, value: 0.9, tier: "Tier 1", source: "Bhasin", ci: 0.2 },
      { dose: 600, value: 2.1, tier: "Tier 1", source: "Bhasin", ci: 0.25 },
      { dose: 1000, value: 4.0, tier: "Tier 3", source: "Extrapolated", ci: 0.5 },
      {
        dose: 1500,
        value: 6.0,
        tier: "Tier 4",
        source: "Open Class",
        ci: 0.6,
      },
      {
        dose: 2500,
        value: 11.5,
        tier: "Tier 4",
        source: "Open Class",
        ci: 0.7,
      },
    ],
    methodology: {
      summary: "Tier 1 (0-600mg). The gold standard reference compound.",
    },
  },

  nandrolone: {
    name: "Nandrolone",
    color: "#FF9900",
    abbreviation: "Deca/NPP",
    type: "injectable",
    bioavailability: 1.0,
    suppressiveFactor: 4, // 19-nor suppression
    flags: { aromatization: 0.2, isSuppressive: true, createsDHN: true },
    defaultEster: "decanoate",
    esters: {
      phenylpropionate: {
        label: "Phenylpropionate (NPP)",
        halfLife: 60,
        weight: 0.67,
        slug: "NPP",
      },
      decanoate: {
        label: "Decanoate (Deca)",
        halfLife: 360, // 15 days
        weight: 0.64,
        slug: "Deca",
      },
    },
    category: "progestin",
    pathway: "ar_genomic", // Strong binder
    bindingAffinity: "high",
    biomarkers: {
      shbg: -1, // Mild suppression
      igf1: +1, // Moderate increase
      rbc: +1, // Mild increase
      cortisol: -1, // Mild anti-catabolic
      prolactin: +3, // HIGH RISK (Direct Progesterone Receptor Agonist)
      hair_safe: +2, // Converts to DHN (Weak androgen) - Specialized Benefit
      neurotoxicity: 2, // Moderate Neurotoxicity (19-nor)
      renal_toxicity: 1,
    },
    halfLife: 360, // Default to Deca
    modelConfidence: 0.61,
    evidenceProvenance: { human: 2, animal: 3, aggregate: 5 },
    varianceDrivers: [
      "Prolactin receptor sensitivity varies ±40%",
      "Progesterone/E2 cross-talk (AI + caber compliance)",
      "Short ester pharmacokinetics (missed injections swing levels)",
    ],
    benefitCurve: [
      {
        dose: 0,
        value: 0.0,
        tier: "Tier 0",
        source: "Baseline",
        caveat: "No AAS use",
        ci: 0.0,
      },
      {
        dose: 100,
        value: 1.5,
        tier: "Tier 2",
        source: "Therapeutic Deca studies extrapolated",
        caveat: "Faster ester kinetics vs Deca",
        ci: 0.3,
      },
      {
        dose: 200,
        value: 2.5,
        tier: "Tier 2",
        source: "Blaquier et al. (1991) rat study HED-scaled",
        caveat: "Joint protection benefit peaks",
        ci: 0.3,
      },
      {
        dose: 300,
        value: 3.0,
        tier: "Tier 2/3",
        source: "HED-scaled + forum consensus",
        caveat: "Plateau in lean mass gains",
        ci: 0.4,
      },
      {
        dose: 400,
        value: 3.15,
        tier: "Tier 3",
        source: "Forum reports",
        caveat: "Anecdotal plateau; no additional mass",
        ci: 0.5,
      },
      {
        dose: 600,
        value: 3.45,
        tier: "Tier 4",
        source: "Forum consensus",
        caveat: "Diminishing returns",
        ci: 0.5,
      },
      {
        dose: 800,
        value: 3.65,
        tier: "Tier 4",
        source: "Extrapolated",
        caveat: "Saturated",
        ci: 0.6,
      },
      {
        dose: 1000,
        value: 3.8,
        tier: "Tier 4",
        source: "Extrapolated",
        caveat: "Saturated",
        ci: 0.6,
      },
    ],
    riskCurve: [
      {
        dose: 0,
        value: 0.0,
        tier: "Tier 0",
        source: "Baseline",
        caveat: "No AAS use",
        ci: 0.0,
      },
      {
        dose: 100,
        value: 0.3,
        tier: "Tier 2",
        source: "Clinical Deca data",
        caveat: "Mild prolactin elevation",
        ci: 0.25,
      },
      {
        dose: 200,
        value: 0.8,
        tier: "Tier 2",
        source: "Clinical extrapolation",
        caveat: "Prolactin emerging",
        ci: 0.3,
      },
      {
        dose: 300,
        value: 1.5,
        tier: "Tier 2/3",
        source: "Forum reports",
        caveat: '"Deca dick" threshold reports; ~40% of users',
        ci: 0.4,
      },
      {
        dose: 400,
        value: 2.2,
        tier: "Tier 3",
        source: "Anecdotal aggregates",
        caveat: "Significant prolactin + lipid decline",
        ci: 0.5,
      },
      {
        dose: 600,
        value: 3.0,
        tier: "Tier 4",
        source: "Forum consensus",
        caveat: "High risk; prolactin dominates; sexual dysfunction common",
        ci: 0.5,
      },
      {
        dose: 800,
        value: 4.5,
        tier: "Tier 4",
        source: "Extrapolated",
        caveat: "Severe prolactin risk",
        ci: 0.6,
      },
      {
        dose: 1000,
        value: 6.5,
        tier: "Tier 4",
        source: "Extrapolated",
        caveat: "Extreme risk",
        ci: 0.7,
      },
    ],
    methodology: {
      summary:
        "Tier 2 (0-300mg); Tier 3/4 (300-600mg); prolactin highly variable",
      benefitRationale:
        "Inferred from therapeutic Deca studies + shorter ester kinetics. Blaquier rat study HED-scaled (~200-300mg human equivalent at max effect). Forum consensus shows plateau.",
      riskRationale:
        'Prolactin dose-response limited in clinical data; mostly anecdotal "deca dick" thresholds. ~40% of users report sexual dysfunction >300mg. HDL decline similar to Test but progesterone effects complicate.',
      sources: [
        "Blaquier et al. (1991) - NPP dose-response in rat protein synthesis",
        "Therapeutic nandrolone data (50-100mg)",
        "r/steroids, Meso-Rx forums - ~2000 cycle reports",
      ],
      limitations: [
        "No controlled human dose-response studies for supraphysio NPP",
        "Prolactin sensitivity varies dramatically by genetics + E2 levels",
        "Shorter ester means different kinetics vs Deca; extrapolation assumptions",
      ],
      assumptions: [
        "Proper P5P use (prolactin control)",
        "E2 managed via AI",
        "Age 25-40",
        "Baseline health",
      ],
      individualVariance: [
        "Prolactin response: ±40% (highly individual)",
        "E2/prolactin interaction not modeled",
        "Genetics: ±20-30%",
      ],
    },
    sideEffectProfile: {
      common: [
        {
          name: "Sexual Dysfunction (Deca Dick)",
          severity: "medium-high",
          onset: "week 3-6",
          doseDependent: true,
          management: "Cabergoline 0.5mg 2x/week; P5P 200mg daily",
        },
        {
          name: "Prolactin Elevation",
          severity: "medium",
          onset: "week 2-4",
          doseDependent: true,
          management: "Cabergoline or Pramipexole; monitor prolactin levels",
        },
        {
          name: "Water Retention",
          severity: "low-medium",
          onset: "week 1-2",
          doseDependent: true,
          management: "Less than Test; mild AI may help",
        },
        {
          name: "Joint Relief",
          severity: "positive",
          onset: "week 2-3",
          doseDependent: true,
          management: "Beneficial effect; fluid in joints",
        },
        {
          name: "Gynecomastia Risk",
          severity: "low-medium",
          onset: "week 4+",
          doseDependent: true,
          management: "Prolactin-mediated; cabergoline more important than AI",
        },
      ],
      lipidProfile: {
        hdlDecline: "moderate (similar to Test)",
        ldlIncrease: "mild (↑10-15%)",
        triglycerides: "mild increase",
        management: "Standard lipid management; fish oil, cardio",
      },
      cardiovascular: {
        bloodPressure: "mild increase (less than Test)",
        lvh: "dose-dependent risk similar to Test",
        rbc: "moderate increase",
        management: "Monitor BP; standard cardio protocol",
      },
      hpta: {
        suppression: "severe; progestogenic effects compound suppression",
        recovery: "3-4 months; slower than Test due to progesterone effects",
        pctRequired: true,
        management:
          "Extended PCT recommended; HCG during cycle strongly advised",
      },
    },
    ancillaryRequirements: {
      dopamineAgonist: {
        trigger: "Dose >200mg/week or prolactin symptoms",
        examples: [
          "Cabergoline (Dostinex) 0.5mg 2x/week",
          "Pramipexole 0.25-0.5mg daily",
        ],
        dosing:
          "Start 0.25mg cabergoline 2x/week; increase if symptoms persist",
        note: "More critical than AI for NPP; prevents deca dick",
      },
      p5p: {
        trigger: "All doses; preventive",
        dosing: "200mg P5P (Vitamin B6) daily",
        purpose: "Mild prolactin control; not sufficient alone at high doses",
      },
      aromataseInhibitor: {
        trigger: "If stacked with Test; NPP aromatizes minimally",
        dosing: "Lower than Test-only cycles; adjust based on Test dose",
        note: "NPP itself needs minimal AI; focus on prolactin management",
      },
      hcg: {
        trigger: "Strongly recommended due to severe suppression",
        dosing: "250-500 IU twice weekly throughout cycle",
        purpose: "Maintains testicular function; critical for NPP recovery",
      },
    },
  },

  trenbolone: {
    name: "Trenbolone",
    color: "#CC0000",
    abbreviation: "Tren",
    type: "injectable",
    bioavailability: 1.0,
    suppressiveFactor: 5,
    flags: { isSuppressive: true, isRenalToxic: true },
    defaultEster: "acetate",
    esters: {
      acetate: { label: "Acetate", halfLife: 24, weight: 0.87, slug: "Ace" },
      enanthate: {
        label: "Enanthate",
        halfLife: 108,
        weight: 0.7,
        slug: "Enanthate",
      },
      hexahydro: {
        label: "Hexahydrobenzylcarbonate",
        halfLife: 144,
        weight: 0.68,
        slug: "Parabolan",
      },
    },
    category: "androgen",
    pathway: "ar_genomic",
    bindingAffinity: "very_high",
    biomarkers: {
      shbg: -1,
      igf1: +3,
      rbc: +3,
      cortisol: -3,
      prolactin: +2,
      neurotoxicity: 3,
      renal_toxicity: 3, // High renal stress
    },
    halfLife: 48,
    modelConfidence: 0.54,
    benefitCurve: [
      { dose: 0, value: 0.0 },
      { dose: 200, value: 3.67, tier: "Tier 3", source: "Yarrow HED", ci: 0.6 },
      { dose: 400, value: 4.87, tier: "Tier 4", source: "Forum", ci: 0.63 },
      { dose: 600, value: 5.35, tier: "Tier 4", source: "Forum", ci: 0.63 },
      {
        dose: 1000,
        value: 5.85,
        tier: "Tier 4",
        source: "Extrapolated",
        ci: 0.63,
      },
    ],
    riskCurve: [
      { dose: 0, value: 0.0 },
      { dose: 200, value: 2.8, tier: "Tier 3", source: "Forum", ci: 0.6 },
      { dose: 400, value: 5.2, tier: "Tier 4", source: "Forum", ci: 0.8 },
      { dose: 600, value: 7.0, tier: "Tier 4", source: "Forum", ci: 0.8 },
      {
        dose: 1000,
        value: 12.0,
        tier: "Tier 4",
        source: "Extrapolated",
        ci: 0.9,
      },
    ],
    methodology: {
      summary: "Tier 3 (Rat data). High potency, high risk.",
    },
  },

  eq: {
    name: "EQ (Equipoise)",
    color: "#00AA00",
    abbreviation: "EQ",
    type: "injectable",
    bioavailability: 1.0,
    suppressiveFactor: 3,
    flags: { aromatization: 0.5 },
    category: "endurance",
    pathway: "ar_genomic",
    bindingAffinity: "low_moderate",
    biomarkers: {
      shbg: -1,
      igf1: +1,
      rbc: +3, // Hematocrit King
      cortisol: 0,
      prolactin: 0,
      renal_toxicity: 1, // Mild
    },
    halfLife: 336, // 14 days
    modelConfidence: 0.72,
    benefitCurve: [
      { dose: 0, value: 0.0 },
      { dose: 400, value: 1.0, tier: "Tier 2", source: "Forum", ci: 0.4 },
      { dose: 800, value: 2.0, tier: "Tier 4", source: "Forum", ci: 0.5 },
      {
        dose: 1500,
        value: 3.2,
        tier: "Tier 4",
        source: "Extrapolated",
        ci: 0.6,
      },
    ],
    riskCurve: [
      { dose: 0, value: 0.0 },
      { dose: 600, value: 1.0, tier: "Tier 4", source: "Forum", ci: 0.6 },
      { dose: 1200, value: 1.6, tier: "Tier 4", source: "Forum", ci: 0.6 },
    ],
    methodology: {
      summary: "Tier 2 (Vet data). Weak anabolic, RBC risks.",
    },
  },

  masteron: {
    name: "Masteron (Drostanolone)",
    color: "#9933FF",
    abbreviation: "Mast",
    type: "injectable",
    bioavailability: 1.0,
    suppressiveFactor: 2,
    flags: { aromatization: 0, isSuppressive: true },
    defaultEster: "propionate",
    esters: {
      propionate: {
        label: "Propionate",
        halfLife: 48,
        weight: 0.8,
        slug: "Prop",
      },
      enanthate: {
        label: "Enanthate",
        halfLife: 108,
        weight: 0.7,
        slug: "Enanthate",
      },
    },
    category: "cosmetic",
    pathway: "ar_genomic",
    bindingAffinity: "moderate",
    biomarkers: {
      shbg: -2,
      igf1: 0,
      rbc: +1,
      cortisol: 0,
      prolactin: 0,
      anti_e: +2,
      renal_toxicity: 0,
    },
    halfLife: 48,
    modelConfidence: 0.55,
    benefitCurve: [
      { dose: 0, value: 0.0 },
      { dose: 400, value: 1.2, tier: "Tier 4", source: "Forum", ci: 0.5 },
      { dose: 800, value: 1.55, tier: "Tier 4", source: "Extrapolated", ci: 0.6 },
    ],
    riskCurve: [
      { dose: 0, value: 0.0 },
      { dose: 600, value: 1.1, tier: "Tier 4", source: "Theory", ci: 0.8 },
      { dose: 1000, value: 2.0, tier: "Tier 4", source: "Extrapolated", ci: 0.8 },
    ],
    methodology: {
      summary: "Tier 4 (Cosmetic). Hardening agent.",
    },
  },

  primobolan: {
    name: "Primobolan (Methenolone)",
    color: "#996633",
    abbreviation: "Primo",
    type: "injectable",
    bioavailability: 1.0,
    suppressiveFactor: 2,
    flags: { aromatization: 0, isSuppressive: true },
    defaultEster: "enanthate",
    esters: {
      enanthate: {
        label: "Enanthate",
        halfLife: 240, // 10 days
        weight: 0.7,
        slug: "Enanthate",
      },
      acetate: {
        label: "Acetate (Oral)",
        halfLife: 6,
        weight: 0.9,
        slug: "Oral",
        bioavailability: 0.7, // Updated from 0.15 for functional modeling
      },
    },
    category: "mild",
    pathway: "ar_genomic",
    bindingAffinity: "moderate",
    biomarkers: {
      shbg: -1,
      igf1: +1,
      rbc: +1,
      cortisol: 0,
      prolactin: 0,
      renal_toxicity: 0,
    },
    halfLife: 240,
    modelConfidence: 0.59,
    benefitCurve: [
      { dose: 0, value: 0.0 },
      { dose: 400, value: 1.3, tier: "Tier 4", source: "Forum", ci: 0.5 },
      { dose: 800, value: 1.8, tier: "Tier 4", source: "Extrapolated", ci: 0.6 },
    ],
    riskCurve: [
      { dose: 0, value: 0.0 },
      { dose: 400, value: 0.6, tier: "Tier 4", source: "Theory", ci: 0.5 },
      { dose: 800, value: 1.2, tier: "Tier 4", source: "Extrapolated", ci: 0.8 },
    ],
    methodology: {
      summary: "Tier 2. Mild, safe, expensive.",
    },
  },

  dianabol: {
    name: "Dianabol (Methandrostenolone)",
    color: "#FF1493",
    abbreviation: "Dbol",
    type: "oral",
    toxicityTier: 2,
    bioavailability: 0.8,
    suppressiveFactor: 3,
    flags: { aromatization: 2.0, isHeavyBP: true, createsMethylEstrogen: true },
    defaultEster: "oral",
    esters: {
      oral: { label: "Oral Tablet", halfLife: 4, weight: 1.0, slug: "Tab" },
    },
    category: "oral_kickstart",
    pathway: "non_genomic",
    bindingAffinity: "low",
    biomarkers: {
      shbg: -1,
      igf1: +2,
      rbc: +1,
      cortisol: -1,
      prolactin: 0,
      aromatization: +3,
      renal_toxicity: 1,
    },
    halfLife: 4,
    modelConfidence: 0.63,
    benefitCurve: [
      { dose: 0, value: 0.0 },
      { dose: 20, value: 2.3, tier: "Tier 4", source: "Forum", ci: 0.6 },
      { dose: 50, value: 3.4, tier: "Tier 4", source: "Anecdotal", ci: 0.8 },
    ],
    riskCurve: [
      { dose: 0, value: 0.0 },
      { dose: 20, value: 0.8, tier: "Tier 4", source: "Forum", ci: 0.6 },
      { dose: 50, value: 2.8, tier: "Tier 4", source: "Anecdotal", ci: 0.9 },
    ],
  },

  anadrol: {
    name: "Anadrol (Oxymetholone)",
    color: "#DC143C",
    abbreviation: "Adrol",
    type: "oral",
    toxicityTier: 3.5, // Upped from 3, functionally peer to Sdrol in high dose
    bioavailability: 0.85,
    suppressiveFactor: 3,
    flags: { aromatization: 0.5, isHeavyBP: true },
    defaultEster: "oral",
    esters: {
      oral: { label: "Oral Tablet", halfLife: 9, weight: 1.0, slug: "Tab" },
    },
    category: "oral_mass",
    pathway: "non_genomic",
    bindingAffinity: "very_low",
    biomarkers: {
      shbg: -2,
      igf1: +2,
      rbc: +3,
      cortisol: 0,
      prolactin: 0,
      estrogenic_activity: +3, // Non-aromatizing estrogenicity
      renal_toxicity: 2,
    },
    halfLife: 9,
    modelConfidence: 0.31,
    benefitCurve: [
      { dose: 0, value: 0.0 },
      { dose: 50, value: 3.2, tier: "Tier 4", source: "Forum", ci: 0.6 },
      { dose: 100, value: 4.3, tier: "Tier 4", source: "Anecdotal", ci: 0.8 },
    ],
    riskCurve: [
      { dose: 0, value: 0.0 },
      { dose: 50, value: 1.8, tier: "Tier 4", source: "Forum", ci: 0.7 },
      { dose: 100, value: 3.5, tier: "Tier 4", source: "Anecdotal", ci: 0.9 },
    ],
  },

  winstrol: {
    name: "Winstrol (Stanozolol)",
    color: "#4169E1",
    abbreviation: "Winny",
    type: "oral",
    toxicityTier: 2,
    bioavailability: 0.8,
    suppressiveFactor: 2,
    flags: { aromatization: 0, isSuppressive: true },
    defaultEster: "oral",
    esters: {
      oral: { label: "Oral Tablet", halfLife: 9, weight: 1.0, slug: "Tab" },
    },
    category: "oral_cutting",
    pathway: "non_genomic",
    bindingAffinity: "low",
    biomarkers: {
      shbg: -3, // CRITICAL: SHBG Crusher
      igf1: -1,
      rbc: +1,
      cortisol: 0,
      joints: -3,
      renal_toxicity: 1,
    },
    halfLife: 9,
    modelConfidence: 0.4,
    benefitCurve: [
      { dose: 0, value: 0.0 },
      { dose: 50, value: 1.5, tier: "Tier 4", source: "Forum", ci: 0.6 },
      { dose: 100, value: 1.9, tier: "Tier 4", source: "Anecdotal", ci: 0.7 },
    ],
    riskCurve: [
      { dose: 0, value: 0.0 },
      { dose: 50, value: 1.4, tier: "Tier 4", source: "Forum", ci: 0.7 },
      { dose: 100, value: 3.0, tier: "Tier 4", source: "Anecdotal", ci: 0.9 },
    ],
  },

  anavar: {
    name: "Anavar (Oxandrolone)",
    color: "#FF6347",
    abbreviation: "Var",
    type: "oral",
    toxicityTier: 1,
    bioavailability: 0.8,
    suppressiveFactor: 2,
    flags: { aromatization: 0, isSuppressive: true },
    defaultEster: "oral",
    esters: {
      oral: { label: "Oral Tablet", halfLife: 9, weight: 1.0, slug: "Tab" },
    },
    category: "oral_mild",
    pathway: "ar_genomic",
    bindingAffinity: "low",
    biomarkers: {
      shbg: -1,
      igf1: +1,
      rbc: +1,
      cortisol: -1,
      prolactin: 0,
      renal_toxicity: 1, // Stressful on kidneys long term
    },
    halfLife: 9,
    modelConfidence: 0.48,
    benefitCurve: [
      { dose: 0, value: 0.0 },
      { dose: 50, value: 1.2, tier: "Tier 4", source: "Forum", ci: 0.5 },
      { dose: 100, value: 1.8, tier: "Tier 4", source: "Anecdotal", ci: 0.6 },
    ],
    riskCurve: [
      { dose: 0, value: 0.0 },
      { dose: 50, value: 0.7, tier: "Tier 4", source: "Forum", ci: 0.6 },
      { dose: 100, value: 1.8, tier: "Tier 4", source: "Anecdotal", ci: 0.7 },
    ],
  },

  halotestin: {
    name: "Halotestin (Fluoxymesterone)",
    color: "#8B0000",
    abbreviation: "Halo",
    type: "oral",
    toxicityTier: 4,
    bioavailability: 0.8,
    suppressiveFactor: 4,
    flags: { aromatization: 0, isSuppressive: true, isLiverToxic: true },
    defaultEster: "oral",
    esters: {
      oral: { label: "Oral Tablet", halfLife: 9.2, weight: 1.0, slug: "Tab" },
    },
    category: "oral_extreme",
    pathway: "non_genomic",
    bindingAffinity: "low",
    biomarkers: {
      shbg: -2,
      igf1: 0,
      rbc: +3,
      cortisol: 0,
      prolactin: 0,
      cns_drive: +3,
      neurotoxicity: 3,
      renal_toxicity: 2,
    },
    halfLife: 9.2, // Corrected from 96h
    modelConfidence: 0.67,
    benefitCurve: [
      { dose: 0, value: 0.0 },
      { dose: 20, value: 3.0, tier: "Tier 4", source: "Forum", ci: 0.8 },
      { dose: 40, value: 3.7, tier: "Tier 4", source: "Anecdotal", ci: 0.9 },
    ],
    riskCurve: [
      { dose: 0, value: 0.0 },
      { dose: 20, value: 3.5, tier: "Tier 4", source: "Forum", ci: 0.9 },
      {
        dose: 40,
        value: 5.2,
        tier: "Tier 4",
        source: "Anecdotal",
        ci: 1.0,
      }, // Dangerous
    ],
  },

  proviron: {
    name: "Proviron (Mesterolone)",
    color: "#60A5FA",
    abbreviation: "Prov",
    type: "oral",
    toxicityTier: 0,
    bioavailability: 0.05,
    suppressiveFactor: 1,
    flags: { aromatization: 0, isSuppressive: true },
    defaultEster: "oral",
    esters: {
      oral: { label: "Oral Tablet", halfLife: 12, weight: 1.0, slug: "Tab" },
    },
    category: "support",
    pathway: "ar_genomic",
    bindingAffinity: "very_high",
    biomarkers: {
      shbg: -3,
      igf1: 0,
      rbc: +1,
      cortisol: 0,
      prolactin: 0,
      libido: +3,
      renal_toxicity: 0,
    },
    halfLife: 12,
    modelConfidence: 0.85,
    benefitCurve: [
      { dose: 0, value: 0 },
      { dose: 50, value: 0.8 },
      { dose: 100, value: 0.9 },
    ],
    riskCurve: [
      { dose: 0, value: 0 },
      { dose: 50, value: 0.2 },
      { dose: 100, value: 0.4 },
    ],
  },

  turinabol: {
    name: "Turinabol (CDMT)",
    color: "#F472B6",
    abbreviation: "Tbol",
    type: "oral",
    toxicityTier: 2,
    bioavailability: 0.85,
    suppressiveFactor: 2,
    flags: { aromatization: 0, isSuppressive: true },
    defaultEster: "oral",
    esters: {
      oral: { label: "Oral Tablet", halfLife: 16, weight: 1.0, slug: "Tab" },
    },
    category: "oral_performance",
    pathway: "non_genomic",
    bindingAffinity: "low",
    biomarkers: {
      shbg: -2,
      igf1: +1,
      rbc: +1,
      cortisol: 0,
      prolactin: 0,
      renal_toxicity: 1,
    },
    halfLife: 16,
    modelConfidence: 0.65,
    benefitCurve: [
      { dose: 0, value: 0 },
      { dose: 40, value: 2.0 },
      { dose: 80, value: 2.8 },
    ],
    riskCurve: [
      { dose: 0, value: 0 },
      { dose: 40, value: 1.2 },
      { dose: 80, value: 2.5 },
    ],
  },

  superdrol: {
    name: "Superdrol (Methasterone)",
    color: "#9F1239",
    abbreviation: "Sdrol",
    type: "oral",
    toxicityTier: 4,
    bioavailability: 0.85,
    suppressiveFactor: 4,
    flags: { aromatization: 0, isSuppressive: true, isLiverToxic: true },
    defaultEster: "oral",
    esters: {
      oral: { label: "Oral Tablet", halfLife: 8, weight: 1.0, slug: "Tab" },
    },
    category: "oral_mass",
    pathway: "non_genomic",
    bindingAffinity: "low",
    biomarkers: {
      shbg: -2,
      igf1: +2,
      rbc: +2,
      cortisol: 0,
      prolactin: 0,
      liver_toxicity: +3,
      renal_toxicity: 2,
    },
    halfLife: 8,
    modelConfidence: 0.4,
    benefitCurve: [
      { dose: 0, value: 0 },
      { dose: 20, value: 4.5 },
      { dose: 40, value: 4.9 },
    ],
    riskCurve: [
      { dose: 0, value: 0 },
      { dose: 20, value: 4.5 },
      { dose: 40, value: 8.0 },
    ],
  },

  ment: {
    name: "Ment (Trestolone)",
    color: "#701a75",
    abbreviation: "Ment",
    type: "injectable",
    bioavailability: 1.0,
    suppressiveFactor: 5,
    flags: { aromatization: 3.0, isSuppressive: true },
    defaultEster: "acetate",
    esters: {
      acetate: { label: "Acetate", halfLife: 24, weight: 0.87, slug: "Ace" },
      enanthate: {
        label: "Enanthate",
        halfLife: 108,
        weight: 0.7,
        slug: "Enanthate",
      },
    },
    category: "mass_monster",
    pathway: "ar_genomic",
    bindingAffinity: "very_high",
    biomarkers: {
      shbg: -1,
      igf1: +3,
      rbc: +2,
      cortisol: -2,
      prolactin: +2,
      e2_conversion: +3,
      renal_toxicity: 1,
    },
    halfLife: 24,
    modelConfidence: 0.7,
    benefitCurve: [
      { dose: 0, value: 0 },
      { dose: 50, value: 3.0 },
      { dose: 100, value: 4.5 },
    ],
    riskCurve: [
      { dose: 0, value: 0 },
      { dose: 50, value: 2.0 },
      { dose: 100, value: 4.0 },
    ],
  },

  dhb: {
    name: "DHB (1-Testosterone)",
    color: "#b45309",
    abbreviation: "DHB",
    type: "injectable",
    bioavailability: 1.0,
    suppressiveFactor: 3,
    flags: { aromatization: 0, isSuppressive: true },
    defaultEster: "cypionate",
    esters: {
      cypionate: {
        label: "Cypionate",
        halfLife: 120,
        weight: 0.7,
        slug: "Cyp",
      },
      propionate: {
        label: "Propionate",
        halfLife: 24,
        weight: 0.83,
        slug: "Prop",
      },
    },
    category: "dry_mass",
    pathway: "ar_genomic",
    bindingAffinity: "high",
    biomarkers: {
      shbg: -1,
      igf1: +1,
      rbc: +1,
      cortisol: 0,
      prolactin: 0,
      pip: +5,
      renal_toxicity: 4, // Anecdotal renal stress high
    },
    halfLife: 120,
    modelConfidence: 0.6,
    benefitCurve: [
      { dose: 0, value: 0 },
      { dose: 400, value: 3.5 },
      { dose: 800, value: 4.5 },
    ],
    riskCurve: [
      { dose: 0, value: 0 },
      { dose: 400, value: 2.0 },
      { dose: 800, value: 4.5 },
    ],
  },

  // --- ANCILLARIES ---

  arimidex: {
    name: "Arimidex (Anastrozole)",
    color: "#6B7280",
    abbreviation: "Adex",
    type: "oral",
    toxicityTier: 0,
    bioavailability: 0.85,
    suppressiveFactor: 0,
    flags: { isAI: true },
    defaultEster: "oral",
    esters: {
      oral: { label: "Tablet", halfLife: 48, weight: 1.0, slug: "Tab" },
    },
    category: "ancillary",
    pathway: "enzyme_inhibitor",
    bindingAffinity: "none",
    biomarkers: { e2_control: +5, renal_toxicity: 0 },
    halfLife: 48, // 2 days
    modelConfidence: 0.95,
    benefitCurve: [
      { dose: 0, value: 0 },
      { dose: 1, value: 1 },
    ],
    riskCurve: [
      { dose: 0, value: 0 },
      { dose: 1, value: 0.5 },
    ],
  },

  finasteride: {
    name: "Finasteride (Propecia)",
    color: "#6B7280", // Cool Gray
    abbreviation: "Fin",
    type: "oral",
    toxicityTier: 0,
    bioavailability: 0.65,
    suppressiveFactor: 0,
    flags: { is5AR: true, contraindicated: ["nandrolone"] },
    defaultEster: "oral",
    esters: {
      oral: { label: "Tablet", halfLife: 6, weight: 1.0, slug: "Tab" },
    },
    category: "ancillary",
    pathway: "enzyme_inhibitor",
    bindingAffinity: "none",
    biomarkers: {
      shbg: 0,
      igf1: 0,
      rbc: 0,
      cortisol: 0,
      prolactin: 0,
      dht_inhibition: +5,
      renal_toxicity: 0,
    },
    halfLife: 6,
    modelConfidence: 0.95,
    benefitCurve: [
      { dose: 0, value: 0 },
      { dose: 1, value: 1 },
    ],
    riskCurve: [
      { dose: 0, value: 0 },
      { dose: 1, value: 0.5 },
    ],
    methodology: {
      summary:
        "5-Alpha Reductase Inhibitor. Blocks conversion of Test to DHT (Hair Safe). Contraindicated with Nandrolone. Blocking 5AR prevents conversion to DHN (a weaker androgen), leaving the more androgenic parent hormone.",
      sources: ["Clinical trials (Propecia)", "Community logs"],
    },
    sideEffectProfile: { common: [], lipidProfile: {}, cardiovascular: {}, hpta: {} },
    ancillaryRequirements: {},
  },

  nolvadex: {
    name: "Nolvadex (Tamoxifen)",
    color: "#6B7280",
    abbreviation: "Nolva",
    type: "oral",
    toxicityTier: 1,
    bioavailability: 1.0,
    suppressiveFactor: 0,
    flags: { isSERM: true },
    defaultEster: "oral",
    esters: {
      oral: { label: "Tablet", halfLife: 120, weight: 1.0, slug: "Tab" },
    },
    category: "ancillary",
    pathway: "serm",
    bindingAffinity: "none",
    biomarkers: {
      e2_receptor: -5, // Blocks E2 at tissue
      igf1: -1, // Lowers IGF-1
      shbg: +1,
      renal_toxicity: 0,
    },
    halfLife: 120, // 5-7 days
    modelConfidence: 0.95,
    benefitCurve: [
      { dose: 0, value: 0 },
      { dose: 20, value: 1 },
    ],
    riskCurve: [
      { dose: 0, value: 0 },
      { dose: 20, value: 0.2 },
    ],
  },

  clomid: {
    name: "Clomid (Clomiphene)",
    color: "#6B7280",
    abbreviation: "Clomid",
    type: "oral",
    toxicityTier: 1,
    bioavailability: 1.0,
    suppressiveFactor: 0,
    flags: { isSERM: true },
    defaultEster: "oral",
    esters: {
      oral: { label: "Tablet", halfLife: 120, weight: 1.0, slug: "Tab" },
    },
    category: "ancillary",
    pathway: "serm",
    bindingAffinity: "none",
    biomarkers: {
      lh_fsh: +5, // PCT driver
      e2_receptor: -3,
      vision_sides: +2,
      renal_toxicity: 0,
    },
    halfLife: 120, // 5 days
    modelConfidence: 0.95,
    benefitCurve: [
      { dose: 0, value: 0 },
      { dose: 50, value: 1 },
    ],
    riskCurve: [
      { dose: 0, value: 0 },
      { dose: 50, value: 0.5 },
    ],
  },

  hcg: {
    name: "HCG",
    color: "#6B7280",
    abbreviation: "HCG",
    type: "injectable",
    toxicityTier: 0,
    bioavailability: 1.0,
    suppressiveFactor: -1, // Stimulatory
    flags: { isGonadotropin: true },
    defaultEster: "none",
    esters: {
      none: { label: "Standard", halfLife: 36, weight: 1.0, slug: "HCG" },
    },
    category: "ancillary",
    pathway: "lh_mimetic",
    bindingAffinity: "none",
    biomarkers: {
      testicular_function: +5,
      e2_conversion: +1, // Intratesticular aromatization
      renal_toxicity: 0,
    },
    halfLife: 36, // 1.5 days
    modelConfidence: 0.9,
    benefitCurve: [
      { dose: 0, value: 0 },
      { dose: 500, value: 1 },
    ],
    riskCurve: [
      { dose: 0, value: 0 },
      { dose: 500, value: 0.1 },
    ],
  },

  cabergoline: {
    name: "Cabergoline (Dostinex)",
    color: "#6B7280",
    abbreviation: "Caber",
    type: "oral",
    toxicityTier: 1,
    bioavailability: 1.0,
    suppressiveFactor: 0,
    flags: { isDopamineAgonist: true },
    defaultEster: "oral",
    esters: {
      oral: { label: "Tablet", halfLife: 69, weight: 1.0, slug: "Tab" },
    },
    category: "ancillary",
    pathway: "receptor_agonist",
    bindingAffinity: "none",
    biomarkers: {
      prolactin: -5, // Crushes Prolactin
      dopamine: +2,
      renal_toxicity: 0,
    },
    halfLife: 69, // ~3 days
    modelConfidence: 0.9,
    benefitCurve: [
      { dose: 0, value: 0 },
      { dose: 0.5, value: 1 },
    ],
    riskCurve: [
      { dose: 0, value: 0 },
      { dose: 0.5, value: 0.2 },
    ],
  },
};

const derivePlateauDose = (curve = []) => {
  if (!curve.length) return 0;
  if (curve.length === 1) return curve[0].dose;
  return (
    curve[Math.max(0, curve.length - 2)].dose ??
    curve[curve.length - 1].dose ??
    0
  );
};

Object.values(compoundData).forEach((compound) => {
  if (compound.plateauDose == null) {
    compound.plateauDose = derivePlateauDose(compound.benefitCurve);
  }
  if (compound.hardMax == null) {
    const benefitCap =
      compound.benefitCurve?.[compound.benefitCurve.length - 1]?.dose ?? 0;
    const riskCap =
      compound.riskCurve?.[compound.riskCurve.length - 1]?.dose ?? 0;
    compound.hardMax = Math.max(benefitCap, riskCap, compound.plateauDose || 0);
  }
});

export const doseRange = [0, 100, 200, 300, 400, 500, 600, 800, 1000, 1200];

export const tierDescriptions = {
  "Tier 0": "Baseline (no AAS use)",
  "Tier 1":
    "Empirical Human Data - Randomized controlled trials in human subjects at specific doses",
  "Tier 2":
    "Clinical/Therapeutic Human Data - Human data at therapeutic doses, extrapolated to supraphysio via pharmacological modeling",
  "Tier 3":
    "Animal Studies + HED Scaling - Animal dose-response studies converted to human equivalent dose",
  "Tier 4":
    "Mechanism + Anecdotal Patterns - Pharmacological theory + aggregated community reports (high uncertainty)",
};

export const disclaimerText = `HARM REDUCTION MODELING, NOT MEDICAL ADVICE

This tool visualizes dose-response relationships based on limited human data, animal studies, and community patterns. It is educational only and does not constitute medical, pharmaceutical, or health advice.

• These compounds are controlled substances in most jurisdictions.
• Individual responses vary widely (±20-30% typical); your response may differ.
• Risk curves are modeled, not empirically measured, at most doses.
• Consult a healthcare provider before using AAS.
• This tool assumes proper ancillary use, training, diet, and baseline health.`;