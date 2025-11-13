import React, { useRef, useState } from 'react';
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  Tooltip
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

const DoseResponseChart = ({
  viewMode,
  visibleCompounds,
  userProfile,
  highlightedCompound = null
}) => {
  const chartRef = useRef(null);
  const [zoomDomain, setZoomDomain] = useState({ x: [0, 1200], y: [0, 5.5] });

  // Prepare data for Recharts - merge all doses from injectable compounds only
  // Only show data where we actually have it (scientifically honest)
  const prepareChartData = () => {
    const allDoses = new Set();
    
    // Collect all dose points from INJECTABLE compounds only
    Object.values(compoundData).forEach(compound => {
      if (compound.type !== 'injectable') return;
      compound.benefitCurve.forEach(point => allDoses.add(point.dose));
      compound.riskCurve.forEach(point => allDoses.add(point.dose));
    });

    const sortedDoses = Array.from(allDoses).sort((a, b) => a - b);
    const lastBenefit = {};
    const lastRisk = {};
    
    return sortedDoses.map(dose => {
      const dataPoint = { dose };
      
      Object.entries(compoundData).forEach(([key, compound]) => {
        if (compound.type !== 'injectable') return;
        
        // Benefit data - only show where we have data
        const benefitPoint = compound.benefitCurve.find(p => p.dose === dose);
        if (benefitPoint) {
          const evaluation = evaluateCompoundResponse(key, 'benefit', dose, userProfile);
          const previous = lastBenefit[key];
          const ci = evaluation.ci ?? 0;
          const meta = evaluation.meta || {};

          dataPoint[`${key}-benefit-value`] = evaluation.value;
          dataPoint[`${key}-benefit-upper`] = evaluation.value + ci;
          dataPoint[`${key}-benefit-lower`] = Math.max(0, evaluation.value - ci);
          dataPoint[`${key}-benefit-prevDose`] = previous?.dose ?? null;
          dataPoint[`${key}-benefit-delta`] = previous ? evaluation.value - previous.value : null;
          dataPoint[`${key}-benefit-meta`] = meta;
          dataPoint[`${key}-benefit-pre`] = meta.nearingPlateau ? null : evaluation.value;
          dataPoint[`${key}-benefit-post`] = meta.nearingPlateau ? evaluation.value : null;
          dataPoint[`${key}-benefit-beyond`] = meta.beyondEvidence ? evaluation.value : null;
          
          lastBenefit[key] = { dose, value: evaluation.value };
        }
        
        // Risk data - only show where we have data
        const riskPoint = compound.riskCurve.find(p => p.dose === dose);
        if (riskPoint) {
          const evaluation = evaluateCompoundResponse(key, 'risk', dose, userProfile);
          const previous = lastRisk[key];
          const ci = evaluation.ci ?? 0;
          const meta = evaluation.meta || {};

          dataPoint[`${key}-risk-value`] = evaluation.value;
          dataPoint[`${key}-risk-upper`] = evaluation.value + ci;
          dataPoint[`${key}-risk-lower`] = Math.max(0, evaluation.value - ci);
          dataPoint[`${key}-risk-prevDose`] = previous?.dose ?? null;
          dataPoint[`${key}-risk-delta`] = previous ? evaluation.value - previous.value : null;
          dataPoint[`${key}-risk-meta`] = meta;
          dataPoint[`${key}-risk-pre`] = meta.nearingPlateau ? null : evaluation.value;
          dataPoint[`${key}-risk-post`] = meta.nearingPlateau ? evaluation.value : null;
          dataPoint[`${key}-risk-beyond`] = meta.beyondEvidence ? evaluation.value : null;

          lastRisk[key] = { dose, value: evaluation.value };
        }
      });
      
      return dataPoint;
    });
  };

  const chartData = prepareChartData();

  const handleDoubleClick = () => {
    setZoomDomain({ x: [0, 1200], y: [0, 5.5] });
  };

  const showBenefit = viewMode === 'benefit' || viewMode === 'integrated';
  const showRisk = viewMode === 'risk' || viewMode === 'integrated';

  return (
    <div 
      ref={chartRef} 
      className="bg-physio-bg-secondary p-6 rounded-lg shadow-lg"
      onDoubleClick={handleDoubleClick}
    >
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-physio-text-primary">
          AAS Dose-Response Models: {
            viewMode === 'benefit' ? 'Benefit Curves' :
            viewMode === 'risk' ? 'Risk Curves' :
            'Benefit vs. Risk'
          }
        </h2>
        <p className="text-sm text-physio-text-secondary mt-1">
          {viewMode === 'benefit' && 'Solid lines show anabolic benefit (mass/strength gains)'}
          {viewMode === 'risk' && 'Dotted lines show side burden (lipids/cardio/psych/organ stress)'}
          {viewMode === 'integrated' && 'Solid = Benefit | Dotted = Risk | Shaded = Uncertainty'}
        </p>
        <p className="text-xs text-physio-text-tertiary mt-1">
          Double-click to reset zoom | Scroll to zoom | Drag to pan
        </p>
      </div>

      <ResponsiveContainer width="100%" height={600}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--physio-bg-border)" strokeOpacity={0.2} />
          
          <XAxis
            dataKey="dose"
            type="number"
            domain={zoomDomain.x}
            label={{
              value: 'Weekly Dose (mg)',
              position: 'insideBottom',
              offset: -10,
              style: { fontSize: 14, fontWeight: 'bold' }
            }}
            tick={{ fontSize: 12 }}
          />
          
          <YAxis
            domain={zoomDomain.y}
            label={{
              value: 'Score (0-5.5)',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 14, fontWeight: 'bold' }
            }}
            tick={{ fontSize: 12 }}
          />

          <Tooltip
            content={(tooltipProps) => (
              <HoverAnalyticsTooltip
                {...tooltipProps}
                visibleCompounds={visibleCompounds}
                unit=" mg/wk"
              />
            )}
            cursor={{ stroke: 'var(--physio-accent-cyan)', strokeDasharray: '4 4' }}
          />

          {/* Render uncertainty bands and lines for each compound */}
          {Object.entries(compoundData).map(([key, compound]) => {
            if (compound.type !== 'injectable') return null;
            if (!visibleCompounds[key]) return null;
            const plateauDose = getPlateauDose(compound);
            const hardMax = getHardMax(compound);
            const plateauEnd = hardMax || zoomDomain.x[1] || 1200;
            const guardrailActive = Boolean(highlightedCompound);
            const isHighlighted = highlightedCompound === key;
            const plateauOpacity = isHighlighted ? 0.25 : guardrailActive ? 0.03 : 0.08;
            const capStrokeOpacity = isHighlighted ? 1 : guardrailActive ? 0.2 : 0.8;
            const capStrokeWidth = isHighlighted ? 3 : 1.5;
            const capLabelColor = 'var(--physio-error)';

            return (
              <React.Fragment key={key}>
                {showBenefit && plateauDose && plateauDose < plateauEnd && (
                  <ReferenceArea
                    x1={plateauDose}
                    x2={plateauEnd}
                    fill="var(--physio-warning)"
                    fillOpacity={plateauOpacity}
                    strokeOpacity={0}
                  />
                )}
                {showBenefit && hardMax && (
                  <ReferenceLine
                    x={hardMax}
                    stroke="var(--physio-error)"
                    strokeDasharray={isHighlighted ? '2 2' : '4 4'}
                    strokeOpacity={capStrokeOpacity}
                    strokeWidth={capStrokeWidth}
                    label={{
                      value: `${compound.abbreviation || key} cap`,
                      position: 'top',
                      fill: capLabelColor,
                      fontSize: 11,
                      fontWeight: isHighlighted ? 600 : 400
                    }}
                  />
                )}

                {/* BENEFIT CURVES */}
                {showBenefit && (
                  <>
                    <Area
                      dataKey={`${key}-benefit-upper`}
                      stroke="none"
                      fill={compound.color}
                      fillOpacity={0.35}
                      isAnimationActive={false}
                    />
                    <Area
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
                      connectNulls
                      name={`${compound.abbreviation} Benefit`}
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
                      connectNulls
                      legendType="none"
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
                      connectNulls
                      legendType="none"
                    />
                  </>
                )}

                {/* RISK CURVES */}
                {showRisk && (
                  <>
                    <Area
                      dataKey={`${key}-risk-upper`}
                      stroke="none"
                      fill={compound.color}
                      fillOpacity={0.40}
                      isAnimationActive={false}
                    />
                    <Area
                      dataKey={`${key}-risk-lower`}
                      stroke="none"
                      fill={compound.color}
                      fillOpacity={0.40}
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
                      connectNulls
                      name={`${compound.abbreviation} Risk`}
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
                      connectNulls
                      legendType="none"
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
                      connectNulls
                      legendType="none"
                    />
                  </>
                )}
              </React.Fragment>
            );
          })}

          {/* Reference lines for context */}
          <ReferenceLine y={0} stroke="#666" strokeWidth={1} />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 text-xs text-physio-text-tertiary text-center">
        Based on: Bhasin et al. (clinical), Yarrow et al. (animal), forum aggregates, pharmacological theory. NOT medical advice. See methodology for limitations.
      </div>
    </div>
  );
};

export default DoseResponseChart;
