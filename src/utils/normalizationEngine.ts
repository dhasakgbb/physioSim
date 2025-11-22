import { IDailyState } from './KineticSimulator';

export interface INormalizedPoint {
  day: number;
  benefitScore: number; // Logarithmic
  riskScore: number;    // Linear
  efficiency: number;   // Benefit / Risk
}

export class NormalizationEngine {
  public static normalizeTimeline(timeline: IDailyState[]): INormalizedPoint[] {
    return timeline.map(point => {
      // Benefit: Logarithmic scaling to represent diminishing returns
      // log10(x + 1) ensures 0 input = 0 output
      const benefitScore = Math.log10(point.totalAnabolicLoad + 1);
      
      // Risk: Linear scaling based on toxicity load
      const riskScore = point.totalToxicityLoad;

      // Efficiency: Benefit per unit of Risk
      // Avoid division by zero
      const efficiency = riskScore > 0.1 ? (benefitScore * 100) / riskScore : 0; 
      // * 100 to make efficiency a more readable number (e.g. 0.5 vs 0.005)

      return {
        day: point.day,
        benefitScore,
        riskScore,
        efficiency
      };
    });
  }
}
