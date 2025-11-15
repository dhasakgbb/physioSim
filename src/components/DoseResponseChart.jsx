import React, { useRef, useState, useMemo } from 'react';
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

const DoseResponseChart = ({
  viewMode,
  visibleCompounds,
  userProfile,
  highlightedCompound = null
}) => {
  const chartRef = useRef(null);
  const [zoomDomain, setZoomDomain] = useState({ x: [0, 1200], y: [0, 5.5] });
  const injectableCompounds = useMemo(
    () => Object.entries(compoundData).filter(([, compound]) => compound.type === 'injectable'),
    []
  );

  // Prepare data for Recharts - merge all doses from injectable compounds only
  // Only show data where we actually have it (scientifically honest)
  const prepareChartData = () => {
    const allDoses = new Set();
    
    // Collect all dose points from INJECTABLE compounds only
    injectableCompounds.forEach(([, compound]) => {
      compound.benefitCurve.forEach(point => allDoses.add(point.dose));
      compound.riskCurve.forEach(point => allDoses.add(point.dose));
    });

    const sortedDoses = Array.from(allDoses).sort((a, b) => a - b);
    const lastBenefit = {};
    const lastRisk = {};
    
    return sortedDoses.map(dose => {
      const dataPoint = { dose };
      
      injectableCompounds.forEach(([key, compound]) => {
        
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

        const benefitValue = dataPoint[`${key}-benefit-value`];
        const riskValue = dataPoint[`${key}-risk-value`];
        if (benefitValue !== undefined && riskValue !== undefined) {
          const eff = riskValue > 0.1 ? benefitValue / riskValue : benefitValue;
          dataPoint[`${key}-efficiency-value`] = Number(eff.toFixed(3));
        }
      });
      
      return dataPoint;
    });
  };

  const chartData = prepareChartData();

  const handleDoubleClick = () => {
    setZoomDomain({ x: [0, 1200], y: [0, 5.5] });
  };

  const mode = viewMode || 'benefit';
  const showBenefit = mode === 'benefit';
  const showRisk = mode === 'risk';
  const showEfficiency = mode === 'efficiency';
  const showUncertainty = mode === 'uncertainty';
  const showPlateau = showBenefit || showEfficiency;

  return (
    <div
      ref={chartRef}
      className="relative overflow-hidden rounded-[32px] border border-physio-bg-border/70 bg-gradient-to-br from-physio-bg-secondary/95 via-physio-bg-core/85 to-physio-bg-secondary/70 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
      onDoubleClick={handleDoubleClick}
    >
      <div className="pointer-events-none absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_20%_20%,rgba(75,187,247,0.12),transparent_60%)]" />
      <div className="relative z-10">
        <div className="mb-4">
        <h2 className="text-2xl font-bold text-physio-text-primary">
          AAS Spotlight View · {
            mode === 'benefit'
              ? 'Benefit Curve'
              : mode === 'risk'
              ? 'Risk Curve'
              : mode === 'efficiency'
              ? 'Efficiency (Benefit ÷ Risk)'
              : 'Uncertainty Bands'
          }
        </h2>
        <p className="text-sm text-physio-text-secondary mt-1">
          {mode === 'benefit' && 'Thin bezier lines show personalized anabolic response with plateau shading.'}
          {mode === 'risk' && 'Under-curve fill visualizes cumulative burden (lipids, cardio, hepatic, neuro).'}
          {mode === 'efficiency' && 'Ratio line highlights the true sweet spot — higher means more benefit per unit of risk.'}
          {mode === 'uncertainty' && 'Only the mist bands render, so you can gauge confidence without signal overload.'}
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
          <defs>
            {injectableCompounds.map(([key, compound]) => (
              <React.Fragment key={`defs-${key}`}>
                <linearGradient id={`inj-benefit-mist-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={hexToRgba(compound.color, 0.35)} />
                  <stop offset="100%" stopColor={hexToRgba(compound.color, 0.05)} />
                </linearGradient>
                <linearGradient id={`inj-risk-fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={hexToRgba('#ff6b6b', 0.45)} />
                  <stop offset="60%" stopColor={hexToRgba(compound.color, 0.18)} />
                  <stop offset="100%" stopColor={hexToRgba(compound.color, 0.02)} />
                </linearGradient>
                <linearGradient id={`inj-uncertainty-mist-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={hexToRgba('#45E2AB', 0.35)} />
                  <stop offset="100%" stopColor={hexToRgba('#45E2AB', 0)} />
                </linearGradient>
              </React.Fragment>
            ))}
          </defs>
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
                mode={mode}
              />
            )}
            cursor={{ stroke: 'var(--physio-accent-cyan)', strokeDasharray: '4 4' }}
          />

          {/* Render uncertainty bands and lines for each compound */}
          {injectableCompounds.map(([key, compound]) => {
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
            const benefitMistFill = `url(#inj-benefit-mist-${key})`;
            const riskGradientFill = `url(#inj-risk-fill-${key})`;
            const uncertaintyMistFill = `url(#inj-uncertainty-mist-${key})`;
            const strokeOpacity = guardrailActive ? (isHighlighted ? 1 : 0.18) : 1;
            const mutedStrokeOpacity = guardrailActive ? (isHighlighted ? 0.65 : 0.12) : 0.65;
            const mistFillOpacity = guardrailActive ? (isHighlighted ? 0.85 : 0.12) : 0.5;
            const riskFillOpacity = guardrailActive ? (isHighlighted ? 0.9 : 0.15) : 0.65;
            const uncertaintyFillOpacity = guardrailActive ? (isHighlighted ? 0.75 : 0.1) : 0.35;
            const benefitStrokeWidth = isHighlighted ? 3.2 : 2.4;
            const riskStrokeWidth = isHighlighted ? 3 : 2.2;
            const efficiencyStrokeWidth = isHighlighted ? 3.4 : 2.6;
            const beyondStrokeOpacity = guardrailActive ? (isHighlighted ? 1 : 0.25) : 1;

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
                      fill={benefitMistFill}
                      fillOpacity={mistFillOpacity}
                      isAnimationActive={false}
                    />
                    <Area
                      dataKey={`${key}-benefit-lower`}
                      stroke="none"
                      fill={benefitMistFill}
                      fillOpacity={mistFillOpacity}
                      isAnimationActive={false}
                    />
                    
                    <Line
                      type="monotone"
                      dataKey={`${key}-benefit-pre`}
                      stroke={compound.color}
                      strokeWidth={benefitStrokeWidth}
                      strokeOpacity={strokeOpacity}
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
                      strokeWidth={benefitStrokeWidth}
                      strokeOpacity={mutedStrokeOpacity}
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
                      strokeOpacity={beyondStrokeOpacity}
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
                      fill={riskGradientFill}
                      fillOpacity={riskFillOpacity}
                      isAnimationActive={false}
                    />
                    <Area
                      dataKey={`${key}-risk-lower`}
                      stroke="none"
                      fill={riskGradientFill}
                      fillOpacity={riskFillOpacity}
                      isAnimationActive={false}
                    />
                    
                    <Line
                      type="monotone"
                      dataKey={`${key}-risk-pre`}
                      stroke={compound.color}
                      strokeWidth={riskStrokeWidth}
                      strokeDasharray="5 5"
                      strokeOpacity={strokeOpacity}
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
                      strokeWidth={riskStrokeWidth - 0.4}
                      strokeDasharray="2 2"
                      strokeOpacity={mutedStrokeOpacity}
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

                {/* UNCERTAINTY-ONLY MODE */}
                {showUncertainty && (
                  <>
                    <Area
                      dataKey={`${key}-benefit-upper`}
                      stroke="none"
                      fill={uncertaintyMistFill}
                      fillOpacity={uncertaintyFillOpacity}
                      isAnimationActive={false}
                    />
                    <Area
                      dataKey={`${key}-benefit-lower`}
                      stroke="none"
                      fill={uncertaintyMistFill}
                      fillOpacity={uncertaintyFillOpacity}
                      isAnimationActive={false}
                    />
                    <Area
                      dataKey={`${key}-risk-upper`}
                      stroke="none"
                      fill={uncertaintyMistFill}
                      fillOpacity={uncertaintyFillOpacity}
                      isAnimationActive={false}
                    />
                    <Area
                      dataKey={`${key}-risk-lower`}
                      stroke="none"
                      fill={uncertaintyMistFill}
                      fillOpacity={uncertaintyFillOpacity}
                      isAnimationActive={false}
                    />
                  </>
                )}

                {showEfficiency && (
                  <Line
                    type="monotone"
                    dataKey={`${key}-efficiency-value`}
                    stroke={compound.color}
                    strokeWidth={efficiencyStrokeWidth}
                    strokeOpacity={strokeOpacity}
                    dot={false}
                    isAnimationActive={false}
                    name={`${compound.abbreviation} Efficiency`}
                  />
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
