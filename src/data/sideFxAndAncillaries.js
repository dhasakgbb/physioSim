/**
 * Side Effect Categories and Ancillary Drug Database
 * Comprehensive harm reduction data for AAS use
 * Sources: Clinical protocols, harm reduction guidelines, pharmacological data
 */

// Side Effect Categories with Management Strategies
export const sideEffectCategories = {
  estrogenic: {
    name: 'Estrogenic Side Effects',
    description: 'Effects from aromatization of androgens to estrogen',
    compounds: ['testosterone', 'npp', 'dianabol', 'anadrol'],
    sides: [
      {
        name: 'Gynecomastia',
        severity: 'high',
        description: 'Breast tissue development in males',
        management: [
          'AI (anastrozole, letrozole, exemestane) - preventive',
          'SERMs (raloxifene 60mg, tamoxifen 20mg) - reversal if caught early',
          'Surgery if developed and persistent'
        ],
        timeline: 'Develops week 3-8; reversible if caught early (<6 months)'
      },
      {
        name: 'Water Retention',
        severity: 'low',
        description: 'Subcutaneous and intramuscular water accumulation',
        management: [
          'AI reduces severity',
          'Dietary sodium management',
          'Adequate hydration',
          'Cosmetic only; not harmful'
        ],
        timeline: 'Appears week 1-2; resolves post-cycle'
      },
      {
        name: 'Emotional Lability',
        severity: 'medium',
        description: 'Mood swings from E2 fluctuations',
        management: [
          'Stable E2 levels (avoid AI overuse)',
          'Bloodwork to dial in AI dose',
          'Psychological awareness'
        ],
        timeline: 'Can occur throughout cycle if E2 unstable'
      }
    ]
  },

  progestational: {
    name: 'Progestational Side Effects',
    description: 'Effects from 19-nor compounds (NPP, Tren) on prolactin',
    compounds: ['npp', 'trenbolone'],
    sides: [
      {
        name: 'Sexual Dysfunction (Deca Dick)',
        severity: 'high',
        description: 'Erectile dysfunction, low libido from elevated prolactin',
        management: [
          'Cabergoline 0.25-0.5mg 2x/week',
          'Pramipexole 0.25-0.5mg daily (alternative)',
          'P5P 200mg daily (mild control)',
          'Monitor prolactin levels via bloodwork'
        ],
        timeline: 'Onset week 3-6; reversible with dopamine agonists; may persist 2-4 weeks post-cycle'
      },
      {
        name: 'Gynecomastia (Prolactin-mediated)',
        severity: 'medium',
        description: 'Breast tissue from prolactin elevation (different mechanism than E2)',
        management: [
          'Cabergoline primary treatment',
          'SERMs less effective than for E2-mediated gyno',
          'Prevention easier than reversal'
        ],
        timeline: 'Slower onset than E2 gyno (week 4-8); harder to reverse'
      },
      {
        name: 'Lactation',
        severity: 'low',
        description: 'Nipple discharge from extreme prolactin elevation',
        management: [
          'Increase cabergoline dose',
          'Bloodwork to confirm prolactin levels',
          'Usually indicates poor prolactin management'
        ],
        timeline: 'Rare; occurs with very high prolactin levels'
      }
    ]
  },

  androgenic: {
    name: 'Androgenic Side Effects',
    description: 'Effects from androgenic activity and DHT metabolites',
    compounds: ['testosterone', 'trenbolone', 'masteron', 'all_orals'],
    sides: [
      {
        name: 'Acne',
        severity: 'low-medium',
        description: 'Increased sebum production and skin inflammation',
        management: [
          'Hygiene: shower post-workout, clean sheets',
          'Topical: benzoyl peroxide, salicylic acid',
          'Accutane (isotretinoin) 20mg daily if severe',
          'Usually improves post-cycle'
        ],
        timeline: 'Onset week 2-4; may persist 4-8 weeks post-cycle'
      },
      {
        name: 'Hair Loss (Male Pattern Baldness)',
        severity: 'medium-high',
        description: 'DHT-mediated hair follicle miniaturization',
        management: [
          'Finasteride 1mg daily (only for non-DHT compounds)',
          'RU58841 topical (research chemical)',
          'Minoxidil 5% (promotes regrowth but doesn\'t prevent loss)',
          'Avoid DHT derivatives if MPB-prone (Masteron, Primo, orals)'
        ],
        timeline: 'Irreversible if follicles miniaturized; genetic susceptibility varies'
      },
      {
        name: 'Prostate Enlargement (BPH)',
        severity: 'medium',
        description: 'Benign prostatic hyperplasia from androgenic stimulation',
        management: [
          'Monitor PSA levels (bloodwork)',
          'Finasteride 5mg daily if symptomatic',
          'Urinary hesitancy, frequency = warning signs',
          'Digital rectal exam if >40 years old'
        ],
        timeline: 'Develops slowly; cumulative with age and AAS exposure'
      }
    ]
  },

  hepatic: {
    name: 'Hepatic Stress',
    description: 'Liver enzyme elevation from c17-alpha alkylated orals',
    compounds: ['dianabol', 'anadrol', 'winstrol', 'anavar', 'halotestin'],
    sides: [
      {
        name: 'Elevated ALT/AST',
        severity: 'medium-high',
        description: 'Liver enzyme markers indicating hepatocellular stress',
        management: [
          'TUDCA 500-1000mg daily (essential for orals)',
          'NAC 1200mg daily',
          'Limit oral duration to 4-6 weeks',
          'Bloodwork every 4 weeks on orals',
          'Discontinue if ALT/AST >3x upper limit'
        ],
        timeline: 'Elevation begins week 1-2; reversible if caught early; can lead to permanent damage if ignored'
      },
      {
        name: 'Jaundice',
        severity: 'high',
        description: 'Yellowing of skin/eyes from cholestasis',
        management: [
          'Immediate discontinuation of all orals',
          'Medical evaluation urgently',
          'TUDCA 1500mg daily',
          'Indicates severe liver stress'
        ],
        timeline: 'Rare but serious; medical emergency'
      },
      {
        name: 'Lethargy/Malaise',
        severity: 'low-medium',
        description: 'General unwellness from liver stress',
        management: [
          'Reduce oral dose or discontinue',
          'Increase TUDCA',
          'Rest and hydration',
          'Bloodwork to assess severity'
        ],
        timeline: 'Subjective; often precedes enzyme elevation'
      }
    ]
  },

  cardiovascular: {
    name: 'Cardiovascular Effects',
    description: 'Heart, blood pressure, and lipid impacts',
    compounds: ['all_compounds'],
    sides: [
      {
        name: 'Hypertension',
        severity: 'high',
        description: 'Elevated blood pressure from fluid retention, RBC, vascular effects',
        management: [
          'Home BP monitoring 3x/week',
          'Telmisartan 40-80mg daily (ARB, preferred)',
          'Lisinopril 10-20mg daily (ACE inhibitor)',
          'Nebivolol 5mg (beta blocker)',
          'LISS cardio 30min daily',
          'Target <130/80'
        ],
        timeline: 'Develops week 2-4; cumulative; can persist post-cycle if LVH developed'
      },
      {
        name: 'Lipid Decline',
        severity: 'high',
        description: 'HDL decrease, LDL increase, elevated triglycerides',
        management: [
          'Fish oil 3-4g EPA/DHA daily',
          'Statins (rosuvastatin 5-10mg) if severe',
          'Berberine 500mg 3x/day',
          'LISS cardio daily',
          'Avoid saturated fats',
          'Lipid panel every 8 weeks',
          'Target HDL >40, LDL <100'
        ],
        timeline: 'Begins week 2-3; worst with orals and Tren; partially reversible post-cycle'
      },
      {
        name: 'Left Ventricular Hypertrophy (LVH)',
        severity: 'high',
        description: 'Pathological heart enlargement from prolonged hypertension',
        management: [
          'Echocardiogram annually if long-term AAS use',
          'BP management critical (prevent, don\'t treat)',
          'Limit cycle duration',
          'Time off = time on (minimum)',
          'May be irreversible if severe'
        ],
        timeline: 'Develops over months-years; cumulative; prevention essential'
      },
      {
        name: 'Elevated Hematocrit (HCT)',
        severity: 'medium-high',
        description: 'Thick blood from increased RBC production',
        management: [
          'Donate blood every 8-12 weeks',
          'Monitor HCT (target <52%)',
          'Hydration (3-4L water daily)',
          'Baby aspirin 81mg daily',
          'Grapefruit for natural blood thinning',
          'Discontinue EQ if HCT unmanageable'
        ],
        timeline: 'Develops week 4-8; worst with EQ and high Test; reversible with donation'
      }
    ]
  },

  psychological: {
    name: 'Psychological Effects',
    description: 'Mental health impacts from AAS',
    compounds: ['trenbolone', 'eq', 'halotestin', 'high_dose_all'],
    sides: [
      {
        name: 'Aggression/Irritability',
        severity: 'medium-high',
        description: 'Increased anger, reduced impulse control',
        management: [
          'Dosage reduction or discontinuation',
          'Psychological awareness and coping strategies',
          'Support system communication',
          'Avoid Tren if prone to anger issues',
          'Therapy if persistent'
        ],
        timeline: 'Tren: onset week 1-2; may persist 2-4 weeks post-cycle'
      },
      {
        name: 'Anxiety/Paranoia',
        severity: 'medium-high',
        description: 'Heightened anxiety, suspicious thinking',
        management: [
          'EQ: check E2 levels (may be low-E2 anxiety)',
          'Tren: dosage reduction or discontinuation',
          'Anxiolytic support if needed',
          'Psychological evaluation'
        ],
        timeline: 'EQ: week 4-8 (20-40% of users); Tren: week 2-4 (dose-dependent)'
      },
      {
        name: 'Insomnia',
        severity: 'medium-high',
        description: 'Difficulty falling/staying asleep',
        management: [
          'Dose earlier in day',
          'Sleep hygiene',
          'Melatonin 5-10mg',
          'Magnesium glycinate 400mg',
          'CBD oil',
          'Avoid stimulants',
          'Tren insomnia often unavoidable'
        ],
        timeline: 'Tren: nearly universal; begins week 1; resolves 1-2 weeks post-cycle'
      }
    ]
  }
};

