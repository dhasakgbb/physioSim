import React from 'react';
import Slider from '../ui/Slider';
import Badge from '../ui/Badge';
import { compoundData } from '../../data/compoundData';

const InteractionDoseSliders = ({
  pair,
  doses,
  onDoseChange,
  primaryCompound,
  onPrimaryChange,
  guardrails = {},
  metrics = {}
}) => {
  if (!pair) return null;

  const renderSlider = (compoundKey) => {
    const meta = compoundData[compoundKey];
    const currentDose = doses[compoundKey] || 0;
    const [min, max] = pair.doseRanges?.[compoundKey] || [0, 1000];
    const defaultDose = pair.defaultDoses?.[compoundKey];
    
    const guardrail = guardrails[compoundKey];
    const plateauDose = guardrail?.meta?.benefit?.plateauDose || guardrail?.meta?.risk?.plateauDose;
    const hardMax = guardrail?.meta?.benefit?.hardMax || guardrail?.meta?.risk?.hardMax;
    
    const markers = [
      defaultDose ? { value: defaultDose, label: 'Ref', tone: 'muted' } : null,
      plateauDose ? { value: plateauDose, label: 'Plateau', tone: 'warning' } : null,
      hardMax ? { value: hardMax, label: 'Cap', tone: 'error' } : null
    ].filter(Boolean);

    const isPrimary = primaryCompound === compoundKey;

    return (
      <div key={compoundKey} className="w-full p-4 rounded-xl bg-physio-bg-core border border-physio-bg-border transition-colors hover:border-physio-bg-border/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-physio-text-primary">{meta?.name || compoundKey}</span>
            <button
              onClick={() => onPrimaryChange(compoundKey)}
              className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                isPrimary 
                  ? 'border-physio-accent-cyan text-physio-accent-cyan bg-physio-accent-cyan/5' 
                  : 'border-physio-bg-border text-physio-text-tertiary hover:text-physio-text-primary'
              }`}
              title="Set as primary axis for charts"
            >
              {isPrimary ? 'Primary Axis' : 'Set Axis'}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {guardrail?.beyond && <Badge variant="critical" size="sm">Beyond Evidence</Badge>}
            {guardrail?.nearingPlateau && <Badge variant="warning" size="sm">Plateau Near</Badge>}
          </div>
        </div>
        
        <Slider
          value={currentDose}
          min={min}
          max={max}
          step={meta?.type === 'oral' ? 2 : 10}
          unit="mg"
          markers={markers}
          onChange={(val) => onDoseChange(compoundKey, val)}
        />
      </div>
    );
  };

  const MetricRow = ({ label, value, unit, tone = 'neutral' }) => {
    const toneColors = {
      neutral: 'text-physio-text-primary',
      success: 'text-physio-accent-mint',
      warning: 'text-physio-warning',
      error: 'text-physio-error',
      info: 'text-physio-accent-cyan'
    };
    return (
      <div className="flex justify-between items-center text-sm">
        <span className="text-physio-text-secondary">{label}</span>
        <span className={`font-semibold ${toneColors[tone]}`}>
          {value} {unit && <span className="text-xs font-normal text-physio-text-tertiary">{unit}</span>}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sliders */}
      <div className="flex flex-col gap-4 flex-1">
        {pair.compounds.map(renderSlider)}
      </div>

      {/* Live Metrics Panel */}
      <div className="lg:w-64 flex flex-col gap-4 py-2">
        <div className="space-y-3 bg-physio-bg-secondary/50 rounded-xl p-4 border border-physio-bg-border">
          <h4 className="text-xs uppercase tracking-wide text-physio-text-tertiary font-semibold">Live Impact</h4>
          
          <MetricRow 
            label="Net Benefit" 
            value={metrics.adjustedBenefit?.toFixed(2)} 
            tone="success" 
          />
          <MetricRow 
            label="Net Risk" 
            value={metrics.adjustedRisk?.toFixed(2)} 
            tone={metrics.adjustedRisk > 4 ? 'error' : 'warning'} 
          />
          <div className="h-px bg-physio-bg-border" />
          <MetricRow 
            label="Ratio" 
            value={metrics.adjustedRatio?.toFixed(2)} 
            tone="info" 
          />
          <MetricRow 
            label="Net Score" 
            value={(metrics.netScore || 0).toFixed(2)} 
            tone={(metrics.netScore || 0) >= 0 ? 'success' : 'error'} 
          />
        </div>

        <div className="space-y-2 px-1">
          <p className="text-xs text-physio-text-tertiary leading-relaxed">
            Adjust doses to find the sweet spot where benefit maximizes before risk accelerates.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InteractionDoseSliders;

