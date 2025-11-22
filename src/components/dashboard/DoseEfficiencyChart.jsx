import React, { useState, useMemo } from "react";
import {
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStack } from "../../context/StackContext";
import { COMPOUNDS as compoundData } from "../../data/compounds";
import { simulationService } from "../../engine/SimulationService";

const CHART_MARGIN = { top: 10, right: 20, bottom: 0, left: 20 };

const DURATION_OPTIONS = [8, 12, 16, 24];

const formatNumber = (value) => {
  if (!Number.isFinite(value)) return "--";
  return value.toFixed(1);
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;

  return (
    <div className="min-w-[180px] rounded-2xl border border-white/10 bg-[#05060A]/95 p-4 text-xs text-gray-200 backdrop-blur shadow-2xl">
      <div className="mb-2 border-b border-white/5 pb-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-gray-500">
          Week {Math.floor(point.day / 7)} <span className="text-gray-700">Day {Math.round(point.day)}</span>
        </p>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1 text-cyan-200">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> Anabolic
          </span>
          <span className="font-mono text-white">{formatNumber(point.anabolic)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1 text-rose-200">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-300" /> Toxicity
          </span>
          <span className="font-mono text-white">{formatNumber(point.toxicity)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-4 border-t border-white/5 pt-2">
          <span className="text-[10px] uppercase tracking-[0.35em] text-gray-500">Net Gap</span>
          <span className={`font-mono ${point.netGap >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {formatNumber(point.netGap)}
          </span>
        </div>
      </div>
    </div>
  );
};

const DoseEfficiencyChart = () => {
  const { stack, userProfile } = useStack();
  const [durationWeeks, setDurationWeeks] = useState(12);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    let isMounted = true;
    if (!stack || stack.length === 0) {
      setChartData([]);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const activeCompounds = stack.map(s => compoundData[s.compoundId || s.compound]).filter(Boolean);
        const currentStack = stack.map(s => ({ 
            compoundId: s.compoundId || s.compound, 
            dose: Number(s.dose || 0), 
            frequency: Number(s.frequency || 3.5) 
        }));

        const result = await simulationService.runStackSimulation(
            currentStack,
            activeCompounds,
            durationWeeks * 7,
            userProfile?.bodyweight || 85
        );

        if (isMounted && result.aggregate && result.aggregate.totalAnabolicLoad) {
            // Process data
            // The engine returns hourly points. We want daily points for the chart.
            const { totalAnabolicLoad, totalToxicity } = result.aggregate;
            
            const processed = totalAnabolicLoad
                .map((load, index) => {
                    // Only take every 24th point (Daily)
                    if (index % 24 !== 0) return null;
                    
                    const day = index / 24; // Convert hourly index to days
                    
                    // Calculate total toxicity at this point
                    const hepatic = totalToxicity.hepatic[index] || 0;
                    const renal = totalToxicity.renal[index] || 0;
                    const cv = totalToxicity.cardiovascular[index] || 0;
                    const lipid = totalToxicity.lipid_metabolism[index] || 0;
                    const neuro = totalToxicity.neurotoxicity[index] || 0;
                    
                    // Use average toxicity to keep scale similar to anabolic (0-100)
                    const systemicToxicity = (hepatic + renal + cv + lipid + neuro) / 5;
                    
                    return {
                        day: day,
                        anabolic: load,
                        toxicity: systemicToxicity * 2, // Scale up slightly for visibility
                        netGap: load - (systemicToxicity * 2)
                    };
                })
                .filter(Boolean); // Remove nulls

            setChartData(processed);
        } else {
             // Handle case where simulation returns no data
             console.warn("Simulation returned no aggregate data");
             setChartData([]);
        }
      } catch (err) {
        console.error("Simulation failed", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [stack, durationWeeks, userProfile]);

  // Calculate Max Y for domain
  const yMax = useMemo(() => {
    if (!chartData.length) return 100;
    let max = 0;
    chartData.forEach((p) => {
      max = Math.max(max, p.anabolic, p.toxicity);
    });
    return Math.max(10, max * 1.1);
  }, [chartData]);

  if (!stack.length) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#050608]">
        <div className="text-center text-sm text-gray-400">
          <p className="text-lg font-semibold text-white">Awaiting Compounds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#050608]">
      <header className="flex items-start justify-between border-b border-white/5 px-6 py-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-white">
            Dose Efficiency
          </h3>
          <p className="text-xs text-gray-500">
            Projected anabolic signal vs systemic toxicity over time.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
            {/* Duration Selector */}
            <div className="flex items-center rounded-lg bg-white/5 p-1">
                {DURATION_OPTIONS.map((weeks) => (
                    <button
                        key={weeks}
                        onClick={() => setDurationWeeks(weeks)}
                        className={`rounded-md px-3 py-1 text-[10px] font-medium transition-colors ${
                            durationWeeks === weeks
                                ? "bg-white/10 text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-300"
                        }`}
                    >
                        {weeks}W
                    </button>
                ))}
            </div>

            <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.3em] text-gray-400">
                    <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
                    <span>Anabolic</span>
                    </span>
                    <span className="h-px w-6 bg-white/10" />
                    <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-600/70" />
                    <span>Toxicity</span>
                    </span>
                </div>
            </div>
        </div>
      </header>

      <div className="relative flex-1 bg-gradient-to-b from-[#07090F] to-[#030305]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={CHART_MARGIN}
          >
            <CartesianGrid stroke="#333" strokeDasharray="3 3" opacity={0.15} vertical={false} />
            <XAxis
              dataKey="day"
              type="number"
              domain={[0, durationWeeks * 7]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 10 }}
              tickFormatter={(day) => `W${Math.floor(day / 7)}`}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis 
                hide 
                domain={[0, yMax]} 
            />
            
            <Tooltip
              cursor={{ stroke: "#ffffff", strokeDasharray: "3 3", opacity: 0.3 }}
              content={<CustomTooltip />}
            />

            <Line
              type="monotone"
              dataKey="toxicity"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={false}
              strokeOpacity={0.8}
              activeDot={{ r: 4, fill: "#f43f5e", strokeWidth: 0 }}
              animationDuration={1000}
            />
            <Line
              type="monotone"
              dataKey="anabolic"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
              strokeOpacity={1}
              activeDot={{ r: 4, fill: "#22d3ee", strokeWidth: 0 }}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DoseEfficiencyChart;
