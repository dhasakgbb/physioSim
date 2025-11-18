import React from 'react';
import ViewToggle from './ViewToggle';

const ChartControlBar = ({ viewMode, setViewMode }) => {
  return (
    <div className="flex items-center justify-between py-2 mb-2 border-b border-physio-border-subtle/50">
      <div className="flex items-baseline gap-3">
        <span className="text-xs font-bold text-physio-text-secondary uppercase tracking-wider">
          Metric Lens
        </span>
        <p className="text-xs text-physio-text-tertiary hidden sm:block">
           {viewMode === 'benefit' && 'Anabolic Response Curves'}
           {viewMode === 'risk' && 'Cumulative Health Burden'}
           {viewMode === 'efficiency' && 'Benefit-to-Risk Ratio'}
           {viewMode === 'uncertainty' && 'Confidence Interval Bands'}
        </p>
      </div>
      <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
    </div>
  );
};

export default ChartControlBar;
