import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { MAX_PHENOTYPE_SCORE } from '../../data/constants';
import { COLORS } from '../../utils/theme';

const OutcomeRadar = ({ metrics }) => {
  // Fallback if phenotype data is missing (prevents crash before engine update)
  const phenotype = metrics?.totals?.phenotype || { hypertrophy: 0, strength: 0, endurance: 0, conditioning: 0 };

  // 1. THE GOOGLE STANDARD: Locked Domain
  // We fix the outer edge to 35. This creates a permanent frame of reference.
  const MAX_SCORE = MAX_PHENOTYPE_SCORE;

  const data = [
    { subject: 'Hypertrophy', A: phenotype.hypertrophy, fullMark: MAX_SCORE },
    { subject: 'Strength', A: phenotype.strength, fullMark: MAX_SCORE },
    { subject: 'Endurance', A: Math.max(0, phenotype.endurance), fullMark: MAX_SCORE },
    { subject: 'Conditioning', A: phenotype.conditioning, fullMark: MAX_SCORE },
  ];

  // 2. Contextual Tooltip (The "Insight" Layer)
  const CustomRadarTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const val = payload[0].value;
    
    let tier = "Natural / TRT";
    let tierColor = "text-physio-text-tertiary";
    
    if (val > 28) { tier = "IFBB Pro / Elite"; tierColor = "text-physio-accent-primary"; }
    else if (val > 20) { tier = "Advanced Athlete"; tierColor = "text-physio-accent-success"; }
    else if (val > 10) { tier = "Enhanced"; tierColor = "text-physio-accent-warning"; }
    
    return (
      <div className="bg-physio-bg-surface/95 backdrop-blur-md border border-physio-border-strong p-3 rounded-lg shadow-xl z-50">
        <p className="text-xs uppercase text-physio-text-tertiary mb-1">{payload[0].name}</p>
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-mono font-bold text-physio-text-primary">{val.toFixed(1)}</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider border px-1.5 py-0.5 rounded ${tierColor} border-physio-border-subtle`}>
            {tier}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-physio-bg-core">
      <div className="flex items-center justify-between px-6 py-4 border-b border-physio-border-subtle z-10 bg-physio-bg-surface/80 backdrop-blur">
        <h3 className="text-sm font-bold text-physio-text-primary uppercase tracking-wider">
          Phenotype Profiler
        </h3>
        <p className="text-xs text-physio-text-tertiary">
          Physiological adaptation vectors
        </p>
      </div>

      <div className="flex-1 w-full min-h-0 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="90%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke={COLORS.grid} strokeOpacity={0.3} />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 'bold' }} 
            />
            
            {/* THE SCALE LOCK */}
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, MAX_SCORE]} 
              tick={false} 
              axisLine={false} 
            />

            <Radar
              name="Score"
              dataKey="A"
              stroke={COLORS.benefit}
              strokeWidth={3}
              fill={COLORS.benefit}
              fillOpacity={0.4}
              isAnimationActive={false}
            />
            <Tooltip content={<CustomRadarTooltip />} />
          </RadarChart>
        </ResponsiveContainer>

        {/* Visual Legend (The "Map Key") */}
        <div className="absolute bottom-4 left-6 text-[10px] text-physio-text-tertiary flex flex-col gap-1 opacity-50 pointer-events-none">
           <div className="flex items-center gap-2">
             <div className="w-2 h-px bg-gray-600"></div>
             <span>Outer Edge: Genetic Limit</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-2 h-px bg-gray-600"></div>
             <span>Center: Baseline</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default OutcomeRadar;
