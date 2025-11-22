import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStack } from "../../context/StackContext";
import { KineticSimulator } from "../../utils/KineticSimulator";
import { NormalizationEngine } from "../../utils/normalizationEngine";
import { CHART_COLORS, SIMULATION_DEFAULTS } from "../../data/constants";

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

const CycleEvolutionChart = ({ onTimeScrub }) => {
  const { stack } = useStack();
  const [playheadPosition, setPlayheadPosition] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const chartRef = React.useRef(null);

  const debouncedScrub = useDebouncedCallback(onTimeScrub);

  const [chartData, setChartData] = React.useState([]);

  // Generate Chart Data
  React.useEffect(() => {
    if (!stack.length) {
      setChartData([]);
      return;
    }

    // 1. Convert Stack to Doses
    // The stack context usually has { compoundId, dose, frequency, ester }
    // We need to expand this into daily doses for the simulator
    const doses = [];
    const duration = SIMULATION_DEFAULTS.DAYS;

    stack.forEach((item) => {
      const freq = item.frequency;
      const dose = parseFloat(item.dose) || 0;
      if (dose <= 0) return;

      // Handle both numeric (days between doses) and string (legacy) formats
      let interval = 1;
      if (typeof freq === 'number') {
        // Numeric frequency represents days between doses (e.g., 7 = weekly, 3.5 = twice weekly)
        interval = freq;
      } else if (typeof freq === 'string') {
        // Legacy string format
        if (freq === "eod") interval = 2;
        else if (freq === "twice_weekly") interval = 3.5;
        else if (freq === "weekly") interval = 7;
        else interval = 1; // daily default
      } else {
        interval = 1; // daily default
      }

      for (let day = 0; day < duration; day += interval) {
        doses.push({
          compoundId: item.compoundId,
          esterId: item.ester || "none", // default to none if missing
          doseMg: dose,
          day: Math.floor(day),
        });
      }
    });

    // 2. Run Simulation
    const timeline = KineticSimulator.simulateCycle(doses, duration);

    // 3. Normalize
    const normalized = NormalizationEngine.normalizeTimeline(timeline);

    setChartData(normalized);
  }, [stack]);

  const updatePlayheadPosition = (event) => {
    if (!chartRef.current) return;
    const clientX =
      event?.clientX ??
      event?.touches?.[0]?.clientX ??
      event?.changedTouches?.[0]?.clientX;
    if (typeof clientX !== "number") return;

    const rect = chartRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const chartWidth = Math.max(rect.width - 40, 1); // Adjust for padding
    const relativeX = Math.max(0, Math.min(1, x / chartWidth));
    const domainDay = SIMULATION_DEFAULTS.DAYS;
    const dayPosition = relativeX * domainDay;
    setPlayheadPosition(dayPosition);

    if (onTimeScrub && chartData.length) {
      const closest = chartData.reduce((acc, point) =>
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

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-[#050507] p-4">
      <div className="relative z-10 mb-4 flex flex-wrap items-center justify-between gap-4 text-[10px] uppercase tracking-[0.35em] text-[#9ca3af]">
        <div className="flex flex-col gap-1 text-white">
          <span className="text-sm font-bold tracking-wide">Cycle Evolution</span>
          <span className="text-[10px] text-[#9ca3af]">Benefit vs Risk</span>
        </div>
        <div className="flex gap-4 text-[#9ca3af]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS.anabolic }} />
            <span>Anabolic</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS.toxicity }} />
            <span>Toxicity</span>
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
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorBenefit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.anabolic} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.anabolic} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.toxicity} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.toxicity} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#27272A" strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis
              dataKey="day"
              type="number"
              domain={[0, SIMULATION_DEFAULTS.DAYS]}
              tickFormatter={formatWeekTick}
              stroke="#52525B"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            {/* Dual Axis: Left for Benefit (Log), Right for Risk (Linear) */}
            <YAxis yAxisId="left" hide domain={[0, 'auto']} />
            <YAxis yAxisId="right" orientation="right" hide domain={[0, 'auto']} />
            
            <Tooltip
              cursor={{ stroke: "#3B82F6", strokeDasharray: "4 4" }}
              contentStyle={{
                backgroundColor: "#18181B",
                borderColor: "#27272A",
                borderRadius: "0.5rem",
                fontSize: "12px"
              }}
              labelFormatter={(value) => `Day ${value}`}
              formatter={(val, name) => [
                typeof val === 'number' ? val.toFixed(2) : val, 
                name === "benefitScore" ? "Benefit Score" : "Risk Score"
              ]}
            />

            <Area
              yAxisId="left"
              type="monotone"
              dataKey="benefitScore"
              stroke={CHART_COLORS.anabolic}
              fill="url(#colorBenefit)"
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="riskScore"
              stroke={CHART_COLORS.toxicity}
              fill="url(#colorRisk)"
              strokeWidth={2}
              isAnimationActive={false}
            />

            {playheadPosition !== null && (
              <ReferenceLine
                yAxisId="left"
                x={playheadPosition}
                stroke="#3B82F6"
                strokeWidth={1.5}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CycleEvolutionChart;
