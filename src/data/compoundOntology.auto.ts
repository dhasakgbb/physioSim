/**
 * Offline automation helpers for generating hostile-audience-proof ontology entries
 * from the legacy dataset. These are NOT shipped to production until each record
 * is validated with primary literature.
 */
import { COMPOUNDS } from './compounds';
import { compoundData, LEGACY_TO_CANONICAL, LegacyId, LegacyCompoundDatum, DosePoint } from './compoundData';
import { BASE_VECTOR_SCORES, ZERO_VECTORS } from './compoundVectors';
import { ICompoundSchema } from '../types/physio';
import {
  AssumptionTag,
  CompoundOntologyEntry,
  EvidenceMetadata,
  EvidenceSourceType,
  EvidenceTier,
  ExposureDefinition,
  OutcomeEffectSurface,
  OutcomeMetricDefinition,
  PhenotypeVectorComponent,
  PopulationContext,
  PotencyScaling,
  QuantifiedValue,
  TemporalDynamics,
  UnitValue
} from '../types/compoundOntology';

const DEFAULT_POPULATION_CONTEXT: PopulationContext = {
  sex: 'Male',
  ageRangeYears: [25, 40],
  trainingStatus: 'Recreational'
};

const ASSUMPTION_LIBRARY: Record<string, AssumptionTag> = {
  steady_state_assumed: {
    id: 'steady_state_assumed',
    statement: 'Steady-state concentrations inferred after ~4 half-lives for each exposure.',
    severity: 'Medium',
    rationale: 'Legacy PK traces lacked serial trough monitoring for every ester.',
    mitigation: 'Surface trough overrides and confidence chips in the UI.'
  },
  auto_generated_curve: {
    id: 'auto_generated_curve',
    statement: 'Benefit/risk anchors auto-generated from PhysioSim legacy curves.',
    severity: 'Medium',
    rationale: 'Dataset blends theoretical PK/PD with community aggregates.',
    mitigation: 'Flag Tier 5 evidence and invite user-supplied labs.',
    evidenceGap: {
      tier: 'Tier5_Anecdote',
      sourceType: 'ExpertConsensus',
      notes: 'Awaiting prospective validation runs.'
    }
  },
  legacy_curve_projection: {
    id: 'legacy_curve_projection',
    statement: 'High-dose curves projected with monotonic guardrails beyond published data.',
    severity: 'High',
    rationale: 'Prevents false precision when evidence is sparse.',
    mitigation: 'Clamp slopes + require citations before relaxing guardrails.'
  }
};

const EXPOSURE_ASSUMPTION_IDS = ['steady_state_assumed', 'auto_generated_curve'];

const TIER_MATCHERS: Array<{ match: string; tier: EvidenceTier }> = [
  { match: 'tier 1', tier: 'Tier1_RCT' },
  { match: 'tier 2', tier: 'Tier2_MetaAnalysis' },
  { match: 'tier 3', tier: 'Tier3_Cohort' },
  { match: 'tier 4', tier: 'Tier4_CaseSeries' },
  { match: 'tier 5', tier: 'Tier5_Anecdote' }
];

const SOURCE_BY_TIER: Record<EvidenceTier, EvidenceSourceType> = {
  Tier1_RCT: 'RandomizedControlledTrial',
  Tier2_MetaAnalysis: 'ObservationalStudy',
  Tier3_Cohort: 'ObservationalStudy',
  Tier4_CaseSeries: 'ExpertConsensus',
  Tier5_Anecdote: 'ExpertConsensus'
};

const automationEvidence = (notes?: string): EvidenceMetadata => ({
  tier: 'Tier5_Anecdote',
  sourceType: 'ExpertConsensus',
  notes: notes ?? 'Auto-generated from PhysioSim legacy dataset.'
});

const cloneAssumption = (tag: AssumptionTag): AssumptionTag => ({
  ...tag,
  evidenceGap: tag.evidenceGap ? { ...tag.evidenceGap } : undefined
});

