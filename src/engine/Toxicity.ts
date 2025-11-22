import { ICompoundSchema, IToxicityProfile, IToxicityModel } from '../types/physio';
import { hillEquation } from './math';

export interface IToxicityResult {
  hepatic: number; // Relative toxicity score
  renal: number;
  cardiovascular: number;
  lipid_metabolism: number;
  neurotoxicity: number;
}

export class ToxicityEngine {
  /**
   * Calculates toxicity scores based on concentration.
   * 
   * @param compound The compound definition
   * @param concentrationNM Concentration in nM
   * @returns Toxicity metrics
   */
  static calculateToxicity(compound: ICompoundSchema, concentrationNM: number): IToxicityResult {
    const toxicity = compound.toxicity;

    return {
      hepatic: this.evaluateModel(toxicity.hepatic, concentrationNM),
      renal: this.evaluateModel(toxicity.renal, concentrationNM),
      cardiovascular: this.evaluateModel(toxicity.cardiovascular, concentrationNM),
      lipid_metabolism: this.evaluateModel(toxicity.lipid_metabolism, concentrationNM),
      neurotoxicity: this.evaluateModel(toxicity.neurotoxicity, concentrationNM),
    };
  }

  private static evaluateModel(model: IToxicityModel, concentration: number): number {
    if (model.modelType === 'Hill_TC50') {
      const { Emax, TC50, Hill_n } = model.parameters;
      // Use the Hill equation but with TC50 instead of EC50
      return hillEquation(concentration, Emax, TC50, Hill_n);
    } else if (model.modelType === 'Coefficient') {
      // Simple exponential drag or linear model
      // For now, let's assume a linear coefficient model: Effect = coeff * concentration
      const coeff = model.parameters.coefficient || 0;
      return coeff * concentration;
    }
    return 0;
  }
}
