import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const OutcomeRadar = ({ metrics }) => {
  const { phenotype } = metrics.totals;

  // Format data for Recharts
  const data = [
    { subject: 'Hypertrophy', A: phenotype.hypertrophy, fullMark: 20 },
    { subject: 'Strength', A: phenotype.strength, fullMark: 20 },
    { subject: 'Endurance', A: Math.max(0, phenotype.endurance), fullMark: 20 }, // Clamp negative endurance
    { subject: 'Conditioning', A: phenotype.conditioning, fullMark: 20 },
  ];

  return (
    <div className="absolute inset-0 flex flex-col bg-physio-bg-core">
      <div className="flex items-center justify-between px-6 py-3 border-b border-physio-border-subtle z-10 bg-physio-bg-surface/80 backdrop-blur">
        <h3 className="text-xs font-bold text-physio-text-primary uppercase tracking-wider">
          Phenotype Profiler
        </h3>
        <p className="text-[10px] text-physio-text-tertiary">
          Projected physiological adaptations
        </p>
      </div>

      <div className="flex-1 w-full min-h-0 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="90%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#374151" strokeOpacity={0.5} />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }} 
            />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} hide />
            <Radar
              name="Stack Profile"
              dataKey="A"
              stroke="#10b981"
              strokeWidth={3}
              fill="#10b981"
              fillOpacity={0.3}
              isAnimationActive={false}
            />
            <Tooltip 
               contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem' }}
               itemStyle={{ color: '#10b981' }}
            />
          </RadarChart>
        </ResponsiveContainer>

        {/* Contextual Badge */}
        <div className="absolute bottom-4 right-6">
           <div className="px-3 py-2 bg-physio-bg-surface border border-physio-border-subtle rounded-lg">
             <span className="text-[10px] text-physio-text-tertiary block mb-1">Primary Phenotype</span>
             <span className="text-sm font-bold text-physio-text-primary uppercase tracking-widest">
               {getDominantTrait(phenotype)}
             </span>
           </div>
        </div>
      </div>
    </div>
  );
};

// Helper to label the user (Gamification)
const getDominantTrait = (p) => {
  const max = Math.max(p.hypertrophy, p.strength, p.endurance, p.conditioning);
  if (max === 0) return "Baseline";
  if (max === p.hypertrophy) return "Mass Monster";
  if (max === p.strength) return "Powerlifter";
  if (max === p.endurance) return "Endurance Athlete";
  return "Contest Prep";
};

export default OutcomeRadar;