const mapTierToEvidence = (tier?: string): EvidenceMetadata => {
  const normalized = tier?.toLowerCase() ?? '';
  const match = TIER_MATCHERS.find(({ match }) => normalized.includes(match));
  const resolvedTier = match?.tier ?? 'Tier5_Anecdote';
  return {
    tier: resolvedTier,
    sourceType: SOURCE_BY_TIER[resolvedTier],
    notes: normalized
      ? `Mapped from legacy ${tier}`
      : 'Auto-generated from PhysioSim legacy dataset.'
  };
};

const createAutomationQuantifiedValue = (value: number, unit: string, span = 0.2): QuantifiedValue => {
  const lower = Number(Math.max(0, value * (1 - span)).toFixed(2));
  const upper = Number(Math.max(lower, value * (1 + span)).toFixed(2));
  return {
    measurement: { value, unit },
    evidence: automationEvidence(),
    uncertainty: { kind: 'Range', lower, upper }
  };
};

const toDoseUnitValue = (dose: number, isOral: boolean): UnitValue => ({
  value: dose,
  unit: isOral ? 'mg/day' : 'mg/week',
  normalizedTo: 'mg_per_week',
  normalizedValue: Number((isOral ? dose * 7 : dose).toFixed(2))
});

const buildPhenotypeVector = (compoundId: string): PhenotypeVectorComponent[] => {
  const base = BASE_VECTOR_SCORES[compoundId] ?? ZERO_VECTORS;
  const axes: Array<{ axis: PhenotypeVectorComponent['axis']; value: number }> = [
    { axis: 'Hypertrophy', value: base.hypertrophy },
    { axis: 'NeuralDrive', value: base.neural },
    { axis: 'LipolysisEfficiency', value: base.lipolysis },
    { axis: 'EnduranceCapacity', value: base.endurance },
    { axis: 'GlycogenRetention', value: base.glycogen }
  ];

  return axes.map(({ axis, value }) => ({
    axis,
    score: {
      measurement: { value, unit: 'score_0_10' },
      evidence: automationEvidence('Derived from legacy phenotype vectors.'),
      uncertainty: {
        kind: 'Range',
        lower: Number(Math.max(0, value - 1).toFixed(2)),
        upper: Number(Math.min(10, value + 1).toFixed(2))
      }
    }
  }));
};

const buildPotencyScaling = (schema: ICompoundSchema): PotencyScaling => {
  const potency = schema.metadata.basePotency ?? 1;
  const value = Number((100 * potency).toFixed(2));
  return {
    referenceCompoundId: 'testosterone',
    mgPer100Equivalent: {
      measurement: {
        value,
        unit: 'mg_testosterone_equivalent',
        normalizedTo: 'per_100mg',
        normalizedValue: 100
      },
      evidence: automationEvidence('Derived from metadata basePotency ratios.'),
      uncertainty: {
        kind: 'Range',
        lower: Number((value * 0.85).toFixed(2)),
        upper: Number((value * 1.15).toFixed(2))
      }
    },
    context: 'Auto-generated from metadata basePotency.'
  };
};

const buildAssumptionTags = (): AssumptionTag[] => (
  Object.values(ASSUMPTION_LIBRARY).map(cloneAssumption)
);

const buildOutcomeValue = (point: DosePoint, kind: 'benefit' | 'risk'): QuantifiedValue => {
  const ci = point.ci ?? 0.4;
  const lower = Number(Math.max(0, point.value - ci).toFixed(2));
  const upper = Number(Math.max(lower, point.value + ci).toFixed(2));
  const baseEvidence = mapTierToEvidence(point.tier);
  const contextNote = kind === 'benefit' ? 'Benefit anchor' : 'Risk anchor';
  return {
    measurement: { value: Number(point.value.toFixed(2)), unit: 'score' },
    evidence: {
      ...baseEvidence,
      notes: `${contextNote} — ${baseEvidence.notes ?? ''}`.trim()
    },
    uncertainty: {
      kind: 'CI',
      confidenceLevel: 0.9,
      lower,
      upper
    },
    caveats: point.caveat ? [point.caveat] : undefined
  };
};

