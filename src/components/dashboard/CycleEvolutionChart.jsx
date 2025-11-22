import React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStack } from "../../context/StackContext";
import { getGeneticProfileConfig } from "../../utils/personalization";
import { COMPOUNDS as compoundData } from "../../data/compounds";
import { simulationService } from "../../engine/SimulationService";

const useDebouncedCallback = (callback, delay = 75) => {
  const timeoutRef = React.useRef(null);

  const debounced = React.useCallback((...args) => {
    if (!callback) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);

  React.useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return debounced;
};

const formatWeekTick = (value) => {
  const week = Math.floor(value / 7);
  return `W${week}`;
};

const sanitizeNumber = (value, fallback = 0) => (Number.isFinite(value) ? value : fallback);

const CycleEvolutionChart = ({ onTimeScrub }) => {
  const { stack, userProfile } = useStack();
  const { metabolismMultiplier } = getGeneticProfileConfig(userProfile);
  const [playheadPosition, setPlayheadPosition] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const chartRef = React.useRef(null);
  const releaseCacheRef = React.useRef(new Map());

  const debouncedScrub = useDebouncedCallback(onTimeScrub);

  const [evolutionData, setEvolutionData] = React.useState([]);
  const [releaseData, setReleaseData] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const CHART_DURATION_DAYS = 168; // 24 weeks

  const stackSignature = React.useMemo(() => {
    if (!stack.length) return "empty";
    return stack
      .map(({ compoundId, dose, frequency, ester }) =>
        [compoundId, dose, frequency ?? "", ester ?? ""].join(":"),
      )
      .join("|");
  }, [stack]);

  const toxicityVelocity = React.useMemo(() => {
    let velocity = 0.01; // Base biological drift (1% per week)

    stack.forEach((item) => {
      const comp = compoundData[item.compoundId];
      if (!comp) return;

      // 1. Baseline Compound Stress (Tier based)
      // Default Injectables to Tier 1, Orals to Tier 2 if undefined
      const defaultTier = comp.metadata?.administrationRoutes?.includes("Oral") ? 2 : 1;
      // const tier = comp.toxicityTier ?? defaultTier; // Need to map this from new schema if available, or infer
      const tier = defaultTier; // Simplified for now
      velocity += tier * 0.01;

      // 2. Specific Organ Stressors
      if (comp.toxicity?.renal) velocity += 0.03; 
      if (comp.toxicity?.hepatic) velocity += 0.03;

      // 3. Neurotoxicity (CNS stress accumulation)
      if (comp.toxicity?.neurotoxicity) velocity += 0.01;
    });

    return velocity;
  }, [stack]);

  const releaseKey = React.useMemo(
    () => `${stackSignature}|${CHART_DURATION_DAYS}|${metabolismMultiplier}`,
    [stackSignature, CHART_DURATION_DAYS, metabolismMultiplier],
  );

  React.useEffect(() => {
    let isMounted = true;
    if (!stack.length) {
        setEvolutionData([]);
        setReleaseData([]);
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
                durationDays: CHART_DURATION_DAYS
            });

            if (isMounted && result.serumLevels) {
                const simulated = result.serumLevels.map(point => ({
                    ...point,
                    day: point.t,
                    total: point.totalConcentration
                }));
                setReleaseData(simulated);

                // Calculate evolution data
                const steadyStateBenefit = result.aggregateBenefit || 0;
                const finalRisk = result.aggregateToxicity || 0;
                const maxSystemicLoad = simulated.reduce(
                    (max, point) => Math.max(max, point.total),
                    0,
                );

                const downsampleStep = 6; 
                const dailyPoints = [];

                for (let i = 0; i < simulated.length; i += downsampleStep) {
                    const point = simulated[i];
                    const loadRatio = maxSystemicLoad > 0 ? point.total / maxSystemicLoad : 0;
                    const week = point.day / 7;

                    const toxicityDrift = 1 + (week * toxicityVelocity);
                    const fatigueFactor = Math.max(0.5, 1 - (week * 0.015));

                    dailyPoints.push({
                        day: point.day,
                        week,
                        benefit: steadyStateBenefit * loadRatio * fatigueFactor,
                        risk: finalRisk * loadRatio * toxicityDrift,
                        loadRatio,
                    });
                }
                setEvolutionData(dailyPoints);
            }
        } catch (err) {
            console.error("Simulation failed", err);
        } finally {
            if (isMounted) setIsLoading(false);
        }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [releaseKey, stack, userProfile, metabolismMultiplier, toxicityVelocity]);

  const updatePlayheadPosition = (event) => {
    if (!chartRef.current) return;
    const clientX =
      event?.clientX ??
      event?.touches?.[0]?.clientX ??
      event?.changedTouches?.[0]?.clientX;
    if (typeof clientX !== "number") return;

    const rect = chartRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const chartWidth = Math.max(rect.width - 40, 1);
    const relativeX = Math.max(0, Math.min(1, x / chartWidth));
    const domainDay = releaseData.length ? releaseData[releaseData.length - 1].day : steadyStateDays;
    const dayPosition = relativeX * domainDay;
    setPlayheadPosition(dayPosition);

    if (onTimeScrub && evolutionData.length) {
      const closest = evolutionData.reduce((acc, point) =>
        Math.abs(point.day - dayPosition) < Math.abs(acc.day - dayPosition) ? point : acc,
      );
      debouncedScrub(closest);
    }
  };

  const handleMouseDown = (event) => {
    if (!chartRef.current) return;
    setIsDragging(true);
    updatePlayheadPosition(event);
  };

  const handleMouseMove = (event) => {
    if (isDragging) updatePlayheadPosition(event);
  };

  const handleMouseUp = () => setIsDragging(false);

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

  const maxBenefit = evolutionData.reduce((max, point) => Math.max(max, point.benefit), 0);
  const maxRisk = evolutionData.reduce((max, point) => Math.max(max, point.risk), 0);
  const yMax = Math.max(10, Math.max(maxBenefit, maxRisk) * 1.2);
  const domainMaxDay = releaseData.length ? releaseData[releaseData.length - 1].day : CHART_DURATION_DAYS;
  const adaptationMarker = 120; // Fixed for now or calculate from steady state logic if needed

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-[#050507] p-4">
      <div className="relative z-10 mb-4 flex flex-wrap items-center justify-between gap-4 text-[10px] uppercase tracking-[0.35em] text-[#9ca3af]">
        <div className="flex flex-col gap-1 text-white">
          <span className="text-sm font-bold tracking-wide">Cycle Evolution</span>
          <span className="text-[10px] text-[#9ca3af]">Benefit & Risk over Time</span>
        </div>
        <div className="flex gap-4 text-[#9ca3af]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
            <span>Anabolic</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
            <span>Risk</span>
          </div>
        </div>
      </div>

      <div ref={chartRef} className="flex-1 min-h-0">
        <ResponsiveContainer
          width="100%"
          height="100%"
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          <LineChart
            data={evolutionData}
            margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
          >
            <CartesianGrid stroke="#27272A" strokeDasharray="3 3" opacity={0.25} />
            <XAxis
              dataKey="day"
              type="number"
              domain={[0, domainMaxDay || 1]}
              tickFormatter={formatWeekTick}
              stroke="#4b5563"
              tickLine={false}
              axisLine={false}
              padding={{ left: 20, right: 20 }}
            />
            <YAxis hide domain={[0, yMax]} />
            <Tooltip
              cursor={{ stroke: "#3B82F6", strokeDasharray: "4 4" }}
              contentStyle={{
                backgroundColor: "#111113",
                borderColor: "#27272A",
                borderRadius: "0.75rem",
              }}
              labelFormatter={(value) => `Day ${value.toFixed(0)}`}
              formatter={(val, name) => [`${val.toFixed(2)}`, name === "benefit" ? "Benefit" : "Risk"]}
            />

            <Line
              type="monotone"
              dataKey="benefit"
              name="Benefit"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="risk"
              name="Risk"
              stroke="#EF4444"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />

            {adaptationMarker > 0 && (
              <ReferenceLine
                x={adaptationMarker}
                stroke="#F97316"
                strokeDasharray="3 3"
                label={{
                  value: "Steady State",
                  position: "insideTopRight",
                  fill: "#F97316",
                  fontSize: 10,
                }}
              />
            )}

            {playheadPosition !== null && (
              <ReferenceLine
                x={playheadPosition}
                stroke="#3B82F6"
                strokeWidth={1.5}
                label={{
                  value: `Day ${Math.round(playheadPosition)}`,
                  position: "insideTopRight",
                  fill: "#60A5FA",
                  fontSize: 10,
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CycleEvolutionChart;
