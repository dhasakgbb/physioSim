import React, { useMemo, useCallback } from "react";
import ActiveSchematic from "./ActiveSchematic";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { COMPOUNDS as compoundData } from "../../data/compounds";
import { simulationService } from "../../engine/SimulationService";
import { useStack } from "../../context/StackContext";
import { useSimulation } from "../../context/SimulationContext";
import { getGeneticProfileConfig } from "../../utils/personalization";
import { calculateSaturation } from "../../engine/SaturationPhysics";
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
  const { userProfile } = useStack();
  const { compounds } = useSimulation();
  const stack = compounds;
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
      .map(({ compoundId, dose, frequency, ester }) =>
        [compoundId, dose, frequency ?? "", ester ?? ""].join(":"),
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
        const activeCompounds = stack.map(s => compoundData[s.compoundId]).filter(Boolean);
        const currentStack = stack.map(s => ({ compoundId: s.compoundId, dose: s.dose, frequency: s.frequency }));
        
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
    return stack.some((item) => compoundData[item.compoundId]?.metadata?.administrationRoutes?.includes("Oral"));
  }, [stack]);

  // Compute receptor metrics based on current stack and compound data
  // Uses the new Saturation & Spillover physics engine
  const computeReceptorMetrics = useCallback((stack, weeksElapsed = 0) => {
    const baseCapacity = 100; // baseline AR capacity in mg (adjustable)
    let load = 0;
    let totalDose = 0;
    
    // Calculate active dose adjusted by binding affinity
    stack.forEach((item) => {
      const meta = compoundData[item.compoundId];
      const arInteraction = meta?.pd?.receptorInteractions?.AR;
      if (arInteraction && arInteraction.Kd) {
        const affinity = 1 / arInteraction.Kd; // higher affinity => larger weight
        load += item.dose * affinity;
      }
      totalDose += item.dose;
    });
    
    // Use the new saturation physics engine
    const saturationMetrics = calculateSaturation(load, baseCapacity, weeksElapsed);
    
    return {
      ...saturationMetrics,
      totalDose, // Keep for reference
    };
  }, []);

  // Memoize metrics for performance
  // TODO: Calculate weeksElapsed from simulation data if available
  const saturationMetrics = useMemo(
    () => computeReceptorMetrics(stack, 0), // Start with 0 weeks, can be enhanced later
    [stack, computeReceptorMetrics]
  );

  return (
    <ActiveSchematic 
      activeDose={saturationMetrics.activeDose}
      geneticCapacity={saturationMetrics.receptorCapacity}
      saturationMetrics={saturationMetrics}
    />
  );
};

export default SerumStabilityChart;
