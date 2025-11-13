export { PROFILE_STORAGE_KEY } from './storageKeys';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const defaultLabScales = {
  ageImpact: 1,
  trainingImpact: 1,
  shbgImpact: 1,
  aromataseImpact: 1,
  anxietyImpact: 1,
  experienceImpact: 1,
  uncertaintyImpact: 1
};

export const labPresets = {
  baseline: {
    label: 'Baseline (spec data)',
    scales: { ...defaultLabScales }
  },
  powerlifter: {
    label: 'Powerlifter (high training load)',
    scales: {
      ageImpact: 0.9,
      trainingImpact: 1.25,
      shbgImpact: 0.9,
      aromataseImpact: 0.9,
      anxietyImpact: 1,
      experienceImpact: 1.1,
      uncertaintyImpact: 0.9
    }
  },
  highAromatase: {
    label: 'High Aromatase',
    scales: {
      ageImpact: 1,
      trainingImpact: 1,
      shbgImpact: 1.2,
      aromataseImpact: 1.3,
      anxietyImpact: 1,
      experienceImpact: 1,
      uncertaintyImpact: 1.1
    }
  },
  conservative: {
    label: 'Conservative / TRT',
    scales: {
      ageImpact: 1.2,
      trainingImpact: 0.85,
      shbgImpact: 1.1,
      aromataseImpact: 1,
      anxietyImpact: 1.15,
      experienceImpact: 0.9,
      uncertaintyImpact: 1.2
    }
  }
};

export const defaultProfile = {
  age: 30,
  bodyweight: 90,
  yearsTraining: 5,
  shbg: 30,
  aromatase: 'moderate', // low | moderate | high
  anxiety: 'moderate', // low | moderate | high
  experience: 'test_only', // none | test_only | multi_compound | blast_cruise
  labMode: {
    enabled: false,
    preset: 'baseline',
    scales: { ...defaultLabScales }
  }
};

const experienceImpact = {
  none: { benefit: 0.18, risk: 0.35 },
  test_only: { benefit: 0.08, risk: 0.15 },
  multi_compound: { benefit: -0.05, risk: -0.05 },
  blast_cruise: { benefit: -0.12, risk: 0.0 }
};

const aromataseImpact = {
  low: -0.2,
  moderate: 0,
  high: 0.35
};

const anxietyImpact = {
  low: -0.1,
  moderate: 0,
  high: 0.35
};

const aromatizingCompounds = new Set(['testosterone', 'npp', 'dianabol', 'anadrol']);
const anxietySensitiveCompounds = new Set(['trenbolone', 'halotestin']);

const deriveHeavyTrainingScore = (profile) => {
  const weightComponent = clamp(((profile.bodyweight || defaultProfile.bodyweight) - 85) / 40, 0, 1);
  const trainingComponent = clamp(((profile.yearsTraining || defaultProfile.yearsTraining) - 3) / 9, 0, 1);
  return clamp((weightComponent * 0.6) + (trainingComponent * 0.4), 0, 1);
};

const deriveAgeOffset = (profile) => {
  const age = Number(profile.age || defaultProfile.age);
  return clamp((age - 35) / 35, -1, 1);
};

const deriveShbgDelta = (profile) => {
  if (profile.shbg === '' || profile.shbg === null || profile.shbg === undefined) {
    return 0;
  }
  const shbgValue = Number(profile.shbg);
  if (Number.isNaN(shbgValue)) return 0;
  return clamp((shbgValue - 30) / 40, -1, 1);
};

const getScale = (profile, key) => {
  if (!profile?.labMode?.enabled) return defaultLabScales[key] ?? 1;
  return profile.labMode.scales?.[key] ?? defaultLabScales[key] ?? 1;
};

