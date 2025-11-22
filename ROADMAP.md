This is a comprehensive roadmap for designing the next-generation compound data structure for physioSim. This structure is crucial for transitioning the simulation from a heuristic-based model towards a rigorous Quantitative Systems Pharmacology (QSP) platform. It accommodates complex pharmacokinetics (PK), multi-pathway pharmacodynamics (PD), toxicity modeling, and drug-drug interactions (DDI).Design Philosophy: From Heuristics to MechanismsThe core evolution is to replace empirical, subjective ratings (e.g., anabolicRating, potency) with standardized, measurable pharmacological parameters (e.g., $K_d$, $EC_{50}$, $K_m$, $V_d$). This enables the mechanistic modeling of time-series concentration, receptor competition, free hormone dynamics, and enzymatic conversions.1. Data Provenance and TransparencyScientific rigor demands traceability. We will use a centralized map to track the source of parameters, which is cleaner than embedding provenance with every value.TypeScript// Helper interface for data provenance
interface IProvenanceEntry {
source: 'HumanClinical' | 'InVitro' | 'AnimalModel' | 'QSAR' | 'ExpertHeuristic';
citation?: string; // DOI or PubMed ID
confidence: 'Low' | 'Medium' | 'High';
notes?: string;
}

// A map to store provenance, keyed by the parameter path (e.g., "pk.Vd")
interface IProvenanceMap {
[parameterPath: string]: IProvenanceEntry;
} 2. The Evolved Compound Schema (TypeScript Interfaces)TypeScriptinterface ICompoundSchema {
id: string;
metadata: ICompoundMetadata;
pk: IPharmacokinetics;
pd: IPharmacodynamics;
toxicity: IToxicityProfile;
provenance: IProvenanceMap;
}
2.1. Metadata and IdentificationTypeScriptinterface ICompoundMetadata {
name: string;
abbreviation: string;
classification: 'AAS' | 'SARM' | 'SERM' | 'AI' | 'Peptide' | 'Other';
family: 'Testosterone-derived' | 'DHT-derived' | '19-nor' | 'Other';
administrationRoutes: Array<'IM' | 'SubQ' | 'Oral' | 'Transdermal'>;

chemicalProperties: {
// Essential for converting mass (mg) to molar concentration (nM)
molecularWeight: number; // g/mol (Parent compound)
CAS_RN?: string;
PubChem_CID?: number;
};

// Structural flags relevant for metabolism/toxicity heuristics
structuralFlags: {
isC17aa: boolean; // C17-alpha alkylation (Hepatic toxicity implication)
is19Nor: boolean;
};
}
2.2. Pharmacokinetics (PK) - ADMEThis defines how the drug concentration changes over time, supporting dynamic time-series modeling. We prioritize Volume of Distribution (Vd) and Clearance (CL) as the standard parameters.TypeScriptinterface IPharmacokinetics {
// Distribution
Vd: number; // Volume of Distribution (L/kg)

// Elimination (Parent Compound)
CL: number; // Clearance (mL/min/kg). Defines the intrinsic elimination rate.

// Protein Binding (Crucial for Free Hormone Calculation)
proteinBinding: {
SHBG_Kd: number; // Dissociation constant (nM)
Albumin_Kd: number; // (nM)
};

// Absorption (Route-specific)
absorption: {
oral?: {
F: number; // Bioavailability (0-1)
Ka: number; // Absorption rate constant (h⁻¹)
};
// Add Transdermal, SubQ as needed
};

// Esters (for injectables/prodrugs)
esters?: Record<string, IEsterDefinition>;
}

interface IEsterDefinition {
id: string;
// Ratio of parent MW to esterified MW
molecularWeightRatio: number;

// Depot Release Kinetics (Defines absorption from IM injection site - Flip-Flop Kinetics)
absorptionModel: 'FirstOrder' | 'DualPhase';
parameters: {
// FirstOrder
Ka?: number; // Absorption rate constant (h⁻¹)
// DualPhase (e.g., for Testosterone Undecanoate or mixed esters like Sustanon)
Ka_fast?: number;
Ka_slow?: number;
fractionFast?: number; // Fraction of dose absorbed via the fast pathway
};
}
2.3. Pharmacodynamics (PD) - Mechanism of ActionThis defines how the compound affects the body based on its concentration.TypeScriptinterface IPharmacodynamics {
receptorInteractions: IReceptorInteractions;
enzymaticInteractions: IEnzymaticInteractions;
pathwayModulation: IPathwayModulation;
}
2.3.1. Receptor Interactions (Primarily Genomic)TypeScriptinterface IReceptorInteractions {
AR: IReceptorActivity; // Androgen Receptor
ER_alpha?: IReceptorActivity;
ER_beta?: IReceptorActivity;
PR?: IReceptorActivity; // Progesterone Receptor
GR?: IReceptorActivity; // Glucocorticoid Receptor (anti-catabolic effects)
}