// Ancillary Medications Database
export const ancillaries = {
  // AROMATASE INHIBITORS
  anastrozole: {
    name: 'Anastrozole (Arimidex)',
    category: 'aromatase_inhibitor',
    type: 'non-steroidal AI',
    mechanism: 'Reversibly inhibits aromatase enzyme; reduces E2 by ~50-70%',
    dosing: {
      low: '0.25mg every 3 days',
      moderate: '0.5mg every other day',
      high: '0.5mg daily to 1mg daily'
    },
    sides: 'Joint pain, low libido (if E2 crashed), mood issues, lipid worsening',
    caution: 'Crashing E2 is worse than high E2; titrate based on symptoms and bloodwork',
    cost: {
      weekly: 2,
      unit: 'USD',
      note: 'Generic; affordable'
    },
    availability: 'Prescription; widely available gray market',
    bloodworkTarget: 'E2: 20-30 pg/mL (sensitive assay)'
  },

  letrozole: {
    name: 'Letrozole (Femara)',
    category: 'aromatase_inhibitor',
    type: 'non-steroidal AI (most potent)',
    mechanism: 'Reversibly inhibits aromatase; reduces E2 by 90-98%',
    dosing: {
      low: '0.25mg every other day',
      moderate: '0.5mg every other day',
      high: '1.25-2.5mg every other day (emergency gyno reversal)'
    },
    sides: 'Severe joint pain, lipid worsening, crashes E2 easily',
    caution: '⚠️ TOO POTENT for most users; reserve for gyno emergencies; crashes E2 easily',
    cost: {
      weekly: 3,
      unit: 'USD',
      note: 'Generic; affordable'
    },
    availability: 'Prescription; gray market',
    bloodworkTarget: 'E2: 15-25 pg/mL (easy to crash below 10)'
  },

  exemestane: {
    name: 'Exemestane (Aromasin)',
    category: 'aromatase_inhibitor',
    type: 'steroidal AI (suicide inhibitor)',
    mechanism: 'Permanently deactivates aromatase; cannot rebound; mildly androgenic',
    dosing: {
      low: '12.5mg every 3 days',
      moderate: '12.5mg every other day',
      high: '12.5-25mg daily'
    },
    sides: 'Fewer joint issues than anastrozole; lipid-neutral or mild benefit',
    caution: 'Cannot adjust E2 upward quickly (irreversible); titrate carefully',
    cost: {
      weekly: 5,
      unit: 'USD',
      note: 'Slightly more expensive than anastrozole'
    },
    availability: 'Prescription; gray market',
    bloodworkTarget: 'E2: 20-30 pg/mL',
    advantages: 'Preferred by many; DHT-like structure; no E2 rebound'
  },

  // SERMS
  tamoxifen: {
    name: 'Tamoxifen (Nolvadex)',
    category: 'serm',
    mechanism: 'Selective estrogen receptor modulator; blocks E2 at breast tissue; used in PCT',
    dosing: {
      gyno_prevention: '10-20mg daily',
      gyno_reversal: '20-40mg daily for 4-8 weeks',
      pct: '40/40/20/20 (mg per day for 4 weeks)'
    },
    sides: 'Mood swings, libido changes, vision issues (rare), blood clot risk (rare)',
    caution: 'Raises serum E2 (blocks receptors but not production); not ideal for on-cycle E2 management',
    cost: {
      weekly: 3,
      unit: 'USD',
      note: 'Generic; very affordable'
    },
    availability: 'Prescription; widely available gray market',
    advantages: 'Excellent for PCT; HPTA restart'
  },

  raloxifene: {
    name: 'Raloxifene (Evista)',
    category: 'serm',
    mechanism: 'SERM with stronger anti-estrogenic effect at breast tissue than tamoxifen',
    dosing: {
      gyno_reversal: '60mg daily for 3-6 months'
    },
    sides: 'Fewer sides than tamoxifen; mild mood effects',
    caution: 'Preferred over tamoxifen for gyno reversal; not used for PCT',
    cost: {
      weekly: 7,
      unit: 'USD',
      note: 'More expensive than tamoxifen'
    },
    availability: 'Prescription; gray market',
    advantages: 'Best for gyno reversal; better side profile than tamoxifen'
  },

  clomid: {
    name: 'Clomiphene (Clomid)',
    category: 'serm',
    mechanism: 'SERM; stimulates LH/FSH release for HPTA restart in PCT',
    dosing: {
      pct: '50/50/50/50 (mg per day for 4 weeks) or 100/50/50/50 for 19-nors'
    },
    sides: 'Vision issues (more common than tamoxifen), mood swings, emotional lability',
    caution: 'Vision sides concerning; tamoxifen often preferred for PCT',
    cost: {
      weekly: 4,
      unit: 'USD',
      note: 'Generic; affordable'
    },
    availability: 'Prescription; gray market',
    advantages: 'Potent HPTA restart; alternative to tamoxifen for PCT'
  },

  // DOPAMINE AGONISTS
  cabergoline: {
    name: 'Cabergoline (Dostinex)',
    category: 'dopamine_agonist',
    mechanism: 'D2 receptor agonist; reduces prolactin secretion from pituitary',
    dosing: {
      npp_tren: '0.25-0.5mg twice weekly',
      high_prolactin: '0.5-1mg twice weekly'
    },
    sides: 'Nausea (take with food), dizziness, impulse control issues (rare; at high doses)',
    caution: 'Essential for NPP/Tren; monitor prolactin via bloodwork',
    cost: {
      weekly: 8,
      unit: 'USD',
      note: 'More expensive but highly effective'
    },
    availability: 'Prescription; gray market',
    bloodworkTarget: 'Prolactin: <15 ng/mL',
    advantages: 'Gold standard for prolactin control; twice-weekly dosing convenient'
  },

  pramipexole: {
    name: 'Pramipexole (Mirapex)',
    category: 'dopamine_agonist',
    mechanism: 'D2/D3 receptor agonist; reduces prolactin',
    dosing: {
      npp_tren: '0.25-0.5mg daily'
    },
    sides: 'Nausea, dizziness, impulse control issues, sleep attacks',
    caution: 'Alternative to cabergoline; daily dosing less convenient',
    cost: {
      weekly: 6,
      unit: 'USD',
      note: 'Less expensive than cabergoline'
    },
    availability: 'Prescription; gray market',
    bloodworkTarget: 'Prolactin: <15 ng/mL',
    advantages: 'Cheaper alternative to cabergoline'
  },

  // LIVER SUPPORT
  tudca: {
    name: 'TUDCA (Tauroursodeoxycholic Acid)',
    category: 'liver_support',
    mechanism: 'Bile acid derivative; prevents cholestasis; reduces hepatocyte apoptosis',
    dosing: {
      oral_prevention: '500mg daily',
      oral_high_dose: '1000-1500mg daily (Anadrol, Halotestin)',
      timing: 'Take 3 hours after oral AAS dose for maximum effect'
    },
    sides: 'Minimal; occasional GI upset',
    caution: 'ESSENTIAL for all oral AAS use; non-negotiable harm reduction',
    cost: {
      weekly: 15,
      unit: 'USD',
      note: 'Expensive but critical'
    },
    availability: 'Over-the-counter supplement',
    bloodworkTarget: 'ALT/AST <2x upper limit of normal',
    advantages: 'Proven hepatoprotective; gold standard for oral AAS'
  },

  nac: {
    name: 'N-Acetyl Cysteine (NAC)',
    category: 'liver_support',
    mechanism: 'Glutathione precursor; antioxidant; reduces oxidative liver stress',
    dosing: {
      general: '600-1200mg daily',
      oral_use: '1200-1800mg daily'
    },
    sides: 'Minimal; occasional GI upset',
    caution: 'Adjunct to TUDCA; not sufficient alone for orals',
    cost: {
      weekly: 3,
      unit: 'USD',
      note: 'Inexpensive supplement'
    },
    availability: 'Over-the-counter supplement',
    advantages: 'Cheap, effective adjunct; general antioxidant benefits'
  },

  // CARDIOVASCULAR SUPPORT
  telmisartan: {
    name: 'Telmisartan',
    category: 'blood_pressure',
    type: 'Angiotensin II Receptor Blocker (ARB)',
    mechanism: 'Blocks angiotensin II receptors; vasodilation; BP reduction; PPAR-gamma agonism (metabolic benefits)',
    dosing: {
      prevention: '40mg daily',
      hypertension: '80mg daily',
      severe: '120mg daily (with doctor supervision)'
    },
    sides: 'Minimal; occasional dizziness, hyperkalemia (rare)',
    caution: 'Preferred BP medication for AAS users; metabolic benefits',
    cost: {
      weekly: 5,
      unit: 'USD',
      note: 'Generic; affordable'
    },
    availability: 'Prescription; gray market',
    bloodworkTarget: 'BP <130/80; potassium within normal range',
    advantages: 'PPAR-gamma effects; insulin sensitivity; lipid benefits; renal protection'
  },

  lisinopril: {
    name: 'Lisinopril',
    category: 'blood_pressure',
    type: 'ACE Inhibitor',
    mechanism: 'Inhibits ACE; reduces angiotensin II production; vasodilation',
    dosing: {
      prevention: '10mg daily',
      hypertension: '20mg daily',
      severe: '40mg daily'
    },
    sides: 'Dry cough (10-15% of users), dizziness, hyperkalemia',
    caution: 'Effective but cough side effect bothersome for some',
    cost: {
      weekly: 2,
      unit: 'USD',
      note: 'Very cheap generic'
    },
    availability: 'Prescription; widely available',
    bloodworkTarget: 'BP <130/80',
    advantages: 'Very affordable; effective; long track record'
  },

  nebivolol: {
    name: 'Nebivolol',
    category: 'blood_pressure',
    type: 'Beta-1 Selective Blocker',
    mechanism: 'Cardioselective beta blocker; reduces heart rate and contractility; nitric oxide release',
    dosing: {
      prevention: '5mg daily',
      hypertension: '5-10mg daily'
    },
    sides: 'Fatigue, reduced exercise capacity, bradycardia',
    caution: 'May reduce training capacity; use if ARBs/ACE-Is insufficient',
    cost: {
      weekly: 8,
      unit: 'USD',
      note: 'Brand more expensive; generic available'
    },
    availability: 'Prescription',
    bloodworkTarget: 'BP <130/80; resting HR 60-70',
    advantages: 'Cardioselective; NO release; good for HR control'
  },

  // LIPID SUPPORT
  fish_oil: {
    name: 'Fish Oil (EPA/DHA)',
    category: 'lipid_support',
    mechanism: 'Omega-3 fatty acids; reduces triglycerides; mild HDL benefit; anti-inflammatory',
    dosing: {
      prevention: '2-3g EPA/DHA daily',
      on_cycle: '3-4g EPA/DHA daily',
      severe_dyslipidemia: '4-6g EPA/DHA daily'
    },
    sides: 'Fishy burps (take with food or use enteric-coated); bleeding risk at very high doses',
    caution: 'Essential for all AAS users; non-negotiable harm reduction',
    cost: {
      weekly: 5,
      unit: 'USD',
      note: 'Inexpensive; buy in bulk'
    },
    availability: 'Over-the-counter supplement',
    bloodworkTarget: 'Triglycerides <150 mg/dL; HDL >40',
    advantages: 'Cheap, effective, cardiovascular protection beyond lipids'
  },

  rosuvastatin: {
    name: 'Rosuvastatin (Crestor)',
    category: 'lipid_support',
    type: 'Statin (HMG-CoA Reductase Inhibitor)',
    mechanism: 'Inhibits cholesterol synthesis; reduces LDL; mild HDL benefit',
    dosing: {
      mild: '5mg daily',
      moderate: '10mg daily',
      severe: '20mg daily'
    },
    sides: 'Muscle pain (5-10%); elevated liver enzymes (rare); fatigue',
    caution: 'Use if lipids severely impacted (LDL >160, HDL <30); monitor liver function',
    cost: {
      weekly: 4,
      unit: 'USD',
      note: 'Generic; affordable'
    },
    availability: 'Prescription',
    bloodworkTarget: 'LDL <100 mg/dL; ALT/AST normal',
    advantages: 'Potent LDL reduction; cardiovascular protection'
  },

  berberine: {
    name: 'Berberine',
    category: 'lipid_support',
    mechanism: 'AMPK activator; improves insulin sensitivity; modest lipid benefits',
    dosing: {
      general: '500mg 2-3x daily with meals'
    },
    sides: 'GI upset (take with food); diarrhea if too high dose',
    caution: 'Adjunct to fish oil; metabolic benefits beyond lipids',
    cost: {
      weekly: 4,
      unit: 'USD',
      note: 'Inexpensive supplement'
    },
    availability: 'Over-the-counter supplement',
    advantages: 'Insulin sensitivity; glucose management; mild lipid benefit'
  },

  // HORMONE MODULATION
  hcg: {
    name: 'Human Chorionic Gonadotropin (HCG)',
    category: 'hpta_support',
    mechanism: 'LH analog; stimulates testicular Leydig cells; maintains testicular function during suppression',
    dosing: {
      on_cycle: '250-500 IU twice weekly',
      pct_kickstart: '500-1000 IU every other day for 2 weeks before SERM PCT'
    },
    sides: 'E2 elevation (testicular aromatization); acne; emotional changes',
    caution: 'Desensitizes Leydig cells if dosed too high or too frequently; use moderate doses',
    cost: {
      weekly: 15,
      unit: 'USD',
      note: 'Moderate cost; worthwhile for recovery'
    },
    availability: 'Prescription; gray market',
    advantages: 'Maintains fertility; easier PCT recovery; prevents testicular atrophy',
    protocol: 'Use during cycle OR as PCT kickstart; not both'
  }
};

