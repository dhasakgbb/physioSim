/**
 * Complete AAS Dose-Response Data (2025 Standard)
 * Refactored for Linear Simulation Engine: Signal-vs-Drag Model
 *
 * SCORING LEGEND (0-10 Scale):
 * 0 = None / Negligible
 * 5 = Moderate / Baseline (Testosterone Reference)
 * 10 = Extreme / Maximum Possible
 *
 * DATA STRUCTURES:
 * - pathways: Biological mechanisms of action (The "How")
 * - metabolic: Cosmetic and fluid dynamics (The "Look")
 * - benefits: User-facing positive outcomes (The "Gains")
 * - toxicity: Organ-specific negative load (The "Cost")
 */

export const compoundData = {
  testosterone: {
    name: "Testosterone",
    color: "#0066CC",
    abbreviation: "Test",
    type: "injectable",
    // --- MATH ENGINE INPUTS ---
    basePotency: 1.0, // The Reference Standard
    saturationCeiling: 1500, // High ceiling, receptors saturate slowly
    halfLifeHours: 108, // Enanthate
    pathways: {
      ar_affinity: 5.0, // Moderate binding
      non_genomic: 5.0, // Good non-genomic signaling
      shbg_binding: 3.0, // Low-Moderate
      anti_catabolic: 5.0,
    },
    metabolic: {
      aromatization: 8.0, // High E2 conversion (Wet)
      dht_conversion: 6.0, // Moderate
      glycogen_load: 6.0,
      lipolysis: 4.0,
      diuretic_effect: 0.0,
      erythropoiesis: 6.0,
    },
    benefits: {
      contractile_growth: 6.0, // Solid builder
      sarcoplasmic_vol: 6.0, // Moderate fullness
      neural_strength: 5.0,
      joint_support: 5.0, // E2 provides lubrication
      libido: 10.0, // The King
    },
    toxicity: {
      hepatic: 1.0, // Very low
      renal: 2.0, // BP related
      neuro: 2.0, // Generally well tolerated
      lipid: 4.0, // HDL impact at high dose
      progestogenic: 0.0,
      androgenic: 6.0,
    },
    // --- LEGACY DATA (Do Not Delete yet) ---
    bioavailability: 1.0,
    suppressiveFactor: 2,
    conversionFactor: 12.0,
    flags: { aromatization: 1.0, isSuppressive: true },
    defaultEster: "enanthate",
    esters: {
      propionate: { label: "Propionate", halfLife: 19, weight: 0.83, slug: "Prop" },
      enanthate: { label: "Enanthate", halfLife: 108, weight: 0.72, slug: "Enanthate" },
      cypionate: { label: "Cypionate", halfLife: 120, weight: 0.7, slug: "Cyp" },
      sustanon: { label: "Sustanon 250", halfLife: 216, weight: 0.74, slug: "Sust", isBlend: true },
    },
    category: "base",
    biomarkers: { shbg: -1, igf1: +1, rbc: +1, cortisol: 0, prolactin: 0, neurotoxicity: 0, e2_conversion: +2, renal_toxicity: 0 },
    benefitCurve: [ /* Kept from original file */ { dose: 0, value: 0 }, { dose: 600, value: 5.0 }, { dose: 1000, value: 6.9 }, { dose: 3000, value: 10.0 } ],
    riskCurve: [ /* Kept from original file */ { dose: 0, value: 0 }, { dose: 600, value: 2.1 }, { dose: 1500, value: 6.0 } ],
  },

  nandrolone: {
    name: "Nandrolone (Deca/NPP)",
    color: "#FF9900",
    abbreviation: "Deca",
    type: "injectable",
    // --- MATH ENGINE INPUTS ---
    basePotency: 1.1, // Slightly more anabolic per mg than Test
    saturationCeiling: 800, // Saturates faster than Test
    halfLifeHours: 360, // Decanoate (Default)
    pathways: {
      ar_affinity: 8.0, // Strong binder
      non_genomic: 3.0,
      shbg_binding: 1.0, // Very low
      anti_catabolic: 8.0, // Excellent preservation
    },
    metabolic: {
      aromatization: 2.0, // Low (converts to weaker estrogen)
      dht_conversion: 0.0, // Converts to DHN (weaker)
      glycogen_load: 8.0, // Very full look
      lipolysis: 2.0, // Poor fat burner
      diuretic_effect: 0.0,
      erythropoiesis: 4.0,
    },
    benefits: {
      contractile_growth: 7.5, // Great mass builder
      sarcoplasmic_vol: 8.0,
      neural_strength: 3.0, // Poor force output (no DHT)
      joint_support: 10.0, // Best in class
      libido: 2.0, // Risk of Deca Dick
    },
    toxicity: {
      hepatic: 1.0,
      renal: 3.0, // Edema/BP risk
      neuro: 2.0, // Can cause depressive mood
      lipid: 4.0,
      progestogenic: 9.0, // Primary side effect vector
      androgenic: 3.0,
    },
    // --- LEGACY DATA ---
    bioavailability: 1.0,
    suppressiveFactor: 4,
    conversionFactor: 4.5,
    flags: { aromatization: 0.2, isSuppressive: true, createsDHN: true },
    defaultEster: "decanoate",
    esters: {
      phenylpropionate: { label: "NPP", halfLife: 60, weight: 0.67, slug: "NPP" },
      decanoate: { label: "Decanoate", halfLife: 360, weight: 0.64, slug: "Deca" },
    },
    category: "progestin",
    biomarkers: { shbg: -1, igf1: +1, rbc: +1, cortisol: -1, prolactin: +3, hair_safe: +2, neurotoxicity: 2, renal_toxicity: 1 },
    benefitCurve: [ { dose: 0, value: 0 }, { dose: 400, value: 3.15 }, { dose: 800, value: 3.65 } ],
    riskCurve: [ { dose: 0, value: 0 }, { dose: 600, value: 3.0 }, { dose: 1000, value: 6.5 } ],
  },

  trenbolone: {
    name: "Trenbolone",
    color: "#CC0000",
    abbreviation: "Tren",
    type: "injectable",
    // --- MATH ENGINE INPUTS ---
    basePotency: 2.5, // 5x Androgenic, 5x Anabolic (Theoretically)
    saturationCeiling: 600, // Very low ceiling (Strong affinity)
    halfLifeHours: 24, // Acetate
    pathways: {
      ar_affinity: 10.0, // Maximum binding
      non_genomic: 4.0,
      shbg_binding: 5.0,
      anti_catabolic: 10.0, // Cortisol blocker
    },
    metabolic: {
      aromatization: 0.0,
      dht_conversion: 0.0, // Is a 19-nor, but behaves androgenic
      glycogen_load: 9.0, // Carb loading is insane
      lipolysis: 10.0, // Nutrient partitioning king
      diuretic_effect: 2.0, // Dries you out
      erythropoiesis: 7.0,
    },
    benefits: {
      contractile_growth: 9.0,
      sarcoplasmic_vol: 4.0, // Hard look, not "puffy"
      neural_strength: 9.0, // Aggression
      joint_support: 1.0, // Joints feel brittle
      libido: 7.0, // High initially, crashes later
    },
    toxicity: {
      hepatic: 3.0,
      renal: 7.0, // High kidney stress (BP + direct)
      neuro: 9.5, // The limiting factor (Anxiety, Insomnia)
      lipid: 8.0, // Destroys HDL
      progestogenic: 7.0, // Prolactin risk
      androgenic: 10.0,
    },
    // --- LEGACY DATA ---
    bioavailability: 1.0,
    suppressiveFactor: 5,
    conversionFactor: 5.0,
    flags: { isSuppressive: true, isRenalToxic: true },
    defaultEster: "acetate",
    esters: {
      acetate: { label: "Acetate", halfLife: 24, weight: 0.87, slug: "Ace" },
      enanthate: { label: "Enanthate", halfLife: 108, weight: 0.7, slug: "Enanthate" },
      hexahydro: { label: "Parabolan", halfLife: 144, weight: 0.68, slug: "Parabolan" },
    },
    category: "androgen",
    biomarkers: { shbg: -1, igf1: +3, rbc: +3, cortisol: -3, prolactin: +2, neurotoxicity: 3, renal_toxicity: 3 },
    benefitCurve: [ { dose: 0, value: 0 }, { dose: 400, value: 4.87 }, { dose: 1000, value: 5.85 } ],
    riskCurve: [ { dose: 0, value: 0 }, { dose: 400, value: 5.2 }, { dose: 1000, value: 12.0 } ],
  },

  primobolan: {
    name: "Primobolan (Methenolone)",
    color: "#996633",
    abbreviation: "Primo",
    type: "injectable",
    // --- MATH ENGINE INPUTS ---
    basePotency: 0.6, // Weak per mg
    saturationCeiling: 1200, // Can run high doses
    halfLifeHours: 240, // Enanthate
    pathways: {
      ar_affinity: 6.0,
      non_genomic: 2.0,
      shbg_binding: 6.0, // Decent binding
      anti_catabolic: 4.0,
    },
    metabolic: {
      aromatization: 0.0,
      dht_conversion: 0.0, // Is a DHT derivative already
      glycogen_load: 4.0,
      lipolysis: 6.0,
      diuretic_effect: 3.0,
      erythropoiesis: 1.5,
    },
    benefits: {
      contractile_growth: 5.0, // Slow, steady quality
      sarcoplasmic_vol: 2.0, // Very flat/dry
      neural_strength: 4.0,
      joint_support: 4.0,
      libido: 4.0,
    },
    toxicity: {
      hepatic: 1.0, // Very low
      renal: 1.0,
      neuro: 1.0, // Feel great
      lipid: 2.0, // Mild
      progestogenic: 0.0,
      androgenic: 2.0,
    },
    // --- LEGACY DATA ---
    bioavailability: 1.0,
    suppressiveFactor: 2,
    conversionFactor: 3.0,
    flags: { aromatization: 0, isSuppressive: true },
    defaultEster: "enanthate",
    esters: {
      enanthate: { label: "Enanthate", halfLife: 240, weight: 0.7, slug: "Enanthate" },
      acetate: { label: "Oral Acetate", halfLife: 6, weight: 0.9, slug: "Oral", bioavailability: 0.7 },
    },
    category: "mild",
    benefitCurve: [ { dose: 0, value: 0 }, { dose: 800, value: 1.8 } ],
    riskCurve: [ { dose: 0, value: 0 }, { dose: 800, value: 1.2 } ],
  },

  masteron: {
    name: "Masteron (Drostanolone)",
    color: "#9933FF",
    abbreviation: "Mast",
    type: "injectable",
    // --- MATH ENGINE INPUTS ---
    basePotency: 0.6,
    saturationCeiling: 800,
    halfLifeHours: 48, // Propionate
    pathways: {
      ar_affinity: 5.0,
      non_genomic: 2.0,
      shbg_binding: 9.0, // FORCE MULTIPLIER (Frees up Test)
      anti_catabolic: 3.0,
    },
    metabolic: {
      aromatization: 0.0,
      dht_conversion: 0.0, // Is DHT
      glycogen_load: 2.0,
      lipolysis: 6.0,
      diuretic_effect: 8.0, // Very dry
      erythropoiesis: 1.0,
    },
    benefits: {
      contractile_growth: 4.0, // Weak builder alone
      sarcoplasmic_vol: 1.0,
      neural_strength: 7.0, // Good CNS drive
      joint_support: 1.0, // Dry joints
      libido: 8.0,
    },
    toxicity: {
      hepatic: 1.0,
      renal: 2.0,
      neuro: 4.0, // Some aggression
      lipid: 6.0, // Hits HDL
      progestogenic: 0.0,
      androgenic: 7.0,
    },
    // --- LEGACY DATA ---
    bioavailability: 1.0,
    suppressiveFactor: 2,
    conversionFactor: 3.0,
    flags: { aromatization: 0, isSuppressive: true },
    defaultEster: "propionate",
    esters: {
      propionate: { label: "Propionate", halfLife: 48, weight: 0.8, slug: "Prop" },
      enanthate: { label: "Enanthate", halfLife: 108, weight: 0.7, slug: "Enanthate" },
    },
    category: "cosmetic",
    benefitCurve: [ { dose: 0, value: 0 }, { dose: 800, value: 1.55 } ],
    riskCurve: [ { dose: 0, value: 0 }, { dose: 1000, value: 2.0 } ],
  },

  eq: {
    name: "EQ (Equipoise)",
    color: "#00AA00",
    abbreviation: "EQ",
    type: "injectable",
    // --- MATH ENGINE INPUTS ---
    basePotency: 0.5, // Weak per mg
    saturationCeiling: 1200,
    halfLifeHours: 336,
    pathways: {
      ar_affinity: 4.0,
      non_genomic: 3.0,
      shbg_binding: 2.0,
      anti_catabolic: 4.0,
    },
    metabolic: {
      aromatization: 4.0, // Converts to E1 (Estrone) mostly
      dht_conversion: 2.0,
      glycogen_load: 5.0,
      lipolysis: 5.0,
      diuretic_effect: 0.0,
      erythropoiesis: 9.0,
    },
    benefits: {
      contractile_growth: 5.0,
      sarcoplasmic_vol: 5.0,
      neural_strength: 4.0,
      joint_support: 5.0,
      libido: 5.0,
    },
    toxicity: {
      hepatic: 1.0,
      renal: 6.0, // Hematocrit (RBC) Risk
      neuro: 6.0, // Anxiety is common (GABA pathway)
      lipid: 3.0,
      progestogenic: 0.0,
      androgenic: 5.0,
    },
    // --- LEGACY DATA ---
    bioavailability: 1.0,
    suppressiveFactor: 3,
    conversionFactor: 3.0,
    flags: { aromatization: 0.5 },
    category: "endurance",
    biomarkers: { shbg: -1, igf1: +1, rbc: +3, cortisol: 0, prolactin: 0, renal_toxicity: 1 },
    benefitCurve: [ { dose: 0, value: 0 }, { dose: 800, value: 2.0 } ],
    riskCurve: [ { dose: 0, value: 0 }, { dose: 1200, value: 1.6 } ],
  },

  dianabol: {
    name: "Dianabol",
    color: "#FF1493",
    abbreviation: "Dbol",
    type: "oral",
    // --- MATH ENGINE INPUTS ---
    basePotency: 1.8, // Very strong per mg
    saturationCeiling: 50, // Low ceiling (Oral)
    halfLifeHours: 4,
    pathways: {
      ar_affinity: 3.0, // Weak binder
      non_genomic: 8.0, // Rapid signaling
      shbg_binding: 4.0,
      anti_catabolic: 6.0,
    },
    metabolic: {
      aromatization: 9.0, // Methyl-Estradiol (Potent)
      dht_conversion: 0.0,
      glycogen_load: 9.0, // Water/Carb retention
      lipolysis: 1.0,
      diuretic_effect: 0.0,
      erythropoiesis: 5.0,
    },
    benefits: {
      contractile_growth: 6.0,
      sarcoplasmic_vol: 9.0, // The "Dbol Pump"
      neural_strength: 6.0,
      joint_support: 8.0, // Water cushion
      libido: 7.0,
    },
    toxicity: {
      hepatic: 6.0, // Methylated
      renal: 5.0, // BP spikes from water
      neuro: 3.0, // Feel good usually
      lipid: 7.0,
      progestogenic: 0.0,
      androgenic: 5.0,
    },
    // --- LEGACY DATA ---
    toxicityTier: 2,
    bioavailability: 0.8,
    suppressiveFactor: 3,
    conversionFactor: 0,
    flags: { aromatization: 2.0, isHeavyBP: true, createsMethylEstrogen: true },
    defaultEster: "oral",
    esters: { oral: { label: "Oral Tablet", halfLife: 4, weight: 1.0, slug: "Tab" } },
    category: "oral_kickstart",
    benefitCurve: [ { dose: 0, value: 0 }, { dose: 50, value: 3.4 } ],
    riskCurve: [ { dose: 0, value: 0 }, { dose: 50, value: 2.8 } ],
  },

  anadrol: {
    name: "Anadrol (Oxymetholone)",
    color: "#DC143C",
    abbreviation: "Adrol",
    type: "oral",
    // --- MATH ENGINE INPUTS ---
    basePotency: 2.2,
    saturationCeiling: 100, // Can handle higher mg than Dbol
    halfLifeHours: 9,
    pathways: {
      ar_affinity: 2.0, // Very low
      non_genomic: 10.0, // Massive non-genomic effect
      shbg_binding: 2.0,
      anti_catabolic: 5.0,
    },
    metabolic: {
      aromatization: 0.0, // Does not convert, but activates E receptor
      dht_conversion: 0.0,
      glycogen_load: 10.0, // Maximum fullness
      lipolysis: 3.0,
      diuretic_effect: 0.0,
      erythropoiesis: 10.0,
    },
    benefits: {
      contractile_growth: 7.0,
      sarcoplasmic_vol: 10.0, // "Blowing up"
      neural_strength: 9.0, // Leverage strength
      joint_support: 8.0,
      libido: 5.0,
    },
    toxicity: {
      hepatic: 8.0, // Toxic
      renal: 8.0, // Massive BP spikes
      neuro: 6.0, // Headaches, lethargy
      lipid: 9.0, // Crushes HDL
      progestogenic: 0.0,
      androgenic: 8.0,
    },
    // --- LEGACY DATA ---
    toxicityTier: 3.5,
    bioavailability: 0.85,
    suppressiveFactor: 3,
    conversionFactor: 0,
    flags: { aromatization: 0.5, isHeavyBP: true },
    defaultEster: "oral",
    esters: { oral: { label: "Oral Tablet", halfLife: 9, weight: 1.0, slug: "Tab" } },
    category: "oral_mass",
    benefitCurve: [ { dose: 0, value: 0 }, { dose: 100, value: 4.3 } ],
    riskCurve: [ { dose: 0, value: 0 }, { dose: 100, value: 3.5 } ],
  },

  winstrol: {
    name: "Winstrol (Stanozolol)",
    color: "#4169E1",
    abbreviation: "Winny",
    type: "oral",
    // --- MATH ENGINE INPUTS ---
    basePotency: 1.5,
    saturationCeiling: 60,
    halfLifeHours: 9,
    pathways: {
      ar_affinity: 3.0,
      non_genomic: 5.0,
      shbg_binding: 9.0, // SHBG Crusher
      anti_catabolic: 2.0,
    },
    metabolic: {
      aromatization: 0.0,
      dht_conversion: 0.0,
      glycogen_load: 1.0, // Flat
      lipolysis: 6.0,
      diuretic_effect: 9.0, // Very Dry
      erythropoiesis: 2.0,
    },
    benefits: {
      contractile_growth: 4.0,
      sarcoplasmic_vol: 1.0,
      neural_strength: 7.0,
      joint_support: 1.0, // PAINFUL JOINTS
      libido: 5.0,
    },
    toxicity: {
      hepatic: 8.0, // High liver stress
      renal: 4.0,
      neuro: 3.0,
      lipid: 9.0, // Horrible for cholesterol
      progestogenic: 0.0,
      androgenic: 7.0,
    },
    // --- LEGACY DATA ---
    toxicityTier: 2,
    bioavailability: 0.8,
    suppressiveFactor: 2,
    conversionFactor: 0,
    flags: { aromatization: 0, isSuppressive: true },
    defaultEster: "oral",
    esters: { oral: { label: "Oral Tablet", halfLife: 9, weight: 1.0, slug: "Tab" } },
    category: "oral_cutting",
    biomarkers: { shbg: -3, igf1: -1, rbc: +1, cortisol: 0, joints: -3, renal_toxicity: 1 },
    benefitCurve: [ { dose: 0, value: 0 }, { dose: 100, value: 1.9 } ],
    riskCurve: [ { dose: 0, value: 0 }, { dose: 100, value: 3.0 } ],
  },

  turinabol: {
    name: "Turinabol (CDH-Methyltestosterone)",
    color: "#F472B6",
    abbreviation: "Tbol",
    type: "oral",
    // --- MATH ENGINE INPUTS ---
    basePotency: 0.8, // Weaker than Test mg per mg
    saturationCeiling: 80, // Moderate ceiling
    halfLifeHours: 16,
    pathways: {
      ar_affinity: 4.0,
      non_genomic: 3.0,
      shbg_binding: 4.0,
      anti_catabolic: 3.0,
    },
    metabolic: {
      aromatization: 0.0, // Does not aromatize
      dht_conversion: 0.0,
      glycogen_load: 5.0, // Decent fullness
      lipolysis: 4.0,
      diuretic_effect: 2.0,
      erythropoiesis: 3.0,
    },
    benefits: {
      contractile_growth: 5.0, // "Keepable" gains
      sarcoplasmic_vol: 4.0, // Athletic look, not bloat
      neural_strength: 5.0,
      joint_support: 5.0, // Neutral
      libido: 5.0,
    },
    toxicity: {
      hepatic: 4.0, // Mild for an oral
      renal: 2.0,
      neuro: 2.0,
      lipid: 4.0,
      progestogenic: 0.0,
      androgenic: 4.0,
    },
    // --- LEGACY DATA ---
    toxicityTier: 2,
    bioavailability: 0.85,
    suppressiveFactor: 2,
    conversionFactor: 0,
    flags: { aromatization: 0, isSuppressive: true },
    defaultEster: "oral",
    esters: { oral: { label: "Oral Tablet", halfLife: 16, weight: 1.0, slug: "Tab" } },
    category: "oral_performance",
    benefitCurve: [ { dose: 0, value: 0 }, { dose: 80, value: 2.8 } ],
    riskCurve: [ { dose: 0, value: 0 }, { dose: 80, value: 2.5 } ],
  },

  dhb: {
    name: "DHB (1-Testosterone)",
    color: "#b45309",
    abbreviation: "DHB",
    type: "injectable",
    // --- MATH ENGINE INPUTS ---
    basePotency: 2.0, // Very potent (200mg feels like 400mg Test)
    saturationCeiling: 600,
    halfLifeHours: 120, // Cypionate
    pathways: {
      ar_affinity: 8.0, // High affinity
      non_genomic: 4.0,
      shbg_binding: 3.0,
      anti_catabolic: 7.0,
    },
    metabolic: {
      aromatization: 0.0, // Dry
      dht_conversion: 0.0, // It is already 5-alpha reduced equivalent
      glycogen_load: 6.0,
      lipolysis: 8.0, // Hard/Dry look
      diuretic_effect: 4.0,
      erythropoiesis: 6.0,
    },
    benefits: {
      contractile_growth: 8.0, // Excellent builder
      sarcoplasmic_vol: 5.0,
      neural_strength: 7.0,
      joint_support: 2.0, // Can be achy
      libido: 6.0,
    },
    toxicity: {
      hepatic: 2.0,
      renal: 7.0, // Anecdotally hard on kidneys
      neuro: 4.0,
      lipid: 6.0,
      progestogenic: 0.0,
      androgenic: 8.0,
    },
    // --- LEGACY DATA ---
    bioavailability: 1.0,
    suppressiveFactor: 3,
    conversionFactor: 6.0,
    flags: { aromatization: 0, isSuppressive: true },
    defaultEster: "cypionate",
    esters: {
      cypionate: { label: "Cypionate", halfLife: 120, weight: 0.7, slug: "Cyp" },
      propionate: { label: "Propionate", halfLife: 24, weight: 0.83, slug: "Prop" },
    },
    category: "dry_mass",
    biomarkers: { pip: +5, renal_toxicity: 4 },
    benefitCurve: [ { dose: 0, value: 0 }, { dose: 800, value: 4.5 } ],
    riskCurve: [ { dose: 0, value: 0 }, { dose: 800, value: 4.5 } ],
  },

  // --- MISSING ANCILLARIES ---

  tudca: {
    name: "TUDCA",
    color: "#10b981",
    type: "support",
    basePotency: 0,
    saturationCeiling: 1500,
    halfLifeHours: 6,
    pathways: { bile_flow: 10.0, er_stress: 8.0 },
    metabolic: { insulin_sensitivity: 3.0, lipid_impact: 0.0 },
    benefits: { hepatic_shield: 10.0, cholestasis_prevention: 10.0 },
    toxicity: { hepatic: -5.0, renal: 0.0, neuro: 0.0, lipid: 1.0 },
    // Legacy-style defaults
    bioavailability: 0.9,
    suppressiveFactor: 0,
    conversionFactor: 0,
    flags: { isSupport: true },
    defaultEster: "oral",
    esters: { oral: { label: "Capsule", halfLife: 6, weight: 1.0, slug: "Cap" } },
    category: "support",
    benefitCurve: [ { dose: 0, value: 0 }, { dose: 1000, value: 1.5 } ],
    riskCurve: [ { dose: 0, value: 0 }, { dose: 1000, value: 0.1 } ],
  },

  nac: {
    name: "NAC",
    color: "#34d399",
    type: "support",
    basePotency: 0,
    saturationCeiling: 2400,
    halfLifeHours: 8,
    pathways: { glutathione_synthesis: 10.0, ros_scavenging: 8.0 },
    metabolic: { mucolytic: 5.0, kidney_support: 6.0 },
    benefits: { hepatic_shield: 6.0, renal_shield: 8.0 },
    toxicity: { hepatic: -3.0, renal: -4.0, neuro: 0.0, lipid: 0.0 },
    bioavailability: 0.9,
    suppressiveFactor: 0,
    conversionFactor: 0,
    flags: { isSupport: true },
    defaultEster: "oral",
    esters: { oral: { label: "Capsule", halfLife: 8, weight: 1.0, slug: "Cap" } },
    category: "support",
    benefitCurve: [ { dose: 0, value: 0 }, { dose: 2000, value: 1.2 } ],
    riskCurve: [ { dose: 0, value: 0 }, { dose: 2000, value: 0.1 } ],
  },

  finasteride: {
    name: "Finasteride",
    color: "#6B7280",
    type: "oral",
    basePotency: 0,
    saturationCeiling: 1,
    halfLifeHours: 6,
    pathways: { ar_affinity: 0, non_genomic: 0, shbg_binding: 0, anti_catabolic: 0 },
    metabolic: { aromatization: 0, dht_conversion: -10, glycogen_load: 0, lipolysis: 0, diuretic_effect: 0 },
    benefits: { contractile_growth: 0, sarcoplasmic_vol: 0, neural_strength: 0, joint_support: 0, libido: -2 }, // Libido hit
    toxicity: { hepatic: 0, renal: 0, neuro: 2, lipid: 0, progestogenic: 0 },
    // Legacy
    flags: { is5AR: true, contraindicated: ["nandrolone"] }, // IMPORTANT FLAG
    defaultEster: "oral",
    esters: { oral: { label: "Tablet", halfLife: 6, weight: 1.0, slug: "Tab" } },
    category: "ancillary",
    benefitCurve: [{dose: 0, value: 0}, {dose: 1, value: 1}],
    riskCurve: [{dose: 0, value: 0}, {dose: 1, value: 0.5}],
  },

  nolvadex: {
    name: "Nolvadex (Tamoxifen)",
    color: "#6B7280",
    type: "oral",
    basePotency: 0,
    saturationCeiling: 20,
    halfLifeHours: 120,
    pathways: { ar_affinity: 0, non_genomic: 0, shbg_binding: 2, anti_catabolic: 0 },
    metabolic: { aromatization: 0, dht_conversion: 0, glycogen_load: 0, lipolysis: 0, diuretic_effect: 0 },
    benefits: { contractile_growth: 0, sarcoplasmic_vol: 0, neural_strength: 0, joint_support: 0, libido: 0 },
    toxicity: { hepatic: 1, renal: 0, neuro: 1, lipid: -2, progestogenic: 0 }, // Improves Lipids
    // Legacy
    flags: { isSERM: true },
    defaultEster: "oral",
    esters: { oral: { label: "Tablet", halfLife: 120, weight: 1.0, slug: "Tab" } },
    category: "ancillary",
    benefitCurve: [{dose: 0, value: 0}, {dose: 20, value: 1}],
    riskCurve: [{dose: 0, value: 0}, {dose: 20, value: 0.2}],
  },

  clomid: {
    name: "Clomid (Clomiphene)",
    color: "#6B7280",
    type: "oral",
    basePotency: 0,
    saturationCeiling: 50,
    halfLifeHours: 120,
    pathways: { ar_affinity: 0, non_genomic: 0, shbg_binding: 2, anti_catabolic: 0 },
    metabolic: { aromatization: 0, dht_conversion: 0, glycogen_load: 0, lipolysis: 0, diuretic_effect: 0 },
    benefits: { contractile_growth: 0, sarcoplasmic_vol: 0, neural_strength: 0, joint_support: 0, libido: 0 },
    toxicity: { hepatic: 1, renal: 0, neuro: 4, lipid: 0, progestogenic: 0 }, // Vision/Mood issues
    // Legacy
    flags: { isSERM: true },
    defaultEster: "oral",
    esters: { oral: { label: "Tablet", halfLife: 120, weight: 1.0, slug: "Tab" } },
    category: "ancillary",
    benefitCurve: [{dose: 0, value: 0}, {dose: 50, value: 1}],
    riskCurve: [{dose: 0, value: 0}, {dose: 50, value: 0.5}],
  },

  hcg: {
    name: "HCG",
    color: "#6B7280",
    type: "injectable",
    basePotency: 0.1, // Mild T boost
    saturationCeiling: 1000,
    halfLifeHours: 36,
    pathways: { ar_affinity: 0, non_genomic: 0, shbg_binding: 0, anti_catabolic: 0 },
    metabolic: { aromatization: 5, dht_conversion: 0, glycogen_load: 0, lipolysis: 0, diuretic_effect: 0 }, // High intratesticular E2
    benefits: { contractile_growth: 0, sarcoplasmic_vol: 0, neural_strength: 0, joint_support: 0, libido: 6 },
    toxicity: { hepatic: 0, renal: 0, neuro: 0, lipid: 0, progestogenic: 0 },
    // Legacy
    flags: { isGonadotropin: true },
    defaultEster: "none",
    esters: { none: { label: "Standard", halfLife: 36, weight: 1.0, slug: "HCG" } },
    category: "ancillary",
    benefitCurve: [{dose: 0, value: 0}, {dose: 500, value: 1}],
    riskCurve: [{dose: 0, value: 0}, {dose: 500, value: 0.1}],
  },

  superdrol: {
    name: "Superdrol (Methasterone)",
    color: "#9F1239",
    abbreviation: "Sdrol",
    type: "oral",
    // --- MATH ENGINE INPUTS ---
    basePotency: 3.5, // Highest potency
    saturationCeiling: 30, // Very low ceiling
    halfLifeHours: 8,
    pathways: {
      ar_affinity: 6.0,
      non_genomic: 7.0,
      shbg_binding: 6.0,
      anti_catabolic: 9.0,
    },
    metabolic: {
      aromatization: 0.0,
      dht_conversion: 0.0,
      glycogen_load: 10.0, // Incredible fullness without water
      lipolysis: 5.0,
      diuretic_effect: 5.0, // Dry gain
      erythropoiesis: 6.0,
    },
    benefits: {
      contractile_growth: 9.0,
      sarcoplasmic_vol: 10.0,
      neural_strength: 8.0,
      joint_support: 5.0,
      libido: 3.0, // Lethargy kills drive
    },
    toxicity: {
      hepatic: 10.0, // FAILURE POINT
      renal: 6.0,
      neuro: 8.0, // Extreme Lethargy
      lipid: 10.0, // Worst in class
      progestogenic: 0.0,
      androgenic: 8.0,
    },
    // --- LEGACY DATA ---
    toxicityTier: 4,
    bioavailability: 0.85,
    suppressiveFactor: 4,
    conversionFactor: 0,
    flags: { aromatization: 0, isSuppressive: true, isLiverToxic: true },
    defaultEster: "oral",
    esters: { oral: { label: "Oral Tablet", halfLife: 8, weight: 1.0, slug: "Tab" } },
    category: "oral_mass",
    benefitCurve: [ { dose: 0, value: 0 }, { dose: 40, value: 4.9 } ],
    riskCurve: [ { dose: 0, value: 0 }, { dose: 40, value: 8.0 } ],
  },

  anavar: {
    name: "Anavar (Oxandrolone)",
    color: "#FF6347",
    abbreviation: "Var",
    type: "oral",
    // --- MATH ENGINE INPUTS ---
    basePotency: 1.0,
    saturationCeiling: 100,
    halfLifeHours: 9,
    pathways: {
      ar_affinity: 4.0,
      non_genomic: 3.0,
      shbg_binding: 2.0,
      anti_catabolic: 5.0,
    },
    metabolic: {
      aromatization: 0.0,
      dht_conversion: 0.0,
      glycogen_load: 4.0,
      lipolysis: 8.0, // Direct fat burning
      diuretic_effect: 4.0,
      erythropoiesis: 3.0,
    },
    benefits: {
      contractile_growth: 5.0,
      sarcoplasmic_vol: 3.0,
      neural_strength: 7.0,
      joint_support: 5.0,
      libido: 5.0,
    },
    toxicity: {
      hepatic: 2.0, // Low for oral
      renal: 5.0, // Underrated kidney stress
      neuro: 1.0,
      lipid: 6.0,
      progestogenic: 0.0,
      androgenic: 4.0,
    },
    // --- LEGACY DATA ---
    toxicityTier: 1,
    bioavailability: 0.8,
    suppressiveFactor: 2,
    conversionFactor: 0,
    flags: { aromatization: 0, isSuppressive: true },
    defaultEster: "oral",
    esters: { oral: { label: "Oral Tablet", halfLife: 9, weight: 1.0, slug: "Tab" } },
    category: "oral_mild",
    benefitCurve: [ { dose: 0, value: 0 }, { dose: 100, value: 1.8 } ],
    riskCurve: [ { dose: 0, value: 0 }, { dose: 100, value: 1.8 } ],
  },

  halotestin: {
    name: "Halotestin",
    color: "#8B0000",
    abbreviation: "Halo",
    type: "oral",
    // --- MATH ENGINE INPUTS ---
    basePotency: 2.0,
    saturationCeiling: 40,
    halfLifeHours: 9.2,
    pathways: {
      ar_affinity: 4.0,
      non_genomic: 6.0,
      shbg_binding: 8.0,
      anti_catabolic: 4.0,
    },
    metabolic: {
      aromatization: 0.0,
      dht_conversion: 0.0,
      glycogen_load: 1.0,
      lipolysis: 5.0,
      diuretic_effect: 6.0,
      erythropoiesis: 7.0,
    },
    benefits: {
      contractile_growth: 3.0, // Not for size
      sarcoplasmic_vol: 1.0,
      neural_strength: 10.0, // Pure Strength
      joint_support: 2.0,
      libido: 8.0, // Aggressive
    },
    toxicity: {
      hepatic: 9.0, // High
      renal: 6.0,
      neuro: 9.0, // Aggression/Rage
      lipid: 8.0,
      progestogenic: 0.0,
      androgenic: 10.0,
    },
    // --- LEGACY DATA ---
    toxicityTier: 4,
    bioavailability: 0.8,
    suppressiveFactor: 4,
    conversionFactor: 0,
    flags: { aromatization: 0, isSuppressive: true, isLiverToxic: true },
    defaultEster: "oral",
    esters: { oral: { label: "Oral Tablet", halfLife: 9.2, weight: 1.0, slug: "Tab" } },
    category: "oral_extreme",
    benefitCurve: [ { dose: 0, value: 0 }, { dose: 40, value: 3.7 } ],
    riskCurve: [ { dose: 0, value: 0 }, { dose: 40, value: 5.2 } ],
  },

  proviron: {
    name: "Proviron",
    color: "#60A5FA",
    abbreviation: "Prov",
    type: "oral",
    // --- MATH ENGINE INPUTS ---
    basePotency: 0.2,
    saturationCeiling: 100,
    halfLifeHours: 12,
    pathways: {
      ar_affinity: 9.0, // Binds hard
      non_genomic: 1.0,
      shbg_binding: 10.0, // The Master of SHBG
      anti_catabolic: 1.0,
    },
    metabolic: {
      aromatization: 0.0,
      dht_conversion: 0.0,
      glycogen_load: 1.0,
      lipolysis: 4.0,
      diuretic_effect: 5.0,
      erythropoiesis: 2.0,
    },
    benefits: {
      contractile_growth: 1.0,
      sarcoplasmic_vol: 1.0,
      neural_strength: 3.0,
      joint_support: 3.0,
      libido: 9.0, // Synergy benefit
    },
    toxicity: {
      hepatic: 1.0,
      renal: 1.0,
      neuro: 2.0,
      lipid: 2.0,
      progestogenic: 0.0,
      androgenic: 6.0,
    },
    // --- LEGACY DATA ---
    toxicityTier: 0,
    bioavailability: 0.05,
    suppressiveFactor: 1,
    conversionFactor: 0,
    flags: { aromatization: 0, isSuppressive: true },
    defaultEster: "oral",
    esters: { oral: { label: "Oral Tablet", halfLife: 12, weight: 1.0, slug: "Tab" } },
    category: "support",
    benefitCurve: [ { dose: 0, value: 0 }, { dose: 100, value: 0.9 } ],
    riskCurve: [ { dose: 0, value: 0 }, { dose: 100, value: 0.4 } ],
  },

  ment: {
    name: "Ment (Trestolone)",
    color: "#701a75",
    abbreviation: "Ment",
    type: "injectable",
    // --- MATH ENGINE INPUTS ---
    basePotency: 3.0,
    saturationCeiling: 100,
    halfLifeHours: 24,
    pathways: {
      ar_affinity: 9.0,
      non_genomic: 6.0,
      shbg_binding: 2.0,
      anti_catabolic: 8.0,
    },
    metabolic: {
      aromatization: 10.0, // Methyl-Estrogen (Severe)
      dht_conversion: 0.0,
      glycogen_load: 8.0,
      lipolysis: 6.0,
      diuretic_effect: 0.0,
      erythropoiesis: 8.0,
    },
    benefits: {
      contractile_growth: 9.0,
      sarcoplasmic_vol: 9.0,
      neural_strength: 7.0,
      joint_support: 7.0,
      libido: 8.0,
    },
    toxicity: {
      hepatic: 2.0,
      renal: 4.0,
      neuro: 5.0,
      lipid: 6.0,
      progestogenic: 5.0,
      androgenic: 9.0,
    },
    // --- LEGACY DATA ---
    bioavailability: 1.0,
    suppressiveFactor: 5,
    conversionFactor: 10.0,
    flags: { aromatization: 3.0, isSuppressive: true },
    defaultEster: "acetate",
    esters: {
      acetate: { label: "Acetate", halfLife: 24, weight: 0.87, slug: "Ace" },
      enanthate: { label: "Enanthate", halfLife: 108, weight: 0.7, slug: "Enanthate" },
    },
    category: "mass_monster",
    benefitCurve: [ { dose: 0, value: 0 }, { dose: 100, value: 4.5 } ],
    riskCurve: [ { dose: 0, value: 0 }, { dose: 100, value: 4.0 } ],
  },

  // --- ANCILLARIES (Benefits set to 0 for hypertrophy, used for flags) ---
  arimidex: {
    name: "Arimidex",
    color: "#6B7280",
    type: "oral",
    basePotency: 0,
    saturationCeiling: 1,
    halfLifeHours: 48,
    pathways: { ar_affinity: 0, non_genomic: 0, shbg_binding: 0, anti_catabolic: 0 },
    metabolic: { aromatization: -10, dht_conversion: 0, glycogen_load: -2, lipolysis: 0, diuretic_effect: 2 },
    benefits: { contractile_growth: 0, sarcoplasmic_vol: 0, neural_strength: 0, joint_support: -2, libido: 0 },
    toxicity: { hepatic: 1, renal: 0, neuro: 0, lipid: 4, progestogenic: 0 },
    // Legacy
    flags: { isAI: true },
    defaultEster: "oral",
    esters: { oral: { label: "Tablet", halfLife: 48, weight: 1.0, slug: "Tab" } },
    category: "ancillary",
    benefitCurve: [{dose: 0, value: 0}, {dose: 1, value: 1}],
    riskCurve: [{dose: 0, value: 0}, {dose: 1, value: 0.5}],
  },

  cabergoline: {
    name: "Cabergoline",
    color: "#6B7280",
    type: "oral",
    basePotency: 0,
    saturationCeiling: 1,
    halfLifeHours: 69,
    pathways: { ar_affinity: 0, non_genomic: 0, shbg_binding: 0, anti_catabolic: 0 },
    metabolic: { aromatization: 0, dht_conversion: 0, glycogen_load: 0, lipolysis: 0, diuretic_effect: 0 },
    benefits: { contractile_growth: 0, sarcoplasmic_vol: 0, neural_strength: 0, joint_support: 0, libido: 5 },
    toxicity: { hepatic: 0, renal: 0, neuro: 5, lipid: 0, progestogenic: -10 },
    // Legacy
    flags: { isDopamineAgonist: true },
    defaultEster: "oral",
    esters: { oral: { label: "Tablet", halfLife: 69, weight: 1.0, slug: "Tab" } },
    category: "ancillary",
    benefitCurve: [{dose: 0, value: 0}, {dose: 0.5, value: 1}],
    riskCurve: [{dose: 0, value: 0}, {dose: 0.5, value: 0.2}],
  },
};

// --- UTILITY FUNCTIONS (Maintained for backwards compatibility) ---

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
  "Tier 1": "Empirical Human Data - RCTs",
  "Tier 2": "Clinical/Therapeutic Extrapolation",
  "Tier 3": "Animal Studies + HED Scaling",
  "Tier 4": "Mechanism + Anecdotal Patterns",
};

export const disclaimerText = `HARM REDUCTION MODELING, NOT MEDICAL ADVICE.`;