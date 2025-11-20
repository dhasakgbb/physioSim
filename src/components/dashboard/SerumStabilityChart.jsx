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

<<<<<<< HEAD
import { simulateSerum } from "../../utils/pharmacokinetics";
=======
const getAbsorptionRate = (ester, type) => {
  // ka (absorption rate constant) approximations
  // Lower ka = Slower absorption = Slower ramp up
  // Previous values were too high, causing instant spikes.

  if (type === "oral") return 2.0; // Peaks in ~2-3 hours
  if (!ester) return 0.1; // Default injectable

  const slug = ester.toLowerCase();

  // Fast Esters (Prop, Ace) -> Peak ~12-18h
  if (slug.includes("prop") || slug.includes("ace")) return 0.1;

  // Medium Esters (Enanthate, Cyp) -> Peak ~24-36h
  if (slug.includes("enanth") || slug.includes("cyp")) return 0.05;

  // Slow Esters (Decanoate, Undec) -> Peak ~48-72h
  if (slug.includes("dec") || slug.includes("undec")) return 0.03;

  // Suspension -> Very Fast but not instant
  if (slug.includes("susp")) return 1.5;

  return 0.05;
};

const simulateSerum = (stack) => {
  const hoursTotal = 28 * 24;
  const dataPoints = [];

  // State tracking for numerical simulation
  let activeLevels = {};
  let depotLevels = {}; // Track oil sitting in muscle

  stack.forEach((c) => {
    activeLevels[c.compound] = 0;
    depotLevels[c.compound] = 0;
  });

  for (let hour = 0; hour <= hoursTotal; hour += 4) {
    let totalSystemicLoad = 0;
    let point = { hour, day: (hour / 24).toFixed(1) };

    stack.forEach((item) => {
      const meta = compoundData[item.compound];
      if (!meta) return;

      const hl = meta.halfLife || 24;
      const isOral = meta.type === "oral";

      // 1. INJECTION EVENT
      // Calculate interval in hours based on frequency (days between pins)
      // Note: item.frequency comes from ActiveStackRail as "Days Interval" (1=ED, 3.5=2x/Wk)
      const intervalDays = item.frequency || 1;
      const intervalHours = intervalDays * 24;

      // Check if injection happens this hour
      // We use a tolerance of 4 hours (one step)
      if (hour % Math.round(intervalHours) < 4) {
        // Calculate dose per pin
        let dosePerPin;
        if (isOral) {
          // For Orals, item.dose is "mg/day" (Dose per administration)
          // We inject the full pill dose at each interval
          dosePerPin = item.dose;
        } else {
          // For Injectables, item.dose is "mg/week" (Total Weekly Dose)
          // We inject a fraction based on frequency: WeeklyDose * (DaysInterval / 7)
          dosePerPin = item.dose * (intervalDays / 7);
        }

        depotLevels[item.compound] += dosePerPin;
      }

      // 2. ABSORPTION: Transfer from Depot to Active
      // Orals absorb instantly (gut). Injectables absorb from depot.
      // We use the helper function to get ester-specific rates.
      const esterKey = item.ester || meta.defaultEster;
      const esterName = meta.esters?.[esterKey]?.slug || esterKey;
      
      let absorptionRate;
      if (isOral) {
        absorptionRate = 0.8; // Fast gut absorption
      } else {
        // Use the helper function for accurate ester kinetics
        absorptionRate = getAbsorptionRate(esterName, meta.type);
      }

      const absorbed = depotLevels[item.compound] * absorptionRate;
      depotLevels[item.compound] -= absorbed;
      activeLevels[item.compound] += absorbed;

      // 3. ELIMINATION: Decay the Active
      // Decay factor for 4 hours: 0.5 ^ (4 / hl)
      const decayFactor = Math.pow(0.5, 4 / hl);
      activeLevels[item.compound] *= decayFactor;

      point[item.compound] = activeLevels[item.compound];
      totalSystemicLoad += activeLevels[item.compound];
    });

    point.total = totalSystemicLoad;
    dataPoints.push(point);
  }
  return dataPoints;
};
>>>>>>> 214304dbd217fafbaf27b2476fe628bc176d213b

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
            <YAxis hide />

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
