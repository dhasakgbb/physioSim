/**
 * Complete AAS Dose-Response Data
 * Source: IMPLEMENT.md Section 2
 * DO NOT MODIFY - All values are from specification documents
 */

export const compoundData = {
  testosterone: {
    name: 'Testosterone',
    color: '#0066CC',
    abbreviation: 'Test',
    type: 'injectable',
    category: 'base',
    modelConfidence: 0.81,
    evidenceProvenance: { human: 5, animal: 1, aggregate: 4 },
    varianceDrivers: [
      'Interindividual aromatase rate (±20%) shifts risk/benefit simultaneously',
      'SHBG binding differences change free testosterone availability',
      'Adherence to AI/PCT protocols and training quality'
    ],
    benefitCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 100, value: 0.83, tier: 'Tier 1', source: 'Bhasin et al. (1996)', caveat: 'Direct empirical data from RCT', ci: 0.15 },
      { dose: 300, value: 2.5, tier: 'Tier 1', source: 'Bhasin et al. (1996)', caveat: 'Linear dose-response observed', ci: 0.15 },
      { dose: 600, value: 5.0, tier: 'Tier 1', source: 'Bhasin et al. (1996, 2001)', caveat: 'Peak measured dose in RCT (n=43)', ci: 0.15 },
      { dose: 800, value: 5.2, tier: 'Tier 3', source: 'Extrapolated via receptor saturation model', caveat: 'No human data; receptor occupancy ~85-90%', ci: 0.5 },
      { dose: 900, value: 5.2, tier: 'Tier 3', source: 'Extrapolated via receptor model', caveat: 'Plateau driven by receptor saturation', ci: 0.5 },
      { dose: 1000, value: 5.25, tier: 'Tier 3', source: 'Extrapolated via receptor model', caveat: 'Diminishing returns; modeled', ci: 0.5 },
      { dose: 1200, value: 5.25, tier: 'Tier 3', source: 'Extrapolated via receptor model', caveat: 'Asymptotic plateau; high uncertainty', ci: 0.5 },
    ],
    riskCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 100, value: 0.2, tier: 'Tier 1', source: 'Bhasin lipids', caveat: 'Measured HDL decline', ci: 0.2 },
      { dose: 300, value: 0.9, tier: 'Tier 1', source: 'Bhasin et al. (1996)', caveat: 'Lipid + mild suppression', ci: 0.2 },
      { dose: 600, value: 2.1, tier: 'Tier 1', source: 'Bhasin lipids + clinical inference', caveat: 'HDL decline ~1.5 mmol/L; LVH signs', ci: 0.25 },
      { dose: 800, value: 3.2, tier: 'Tier 3', source: 'Extrapolated cardio/hepatic', caveat: 'Cardio acceleration modeled; not measured', ci: 0.5 },
      { dose: 1000, value: 4.0, tier: 'Tier 3', source: 'Extrapolated cardio/hepatic', caveat: 'Severe lipid + cardio stress assumed', ci: 0.5 },
      { dose: 1200, value: 4.5, tier: 'Tier 3', source: 'Extrapolated cardio/hepatic', caveat: 'Peak risk zone; hepatic + cardio', ci: 0.5 },
    ],
    methodology: {
      summary: 'Tier 1 (0-600mg, Bhasin et al.); Tier 3 (600-1200mg, extrapolated)',
      benefitRationale: 'Linear dose-response 0-600mg per Bhasin; plateau driven by androgen receptor saturation (~85-90% occupancy). Forbes (1985) meta-analysis supports plateau at high doses.',
      riskRationale: 'Lipid decline empirical (Bhasin: HDL ↓1.5 mmol/L per 100mg). Cardio/hepatic modeled from clinical inference; LVH risk assumed at supraphysio doses.',
      sources: ['Bhasin et al. (1996, 2001) - RCT n=43, 6 months', 'Forbes (1985) - LBM plateau meta-analysis', 'r/steroids wiki - Community aggregates'],
      limitations: ['No human data >600mg', 'Individual aromatization variance ±20%', 'Duration assumed 12-16 weeks', 'Genetics cause ±20-30% individual variance'],
      assumptions: ['Age 25-40, male', 'Proper AI use (not modeled separately)', 'Training/diet adequate (not limiting factor)', 'No pre-existing HTN/dyslipidemia', 'PCT protocol followed'],
      individualVariance: ['AR CAG repeats: ±15-20% responder variance', 'CYP19A1 polymorphisms: aromatization variance', 'Genetics unknown: ±20-30% unmeasured']
    },
    sideEffectProfile: {
      common: [
        { name: 'Water Retention', severity: 'low', onset: 'week 1', doseDependent: true, management: 'AI reduces severity; cosmetic only' },
        { name: 'Acne', severity: 'low-medium', onset: 'week 2-3', doseDependent: true, management: 'Topical treatments; hygiene' },
        { name: 'Gynecomastia Risk', severity: 'medium', onset: 'week 3+', doseDependent: true, management: 'AI (anastrozole 0.5mg EOD); SERMs if developed' },
        { name: 'Hair Loss (MPB)', severity: 'low-medium', onset: 'week 4+', doseDependent: true, management: 'Finasteride 1mg/day (limited effectiveness)' },
        { name: 'Testicular Atrophy', severity: 'low', onset: 'week 2-4', doseDependent: false, management: 'HCG 250-500 IU 2x/week' }
      ],
      lipidProfile: {
        hdlDecline: 'moderate (↓1.5 mmol/L per 100mg/week)',
        ldlIncrease: 'mild (↑10-15%)',
        triglycerides: 'mild increase (↑10-20%)',
        management: 'Fish oil, LISS cardio, lipid panels every 8 weeks'
      },
      cardiovascular: {
        bloodPressure: 'mild increase (5-10 mmHg systolic per 100mg/week)',
        lvh: 'dose-dependent risk >600mg; cumulative with duration',
        rbc: 'increased hematocrit (beneficial for performance, risk if >54%)',
        management: 'BP monitoring, cardio, donate blood if HCT >52%, ARBs if needed'
      },
      hpta: {
        suppression: 'complete at >300mg/week; partial at lower doses',
        recovery: '2-3 months with proper PCT; longer with extended cycles',
        pctRequired: true,
        management: 'Nolvadex 40/40/20/20 or Clomid 50/50/50/50; HCG taper recommended'
      }
    },
    ancillaryRequirements: {
      aromataseInhibitor: {
        trigger: 'dose >250mg/week or gyno symptoms',
        examples: ['Anastrozole (Arimidex)', 'Letrozole (Femara)', 'Exemestane (Aromasin)'],
        dosing: {
          250: '0.25mg anastrozole every 3 days',
          400: '0.5mg anastrozole every other day',
          600: '0.5mg anastrozole daily',
          1000: '1mg anastrozole daily or 12.5mg aromasin EOD'
        },
        note: 'Titrate based on symptoms and bloodwork; crashing E2 causes worse sides than high E2'
      },
      serms: {
        trigger: 'If gyno develops despite AI',
        examples: ['Tamoxifen (Nolvadex) 10-20mg daily', 'Raloxifene 60mg daily (preferred for gyno reversal)'],
        purpose: 'Backup prevention; not primary management'
      },
      hcg: {
        trigger: 'Optional during cycle; recommended >12 weeks',
        dosing: '250-500 IU twice weekly',
        purpose: 'Maintain testicular function; easier PCT recovery'
      },
      bloodPressureManagement: {
        trigger: 'BP >140/90 or dose >700mg/week',
        examples: ['Telmisartan 40-80mg', 'Lisinopril 10-20mg', 'Nebivolol 5mg'],
        monitoring: 'Home BP monitoring 3x/week; doctor visit if persistently elevated'
      },
      lipidManagement: {
        trigger: 'Baseline dyslipidemia or dose >700mg/week',
        examples: ['Statins (rosuvastatin 5-10mg)', 'Berberine 500mg 3x/day', 'Fish oil 3-4g EPA/DHA daily'],
        monitoring: 'Lipid panel every 8 weeks on cycle; target LDL <100, HDL >40'
      }
    }
  },

  npp: {
    name: 'NPP (Nandrolone Phenylpropionate)',
    color: '#FF9900',
    abbreviation: 'NPP',
    type: 'injectable',
    category: 'progestin',
    modelConfidence: 0.61,
    evidenceProvenance: { human: 2, animal: 3, aggregate: 5 },
    varianceDrivers: [
      'Prolactin receptor sensitivity varies ±40%',
      'Progesterone/E2 cross-talk (AI + caber compliance)',
      'Short ester pharmacokinetics (missed injections swing levels)'
    ],
    benefitCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 100, value: 1.5, tier: 'Tier 2', source: 'Therapeutic Deca studies extrapolated', caveat: 'Faster ester kinetics vs Deca', ci: 0.3 },
      { dose: 200, value: 2.5, tier: 'Tier 2', source: 'Blaquier et al. (1991) rat study HED-scaled', caveat: 'Joint protection benefit peaks', ci: 0.3 },
      { dose: 300, value: 3.0, tier: 'Tier 2/3', source: 'HED-scaled + forum consensus', caveat: 'Plateau in lean mass gains', ci: 0.4 },
      { dose: 400, value: 3.15, tier: 'Tier 3', source: 'Forum reports', caveat: 'Anecdotal plateau; no additional mass', ci: 0.5 },
      { dose: 600, value: 3.25, tier: 'Tier 4', source: 'Forum consensus', caveat: 'Flat; diminishing returns', ci: 0.5 },
    ],
    riskCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 100, value: 0.3, tier: 'Tier 2', source: 'Clinical Deca data', caveat: 'Mild prolactin elevation', ci: 0.25 },
      { dose: 200, value: 0.8, tier: 'Tier 2', source: 'Clinical extrapolation', caveat: 'Prolactin emerging', ci: 0.3 },
      { dose: 300, value: 1.5, tier: 'Tier 2/3', source: 'Forum reports', caveat: '"Deca dick" threshold reports; ~40% of users', ci: 0.4 },
      { dose: 400, value: 2.2, tier: 'Tier 3', source: 'Anecdotal aggregates', caveat: 'Significant prolactin + lipid decline', ci: 0.5 },
      { dose: 600, value: 3.0, tier: 'Tier 4', source: 'Forum consensus', caveat: 'High risk; prolactin dominates; sexual dysfunction common', ci: 0.5 },
    ],
    methodology: {
      summary: 'Tier 2 (0-300mg); Tier 3/4 (300-600mg); prolactin highly variable',
      benefitRationale: 'Inferred from therapeutic Deca studies + shorter ester kinetics. Blaquier rat study HED-scaled (~200-300mg human equivalent at max effect). Forum consensus shows plateau.',
      riskRationale: 'Prolactin dose-response limited in clinical data; mostly anecdotal "deca dick" thresholds. ~40% of users report sexual dysfunction >300mg. HDL decline similar to Test but progesterone effects complicate.',
      sources: ['Blaquier et al. (1991) - NPP dose-response in rat protein synthesis', 'Therapeutic nandrolone data (50-100mg)', 'r/steroids, Meso-Rx forums - ~2000 cycle reports'],
      limitations: ['No controlled human dose-response studies for supraphysio NPP', 'Prolactin sensitivity varies dramatically by genetics + E2 levels', 'Shorter ester means different kinetics vs Deca; extrapolation assumptions'],
      assumptions: ['Proper P5P use (prolactin control)', 'E2 managed via AI', 'Age 25-40', 'Baseline health'],
      individualVariance: ['Prolactin response: ±40% (highly individual)', 'E2/prolactin interaction not modeled', 'Genetics: ±20-30%']
    },
    sideEffectProfile: {
      common: [
        { name: 'Sexual Dysfunction (Deca Dick)', severity: 'medium-high', onset: 'week 3-6', doseDependent: true, management: 'Cabergoline 0.5mg 2x/week; P5P 200mg daily' },
        { name: 'Prolactin Elevation', severity: 'medium', onset: 'week 2-4', doseDependent: true, management: 'Cabergoline or Pramipexole; monitor prolactin levels' },
        { name: 'Water Retention', severity: 'low-medium', onset: 'week 1-2', doseDependent: true, management: 'Less than Test; mild AI may help' },
        { name: 'Joint Relief', severity: 'positive', onset: 'week 2-3', doseDependent: true, management: 'Beneficial effect; fluid in joints' },
        { name: 'Gynecomastia Risk', severity: 'low-medium', onset: 'week 4+', doseDependent: true, management: 'Prolactin-mediated; cabergoline more important than AI' }
      ],
      lipidProfile: {
        hdlDecline: 'moderate (similar to Test)',
        ldlIncrease: 'mild (↑10-15%)',
        triglycerides: 'mild increase',
        management: 'Standard lipid management; fish oil, cardio'
      },
      cardiovascular: {
        bloodPressure: 'mild increase (less than Test)',
        lvh: 'dose-dependent risk similar to Test',
        rbc: 'moderate increase',
        management: 'Monitor BP; standard cardio protocol'
      },
      hpta: {
        suppression: 'severe; progestogenic effects compound suppression',
        recovery: '3-4 months; slower than Test due to progesterone effects',
        pctRequired: true,
        management: 'Extended PCT recommended; HCG during cycle strongly advised'
      }
    },
    ancillaryRequirements: {
      dopamineAgonist: {
        trigger: 'Dose >200mg/week or prolactin symptoms',
        examples: ['Cabergoline (Dostinex) 0.5mg 2x/week', 'Pramipexole 0.25-0.5mg daily'],
        dosing: 'Start 0.25mg cabergoline 2x/week; increase if symptoms persist',
        note: 'More critical than AI for NPP; prevents deca dick'
      },
      p5p: {
        trigger: 'All doses; preventive',
        dosing: '200mg P5P (Vitamin B6) daily',
        purpose: 'Mild prolactin control; not sufficient alone at high doses'
      },
      aromataseInhibitor: {
        trigger: 'If stacked with Test; NPP aromatizes minimally',
        dosing: 'Lower than Test-only cycles; adjust based on Test dose',
        note: 'NPP itself needs minimal AI; focus on prolactin management'
      },
      hcg: {
        trigger: 'Strongly recommended due to severe suppression',
        dosing: '250-500 IU twice weekly throughout cycle',
        purpose: 'Maintains testicular function; critical for NPP recovery'
      }
    }
  },

  trenbolone: {
    name: 'Trenbolone',
    color: '#CC0000',
    abbreviation: 'Tren',
    type: 'injectable',
    category: 'androgen',
    modelConfidence: 0.44,
    evidenceProvenance: { human: 0, animal: 4, aggregate: 7 },
    varianceDrivers: [
      'Sympathetic nervous system sensitivity (anxiety/insomnia)',
      'CNS resilience and sleep debt management',
      'Renal filtration/hematocrit interactions'
    ],
    benefitCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 100, value: 2.67, tier: 'Tier 3', source: 'Yarrow et al. (2011) rat study HED-scaled', caveat: 'Animal data; high potency; steep rise', ci: 0.6 },
      { dose: 200, value: 3.67, tier: 'Tier 3', source: 'Yarrow HED-scaled', caveat: 'Peak "bang-for-buck"; ~70% forum users report plateau', ci: 0.6 },
      { dose: 300, value: 4.333, tier: 'Tier 4', source: 'Forum consensus', caveat: 'Anecdotal diminishing gains; mood changes dominate', ci: 0.63 },
      { dose: 400, value: 4.87, tier: 'Tier 4', source: 'Forum patterns', caveat: 'Benefit plateau; no proportional gains reported', ci: 0.63 },
      { dose: 500, value: 4.87, tier: 'Tier 4', source: 'Forum patterns', caveat: 'FLAT PLATEAU - gains stop increasing', ci: 0.63 },
      { dose: 600, value: 4.87, tier: 'Tier 4', source: 'Forum patterns', caveat: 'FLAT PLATEAU - no additional benefit', ci: 0.63 },
      { dose: 800, value: 4.87, tier: 'Tier 4', source: 'Forum patterns', caveat: 'FLAT PLATEAU - sides dominate', ci: 0.63 },
      { dose: 1000, value: 4.87, tier: 'Tier 4', source: 'Forum patterns', caveat: 'FLAT PLATEAU - not recommended', ci: 0.63 },
      { dose: 1200, value: 4.87, tier: 'Tier 4', source: 'Forum patterns', caveat: 'FLAT PLATEAU - extreme risk', ci: 0.63 },
    ],
    riskCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 100, value: 0.8, tier: 'Tier 3', source: 'HED-scaled + inference', caveat: 'Mild; animal data extrapolated', ci: 0.6 },
      { dose: 200, value: 2.0, tier: 'Tier 3', source: 'Forum reports', caveat: 'Aggression/mood emerging; ~30% report sides', ci: 0.6 },
      { dose: 300, value: 3.2, tier: 'Tier 4', source: 'Forum aggregates', caveat: 'Significant psych + lipid risk; ~50% report insomnia/mood', ci: 0.7 },
      { dose: 400, value: 4.2, tier: 'Tier 4', source: 'Anecdotal patterns', caveat: 'High risk; aggression/paranoia ~70%; severe lipid decline', ci: 0.8 },
      { dose: 500, value: 4.8, tier: 'Tier 4', source: 'Anecdotal patterns', caveat: 'Very high risk; psychological sides dominate', ci: 0.8 },
      { dose: 600, value: 5.0, tier: 'Tier 4', source: 'Anecdotal patterns', caveat: 'CRITICAL RISK ZONE - unknown cardio risk', ci: 0.8 },
    ],
    methodology: {
      summary: 'Tier 3 (0-400mg, Yarrow rat study); Tier 4 (400+, entirely anecdotal); NO HUMAN DATA',
      benefitRationale: 'Yarrow et al. (2011) rat study shows tissue-selective anabolism at low doses, HED-scaled to ~50-250mg human equivalent. ~70% of forum users report plateau 300-350mg. Benefit FLAT post-300mg (not declining) - plateau represents saturation, not reversal.',
      riskRationale: 'Aggression/neuro: Self-reported forum data; Tren\'s GABA antagonism theoretical. ~50% report mood/insomnia at 200-350mg; ~70% at 350-500mg. Cardio risk inferred from high androgenicity + lipid decline; not measured. NO HUMAN DOSE-RESPONSE DATA AT ANY DOSE.',
      sources: ['Yarrow et al. (2011) - Tren anabolic response in rats', 'r/steroids wiki - ~3000 cycle logs', 'Meso-Rx, AnabolicMinds - ~2000 reports', 'VigorousSteve harm reduction framing'],
      limitations: ['NO HUMAN DATA on Tren at any supraphysio dose', 'Aggression/neurotox reports self-reported; high bias (extreme cases vocal)', 'Cardio risk extrapolated from androgenicity; could be over/underestimated', 'Individual psychological vulnerability unknown; genetic factors likely'],
      assumptions: ['Age 25-40', 'No pre-existing mental health conditions', 'Proper lipid management', 'HED scaling ~70% translatable (unvalidated at supraphysio)'],
      individualVariance: ['COMT polymorphisms: dopamine metabolism affects psychological response', 'Psychological baseline: stress tolerance varies', 'Genetics unknown: ±30-40% variance in side effects']
    },
    sideEffectProfile: {
      common: [
        { name: 'Aggression/Irritability', severity: 'medium-high', onset: 'week 1-2', doseDependent: true, management: 'Dosage control; psychological awareness; avoid if prone to anger' },
        { name: 'Insomnia/Night Sweats', severity: 'high', onset: 'week 1', doseDependent: true, management: 'Dosing earlier in day; sleep hygiene; may not resolve' },
        { name: 'Anxiety/Paranoia', severity: 'medium-high', onset: 'week 2-4', doseDependent: true, management: 'Dosage reduction; psychological support; discontinue if severe' },
        { name: 'Tren Cough', severity: 'low-medium', onset: 'immediately post-injection', doseDependent: false, management: 'Self-limiting; slow injection; stay calm' },
        { name: 'Dark Urine', severity: 'low', onset: 'throughout', doseDependent: false, management: 'Monitor kidney function; stay hydrated' },
        { name: 'Reduced Cardio Capacity', severity: 'medium', onset: 'week 2+', doseDependent: true, management: 'Expected; limit intensity; not reversible on-cycle' }
      ],
      lipidProfile: {
        hdlDecline: 'severe (worst of all injectables)',
        ldlIncrease: 'moderate-severe',
        triglycerides: 'moderate-severe increase',
        management: 'Aggressive lipid management essential; statins, fish oil, daily LISS cardio'
      },
      cardiovascular: {
        bloodPressure: 'significant increase (monitor closely)',
        lvh: 'high risk; accelerated by Tren\'s potency',
        rbc: 'significant increase; donate blood frequently',
        management: 'BP meds if >140/90; cardio monitoring; limit duration to 8-12 weeks max'
      },
      psychological: {
        aggression: 'dose-dependent; ~70% report at 350mg+',
        mood: 'lability common; depression possible',
        sleep: 'insomnia nearly universal; night sweats',
        management: 'Psychological stability required; lower doses if unstable; discontinue if severe'
      },
      hpta: {
        suppression: 'complete and severe; 19-nor compound',
        recovery: '4-6 months; among slowest to recover',
        pctRequired: true,
        management: 'Extended PCT; HCG during cycle critical; expect long recovery'
      }
    },
    ancillaryRequirements: {
      dopamineAgonist: {
        trigger: 'Recommended; Tren affects prolactin despite no aromatization',
        examples: ['Cabergoline 0.25-0.5mg 2x/week'],
        dosing: 'Lower doses than NPP; monitor libido',
        note: 'Prevents prolactin sides; helps with mood'
      },
      bloodPressureManagement: {
        trigger: 'Essential at all doses',
        examples: ['Telmisartan 40-80mg daily', 'Nebivolol 5-10mg'],
        monitoring: 'Daily BP checks; doctor consultation if >140/90',
        note: 'Tren significantly raises BP; manage proactively'
      },
      lipidManagement: {
        trigger: 'Required at all doses',
        examples: ['Statins (rosuvastatin 10-20mg)', 'Fish oil 4g+ EPA/DHA', 'Berberine', 'Daily LISS cardio 30min+'],
        monitoring: 'Lipid panel every 6 weeks; expect severe decline',
        note: 'Most hepatotoxic to lipids; aggressive management needed'
      },
      sleepAids: {
        trigger: 'Nearly universal insomnia',
        examples: ['Melatonin 5-10mg', 'Magnesium glycinate 400mg', 'CBD', 'Avoid benzos long-term'],
        note: 'May not fully resolve; dosing earlier in day helps slightly'
      },
      psychologicalSupport: {
        trigger: 'If aggression/mood changes appear',
        management: 'Awareness of mood; support system; reduce dose or discontinue if severe',
        note: 'Not all users experience; COMT polymorphisms affect response'
      }
    }
  },

  eq: {
    name: 'EQ (Equipoise/Boldenone)',
    color: '#00AA00',
    abbreviation: 'EQ',
    type: 'injectable',
    category: 'endurance',
    modelConfidence: 0.58,
    evidenceProvenance: { human: 1, animal: 3, aggregate: 4 },
    varianceDrivers: [
      'Baseline hematocrit/RBC levels dictate cardio risk',
      'Mildly anxiogenic in some users (neuro variance)',
      'Underdosing risk due to long ester + UGL concentration drift'
    ],
    benefitCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 200, value: 0.5, tier: 'Tier 2', source: 'Veterinary data extrapolated', caveat: 'Mild anabolic (index ~50); gradual rise', ci: 0.4 },
      { dose: 400, value: 1.0, tier: 'Tier 2', source: 'Forum consensus', caveat: 'Endurance/RBC benefits; vascularity', ci: 0.4 },
      { dose: 600, value: 1.5, tier: 'Tier 2/4', source: 'Anecdotal', caveat: 'Appetite stimulation; gains asymptote', ci: 0.5 },
      { dose: 800, value: 2.0, tier: 'Tier 4', source: 'Forum patterns', caveat: 'Plateau; no additional benefit reported', ci: 0.5 },
      { dose: 1000, value: 2.5, tier: 'Tier 4', source: 'Forum patterns', caveat: 'Diminishing returns', ci: 0.5 },
      { dose: 1200, value: 3.0, tier: 'Tier 4', source: 'Forum patterns', caveat: 'Gentle rise; weak compound', ci: 0.5 },
    ],
    riskCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 200, value: 0.3, tier: 'Tier 2', source: 'Anecdotal', caveat: 'Very mild; anxiety in some users', ci: 0.4 },
      { dose: 400, value: 0.6, tier: 'Tier 2', source: 'Forum reports', caveat: 'Emerging anxiety ~20% of users; mechanism unclear', ci: 0.5 },
      { dose: 600, value: 1.0, tier: 'Tier 2/4', source: 'Anecdotal aggregates', caveat: 'Anxiety inconsistent; may be individual/E2-related', ci: 0.6 },
      { dose: 800, value: 1.3, tier: 'Tier 4', source: 'Forum patterns', caveat: 'Anxiety escalates ~40%; dose-dependent unclear', ci: 0.6 },
      { dose: 1200, value: 1.6, tier: 'Tier 4', source: 'Forum patterns', caveat: 'High variance; anxiety mechanism unknown', ci: 0.6 },
    ],
    methodology: {
      summary: 'Tier 2 (0-600mg, veterinary extrapolated); Tier 4 (600+, anecdotal); weak compound',
      benefitRationale: 'Gradual rise; mild anabolic index ~50. Endurance/RBC benefits reported. Appetite stimulation, vascularity. Gains asymptote 400-800mg. Veterinary origins; clinical data sparse.',
      riskRationale: 'Anxiety reported ~20-40% of users; unclear if dose-dependent or individual neuroticism. E2-related anxiety possible (aromatizes less than Test). Lipid impact modest. NO CLINICAL DOSE-RESPONSE DATA.',
      sources: ['Veterinary boldenone data', 'r/steroids wiki', 'Meso-Rx forums - aggregated reports', 'AnabolicMinds community logs'],
      limitations: ['Low potency means few users push to extremes; sample bias', 'Anxiety mechanism unclear; could be dose-dependent, E2-related, or individual', 'No controlled human studies'],
      assumptions: ['Age 25-40', 'E2 managed', 'Baseline mental health stable'],
      individualVariance: ['Anxiety response: ±60% (highly variable)', 'E2 conversion affects sides', 'Genetics: ±30%']
    },
    sideEffectProfile: {
      common: [
        { name: 'Anxiety', severity: 'low-medium', onset: 'week 4-8', doseDependent: 'unclear', management: 'Dosage adjustment; E2 management; discontinue if persistent' },
        { name: 'Increased Appetite', severity: 'positive', onset: 'week 2-3', doseDependent: true, management: 'Beneficial for mass gaining; control if cutting' },
        { name: 'RBC Elevation', severity: 'low-medium', onset: 'week 4+', doseDependent: true, management: 'Donate blood if HCT >52%; monitor regularly' },
        { name: 'Vascularity', severity: 'positive', onset: 'week 4-6', doseDependent: true, management: 'Aesthetic benefit; RBC-related' },
        { name: 'Acne', severity: 'low', onset: 'week 2-4', doseDependent: true, management: 'Mild; standard hygiene' }
      ],
      lipidProfile: {
        hdlDecline: 'mild (less than Test)',
        ldlIncrease: 'mild',
        triglycerides: 'mild increase',
        management: 'Standard lipid protocol; less aggressive than Test/Tren'
      },
      cardiovascular: {
        bloodPressure: 'mild increase',
        lvh: 'low risk at moderate doses',
        rbc: 'significant increase; primary cardio concern',
        management: 'Monitor HCT closely; donate blood; stay hydrated'
      },
      hpta: {
        suppression: 'moderate; less severe than 19-nors',
        recovery: '2-3 months; similar to Test',
        pctRequired: true,
        management: 'Standard PCT protocol'
      }
    },
    ancillaryRequirements: {
      aromataseInhibitor: {
        trigger: 'If stacked with Test; EQ aromatizes minimally',
        dosing: 'Lower than Test-only; EQ adds minimal E2',
        note: 'EQ anxiety may be low-E2 related; avoid over-using AI'
      },
      bloodDonation: {
        trigger: 'Essential; EQ significantly raises HCT',
        frequency: 'Every 8-12 weeks or if HCT >52%',
        monitoring: 'CBC every 6-8 weeks',
        note: 'Primary ancillary concern for EQ; neglecting causes thick blood'
      },
      anxietyManagement: {
        trigger: 'If anxiety develops (20-40% of users)',
        management: 'Check E2 levels; adjust AI; reduce EQ dose; psychological support',
        note: 'Mechanism unclear; may be E2, individual, or EQ metabolites'
      }
    }
  },

  masteron: {
    name: 'Masteron (Drostanolone)',
    color: '#9933FF',
    abbreviation: 'Masteron',
    type: 'injectable',
    category: 'cosmetic',
    modelConfidence: 0.55,
    evidenceProvenance: { human: 1, animal: 1, aggregate: 4 },
    varianceDrivers: [
      'Requires low bodyfat (<12%) for cosmetic hardness effect',
      'DHT-sensitivity (hairline/prostate) amplifies risk variance',
      'Masteron crushes SHBG — stacking context matters'
    ],
    benefitCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 200, value: 0.8, tier: 'Tier 4', source: 'Anecdotal', caveat: 'Cosmetic (hardening, anti-E); low anabolic index ~40', ci: 0.5 },
      { dose: 400, value: 1.2, tier: 'Tier 4', source: 'Forum consensus', caveat: 'Plateau; no additional lean mass', ci: 0.5 },
      { dose: 600, value: 1.3, tier: 'Tier 4', source: 'Forum patterns', caveat: 'Flat; primarily used as ancillary', ci: 0.5 },
    ],
    riskCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 200, value: 0.4, tier: 'Tier 4', source: 'Anecdotal', caveat: 'Androgenic sides; prostate concerns theoretical', ci: 0.6 },
      { dose: 400, value: 0.8, tier: 'Tier 4', source: 'Theory', caveat: 'Weak compound; low absolute risk', ci: 0.7 },
      { dose: 600, value: 1.1, tier: 'Tier 4', source: 'Theory', caveat: 'Prostate risk assumed but not measured', ci: 0.8 },
    ],
    methodology: {
      summary: 'Tier 4 (entirely anecdotal); no clinical data; cosmetic compound',
      benefitRationale: 'Cosmetic (hardening, anti-E via 5-alpha metabolite); low anabolic index ~40. Primarily used in stacks. Plateau at ~400mg; no additional lean mass reported.',
      riskRationale: 'Androgenic sides; prostate concerns theoretical (not measured). Lipid impact moderate. Primarily used as ancillary; solo cycle logs rare.',
      sources: ['Forum aggregates (r/steroids, Meso-Rx)', 'Pharmacology inference from chemistry', 'Anecdotal reports only'],
      limitations: ['NO CLINICAL DATA - all inference from chemistry + forum reports', 'Primarily used as ancillary to stacks; solo cycle logs rare', 'Prostate risk assumed but not measured'],
      assumptions: ['Age 25-40', 'Used as ancillary', 'Baseline prostate health'],
      individualVariance: ['Androgenic response: ±40%', 'Genetics: ±30%']
    },
    sideEffectProfile: {
      common: [
        { name: 'Muscle Hardening', severity: 'positive', onset: 'week 2-3', doseDependent: true, management: 'Aesthetic benefit; cosmetic only' },
        { name: 'Hair Loss (MPB)', severity: 'medium', onset: 'week 2-4', doseDependent: true, management: 'DHT-derivative; finasteride ineffective; only option is discontinuation' },
        { name: 'Prostate Enlargement', severity: 'low-medium', onset: 'week 4+', doseDependent: true, management: 'Monitor PSA; discontinue if symptoms develop' },
        { name: 'Anti-Estrogenic Effect', severity: 'positive', onset: 'week 1-2', doseDependent: true, management: 'May reduce water retention; cosmetic benefit' },
        { name: 'Acne', severity: 'low-medium', onset: 'week 1-2', doseDependent: true, management: 'Standard hygiene; androgenic' }
      ],
      lipidProfile: {
        hdlDecline: 'moderate',
        ldlIncrease: 'mild-moderate',
        triglycerides: 'mild increase',
        management: 'Standard lipid protocol'
      },
      cardiovascular: {
        bloodPressure: 'mild increase',
        lvh: 'low risk at typical doses',
        rbc: 'mild increase',
        management: 'Standard monitoring'
      },
      hpta: {
        suppression: 'moderate; typical for injectables',
        recovery: '2-3 months',
        pctRequired: true,
        management: 'Standard PCT protocol'
      }
    },
    ancillaryRequirements: {
      aromataseInhibitor: {
        trigger: 'Not required; Masteron does not aromatize',
        note: 'May have mild anti-E properties; can reduce AI needs slightly in stack'
      },
      hairLossPrevention: {
        trigger: 'If prone to MPB',
        management: 'Finasteride ineffective (DHT derivative); only option is dose reduction or discontinuation',
        note: 'Primary concern for MPB-prone users; consider before starting'
      },
      prostateMonitoring: {
        trigger: 'All users; especially >40 years old',
        monitoring: 'PSA test pre-cycle and mid-cycle',
        note: 'Theoretical risk; not well-documented'
      }
    }
  },

  primobolan: {
    name: 'Primobolan (Methenolone)',
    color: '#996633',
    abbreviation: 'Primo',
    type: 'injectable',
    category: 'mild',
    modelConfidence: 0.57,
    evidenceProvenance: { human: 1, animal: 1, aggregate: 4 },
    varianceDrivers: [
      'High counterfeit/underdosed risk (costly compound)',
      'Needs caloric surplus + high protein to shine',
      'Low aromatization → synergy depends on Test baseline'
    ],
    benefitCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 100, value: 0.44, tier: 'Tier 2', source: 'Therapeutic data', caveat: 'Mild anabolic index ~44; lean gains', ci: 0.3 },
      { dose: 200, value: 0.88, tier: 'Tier 2/4', source: 'Therapeutic extrapolated', caveat: 'Weak compound; variable response', ci: 0.4 },
      { dose: 400, value: 1.3, tier: 'Tier 4', source: 'Forum reports', caveat: 'Anecdotal plateau; cost-prohibitive', ci: 0.5 },
      { dose: 600, value: 1.5, tier: 'Tier 4', source: 'Forum patterns', caveat: 'No additional benefit; rare to use this high', ci: 0.5 },
    ],
    riskCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 100, value: 0.2, tier: 'Tier 2', source: 'Therapeutic data', caveat: 'Very mild; minimal risk', ci: 0.3 },
      { dose: 200, value: 0.4, tier: 'Tier 2/4', source: 'Therapeutic extrapolated', caveat: 'Hepatic stress minimal (injectable form)', ci: 0.4 },
      { dose: 400, value: 0.6, tier: 'Tier 4', source: 'Theory', caveat: 'High cost; rare to use this high', ci: 0.5 },
      { dose: 600, value: 0.8, tier: 'Tier 4', source: 'Theory', caveat: 'Speculative; very few users report', ci: 0.7 },
    ],
    methodology: {
      summary: 'Tier 2 (0-200mg, therapeutic data); Tier 4 (200+, weak data)',
      benefitRationale: 'Therapeutic dose data; mild anabolic index ~44. Anecdotal plateau 200-600mg. Weak compound; variable response. Cost-prohibitive at high doses.',
      riskRationale: 'Very mild; hepatic stress risk assumed minimal (injectable form). Weak androgenicity. Almost no empirical data at supraphysio doses.',
      sources: ['Therapeutic methenolone data (50-100mg)', 'Forum reports (sparse)', 'Pharmacology inference'],
      limitations: ['Expensive; often underdosed in black market (real-world data compromised)', 'Weak compound = few extreme use cases; sample bias', 'Very limited clinical data'],
      assumptions: ['Age 25-40', 'Injectable form (not oral)', 'Baseline health'],
      individualVariance: ['Response: ±50% (highly variable)', 'Genetics: ±30%']
    },
    sideEffectProfile: {
      common: [
        { name: 'Lean Muscle Gains', severity: 'positive', onset: 'week 3-4', doseDependent: true, management: 'Slow, quality gains; minimal water' },
        { name: 'Hair Loss (MPB)', severity: 'low', onset: 'week 4+', doseDependent: true, management: 'Mild; less than Test; DHT-derived' },
        { name: 'Very Mild Sides', severity: 'positive', onset: 'throughout', doseDependent: false, management: 'Among mildest injectables; well-tolerated' },
        { name: 'Acne', severity: 'low', onset: 'week 2-4', doseDependent: true, management: 'Minimal; standard hygiene' }
      ],
      lipidProfile: {
        hdlDecline: 'mild (minimal impact)',
        ldlIncrease: 'mild',
        triglycerides: 'minimal impact',
        management: 'Standard protocol; among best lipid profiles'
      },
      cardiovascular: {
        bloodPressure: 'minimal impact',
        lvh: 'very low risk',
        rbc: 'mild increase',
        management: 'Standard monitoring; minimal intervention needed'
      },
      hpta: {
        suppression: 'moderate; typical for injectables',
        recovery: '2-3 months',
        pctRequired: true,
        management: 'Standard PCT protocol'
      }
    },
    ancillaryRequirements: {
      aromataseInhibitor: {
        trigger: 'Not required; Primo does not aromatize',
        note: 'Can be run without AI if solo; adjust for Test if stacked'
      },
      general: {
        note: 'Minimal ancillaries needed; among safest injectables',
        management: 'Standard PCT; blood work monitoring; very low side effect profile'
      },
      costConsideration: {
        note: 'Expensive compound; often counterfeited or underdosed',
        management: 'Source verification critical; may need higher doses than reported due to underdosing'
      }
    }
  },

  // ORAL COMPOUNDS (dosage in mg/day)
  dianabol: {
    name: 'Dianabol (Methandrostenolone)',
    color: '#FF1493',
    abbreviation: 'Dbol',
    type: 'oral',
    category: 'oral_kickstart',
    modelConfidence: 0.33,
    evidenceProvenance: { human: 0, animal: 1, aggregate: 6 },
    varianceDrivers: [
      'Sodium intake + water retention habits swing perceived benefit',
      'Aromatase expression dictates gyno/HCT risk',
      'Baseline liver enzymes determine tolerability'
    ],
    usagePattern: 'Kickstart (weeks 1-4) or mid-cycle (weeks 5-8)',
    benefitCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 10, value: 1.2, tier: 'Tier 4', source: 'Community patterns', caveat: 'Rapid water + glycogen', ci: 0.6 },
      { dose: 20, value: 2.3, tier: 'Tier 4', source: 'Forum consensus', caveat: 'Classic dose; mass + strength spike', ci: 0.6 },
      { dose: 30, value: 3.0, tier: 'Tier 4', source: 'Community reports', caveat: 'High dose; plateau emerging', ci: 0.7 },
      { dose: 40, value: 3.3, tier: 'Tier 4', source: 'Anecdotal', caveat: 'Sides dominate; marginal benefit increase', ci: 0.7 },
      { dose: 50, value: 3.4, tier: 'Tier 4', source: 'Anecdotal', caveat: 'Not recommended; risk exceeds benefit', ci: 0.8 }
    ],
    riskCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 10, value: 0.5, tier: 'Tier 4', source: 'Community patterns', caveat: 'Minimal hepatic + E2', ci: 0.6 },
      { dose: 20, value: 0.8, tier: 'Tier 4', source: 'Forum consensus', caveat: 'Mostly estrogenic risk', ci: 0.6 },
      { dose: 30, value: 1.5, tier: 'Tier 4', source: 'Community reports', caveat: 'E2 + mild hepatic stress emerging', ci: 0.7 },
      { dose: 40, value: 2.2, tier: 'Tier 4', source: 'Anecdotal', caveat: 'E2 + moderate hepatic stress', ci: 0.8 },
      { dose: 50, value: 2.8, tier: 'Tier 4', source: 'Anecdotal', caveat: 'E2 + significant hepatic stress', ci: 0.9 }
    ],
    methodology: {
      summary: 'Tier 4 (entirely anecdotal); NO HUMAN DATA at supraphysio doses',
      benefitRationale: 'Rapid glycogen/water loading creates "moon face" + strength spike. Anecdotal mass gains 5-10 lbs in 4 weeks (mostly water). Classic kickstart compound; benefits plateau 20-30mg.',
      riskRationale: 'C17-alpha alkylated = hepatic stress. Aromatizes heavily = E2 sides. Lipid decline significant. BP elevation common. NO CLINICAL DATA at any dose for bodybuilding use.',
      sources: ['Community aggregates (r/steroids, Meso-Rx)', 'Historical bodybuilding use patterns', 'Pharmacology inference from structure'],
      limitations: ['NO HUMAN STUDIES at supraphysio doses', 'Black market quality variable', 'Short half-life = multiple daily dosing', 'Individual hepatic response varies ±50%'],
      assumptions: ['TUDCA use mandatory', 'Duration 4-6 weeks maximum', 'Age 25-40', 'Baseline liver health'],
      individualVariance: ['Aromatization: ±30%', 'Hepatic tolerance: ±50%', 'Water retention: ±40%']
    },
    sideEffectProfile: {
      common: [
        { name: 'Severe Water Retention', severity: 'high', onset: 'day 1-3', doseDependent: true, management: 'AI mandatory; dietary sodium control; cosmetic issue' },
        { name: 'Gynecomastia Risk', severity: 'high', onset: 'week 1-2', doseDependent: true, management: 'AI essential; SERM backup; Dbol aromatizes heavily' },
        { name: 'Acne', severity: 'medium', onset: 'week 1-2', doseDependent: true, management: 'Standard hygiene; androgenic + E2-related' },
        { name: 'Rapid Strength Gain', severity: 'positive', onset: 'day 3-7', doseDependent: true, management: 'Tendon adaptation lags; avoid ego lifting' },
        { name: 'Back Pumps', severity: 'low-medium', onset: 'week 1-2', doseDependent: true, management: 'Taurine 3-5g daily; stretch frequently' }
      ],
      lipidProfile: {
        hdlDecline: 'severe (oral characteristic)',
        ldlIncrease: 'moderate-severe',
        triglycerides: 'moderate increase',
        management: 'Fish oil, statins if severe, limit duration to 4-6 weeks'
      },
      cardiovascular: {
        bloodPressure: 'significant increase (water retention + RBC)',
        lvh: 'risk with prolonged use',
        rbc: 'moderate increase',
        management: 'BP monitoring daily; ARBs if >140/90; donate blood if HCT >52%'
      },
      hepatic: {
        altAstElevation: 'moderate (c17-alpha alkylated)',
        cholestasis: 'low risk at typical doses',
        management: 'TUDCA 500-1000mg daily MANDATORY; NAC 1200mg; limit to 4-6 weeks; bloodwork every 4 weeks',
        reversibility: 'Usually reversible within 4-8 weeks post-cycle if caught early'
      },
      hpta: {
        suppression: 'complete (oral + aromatization)',
        recovery: '2-3 months with PCT',
        pctRequired: true,
        management: 'Standard PCT; HCG during cycle recommended'
      }
    },
    ancillaryRequirements: {
      tudca: {
        trigger: 'MANDATORY for all doses',
        dosing: '500-1000mg daily, 3 hours after Dbol dose',
        purpose: 'Hepatic protection; non-negotiable',
        cost: 15
      },
      nac: {
        trigger: 'Recommended',
        dosing: '1200mg daily',
        purpose: 'Adjunct liver support',
        cost: 3
      },
      aromataseInhibitor: {
        trigger: 'MANDATORY for all doses',
        dosing: '0.5mg anastrozole EOD minimum; adjust based on Test stack',
        note: 'Dbol aromatizes heavily; E2 management critical for preventing gyno',
        cost: 3
      },
      bloodPressureManagement: {
        trigger: 'If BP >140/90',
        dosing: 'Telmisartan 40mg or ARB of choice',
        monitoring: 'Daily BP checks',
        cost: 5
      },
      taurine: {
        trigger: 'If back pumps develop',
        dosing: '3-5g daily',
        purpose: 'Reduce painful muscle pumps',
        cost: 2
      }
    }
  },

  anadrol: {
    name: 'Anadrol (Oxymetholone)',
    color: '#DC143C',
    abbreviation: 'Adrol',
    type: 'oral',
    category: 'oral_mass',
    modelConfidence: 0.31,
    evidenceProvenance: { human: 1, animal: 1, aggregate: 5 },
    varianceDrivers: [
      'Idiosyncratic hepatic tolerance varies ±50%',
      'Paradoxical estrogenic pathway differs per user',
      'RBC expansion and BP response drive cardio strain'
    ],
    usagePattern: 'Mid-cycle mass push (weeks 5-8) or finisher (weeks 9-12)',
    benefitCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 25, value: 1.5, tier: 'Tier 4', source: 'Community patterns', caveat: 'Moderate dose; mass + strength', ci: 0.6 },
      { dose: 50, value: 3.2, tier: 'Tier 4', source: 'Forum consensus', caveat: 'Classic dose; extreme water + strength', ci: 0.6 },
      { dose: 75, value: 4.0, tier: 'Tier 4', source: 'Community reports', caveat: 'High dose; plateau emerging', ci: 0.7 },
      { dose: 100, value: 4.3, tier: 'Tier 4', source: 'Anecdotal', caveat: 'Very high dose; sides severe', ci: 0.8 },
      { dose: 150, value: 4.5, tier: 'Tier 4', source: 'Anecdotal', caveat: 'Extreme dose; not recommended', ci: 0.8 }
    ],
    riskCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 25, value: 0.9, tier: 'Tier 4', source: 'Community patterns', caveat: 'Estrogenic + mild hepatic stress', ci: 0.6 },
      { dose: 50, value: 1.8, tier: 'Tier 4', source: 'Forum consensus', caveat: 'Estrogenic + moderate hepatic stress', ci: 0.7 },
      { dose: 75, value: 2.8, tier: 'Tier 4', source: 'Community reports', caveat: 'Estrogenic + severe hepatic stress', ci: 0.8 },
      { dose: 100, value: 3.5, tier: 'Tier 4', source: 'Anecdotal', caveat: 'Estrogenic + critical hepatic stress', ci: 0.9 },
      { dose: 150, value: 4.2, tier: 'Tier 4', source: 'Anecdotal', caveat: 'Estrogenic + extreme hepatic stress; jaundice risk', ci: 1.0 }
    ],
    methodology: {
      summary: 'Tier 4 (entirely anecdotal); harshest oral for hepatic stress',
      benefitRationale: 'Extreme glycogen/water loading. "Wet" compound. Mass gains 10-15 lbs in 4 weeks (mostly water). Strength surge dramatic. Appetite stimulation. Plateau 50-75mg; diminishing returns above.',
      riskRationale: 'C17-alpha alkylated with severe hepatic stress. Lipid devastation (HDL crash, LDL spike). BP elevation extreme (water + RBC). Paradoxically estrogenic despite not aromatizing (mechanism unclear; possibly metabolite action at ER).',
      sources: ['Community consensus (r/steroids, Meso-Rx)', 'Historical bodybuilding patterns', 'Therapeutic AIDS wasting studies (25mg; not supraphysio)'],
      limitations: ['NO HUMAN DATA at bodybuilding doses', 'Hepatic tolerance highly individual', 'Estrogenic mechanism not fully understood', 'Short half-life = twice-daily dosing'],
      assumptions: ['TUDCA mandatory (high dose)', 'Duration 4-6 weeks MAXIMUM', 'Baseline liver health', 'Age 25-40'],
      individualVariance: ['Hepatic response: ±60% (extreme variability)', 'Estrogenic sides: ±40%', 'BP response: ±30%']
    },
    sideEffectProfile: {
      common: [
        { name: 'Extreme Water Retention', severity: 'high', onset: 'day 1-2', doseDependent: true, management: 'AI helps but Adrol estrogenic via non-aromatase pathway; limit sodium' },
        { name: 'Appetite Stimulation', severity: 'positive', onset: 'day 2-5', doseDependent: true, management: 'Beneficial for mass phase' },
        { name: 'Lethargy', severity: 'medium-high', onset: 'week 2-3', doseDependent: true, management: 'Hepatic stress-related; reduce dose or discontinue' },
        { name: 'Nausea', severity: 'medium', onset: 'week 1-2', doseDependent: true, management: 'Take with food; ginger; reduce dose if severe' },
        { name: 'Headaches', severity: 'medium', onset: 'week 1-2', doseDependent: true, management: 'BP-related; monitor BP; hydration' },
        { name: 'Gynecomastia Risk', severity: 'medium-high', onset: 'week 2-3', doseDependent: true, management: 'Paradoxical (doesn\'t aromatize); AI helps; SERMs effective' }
      ],
      lipidProfile: {
        hdlDecline: 'extreme (worst of all orals)',
        ldlIncrease: 'severe',
        triglycerides: 'severe increase',
        management: 'Aggressive fish oil, statins if severe, LIMIT TO 4 WEEKS if possible'
      },
      cardiovascular: {
        bloodPressure: 'extreme increase (worst of orals)',
        lvh: 'high risk with prolonged use',
        rbc: 'significant increase',
        management: 'BP meds essential if >140/90; daily monitoring; donate blood; limit duration'
      },
      hepatic: {
        altAstElevation: 'severe (worst of common orals)',
        cholestasis: 'moderate risk',
        management: 'TUDCA 1000-1500mg daily MANDATORY; NAC 1800mg; bloodwork every 3 weeks; discontinue if ALT/AST >3x',
        reversibility: 'Usually reversible but slower than Dbol; permanent damage possible if abused'
      },
      hpta: {
        suppression: 'complete',
        recovery: '2-3 months with PCT',
        pctRequired: true,
        management: 'Standard PCT; HCG during cycle recommended'
      }
    },
    ancillaryRequirements: {
      tudca: {
        trigger: 'MANDATORY for all doses',
        dosing: '1000-1500mg daily, 3 hours after Adrol dose',
        purpose: 'Critical hepatic protection',
        cost: 20
      },
      nac: {
        trigger: 'MANDATORY',
        dosing: '1800mg daily (higher than other orals)',
        purpose: 'Adjunct liver support',
        cost: 4
      },
      aromataseInhibitor: {
        trigger: 'Recommended despite no aromatization',
        dosing: 'Moderate AI; helps with estrogenic sides',
        note: 'Paradoxically estrogenic; mechanism unclear; SERMs also effective',
        cost: 3
      },
      bloodPressureManagement: {
        trigger: 'ESSENTIAL; likely needed at all doses',
        dosing: 'Telmisartan 40-80mg',
        monitoring: 'Daily BP checks mandatory',
        cost: 5
      },
      lipidSupport: {
        trigger: 'MANDATORY',
        dosing: 'Fish oil 4g+, consider statins',
        monitoring: 'Lipid panel every 3 weeks',
        cost: 7
      }
    }
  },

  winstrol: {
    name: 'Winstrol (Stanozolol)',
    color: '#4169E1',
    abbreviation: 'Winny',
    type: 'oral',
    category: 'oral_cutting',
    modelConfidence: 0.4,
    evidenceProvenance: { human: 1, animal: 1, aggregate: 4 },
    varianceDrivers: [
      'Joint/tendon resilience (connective tissue dryness)',
      'CYP3A4 polymorphisms in hepatic metabolism',
      'Baseline lipid profile and dietary fat intake'
    ],
    usagePattern: 'Cutting/contest prep (last 6-8 weeks)',
    benefitCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 25, value: 0.9, tier: 'Tier 4', source: 'Community patterns', caveat: 'Mild hardening; dry look', ci: 0.6 },
      { dose: 50, value: 1.5, tier: 'Tier 4', source: 'Forum consensus', caveat: 'Classic dose; cosmetic hardening peaks', ci: 0.6 },
      { dose: 75, value: 1.8, tier: 'Tier 4', source: 'Community reports', caveat: 'High dose; marginal benefit increase', ci: 0.7 },
      { dose: 100, value: 1.9, tier: 'Tier 4', source: 'Anecdotal', caveat: 'Very high dose; joint pain severe', ci: 0.7 }
    ],
    riskCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 25, value: 0.7, tier: 'Tier 4', source: 'Community patterns', caveat: 'Mild hepatic + lipid stress', ci: 0.6 },
      { dose: 50, value: 1.4, tier: 'Tier 4', source: 'Forum consensus', caveat: 'Moderate hepatic + lipid crash + joint pain emerges', ci: 0.7 },
      { dose: 75, value: 2.3, tier: 'Tier 4', source: 'Community reports', caveat: 'Severe hepatic + lipid devastation + severe joint pain', ci: 0.8 },
      { dose: 100, value: 3.0, tier: 'Tier 4', source: 'Anecdotal', caveat: 'Critical hepatic + lipids critical + extreme joint pain', ci: 0.9 }
    ],
    methodology: {
      summary: 'Tier 4 (entirely anecdotal); cosmetic cutting compound',
      benefitRationale: 'Cosmetic hardening without mass gain. "Dry" compound (no water). Strength preservation during deficit. Aesthetic appeal for contest prep. Benefits plateau 50mg; diminishing returns above.',
      riskRationale: 'C17-alpha alkylated = hepatic stress. Lipid devastation (among worst). Joint drying/pain universal >50mg (collagen synthesis interference theoretical). NO CLINICAL DATA at bodybuilding doses.',
      sources: ['Community consensus (r/steroids, Meso-Rx)', 'Contest prep patterns', 'Ben Johnson scandal (athletic performance)'],
      limitations: ['NO HUMAN DATA at supraphysio doses', 'Joint pain mechanism not fully understood', 'Individual joint tolerance varies wildly', 'Injectable form available (less hepatic stress)'],
      assumptions: ['TUDCA mandatory', 'Duration 6-8 weeks maximum', 'Used during cut (caloric deficit compounds joint issues)', 'Age 25-40'],
      individualVariance: ['Joint pain: ±70% (extreme variability)', 'Hepatic tolerance: ±40%', 'Aesthetic response: ±30%']
    },
    sideEffectProfile: {
      common: [
        { name: 'Joint Pain/Drying', severity: 'high', onset: 'week 2-3', doseDependent: true, management: 'Glucosamine, fish oil, reduce dose; may not resolve until discontinuation' },
        { name: 'Muscle Hardness', severity: 'positive', onset: 'week 1-2', doseDependent: true, management: 'Cosmetic benefit; contest prep aesthetic' },
        { name: 'Tendon Issues', severity: 'medium', onset: 'week 3-4', doseDependent: true, management: 'Collagen synthesis interference; avoid heavy lifting; risk of injury' },
        { name: 'Hair Loss', severity: 'medium-high', onset: 'week 2-4', doseDependent: true, management: 'DHT-derived; finasteride ineffective; discontinue if severe' },
        { name: 'Acne', severity: 'low-medium', onset: 'week 1-2', doseDependent: true, management: 'Androgenic; standard hygiene' }
      ],
      lipidProfile: {
        hdlDecline: 'extreme (among worst of all AAS)',
        ldlIncrease: 'severe',
        triglycerides: 'moderate-severe increase',
        management: 'Aggressive lipid protocol; fish oil 4g+, statins, limit duration to 6 weeks'
      },
      cardiovascular: {
        bloodPressure: 'mild-moderate increase (less than Dbol/Adrol)',
        lvh: 'low risk at typical durations',
        rbc: 'mild increase',
        management: 'Standard BP monitoring; lipids primary concern'
      },
      hepatic: {
        altAstElevation: 'moderate-severe',
        cholestasis: 'low-moderate risk',
        management: 'TUDCA 500-1000mg daily; NAC 1200mg; limit to 6-8 weeks; bloodwork every 4 weeks',
        reversibility: 'Usually reversible; monitor closely'
      },
      hpta: {
        suppression: 'moderate (less suppressive than other orals)',
        recovery: '2-3 months with PCT',
        pctRequired: true,
        management: 'Standard PCT'
      }
    },
    ancillaryRequirements: {
      tudca: {
        trigger: 'MANDATORY',
        dosing: '500-1000mg daily',
        purpose: 'Hepatic protection',
        cost: 15
      },
      nac: {
        trigger: 'Recommended',
        dosing: '1200mg daily',
        purpose: 'Adjunct liver support',
        cost: 3
      },
      jointSupport: {
        trigger: 'ESSENTIAL; joint pain nearly universal >50mg',
        dosing: 'Glucosamine 1500mg, MSM 1000mg, fish oil 4g+',
        note: 'May not fully prevent pain; dose reduction often needed',
        cost: 6
      },
      lipidSupport: {
        trigger: 'MANDATORY',
        dosing: 'Fish oil 4g+, statins if severe',
        monitoring: 'Lipid panel every 4 weeks',
        cost: 7
      },
      hairLossPrevention: {
        trigger: 'If prone to MPB',
        management: 'Finasteride ineffective (DHT derivative); only option is discontinuation',
        note: 'Major concern for MPB-prone users'
      }
    }
  },

  anavar: {
    name: 'Anavar (Oxandrolone)',
    color: '#FF6347',
    abbreviation: 'Var',
    type: 'oral',
    category: 'oral_mild',
    modelConfidence: 0.48,
    evidenceProvenance: { human: 2, animal: 1, aggregate: 4 },
    varianceDrivers: [
      '3β-HSD polymorphisms determine activation efficiency',
      'Sex-specific metabolism (female-friendly compound) alters dose needs',
      'UGL dosing accuracy (expensive raw material)'
    ],
    usagePattern: 'Cutting/recomp (8-12 weeks) or female-friendly compound',
    benefitCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 25, value: 0.6, tier: 'Tier 4', source: 'Community patterns', caveat: 'Low dose; mild lean gains', ci: 0.5 },
      { dose: 50, value: 1.2, tier: 'Tier 4', source: 'Forum consensus', caveat: 'Classic dose; quality tissue + hardening', ci: 0.5 },
      { dose: 75, value: 1.6, tier: 'Tier 4', source: 'Community reports', caveat: 'High dose; plateau emerging', ci: 0.6 },
      { dose: 100, value: 1.8, tier: 'Tier 4', source: 'Anecdotal', caveat: 'Very high dose; marginal increase; cost-prohibitive', ci: 0.6 }
    ],
    riskCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 25, value: 0.3, tier: 'Tier 4', source: 'Community patterns', caveat: 'Minimal hepatic stress; well-tolerated', ci: 0.5 },
      { dose: 50, value: 0.7, tier: 'Tier 4', source: 'Forum consensus', caveat: 'Mild hepatic + lipid stress', ci: 0.6 },
      { dose: 75, value: 1.2, tier: 'Tier 4', source: 'Community reports', caveat: 'Moderate hepatic + lipid decline', ci: 0.6 },
      { dose: 100, value: 1.8, tier: 'Tier 4', source: 'Anecdotal', caveat: 'Increased hepatic + lipids concerning', ci: 0.7 }
    ],
    methodology: {
      summary: 'Tier 4 (anecdotal + therapeutic burn victim data); mildest oral',
      benefitRationale: 'Quality lean tissue gains. "Dry" compound. Mild hardening. Therapeutic use for burn victims and AIDS wasting (10-20mg). Anecdotal plateau 50-75mg. Weak compound; high doses needed for significant effects.',
      riskRationale: 'C17-alpha alkylated but milder hepatic stress than other orals. Lipid decline still significant. Well-tolerated relative to Dbol/Adrol. NO CLINICAL DATA at bodybuilding doses (>20mg).',
      sources: ['Therapeutic burn victim studies (10-20mg)', 'Community consensus (r/steroids, Meso-Rx)', 'Female athlete patterns'],
      limitations: ['Expensive; most counterfeited oral (often Winstrol or Dbol)', 'Weak compound = need high doses = cost-prohibitive', 'NO HUMAN DATA at supraphysio doses', 'Individual response ±50%'],
      assumptions: ['TUDCA recommended', 'Duration 8-12 weeks', 'Legitimate pharmaceutical source (UGL often fake)', 'Age 25-40 or female users'],
      individualVariance: ['Response: ±50% (highly variable)', 'Hepatic tolerance: ±40%', 'Source quality affects outcomes dramatically']
    },
    sideEffectProfile: {
      common: [
        { name: 'Lean Muscle Gains', severity: 'positive', onset: 'week 2-3', doseDependent: true, management: 'Quality tissue; minimal water' },
        { name: 'Muscle Hardness', severity: 'positive', onset: 'week 2-3', doseDependent: true, management: 'Cosmetic benefit; dry compound' },
        { name: 'Strength Increase', severity: 'positive', onset: 'week 1-2', doseDependent: true, management: 'Moderate strength gains' },
        { name: 'Minimal Sides', severity: 'positive', onset: 'throughout', doseDependent: false, management: 'Among mildest orals; well-tolerated' },
        { name: 'Pumps', severity: 'positive', onset: 'week 1-2', doseDependent: true, management: 'Taurine 3-5g if back pumps occur' }
      ],
      lipidProfile: {
        hdlDecline: 'moderate-severe (still significant despite "mild" reputation)',
        ldlIncrease: 'moderate',
        triglycerides: 'mild-moderate increase',
        management: 'Fish oil, lipid monitoring, longer duration tolerable than harsher orals'
      },
      cardiovascular: {
        bloodPressure: 'minimal impact',
        lvh: 'very low risk',
        rbc: 'mild increase',
        management: 'Standard monitoring; well-tolerated'
      },
      hepatic: {
        altAstElevation: 'mild-moderate (mildest of c17-alpha orals)',
        cholestasis: 'low risk',
        management: 'TUDCA 500mg daily recommended; NAC 1200mg; bloodwork every 6-8 weeks; can run 8-12 weeks',
        reversibility: 'Highly reversible; among safest orals for liver'
      },
      hpta: {
        suppression: 'moderate (less than other orals)',
        recovery: '2-3 months with PCT',
        pctRequired: true,
        management: 'Standard PCT'
      }
    },
    ancillaryRequirements: {
      tudca: {
        trigger: 'Recommended (not as critical as other orals)',
        dosing: '500mg daily',
        purpose: 'Hepatic protection',
        cost: 15
      },
      nac: {
        trigger: 'Recommended',
        dosing: '1200mg daily',
        purpose: 'Adjunct liver support',
        cost: 3
      },
      lipidSupport: {
        trigger: 'Recommended',
        dosing: 'Fish oil 3g+',
        monitoring: 'Lipid panel every 6-8 weeks',
        cost: 5
      },
      sourceVerification: {
        trigger: 'CRITICAL',
        note: 'Most counterfeited oral; pharmaceutical grade strongly preferred; UGL often fake (Winstrol or Dbol substituted)',
        management: 'Lab testing or trusted pharmaceutical source; underdosing extremely common'
      }
    }
  },

  halotestin: {
    name: 'Halotestin (Fluoxymesterone)',
    color: '#8B0000',
    abbreviation: 'Halo',
    type: 'oral',
    category: 'oral_extreme',
    modelConfidence: 0.27,
    evidenceProvenance: { human: 0, animal: 1, aggregate: 4 },
    varianceDrivers: [
      'Neurotransmitter sensitivity (aggression/anxiety)',
      'Hepatic enzyme capacity (ALT/AST baseline)',
      'Sleep quality + recovery debt prior to peaking'
    ],
    usagePattern: 'Contest prep final 2-3 weeks or strength peaking (powerlifting meet)',
    benefitCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 10, value: 1.8, tier: 'Tier 4', source: 'Community patterns', caveat: 'Extreme strength spike; aggression', ci: 0.8 },
      { dose: 20, value: 3.0, tier: 'Tier 4', source: 'Forum consensus', caveat: 'Peak strength; cosmetic hardening', ci: 0.8 },
      { dose: 30, value: 3.5, tier: 'Tier 4', source: 'Anecdotal', caveat: 'Very high dose; sides dominate', ci: 0.9 },
      { dose: 40, value: 3.7, tier: 'Tier 4', source: 'Anecdotal', caveat: 'Extreme dose; not advisable', ci: 0.9 }
    ],
    riskCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: 'Baseline', caveat: 'No AAS use', ci: 0.0 },
      { dose: 10, value: 2.0, tier: 'Tier 4', source: 'Community patterns', caveat: 'Severe hepatic stress + aggression', ci: 0.8 },
      { dose: 20, value: 3.5, tier: 'Tier 4', source: 'Forum consensus', caveat: 'Extreme hepatic + psychological risk', ci: 0.9 },
      { dose: 30, value: 4.5, tier: 'Tier 4', source: 'Anecdotal', caveat: 'Critical hepatic + psychological instability', ci: 0.9 },
      { dose: 40, value: 5.2, tier: 'Tier 4', source: 'Anecdotal', caveat: 'Dangerous; hepatic failure risk', ci: 1.0 }
    ],
    methodology: {
      summary: 'Tier 4 (entirely anecdotal); most toxic oral; competition use only',
      benefitRationale: 'Extreme strength spike (neural + CNS stimulation). Aggression surge (psychological performance benefit). Cosmetic hardening. NO MASS GAINS. Used for powerlifting meets (48-72 hours before) or bodybuilding final week. Benefits immediate (12-24 hours).',
      riskRationale: 'MOST HEPATOTOXIC oral available. Lipid devastation. Severe psychological sides (rage, paranoia). NO CLINICAL DATA at supraphysio doses. C17-alpha alkylated + fluorinated (extreme hepatic stress). NOT FOR GENERAL USE.',
      sources: ['Community consensus (powerlifting forums)', 'Contest prep anecdotes', 'Historical athletic doping (Olympics)'],
      limitations: ['NO HUMAN DATA at any dose for performance', 'Hepatic toxicity extreme; permanent damage possible', 'Psychological unpredictability', 'Duration MUST be 2-3 weeks maximum', 'Many users report not worth the risk'],
      assumptions: ['TUDCA high-dose mandatory', 'Duration 2-3 weeks ABSOLUTE MAXIMUM', 'Competition use only', 'Age 25-40', 'Psychological stability'],
      individualVariance: ['Hepatic response: ±60%', 'Psychological: ±70% (extreme variability)', 'Strength spike: ±40%']
    },
    sideEffectProfile: {
      common: [
        { name: 'Extreme Strength Spike', severity: 'positive', onset: '12-24 hours', doseDependent: true, management: 'Primary benefit; neural/CNS mechanism' },
        { name: 'Severe Aggression', severity: 'high', onset: 'day 1-2', doseDependent: true, management: 'Psychological awareness; support system; discontinue if uncontrollable' },
        { name: 'Lethargy', severity: 'high', onset: 'week 1', doseDependent: true, management: 'Hepatic stress-related; reduce dose or discontinue' },
        { name: 'Nausea', severity: 'high', onset: 'day 1-3', doseDependent: true, management: 'Hepatic stress; anti-nausea meds; take with food' },
        { name: 'Mood Instability', severity: 'high', onset: 'day 1-2', doseDependent: true, management: 'Paranoia, irritability; psychological support; discontinue if severe' },
        { name: 'No Mass Gains', severity: 'negative', onset: 'throughout', doseDependent: false, management: 'Cosmetic only; not a bulking compound' }
      ],
      lipidProfile: {
        hdlDecline: 'extreme (among worst of any AAS)',
        ldlIncrease: 'severe',
        triglycerides: 'severe increase',
        management: 'Aggressive lipid protocol; limit to 2-3 weeks; expect devastation'
      },
      cardiovascular: {
        bloodPressure: 'significant increase',
        lvh: 'risk even with short duration',
        rbc: 'moderate increase',
        management: 'BP monitoring; short duration minimizes permanent damage'
      },
      hepatic: {
        altAstElevation: 'extreme (most hepatotoxic oral)',
        cholestasis: 'high risk',
        management: 'TUDCA 1500-2000mg daily MANDATORY; NAC 1800-2400mg; bloodwork weekly if possible; discontinue immediately if ALT/AST >3x or jaundice',
        reversibility: 'Usually reversible if duration limited to 2-3 weeks; permanent damage possible if abused'
      },
      psychological: {
        aggression: 'extreme; nearly universal',
        mood: 'severe lability; paranoia common',
        management: 'Psychological stability essential; support system critical; discontinue if rage or paranoia develop',
        note: 'Primary limiting factor for most users'
      },
      hpta: {
        suppression: 'complete',
        recovery: '2-3 months with PCT',
        pctRequired: true,
        management: 'Standard PCT'
      }
    },
    ancillaryRequirements: {
      tudca: {
        trigger: 'ABSOLUTELY MANDATORY',
        dosing: '1500-2000mg daily',
        purpose: 'Critical hepatic protection; highest dose needed',
        cost: 25
      },
      nac: {
        trigger: 'MANDATORY',
        dosing: '1800-2400mg daily',
        purpose: 'Adjunct liver support; high dose essential',
        cost: 5
      },
      lipidSupport: {
        trigger: 'MANDATORY',
        dosing: 'Fish oil 4g+, statins',
        monitoring: 'Lipid panel before, during (if duration >2 weeks), and after',
        cost: 10
      },
      bloodPressureManagement: {
        trigger: 'Likely needed',
        dosing: 'ARB if BP >140/90',
        monitoring: 'Daily BP checks',
        cost: 5
      },
      psychologicalSupport: {
        trigger: 'ESSENTIAL',
        management: 'Support system communication; awareness of aggression; discontinue if paranoia or rage',
        note: 'Many users report psychological sides not worth the strength benefit'
      },
      hepaticMonitoring: {
        trigger: 'CRITICAL',
        frequency: 'Bloodwork before, during (if >2 weeks), and 2 weeks post',
        note: 'Discontinue immediately if ALT/AST >3x or any signs of jaundice',
        action: 'Medical evaluation if severe elevation or symptoms'
      }
    }
  }
};