/**
 * Calculate required ancillary protocol based on stack composition
 * Returns comprehensive protocol with dosing, timing, and cost
 */
export const getAncillaryProtocol = (stack) => {
  const protocol = {
    essential: [],
    recommended: [],
    optional: [],
    monitoring: [],
    totalWeeklyCost: 0
  };

  // Handle null or undefined stack
  if (!stack || !Array.isArray(stack)) {
    return protocol;
  }

  // Helper to check if stack contains compound type
  const hasCompound = (type) => stack.some(item => item.compound === type);
  const hasCategory = (category) => stack.some(item => item.category === category);
  
  // Get total Test dose
  const testDose = stack.find(item => item.compound === 'testosterone')?.dose || 0;
  
  // Check for aromatizing compounds
  const aromatizingCompounds = stack.filter(item => 
    ['testosterone', 'dianabol', 'anadrol'].includes(item.compound)
  );
  
  // Check for 19-nors
  const nineteenNors = stack.filter(item => 
    ['npp', 'trenbolone'].includes(item.compound)
  );
  
  // Check for orals
  const orals = stack.filter(item => item.type === 'oral');
  
  // ESSENTIAL ANCILLARIES
  
  // AI for aromatizing compounds
  if (aromatizingCompounds.length > 0) {
    const totalAromatizingDose = aromatizingCompounds.reduce((sum, item) => {
      if (item.compound === 'testosterone') return sum + item.dose;
      if (item.compound === 'dianabol') return sum + (item.dose * 15); // mg/day to mg/week equivalent
      if (item.compound === 'anadrol') return sum + (item.dose * 10);
      return sum;
    }, 0);
    
    let aiDosing = '';
    if (totalAromatizingDose < 400) {
      aiDosing = '0.25mg anastrozole E3D';
      protocol.totalWeeklyCost += 2;
    } else if (totalAromatizingDose < 700) {
      aiDosing = '0.5mg anastrozole EOD';
      protocol.totalWeeklyCost += 2;
    } else {
      aiDosing = '0.5-1mg anastrozole daily';
      protocol.totalWeeklyCost += 3;
    }
    
    protocol.essential.push({
      drug: 'Anastrozole (AI)',
      dosing: aiDosing,
      purpose: 'Estrogen management',
      timing: 'Begin week 2 or when symptoms appear',
      note: 'Titrate based on symptoms and bloodwork; avoid crashing E2',
      cost: protocol.totalWeeklyCost
    });
  }
  
  // Dopamine agonist for 19-nors
  if (nineteenNors.length > 0) {
    protocol.essential.push({
      drug: 'Cabergoline',
      dosing: '0.25-0.5mg twice weekly',
      purpose: 'Prolactin control (NPP/Tren)',
      timing: 'Begin week 2',
      note: 'Essential for preventing sexual dysfunction',
      cost: 8
    });
    protocol.totalWeeklyCost += 8;
  }
  
  // TUDCA for orals
  if (orals.length > 0) {
    const hasHarshOral = orals.some(item => 
      ['anadrol', 'halotestin', 'winstrol'].includes(item.compound)
    );
    
    protocol.essential.push({
      drug: 'TUDCA',
      dosing: hasHarshOral ? '1000-1500mg daily' : '500-1000mg daily',
      purpose: 'Liver protection (oral AAS)',
      timing: '3 hours after oral dose',
      note: 'NON-NEGOTIABLE for oral compounds',
      cost: hasHarshOral ? 20 : 15
    });
    protocol.totalWeeklyCost += (hasHarshOral ? 20 : 15);
    
    protocol.essential.push({
      drug: 'NAC',
      dosing: '1200mg daily',
      purpose: 'Antioxidant liver support',
      timing: 'With meals',
      note: 'Adjunct to TUDCA',
      cost: 3
    });
    protocol.totalWeeklyCost += 3;
  }
  
  // RECOMMENDED ANCILLARIES
  
  // Fish oil (universal)
  protocol.recommended.push({
    drug: 'Fish Oil',
    dosing: '3-4g EPA/DHA daily',
    purpose: 'Lipid management + cardiovascular protection',
    timing: 'With meals',
    note: 'Essential for all AAS users',
    cost: 5
  });
  protocol.totalWeeklyCost += 5;
  
  // BP management for high-risk compounds
  if (hasCompound('trenbolone') || testDose > 700 || orals.length > 0) {
    protocol.recommended.push({
      drug: 'Telmisartan',
      dosing: '40-80mg daily',
      purpose: 'Blood pressure management',
      timing: 'Morning',
      note: 'Monitor BP 3x/week; adjust dose if >140/90',
      cost: 5
    });
    protocol.totalWeeklyCost += 5;
  }
  
  // HCG for cycle >12 weeks or 19-nors
  if (stack.length > 0) { // Universal recommendation
    protocol.recommended.push({
      drug: 'HCG',
      dosing: '250-500 IU twice weekly',
      purpose: 'Maintain testicular function; easier PCT',
      timing: 'Throughout cycle',
      note: 'Especially important for 19-nors or long cycles',
      cost: 15
    });
    protocol.totalWeeklyCost += 15;
  }
  
  // Blood donation for EQ or high Test
  if (hasCompound('eq') || testDose > 600) {
    protocol.recommended.push({
      drug: 'Blood Donation',
      dosing: 'Every 8-12 weeks',
      purpose: 'Manage hematocrit elevation',
      timing: 'As needed based on CBC results',
      note: 'Essential for EQ; monitor HCT <52%',
      cost: 0
    });
  }
  
  // OPTIONAL ANCILLARIES
  
  // Berberine for metabolic health
  protocol.optional.push({
    drug: 'Berberine',
    dosing: '500mg 3x daily with meals',
    purpose: 'Insulin sensitivity + mild lipid benefit',
    timing: 'With carb-containing meals',
    note: 'Beneficial for overall metabolic health',
    cost: 4
  });
  
  // Sleep aids for Tren
  if (hasCompound('trenbolone')) {
    protocol.optional.push({
      drug: 'Sleep Support',
      dosing: 'Melatonin 5-10mg + Magnesium glycinate 400mg',
      purpose: 'Combat Tren insomnia',
      timing: '30min before bed',
      note: 'May not fully resolve; Tren insomnia common',
      cost: 2
    });
  }
  
  // MONITORING PROTOCOLS
  protocol.monitoring.push({
    test: 'Lipid Panel',
    frequency: orals.length > 0 ? 'Every 6 weeks' : 'Every 8 weeks',
    targets: 'HDL >40, LDL <100, TG <150',
    action: 'Add statin if LDL >160; increase fish oil if TG >200'
  });
  
  protocol.monitoring.push({
    test: 'Liver Enzymes (CMP)',
    frequency: orals.length > 0 ? 'Every 4 weeks' : 'Every 12 weeks',
    targets: 'ALT/AST <2x upper limit',
    action: 'Discontinue orals if >3x; increase TUDCA if 2-3x'
  });
  
  if (aromatizingCompounds.length > 0) {
    protocol.monitoring.push({
      test: 'Estradiol (Sensitive)',
      frequency: 'Every 6-8 weeks or if symptoms',
      targets: '20-30 pg/mL (may vary by individual)',
      action: 'Adjust AI dose; avoid crashing <15 pg/mL'
    });
  }
  
  if (nineteenNors.length > 0) {
    protocol.monitoring.push({
      test: 'Prolactin',
      frequency: 'Every 8 weeks or if symptoms',
      targets: '<15 ng/mL',
      action: 'Increase cabergoline if >20 ng/mL or symptoms present'
    });
  }
  
  protocol.monitoring.push({
    test: 'CBC (Complete Blood Count)',
    frequency: hasCompound('eq') ? 'Every 6 weeks' : 'Every 12 weeks',
    targets: 'HCT <52%, Hemoglobin <17.5 g/dL',
    action: 'Donate blood if HCT >52%; reduce EQ dose if persistently elevated'
  });
  
  protocol.monitoring.push({
    test: 'Blood Pressure',
    frequency: '3x per week at home',
    targets: '<130/80 (ideally <125/75)',
    action: 'Start BP medication if consistently >140/90; doctor visit if >150/95'
  });
  
  return protocol;
};

