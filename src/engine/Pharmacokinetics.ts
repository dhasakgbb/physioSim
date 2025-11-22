import { ICompoundSchema, IPharmacokinetics } from '../types/physio';
import { oneCompartmentFirstOrderAbsorption, oneCompartmentIVBolus, convertMgLToNM } from './math';

export interface ISimulationPoint {
  time: number; // hours
  concentrationMgL: number; // mg/L
  concentrationNM: number; // nM
}

export class PharmacokineticsEngine {
  /**
   * Calculates the concentration profile for a single administration of a compound.
   * 
   * @param compound The compound definition
   * @param doseMg The dose in mg
   * @param timePoints Array of time points (hours) to simulate
   * @param bodyWeightKg Patient body weight in kg (default 80)
   * @returns Array of simulation points
   */
  static simulateSingleDose(
    compound: ICompoundSchema,
    doseMg: number,
    timePoints: number[],
    bodyWeightKg: number = 80
  ): ISimulationPoint[] {
    const pk = compound.pk;
    const Vd_L = pk.Vd * bodyWeightKg; // Total Volume of Distribution in L
    
    // CL is in mL/min/kg. Convert to L/h.
    // (mL/min/kg * kg * 60) / 1000 = L/h
    const CL_L_h = (pk.CL * bodyWeightKg * 60) / 1000;
    
    const kel = CL_L_h / Vd_L; // Elimination rate constant (1/h)

    // Determine absorption model
    // For now, assume simple oral or IM first order if Ka is present, else IV
    // TODO: Handle esters and complex absorption models
    
    let ka = 0;
    let F = 1;
    let isIV = false;

    // Simple heuristic for route selection based on available data
    // In reality, the dose object should specify the route.
    // Assuming Oral if oral absorption data exists, otherwise check for ester/IM logic.
    // For this MVP engine, let's look at the 'absorption' block.
    
    if (pk.absorption.oral) {
      ka = pk.absorption.oral.Ka;
      F = pk.absorption.oral.F;
    } else {
      // Fallback to IV or assume instantaneous absorption for now if no other data
      // Real implementation needs to handle the 'esters' logic for IM depots
      isIV = true;
    }

    return timePoints.map(t => {
      let concentrationMgL = 0;
      
      if (isIV) {
        concentrationMgL = oneCompartmentIVBolus(t, doseMg, kel, Vd_L);
      } else {
        concentrationMgL = oneCompartmentFirstOrderAbsorption(t, doseMg, F, ka, kel, Vd_L);
      }

      const concentrationNM = convertMgLToNM(concentrationMgL, compound.metadata.chemicalProperties.molecularWeight);

      return {
        time: t,
        concentrationMgL,
        concentrationNM
      };
    });
  }

  /**
   * Superimposes multiple doses (linear superposition principle).
   * 
   * @param compound The compound definition
   * @param doses Array of { time: number, amount: number } (time in hours, amount in mg)
   * @param timePoints Array of time points to simulate
   * @param bodyWeightKg Patient body weight
   */
  static simulateMultiDose(
    compound: ICompoundSchema,
    doses: { time: number; amount: number }[],
    timePoints: number[],
    bodyWeightKg: number = 80
  ): ISimulationPoint[] {
    // Initialize result array with zeros
    const totalConcentration = new Array(timePoints.length).fill(0);

    doses.forEach(dose => {
      // For each dose, calculate its contribution to all future time points
      // We can optimize this by only calculating for t > dose.time
      const relevantTimePoints = timePoints.filter(t => t >= dose.time);
      const relativeTimePoints = relevantTimePoints.map(t => t - dose.time);
      
      const singleDoseProfile = PharmacokineticsEngine.simulateSingleDose(
        compound,
        dose.amount,
        relativeTimePoints,
        bodyWeightKg
      );

      // Add to total
      // Find the starting index in the main timePoints array
      const startIndex = timePoints.indexOf(relevantTimePoints[0]);
      
      singleDoseProfile.forEach((point, i) => {
        if (startIndex + i < totalConcentration.length) {
          totalConcentration[startIndex + i] += point.concentrationMgL;
        }
      });
    });

    return timePoints.map((t, i) => {
      const concentrationMgL = totalConcentration[i];
      const concentrationNM = convertMgLToNM(concentrationMgL, compound.metadata.chemicalProperties.molecularWeight);
      return {
        time: t,
        concentrationMgL,
        concentrationNM
      };
    });
  }
}
