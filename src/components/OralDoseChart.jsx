import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, Tooltip } from 'recharts';
import { compoundData } from '../data/compoundData';
import { personalizeScore } from '../utils/personalization';
import HoverAnalyticsTooltip from './HoverAnalyticsTooltip';

/**
 * Oral Compound Dose-Response Chart
 * Displays oral compounds on mg/day scale (0-100mg)
 */
const OralDoseChart = ({ viewMode, visibleCompounds, userProfile }) => {
  // Filter for oral compounds only
  const oralCompounds = Object.entries(compoundData).filter(([key, data]) => data.type === 'oral');
  
  // Generate dose points for orals (0-100 mg/day)
  const dosePoints = [];
  for (let dose = 0; dose <= 100; dose += 5) {
    dosePoints.push(dose);
  }
  
  // Build chart data
  const lastBenefitByCompound = {};
  const lastRiskByCompound = {};
  
  const chartData = dosePoints.map(dose => {
    const point = { dose };
    
    oralCompounds.forEach(([key, compound]) => {
      if (!visibleCompounds[key]) return;

      // Benefit personalization
      const benefitPoint = compound.benefitCurve.find(p => p.dose === dose) ||
        interpolate(compound.benefitCurve, dose);

      // Risk personalization
      const riskPoint = compound.riskCurve.find(p => p.dose === dose) ||
        interpolate(compound.riskCurve, dose);

      if (viewMode === 'benefit' || viewMode === 'integrated') {
        if (benefitPoint) {
          const personalized = personalizeScore({
            compoundKey: key,
            curveType: 'benefit',
            dose,
            baseValue: benefitPoint.value,
            baseCi: benefitPoint.ci,
            profile: userProfile
          });
          const previous = lastBenefitByCompound[key];
          point[`${key}_benefit`] = personalized.value;
          point[`${key}_benefit_lower`] = Math.max(0, personalized.value - personalized.ci);
          point[`${key}_benefit_upper`] = personalized.value + personalized.ci;
          point[`${key}-benefit-prevDose`] = previous?.dose ?? null;
          point[`${key}-benefit-delta`] = previous ? personalized.value - previous.value : null;
          lastBenefitByCompound[key] = { dose, value: personalized.value };
        }
      }
      
      if (viewMode === 'risk' || viewMode === 'integrated') {
        if (riskPoint) {
          const personalized = personalizeScore({
            compoundKey: key,
            curveType: 'risk',
            dose,
            baseValue: riskPoint.value,
            baseCi: riskPoint.ci,
            profile: userProfile
          });
          const previous = lastRiskByCompound[key];
          point[`${key}_risk`] = personalized.value;
          point[`${key}_risk_lower`] = Math.max(0, personalized.value - personalized.ci);
          point[`${key}_risk_upper`] = personalized.value + personalized.ci;
          point[`${key}-risk-prevDose`] = previous?.dose ?? null;
          point[`${key}-risk-delta`] = previous ? personalized.value - previous.value : null;
          lastRiskByCompound[key] = { dose, value: personalized.value };
        }
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
          
          <Tooltip
            content={(tooltipProps) => (
              <HoverAnalyticsTooltip
                {...tooltipProps}
                visibleCompounds={visibleCompounds}
                unit=" mg/day"
              />
            )}
            cursor={{ stroke: 'var(--physio-accent-cyan)', strokeDasharray: '4 4' }}
          />

          {/* Render uncertainty bands and lines for each oral compound */}
          {oralCompounds.map(([key, compound]) => {
            if (!visibleCompounds[key]) return null;
            
            return (
              <React.Fragment key={key}>
                {/* Benefit uncertainty band */}
                {(viewMode === 'benefit' || viewMode === 'integrated') && (
                  <>
                    <Area
                      type="monotone"
                      dataKey={`${key}_benefit_upper`}
                      stroke="none"
                      fill={compound.color}
                      fillOpacity={0.35}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey={`${key}_benefit_lower`}
                      stroke="none"
                      fill={compound.color}
                      fillOpacity={0.35}
                      isAnimationActive={false}
                    />
                  </>
                )}
                
                {/* Risk uncertainty band */}
                {(viewMode === 'risk' || viewMode === 'integrated') && (
                  <>
                    <Area
                      type="monotone"
                      dataKey={`${key}_risk_upper`}
                      stroke="none"
                      fill={compound.color}
                      fillOpacity={0.4}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey={`${key}_risk_lower`}
                      stroke="none"
                      fill={compound.color}
                      fillOpacity={0.4}
                      isAnimationActive={false}
                    />
                  </>
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
      const ci0 = curve[i].ci ?? 0;
      const ci1 = curve[i + 1].ci ?? 0;
      const ci = ci0 + ratio * (ci1 - ci0);
      
      return { value, ci };
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
