import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useSimulationStore } from '../../store/simulationStore';

// Generate distinct colors for compounds
const COMPOUND_COLORS = [
  '#22d3ee', // Cyan
  '#f472b6', // Pink
  '#a78bfa', // Violet
  '#34d399', // Emerald
  '#fbbf24', // Amber
  '#f87171', // Red
  '#60a5fa', // Blue
];

const SerumConcentrationChart = () => {
  const { simulationResults, stack, isSimulating } = useSimulationStore();

  const { data, compoundKeys } = useMemo(() => {
    if (!simulationResults?.timePoints || !stack.length) return { data: [], compoundKeys: [] };

    const keys = stack.map(item => item.compound);
    const uniqueKeys = [...new Set(keys)];

    const chartData = simulationResults.timePoints.map((tp) => {
      const point = { time: tp.time };
      uniqueKeys.forEach(key => {
        // Sum up concentrations if multiple instances of same compound? 
        // The engine returns 'activeConcentrations' keyed by compound ID usually?
        // Let's check the engine output structure. 
        // In Pharmacokinetics.ts, we return 'totalConcentration' per compound if we aggregate.
        // But simulation.worker.ts aggregates into `activeConcentrations: Record<string, number>` (nM).
        point[key] = tp.pk.activeConcentrations[key] || 0;
      });
      return point;
    });

    return { data: chartData, compoundKeys: uniqueKeys };
  }, [simulationResults, stack]);

  if (isSimulating) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-white/5 bg-[#050608]">
        <div className="text-sm text-gray-400">Simulating...</div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-white/5 bg-[#050608]">
        <div className="text-sm text-gray-400">No simulation data available</div>
      </div>
    );
  }

  return (
    <div className="flex h-80 flex-col rounded-2xl border border-white/5 bg-[#050608] p-4">
      <h3 className="mb-4 text-sm font-semibold text-white">Serum Concentration (nM)</h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
            <XAxis 
              dataKey="time" 
              stroke="#6b7280" 
              fontSize={10} 
              tickFormatter={(val) => `Day ${Math.round(val)}`}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={10} 
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#050608', borderColor: '#333', color: '#fff' }}
              itemStyle={{ fontSize: '12px' }}
              labelStyle={{ color: '#9ca3af', marginBottom: '5px' }}
              formatter={(value) => [`${Number(value).toFixed(2)} nM`, '']}
              labelFormatter={(label) => `Day ${Math.round(label)}`}
            />
            <Legend iconType="plainline" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            
            {compoundKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COMPOUND_COLORS[index % COMPOUND_COLORS.length]}
                strokeWidth={2}
                dot={false}
                name={key.charAt(0).toUpperCase() + key.slice(1)}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SerumConcentrationChart;
