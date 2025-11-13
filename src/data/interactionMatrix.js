import { interactionPairs, defaultSensitivities } from './interactionEngineData.js';
import { evaluatePairDimension } from '../utils/interactionEngine.js';

/**
 * AAS Compound Interaction Matrix
 * Defines synergy, compatibility, and risk interactions between compounds
 * Source: Community data, pharmacological theory, harm reduction guidelines
 */

// Heatmap scoring system for visual representation
export const heatmapScores = {
  excellent: { symbol: '✓✓', color: '#00AA00', value: 2, label: 'Excellent Synergy' },
  good: { symbol: '✓', color: '#90EE90', value: 1, label: 'Good Compatibility' },
  compatible: { symbol: '~', color: '#FFEB99', value: 0, label: 'Compatible' },
  caution: { symbol: '⚠️', color: '#FFB347', value: -1, label: 'Use with Caution' },
  dangerous: { symbol: '❌', color: '#FF6B6B', value: -2, label: 'Dangerous Combination' },
  forbidden: { symbol: '✗', color: '#8B0000', value: -3, label: 'Not Recommended' }
};

const DEFAULT_EVIDENCE_BLEND = 0.5;
const EMPTY_SYNERGY = { benefitSynergy: 0, riskSynergy: 0 };

const resolvePairKey = (compoundA, compoundB) => {
  if (!compoundA || !compoundB || compoundA === compoundB) return null;
  const forward = `${compoundA}_${compoundB}`;
  if (interactionPairs[forward]) return forward;
  const reverse = `${compoundB}_${compoundA}`;
  if (interactionPairs[reverse]) return reverse;
  return null;
};

const resolveCompoundKey = entry => {
  if (!entry) return null;
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'object') return entry.compound || entry.id || null;
  return null;
};

const normalizeStackInput = (stackInput, providedDoses = {}) => {
  const compounds = [];
  const seen = new Set();
  const doses = {};

  const assignDose = (key, value) => {
    if (!key) return;
    const numeric = Number(value);
    if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
      doses[key] = numeric;
    }
  };

  Object.entries(providedDoses || {}).forEach(([key, value]) => assignDose(key, value));

  if (Array.isArray(stackInput)) {
    stackInput.forEach(entry => {
      const key = resolveCompoundKey(entry);
      if (!key || seen.has(key)) return;
      seen.add(key);
      compounds.push(key);
      if (typeof entry === 'object' && entry.dose != null) {
        assignDose(key, entry.dose);
      }
    });
  } else if (stackInput && typeof stackInput === 'object') {
    const { compounds: list = [], doses: map = {} } = stackInput;
    list.forEach(key => {
      if (!key || seen.has(key)) return;
      seen.add(key);
      compounds.push(key);
    });
    Object.entries(map).forEach(([key, value]) => assignDose(key, value));
  }

  return { compounds, doses };
};

const buildPairDoseMap = (pair, stackDoses = {}, useDefaults = true) => {
  const map = { ...stackDoses };
  pair.compounds.forEach(compoundKey => {
    if (map[compoundKey] == null) {
      const fallback = useDefaults ? pair.defaultDoses?.[compoundKey] : 0;
      map[compoundKey] = typeof fallback === 'number' ? fallback : 0;
    }
  });
  return map;
};

const evaluatePairSynergy = ({
  pair,
  doses,
  profile,
  sensitivities = defaultSensitivities,
  evidenceBlend = DEFAULT_EVIDENCE_BLEND
}) => {
  const pairId = pair.id || pair.compounds.join('_');
  let benefit = 0;
  let risk = 0;

  Object.keys(pair.synergy || {}).forEach(dimensionKey => {
    const res = evaluatePairDimension({
      pairId,
      dimensionKey,
      doses,
      profile,
      sensitivities,
      evidenceBlend
    });
    if (res?.delta) {
      benefit += res.delta;
    }
  });

  Object.keys(pair.penalties || {}).forEach(dimensionKey => {
    const res = evaluatePairDimension({
      pairId,
      dimensionKey,
      doses,
      profile,
      sensitivities,
      evidenceBlend
    });
    if (res?.delta) {
      risk += Math.abs(res.delta);
    }
  });

  return { benefit, risk };
};

const determineSynergyRating = (benefit, risk) => {
  const net = benefit - risk;
  if (risk >= 1.2) return 'forbidden';
  if (risk >= 0.8) return 'dangerous';
  if (risk >= 0.5 && net < 0.1) return 'caution';
  if (net >= 0.8 && risk <= 0.4) return 'excellent';
  if (net >= 0.3) return 'good';
  if (net >= -0.2) return 'compatible';
  return 'caution';
};

