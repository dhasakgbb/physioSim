import React, { useMemo, useCallback } from "react";
import ActiveSchematic from "./ActiveSchematic";
import { COMPOUNDS as compoundData } from "../../data/compounds";
import { simulationService } from "../../engine/SimulationService";
import { useStack } from "../../context/StackContext";
import { useSimulation } from "../../context/SimulationContext";
import { getGeneticProfileConfig } from "../../utils/personalization";
import { calculateSaturation } from "../../engine/SaturationPhysics";
import { calculateReceptorState } from "../../engine/ReceptorPhysics";
const useDebouncedCallback = (callback, delay = 60) => {
  const timeoutRef = React.useRef(null);

  const debounced = React.useCallback((...args) => {
    if (!callback) return;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => callback(...args), delay);
  }, [callback, delay]);

  React.useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);

  return debounced;
};

const SerumStabilityChart = ({ onTimeScrub }) => {
  const { stack, userProfile } = useStack();
  const { compounds } = useSimulation();
  // const stack = compounds; // REMOVED: Was overriding the actual stack with simulation definitions
  const { metabolismMultiplier } = getGeneticProfileConfig(userProfile);
  const [playheadPosition, setPlayheadPosition] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const chartRef = React.useRef(null);
  // const serumCacheRef = React.useRef(new Map());

  const debouncedScrub = useDebouncedCallback(onTimeScrub, 75);

  const [data, setData] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const steadyStateDays = 120; // Default or calculated

  const stackSignature = useMemo(() => {
    if (!stack.length) return "empty";
    return stack
      .map((item) =>
        [item.compound || item.compoundId, item.dose, item.frequency ?? "", item.ester ?? ""].join(":"),
      )
      .join("|");
  }, [stack]);

  const serumKey = useMemo(
    () => `${stackSignature}|${metabolismMultiplier}|${steadyStateDays}`,
    [stackSignature, metabolismMultiplier, steadyStateDays],
  );

  React.useEffect(() => {
    let isMounted = true;
    if (!stack.length) {
      setData([]);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const activeCompounds = stack.map(s => compoundData[s.compound || s.compoundId]).filter(Boolean);
        const currentStack = stack.map(s => ({ 
          compoundId: s.compound || s.compoundId, 
          dose: s.dose, 
          frequency: s.frequency,
          ester: s.ester 
        }));
        
        const result = await simulationService.runSimulation({
           stack: currentStack,
           compounds: activeCompounds,
           userProfile,
           durationDays: steadyStateDays
        });

        if (isMounted && result.serumLevels) {
           // Process data for chart
           const processed = result.serumLevels.map(point => {
             const next = { ...point, day: point.t, total: point.totalConcentration };
             // Map compound concentrations
             Object.keys(point.concentrations).forEach(cid => {
               next[cid] = point.concentrations[cid];
             });
             return next;
           });
           setData(processed);
        }
      } catch (err) {
        console.error("Simulation failed", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, [serumKey, stack, userProfile, metabolismMultiplier]);

  // Handle playhead interactions
  const handleMouseDown = (event) => {
    if (!chartRef.current) return;
    setIsDragging(true);
    updatePlayheadPosition(event);
  };

  const handleMouseMove = (event) => {
    if (isDragging) {
      updatePlayheadPosition(event);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updatePlayheadPosition = (event) => {
    if (!chartRef.current) return;

    const clientX =
      event?.clientX ??
      event?.touches?.[0]?.clientX ??
      event?.changedTouches?.[0]?.clientX;
    if (typeof clientX !== "number") return;

    const rect = chartRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const chartWidth = rect.width - 40; // Account for margins
    const relativeX = Math.max(0, Math.min(1, x / chartWidth));

    const span = data.length ? data[data.length - 1].day : steadyStateDays;
    const dayPosition = relativeX * span;

    setPlayheadPosition(dayPosition);

    // Call the callback to update Virtual Phlebotomist
    if (onTimeScrub && data.length) {
      // Find the closest data point
      const closestPoint = data.reduce((closest, point) => {
        return Math.abs(point.day - dayPosition) < Math.abs(closest.day - dayPosition)
          ? point
          : closest;
      });
      debouncedScrub(closestPoint);
    }
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleMouseMove);
      document.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleMouseMove);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  // Calculate Stability Score (using total variance)
  const stabilityScore = useMemo(() => {
    if (data.length === 0) return 0;
    const levels = data.slice(data.length / 2).map((d) => d.total);
    const min = Math.min(...levels);
    const max = Math.max(...levels);
    if (max === 0) return 100;
    const variance = ((max - min) / max) * 100;
    return (100 - variance).toFixed(0);
  }, [data]);

  // Check for Orals to adjust resolution
  const hasOrals = useMemo(() => {
    return stack.some((item) => compoundData[item.compound || item.compoundId]?.metadata?.administrationRoutes?.includes("Oral"));
  }, [stack]);

  // Compute receptor metrics based on current stack and compound data
  // Uses the new Saturation & Spillover physics engine
  const computeReceptorMetrics = useCallback((stack, weeksElapsed = 0) => {
    const baseCapacity = 100; // baseline AR capacity in mg (adjustable)
    let load = 0;
    let totalDose = 0;
    
    // Calculate active dose adjusted by binding affinity
    // Normalized to Testosterone Equivalents (mg/day)
    // Test Kd ~ 1.0 nM. If Compound Kd = 0.5, it binds 2x stronger.
    const TEST_KD = 1.0; 
    
    stack.forEach((item) => {
      // Handle both legacy and new stack item structures
      const compoundId = item.compound || item.compoundId;
      const meta = compoundData[compoundId];
      const arInteraction = meta?.pd?.receptorInteractions?.AR;
      
      // Normalize dose to mg/day
      // NEW: frequency is stored as numeric days in the store (1 = daily, 3.5 = E3.5D, 7 = weekly)
      // Legacy: frequency might be a string ('Weekly', 'Daily', 'EOD')
      let dailyDose = item.dose;
      
      if (typeof item.frequency === 'number') {
        // New format: frequency in days, dose is total weekly dose
        dailyDose = item.dose / 7;
      } else if (typeof item.frequency === 'string') {
        // Legacy format: string frequency
        if (item.frequency === 'Weekly') dailyDose = item.dose / 7;
        if (item.frequency === 'EOD') dailyDose = item.dose / 2;
        // 'Daily' is already /1
      }
      
      if (arInteraction && arInteraction.Kd) {
        // Weight = Test_Kd / Compound_Kd
        // e.g. Tren (Kd 0.3) => 1.0 / 0.3 = 3.33x weight
        const affinityWeight = TEST_KD / arInteraction.Kd;
        load += dailyDose * affinityWeight;
      } else {
        // Fallback for non-binding or unknown (e.g. GH)
        // Don't add to AR load if it doesn't bind AR
      }
      totalDose += dailyDose;
    });
    
    // Base Capacity in mg/day of Testosterone Equivalents
    // Natural production ~7mg/day. 
    // "Saturation" (diminishing returns) often cited around 300-500mg/week => ~50-70mg/day.
    // Let's set a generous "Sports" baseline of 150mg/day.
    const dailyCapacity = 150; 
    
    // Use the new saturation physics engine
    const saturationMetrics = calculateSaturation(load, dailyCapacity, weeksElapsed);
    
    // Use the new competitive displacement engine
    // Pass the raw stack items which have { compoundId, dose, frequency }
    const receptorState = calculateReceptorState(stack, dailyCapacity);

    return {
      ...saturationMetrics,
      receptorState,
      totalDose, 
    };
  }, []);

  // Memoize metrics for performance
  // TODO: Calculate weeksElapsed from simulation data if available
  const saturationMetrics = useMemo(
    () => {
      try {
        console.log("Computing receptor metrics for stack:", stack);
        const metrics = computeReceptorMetrics(stack, 0);
        console.log("Computed metrics:", metrics);
        return metrics;
      } catch (err) {
        console.error("Error computing receptor metrics:", err);
        return {
          activeDose: 0,
          receptorCapacity: 100,
          saturation: 0,
          spillover: 0,
          efficiencyPct: 100,
          adaptationRate: 0,
          adaptationPhase: 1,
          spilloverToCNS: 0,
          spilloverToToxicity: 0,
          spilloverToRetention: 0,
          isSaturated: false,
          isHardCap: false,
          totalDose: 0
        };
      }
    },
    [stack, computeReceptorMetrics]
  );

  return (
    <ActiveSchematic 
      activeDose={saturationMetrics.activeDose}
      geneticCapacity={saturationMetrics.receptorCapacity}
      saturationMetrics={saturationMetrics}
      receptorState={saturationMetrics?.receptorState}
    />
  );
};

export default SerumStabilityChart;
