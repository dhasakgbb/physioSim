import React, { useRef, useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
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
      className="h-full w-full relative"
      onDoubleClick={handleDoubleClick}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
        >
        <defs>
          {injectableCompounds.map(([key, compound]) => (
            <React.Fragment key={`defs-${key}`}>
              <linearGradient id={`inj-benefit-mist-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={hexToRgba(compound.color, 0.2)} />
                <stop offset="100%" stopColor={hexToRgba(compound.color, 0)} />
              </linearGradient>
              <linearGradient id={`inj-risk-fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={hexToRgba('#ef4444', 0.35)} />
                <stop offset="60%" stopColor={hexToRgba(compound.color, 0.1)} />
                <stop offset="100%" stopColor={hexToRgba(compound.color, 0)} />
              </linearGradient>
              <linearGradient id={`inj-uncertainty-mist-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={hexToRgba('#10b981', 0.25)} />
                <stop offset="100%" stopColor={hexToRgba('#10b981', 0)} />
              </linearGradient>
            </React.Fragment>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--physio-border-subtle)" strokeOpacity={0.4} vertical={false} />
        
        <XAxis
          dataKey="dose"
          type="number"
          domain={zoomDomain.x}
          label={{
            value: 'Weekly Dose (mg)',
            position: 'insideBottom',
            offset: -10,
            style: { fontSize: 11, fontWeight: 600, fill: 'var(--physio-text-secondary)', fontFamily: 'Inter, sans-serif' }
          }}
          tick={{ fontSize: 10, fill: 'var(--physio-text-tertiary)', fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={{ stroke: 'var(--physio-border-strong)' }}
          tickLine={false}
          tickMargin={8}
        />
        
        <YAxis
          domain={zoomDomain.y}
          label={{
            value: 'Score (0-5.5)',
            angle: -90,
            position: 'insideLeft',
            style: { fontSize: 11, fontWeight: 600, fill: 'var(--physio-text-secondary)', fontFamily: 'Inter, sans-serif' }
          }}
          tick={{ fontSize: 10, fill: 'var(--physio-text-tertiary)', fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={{ stroke: 'var(--physio-border-strong)' }}
          tickLine={false}
          tickMargin={8}
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
          cursor={{ stroke: 'var(--physio-accent-cyan)', strokeDasharray: '4 4', strokeOpacity: 0.5 }}
        />

        {/* Render uncertainty bands and lines for each compound */}
        {injectableCompounds.map(([key, compound]) => {
          if (!visibleCompounds[key]) return null;
          const plateauDose = getPlateauDose(compound);
          const hardMax = getHardMax(compound);
          const guardrailActive = Boolean(highlightedCompound);
          const isHighlighted = highlightedCompound === key;
          
          // Visual tuning for "Obsidian Pro" feel
          const strokeOpacity = guardrailActive ? (isHighlighted ? 1 : 0.1) : 0.9;
          const mutedStrokeOpacity = guardrailActive ? (isHighlighted ? 0.6 : 0.08) : 0.5;
          const mistFillOpacity = guardrailActive ? (isHighlighted ? 0.6 : 0.05) : 0.3;
          const riskFillOpacity = guardrailActive ? (isHighlighted ? 0.7 : 0.1) : 0.5;
          const uncertaintyFillOpacity = guardrailActive ? (isHighlighted ? 0.6 : 0.05) : 0.2;
          const benefitStrokeWidth = isHighlighted ? 2.5 : 2;
          const riskStrokeWidth = isHighlighted ? 2.2 : 1.5;
          const efficiencyStrokeWidth = isHighlighted ? 2.5 : 1.8;
          const beyondStrokeOpacity = guardrailActive ? (isHighlighted ? 0.8 : 0.15) : 0.7;

          // Fill definitions
          const benefitMistFill = `url(#inj-benefit-mist-${key})`;
          const riskGradientFill = `url(#inj-risk-fill-${key})`;
          const uncertaintyMistFill = `url(#inj-uncertainty-mist-${key})`;

          return (
            <React.Fragment key={key}>
              {showPlateau && plateauDose && (
                <ReferenceLine
                  x={plateauDose}
                  stroke="var(--physio-accent-amber)"
                  strokeDasharray="2 2"
                  strokeOpacity={isHighlighted ? 0.6 : 0}
                  label={isHighlighted ? {
                    value: 'Plateau',
                    position: 'insideTopRight',
                    fill: 'var(--physio-accent-amber)',
                    fontSize: 10,
                    offset: 10,
                    fontFamily: 'JetBrains Mono, monospace'
                  } : null}
                />
              )}
              {showPlateau && hardMax && (
                <ReferenceLine
                  x={hardMax}
                  stroke="var(--physio-accent-red)"
                  strokeDasharray="3 3"
                  strokeOpacity={isHighlighted ? 0.5 : 0}
                  label={isHighlighted ? {
                    value: 'Cap',
                    position: 'insideTopRight',
                    fill: 'var(--physio-accent-red)',
                    fontSize: 10,
                    offset: 5,
                    fontFamily: 'JetBrains Mono, monospace'
                  } : null}
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
                    activeDot={{ r: 4, strokeWidth: 0, fill: 'white' }}
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
                    stroke="var(--physio-accent-red)"
                    strokeWidth={2}
                    strokeOpacity={beyondStrokeOpacity}
                    strokeDasharray="3 3"
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
                    strokeDasharray="4 4"
                    strokeOpacity={strokeOpacity}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: 'white' }}
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
                    stroke="var(--physio-accent-red)"
                    strokeWidth={2}
                    strokeDasharray="2 2"
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
        <ReferenceLine y={0} stroke="var(--physio-border-strong)" strokeWidth={1} />
      </LineChart>
    </ResponsiveContainer>
    </div>
  );
};

export default DoseResponseChart;
