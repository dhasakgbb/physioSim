/**
 * Next-generation hostile-audience-proof compound ontology primitives.
 * Every quantitative value is unit-annotated, traceable, and paired with
 * uncertainty plus evidence metadata so downstream visualizations can
 * express confidence explicitly.
 */

export type EvidenceTier =
  | 'Tier1_RCT'
  | 'Tier2_MetaAnalysis'
  | 'Tier3_Cohort'
  | 'Tier4_CaseSeries'
  | 'Tier5_Anecdote';

export type EvidenceSourceType =
  | 'RandomizedControlledTrial'
  | 'ObservationalStudy'
  | 'CaseReport'
  | 'MechanisticInVitro'
  | 'PharmacokineticModel'
  | 'ExpertConsensus';

export interface EvidenceMetadata {
  tier: EvidenceTier;
  sourceType: EvidenceSourceType;
  citation?: string; // DOI, PMID, or URL
  population?: string; // e.g., "n=24 trained males"
  year?: number;
  notes?: string;
}

export type UncertaintyKind = 'CI' | 'SD' | 'Range' | 'DistributionSample';

export interface UncertaintyModel {
  kind: UncertaintyKind;
  confidenceLevel?: number; // 0-1 for CI
  lower?: number;
  upper?: number;
  standardDeviation?: number;
  samples?: number[];
  notes?: string;
}

export interface UnitValue {
  value: number;
  unit: string; // Use explicit units (mg, ng/mL, % change, score)
  normalizedTo?: string; // e.g., 'mg_per_week'
  normalizedValue?: number;
}

export interface QuantifiedValue {
  measurement: UnitValue;
  evidence: EvidenceMetadata;
  uncertainty?: UncertaintyModel;
  caveats?: string[];
}

export type ExposureRoute = 'IM' | 'SubQ' | 'Oral' | 'Transdermal' | 'IV';

export interface DosingSchedule {
  dose: UnitValue; // mg per administration
  frequencyHours: number;
  durationWeeks: number;
  taperStrategy?: 'Frontload' | 'Flat' | 'Pyramid' | 'Pulse';
}

export interface ExposureNormalization {
  mgPerWeek?: number;
  cMax?: UnitValue;
  cMin?: UnitValue;
  auc24h?: UnitValue;
}

export interface PopulationContext {
  sex?: 'Male' | 'Female' | 'Mixed';
  ageRangeYears?: [number, number];
  trainingStatus?: 'Untrained' | 'Recreational' | 'Advanced';
  bodyMassKg?: QuantifiedValue;
  bfPercent?: QuantifiedValue;
}

export interface ExposureDefinition {
  id: string;
  label: string;
  route: ExposureRoute;
  formulation: 'Base' | 'Esterified' | 'Blend' | 'OralC17aa' | 'TransdermalGel';
  ester?: string;
  schedule: DosingSchedule;
  population: PopulationContext;
  coInterventions?: string[]; // Other compounds/ancillaries present
  measurementWindow?: {
    startHoursPostDose: number;
    endHoursPostDose: number;
    state: 'Trough' | 'Peak' | 'SteadyState';
  };
  normalization: ExposureNormalization;
  evidence: EvidenceMetadata;
  assumptions?: string[]; // IDs referencing AssumptionTags
}

export type OutcomeDomain =
  | 'LeanMass'
  | 'Strength'
  | 'Lipolysis'
  | 'Endurance'
  | 'Psychological'
  | 'Cardiometabolic'
  | 'Hepatic'
  | 'Renal'
  | 'Neuro';

export interface OutcomeMetricDefinition {
  id: string;
  domain: OutcomeDomain;
  label: string;
  unit: string;
  higherIsBetter: boolean;
  description?: string;
}

export interface ExposureResponseAnchor {
  exposureId: string; // Reference ExposureDefinition.id
  dose: UnitValue; // mg per week or equivalized units
  outcomeValue: QuantifiedValue;
}

export interface PlateauConstraint {
  enforceNonDeclineAfterMgPerWeek?: number; // e.g., Tren rule at 300mg
  slopeCeiling?: number;
}

export type ResponseModel = 'Hill' | 'Spline' | 'Piecewise';

export interface OutcomeEffectSurface {
  metric: OutcomeMetricDefinition;
  model: ResponseModel;
  anchors: ExposureResponseAnchor[];
  plateau?: PlateauConstraint;
  narrative?: string; // human-readable interpretation
}

export type PhenotypeAxis =
  | 'Hypertrophy'
  | 'NeuralDrive'
  | 'LipolysisEfficiency'
  | 'EnduranceCapacity'
  | 'GlycogenRetention';

export interface PhenotypeVectorComponent {
  axis: PhenotypeAxis;
  score: QuantifiedValue; // Typically 0-10 scale
}

export interface TemporalDynamics {
  onsetHours?: QuantifiedValue;
  steadyStateDays?: QuantifiedValue;
  washoutDays?: QuantifiedValue;
  accumulationIndex?: QuantifiedValue;
  toleranceHalfLifeDays?: QuantifiedValue;
  hysteresis?: {
    direction: 'Clockwise' | 'CounterClockwise';
    lagHours: number;
  };
}

export interface PotencyScaling {
  referenceCompoundId: string; // Usually testosterone
  mgPer100Equivalent: QuantifiedValue; // Equivalent mg of reference per 100mg of this compound
  context?: string;
}

export type AssumptionSeverity = 'Low' | 'Medium' | 'High';

export interface AssumptionTag {
  id: string;
  statement: string;
  severity: AssumptionSeverity;
  rationale: string;
  mitigation?: string;
  evidenceGap?: EvidenceMetadata;
}

export interface BiomarkerEffect {
  biomarker: string; // e.g., "LDL-C"
  direction: 'Increase' | 'Decrease';
  magnitude: QuantifiedValue;
  recoveryHalfLifeDays?: QuantifiedValue;
}

export interface CompoundOntologyEntry {
  id: string;
  version: string; // Semantic version for ontology row
  aliases?: string[];
  exposures: ExposureDefinition[];
  potencyScaling: PotencyScaling;
  phenotypeVector: PhenotypeVectorComponent[];
  beneficialOutcomes: OutcomeEffectSurface[];
  riskOutcomes: OutcomeEffectSurface[];
  biomarkers?: BiomarkerEffect[];
  dynamics?: TemporalDynamics;
  assumptionTags?: AssumptionTag[];
  auditTrail: {
    created: string;
    createdBy: string;
    lastReviewed?: string;
    reviewers?: string[];
    changeNotes?: string;
  };
}