const buildOutcomeSurface = (
  canonicalId: string,
  datum: LegacyCompoundDatum,
  exposureIndex: Map<number, string>,
  isOral: boolean,
  kind: 'benefit' | 'risk'
): OutcomeEffectSurface => {
  const dataset = kind === 'benefit' ? datum.benefitCurve : datum.riskCurve;
  const metric: OutcomeMetricDefinition = {
    id: `${canonicalId}_${kind}_score`,
    domain: kind === 'benefit' ? 'LeanMass' : 'Cardiometabolic',
    label: kind === 'benefit' ? 'Composite Benefit Score' : 'Composite Risk Score',
    unit: 'score',
    higherIsBetter: kind === 'benefit'
  };

  const anchors = dataset
    .filter(point => point.dose > 0 && exposureIndex.has(point.dose))
    .map(point => ({
      exposureId: exposureIndex.get(point.dose)!,
      dose: toDoseUnitValue(point.dose, isOral),
      outcomeValue: buildOutcomeValue(point, kind)
    }));

  return {
    metric,
    model: kind === 'benefit' ? 'Hill' : 'Spline',
    anchors,
    plateau: {
      enforceNonDeclineAfterMgPerWeek: isOral ? 250 : 450,
      slopeCeiling: kind === 'benefit' ? 0.05 : 0.3
    },
    narrative: `Auto-generated ${kind} curve derived from PhysioSim legacy data for ${canonicalId}.`
  };
};

const buildTemporalDynamics = (schema: ICompoundSchema, isOral: boolean): TemporalDynamics => {
  const inferHalfLifeHours = (): number => {
    if (isOral) return 24;
    const esterKeys = Object.keys(schema.pk.esters ?? {});
    if (!esterKeys.length) return 84;
    if (esterKeys.some(key => key.includes('prop'))) return 48;
    if (esterKeys.some(key => key.includes('phenyl')) || esterKeys.some(key => key.includes('dec'))) return 168;
    if (esterKeys.some(key => key.includes('undeca'))) return 240;
    return 96;
  };

  const halfLifeHours = inferHalfLifeHours();
  const steadyStateDays = Number(((halfLifeHours / 24) * 5).toFixed(1));
  const washoutDays = Number((steadyStateDays * 1.5).toFixed(1));
  const onsetHours = isOral ? 4 : 24;

  return {
    onsetHours: createAutomationQuantifiedValue(onsetHours, 'hours', 0.25),
    steadyStateDays: createAutomationQuantifiedValue(steadyStateDays, 'days', 0.2),
    washoutDays: createAutomationQuantifiedValue(washoutDays, 'days', 0.25),
    accumulationIndex: createAutomationQuantifiedValue(isOral ? 1.2 : 1.7, 'ratio', 0.1)
  };
};

