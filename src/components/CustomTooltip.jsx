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
    <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-xl max-w-md">
      <div className="font-bold text-gray-900 mb-2">Dose: {dose} mg/week</div>
      
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
          <div key={`${key}-${type}`} className="mb-4 last:mb-0 pb-4 last:pb-0 border-b last:border-b-0">
            <div className="font-semibold text-lg mb-2" style={{ color: compound.color }}>
              {compound.name} - {type === 'benefit' ? 'BENEFIT' : 'RISK'}
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex items-center">
                <span className="font-semibold mr-2">★ Score:</span>
                <span>{point.value.toFixed(2)}</span>
              </div>
              
              <div className="flex items-start">
                <span className="font-semibold mr-2 whitespace-nowrap">Tier:</span>
                <span className="flex-1">{point.tier}</span>
              </div>
              
              <div className="flex items-start">
                <span className="font-semibold mr-2 whitespace-nowrap">Source:</span>
                <span className="flex-1 text-xs">{point.source || 'N/A'}</span>
              </div>
              
              <div className="flex items-start">
                <span className="font-semibold mr-2 whitespace-nowrap">Caveat:</span>
                <span className="flex-1 text-xs">{point.caveat}</span>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold mr-2">Confidence:</span>
                <span>±{point.ci.toFixed(2)} ({
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
      
      <div className="mt-3 pt-3 border-t text-xs text-gray-600">
        Individual Variance: ±20-30% typical
      </div>
    </div>
  );
};

export default CustomTooltip;

