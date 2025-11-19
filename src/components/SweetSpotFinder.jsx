import React, { useState } from 'react';
import { compoundData } from '../data/compoundData';
import { findSweetSpotRange } from '../utils/sweetSpot';
import { deriveDoseWindow } from '../utils/doseWindows';

const formatRange = (range) => {
  if (!range) return 'n/a';
  const [start, end] = range;
  if (start === end) return `${start}`;
  return `${start}–${end}`;
};

const SweetSpotFinder = ({
  compoundType,
  visibleCompounds,
  userProfile,
  variant = 'panel'
}) => {
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle');
  const inline = variant === 'inline';

  const handleFind = () => {
    const applicable = Object.entries(compoundData)
      .filter(([key, data]) => data.type === compoundType && visibleCompounds[key]);

    if (!applicable.length) {
      setResults([]);
      setStatus('no-visible');
      return;
    }

    const computed = applicable.map(([key]) => findSweetSpotRange(key, userProfile)).filter(Boolean);
    setResults(computed);
    setStatus('done');
  };

  return (
    <div className={inline ? 'flex flex-col gap-2 flex-1 min-w-[220px]' : 'min-w-[220px]'}>
      <div
        className={inline
          ? 'flex flex-wrap items-center gap-2 justify-start md:justify-end'
          : 'flex flex-col gap-2'}
      >
        <button
          onClick={handleFind}
          className={`font-semibold text-sm transition-standard shadow-md ${
            inline
              ? 'px-4 py-2 rounded-full bg-physio-accent-cyan text-white hover:bg-physio-accent-cyan/85'
              : 'px-4 py-2 rounded-lg bg-physio-accent-cyan text-physio-bg-core hover:bg-physio-accent-cyan/80'
          }`}
        >
          Sweet spot
        </button>

        {status === 'no-visible' && (
          <p className="text-xs text-physio-text-tertiary">
            Turn on a compound to run the optimizer.
          </p>
        )}
      </div>

      {results.length > 0 && (
        <div className={`grid grid-cols-1 gap-3 text-xs ${inline ? 'pt-2 border-t border-dashed border-physio-bg-border/70' : 'mt-3'}`}>
          {results.map(result => {
            const doseWindow = deriveDoseWindow(result.compoundKey);
            const rangeStartPct = ((result.optimalRange[0] - doseWindow.min) / (doseWindow.max - doseWindow.min)) * 100;
            const rangeWidthPct = ((result.optimalRange[1] - result.optimalRange[0]) / (doseWindow.max - doseWindow.min)) * 100;
            
            return (
              <div
                key={result.compoundKey}
                className="border border-physio-border-subtle rounded-2xl p-3.5 bg-physio-bg-surface shadow-inner space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-physio-text-primary">
                    {result.abbreviation}
                  </span>
                  <span className="text-physio-text-secondary text-sm">
                    Peak @ {result.peakDose} {result.unit}
                  </span>
                </div>
                
                {/* Visual Range Indicator */}
                <div className="relative h-6 w-full bg-physio-bg-highlight rounded-full overflow-hidden">
                  {/* Optimal Range Bar */}
                  <div 
                    className="absolute h-full bg-physio-accent-success/30 border-x border-physio-accent-success"
                    style={{ left: `${rangeStartPct}%`, width: `${rangeWidthPct}%` }}
                  />
                  {/* Peak Marker */}
                  <div 
                    className="absolute h-full w-0.5 bg-physio-accent-success top-0"
                    style={{ left: `${((result.peakDose - doseWindow.min) / (doseWindow.max - doseWindow.min)) * 100}%` }}
                  />
                  {/* Warning Marker */}
                  {result.warningDose && (
                    <div 
                      className="absolute h-full w-0.5 bg-physio-accent-critical top-0"
                      style={{ left: `${((result.warningDose - doseWindow.min) / (doseWindow.max - doseWindow.min)) * 100}%` }}
                    />
                  )}
                </div>

                <p className="text-physio-text-primary text-xs">
                  Optimal window: <strong>{formatRange(result.optimalRange)} {result.unit}</strong>
                  {doseWindow?.min !== undefined && ` • Guardrail ${doseWindow.min}-${doseWindow.max} ${result.unit}`}
                </p>
                {result.warningDose && (
                  <p className="text-physio-accent-critical text-[11px]">
                    Above {result.warningDose} {result.unit} risk outpaces benefit.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SweetSpotFinder;
