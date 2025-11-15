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
  range = false,
  orientation = 'horizontal',
  trackLength = 200
}) => {
  const isRange = range || Array.isArray(value);
  const isVertical = orientation === 'vertical';
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

  const progressBounds = useMemo(() => {
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
    className: `physio-range relative z-10 cursor-pointer ${isVertical ? 'physio-range-vertical w-10 h-full' : 'w-full'}`,
    onBlur: hideTooltip,
    onMouseLeave: hideTooltip,
    name,
    style: isVertical ? { height: trackLength } : undefined
  };

  const markerElements = markers
    .filter(marker => typeof marker?.value === 'number')
    .map(marker => {
      const percent = getPercent(marker.value, min, max);
      const markerStyle = isVertical ? { bottom: `${percent}%` } : { left: `${percent}%` };
      const markerClass = isVertical ? 'absolute left-1/2 -translate-x-1/2' : 'absolute top-1/2 -translate-y-1/2';
      return (
        <div
          key={`${marker.label || 'marker'}-${marker.value}`}
          className={markerClass}
          style={markerStyle}
        >
          <span
            className={`block h-2 w-2 rounded-full ${markerToneClasses[marker.tone || DEFAULT_MARKER_TONE]}`}
            title={marker.label || `${marker.value} ${unit}`}
          ></span>
          {marker.label && !isVertical && (
            <span className="mt-1 block text-[10px] font-semibold text-physio-text-tertiary text-center">
              {marker.label}
            </span>
          )}
          {marker.label && isVertical && (
            <span className="absolute left-full ml-2 text-[10px] font-semibold text-physio-text-tertiary whitespace-nowrap">
              {marker.label}
            </span>
          )}
        </div>
      );
    });

  const progressStart = Math.min(100, Math.max(0, progressBounds.start));
  const progressEnd = Math.min(100, Math.max(progressStart, progressBounds.end));
  const progressSize = Math.max(0, progressEnd - progressStart);
  const progressStyle = isVertical
    ? { bottom: `${progressStart}%`, height: `${progressSize}%` }
    : { left: `${progressStart}%`, width: `${progressSize}%` };

  const tooltipPositionStyle = isVertical
    ? { left: 'calc(100% + 12px)', bottom: `calc(${tooltip.percent}% - 12px)` }
    : { left: `calc(${tooltip.percent}% - 16px)` };

  return (
    <div className={isVertical ? 'flex flex-col items-center' : 'w-full'}>
      <div
        className={`relative ${isVertical ? 'flex justify-center py-2' : 'py-4'}`}
        style={isVertical ? { minHeight: trackLength + 24 } : undefined}
      >
        <div
          className={`absolute ${isVertical ? 'inset-y-0 left-1/2 -translate-x-1/2 w-1.5' : 'inset-x-0 top-1/2 -translate-y-1/2 h-1.5'} rounded-full bg-physio-bg-border/40`}
          aria-hidden="true"
        >
          <div
            className={`absolute rounded-full ${isVertical ? 'bg-gradient-to-b' : 'bg-gradient-to-r'} from-physio-accent-cyan via-physio-accent-mint to-physio-accent-violet`}
            style={progressStyle}
          />
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
          className={`pointer-events-none absolute rounded-full bg-physio-bg-core px-2 py-0.5 text-[11px] font-semibold text-physio-text-primary shadow-physio-subtle transition-opacity duration-150 ${
            tooltip.visible ? 'opacity-100' : 'opacity-0'
          } ${isVertical ? '' : '-top-3'}`}
          style={tooltipPositionStyle}
        >
          {formatter(tooltip.value)}
        </div>
      </div>
      {isVertical ? (
        <div className="flex flex-col items-center gap-1 text-[11px] uppercase tracking-wide text-physio-text-tertiary">
          <span>{max} {unit}</span>
          <span className="text-xs font-semibold text-physio-text-secondary">Range</span>
          <span>{min} {unit}</span>
        </div>
      ) : (
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-physio-text-tertiary">
          <span>{min} {unit}</span>
          <span>{max} {unit}</span>
        </div>
      )}
    </div>
  );
};

export default DoseSlider;
