import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { compoundData } from '../../data/compoundData';

const Card = ({ title, subtitle, children, className = '' }) => (
  <div className={`bg-physio-bg-core border border-physio-bg-border rounded-2xl p-4 flex flex-col shadow-sm ${className}`}>
    <div className="mb-3">
      <h4 className="text-sm font-bold text-physio-text-primary">{title}</h4>
      {subtitle && <p className="text-xs text-physio-text-secondary">{subtitle}</p>}
    </div>
    <div className="flex-1 min-h-0 relative">
      {children}
    </div>
  </div>
);

const BenefitRiskCard = ({ data }) => {
  if (!data || !data.length) return <div className="text-xs text-physio-text-tertiary">No data</div>;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--physio-bg-border)" vertical={false} />
        <XAxis dataKey="metric" tick={{ fontSize: 10, fill: 'var(--physio-text-secondary)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--physio-text-secondary)' }} axisLine={false} tickLine={false} />
        <Tooltip 
          cursor={{ fill: 'var(--physio-bg-secondary)' }}
          contentStyle={{ backgroundColor: 'var(--physio-bg-secondary)', borderColor: 'var(--physio-bg-border)', fontSize: '12px' }}
        />
        <Bar dataKey="Base" fill="#94a3b8" radius={[2, 2, 0, 0]} />
        <Bar dataKey="With Synergy" fill="#06b6d4" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

const InteractionCurveCard = ({ data, primaryCompound }) => {
  if (!data || !data.length) return <div className="text-xs text-physio-text-tertiary">No data</div>;
  const abbreviation = compoundData[primaryCompound]?.abbreviation || primaryCompound;
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--physio-bg-border)" vertical={false} />
        <XAxis 
          dataKey="dose" 
          tick={{ fontSize: 10, fill: 'var(--physio-text-secondary)' }} 
          axisLine={false} 
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 10, fill: 'var(--physio-text-secondary)' }} axisLine={false} tickLine={false} />
        <Tooltip 
          contentStyle={{ backgroundColor: 'var(--physio-bg-secondary)', borderColor: 'var(--physio-bg-border)', fontSize: '12px' }}
        />
        <Line type="monotone" dataKey="basePrimary" stroke="#38bdf8" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="total" stroke="#34d399" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

const SuggestionsList = ({ recommendations, compoundA, compoundB, onLoad }) => {
  if (!recommendations || !recommendations.length) {
    return <p className="text-xs text-physio-text-tertiary">No high-value sweet spots found.</p>;
  }

  return (
    <div className="space-y-2 overflow-y-auto max-h-[180px] pr-1 custom-scrollbar">
      {recommendations.slice(0, 4).map((rec, idx) => (
        <div 
          key={idx} 
          className="group flex items-center justify-between p-2.5 rounded-lg border border-physio-bg-border bg-physio-bg-secondary hover:border-physio-accent-cyan/50 transition-colors cursor-pointer"
          onClick={() => onLoad(rec)}
        >
          <div className="flex flex-col gap-0.5">
            <div className="text-xs font-semibold text-physio-text-primary">
              <span className="text-physio-accent-cyan">Net {rec.score.toFixed(2)}</span>
            </div>
            <div className="text-[10px] text-physio-text-secondary">
              {compoundData[compoundA]?.abbreviation}: {rec[compoundA]}mg · {compoundData[compoundB]?.abbreviation}: {rec[compoundB]}mg
            </div>
          </div>
          <button 
            className="opacity-0 group-hover:opacity-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide bg-physio-accent-cyan text-physio-bg-core rounded-md transition-opacity"
          >
            Load
          </button>
        </div>
      ))}
    </div>
  );
};

const InteractionAnalyticsDeck = ({
  pairNetChartData,
  interactionCurveData,
  primaryCompound,
  recommendations,
  compoundA,
  compoundB,
  onLoadRecommendation
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-64">
      <Card title="Benefit vs Risk" subtitle="Base vs Synergy-Adjusted">
        <BenefitRiskCard data={pairNetChartData} />
      </Card>
      
      <Card title="Interaction Curve" subtitle={`Effect on ${compoundData[primaryCompound]?.abbreviation || 'Primary'}`}>
        <InteractionCurveCard data={interactionCurveData} primaryCompound={primaryCompound} />
      </Card>
      
      <Card title="Sweet Spots" subtitle="Top efficiency targets" className="md:col-span-1">
        <SuggestionsList 
          recommendations={recommendations} 
          compoundA={compoundA} 
          compoundB={compoundB} 
          onLoad={onLoadRecommendation} 
        />
      </Card>
    </div>
  );
};

export default InteractionAnalyticsDeck;

