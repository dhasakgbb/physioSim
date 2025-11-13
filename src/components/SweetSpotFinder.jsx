import React, { useState } from 'react';
import { compoundData } from '../data/compoundData';
import { findSweetSpotRange } from '../utils/sweetSpot';

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
          Find my sweet spot
        </button>

        {status === 'no-visible' && (
          <p className="text-xs text-physio-text-tertiary">
            Turn on a compound to run the optimizer.
          </p>
        )}
      </div>

      {results.length > 0 && (
        <div className={`grid grid-cols-1 gap-3 text-xs ${inline ? 'pt-2 border-t border-dashed border-physio-bg-border/70' : 'mt-3'}`}>
          {results.map(result => (
            <div
              key={result.compoundKey}
              className="border border-physio-bg-border rounded-lg p-3 bg-physio-bg-secondary shadow-inner"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-physio-text-primary">
                  {result.abbreviation}
                </span>
                <span className="text-physio-text-secondary">
                  Peak @ {result.peakDose} {result.unit}
                </span>
              </div>
              <p className="text-physio-text-primary">
                Your statistical optimum dose range is{' '}
                <strong>{formatRange(result.optimalRange)} {result.unit}</strong>.
              </p>
              {result.warningDose && (
                <p className="text-physio-error mt-1">
                  Above {result.warningDose} {result.unit} your risk accelerates faster than benefit.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SweetSpotFinder;
