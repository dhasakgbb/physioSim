import React, { useState } from 'react';
import { compoundData } from '../data/compoundData';
import { findSweetSpotRange } from '../utils/sweetSpot';

const formatRange = (range) => {
  if (!range) return 'n/a';
  const [start, end] = range;
  if (start === end) return `${start}`;
  return `${start}–${end}`;
};

const SweetSpotFinder = ({ compoundType, visibleCompounds, userProfile }) => {
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle');

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
    <div className="min-w-[220px]">
      <button
        onClick={handleFind}
        className="px-4 py-2 rounded-lg bg-physio-accent-cyan text-physio-bg-core font-semibold text-sm hover:bg-physio-accent-cyan/80 transition-standard shadow-md"
      >
        Find my sweet spot
      </button>

      {status === 'no-visible' && (
        <p className="text-xs text-physio-text-tertiary mt-2">
          Turn on at least one compound to run the optimizer.
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-3">
          {results.map(result => (
            <div
              key={result.compoundKey}
              className="border border-physio-bg-border rounded-lg p-3 bg-physio-bg-secondary text-xs shadow-inner"
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
