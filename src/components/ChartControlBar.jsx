import React from 'react';
import ViewToggle from './ViewToggle';

const ChartControlBar = ({ viewMode, setViewMode }) => {
  return (
    <div className="sticky top-16 z-10 mb-4">
      <div className="bg-physio-bg-secondary/90 border border-physio-bg-border rounded-3xl shadow-physio-subtle px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] uppercase tracking-[0.3em] text-physio-text-tertiary">
            Spotlight mode
          </p>
          <p className="text-xs text-physio-text-secondary">
            Benefit · Risk · Efficiency · Uncertainty
          </p>
        </div>
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      </div>
    </div>
  );
};

export default ChartControlBar;
