import React, { useMemo } from "react";
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
import { compoundData } from "../../data/compoundData";
import { simulateSerum, getSteadyStateDurationDays } from "../../utils/pharmacokinetics";
import { useStack } from "../../context/StackContext";
import { useSimulation } from "../../context/SimulationContext";
import { getGeneticProfileConfig } from "../../utils/personalization";

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
  const serumCacheRef = React.useRef(new Map());

  const debouncedScrub = useDebouncedCallback(onTimeScrub, 75);

  const stackSignature = useMemo(() => {
    if (!stack.length) return "empty";
    return stack
      .map(({ compound, dose, frequency, ester }) =>
        [compound, dose, frequency ?? "", ester ?? ""].join(":"),
      )
      .join("|");
  }, [stack]);

  const steadyStateDays = useMemo(
    () => getSteadyStateDurationDays(stack),
    [stack],
  );

  const serumKey = useMemo(
    () => `${stackSignature}|${metabolismMultiplier}|${steadyStateDays}`,
    [stackSignature, metabolismMultiplier, steadyStateDays],
  );

  const data = useMemo(() => {
    if (!stack.length) return [];
    const cache = serumCacheRef.current;
    if (cache.has(serumKey)) return cache.get(serumKey);

    const simulated = simulateSerum(stack, { metabolismMultiplier, durationDays: steadyStateDays }) || [];
    const sanitized = simulated
      .map((point) => ({
        ...point,
        day: Number.isFinite(point.day) ? point.day : 0,
        total: Number.isFinite(point.total) ? point.total : 0,
      }))
      .sort((a, b) => a.day - b.day);
    cache.set(serumKey, sanitized);
    return sanitized;
  }, [stack, metabolismMultiplier, serumKey, steadyStateDays]);

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
    return stack.some((item) => compoundData[item.compound]?.type === "oral");
  }, [stack]);

  return (
    <div className="flex flex-col h-full relative">
      {/* Chart Canvas - Edge to Edge */}
      <div className="flex-1 w-full min-h-0 relative">
        <div className="absolute top-4 left-6 right-6 z-10 flex items-center justify-between text-[10px] uppercase tracking-[0.4em] text-[#9ca3af]">
          <span>Serum Stability</span>
          <span>Stability Score {stabilityScore}%</span>
        </div>
        <ResponsiveContainer
          width="100%"
          height="100%"
          ref={chartRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <LineChart
            data={data}
            margin={{ top: 60, right: 30, left: 30, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#3F3F46"
              opacity={0.2}
              vertical={false}
            />
            <XAxis
              dataKey="day"
              stroke="#52525b"
              fontSize={12}
              tickFormatter={(val) => `Day ${Math.floor(val)}`}
              interval={hasOrals ? 0 : 6} // Daily ticks for orals, Weekly for injectables
              tickLine={false}
              axisLine={false}
              domain={[0, data.length ? data[data.length - 1].day : steadyStateDays || 1]}
            />
            <YAxis hide />

            <Tooltip
              contentStyle={{
                backgroundColor: "#27272A",
                borderColor: "#3F3F46",
                borderRadius: "0.5rem",
              }}
              itemStyle={{ fontSize: "12px" }}
              labelStyle={{
                color: "#A1A1AA",
                fontSize: "11px",
                marginBottom: "5px",
              }}
              formatter={(value) => `${value.toFixed(0)} mg`}
              labelFormatter={(val) => `Day ${val}`}
            />

            {/* Render a Line for every compound in the stack */}
            {stack.map((item) => {
              const meta = compoundData[item.compound];
              return (
                <Line
                  key={item.compound}
                  type="monotone"
                  dataKey={item.compound}
                  name={meta.name}
                  stroke={meta.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                  isAnimationActive={false}
                />
              );
            })}

            {/* Total Load Line (Subtle background context) */}
            <Line
              type="monotone"
              dataKey="total"
              name="Total Load"
              stroke="#E4E4E7"
              strokeWidth={1}
              strokeDasharray="3 3"
              strokeOpacity={0.3}
              dot={false}
              isAnimationActive={false}
            />

            {/* Interactive Playhead */}
            {playheadPosition !== null && (
              <ReferenceLine
                x={playheadPosition}
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDasharray="none"
                label={{
                  value: `Day ${Math.round(playheadPosition)}`,
                  position: "topRight",
                  fill: "#3B82F6",
                  fontSize: 10,
                  offset: 10
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Educational Footer - Absolute positioned at bottom */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-3 bg-physio-bg-surface/90 backdrop-blur flex gap-4 overflow-x-auto z-10">
        {stack.map((item) => {
          const meta = compoundData[item.compound];
          return (
            <div
              key={item.compound}
              className="flex items-center gap-2 text-xs text-physio-text-secondary whitespace-nowrap"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
              <span>{meta.name}:</span>
              <span className="font-mono text-physio-text-primary">
                {item.frequency === 1
                  ? "Stable (ED)"
                  : item.frequency === 2
                    ? "Variable (EOD)"
                    : "Fluctuating"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SerumStabilityChart;
