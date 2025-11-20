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
} from "recharts";
import { compoundData } from "../../data/compoundData";
import { simulateSerum } from "../../utils/pharmacokinetics";

const SerumStabilityChart = ({ stack }) => {
  const data = useMemo(() => simulateSerum(stack), [stack]);

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

  const serumTicks = useMemo(() => {
    if (!data.length) return [0, 100];
    const maxVal = Math.max(...data.map((d) => d.total));
    // Log scale ticks
    return [1, 10, 50, 100, 250, 500, 1000, 2000, 5000].filter(t => t <= maxVal * 1.5);
  }, [data]);

  return (
    <div className="absolute inset-0 flex flex-col bg-physio-bg-core">
      <div className="flex items-center justify-between px-6 py-4 border-b border-physio-border-subtle z-10 bg-physio-bg-surface/80 backdrop-blur">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-bold text-physio-text-primary uppercase tracking-wider">
            Serum Stability Simulator
          </h3>
          <p className="text-xs text-physio-text-tertiary hidden lg:block">
            Visualizing release rates based on half-lives and injection
            frequency
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs uppercase text-physio-text-tertiary">
            Stability Score
          </span>
          <span
            className={`text-sm font-mono font-bold ${
              Number(stabilityScore) > 85
                ? "text-physio-accent-success"
                : Number(stabilityScore) > 60
                  ? "text-physio-accent-warning"
                  : "text-physio-accent-critical"
            }`}
          >
            {stabilityScore}%
          </span>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 relative pb-12">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              opacity={0.15}
              vertical={false}
            />
            <XAxis
              dataKey="day"
              stroke="#4b5563"
              fontSize={12}
              tickFormatter={(val) => `Day ${Math.floor(val)}`}
              interval={48}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              scale="log"
              domain={['auto', 'auto']}
              ticks={serumTicks}
              stroke="#4b5563"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}mg`}
              width={50}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#111827",
                borderColor: "#374151",
                borderRadius: "0.5rem",
              }}
              itemStyle={{ fontSize: "12px" }}
              labelStyle={{
                color: "#9ca3af",
                fontSize: "11px",
                marginBottom: "5px",
              }}
              formatter={(value) => `${value.toFixed(0)} mg`}
              labelFormatter={(val) => `Day ${val}`}
            />

            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px" }}
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
              stroke="#ffffff"
              strokeWidth={1}
              strokeDasharray="3 3"
              strokeOpacity={0.3}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Educational Footer - Absolute positioned at bottom */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-3 bg-physio-bg-surface/90 backdrop-blur border-t border-physio-border-subtle flex gap-4 overflow-x-auto z-10">
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
