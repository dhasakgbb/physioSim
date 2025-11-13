import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  Tooltip,
  ReferenceArea,
  ReferenceLine
} from 'recharts';
import { compoundData } from '../data/compoundData';
import { evaluateCompoundResponse } from '../utils/interactionEngine';
import HoverAnalyticsTooltip from './HoverAnalyticsTooltip';

const getCurveCap = (curve = []) => {
  if (!curve?.length) return 0;
  return curve[curve.length - 1]?.dose ?? 0;
};

const derivePlateauDose = (curve = []) => {
  if (!curve?.length) return 0;
  if (curve.length === 1) return curve[0].dose;
  return curve[Math.max(0, curve.length - 2)].dose;
};

const getPlateauDose = compound =>
  compound.plateauDose ?? derivePlateauDose(compound.benefitCurve);

const getHardMax = compound => {
  const plateauDose = getPlateauDose(compound);
  return (
    compound.hardMax ??
    Math.max(getCurveCap(compound.benefitCurve), getCurveCap(compound.riskCurve), plateauDose)
  );
};

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

      if (viewMode === 'benefit' || viewMode === 'integrated') {
        const evaluation = evaluateCompoundResponse(key, 'benefit', dose, userProfile);
        if (!evaluation?.meta?.missing) {
          const previous = lastBenefitByCompound[key];
          const ci = evaluation.ci ?? 0;
          const meta = evaluation.meta || {};
          point[`${key}_benefit`] = evaluation.value;
          point[`${key}_benefit_lower`] = Math.max(0, evaluation.value - ci);
          point[`${key}_benefit_upper`] = evaluation.value + ci;
          point[`${key}-benefit-value`] = evaluation.value;
          point[`${key}-benefit-upper`] = evaluation.value + ci;
          point[`${key}-benefit-lower`] = Math.max(0, evaluation.value - ci);
          point[`${key}-benefit-prevDose`] = previous?.dose ?? null;
          point[`${key}-benefit-delta`] = previous ? evaluation.value - previous.value : null;
          point[`${key}-benefit-meta`] = meta;
          point[`${key}-benefit-pre`] = meta.nearingPlateau ? null : evaluation.value;
          point[`${key}-benefit-post`] = meta.nearingPlateau ? evaluation.value : null;
          point[`${key}-benefit-beyond`] = meta.beyondEvidence ? evaluation.value : null;
          lastBenefitByCompound[key] = { dose, value: evaluation.value };
        }
      }
      
      if (viewMode === 'risk' || viewMode === 'integrated') {
        const evaluation = evaluateCompoundResponse(key, 'risk', dose, userProfile);
        if (!evaluation?.meta?.missing) {
          const previous = lastRiskByCompound[key];
          const ci = evaluation.ci ?? 0;
          const meta = evaluation.meta || {};
          point[`${key}_risk`] = evaluation.value;
          point[`${key}_risk_lower`] = Math.max(0, evaluation.value - ci);
          point[`${key}_risk_upper`] = evaluation.value + ci;
          point[`${key}-risk-value`] = evaluation.value;
          point[`${key}-risk-upper`] = evaluation.value + ci;
          point[`${key}-risk-lower`] = Math.max(0, evaluation.value - ci);
          point[`${key}-risk-prevDose`] = previous?.dose ?? null;
          point[`${key}-risk-delta`] = previous ? evaluation.value - previous.value : null;
          point[`${key}-risk-meta`] = meta;
          point[`${key}-risk-pre`] = meta.nearingPlateau ? null : evaluation.value;
          point[`${key}-risk-post`] = meta.nearingPlateau ? evaluation.value : null;
          point[`${key}-risk-beyond`] = meta.beyondEvidence ? evaluation.value : null;
          lastRiskByCompound[key] = { dose, value: evaluation.value };
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
            const plateauDose = getPlateauDose(compound);
            const hardMax = getHardMax(compound);
            const plateauEnd = hardMax || 100;
            
            return (
              <React.Fragment key={key}>
                {(viewMode === 'benefit' || viewMode === 'integrated') && plateauDose && plateauDose < plateauEnd && (
                  <ReferenceArea
                    x1={plateauDose}
                    x2={plateauEnd}
                    fill="var(--physio-warning)"
                    fillOpacity={0.08}
                    strokeOpacity={0}
                  />
                )}
                {(viewMode === 'benefit' || viewMode === 'integrated') && hardMax && (
                  <ReferenceLine
                    x={hardMax}
                    stroke="var(--physio-error)"
                    strokeDasharray="4 4"
                    label={{
                      value: `${compound.abbreviation || key} cap`,
                      position: 'top',
                      fill: 'var(--physio-error)',
                      fontSize: 11
                    }}
                  />
                )}

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
                    <Line
                      type="monotone"
                      dataKey={`${key}-benefit-pre`}
                      stroke={compound.color}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={false}
                      isAnimationActive={false}
                      name={`${compound.abbreviation} Benefit`}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey={`${key}-benefit-post`}
                      stroke={compound.color}
                      strokeWidth={2.5}
                      strokeOpacity={0.5}
                      dot={false}
                      activeDot={false}
                      isAnimationActive={false}
                      legendType="none"
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey={`${key}-benefit-beyond`}
                      stroke="var(--physio-error)"
                      strokeWidth={3}
                      strokeDasharray="6 4"
                      dot={false}
                      activeDot={false}
                      isAnimationActive={false}
                      legendType="none"
                      connectNulls
                    />
                  </>
                )}
                
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
                    <Line
                      type="monotone"
                      dataKey={`${key}-risk-pre`}
                      stroke={compound.color}
                      strokeWidth={2.5}
                      strokeDasharray="5 5"
                      dot={false}
                      activeDot={false}
                      isAnimationActive={false}
                      name={`${compound.abbreviation} Risk`}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey={`${key}-risk-post`}
                      stroke={compound.color}
                      strokeWidth={2}
                      strokeDasharray="2 2"
                      strokeOpacity={0.6}
                      dot={false}
                      activeDot={false}
                      isAnimationActive={false}
                      legendType="none"
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey={`${key}-risk-beyond`}
                      stroke="var(--physio-error)"
                      strokeWidth={3}
                      strokeDasharray="4 2"
                      dot={false}
                      activeDot={false}
                      isAnimationActive={false}
                      legendType="none"
                      connectNulls
                    />
                  </>
                )}
              </React.Fragment>
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OralDoseChart;
