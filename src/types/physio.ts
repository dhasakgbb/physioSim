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
  molecularWeightRatio: number;
  absorptionModel: 'FirstOrder' | 'DualPhase';
  parameters: {
    Ka?: number;
    Ka_fast?: number;
    Ka_slow?: number;
    fractionFast?: number;
  };
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
