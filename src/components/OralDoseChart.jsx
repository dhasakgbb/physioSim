import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Area } from 'recharts';
import { compoundData } from '../data/compoundData';

/**
 * Oral Compound Dose-Response Chart
 * Displays oral compounds on mg/day scale (0-100mg)
 */
const OralDoseChart = ({ viewMode, visibleCompounds }) => {
  // Filter for oral compounds only
  const oralCompounds = Object.entries(compoundData).filter(([key, data]) => data.type === 'oral');
  
  // Generate dose points for orals (0-100 mg/day)
  const dosePoints = [];
  for (let dose = 0; dose <= 100; dose += 5) {
    dosePoints.push(dose);
  }
  
  // Build chart data
  const chartData = dosePoints.map(dose => {
    const point = { dose };
    
    oralCompounds.forEach(([key, compound]) => {
      if (!visibleCompounds[key]) return;
      
      // Find benefit value at this dose
      const benefitPoint = compound.benefitCurve.find(p => p.dose === dose) ||
        interpolate(compound.benefitCurve, dose);
      
      // Find risk value at this dose
      const riskPoint = compound.riskCurve.find(p => p.dose === dose) ||
        interpolate(compound.riskCurve, dose);
      
      if (viewMode === 'benefit' || viewMode === 'integrated') {
        point[`${key}_benefit`] = benefitPoint?.value || 0;
        point[`${key}_benefit_lower`] = benefitPoint?.lower || benefitPoint?.value || 0;
        point[`${key}_benefit_upper`] = benefitPoint?.upper || benefitPoint?.value || 0;
      }
      
      if (viewMode === 'risk' || viewMode === 'integrated') {
        point[`${key}_risk`] = riskPoint?.value || 0;
        point[`${key}_risk_lower`] = riskPoint?.lower || riskPoint?.value || 0;
        point[`${key}_risk_upper`] = riskPoint?.upper || riskPoint?.value || 0;
      }
    });
    
    return point;
  });
  
  return (
    <div className="bg-physio-bg-secondary p-6 rounded-lg shadow-lg border-2 border-physio-bg-border">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-physio-text-primary">Oral Compounds Dose-Response</h3>
        <p className="text-sm text-physio-warning bg-physio-bg-tertiary border-2 border-physio-warning p-3 rounded-lg mt-2">
          <strong>Note:</strong> Orals are typically used for 4-8 weeks as cycle additions (kickstart/finisher), not full cycles. 
          Scale is mg/day, not mg/week.
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={500}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--physio-bg-border)" strokeOpacity={0.2} />
          <XAxis 
            dataKey="dose" 
            label={{ 
              value: 'Dose (mg/day)', 
              position: 'insideBottom', 
              offset: -5,
              style: { fill: 'var(--physio-text-primary)', fontSize: 14, fontWeight: 'bold' }
            }}
            tick={{ fill: 'var(--physio-text-secondary)', fontSize: 12 }}
            stroke="var(--physio-bg-border)"
          />
          <YAxis 
            label={{ 
              value: 'Score (0-5)', 
              angle: -90, 
              position: 'insideLeft',
              style: { fill: 'var(--physio-text-primary)', fontSize: 14, fontWeight: 'bold' }
            }}
            domain={[0, 5.5]}
            tick={{ fill: 'var(--physio-text-secondary)', fontSize: 12 }}
            stroke="var(--physio-bg-border)"
          />
          
          {/* Render uncertainty bands and lines for each oral compound */}
          {oralCompounds.map(([key, compound]) => {
            if (!visibleCompounds[key]) return null;
            
            return (
              <React.Fragment key={key}>
                {/* Benefit uncertainty band */}
                {(viewMode === 'benefit' || viewMode === 'integrated') && (
                  <Area
                    type="monotone"
                    dataKey={`${key}_benefit_upper`}
                    stroke="none"
                    fill={compound.color}
                    fillOpacity={0.35}
                    stackId={`${key}_benefit_band`}
                  />
                )}
                
                {/* Risk uncertainty band */}
                {(viewMode === 'risk' || viewMode === 'integrated') && (
                  <Area
                    type="monotone"
                    dataKey={`${key}_risk_upper`}
                    stroke="none"
                    fill={compound.color}
                    fillOpacity={0.40}
                    stackId={`${key}_risk_band`}
                  />
                )}
                
                {/* Benefit line */}
                {(viewMode === 'benefit' || viewMode === 'integrated') && (
                  <Line
                    type="monotone"
                    dataKey={`${key}_benefit`}
                    stroke={compound.color}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                    name={`${compound.abbreviation} Benefit`}
                  />
                )}
                
                {/* Risk line */}
                {(viewMode === 'risk' || viewMode === 'integrated') && (
                  <Line
                    type="monotone"
                    dataKey={`${key}_risk`}
                    stroke={compound.color}
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                    name={`${compound.abbreviation} Risk`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Helper function to interpolate between curve points
function interpolate(curve, dose) {
  if (!curve || curve.length === 0) return null;
  
  // Find surrounding points
  for (let i = 0; i < curve.length - 1; i++) {
    if (dose >= curve[i].dose && dose <= curve[i + 1].dose) {
      const x0 = curve[i].dose;
      const x1 = curve[i + 1].dose;
      const y0 = curve[i].value;
      const y1 = curve[i + 1].value;
      
      // Linear interpolation
      const ratio = (dose - x0) / (x1 - x0);
      const value = y0 + ratio * (y1 - y0);
      
      // Interpolate bounds if they exist
      const lower = curve[i].lower !== undefined && curve[i + 1].lower !== undefined
        ? curve[i].lower + ratio * (curve[i + 1].lower - curve[i].lower)
        : value;
      
      const upper = curve[i].upper !== undefined && curve[i + 1].upper !== undefined
        ? curve[i].upper + ratio * (curve[i + 1].upper - curve[i].upper)
        : value;
      
      return { value, lower, upper };
    }
  }
  
  // If dose is beyond range, return last point
  if (dose >= curve[curve.length - 1].dose) {
    return curve[curve.length - 1];
  }
  
  // If dose is before range, return first point
  return curve[0];
}

export default OralDoseChart;