// Injectable-Injectable Interaction Matrix (15 pairs)
export const interactionMatrix = {
  // TESTOSTERONE COMBINATIONS
  testosterone_npp: {
    description: 'Excellent synergy; joint-protective stack with solid mass gains',
    synergy: { benefit: -0.15, risk: 0.2 },
    mechanisms: [
      'Test provides androgenic base; NPP adds joint relief and lean tissue',
      'Receptor saturation limits pure additivity (~15% benefit loss)',
      'Test aromatizes; NPP affects prolactin - dual hormonal management needed',
      'Lipid decline additive but manageable',
      'Synergistic for mass + recovery; Test mitigates NPP libido issues'
    ],
    recommendedRatio: 'Test:NPP = 2:1 or 3:2 (e.g., 600mg Test : 300mg NPP)',
    recommendedProtocol: {
      testDose: '400-600mg/week',
      nppDose: '200-400mg/week',
      aiProtocol: 'Moderate AI (0.5mg anastrozole EOD)',
      prolactinMgmt: 'Cabergoline 0.25-0.5mg 2x/week (essential)'
    },
    recommendation: 'Highly recommended; classic mass-building stack',
    caution: 'Prolactin management essential; monitor E2 and prolactin levels',
    stackBenefit: 'Mass + strength + joint health; excellent for bulking',
    stackRisk: 'Manageable: dual HPTA suppression, lipids, E2 + prolactin',
    rating: 'excellent'
  },

  testosterone_trenbolone: {
    description: 'Powerful recomp stack; significant psychological and cardiovascular risk',
    synergy: { benefit: 0.1, risk: 0.4 },
    mechanisms: [
      'Test base prevents low-E2 issues from Tren',
      'Tren potency amplified by adequate androgen base',
      'Severe cumulative HPTA suppression (both suppress hard)',
      'Lipid profile severely compromised (Test moderate, Tren severe)',
      'Psychological sides: Tren aggression + Test libido = unpredictable',
      'Cardiovascular stress: additive BP elevation + lipid decline'
    ],
    recommendedRatio: 'Test:Tren = 2:1 to 3:1 (e.g., 600mg Test : 200-300mg Tren)',
    recommendedProtocol: {
      testDose: '400-700mg/week',
      trenDose: '200-400mg/week (start low)',
      aiProtocol: 'Moderate AI; Tren doesn\'t aromatize but Test does',
      prolactinMgmt: 'Cabergoline 0.25mg 2x/week recommended',
      duration: '8-12 weeks maximum (limit Tren exposure)'
    },
    recommendation: 'Advanced users only; not for first-time Tren users',
    caution: '⚠️ HIGH RISK: Psychological stability required; aggressive lipid + BP management essential; expect insomnia, aggression, reduced cardio capacity',
    stackBenefit: 'Exceptional recomp: simultaneous muscle gain + fat loss; strength surge',
    stackRisk: 'Severe: lipids (HDL crash), cardio stress, psychological sides, HPTA shutdown, sleep disruption',
    rating: 'caution'
  },

  testosterone_eq: {
    description: 'Mild, well-tolerated endurance and mass stack',
    synergy: { benefit: 0, risk: 0.05 },
    mechanisms: [
      'EQ complements Test well; similar timelines (both long esters)',
      'Additive androgenic effects (manageable)',
      'EQ adds RBC/endurance benefit; Test adds mass',
      'Lipid impact: additive but mild (EQ gentle on lipids)',
      'RBC elevation: EQ significantly raises HCT; Test adds to this',
      'Minimal negative synergy; straightforward stack'
    ],
    recommendedRatio: 'Test:EQ = 1:1 to 3:2 (e.g., 600mg Test : 600mg EQ)',
    recommendedProtocol: {
      testDose: '400-600mg/week',
      eqDose: '400-800mg/week',
      aiProtocol: 'Lower AI than Test-only (EQ aromatizes minimally)',
      duration: '16-20 weeks (EQ takes 8+ weeks to saturate)',
      hctMonitoring: 'Essential; donate blood every 8-12 weeks'
    },
    recommendation: 'Excellent for lean mass + endurance; well-tolerated',
    caution: 'EQ anxiety in ~20-40% of users (mechanism unclear); HCT elevation requires blood donation',
    stackBenefit: 'Clean lean mass, endurance boost, vascularity, appetite stimulation',
    stackRisk: 'Low-moderate: HCT elevation (primary concern), mild lipid impact, possible anxiety',
    rating: 'good'
  },

  testosterone_masteron: {
    description: 'Aesthetic finisher stack; hardening compound added to Test base',
    synergy: { benefit: 0, risk: 0 },
    mechanisms: [
      'Masteron cosmetic effects (hardening); Test provides mass',
      'Masteron may reduce water retention from Test (mild anti-E properties)',
      'Minimal new risks; both relatively mild on lipids compared to Tren',
      'Additive androgens; prostate monitoring advised',
      'Cosmetic synergy: Test + Masteron = full + hard look'
    ],
    recommendedRatio: 'Test:Masteron = 2:1 to 3:2 (e.g., 600mg Test : 300-400mg Masteron)',
    recommendedProtocol: {
      testDose: '400-600mg/week',
      masteronDose: '300-500mg/week',
      aiProtocol: 'Slightly lower AI needs (Masteron reduces water)',
      duration: '8-12 weeks (often used as contest prep finisher)',
      timing: 'Last 6-8 weeks of cycle for peak aesthetics'
    },
    recommendation: 'Good for contest prep or aesthetic goals; low-risk stack',
    caution: 'Masteron accelerates hair loss (MPB-prone avoid); prostate monitoring for >40yo',
    stackBenefit: 'Muscle hardening, definition, reduced bloat, full + dry look',
    stackRisk: 'Low: hair loss (DHT derivative), mild prostate concern, standard lipid impact',
    rating: 'good'
  },

  testosterone_primobolan: {
    description: 'Mild, quality gains stack; among safest combinations',
    synergy: { benefit: -0.1, risk: -0.1 },
    mechanisms: [
      'Primo adds slow, quality lean tissue; Test provides anabolic drive',
      'Both well-tolerated; minimal sides',
      'Synergy slightly negative (Primo weak; doesn\'t multiply Test gains)',
      'Lipid impact: among mildest stacks (Primo very gentle)',
      'Cost consideration: Primo expensive; stack cost-prohibitive at high doses'
    ],
    recommendedRatio: 'Test:Primo = 1:1 to 2:3 (e.g., 500mg Test : 600mg Primo)',
    recommendedProtocol: {
      testDose: '400-600mg/week',
      primoDose: '600-800mg/week (Primo needs higher doses due to weakness)',
      aiProtocol: 'Low AI needs (Primo doesn\'t aromatize)',
      duration: '12-16 weeks',
      note: 'Verify Primo source; often underdosed in black market'
    },
    recommendation: 'Excellent for first-time stackers or those prioritizing safety',
    caution: 'Expensive; verify Primo legitimacy (counterfeiting common); weak gains relative to cost',
    stackBenefit: 'Slow, quality lean gains; excellent lipid profile; minimal sides; well-tolerated',
    stackRisk: 'Very low: among safest stacks available; standard HPTA suppression only',
    rating: 'good'
  },

  // NPP COMBINATIONS
  npp_trenbolone: {
    description: 'High-risk 19-nor stack; severe HPTA suppression and side effects',
    synergy: { benefit: 0.05, risk: 0.6 },
    mechanisms: [
      'Both 19-nors; cumulative progestogenic effects',
      'Dual prolactin elevation: NPP direct, Tren indirect',
      'Psychological unpredictability: NPP libido issues + Tren aggression',
      'Severe HPTA suppression (both shut down hard; 19-nors metabolize slowly)',
      'Lipid profile devastated: NPP moderate, Tren severe',
      'Minimal additive benefit; risk far exceeds reward'
    ],
    recommendedRatio: 'NOT RECOMMENDED - avoid stacking 19-nors',
    recommendation: '❌ Not recommended; use one OR the other, not both',
    caution: '⚠️ CRITICAL: Cumulative 19-nor suppression causes 4-6 month recovery; libido crash + aggression = psychological disaster; prolactin management extremely difficult',
    stackBenefit: 'Minimal over using one compound; not worth the risk',
    stackRisk: 'Extreme: severe HPTA (6+ month recovery), prolactin crash, psychological instability, lipid devastation',
    rating: 'forbidden'
  },

  npp_eq: {
    description: 'Solid complementary stack; NPP for mass, EQ for endurance',
    synergy: { benefit: 0, risk: 0.1 },
    mechanisms: [
      'Different profiles: NPP anabolic + joint relief, EQ endurance + RBC',
      'Additive but not synergistic (different mechanisms)',
      'NPP prolactin + EQ anxiety = potential mood complications',
      'Manageable combined risk if ancillaries used properly',
      'Lipid impact additive but tolerable'
    ],
    recommendedRatio: 'NPP:EQ = 1:2 to 1:1.5 (e.g., 300mg NPP : 600mg EQ)',
    recommendedProtocol: {
      nppDose: '200-400mg/week',
      eqDose: '400-800mg/week',
      prolactinMgmt: 'Cabergoline 0.25-0.5mg 2x/week',
      hctMonitoring: 'Essential (EQ raises HCT significantly)',
      duration: '16-20 weeks (EQ long saturation)',
      testBase: 'TRT dose Test recommended (200-300mg)'
    },
    recommendation: 'Compatible; works well for specific goals (mass + endurance)',
    caution: 'Mood monitoring (prolactin + anxiety possible); HCT management critical',
    stackBenefit: 'Mass, joint health, endurance, vascularity, appetite',
    stackRisk: 'Moderate: prolactin, HCT elevation, potential mood issues, HPTA suppression',
    rating: 'compatible'
  },

  npp_masteron: {
    description: 'Aesthetic recomp stack; NPP for mass, Masteron for hardness',
    synergy: { benefit: 0, risk: 0 },
    mechanisms: [
      'Masteron cosmetic hardening complements NPP mass gains',
      'Masteron may reduce NPP water retention slightly',
      'Different mechanisms; additive effects',
      'Manageable combined risk profile',
      'Often used in contest prep (NPP fullness + Masteron dryness)'
    ],
    recommendedRatio: 'NPP:Masteron = 1:1 to 2:1 (e.g., 400mg NPP : 300mg Masteron)',
    recommendedProtocol: {
      nppDose: '300-400mg/week',
      masteronDose: '300-500mg/week',
      prolactinMgmt: 'Cabergoline for NPP',
      testBase: 'Moderate Test recommended (300-500mg)',
      duration: '8-12 weeks',
      timing: 'Contest prep or recomp phase'
    },
    recommendation: 'Good for recomp or contest prep; aesthetic synergy',
    caution: 'Hair loss from Masteron; prolactin management for NPP required',
    stackBenefit: 'Full, hard muscles; recomp effect; joint health + definition',
    stackRisk: 'Moderate: prolactin, hair loss (MPB-prone), lipids, HPTA',
    rating: 'good'
  },

  npp_primobolan: {
    description: 'Quality lean mass stack; mild and well-tolerated',
    synergy: { benefit: -0.05, risk: -0.05 },
    mechanisms: [
      'NPP provides mass + joint relief; Primo adds quality tissue',
      'Both relatively mild on lipids',
      'Slight negative synergy (Primo weak; doesn\'t amplify NPP)',
      'Manageable side profile if prolactin controlled',
      'Cost-prohibitive at effective doses (Primo expensive)'
    ],
    recommendedRatio: 'NPP:Primo = 1:1.5 to 1:2 (e.g., 300mg NPP : 600mg Primo)',
    recommendedProtocol: {
      nppDose: '200-400mg/week',
      primoDose: '600-800mg/week',
      prolactinMgmt: 'Cabergoline for NPP',
      testBase: 'TRT or moderate (200-400mg)',
      duration: '12-16 weeks'
    },
    recommendation: 'Compatible; good for quality gains with safety priority',
    caution: 'Expensive; verify Primo legitimacy; prolactin management needed',
    stackBenefit: 'Quality lean tissue, joint health, minimal sides, good lipid profile',
    stackRisk: 'Low-moderate: prolactin (manageable), cost, HPTA',
    rating: 'compatible'
  },

  // TRENBOLONE COMBINATIONS
  trenbolone_eq: {
    description: 'Moderate-risk recomp stack; Tren potency + EQ endurance',
    synergy: { benefit: 0.05, risk: 0.35 },
    mechanisms: [
      'Tren recomp power + EQ endurance/vascularity',
      'Both affect mood: Tren aggression + EQ anxiety = psychological concern',
      'Cumulative lipid decline (Tren severe, EQ mild)',
      'HCT elevation significant (both raise RBC; EQ more)',
      'Cardiovascular stress: Tren reduces cardio + EQ raises HCT = double impact'
    ],
    recommendedRatio: 'Tren:EQ = 1:2 to 1:3 (e.g., 300mg Tren : 600mg EQ)',
    recommendedProtocol: {
      trenDose: '200-400mg/week',
      eqDose: '600-800mg/week',
      testBase: 'TRT to low-moderate (200-400mg)',
      duration: '12-16 weeks (limit Tren to 8-12)',
      monitoring: 'Frequent BP checks, HCT monitoring, lipid panels every 6 weeks'
    },
    recommendation: 'Use with caution; advanced users only',
    caution: '⚠️ Psychological monitoring essential; HCT management critical; aggressive lipid protocol required',
    stackBenefit: 'Exceptional recomp, endurance despite Tren, vascularity, appetite',
    stackRisk: 'High: mood instability (aggression + anxiety), severe lipids, HCT elevation, cardio stress',
    rating: 'caution'
  },

  trenbolone_masteron: {
    description: 'Contest prep stack; extreme aesthetics with high risk',
    synergy: { benefit: 0.05, risk: 0.3 },
    mechanisms: [
      'Tren recomp + Masteron hardening = peak contest conditioning',
      'Both non-aromatizing; dry, vascular look',
      'Lipid profile severely impacted (Tren dominant risk)',
      'Psychological: Tren mood effects primary concern',
      'Hair loss accelerated (both androgenic, Masteron DHT)',
      'Often combined in final 6-8 weeks pre-competition'
    ],
    recommendedRatio: 'Tren:Masteron = 1:1 to 2:3 (e.g., 300mg Tren : 400mg Masteron)',
    recommendedProtocol: {
      trenDose: '200-400mg/week',
      masteronDose: '400-600mg/week',
      testBase: 'Low TRT dose (150-250mg)',
      duration: '6-8 weeks (short duration due to Tren sides)',
      timing: 'Final weeks of contest prep',
      cabergoline: '0.25mg 2x/week'
    },
    recommendation: 'Contest prep only; not for general use',
    caution: '⚠️ Extreme aesthetics at cost of health metrics; hair loss severe; psychological stability required; aggressive ancillary protocol essential',
    stackBenefit: 'Peak contest conditioning: shredded, dry, vascular, hard muscles',
    stackRisk: 'High: severe lipids, psychological sides, hair loss, cardio stress, sleep disruption',
    rating: 'caution'
  },

  trenbolone_primobolan: {
    description: 'Quality recomp with harm reduction attempt; Primo mitigates some Tren harshness',
    synergy: { benefit: 0, risk: 0.2 },
    mechanisms: [
      'Tren provides recomp potency; Primo adds quality tissue with minimal sides',
      'Primo\'s mild lipid profile doesn\'t mitigate Tren devastation but doesn\'t worsen',
      'Psychological: Tren mood dominant; Primo neutral',
      'Primo expensive; Tren provides bulk of effects',
      'Often used when wanting Tren benefits with "safer" addition'
    ],
    recommendedRatio: 'Tren:Primo = 1:2 to 1:2.5 (e.g., 300mg Tren : 600mg Primo)',
    recommendedProtocol: {
      trenDose: '200-400mg/week',
      primoDose: '600-800mg/week',
      testBase: 'TRT to low-moderate (200-400mg)',
      duration: '12-16 weeks total (Tren 8-12 weeks)',
      note: 'Primo often continued after Tren discontinued'
    },
    recommendation: 'Compatible; Primo adds quality without compounding Tren risks significantly',
    caution: 'Expensive; Tren sides still dominant; verify Primo legitimacy',
    stackBenefit: 'Quality recomp, less harsh than Tren-only, Primo adds lean tissue',
    stackRisk: 'Moderate-high: Tren psychological + cardio + lipid risks remain; cost',
    rating: 'compatible'
  },

  // EQ COMBINATIONS
  eq_masteron: {
    description: 'Aesthetic endurance stack; lean gains with definition',
    synergy: { benefit: 0, risk: 0.05 },
    mechanisms: [
      'EQ endurance + vascularity; Masteron hardening + definition',
      'Both mild on lipids; well-tolerated stack',
      'EQ anxiety + Masteron neutral = manageable mood',
      'HCT elevation from EQ primary concern',
      'Additive but not synergistic (different mechanisms)'
    ],
    recommendedRatio: 'EQ:Masteron = 2:1 to 3:2 (e.g., 600mg EQ : 400mg Masteron)',
    recommendedProtocol: {
      eqDose: '600-800mg/week',
      masteronDose: '300-500mg/week',
      testBase: 'Moderate (400-600mg)',
      duration: '16-20 weeks (EQ long saturation)',
      hctMonitoring: 'Every 6-8 weeks; donate blood as needed'
    },
    recommendation: 'Good for aesthetic goals; lean bulk or recomp',
    caution: 'HCT management essential; EQ anxiety possible; hair loss from Masteron',
    stackBenefit: 'Lean mass, endurance, vascularity, muscle hardness, definition',
    stackRisk: 'Low-moderate: HCT elevation, possible anxiety, hair loss (MPB-prone)',
    rating: 'good'
  },

  eq_primobolan: {
    description: 'Mild, quality gains stack; among safest combinations',
    synergy: { benefit: -0.05, risk: -0.1 },
    mechanisms: [
      'Both mild compounds; additive quality lean tissue',
      'Excellent lipid profile (both gentle)',
      'Slight negative synergy (both weak; no multiplication)',
      'Well-tolerated; minimal sides',
      'Cost-prohibitive (both need high doses; Primo expensive)',
      'HCT elevation from EQ only significant risk'
    ],
    recommendedRatio: 'EQ:Primo = 1:1 to 4:3 (e.g., 800mg EQ : 600mg Primo)',
    recommendedProtocol: {
      eqDose: '600-1000mg/week',
      primoDose: '600-800mg/week',
      testBase: 'Low to moderate (300-500mg)',
      duration: '16-20 weeks',
      monitoring: 'HCT every 6-8 weeks'
    },
    recommendation: 'Excellent for safety-conscious users; quality over quantity',
    caution: 'Expensive; slow gains; requires patience; HCT monitoring needed',
    stackBenefit: 'Slow, quality lean gains; excellent lipid profile; minimal sides; endurance',
    stackRisk: 'Very low: HCT elevation (manageable), cost, patience required',
    rating: 'excellent'
  },

  // MASTERON COMBINATIONS
  masteron_primobolan: {
    description: 'Mild aesthetic stack; contest prep or cruise+',
    synergy: { benefit: -0.05, risk: -0.05 },
    mechanisms: [
      'Masteron hardening + Primo quality tissue',
      'Both mild; excellent lipid profile',
      'Weak synergy (neither strong; cosmetic focus)',
      'Well-tolerated; minimal sides',
      'Often used in contest prep final weeks or enhanced cruise',
      'Cost consideration: Primo expensive'
    ],
    recommendedRatio: 'Masteron:Primo = 1:1 to 2:3 (e.g., 400mg Masteron : 600mg Primo)',
    recommendedProtocol: {
      masteronDose: '300-500mg/week',
      primoDose: '600-800mg/week',
      testBase: 'Low to moderate (200-500mg)',
      duration: '12-16 weeks',
      timing: 'Contest prep or cruise+ for maintenance'
    },
    recommendation: 'Good for aesthetic goals with safety priority; mild stack',
    caution: 'Weak mass gains; expensive; hair loss (Masteron); verify Primo source',
    stackBenefit: 'Muscle hardness, quality tissue, excellent lipid profile, minimal bloat',
    stackRisk: 'Very low: hair loss (DHT), cost, standard HPTA suppression',
    rating: 'good'
  },

  // ORAL-INJECTABLE COMBINATIONS
  // DIANABOL COMBINATIONS
  testosterone_dianabol: {
    description: 'Classic bulking kickstart; rapid mass and strength gains',
    synergy: { benefit: 0.15, risk: 0.3 },
    mechanisms: [
      'Dbol kickstart (weeks 1-4) while Test saturates',
      'Both aromatize heavily; dual E2 management critical',
      'Rapid water + glycogen loading from Dbol; Test provides sustained base',
      'Synergistic strength spike; additive mass gains',
      'Cumulative lipid decline; hepatic stress from Dbol dominant'
    ],
    recommendedRatio: 'Test 400-600mg/week + Dbol 20-30mg/day (weeks 1-4)',
    recommendedProtocol: {
      testDose: '400-600mg/week throughout',
      dbolDose: '20-30mg/day, weeks 1-4 only',
      aiProtocol: 'Aggressive AI (0.5mg anastrozole EOD minimum)',
      tudca: '500-1000mg daily for Dbol',
      timing: 'Dbol kickstart while Test saturates'
    },
    recommendation: 'Excellent for bulking; classic first oral addition',
    caution: '⚠️ E2 management critical; dual aromatization = high gyno risk; hepatic + lipid monitoring essential',
    stackBenefit: 'Rapid mass + strength; immediate gains while Test builds; classic bulking stack',
    stackRisk: 'High: dual E2 elevation, hepatic stress, lipid crash, BP spike, water retention',
    rating: 'good'
  },

  npp_dianabol: {
    description: 'Mass-focused bulking stack; high water retention',
    synergy: { benefit: 0.1, risk: 0.35 },
    mechanisms: [
      'Dbol kickstart + NPP mass gains',
      'Dbol aromatizes; NPP affects prolactin; dual hormone management',
      'Extreme water retention (both wet compounds)',
      'Hepatic + prolactin + E2 management complex',
      'Often run with Test base (TRT-moderate dose)'
    ],
    recommendedRatio: 'NPP 300-400mg/week + Dbol 20mg/day (weeks 1-4) + Test 300-500mg base',
    recommendedProtocol: {
      nppDose: '300-400mg/week',
      dbolDose: '20mg/day, weeks 1-4',
      testBase: '300-500mg/week (essential)',
      aiProtocol: 'Moderate AI',
      cabergoline: '0.25-0.5mg 2x/week',
      tudca: '500-1000mg daily'
    },
    recommendation: 'Compatible; mass gains significant but sides complex',
    caution: 'Water retention extreme; E2 + prolactin management critical; hepatic + lipid stress',
    stackBenefit: 'Massive size gains, joint health, rapid kickstart',
    stackRisk: 'High: water retention, E2 + prolactin, hepatic, lipids, complex management',
    rating: 'compatible'
  },

  trenbolone_dianabol: {
    description: 'Powerful but harsh; Tren recomp + Dbol mass',
    synergy: { benefit: 0.1, risk: 0.5 },
    mechanisms: [
      'Conflicting goals: Tren (recomp/dry) + Dbol (bulk/wet)',
      'Lipid devastation (both harsh)',
      'BP spike extreme (Tren + Dbol water)',
      'Psychological: Tren mood + Dbol E2 fluctuations',
      'Hepatic stress from Dbol; Tren doesn\'t aromatize but Dbol does heavily'
    ],
    recommendedRatio: 'NOT commonly recommended; if used: Tren 200-300mg + Dbol 20mg (2-3 weeks only) + Test base',
    recommendation: 'Use with extreme caution; conflicting compound profiles',
    caution: '⚠️ HIGH RISK: Lipid devastation, BP critical, psychological stress, hepatic, complex management; many consider this combination poor planning',
    stackBenefit: 'Strength surge, rapid mass; questionable synergy due to conflicting goals',
    stackRisk: 'Extreme: lipids, BP, psychological, hepatic, complexity; risk often exceeds benefit',
    rating: 'caution'
  },

  // ANADROL COMBINATIONS
  testosterone_anadrol: {
    description: 'Extreme mass-building stack; brutal but effective',
    synergy: { benefit: 0.2, risk: 0.45 },
    mechanisms: [
      'Adrol mid-cycle push (weeks 5-8) for mass plateau breakthrough',
      'Test provides base; Adrol adds extreme glycogen/water',
      'Both raise BP significantly; cumulative effect severe',
      'Lipid devastation (Adrol extreme + Test moderate)',
      'Hepatic stress from Adrol dominant; Test minimal contribution',
      'Paradoxical: Adrol estrogenic despite no aromatization'
    ],
    recommendedRatio: 'Test 500-700mg/week + Adrol 50-75mg/day (weeks 5-8 or 9-12)',
    recommendedProtocol: {
      testDose: '500-700mg/week',
      adrolDose: '50-75mg/day, 4 weeks maximum (weeks 5-8 or 9-12)',
      aiProtocol: 'Moderate AI (Adrol estrogenic effect mysterious)',
      tudca: '1000-1500mg daily',
      bpManagement: 'Essential; likely needed ARB',
      timing: 'Mid-cycle or finisher; NOT kickstart (too harsh early)'
    },
    recommendation: 'Advanced users only; extreme mass gains at significant health cost',
    caution: '⚠️ EXTREME RISK: Hepatic stress critical, lipids devastated, BP dangerous, limit to 4 weeks; bloodwork every 3 weeks mandatory',
    stackBenefit: 'Extreme mass surge, plateau breakthrough, dramatic strength',
    stackRisk: 'Extreme: hepatic (severe), lipids (devastated), BP (critical), water retention, lethargy',
    rating: 'caution'
  },

  trenbolone_anadrol: {
    description: 'Contest prep paradox or advanced recomp; extremely harsh',
    synergy: { benefit: 0.1, risk: 0.6 },
    mechanisms: [
      'Sometimes used final 2-3 weeks pre-contest (Adrol fullness + Tren dryness)',
      'Conflicting: Tren dry, Adrol wet',
      'Lipid profile: absolute devastation (both extreme)',
      'Psychological: Tren aggression + Adrol lethargy',
      'Hepatic: Adrol extreme; Tren lipid-toxic',
      'BP: both elevate significantly'
    ],
    recommendedRatio: 'Tren 300-400mg + Adrol 50mg (2-3 weeks MAXIMUM) + Low Test base',
    recommendation: 'Extreme advanced only; contest prep final weeks; NOT for general use',
    caution: '⚠️ CRITICAL RISK: Among harshest combinations possible; hepatic failure risk, lipids critical, psychological unpredictability, BP dangerous; many coaches advise against',
    stackBenefit: 'Contest conditioning + fullness paradox; strength peak',
    stackRisk: 'Critical: hepatic (extreme), lipids (critical), BP (dangerous), psychological, lethargy',
    rating: 'dangerous'
  },

  // WINSTROL COMBINATIONS
  testosterone_winstrol: {
    description: 'Cutting/contest prep stack; hardening compound added to base',
    synergy: { benefit: 0.05, risk: 0.25 },
    mechanisms: [
      'Winny final 6-8 weeks for cosmetic hardening',
      'Test provides anabolic support during deficit',
      'Lipid decline: Winny extreme + Test moderate = severe',
      'Joint pain from Winny; Test doesn\'t mitigate',
      'Hepatic stress from Winny; Test minimal contribution'
    ],
    recommendedRatio: 'Test 300-500mg/week + Winny 50mg/day (final 6-8 weeks)',
    recommendedProtocol: {
      testDose: '300-500mg/week (TRT to moderate)',
      winstrolDose: '50mg/day, weeks 7-12 or 9-16 (final 6-8 weeks)',
      aiProtocol: 'Low AI (cutting = lower body fat = less aromatization)',
      tudca: '500-1000mg daily',
      jointSupport: 'Glucosamine, fish oil 4g+, MSM',
      lipidManagement: 'Aggressive; fish oil + statins',
      timing: 'Contest prep final weeks'
    },
    recommendation: 'Good for contest prep; well-established cutting stack',
    caution: 'Joint pain nearly universal >50mg Winny; lipid devastation; limit to 6 weeks; monitor closely',
    stackBenefit: 'Muscle hardness, definition, dry look, strength preservation in deficit',
    stackRisk: 'High: lipids (extreme), joint pain (severe), hepatic, tendon injury risk',
    rating: 'good'
  },

  masteron_winstrol: {
    description: 'Contest prep finisher; extreme aesthetics',
    synergy: { benefit: 0.05, risk: 0.2 },
    mechanisms: [
      'Both cosmetic/hardening compounds',
      'Additive aesthetics (Masteron + Winny = peak conditioning)',
      'Both lipid-harsh; cumulative decline',
      'Joint drying from Winny; Masteron doesn\'t worsen',
      'Often used final 4-6 weeks pre-show with Test base'
    ],
    recommendedRatio: 'Masteron 400mg/week + Winny 50mg/day (final 4-6 weeks) + Test 200-300mg',
    recommendedProtocol: {
      masteronDose: '400-600mg/week',
      winstrolDose: '50mg/day, 4-6 weeks',
      testBase: '200-300mg/week (TRT)',
      tudca: '500-1000mg daily',
      jointSupport: 'Essential',
      lipidManagement: 'Aggressive',
      timing: 'Final weeks of contest prep'
    },
    recommendation: 'Good for peak contest conditioning; cosmetic synergy',
    caution: 'Joint pain, lipids severe, hair loss (both DHT), hepatic; short duration only',
    stackBenefit: 'Peak muscle hardness, extreme definition, dry + vascular look',
    stackRisk: 'High: lipids (severe), joint pain, hair loss (MPB), hepatic',
    rating: 'good'
  },

  // ANAVAR COMBINATIONS
  testosterone_anavar: {
    description: 'Mild cutting or recomp stack; well-tolerated',
    synergy: { benefit: 0.05, risk: 0.1 },
    mechanisms: [
      'Var adds quality lean tissue; Test provides base',
      'Both relatively mild; good tolerance',
      'Lipid decline: Var moderate-severe + Test moderate = significant but manageable',
      'Hepatic stress minimal (Var mildest oral)',
      'Often run 8-12 weeks (longer than harsher orals)'
    ],
    recommendedRatio: 'Test 300-600mg/week + Anavar 50-75mg/day',
    recommendedProtocol: {
      testDose: '300-600mg/week',
      anavarDose: '50-75mg/day',
      aiProtocol: 'Low-moderate AI',
      tudca: '500mg daily (recommended but less critical)',
      duration: '8-12 weeks (Var can run longer than harsh orals)',
      lipidManagement: 'Standard monitoring'
    },
    recommendation: 'Excellent for first-time oral users or cutting; well-tolerated',
    caution: 'Verify Var legitimacy (most counterfeited); lipid monitoring still needed; expensive',
    stackBenefit: 'Quality lean gains, hardening, well-tolerated, longer run time possible',
    stackRisk: 'Moderate: lipids (manageable), cost, source verification critical',
    rating: 'excellent'
  },

  primobolan_anavar: {
    description: 'Ultra-mild quality gains stack; safest oral combo',
    synergy: { benefit: -0.05, risk: -0.1 },
    mechanisms: [
      'Both mild; additive quality tissue',
      'Excellent lipid profile (relatively speaking)',
      'Weak synergy (both weak compounds)',
      'Cost-prohibitive (both expensive)',
      'Well-tolerated; minimal sides',
      'Often used by cautious users or females'
    ],
    recommendedRatio: 'Primo 600-800mg/week + Anavar 50mg/day + TRT Test 200mg',
    recommendedProtocol: {
      primoDose: '600-800mg/week',
      anavarDose: '50mg/day',
      testBase: '200-300mg/week (TRT)',
      tudca: '500mg daily',
      duration: '12 weeks',
      note: 'Verify both sources (counterfeiting common)'
    },
    recommendation: 'Excellent for safety-focused users; quality over quantity',
    caution: 'Expensive; slow gains; verify sources (both commonly faked); patience required',
    stackBenefit: 'Slow quality lean gains, excellent tolerability, good lipid profile, minimal sides',
    stackRisk: 'Very low: cost, slow gains, source verification critical',
    rating: 'excellent'
  },

  // HALOTESTIN COMBINATIONS
  testosterone_halotestin: {
    description: 'Strength peaking or contest prep final week; extreme compound',
    synergy: { benefit: 0.15, risk: 0.55 },
    mechanisms: [
      'Halo final 2-3 weeks for strength peak or cosmetic hardening',
      'Test provides base; Halo adds CNS stimulation',
      'Psychological: aggression surge on Halo',
      'Hepatic: Halo extreme, Test negligible',
      'Lipid: Halo devastation, Test moderate contribution',
      'Strength spike immediate (12-24 hours)'
    ],
    recommendedRatio: 'Test 300-500mg/week + Halo 10-20mg/day (2-3 weeks MAXIMUM)',
    recommendedProtocol: {
      testDose: '300-500mg/week',
      haloTestinDose: '10-20mg/day, 2-3 weeks ABSOLUTE MAXIMUM',
      tudca: '1500-2000mg daily MANDATORY',
      nac: '1800-2400mg daily',
      bpManagement: 'Likely needed',
      lipidManagement: 'Aggressive',
      bloodwork: 'Before, during (if >2 weeks), immediately after',
      timing: 'Powerlifting meet (48-72hrs before) or contest final week'
    },
    recommendation: 'Competition use only; NOT for general cycles',
    caution: '⚠️ CRITICAL: Hepatic toxicity extreme; psychological unpredictability; lipids devastated; 2-3 weeks MAXIMUM; many users report not worth risk',
    stackBenefit: 'Extreme strength spike, cosmetic hardening, CNS stimulation',
    stackRisk: 'Critical: hepatic (extreme), psychological (severe aggression), lipids (devastated)',
    rating: 'dangerous'
  },

  // ORAL-ORAL COMBINATIONS (FORBIDDEN)
  dianabol_anadrol: {
    description: '❌ NOT RECOMMENDED - Dual oral mass compounds',
    synergy: { benefit: 0, risk: 1.0 },
    mechanisms: [
      'Dual c17-alpha alkylation = multiplicative hepatic stress',
      'Conflicting mechanisms; no synergy justifies risk',
      'Lipid profile: catastrophic',
      'BP: extreme elevation from both',
      'NO LEGITIMATE USE CASE for stacking two orals'
    ],
    recommendation: '❌ FORBIDDEN - Use one OR the other, never both',
    caution: '⚠️ FORBIDDEN: Hepatic failure risk; lipids critical; NO benefit justifies dual oral stress',
    stackBenefit: 'None; contradictory compound profiles',
    stackRisk: 'Critical: hepatic failure possible, lipids catastrophic, BP critical',
    rating: 'forbidden'
  },

  dianabol_winstrol: {
    description: '❌ NOT RECOMMENDED - Conflicting goals; dual hepatic stress',
    synergy: { benefit: 0, risk: 0.9 },
    recommendation: '❌ FORBIDDEN - Conflicting (Dbol wet/bulk, Winny dry/cut); dual hepatic stress unjustifiable',
    caution: '⚠️ FORBIDDEN: Hepatic stress multiplicative; conflicting mechanisms make stack illogical',
    stackRisk: 'Critical: hepatic, lipids, conflicting compound profiles',
    rating: 'forbidden'
  },

  anadrol_winstrol: {
    description: '❌ NOT RECOMMENDED - Extreme conflicting compounds',
    synergy: { benefit: 0, risk: 1.0 },
    recommendation: '❌ FORBIDDEN - Adrol (wet/mass) + Winny (dry/cut) = illogical; dual oral hepatic stress extreme',
    caution: '⚠️ FORBIDDEN: Among worst oral combinations possible; hepatic critical; no synergy',
    stackRisk: 'Critical: hepatic extreme, lipids catastrophic, joint pain + water retention paradox',
    rating: 'forbidden'
  },

  anavar_winstrol: {
    description: '❌ NOT RECOMMENDED - Dual cutting orals; redundant',
    synergy: { benefit: 0, risk: 0.7 },
    recommendation: '❌ FORBIDDEN - Similar mechanisms; dual hepatic stress unjustifiable; use one OR the other',
    caution: '⚠️ FORBIDDEN: Redundant mechanisms; dual oral stress; lipids severe; joint pain from Winny',
    stackRisk: 'High: hepatic, lipids (severe), redundancy, cost',
    rating: 'forbidden'
  },

  // Additional key interactions
  eq_anavar: {
    description: 'Mild lean mass stack; well-tolerated',
    synergy: { benefit: 0, risk: 0.15 },
    mechanisms: [
      'EQ endurance + Var quality tissue',
      'Both mild; good tolerance',
      'Lipid decline additive but manageable',
      'HCT elevation from EQ primary concern',
      'Often used for lean bulk or recomp'
    ],
    recommendedRatio: 'EQ 600mg/week + Anavar 50-75mg/day + Test 400mg base',
    recommendedProtocol: {
      eqDose: '600-800mg/week',
      anavarDose: '50-75mg/day',
      testBase: '400-600mg/week',
      tudca: '500mg daily',
      hctMonitoring: 'Essential (EQ)',
      duration: '12-16 weeks'
    },
    recommendation: 'Good for lean gains; well-tolerated',
    caution: 'HCT management critical (EQ); verify Var source; EQ anxiety + Var generally neutral',
    stackBenefit: 'Lean quality gains, endurance, vascularity, good tolerance',
    stackRisk: 'Moderate: HCT (EQ), lipids, cost, source verification',
    rating: 'good'
  },

  npp_anavar: {
    description: 'Quality mass + mild oral; good synergy',
    synergy: { benefit: 0.05, risk: 0.2 },
    mechanisms: [
      'NPP mass + joint relief; Var quality tissue + hardening',
      'Manageable combined risk',
      'Prolactin from NPP; Var neutral',
      'Lipid decline additive',
      'Often used for lean bulk'
    ],
    recommendedRatio: 'NPP 300-400mg/week + Anavar 50-75mg/day + Test base',
    recommendedProtocol: {
      nppDose: '300-400mg/week',
      anavarDose: '50-75mg/day',
      testBase: '400-600mg/week',
      cabergoline: '0.25-0.5mg 2x/week',
      tudca: '500mg daily',
      duration: '10-12 weeks'
    },
    recommendation: 'Excellent for quality lean bulk; manageable sides',
    caution: 'Prolactin management needed; verify Var source; lipid monitoring',
    stackBenefit: 'Quality lean mass, joint health, hardening, good tolerance',
    stackRisk: 'Moderate: prolactin, lipids, cost, source verification',
    rating: 'excellent'
  },

  trenbolone_winstrol: {
    description: 'Contest prep finisher; extremely dry + hard aesthetics',
    synergy: { benefit: 0.1, risk: 0.45 },
    mechanisms: [
      'Both "dry" compounds; peak conditioning',
      'Lipid devastation (both extreme)',
      'Psychological: Tren aggression + Winny joint pain = misery',
      'Hepatic from Winny; Tren lipid-toxic',
      'Often used final 4-6 weeks pre-contest'
    ],
    recommendedRatio: 'Tren 300-400mg/week + Winny 50mg/day (4-6 weeks) + Test 200mg',
    recommendedProtocol: {
      trenDose: '300-400mg/week',
      winstrolDose: '50mg/day, 4-6 weeks MAXIMUM',
      testBase: '200-300mg/week (TRT)',
      tudca: '500-1000mg daily',
      cabergoline: '0.25mg 2x/week',
      jointSupport: 'Essential',
      lipidManagement: 'Aggressive',
      duration: 'Final 4-6 weeks of prep'
    },
    recommendation: 'Contest prep only; extreme conditioning at high cost',
    caution: '⚠️ HIGH RISK: Lipids catastrophic, psychological stress, joint pain, sleep disruption; advanced only',
    stackBenefit: 'Peak contest conditioning, extreme hardness + dryness, vascularity',
    stackRisk: 'Extreme: lipids (catastrophic), psychological, joint pain, sleep, hepatic',
    rating: 'dangerous'
  }
};

