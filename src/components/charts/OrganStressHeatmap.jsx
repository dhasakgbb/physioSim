import React, { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { useSimulationStore } from '../../store/simulationStore';

const OrganStressHeatmap = () => {
  const { simulationResults, isSimulating } = useSimulationStore();

  const data = useMemo(() => {
    if (!simulationResults?.totals?.toxicity) return [];

    const tox = simulationResults.totals.toxicity;
    
    // Transform into Radar chart format
    // Normalize to 0-100 scale? Or raw values?
    // Let's assume raw values but cap them visually or just show them.
    // Toxicity values in the engine are arbitrary units (0-100+).
    
    return [
      { subject: 'Liver', A: tox.hepatic || 0, fullMark: 100 },
      { subject: 'Kidney', A: tox.renal || 0, fullMark: 100 },
      { subject: 'Heart', A: tox.cardiovascular || 0, fullMark: 100 },
      { subject: 'Lipids', A: tox.lipid_metabolism || 0, fullMark: 100 },
      { subject: 'CNS', A: tox.neurotoxicity || 0, fullMark: 100 },
    ];
  }, [simulationResults]);

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
      <h3 className="mb-4 text-sm font-semibold text-white">Organ Stress Profile</h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#333" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Stress Level"
              dataKey="A"
              stroke="#f43f5e"
              strokeWidth={2}
              fill="#f43f5e"
              fillOpacity={0.3}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#050608', borderColor: '#333', color: '#fff' }}
              itemStyle={{ color: '#f43f5e' }}
              formatter={(value) => [Number(value).toFixed(1), 'Stress Index']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OrganStressHeatmap;