export const personalizeScore = ({
  compoundKey,
  curveType,
  dose,
  baseValue,
  baseCi = 0,
  profile = defaultProfile
}) => {
  if (baseValue === undefined || baseValue === null) {
    return { value: baseValue, ci: baseCi };
  }

  let adjustedValue = baseValue;
  let ciMultiplier = 1;

  const ageDelta = deriveAgeOffset(profile);
  const heavyTrainingScore = deriveHeavyTrainingScore(profile);
  const shbgDelta = deriveShbgDelta(profile);
  const experience = experienceImpact[profile.experience] || experienceImpact.test_only;
  const aromataseDelta = aromataseImpact[profile.aromatase] ?? 0;
  const anxietyDelta = anxietyImpact[profile.anxiety] ?? 0;

  const ageScale = getScale(profile, 'ageImpact');
  const trainingScale = getScale(profile, 'trainingImpact');
  const shbgScale = getScale(profile, 'shbgImpact');
  const aromataseScale = getScale(profile, 'aromataseImpact');
  const anxietyScale = getScale(profile, 'anxietyImpact');
  const experienceScale = getScale(profile, 'experienceImpact');
  const uncertaintyScale = getScale(profile, 'uncertaintyImpact');

  if (curveType === 'benefit') {
    // Older athletes accrue benefit slightly slower; younger respond faster
    adjustedValue *= 1 - ageDelta * 0.25 * ageScale;

    // Heavy training load lifts baseline benefit (users already conditioned)
    if (heavyTrainingScore > 0) {
      adjustedValue += (0.15 + heavyTrainingScore * 0.35 * trainingScale);
      ciMultiplier *= 1 - heavyTrainingScore * 0.2 * trainingScale;
    }

    // Novice users typically respond harder (less desensitization)
    adjustedValue *= 1 + experience.benefit * experienceScale;
  } else {
    // Age compounds risk (cardio, hepatic, recovery)
    if (ageDelta > 0) {
      adjustedValue *= 1 + ageDelta * 0.4 * ageScale;
      ciMultiplier += ageDelta * 0.2 * ageScale;
    } else {
      adjustedValue *= 1 + ageDelta * 0.15 * ageScale;
    }

    // Training history + muscle mass confer slight safeguard
    adjustedValue *= 1 - heavyTrainingScore * 0.1 * trainingScale;

    adjustedValue *= 1 + experience.risk * experienceScale;
  }

  // SHBG specifically blunts testosterone benefit if elevated
  if (compoundKey === 'testosterone' && shbgDelta !== 0) {
    if (curveType === 'benefit') {
      adjustedValue *= 1 - shbgDelta * 0.4 * shbgScale;
    } else {
      adjustedValue *= 1 + shbgDelta * 0.15 * shbgScale;
    }
    ciMultiplier += Math.abs(shbgDelta) * 0.2 * shbgScale;
  }

  // Aromatase-driven variance affects estrogenic risk bands
  if (aromatizingCompounds.has(compoundKey)) {
    if (curveType === 'risk') {
      adjustedValue *= 1 + aromataseDelta * 0.8 * aromataseScale;
      ciMultiplier += Math.abs(aromataseDelta) * 0.4 * aromataseScale;
    } else if (curveType === 'benefit' && aromataseDelta > 0) {
      // High aromatase can blunt perceived benefit due to water retention/noise
      adjustedValue *= 1 - aromataseDelta * 0.15 * aromataseScale;
    }
  }

  // Anxiety-prone users see Tren/Halo risk ramp faster, especially early doses
  if (anxietySensitiveCompounds.has(compoundKey) && curveType === 'risk' && anxietyDelta !== 0) {
    const earlyDoseScalar = dose <= 300 ? 1.25 : 1.1;
    adjustedValue *= 1 + anxietyDelta * earlyDoseScalar * anxietyScale;
    ciMultiplier += Math.abs(anxietyDelta) * 0.5 * anxietyScale;
  }

  // Ensure uncertainty bounds respect profile volatility (minimum floor)
  const ciFloor = baseCi === 0 ? 0 : Math.max(baseCi, 0.1);
  const personalizedCi = clamp(ciFloor * ciMultiplier * uncertaintyScale, 0, 1.5);
  const boundedValue = clamp(adjustedValue, 0, 5.5);

  return {
    value: Number(boundedValue.toFixed(3)),
    ci: Number(personalizedCi.toFixed(3))
  };
};

export const buildPersonalizationNarrative = (profile = defaultProfile) => {
  const talkingPoints = [];
  const heavyTrainingScore = deriveHeavyTrainingScore(profile);
  const shbgDelta = deriveShbgDelta(profile);

  if (heavyTrainingScore > 0.4) {
    talkingPoints.push('Heavy training load recognized — benefit curves start ~0.2-0.5 higher.');
  }

  if (shbgDelta > 0.25) {
    talkingPoints.push('High SHBG detected — Testosterone benefit curve shifts right (needs more mg for same effect).');
  } else if (shbgDelta < -0.25) {
    talkingPoints.push('Low SHBG flagged — Testosterone potency boosted; watch E2 even at “low” doses.');
  }

  if ((profile.aromatase || 'moderate') === 'high') {
    talkingPoints.push('High aromatase tendency — Estrogenic risk bands widened for Test/NPP/“wet” orals.');
  }

  if ((profile.anxiety || 'moderate') === 'high') {
    talkingPoints.push('High anxiety sensitivity — Tren & Halo risk curves steepen early (<300mg).');
  }

  if ((profile.experience || 'test_only') === 'none') {
    talkingPoints.push('No prior AAS exposure — benefit inflated but risk penalty applied across compounds.');
  } else if (profile.experience === 'blast_cruise') {
    talkingPoints.push('Blast/cruise veteran — marginal benefit dampening assumed due to desensitization.');
  }

  if (profile.labMode?.enabled) {
    talkingPoints.push('Lab Mode active — coefficient overrides applied from ' + (labPresets[profile.labMode.preset]?.label || 'custom preset') + '.');
  }

  if (!talkingPoints.length) {
    talkingPoints.push('Baseline responder template — curves mirror published data closely.');
  }

  return talkingPoints;
};