interface IReceptorActivity {
// Drives competitive binding simulation
Kd: number; // Dissociation constant (nM).
activityType: 'FullAgonist' | 'PartialAgonist' | 'Antagonist' | 'Modulator';

// Hill Equation Parameters (Replaces 'potency' and 'saturationCeiling')
// Defines the primary genomic response (e.g., overall anabolic signal)
Emax: number; // Efficacy (relative to reference, e.g., T=1.0)
EC50: number; // Potency (nM concentration for 50% effect)
Hill_n: number; // Hill coefficient (steepness)
}
2.3.2. Enzymatic Interactions (Metabolism and Inhibition)Enables modeling using Michaelis-Menten kinetics.TypeScriptinterface IEnzymaticInteractions {
Aromatase_CYP19A1: IEnzymeKinetics;
FiveAlphaReductase_SRD5A: IEnzymeKinetics;
// Extendable to others (e.g., CYP3A4 for DDI, 11β-HSD for cortisol modulation)
}

interface IEnzymeKinetics {
isSubstrate: boolean;
// Michaelis-Menten parameters (if substrate)
Km?: number; // Michaelis constant (nM)
Vmax_relative?: number; // Relative to reference substrate (e.g., Testosterone)

isInhibitor: boolean;
// Inhibition parameters (if inhibitor, e.g., Anastrozole or Finasteride)
Ki?: number; // Inhibition constant (nM)
inhibitionType?: 'Competitive' | 'NonCompetitive' | 'Irreversible';
}
2.3.3. Pathway Modulation (Genomic, Non-Genomic, Systemic)This replaces abstract pathwayWeights with specific physiological outcomes modeled using Hill curves.TypeScriptinterface IPathwayModulation {
// Specific Genomic Outcomes (driven by AR or other receptors)
genomic: {
myogenesis: IHillParameters; // Muscle hypertrophy
erythropoiesis: IHillParameters; // RBC production (Hematocrit)
lipolysis: IHillParameters;
};
// Non-Genomic (Rapid signaling)
nonGenomic: {
// Replaces 'androgenicRating' and 'cosmeticFactor'
cns_activation: IHillParameters; // Strength, aggression, CNS drive
glycogen_synthesis: IHillParameters; // Fullness, pump, fluid retention
};
// Systemic Regulation
systemic: {
// Concentration causing 50% suppression (IC50)
HPTA_suppression: IHillParameters;
// Impact on liver production of SHBG
SHBG_synthesis_modulation: IHillParameters;
};
}

// Standardized Hill Curve parameters helper
interface IHillParameters {
Emax: number;
EC50: number;
Hill_n: number;
}
2.4. Toxicity Profile (The "Drag")A hybrid approach that prioritizes mechanistic, concentration-dependent models (Hill/TC50) but allows fallback to empirical coefficients when data is scarce.TypeScriptinterface IToxicityProfile {
hepatic: IToxicityModel;
renal: IToxicityModel;
cardiovascular: IToxicityModel;
lipid_metabolism: IToxicityModel; // e.g., Hepatic Lipase activation
neurotoxicity: IToxicityModel;
}

interface IToxicityModel {
modelType: 'Hill_TC50' | 'Coefficient';
parameters: Record<string, number>;
// If Hill_TC50: parameters include Emax, TC50 (Toxic Concentration 50%), Hill_n.
// This ensures bounded toxicity effects.
// If Coefficient: parameters include the exponential drag coefficient.
} 3. Drug-Drug Interaction (DDI) RegistryMany interactions (like receptor competition or enzyme inhibition) will emerge mechanistically from the parameters above. A separate registry handles specific, known synergistic or antagonistic effects not captured by the core mechanisms.TypeScriptinterface IDrugDrugInteraction {
id: string;
compoundA: string; // Can be ID or class
compoundB: string; // Can be ID or class
mechanismDescription: string;
targetPathway: string; // e.g., "Toxicity.Hepatic" or "PD.NonGenomic.cns_activation"
model: 'Additive' | 'Multiplicative' | 'Potentiation';
magnitudeScalar: number;
provenance: IProvenanceEntry;
}
