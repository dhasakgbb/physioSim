import { COMPOUNDS } from '../data/compounds';
// @ts-ignore
import { SIMULATION_DEFAULTS } from '../data/constants';

export interface IDoseEntry {
  compoundId: string;
  esterId: string;
  doseMg: number;
  day: number;
}

export interface IDailyState {
  day: number;
  totalReleasedMg: number;
  activeCompounds: Record<string, number>; // compoundId -> released mg
  totalAnabolicLoad: number; // Weighted by potency
  totalToxicityLoad: number; // Weighted by toxicity
}

export class KineticSimulator {
  private static calculateK(halfLifeHours: number): number {
    // k = ln(2) / t1/2
    // We work in days for the simulation loop, so convert hours to days
    const halfLifeDays = halfLifeHours / 24;
    if (halfLifeDays <= 0) return 100; // Instant release
    return Math.log(2) / halfLifeDays;
  }

  public static simulateCycle(doses: IDoseEntry[], durationDays: number = SIMULATION_DEFAULTS.DAYS): IDailyState[] {
    const timeline: IDailyState[] = [];
    
    // Track depots for each specific dose: { compoundId, esterId, remainingMg, k }
    let activeDepots: { 
      compoundId: string; 
      esterId: string; 
      remainingMg: number; 
      k: number; 
      potency: number;
      toxicity: number;
    }[] = [];

    for (let day = 0; day <= durationDays; day++) {
      // 1. Add new doses for today
      const todaysDoses = doses.filter(d => d.day === day);
      todaysDoses.forEach(dose => {
        const compound = COMPOUNDS[dose.compoundId];
        if (!compound || !compound.pk) return;

        const ester = compound.pk.esters ? compound.pk.esters[dose.esterId] : undefined;
        
        let halfLifeHours = 24; // Default fallback
        let molecularWeightRatio = 1.0;

        if (ester) {
            if (ester.releaseHalfLife_Hours) {
                halfLifeHours = ester.releaseHalfLife_Hours;
            } else {
                 // Fallback logic for common esters if specific data missing
                 switch(ester.id) {
                     case 'acetate': halfLifeHours = 24 * 3; break;
                     case 'propionate': halfLifeHours = 24 * 3.5; break;
                     case 'phenylpropionate': halfLifeHours = 24 * 4.5; break;
                     case 'enanthate': halfLifeHours = 24 * 10.5; break;
                     case 'cypionate': halfLifeHours = 24 * 12; break;
                     case 'decanoate': halfLifeHours = 24 * 15; break;
                     case 'undecanoate': halfLifeHours = 24 * 30; break;
                     case 'undecylenate': halfLifeHours = 24 * 14; break;
                     default: halfLifeHours = 24; 
                 }
            }
            molecularWeightRatio = ester.molecularWeightRatio || 0.8;
        } else {
            // No ester (suspension/oral)
            // Orals usually have short half lives (hours)
            // If it's an oral, we might want to use the compound's CL to estimate, 
            // but for this simplified depot model, let's assume a short half-life like 8-12h
            halfLifeHours = 12; 
        }

        const k = this.calculateK(halfLifeHours);
        
        // Adjust dose for ester weight
        const activeMg = dose.doseMg * molecularWeightRatio;

        activeDepots.push({
          compoundId: dose.compoundId,
          esterId: dose.esterId,
          remainingMg: activeMg,
          k: k,
          potency: compound.metadata.basePotency || 1.0,
          toxicity: compound.metadata.baseToxicity || 1.0
        });
      });

      // 2. Calculate Release for Today
      const dailyState: IDailyState = {
        day,
        totalReleasedMg: 0,
        activeCompounds: {},
        totalAnabolicLoad: 0,
        totalToxicityLoad: 0
      };

      // Iterate backwards to allow removal
      for (let i = activeDepots.length - 1; i >= 0; i--) {
        const depot = activeDepots[i];
        
        // Depot Accumulation Model: Released = CurrentDepot * (1 - exp(-k))
        // This is the amount released *into the system* today.
        const releasedToday = depot.remainingMg * (1 - Math.exp(-depot.k));
        
        // Update depot
        depot.remainingMg -= releasedToday;

        // Accumulate stats
        dailyState.totalReleasedMg += releasedToday;
        
        if (!dailyState.activeCompounds[depot.compoundId]) {
            dailyState.activeCompounds[depot.compoundId] = 0;
        }
        dailyState.activeCompounds[depot.compoundId] += releasedToday;

        dailyState.totalAnabolicLoad += releasedToday * depot.potency;
        dailyState.totalToxicityLoad += releasedToday * depot.toxicity;

        // Cleanup empty depots
        if (depot.remainingMg < SIMULATION_DEFAULTS.DEPOT_CLEARANCE_THRESHOLD) {
          activeDepots.splice(i, 1);
        }
      }

      timeline.push(dailyState);
    }

    return timeline;
  }
}
