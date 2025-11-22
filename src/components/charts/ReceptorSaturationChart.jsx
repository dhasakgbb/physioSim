import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useSimulationStore } from '../../store/simulationStore';

const COLORS = {
  AR: '#06b6d4', // Cyan
  ER_alpha: '#ec4899', // Pink
  PR: '#8b5cf6', // Violet
  GR: '#f59e0b', // Amber
};

const ReceptorSaturationChart = () => {
  const { simulationResults, isSimulating } = useSimulationStore();

  const data = useMemo(() => {
    if (!simulationResults?.timePoints) return [];

    // Downsample for performance if needed, but Recharts handles ~100-200 points okay.
    // Assuming simulation returns daily points or similar.
    return simulationResults.timePoints.map((tp) => ({
      time: tp.time,
      AR: tp.pd.receptorOccupancy.AR || 0,
      ER_alpha: tp.pd.receptorOccupancy.ER_alpha || 0,
      PR: tp.pd.receptorOccupancy.PR || 0,
      GR: tp.pd.receptorOccupancy.GR || 0,
    }));
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
      <h3 className="mb-4 text-sm font-semibold text-white">Receptor Saturation (%)</h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAR" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.AR} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.AR} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorER" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.ER_alpha} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.ER_alpha} stopOpacity={0} />
              </linearGradient>
            </defs>
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
              domain={[0, 100]} 
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#050608', borderColor: '#333', color: '#fff' }}
              itemStyle={{ fontSize: '12px' }}
              labelStyle={{ color: '#9ca3af', marginBottom: '5px' }}
              formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Occupancy']}
              labelFormatter={(label) => `Day ${Math.round(label)}`}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            
            <Area
              type="monotone"
              dataKey="AR"
              stroke={COLORS.AR}
              fillOpacity={1}
              fill="url(#colorAR)"
              name="Androgen Receptor"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="ER_alpha"
              stroke={COLORS.ER_alpha}
              fillOpacity={1}
              fill="url(#colorER)"
              name="Estrogen Receptor"
              strokeWidth={2}
            />
            {/* Add PR/GR only if relevant/nonzero to avoid clutter? For now, keep simple. */}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ReceptorSaturationChart;
