import React from 'react';
import ViewToggle from './ViewToggle';

const ChartControlBar = ({ viewMode, setViewMode }) => {
  return (
    <div className="sticky top-16 z-10 mb-4">
      <div className="rounded-[28px] border border-physio-bg-border/70 bg-gradient-to-r from-physio-bg-secondary/90 via-physio-bg-core/80 to-physio-bg-secondary/70 shadow-[0_20px_50px_rgba(0,0,0,0.45)] px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] uppercase tracking-[0.3em] text-physio-text-tertiary">
            View mode
          </p>
          <p className="text-xs text-physio-text-secondary">
            Benefit · Risk · Efficiency · Noise
          </p>
        </div>
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      </div>
    </div>
  );
};

export default ChartControlBar;
