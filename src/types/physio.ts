// Data Provenance
export interface IProvenanceEntry {
  source: 'HumanClinical' | 'InVitro' | 'AnimalModel' | 'QSAR' | 'ExpertHeuristic';
  citation?: string; // DOI or PubMed ID
  confidence: 'Low' | 'Medium' | 'High';
  notes?: string;
}

export interface IProvenanceMap {
  [parameterPath: string]: IProvenanceEntry;
}

// Drug-Drug Interactions (DDI)
export interface IPKInteractionEffect {
  type: 'EnzymeInhibition' | 'EnzymeInduction' | 'ProteinBindingDisplacement';
  target?: 'CYP3A4' | 'CYP2D6' | 'CYP19A1' | 'SRD5A' | 'UGT';
  inhibitionPercent?: number; // 0-100 (e.g., 96 for AI)
  shbgDisplacementFactor?: number; // Multiplier for free fraction
  affectedCompound: string; // compoundId
}

export interface IPDInteractionEffect {
  type: 'ReceptorCompetition' | 'PathwaySynergy' | 'PathwayAntagonism';
  pathway: 'myogenesis' | 'erythropoiesis' | 'lipolysis' | 'cns_activation' | 'hpta_suppression';
  multiplier: number; // 0.5 = 50% reduction, 1.5 = 50% enhancement
  affectedCompound?: string; // If specific, otherwise affects both
}

export interface IToxicityInteractionEffect {
  type: 'Additive' | 'Synergistic' | 'Protective';
  organ: 'hepatic' | 'renal' | 'cardiovascular' | 'lipid_metabolism' | 'neurotoxicity';
  multiplier: number; // e.g., 1.8 for synergistic, 0.7 for protective
  doseThreshold?: { compound: string; minDose: number }; // Only applies above threshold
}

export interface IDrugDrugInteraction {
  id: string; // Unique identifier (e.g., "tren_anadrol_hepatotox")
  compounds: [string, string]; // [compoundId1, compoundId2]
  effects: {
    pk?: IPKInteractionEffect;
    pd?: IPDInteractionEffect;
    toxicity?: IToxicityInteractionEffect;
  };
  metadata: {
    severity: 'Info' | 'Warning' | 'Critical';
    mechanism: string; // 1-2 sentence explanation
    recommendations: string[]; // Actionable advice
    provenance: IProvenanceEntry;
  };
}

export type DDIRegistry = IDrugDrugInteraction[];

// Compound Schema
export interface ICompoundSchema {
  id: string;
  metadata: ICompoundMetadata;
  pk: IPharmacokinetics;
  pd: IPharmacodynamics;
  toxicity: IToxicityProfile;
  clinical?: IClinicalGuide;
  provenance: IProvenanceMap;
}

// Metadata
export type CompoundClassification = 'AAS' | 'SARM' | 'SERM' | 'AI' | 'Peptide' | 'Ancillary' | 'Other';
export type CompoundFamily = 'Testosterone-derived' | 'DHT-derived' | '19-nor' | 'Non-steroidal' | 'Other';

export interface ICompoundMetadata {
  name: string;
  abbreviation: string;
  classification: CompoundClassification;
  family: CompoundFamily;
  administrationRoutes: Array<'IM' | 'SubQ' | 'Oral' | 'Transdermal'>;

  chemicalProperties: {
    molecularWeight: number; // g/mol (Parent compound)
    CAS_RN?: string;
    PubChem_CID?: number;
  };

  structuralFlags: {
    isC17aa: boolean; // C17-alpha alkylation
    is19Nor: boolean;
  };
  
  // UI Metadata
  color?: string;
  description?: string;
  basePotency?: number;
  baseToxicity?: number;
}

// Clinical Guide
export interface IClinicalGuide {
  summary: string;
  benefitRationale: string;
  riskRationale: string;
}

// Pharmacokinetics (PK)
export interface IPharmacokinetics {
  Vd: number; // Volume of Distribution (L/kg)
  CL: number; // Clearance (mL/min/kg)

  proteinBinding: {
    SHBG_Kd: number; // nM
    Albumin_Kd: number; // nM
  };

  absorption: {
    oral?: {
      F: number; // Bioavailability (0-1)
      Ka: number; // Absorption rate constant (h⁻¹)
    };
  };

  esters?: Record<string, IEsterDefinition>;
}

export interface IEsterDefinition {
  id: string;
  molecularWeightRatio?: number;
  absorptionModel?: 'FirstOrder' | 'DualPhase';
  parameters?: {
    Ka?: number;
    Ka_fast?: number;
    Ka_slow?: number;
    fractionFast?: number;
  };
  releaseHalfLife_Hours?: number;
  peakTime_Hours?: number;
}

// Pharmacodynamics (PD)
export interface IPharmacodynamics {
  receptorInteractions: IReceptorInteractions;
  enzymaticInteractions: IEnzymaticInteractions;
  pathwayModulation: IPathwayModulation;
}

export interface IReceptorInteractions {
  AR: IReceptorActivity;
  ER_alpha?: IReceptorActivity;
  ER_beta?: IReceptorActivity;
  PR?: IReceptorActivity;
  GR?: IReceptorActivity;
}

export interface IReceptorActivity {
  Kd: number; // nM
  activityType: 'FullAgonist' | 'PartialAgonist' | 'Antagonist' | 'Modulator';
  Emax: number;
  EC50: number;
  Hill_n: number;
}

export interface IEnzymaticInteractions {
  Aromatase_CYP19A1: IEnzymeKinetics;
  FiveAlphaReductase_SRD5A: IEnzymeKinetics;
}

export interface IEnzymeKinetics {
  isSubstrate: boolean;
  Km?: number; // nM
  Vmax_relative?: number;
  isInhibitor: boolean;
  Ki?: number; // nM
  inhibitionType?: 'Competitive' | 'NonCompetitive' | 'Irreversible';
}

export interface IPathwayModulation {
  genomic: {
    myogenesis: IHillParameters;
    erythropoiesis: IHillParameters;
    lipolysis: IHillParameters;
  };
  nonGenomic: {
    cns_activation: IHillParameters;
    glycogen_synthesis: IHillParameters;
  };
  systemic: {
    HPTA_suppression: IHillParameters;
    SHBG_synthesis_modulation: IHillParameters;
  };
}

export interface IHillParameters {
  Emax: number;
  EC50: number;
  Hill_n: number;
}

// Toxicity
export interface IToxicityProfile {
  hepatic: IToxicityModel;
  renal: IToxicityModel;
  cardiovascular: IToxicityModel;
  lipid_metabolism: IToxicityModel;
  neurotoxicity: IToxicityModel;
}

export interface IToxicityModel {
  modelType: 'Hill_TC50' | 'Coefficient';
  parameters: Record<string, number>;
}

// Drug-Drug Interaction
export interface IDrugDrugInteraction {
  id: string;
  compoundA: string;
  compoundB: string;
  mechanismDescription: string;
  targetPathway: string;
  model: 'Additive' | 'Multiplicative' | 'Potentiation';
  magnitudeScalar: number;
  provenance: IProvenanceEntry;
}
