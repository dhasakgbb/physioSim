import React from 'react';
import { compoundData } from '../data/compoundData';

const CustomTooltip = ({ active, payload, viewMode }) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  const dose = data.dose;

  // Determine which compounds to show based on active payload
  const compoundsToShow = payload
    .filter(p => p.dataKey && !p.dataKey.includes('upper') && !p.dataKey.includes('lower'))
    .map(p => {
      const match = p.dataKey.match(/^(\w+)-(benefit|risk)-value$/);
      if (match) {
        return { key: match[1], type: match[2] };
      }
      return null;
    })
    .filter(Boolean);

  if (compoundsToShow.length === 0) return null;

  return (
    <div className="bg-physio-bg-secondary/95 backdrop-blur-sm border-2 border-physio-accent-cyan/40 rounded-lg p-4 shadow-physio-elevated max-w-md">
      <div className="font-bold text-physio-text-primary mb-2 font-mono">Dose: {dose} mg/week</div>
      
      {compoundsToShow.map(({ key, type }) => {
        const compound = compoundData[key];
        if (!compound) return null;

        const curve = type === 'benefit' ? compound.benefitCurve : compound.riskCurve;
        const point = curve.find(p => p.dose === dose);
        
        if (!point) return null;

        const showBenefit = viewMode === 'benefit' || viewMode === 'integrated';
        const showRisk = viewMode === 'risk' || viewMode === 'integrated';
        const shouldShow = (type === 'benefit' && showBenefit) || (type === 'risk' && showRisk);
        
        if (!shouldShow) return null;

        return (
          <div key={`${key}-${type}`} className="mb-4 last:mb-0 pb-4 last:pb-0 border-b last:border-b-0 border-physio-bg-border">
            <div className="font-semibold text-lg mb-2" style={{ color: compound.color }}>
              {compound.name} - {type === 'benefit' ? 'BENEFIT' : 'RISK'}
            </div>
            
            <div className="space-y-1 text-sm text-physio-text-primary">
              <div className="flex items-center">
                <span className="font-semibold mr-2 text-physio-text-secondary">★ Score:</span>
                <span className="font-mono">{point.value.toFixed(2)}</span>
              </div>
              
              <div className="flex items-start">
                <span className="font-semibold mr-2 whitespace-nowrap text-physio-text-secondary">Tier:</span>
                <span className="flex-1">{point.tier}</span>
              </div>
              
              <div className="flex items-start">
                <span className="font-semibold mr-2 whitespace-nowrap text-physio-text-secondary">Source:</span>
                <span className="flex-1 text-xs text-physio-text-secondary">{point.source || 'N/A'}</span>
              </div>
              
              <div className="flex items-start">
                <span className="font-semibold mr-2 whitespace-nowrap text-physio-text-secondary">Caveat:</span>
                <span className="flex-1 text-xs text-physio-text-secondary">{point.caveat}</span>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold mr-2 text-physio-text-secondary">Confidence:</span>
                <span className="font-mono text-xs">±{point.ci.toFixed(2)} ({
                  point.ci <= 0.2 ? 'High' : 
                  point.ci <= 0.5 ? 'Medium' : 
                  point.ci <= 0.7 ? 'Low-Medium' : 
                  'Low'
                })</span>
              </div>
            </div>
          </div>
        );
      })}
      
      <div className="mt-3 pt-3 border-t border-physio-bg-border text-xs text-physio-text-tertiary">
        Individual Variance: ±20-30% typical
      </div>
    </div>
  );
};

export default CustomTooltip;

