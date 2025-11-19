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

const hexToRgba = (hex, alpha = 1) => {
  if (!hex) return `rgba(255,255,255,${alpha})`;
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized.length === 3 ? normalized.repeat(2) : normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

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
  for (let dose = 0; dose <= 100; dose += 2) {
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

  return (
    <div className="h-full w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
        <defs>
          {oralCompounds.map(([key, compound]) => (
            <React.Fragment key={`defs-${key}`}>
              <linearGradient id={`oral-benefit-mist-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={hexToRgba(compound.color, 0.25)} />
                <stop offset="100%" stopColor={hexToRgba(compound.color, 0)} />
              </linearGradient>
              <linearGradient id={`oral-risk-fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={hexToRgba('#ef4444', 0.35)} />
                <stop offset="100%" stopColor={hexToRgba(compound.color, 0)} />
              </linearGradient>
            </React.Fragment>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} vertical={false} />
        <XAxis 
          dataKey="dose" 
          label={{ 
            value: 'Daily Dose (mg)', 
            position: 'insideBottom', 
            offset: -10,
            style: { fontSize: 11, fontWeight: 600, fill: '#9ca3af', fontFamily: 'Inter, sans-serif' }
          }}
          tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}
          stroke="#4b5563"
          strokeOpacity={0.3}
          tickLine={false}
          tickMargin={8}
        />
        <YAxis 
          label={{ 
            value: 'Score (0-5.5)', 
            angle: -90, 
            position: 'insideLeft',
            style: { fontSize: 11, fontWeight: 600, fill: '#9ca3af', fontFamily: 'Inter, sans-serif' }
          }}
          domain={[0, 5.5]}
          tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}
          stroke="#4b5563"
          strokeOpacity={0.3}
          tickLine={false}
          tickMargin={8}
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
          cursor={{ stroke: '#6366f1', strokeDasharray: '4 4', strokeOpacity: 0.5 }}
        />

        {/* Render uncertainty bands and lines for each oral compound */}
        {oralCompounds.map(([key, compound]) => {
          if (!visibleCompounds[key]) return null;
          const plateauDose = getPlateauDose(compound);
          const hardMax = getHardMax(compound);
          const plateauEnd = hardMax || 100;
          const guardrailActive = Boolean(highlightedCompound);
          const isHighlighted = highlightedCompound === key;
          
          const strokeOpacity = guardrailActive ? (isHighlighted ? 1 : 0.1) : 0.9;
          const mistFillOpacity = guardrailActive ? (isHighlighted ? 0.5 : 0.05) : 0.3;
          
          return (
            <React.Fragment key={key}>
              {showPlateau && plateauDose && (
                <ReferenceLine
                  x={plateauDose}
                  stroke="#f59e0b"
                  strokeDasharray="2 2"
                  strokeOpacity={isHighlighted ? 0.6 : 0}
                />
              )}
              {showPlateau && hardMax && (
                <ReferenceLine
                  x={hardMax}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  strokeOpacity={isHighlighted ? 0.5 : 0}
                />
              )}

              {showBenefit && (
                <>
                  <Area
                    type="monotone"
                    dataKey={`${key}-benefit-upper`}
                    stroke="none"
                    fill={`url(#oral-benefit-mist-${key})`}
                    fillOpacity={mistFillOpacity}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey={`${key}-benefit-lower`}
                    stroke="none"
                    fill={`url(#oral-benefit-mist-${key})`}
                    fillOpacity={mistFillOpacity}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={`${key}-benefit-pre`}
                    stroke={compound.color}
                    strokeWidth={isHighlighted ? 3 : 2}
                    strokeOpacity={strokeOpacity}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: 'white' }}
                    isAnimationActive={false}
                    name={`${compound.abbreviation} Benefit`}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey={`${key}-benefit-post`}
                    stroke={compound.color}
                    strokeWidth={isHighlighted ? 3 : 2}
                    strokeOpacity={isHighlighted ? 0.8 : 0.3}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                    legendType="none"
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey={`${key}-benefit-beyond`}
                    stroke="#ef4444"
                    strokeWidth={isHighlighted ? 3 : 2}
                    strokeDasharray="3 3"
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
                    fill={`url(#oral-risk-fill-${key})`}
                    fillOpacity={mistFillOpacity}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey={`${key}-risk-lower`}
                    stroke="none"
                    fill={`url(#oral-risk-fill-${key})`}
                    fillOpacity={mistFillOpacity}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={`${key}-risk-pre`}
                    stroke={compound.color}
                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                    strokeDasharray="4 4"
                    strokeOpacity={strokeOpacity}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: 'white' }}
                    isAnimationActive={false}
                    name={`${compound.abbreviation} Risk`}
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
                    fillOpacity={0.1}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey={`${key}-benefit-lower`}
                    stroke="none"
                    fill={compound.color}
                    fillOpacity={0.1}
                    isAnimationActive={false}
                  />
                </>
              )}

              {showEfficiency && (
                <Line
                  type="monotone"
                  dataKey={`${key}-efficiency-value`}
                  stroke={compound.color}
                  strokeWidth={isHighlighted ? 3 : 2}
                  strokeOpacity={strokeOpacity}
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
