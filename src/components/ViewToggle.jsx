import React from 'react';

const ViewToggle = ({ viewMode, setViewMode }) => {
  const modes = [
    { id: 'integrated', label: 'Benefit + Risk', tag: 'recommended' },
    { id: 'benefit', label: 'Benefit only' },
    { id: 'risk', label: 'Risk only' }
  ];

  return (
    <fieldset
      className="flex flex-wrap items-center gap-2"
      role="radiogroup"
      aria-label="Chart view mode"
    >
      <legend className="sr-only">Chart view mode</legend>
      {modes.map(mode => (
        <label
          key={mode.id}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-standard ${
            viewMode === mode.id
              ? 'bg-physio-bg-tertiary border-physio-accent-cyan text-physio-accent-cyan shadow-sm'
              : 'border-physio-bg-border text-physio-text-secondary hover:border-physio-text-tertiary hover:text-physio-text-primary'
          }`}
        >
          <input
            type="radio"
            name="viewMode"
            value={mode.id}
            checked={viewMode === mode.id}
            onChange={() => setViewMode(mode.id)}
            className="sr-only"
          />
          <span className="font-medium">{mode.label}</span>
          {mode.tag && (
            <span className="px-2 py-0.5 text-[11px] uppercase tracking-wide bg-physio-accent-mint text-physio-bg-core rounded-full font-semibold">
              {mode.tag}
            </span>
          )}
        </label>
      ))}
    </fieldset>
  );
};

export default ViewToggle;
