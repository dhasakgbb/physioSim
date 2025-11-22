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

  /**
   * Simulates pharmacokinetics using a step-wise iterative approach to model accumulation.
   * This assumes that for long esters, the release rate from the depot approximates the active serum load.
   * 
   * @param compound The compound definition
   * @param doses Array of { time: number, amount: number } (time in hours, amount in mg)
   * @param timePoints Array of time points to simulate (hours)
   * @param bodyWeightKg Patient body weight
   */
  static simulateIterative(
    compound: ICompoundSchema,
    doses: { time: number; amount: number; esterId?: string }[],
    timePoints: number[],
    bodyWeightKg: number = 80
  ): ISimulationPoint[] {
    // Determine elimination rate constant (k)
    let k = 0.1; // Default fallback
    
    // Try to find the specific ester used in the doses
    // We assume all doses for a compound use the same ester for now
    const esterId = doses[0]?.esterId;
    let selectedEster = null;

    if (esterId && compound.pk.esters && compound.pk.esters[esterId]) {
      selectedEster = compound.pk.esters[esterId];
    } else if (compound.pk.esters) {
      // Fallback to first ester if not specified or not found
      selectedEster = Object.values(compound.pk.esters)[0];
    }
    
    if (selectedEster && selectedEster.parameters && selectedEster.parameters.Ka) {
      k = selectedEster.parameters.Ka;
    } else if (compound.pk.absorption.oral) {
       const Vd_L = compound.pk.Vd * bodyWeightKg;
       const CL_L_h = (compound.pk.CL * bodyWeightKg * 60) / 1000;
       k = CL_L_h / Vd_L;
    }

    // Initialize state
    let currentDepot = 0;
    
    const result: ISimulationPoint[] = [];
    
    // Sort doses by time
    const sortedDoses = [...doses].sort((a, b) => a.time - b.time);
    let doseIndex = 0;
    
    const maxTime = Math.max(...timePoints);
    const step = 1; // 1 hour
    
    for (let t = 0; t <= maxTime; t += step) {
      // 1. INJECTION (Add to Depot)
      while (doseIndex < sortedDoses.length && sortedDoses[doseIndex].time <= t) {
        currentDepot += sortedDoses[doseIndex].amount;
        doseIndex++;
      }
      
      // 2. RELEASE (Depot -> Serum)
      // k is in 1/hour (assumed from Ka)
      const released = currentDepot * (1 - Math.exp(-k * step));
      currentDepot -= released;
      
      // 3. ACCUMULATION
      // Calculate steady state concentration: Rate / CL
      const CL_L_h = (compound.pk.CL * bodyWeightKg * 60) / 1000;
      const concentrationMgL = (released / step) / CL_L_h;
      
      const concentrationNM = convertMgLToNM(concentrationMgL, compound.metadata.chemicalProperties.molecularWeight);
      
      if (timePoints.includes(t)) {
        result.push({
          time: t,
          concentrationMgL,
          concentrationNM
        });
      }
    }
    
    return result;
  }
}
