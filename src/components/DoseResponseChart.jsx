import React, { useRef, useState } from 'react';
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { compoundData } from '../data/compoundData';

const DoseResponseChart = ({ viewMode, visibleCompounds }) => {
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
    
    return sortedDoses.map(dose => {
      const dataPoint = { dose };
      
      Object.entries(compoundData).forEach(([key, compound]) => {
        if (compound.type !== 'injectable') return;
        
        // Benefit data - only show where we have data
        const benefitPoint = compound.benefitCurve.find(p => p.dose === dose);
        if (benefitPoint) {
          dataPoint[`${key}-benefit-value`] = benefitPoint.value;
          dataPoint[`${key}-benefit-upper`] = benefitPoint.value + benefitPoint.ci;
          dataPoint[`${key}-benefit-lower`] = Math.max(0, benefitPoint.value - benefitPoint.ci);
        }
        
        // Risk data - only show where we have data
        const riskPoint = compound.riskCurve.find(p => p.dose === dose);
        if (riskPoint) {
          dataPoint[`${key}-risk-value`] = riskPoint.value;
          dataPoint[`${key}-risk-upper`] = riskPoint.value + riskPoint.ci;
          dataPoint[`${key}-risk-lower`] = Math.max(0, riskPoint.value - riskPoint.ci);
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

          {/* Render uncertainty bands and lines for each compound */}
          {Object.entries(compoundData).map(([key, compound]) => {
            // Only render injectable compounds on this chart
            if (compound.type !== 'injectable') return null;
            if (!visibleCompounds[key]) return null;

            return (
              <React.Fragment key={key}>
                {/* BENEFIT CURVES */}
                {showBenefit && (
                  <>
                    {/* Benefit uncertainty band */}
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
                    
                    {/* Benefit line (solid) */}
                    <Line
                      type="monotone"
                      dataKey={`${key}-benefit-value`}
                      stroke={compound.color}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={false}
                      isAnimationActive={false}
                      connectNulls
                    />
                  </>
                )}

                {/* RISK CURVES */}
                {showRisk && (
                  <>
                    {/* Risk uncertainty band */}
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
                    
                    {/* Risk line (dotted) */}
                    <Line
                      type="monotone"
                      dataKey={`${key}-risk-value`}
                      stroke={compound.color}
                      strokeWidth={2.5}
                      strokeDasharray="5 5"
                      dot={false}
                      activeDot={false}
                      isAnimationActive={false}
                      connectNulls
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

