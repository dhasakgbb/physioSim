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
import { useSimulation } from "../../context/SimulationContext";
import { getGeneticProfileConfig } from "../../utils/personalization";
import { simulateSerum } from "../../utils/pharmacokinetics";
import { evaluateStack } from "../../utils/stackEngine";

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
  const { cycleDuration = 12 } = useSimulation();
  const { metabolismMultiplier } = getGeneticProfileConfig(userProfile);
  const [playheadPosition, setPlayheadPosition] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const chartRef = React.useRef(null);
  const releaseCacheRef = React.useRef(new Map());

  const debouncedScrub = useDebouncedCallback(onTimeScrub);

  const stackSignature = React.useMemo(() => {
    if (!stack.length) return "empty";
    return stack
      .map(({ compound, dose, frequency, ester }) =>
        [compound, dose, frequency ?? "", ester ?? ""].join(":"),
      )
      .join("|");
  }, [stack]);

  const releaseKey = React.useMemo(
    () => `${stackSignature}|${cycleDuration}|${metabolismMultiplier}`,
    [stackSignature, cycleDuration, metabolismMultiplier],
  );

  const releaseData = React.useMemo(() => {
    if (!stack.length) return [];
    const cache = releaseCacheRef.current;
    if (cache.has(releaseKey)) return cache.get(releaseKey);
    const simulated = simulateSerum(stack, cycleDuration, { metabolismMultiplier }) || [];
    const sorted = simulated
      .map((point) => ({
        ...point,
        day: sanitizeNumber(point.day, 0),
        total: sanitizeNumber(point.total, 0),
      }))
      .sort((a, b) => a.day - b.day);
    cache.set(releaseKey, sorted);
    return sorted;
  }, [stack, cycleDuration, metabolismMultiplier, releaseKey]);

  const evolutionData = React.useMemo(() => {
    if (!stack.length || !releaseData.length) return [];
    const baseResult = evaluateStack({
      stackInput: stack,
      profile: userProfile,
      durationWeeks: cycleDuration,
    });

    const steadyStateBenefit = sanitizeNumber(baseResult.totals.totalBenefit, 0);
    const finalRisk = sanitizeNumber(baseResult.totals.totalRisk, 0);

    const totalWeeklyDose = stack.reduce((sum, item) => {
      const isOral =
        item.compound === "dianabol" ||
        item.compound === "anadrol" ||
        item.compound === "winstrol" ||
        item.compound === "anavar" ||
        item.compound === "turinabol" ||
        item.compound === "proviron" ||
        item.compound === "halotestin" ||
        item.compound === "superdrol";
      return sum + (isOral ? item.dose * 7 : item.dose);
    }, 0);

    const finalTimePenalty = cycleDuration > 8 ? Math.pow(cycleDuration / 8, 1.5) : 1;
    const baseRisk = finalTimePenalty > 0 ? finalRisk / finalTimePenalty : finalRisk;

    const downsampleStep = 6; // every 24h if simulateSerum resolves 4h steps
    const dailyPoints = [];

    for (let i = 0; i < releaseData.length; i += downsampleStep) {
      const point = releaseData[i];
      const loadRatio = totalWeeklyDose > 0 ? point.total / totalWeeklyDose : 0;
      const week = point.day / 7;
      const timePenalty = week > 8 ? Math.pow(week / 8, 1.5) : 1;

      dailyPoints.push({
        day: point.day,
        week,
        benefit: steadyStateBenefit * loadRatio,
        risk: baseRisk * loadRatio * timePenalty,
        loadRatio,
      });
    }

    return dailyPoints;
  }, [stack, releaseData, userProfile, cycleDuration]);

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
    const maxDay = cycleDuration * 7;
    const dayPosition = relativeX * maxDay;
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
              domain={[0, cycleDuration * 7]}
              tickFormatter={formatWeekTick}
              stroke="#4b5563"
              tickLine={false}
              axisLine={false}
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

            <ReferenceLine
              x={8 * 7}
              stroke="#F97316"
              strokeDasharray="3 3"
              label={{
                value: "Adaptation Wall",
                position: "insideTopRight",
                fill: "#F97316",
                fontSize: 10,
              }}
            />

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
