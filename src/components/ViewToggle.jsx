import React from 'react';

const ViewToggle = ({ viewMode, setViewMode }) => {
  const modes = [
    { id: 'integrated', label: 'Benefit + Risk', tag: 'recommended' },
    { id: 'benefit', label: 'Benefit only' },
    { id: 'risk', label: 'Risk only' }
  ];

  return (
    <div className="bg-physio-bg-secondary rounded-lg p-4 shadow-physio-subtle border border-physio-bg-border mb-6">
      <label className="block text-sm font-semibold text-physio-text-secondary mb-3">
        Show:
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        {modes.map(mode => (
          <label
            key={mode.id}
            className={`flex items-center px-4 py-2.5 rounded-md cursor-pointer transition-standard border-2 ${
              viewMode === mode.id
                ? 'bg-physio-bg-tertiary border-physio-accent-cyan text-physio-accent-cyan'
                : 'bg-physio-bg-secondary border-physio-bg-border text-physio-text-secondary hover:border-physio-text-tertiary hover:bg-physio-bg-tertiary'
            }`}
          >
            <input
              type="radio"
              name="viewMode"
              value={mode.id}
              checked={viewMode === mode.id}
              onChange={() => setViewMode(mode.id)}
              className="w-4 h-4 text-physio-accent-cyan focus:ring-physio-accent-cyan accent-physio-accent-cyan"
            />
            <span className="ml-2 font-medium">{mode.label}</span>
            {mode.tag && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-physio-accent-mint text-physio-bg-core rounded-full font-semibold">
                {mode.tag}
              </span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
};

export default ViewToggle;