/**
 * Helper function to get interaction data between two compounds
 * Handles both orderings (compound1_compound2 and compound2_compound1)
 */
export const getInteraction = (compound1, compound2) => {
  if (compound1 === compound2) return null;
  
  const key1 = `${compound1}_${compound2}`;
  const key2 = `${compound2}_${compound1}`;
  
  return interactionMatrix[key1] || interactionMatrix[key2] || null;
};

/**
 * Get heatmap score for compound pair
 * Returns color, symbol, and rating for visual display
 */
export const getInteractionScore = (compound1, compound2, options = {}) => {
  if (compound1 === compound2) {
    return { ...heatmapScores.compatible, symbol: '—', label: 'Same Compound', rating: 'same' };
  }

  const pairKey = resolvePairKey(compound1, compound2);
  if (!pairKey) {
    const legacy = getInteraction(compound1, compound2);
    if (legacy) {
      const rating = legacy.rating || 'compatible';
      return {
        ...(heatmapScores[rating] || heatmapScores.compatible),
        rating,
        benefitSynergy: legacy.synergy?.benefit ?? 0,
        riskSynergy: legacy.synergy?.risk ?? 0
      };
    }
    return { ...heatmapScores.compatible, rating: 'compatible' };
  }

  const pair = interactionPairs[pairKey];
  const {
    doses: suppliedDoses,
    profile,
    sensitivities = defaultSensitivities,
    evidenceBlend = DEFAULT_EVIDENCE_BLEND,
    useDefaults = true
  } = options;
  const summary = evaluatePairSynergy({
    pair,
    doses: buildPairDoseMap(pair, suppliedDoses, useDefaults),
    profile,
    sensitivities,
    evidenceBlend
  });

  const rating = determineSynergyRating(summary.benefit, summary.risk);
  return {
    ...(heatmapScores[rating] || heatmapScores.compatible),
    rating,
    benefitSynergy: summary.benefit,
    riskSynergy: summary.risk
  };
};

