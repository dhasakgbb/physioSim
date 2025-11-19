import React, { useMemo } from 'react';
import { 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  ReferenceArea 
} from 'recharts';
import { evaluateStack } from '../../utils/stackEngine';
import { defaultProfile } from '../../utils/personalization';
import { compoundData } from '../../data/compoundData';
import { COLORS } from '../../utils/theme';

const CustomTooltip = ({ active, payload, label, crossover }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const isProfitable = data.net > 0;
  const isSaturated = data.saturation > 0.85;
  const isWasted = crossover !== null && data.percent > crossover;
  const penaltyPct = Math.round((1 - (data.benefit / (data.benefit / (data.saturationPenalty || 1)))) * 100);

  return (
    <div className={`backdrop-blur-md border p-4 rounded-xl shadow-2xl min-w-[240px] transition-colors duration-300 ${isWasted ? 'bg-physio-accent-critical/10 border-physio-accent-critical/50' : 'bg-physio-bg-surface/95 border-physio-border-strong'}`}>
      <p className="text-xs uppercase tracking-widest text-physio-text-tertiary mb-2">
        Stack Intensity: <span className="text-physio-text-primary font-bold">{label}%</span>
      </p>
      
      {isWasted ? (
        <div className="mb-3 p-2 bg-physio-accent-critical/20 rounded border border-physio-accent-critical/30">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🛑</span>
            <span className="text-xs font-bold text-physio-accent-critical uppercase tracking-wider">Wasted Zone</span>
          </div>
          <p className="text-xs text-physio-text-primary leading-tight">
            Every mg added here reduces net growth. Risk exceeds benefit.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-physio-accent-success font-medium">Anabolic Signal</span>
            <span className="text-sm font-mono font-bold text-physio-text-primary">{data.benefit.toFixed(2)}</span>
          </div>
          
          {/* NEW: Show the "Bypass" Bonus if significant */}
          {data.nonGenomicBenefit > 0.5 && (
            <div className="flex justify-between items-center pl-2 border-l-2 border-physio-accent-secondary/30">
              <span className="text-[10px] text-physio-text-secondary">↳ Pathway Bypass</span>
              <span className="text-[10px] font-mono text-physio-accent-secondary">+{data.nonGenomicBenefit.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-physio-accent-critical font-medium">Systemic Cost</span>
            <span className="text-sm font-mono font-bold text-physio-text-primary">{data.risk.toFixed(2)}</span>
          </div>
          <div className="h-px bg-physio-border-subtle my-1" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-physio-text-secondary">Net Efficiency</span>
            <span className={`text-sm font-mono font-bold ${isProfitable ? 'text-physio-accent-cyan' : 'text-physio-accent-warning'}`}>
              {data.net > 0 ? '+' : ''}{data.net.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {isSaturated && !isWasted && (
        <div className="mt-3 py-1.5 px-2 bg-physio-accent-warning/10 border border-physio-accent-warning/20 rounded text-xs text-physio-accent-warning flex items-center gap-1.5">
          <span className="text-sm">⚠️</span> Diminishing Returns (Saturated)
        </div>
      )}

      {data.saturationPenalty < 0.9 && (
        <div className="mt-1 text-[10px] text-physio-text-tertiary">
          Potential wasted: -{penaltyPct}% (Receptor Saturation)
        </div>
      )}
    </div>
  );
};

const NetEffectChart = ({ stack, userProfile = defaultProfile }) => {
  // 1. Generate Projection Data
  const { data, crossover } = useMemo(() => {
    if (stack.length === 0) return { data: [], crossover: null };

    const points = [];
    let foundCrossover = null;
    
    // Sweep from 0% to 150% Intensity
    for (let percent = 0; percent <= 150; percent += 5) {
      const scalar = percent / 100;
      
      // Calculate hypothetical stack at this scalar
      const hypotheticalStack = stack.map(s => ({ ...s, dose: s.dose * scalar }));
      
      // Run the Engine
      const result = evaluateStack({ stackInput: hypotheticalStack, profile: userProfile });
      
      // Calculate Saturation % for this point
      let currentARLoad = 0;
      hypotheticalStack.forEach(item => {
        const meta = compoundData[item.compound];
        if (meta?.pathway === 'ar_genomic') {
          const weight = meta.bindingAffinity === 'very_high' ? 3 : meta.bindingAffinity === 'high' ? 1.5 : 1;
          currentARLoad += item.dose * weight;
        }
      });
      
      const saturation = Math.min(currentARLoad / 1200, 1); 
      const benefit = result.totals.totalBenefit;
      const risk = result.totals.totalRisk;

      // Detect Crossover (Risk > Benefit)
      // We look for the first point where Risk exceeds Benefit significantly (to avoid noise at 0)
      if (foundCrossover === null && percent > 10 && risk > benefit) {
        foundCrossover = percent;
      }

      points.push({
        percent,
        benefit,
        risk,
        net: result.totals.netScore,
        saturation,
        saturationPenalty: result.totals.saturationPenalty
      });
    }
    return { data: points, crossover: foundCrossover };
  }, [stack, userProfile]);

  if (stack.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center opacity-30">
          <div className="text-6xl mb-4">🧬</div>
          <p className="text-sm font-medium uppercase tracking-widest">Awaiting Compound Input</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
          <defs>
            {/* Benefit Fill (Green Mist) */}
            <linearGradient id="benefitFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.benefit} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS.benefit} stopOpacity={0}/>
            </linearGradient>
            
            {/* Risk Fill (Red Mist) */}
            <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.risk} stopOpacity={0.35}/>
              <stop offset="95%" stopColor={COLORS.risk} stopOpacity={0}/>
            </linearGradient>

            {/* Hatched Pattern for Wasted Zone */}
            <pattern id="wastedPattern" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
              <rect width="4" height="8" transform="translate(0,0)" fill={COLORS.risk} opacity="0.1" />
            </pattern>
          </defs>

          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={COLORS.grid} 
            opacity={0.15} 
            vertical={false} 
          />

          <XAxis 
            dataKey="percent" 
            type="number" 
            domain={[0, 150]} 
            tickFormatter={(val) => `${val}%`}
            stroke="#4b5563" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            dy={10}
          />
          <YAxis 
            hide 
            domain={[0, dataMax => Math.max(dataMax, 6)]} 
          />
          
          <Tooltip 
            content={<CustomTooltip crossover={crossover} />} 
            cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }} 
          />

          {/* Wasted Zone Background */}
          {crossover !== null && (
            <ReferenceArea 
              x1={crossover} 
              x2={150} 
              fill="url(#wastedPattern)" 
              opacity={1}
            />
          )}

          {/* 1. The Context Areas */}
          <Area 
            type="monotone" 
            dataKey="risk" 
            stroke="none" 
            fill="url(#riskFill)" 
            isAnimationActive={false}
          />
          <Area 
            type="monotone" 
            dataKey="benefit" 
            stroke="none" 
            fill="url(#benefitFill)" 
            isAnimationActive={false}
          />

          {/* 2. The Lines */}
          <Line 
            type="monotone" 
            dataKey="benefit" 
            stroke={COLORS.benefit} 
            strokeWidth={3} 
            dot={false}
            name="Benefit"
            isAnimationActive={false}
          />
           <Line 
            type="monotone" 
            dataKey="risk" 
            stroke={COLORS.risk} 
            strokeWidth={3} 
            strokeDasharray="5 5"
            dot={false}
            name="Risk"
            isAnimationActive={false}
          />

          {/* 3. The "You Are Here" Line */}
          <ReferenceLine x={100} stroke="#6366f1" strokeDasharray="3 3" strokeOpacity={0.8}>
            <div /> 
          </ReferenceLine>
          
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Floating Labels */}
      <div className="absolute top-4 right-6 flex flex-col items-end gap-1 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-physio-accent-success uppercase tracking-wider">Anabolic Output</span>
          <div className="w-3 h-1 bg-physio-accent-success rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-physio-accent-critical uppercase tracking-wider">Systemic Load</span>
          <div className="w-3 h-1 bg-physio-accent-critical rounded-full" />
        </div>
      </div>

      {/* Current Position Marker */}
      <div className="absolute bottom-0 left-2/3 -translate-x-1/2 mb-1 pointer-events-none">
         <span className="text-[10px] font-bold text-physio-accent-primary bg-physio-bg-core/80 px-2 py-1 rounded-full border border-physio-accent-primary/30">
           CURRENT DOSE
         </span>
      </div>
    </div>
  );
};

export default NetEffectChart;