const buildExposureDefinitions = (
  canonicalId: string,
  schema: ICompoundSchema,
  datum: LegacyCompoundDatum,
  isOral: boolean
): { exposures: ExposureDefinition[]; exposureIndex: Map<number, string> } => {
  const exposures: ExposureDefinition[] = [];
  const exposureIndex = new Map<number, string>();
  const esterKey = !isOral ? Object.keys(schema.pk.esters ?? {})[0] : undefined;

  datum.benefitCurve
    .filter(point => point.dose > 0)
    .forEach(point => {
      const exposureId = `${canonicalId}_${isOral ? 'oral' : 'im'}_${point.dose}`;
      const doseUnitValue = toDoseUnitValue(point.dose, isOral);
      exposures.push({
        id: exposureId,
        label: `${schema.metadata.name} ${point.dose} ${isOral ? 'mg/day' : 'mg/week'}`,
        route: isOral ? 'Oral' : 'IM',
        formulation: isOral
          ? (schema.metadata.structuralFlags.isC17aa ? 'OralC17aa' : 'Base')
          : 'Esterified',
        ester: esterKey,
        schedule: {
          dose: doseUnitValue,
          frequencyHours: isOral ? 24 : 168,
          durationWeeks: isOral ? 6 : 12,
          taperStrategy: isOral ? 'Flat' : 'Pyramid'
        },
        population: DEFAULT_POPULATION_CONTEXT,
        measurementWindow: {
          startHoursPostDose: isOral ? 2 : 72,
          endHoursPostDose: isOral ? 6 : 120,
          state: 'SteadyState'
        },
        normalization: {
          mgPerWeek: doseUnitValue.normalizedValue
        },
        evidence: mapTierToEvidence(point.tier),
        assumptions: EXPOSURE_ASSUMPTION_IDS
      });
      exposureIndex.set(point.dose, exposureId);
    });

  return { exposures, exposureIndex };
};

const buildOntologyEntry = (
  canonicalId: string,
  legacyId: LegacyId,
  datum: LegacyCompoundDatum,
  version: string,
  generatedDate: string
): CompoundOntologyEntry => {
  const schema = COMPOUNDS[canonicalId];
  if (!schema) {
    throw new Error(`Missing canonical schema for ${canonicalId}`);
  }

  const isOral = datum.type === 'oral';
  const { exposures, exposureIndex } = buildExposureDefinitions(canonicalId, schema, datum, isOral);

  return {
    id: canonicalId,
    version,
    aliases: legacyId !== canonicalId ? [legacyId] : undefined,
    exposures,
    potencyScaling: buildPotencyScaling(schema),
    phenotypeVector: buildPhenotypeVector(canonicalId),
    beneficialOutcomes: [
      buildOutcomeSurface(canonicalId, datum, exposureIndex, isOral, 'benefit')
    ],
    riskOutcomes: [
      buildOutcomeSurface(canonicalId, datum, exposureIndex, isOral, 'risk')
    ],
    dynamics: buildTemporalDynamics(schema, isOral),
    assumptionTags: buildAssumptionTags(),
    auditTrail: {
      created: generatedDate,
      createdBy: 'ontology-automation',
      lastReviewed: generatedDate,
      reviewers: ['automation-pipeline'],
      changeNotes: 'Auto-generated from legacy PhysioSim curves.'
    }
  };
};

export interface AutoOntologyOptions {
  version?: string;
  generatedDate?: string;
  excludeIds?: string[];
}

export const DEFAULT_AUTO_OPTIONS: Required<AutoOntologyOptions> = {
  version: '0.2.0',
  generatedDate: '2025-11-22',
  excludeIds: []
};

export function generateAutoOntologyEntries(options: AutoOntologyOptions = {}): Record<string, CompoundOntologyEntry> {
  const config: Required<AutoOntologyOptions> = {
    version: options.version ?? DEFAULT_AUTO_OPTIONS.version,
    generatedDate: options.generatedDate ?? DEFAULT_AUTO_OPTIONS.generatedDate,
    excludeIds: options.excludeIds ?? DEFAULT_AUTO_OPTIONS.excludeIds
  };
  const excluded = new Set(config.excludeIds);
  const entries: Record<string, CompoundOntologyEntry> = {};

  (Object.entries(compoundData) as [LegacyId, LegacyCompoundDatum][]).forEach(([legacyId, datum]) => {
    const canonicalId = LEGACY_TO_CANONICAL[legacyId];
    if (!canonicalId || excluded.has(canonicalId)) return;
    entries[canonicalId] = buildOntologyEntry(canonicalId, legacyId, datum, config.version, config.generatedDate);
  });

  return entries;
}
