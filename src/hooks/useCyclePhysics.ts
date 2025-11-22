import { useMemo } from 'react';
import { runSimulation, findOptimalExitWeek, StackItem, UserProfile, DailyDataPoint } from '../engine/CyclePhysicsEngine';
import { useStack } from '../context/StackContext';
import { COMPOUNDS } from '../data/compounds';

/**
 * React hook for Cycle Physics Engine
 * 
 * Memoizes simulation results to prevent unnecessary recalculations.
 * Recalculates only when stack or user profile changes.
 */
export const useCyclePhysics = (userProfile?: UserProfile) => {
  const { stack } = useStack();
  
  // Default user profile if none provided
  const profile: UserProfile = useMemo(() => ({
    lbm_lbs: userProfile?.lbm_lbs || 150, // ~170lb male at 15% BF
    liverResilience: userProfile?.liverResilience || 1.0,
    bodyWeightKg: userProfile?.bodyWeightKg || 80
  }), [userProfile]);
  
  // Convert stack format to CyclePhysicsEngine StackItem format
  const physicsStack: StackItem[] = useMemo(() => {
    if (!stack || stack.length === 0) return [];
    
    return stack.map((item: any) => {
      // Extract compound ID (could be item.compound or item.compoundId)
      const compoundId = item.compound || item.compoundId;
      if (!compoundId) return null;
      
      // Get compound from database to check if oral
      const compound = COMPOUNDS[compoundId];
      const isOral = compound?.metadata?.administrationRoutes?.includes('Oral') || false;
      
      return {
        compoundId,
        doseMg: parseFloat(item.dose) || 0,
        frequency: typeof item.frequency === 'number' ? item.frequency : 
                   item.frequency === 'weekly' ? 7 :
                   item.frequency === 'twice_weekly' ? 3.5 :
                   item.frequency === 'eod' ? 2 : 1,
        isOral,
        ester: item.ester || undefined
      };
    }).filter((item): item is StackItem => item !== null && item.doseMg > 0);
  }, [stack]);
  
  // Run simulation (memoized)
  const chartData: DailyDataPoint[] = useMemo(() => {
    if (physicsStack.length === 0) return [];
    const result = runSimulation(physicsStack, profile);
    return result;
  }, [physicsStack, profile]);
  
  // Calculate optimal exit week (memoized)
  const optimalExitWeek = useMemo(() => {
    if (chartData.length === 0) return null;
    return findOptimalExitWeek(chartData);
  }, [chartData]);
  
  // Calculate current stats at the end of the cycle
  const cycleStats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        finalTissue: 0,
        finalMass: 0,
        finalToxicity: 0,
        peakSerum: 0,
        avgStability: 0
      };
    }
    
    const finalDay = chartData[chartData.length - 1];
    const peakSerum = Math.max(...chartData.map(d => d.serumTotal));
    const avgStability = chartData.reduce((sum, d) => sum + d.stabilityScore, 0) / chartData.length;
    
    return {
      finalTissue: finalDay.genomicTissue,
      finalMass: finalDay.totalMass,
      finalToxicity: finalDay.toxicity,
      peakSerum,
      avgStability: Math.round(avgStability)
    };
  }, [chartData]);
  
  return {
    chartData,
    optimalExitWeek,
    cycleStats,
    isSimulating: physicsStack.length > 0
  };
};
