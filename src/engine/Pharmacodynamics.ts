import { ICompoundSchema, IPharmacodynamics, IReceptorActivity, IHillParameters } from '../types/physio';
import { hillEquation } from './math';

export interface IPDSimulationResult {
  time: number;
  receptorOccupancy: {
    AR: number; // % occupancy (0-100)
    ER_alpha?: number;
    ER_beta?: number;
    PR?: number;
    GR?: number;
  };
  pathwayActivation: {
    myogenesis: number; // Relative effect (0-Emax)
    erythropoiesis: number;
    lipolysis: number;
    cns_activation: number;
    hpta_suppression: number;
  };
}

export class PharmacodynamicsEngine {
  /**
   * Calculates PD effects based on concentration.
   * 
   * @param compound The compound definition
   * @param concentrationNM Concentration in nM
   * @returns PD metrics
   */
  static calculateEffects(compound: ICompoundSchema, concentrationNM: number): Omit<IPDSimulationResult, 'time'> {
    const pd = compound.pd;
    
    // 1. Receptor Occupancy (Hill-Langmuir)
    // Occupancy = [L] / ([L] + Kd)
    // We can treat this as a Hill equation with n=1 and Emax=100
    
    const occupancy = {
      AR: this.calculateOccupancy(concentrationNM, pd.receptorInteractions.AR),
      ER_alpha: pd.receptorInteractions.ER_alpha ? this.calculateOccupancy(concentrationNM, pd.receptorInteractions.ER_alpha) : 0,
      ER_beta: pd.receptorInteractions.ER_beta ? this.calculateOccupancy(concentrationNM, pd.receptorInteractions.ER_beta) : 0,
      PR: pd.receptorInteractions.PR ? this.calculateOccupancy(concentrationNM, pd.receptorInteractions.PR) : 0,
      GR: pd.receptorInteractions.GR ? this.calculateOccupancy(concentrationNM, pd.receptorInteractions.GR) : 0,
    };

    // 2. Pathway Modulation (Hill Equations)
    const pathways = pd.pathwayModulation;
    
    const activation = {
      myogenesis: this.calculatePathway(concentrationNM, pathways.genomic.myogenesis),
      erythropoiesis: this.calculatePathway(concentrationNM, pathways.genomic.erythropoiesis),
      lipolysis: this.calculatePathway(concentrationNM, pathways.genomic.lipolysis),
      cns_activation: this.calculatePathway(concentrationNM, pathways.nonGenomic.cns_activation),
      hpta_suppression: this.calculatePathway(concentrationNM, pathways.systemic.HPTA_suppression),
    };

    return {
      receptorOccupancy: occupancy,
      pathwayActivation: activation
    };
  }

  private static calculateOccupancy(concentration: number, receptor: IReceptorActivity): number {
    // Simple occupancy: C / (C + Kd) * 100
    if (!receptor) return 0;
    return (concentration / (concentration + receptor.Kd)) * 100;
  }

  private static calculatePathway(concentration: number, params: IHillParameters): number {
    return hillEquation(concentration, params.Emax, params.EC50, params.Hill_n);
  }
}