const derivePlateauDose = (curve = []) => {
  if (!curve.length) return 0;
  if (curve.length === 1) return curve[0].dose;
  return curve[Math.max(0, curve.length - 2)].dose ?? curve[curve.length - 1].dose ?? 0;
};

Object.values(compoundData).forEach(compound => {
  if (compound.plateauDose == null) {
    compound.plateauDose = derivePlateauDose(compound.benefitCurve);
  }
  if (compound.hardMax == null) {
    const benefitCap = compound.benefitCurve?.[compound.benefitCurve.length - 1]?.dose ?? 0;
    const riskCap = compound.riskCurve?.[compound.riskCurve.length - 1]?.dose ?? 0;
    compound.hardMax = Math.max(benefitCap, riskCap, compound.plateauDose || 0);
  }
});

// Dose range for visualization (0-1200 mg/week)
export const doseRange = [0, 100, 200, 300, 400, 500, 600, 800, 1000, 1200];

// Evidence tier descriptions
export const tierDescriptions = {
  'Tier 0': 'Baseline (no AAS use)',
  'Tier 1': 'Empirical Human Data - Randomized controlled trials in human subjects at specific doses',
  'Tier 2': 'Clinical/Therapeutic Human Data - Human data at therapeutic doses, extrapolated to supraphysio via pharmacological modeling',
  'Tier 3': 'Animal Studies + HED Scaling - Animal dose-response studies converted to human equivalent dose',
  'Tier 4': 'Mechanism + Anecdotal Patterns - Pharmacological theory + aggregated community reports (high uncertainty)'
};

// Disclaimer text
export const disclaimerText = `HARM REDUCTION MODELING, NOT MEDICAL ADVICE

This tool visualizes dose-response relationships based on limited human data, animal studies, and community patterns. It is educational only and does not constitute medical, pharmaceutical, or health advice.

• These compounds are controlled substances in most jurisdictions.
• Individual responses vary widely (±20-30% typical); your response may differ.
• Risk curves are modeled, not empirically measured, at most doses.
• Consult a healthcare provider before using AAS.
• This tool assumes proper ancillary use, training, diet, and baseline health.`;
