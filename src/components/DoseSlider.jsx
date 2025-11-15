import React, { useMemo, useState } from 'react';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const markerToneClasses = {
  muted: 'bg-physio-bg-border text-physio-text-tertiary',
  accent: 'bg-physio-accent-cyan text-physio-accent-cyan',
  warning: 'bg-physio-warning text-physio-warning',
  error: 'bg-physio-error text-physio-error'
};

const DEFAULT_MARKER_TONE = 'muted';

const getPercent = (value, min, max) => {
  if (max <= min) return 0;
  return ((value - min) / (max - min)) * 100;
};

const DoseSlider = ({
  id,
  name,
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  unit = 'mg',
  markers = [],
  disabled = false,
  onChange,
  ariaLabel,
  labelFormatter,
  range = false
}) => {
  const isRange = range || Array.isArray(value);
  const normalizedValue = useMemo(() => {
    if (isRange) {
      const [start = min, end = max] = Array.isArray(value) ? value : [min, max];
      const clampedStart = clamp(Number(start), min, max);
      const clampedEnd = clamp(Number(end), min, max);
      return [Math.min(clampedStart, clampedEnd), Math.max(clampedStart, clampedEnd)];
    }
    return clamp(Number(value ?? min), min, max);
  }, [isRange, max, min, value]);

  const [tooltip, setTooltip] = useState({ visible: false, percent: 0, value: min });
  const formatter = labelFormatter || (val => `${Math.round(val)} ${unit}`);

  const progress = useMemo(() => {
    if (isRange) {
      const [start, end] = normalizedValue;
      return {
        start: getPercent(start, min, max),
        end: getPercent(end, min, max)
      };
    }
    return {
      start: 0,
      end: getPercent(normalizedValue, min, max)
    };
  }, [isRange, max, min, normalizedValue]);

  const updateTooltip = (val) => {
    const nextPercent = getPercent(val, min, max);
    setTooltip({ visible: true, percent: nextPercent, value: val });
  };

  const hideTooltip = () => setTooltip(prev => ({ ...prev, visible: false }));

  const emitChange = (nextValue) => {
    if (disabled || typeof onChange !== 'function') return;
    if (isRange) {
      const [start, end] = nextValue;
      onChange([clamp(start, min, max), clamp(end, min, max)]);
      return;
    }
    onChange(clamp(nextValue, min, max));
  };

  const handleSingleChange = (event) => {
    const next = Number(event.target.value);
    if (Number.isNaN(next)) return;
    emitChange(next);
    updateTooltip(next);
  };

  const handleRangeChange = (event, thumbIndex) => {
    const next = Number(event.target.value);
    if (Number.isNaN(next)) return;
    const [start, end] = normalizedValue;
    const updated = thumbIndex === 0 ? [next, end] : [start, next];
    emitChange(updated);
    updateTooltip(next);
  };

  const sharedInputProps = {
    min,
    max,
    step,
    disabled,
    className: 'physio-range relative z-10 w-full cursor-pointer',
    onBlur: hideTooltip,
    onMouseLeave: hideTooltip,
    name
  };

  const markerElements = markers
    .filter(marker => typeof marker?.value === 'number')
    .map(marker => {
      const percent = getPercent(marker.value, min, max);
      return (
        <div
          key={`${marker.label || 'marker'}-${marker.value}`}
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: `${percent}%` }}
        >
          <span
            className={`block h-2 w-2 rounded-full ${markerToneClasses[marker.tone || DEFAULT_MARKER_TONE]}`}
            title={marker.label || `${marker.value} ${unit}`}
          ></span>
          {marker.label && (
            <span className="mt-1 block text-[10px] font-semibold text-physio-text-tertiary text-center">
              {marker.label}
            </span>
          )}
        </div>
      );
    });

  return (
    <div className="w-full">
      <div className="relative py-4">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-physio-bg-border/40">
          {isRange ? (
            <div
              className="absolute h-full rounded-full bg-gradient-to-r from-physio-accent-cyan via-physio-accent-mint to-physio-accent-violet"
              style={{
                left: `${progress.start}%`,
                width: `${Math.max(0, progress.end - progress.start)}%`
              }}
            />
          ) : (
            <div
              className="absolute h-full rounded-full bg-gradient-to-r from-physio-accent-cyan via-physio-accent-mint to-physio-accent-violet"
              style={{ width: `${progress.end}%` }}
            />
          )}
          {markerElements}
        </div>

        {!isRange && (
          <input
            type="range"
            id={id}
            aria-label={ariaLabel || unit}
            value={normalizedValue}
            onChange={handleSingleChange}
            onFocus={() => updateTooltip(normalizedValue)}
            onMouseMove={event => {
              const next = Number(event.target.value);
              if (!Number.isNaN(next)) updateTooltip(next);
            }}
            {...sharedInputProps}
          />
        )}

        {isRange && (
          <>
            <input
              type="range"
              id={id}
              aria-label={ariaLabel ? `${ariaLabel} minimum` : `${unit} minimum`}
              value={normalizedValue[0]}
              onChange={event => handleRangeChange(event, 0)}
              onFocus={() => updateTooltip(normalizedValue[0])}
              onMouseMove={event => {
                const next = Number(event.target.value);
                if (!Number.isNaN(next)) updateTooltip(next);
              }}
              {...sharedInputProps}
            />
            <input
              type="range"
              id={id ? `${id}-max` : undefined}
              aria-label={ariaLabel ? `${ariaLabel} maximum` : `${unit} maximum`}
              value={normalizedValue[1]}
              onChange={event => handleRangeChange(event, 1)}
              onFocus={() => updateTooltip(normalizedValue[1])}
              onMouseMove={event => {
                const next = Number(event.target.value);
                if (!Number.isNaN(next)) updateTooltip(next);
              }}
              {...sharedInputProps}
            />
          </>
        )}

        <div
          className={`pointer-events-none absolute -top-3 rounded-full bg-physio-bg-core px-2 py-0.5 text-[11px] font-semibold text-physio-text-primary shadow-physio-subtle transition-opacity duration-150 ${
            tooltip.visible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ left: `calc(${tooltip.percent}% - 16px)` }}
        >
          {formatter(tooltip.value)}
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-physio-text-tertiary">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
};

export default DoseSlider;
