import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCyclePhysics } from '../../hooks/useCyclePhysics';

const formatWeekTick = (value: number) => {
  const week = Math.floor(value / 7);
  return `W${week}`;
};

const CyclePhysicsChart: React.FC = () => {
  const { chartData, optimalExitWeek, cycleStats, isSimulating } = useCyclePhysics();

  if (!isSimulating || chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-white/5 bg-[#050507] p-4">
        <p className="text-sm text-gray-500">Add compounds to visualize cycle physics</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col overflow-hidden rounded-3xl border border-white/5 bg-[#050507] p-4 h-[600px]">
      {/* Header */}
      <div className="relative z-10 mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1 text-white">
          <span className="text-sm font-bold tracking-wide">Cycle Physics Engine</span>
          <span className="text-[10px] text-[#9ca3af]">
            Genomic vs Non-Genomic vs Toxicity
          </span>
        </div>
        
        {/* Stats */}
        <div className="flex gap-4 text-[10px] text-[#9ca3af]">
          <div>
            <span className="text-white font-semibold">
              {cycleStats.finalMass.toFixed(0)}
            </span>{' '}
            Total Mass
          </div>
          <div>
            <span className="text-white font-semibold">
              {cycleStats.avgStability}%
            </span>{' '}
            Stability
          </div>
          {optimalExitWeek !== null && (
            <div>
              <span className="text-yellow-400 font-semibold">W{optimalExitWeek}</span>{' '}
              Exit Vector
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-2 text-[10px] uppercase tracking-wider text-[#9ca3af]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span>Genomic Tissue</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <span>Total Mass</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span>Toxicity</span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorGenomic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorMass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorToxicity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              stroke="#27272A" 
              strokeDasharray="3 3" 
              opacity={0.2} 
              vertical={false} 
            />
            
            <XAxis
              dataKey="day"
              type="number"
              domain={[0, 112]}
              tickFormatter={formatWeekTick}
              stroke="#52525B"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            
            <YAxis
              stroke="#52525B"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181B',
                borderColor: '#27272A',
                borderRadius: '0.5rem',
                fontSize: '12px',
              }}
              labelFormatter={(value) => `Day ${value}`}
              formatter={(value: any, name: string) => {
                const displayName = 
                  name === 'genomicTissue' ? 'Genomic Tissue' :
                  name === 'totalMass' ? 'Total Mass' :
                  name === 'toxicity' ? 'Toxicity' :
                  name === 'serumTotal' ? 'Serum' : name;
                return [typeof value === 'number' ? value.toFixed(1) : value, displayName];
              }}
            />

            {/* Genomic Tissue (Green) */}
            <Area
              type="monotone"
              dataKey="genomicTissue"
              stroke="#10B981"
              fill="url(#colorGenomic)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
            />

            {/* Total Mass (Indigo/Blue) */}
            <Area
              type="monotone"
              dataKey="totalMass"
              stroke="#3B82F6"
              fill="url(#colorMass)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
            />

            {/* Toxicity (Red) */}
            <Area
              type="monotone"
              dataKey="toxicity"
              stroke="#EF4444"
              fill="url(#colorToxicity)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
            />

            {/* Optimal Exit Marker */}
            {optimalExitWeek !== null && (
              <ReferenceLine
                x={optimalExitWeek * 7}
                stroke="#FCD34D"
                strokeWidth={2}
                strokeDasharray="4 4"
                label={{
                  value: 'Exit',
                  position: 'top',
                  fill: '#FCD34D',
                  fontSize: 10,
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CyclePhysicsChart;
