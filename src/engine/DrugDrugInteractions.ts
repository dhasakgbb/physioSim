import { IDrugDrugInteraction, ICompoundSchema } from '../types/physio';

/**
 * Drug-Drug Interaction Engine
 * 
 * Applies interaction effects to PK/PD/Toxicity calculations during simulation.
 * Designed for single-pass application at each timepoint (no fragmentation).
 */
export class DDIEngine {
  /**
   * Apply PK-based DDI adjustments to compound concentrations
   * 
   * Modifies concentrations based on enzyme inhibition, induction, or protein binding displacement.
   * 
   * @param concentrations Map of compoundId → concentration (nM)
   * @param compounds Array of compound schemas
   * @param interactions Active DDI rules for this stack
   * @returns Adjusted concentrations
   */
  static applyPKInteractions(
    concentrations: Map<string, number>,
    compounds: ICompoundSchema[],
    interactions: IDrugDrugInteraction[]
  ): Map<string, number> {
    const adjusted = new Map(concentrations);
    
    interactions.forEach(ddi => {
      if (!ddi.effects.pk) return;
      
      const effect = ddi.effects.pk;
      const targetConc = adjusted.get(effect.affectedCompound);
      if (targetConc === undefined) return;
      
      switch (effect.type) {
        case 'EnzymeInhibition':
          // Enzyme inhibition → reduced metabolic clearance → higher concentration
          // First-order approximation: proportional to inhibition %
          // Example: 96% inhibition → ~1.96x concentration (simplified from full PBPK)
          if (effect.inhibitionPercent !== undefined) {
            const factor = 1 + (effect.inhibitionPercent / 100);
            adjusted.set(effect.affectedCompound, targetConc * factor);
          }
          break;
          
        case 'EnzymeInduction':
          // Enzyme induction → increased metabolic clearance → lower concentration
          // Not currently used but framework supports it
          break;
          
        case 'ProteinBindingDisplacement':
          // Displacement from SHBG → increased free fraction → higher effective concentration
          // Example: Proviron displaces Test → 1.3x free Test
          if (effect.shbgDisplacementFactor !== undefined) {
            adjusted.set(
              effect.affectedCompound,
              targetConc * effect.shbgDisplacementFactor
            );
          }
          break;
      }
    });
    
    return adjusted;
  }
  
  /**
   * Apply PD-based DDI adjustments to pathway activation
   * 
   * Modifies pathway effects for synergy, competition, or antagonism.
   * 
   * @param pathwayActivation Map of pathway → activation level
   * @param interactions Active DDI rules
   * @returns Adjusted pathway activation
   */
  static applyPDInteractions(
    pathwayActivation: Record<string, number>,
    interactions: IDrugDrugInteraction[]
  ): Record<string, number> {
    const adjusted = { ...pathwayActivation };
    
    interactions.forEach(ddi => {
      if (!ddi.effects.pd) return;
      
      const effect = ddi.effects.pd;
      if (adjusted[effect.pathway] !== undefined) {
        adjusted[effect.pathway] *= effect.multiplier;
      }
    });
    
    return adjusted;
  }
  
  /**
   * Apply toxicity-based DDI adjustments
   * 
   * Modifies organ toxicity for synergistic or protective interactions.
   * 
   * @param baseToxicity Map of organ → toxicity level
   * @param interactions Active DDI rules
   * @param doses Optional current doses for threshold-based effects
   * @returns Adjusted toxicity levels
   */
  static applyToxicityInteractions(
    baseToxicity: Record<string, number>,
    interactions: IDrugDrugInteraction[],
    doses?: Map<string, number>
  ): Record<string, number> {
    const adjusted = { ...baseToxicity };
    
    interactions.forEach(ddi => {
      if (!ddi.effects.toxicity) return;
      
      const effect = ddi.effects.toxicity;
      
      // Check dose threshold if specified
      if (effect.doseThreshold && doses) {
        const currentDose = doses.get(effect.doseThreshold.compound) || 0;
        if (currentDose < effect.doseThreshold.minDose) {
          return; // Skip this interaction if below threshold
        }
      }
      
      // Apply multiplier
      if (adjusted[effect.organ] !== undefined) {
        adjusted[effect.organ] *= effect.multiplier;
      }
    });
    
    return adjusted;
  }
}
