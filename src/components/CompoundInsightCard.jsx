import React, { useMemo } from 'react';
import { compoundData } from '../data/compoundData';
import { findSweetSpotRange } from '../utils/sweetSpot';
import { getPlateauDose, getHardMax } from '../utils/interactionEngine';

const formatDose = (value, type) => {
  if (value === null || value === undefined) return '—';
  const unit = type === 'oral' ? 'mg/day' : 'mg/week';
  return `${Math.round(value)} ${unit}`;
};

const CompoundInsightCard = ({
  compoundKey,
  profile,
  onHover = () => {},
  onToggle,
  visible,
  isHighlighted
}) => {
  const compound = compoundData[compoundKey];
  const sweetSpot = useMemo(() => findSweetSpotRange(compoundKey, profile), [compoundKey, profile]);
  const plateau = getPlateauDose(compound);
  const hardCap = getHardMax(compound);

  if (!compound) return null;

  return (
    <div
      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
        visible
          ? 'border-physio-bg-border bg-physio-bg-core/70'
          : 'border-dashed border-physio-bg-border/60 bg-transparent opacity-50'
      } ${isHighlighted ? 'ring-2 ring-physio-accent-cyan/60' : ''}`}
      onMouseEnter={() => onHover(compoundKey)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onToggle(compoundKey)}
      role="button"
      tabIndex={0}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle(compoundKey);
        }
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: compound.color }}
          ></span>
          <p className="text-sm font-semibold text-physio-text-primary">
            {compound.name}
          </p>
        </div>
        <span className="text-[11px] uppercase tracking-wide text-physio-text-tertiary">
          {visible ? 'Visible' : 'Hidden'}
        </span>
      </div>
      <dl className="text-xs text-physio-text-secondary space-y-1">
        <div className="flex justify-between">
          <dt>Saturation</dt>
          <dd className="font-semibold text-physio-text-primary">{formatDose(plateau, compound.type)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Efficiency peak</dt>
          <dd className="font-semibold text-physio-accent-mint">
            {sweetSpot ? formatDose(sweetSpot.peakDose, compound.type) : '—'}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Suggested range</dt>
          <dd className="font-semibold text-physio-text-primary">
            {sweetSpot ? `${formatDose(sweetSpot.optimalRange[0], compound.type)} – ${formatDose(sweetSpot.optimalRange[1], compound.type)}` : '—'}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Risk acceleration</dt>
          <dd className="font-semibold text-physio-error">
            {sweetSpot?.warningDose ? formatDose(sweetSpot.warningDose, compound.type) : formatDose(hardCap, compound.type)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Confidence</dt>
          <dd className="font-semibold text-physio-text-primary">
            {compound.modelConfidence ? `${Math.round(compound.modelConfidence * 100)}%` : 'n/a'}
          </dd>
        </div>
      </dl>
    </div>
  );
};

export default CompoundInsightCard;
