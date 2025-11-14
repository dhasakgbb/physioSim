import React from 'react';

const ViewToggle = ({ viewMode, setViewMode }) => {
  const modes = [
    { id: 'benefit', label: 'Benefit Curve', description: 'Pure anabolic signal' },
    { id: 'risk', label: 'Risk Curve', description: 'Under-curve burden' },
    { id: 'efficiency', label: 'Efficiency Mode', description: 'Benefit ÷ Risk' },
    { id: 'uncertainty', label: 'Uncertainty', description: 'Noise bands only' }
  ];

  return (
    <fieldset
      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
      role="radiogroup"
      aria-label="Chart view mode"
    >
      <legend className="sr-only">Chart view mode</legend>
      {modes.map(mode => (
        <label
          key={mode.id}
          className={`flex flex-col gap-1 px-4 py-2 rounded-2xl border cursor-pointer transition-all duration-150 shadow-sm ${
            viewMode === mode.id
              ? 'bg-physio-bg-tertiary/80 border-physio-accent-cyan text-physio-text-primary shadow-physio-subtle'
              : 'border-physio-bg-border text-physio-text-secondary hover:border-physio-text-tertiary/50'
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
          <span className="text-sm font-semibold">{mode.label}</span>
          {mode.description && (
            <span className="text-xs text-physio-text-tertiary">{mode.description}</span>
          )}
        </label>
      ))}
    </fieldset>
  );
};

export default ViewToggle;