/**
 * Calculate synergy modifier for stack
 * Returns combined benefit and risk synergy values
 */
export const calculateStackSynergy = (compounds, options = {}) => {
  const {
    doses: suppliedDoses,
    profile,
    sensitivities = defaultSensitivities,
    evidenceBlend = DEFAULT_EVIDENCE_BLEND,
    useDefaults = true
  } = options;

  const { compounds: compoundKeys, doses } = normalizeStackInput(compounds, suppliedDoses);
  if (compoundKeys.length < 2) return { ...EMPTY_SYNERGY };

  let totalBenefitSynergy = 0;
  let totalRiskSynergy = 0;

  for (let i = 0; i < compoundKeys.length; i++) {
    for (let j = i + 1; j < compoundKeys.length; j++) {
      const pairKey = resolvePairKey(compoundKeys[i], compoundKeys[j]);
      if (!pairKey) {
        const legacy = getInteraction(compoundKeys[i], compoundKeys[j]);
        if (legacy?.synergy) {
          totalBenefitSynergy += legacy.synergy.benefit || 0;
          totalRiskSynergy += legacy.synergy.risk || 0;
        }
        continue;
      }
      const pair = interactionPairs[pairKey];
      const summary = evaluatePairSynergy({
        pair,
        doses: buildPairDoseMap(pair, doses, useDefaults),
        profile,
        sensitivities,
        evidenceBlend
      });
      totalBenefitSynergy += summary.benefit;
      totalRiskSynergy += summary.risk;
    }
  }

  return {
    benefitSynergy: Number(totalBenefitSynergy.toFixed(4)),
    riskSynergy: Number(totalRiskSynergy.toFixed(4))
  };
};

/**
 * Get all interactions for a specific compound
 * Useful for displaying compound-specific compatibility
 */
export const getCompoundInteractions = (compoundKey, options = {}) => {
  const interactions = {};
  
  Object.entries(interactionMatrix).forEach(([key, data]) => {
    if (key.includes(compoundKey)) {
      const otherCompound = key.replace(`${compoundKey}_`, '').replace(`_${compoundKey}`, '');
      const score = getInteractionScore(compoundKey, otherCompound, options);
      interactions[otherCompound] = {
        ...data,
        rating: score.rating
      };
    }
  });
  
  return interactions;
};
