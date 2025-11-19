import React from 'react';
import ViewToggle from './ViewToggle';

const ChartControlBar = ({ viewMode, setViewMode }) => {
  return (
    <div className="flex items-center justify-between py-2 mb-2 border-b border-physio-border-subtle/50">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-physio-text-secondary uppercase tracking-wider">
          View Mode
        </span>
      </div>
      <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
    </div>
  );
};

export default ChartControlBar;
