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
import { evaluateCompoundResponse, getPlateauDose, getHardMax } from '../utils/interactionEngine';
import HoverAnalyticsTooltip from './HoverAnalyticsTooltip';

/**
 * Oral Compound Dose-Response Chart
 * Displays oral compounds on mg/day scale (0-100mg)
 */
const OralDoseChart = ({
  viewMode,
  visibleCompounds,
  userProfile,
  highlightedCompound = null
}) => {
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

      const benefitEval = evaluateCompoundResponse(key, 'benefit', dose, userProfile);
      if (!benefitEval?.meta?.missing) {
        const previous = lastBenefitByCompound[key];
        const ci = benefitEval.ci ?? 0;
        const meta = benefitEval.meta || {};
        point[`${key}-benefit-value`] = benefitEval.value;
        point[`${key}-benefit-upper`] = benefitEval.value + ci;
        point[`${key}-benefit-lower`] = Math.max(0, benefitEval.value - ci);
        point[`${key}-benefit-prevDose`] = previous?.dose ?? null;
        point[`${key}-benefit-delta`] = previous ? benefitEval.value - previous.value : null;
        point[`${key}-benefit-meta`] = meta;
        point[`${key}-benefit-pre`] = meta.nearingPlateau ? null : benefitEval.value;
        point[`${key}-benefit-post`] = meta.nearingPlateau ? benefitEval.value : null;
        point[`${key}-benefit-beyond`] = meta.beyondEvidence ? benefitEval.value : null;
        lastBenefitByCompound[key] = { dose, value: benefitEval.value };
      }

      const riskEval = evaluateCompoundResponse(key, 'risk', dose, userProfile);
      if (!riskEval?.meta?.missing) {
        const previous = lastRiskByCompound[key];
        const ci = riskEval.ci ?? 0;
        const meta = riskEval.meta || {};
        point[`${key}-risk-value`] = riskEval.value;
        point[`${key}-risk-upper`] = riskEval.value + ci;
        point[`${key}-risk-lower`] = Math.max(0, riskEval.value - ci);
        point[`${key}-risk-prevDose`] = previous?.dose ?? null;
        point[`${key}-risk-delta`] = previous ? riskEval.value - previous.value : null;
        point[`${key}-risk-meta`] = meta;
        point[`${key}-risk-pre`] = meta.nearingPlateau ? null : riskEval.value;
        point[`${key}-risk-post`] = meta.nearingPlateau ? riskEval.value : null;
        point[`${key}-risk-beyond`] = meta.beyondEvidence ? riskEval.value : null;
        lastRiskByCompound[key] = { dose, value: riskEval.value };
      }

      const benefitValue = point[`${key}-benefit-value`];
      const riskValue = point[`${key}-risk-value`];
      if (benefitValue !== undefined && riskValue !== undefined) {
        const eff = riskValue > 0.1 ? benefitValue / riskValue : benefitValue;
        point[`${key}-efficiency-value`] = Number(eff.toFixed(3));
      }
    });
    
    return point;
  });
  
  const mode = viewMode || 'benefit';
  const showBenefit = mode === 'benefit';
  const showRisk = mode === 'risk';
  const showEfficiency = mode === 'efficiency';
  const showUncertainty = mode === 'uncertainty';
  const showPlateau = showBenefit || showEfficiency;
  const headerCopy =
    mode === 'benefit'
      ? 'Benefit curve spotlight'
      : mode === 'risk'
      ? 'Risk burden spotlight'
      : mode === 'efficiency'
      ? 'Benefit ÷ risk ratios'
      : 'Uncertainty mist (CI only)';

  return (
    <div className="bg-physio-bg-secondary p-6 rounded-lg shadow-lg border-2 border-physio-bg-border">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-physio-text-primary">
          Oral Spotlight · {headerCopy}
        </h3>
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
                mode={mode}
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
            const guardrailActive = Boolean(highlightedCompound);
            const isHighlighted = highlightedCompound === key;
            const plateauOpacity = isHighlighted ? 0.25 : guardrailActive ? 0.03 : 0.08;
            const capStrokeOpacity = isHighlighted ? 1 : guardrailActive ? 0.2 : 0.8;
            const capStrokeWidth = isHighlighted ? 3 : 1.5;
            
            return (
              <React.Fragment key={key}>
                {showPlateau && plateauDose && plateauDose < plateauEnd && (
                  <ReferenceArea
                    x1={plateauDose}
                    x2={plateauEnd}
                    fill="var(--physio-warning)"
                    fillOpacity={plateauOpacity}
                    strokeOpacity={0}
                  />
                )}
                {showPlateau && hardMax && (
                  <ReferenceLine
                    x={hardMax}
                    stroke="var(--physio-error)"
                    strokeDasharray={isHighlighted ? '2 2' : '4 4'}
                    strokeOpacity={capStrokeOpacity}
                    strokeWidth={capStrokeWidth}
                    label={{
                      value: `${compound.abbreviation || key} cap`,
                      position: 'top',
                      fill: 'var(--physio-error)',
                      fontSize: 11
                    }}
                  />
                )}

                {showBenefit && (
                  <>
                    <Area
                      type="monotone"
                      dataKey={`${key}-benefit-upper`}
                      stroke="none"
                      fill={compound.color}
                      fillOpacity={0.35}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey={`${key}-benefit-lower`}
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
                
                {showRisk && (
                  <>
                    <Area
                      type="monotone"
                      dataKey={`${key}-risk-upper`}
                      stroke="none"
                      fill={compound.color}
                      fillOpacity={0.4}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey={`${key}-risk-lower`}
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

                {showUncertainty && (
                  <>
                    <Area
                      type="monotone"
                      dataKey={`${key}-benefit-upper`}
                      stroke="none"
                      fill={compound.color}
                      fillOpacity={0.15}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey={`${key}-benefit-lower`}
                      stroke="none"
                      fill={compound.color}
                      fillOpacity={0.15}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey={`${key}-risk-upper`}
                      stroke="none"
                      fill={compound.color}
                      fillOpacity={0.15}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey={`${key}-risk-lower`}
                      stroke="none"
                      fill={compound.color}
                      fillOpacity={0.15}
                      isAnimationActive={false}
                    />
                  </>
                )}

                {showEfficiency && (
                  <Line
                    type="monotone"
                    dataKey={`${key}-efficiency-value`}
                    stroke={compound.color}
                    strokeWidth={3}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                    name={`${compound.abbreviation} Efficiency`}
                    connectNulls
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

export default OralDoseChart;
