import React from 'react';
import FilterStatusBadge from './FilterStatusBadge';

const formatExperience = experience => {
  switch (experience) {
    case 'none':
      return 'Newcomer';
    case 'test_only':
      return 'Test-only';
    case 'multi_compound':
      return 'Hybrid stacks';
    case 'blast_cruise':
      return 'Blast & cruise';
    default:
      return 'Unknown exp.';
  }
};

const ProfileContextBar = ({
  profile,
  unsaved,
  onEditProfile,
  onSaveProfile,
  onResetProfile,
  filterItems = [],
  onResetFilters,
  onManageFilters,
  expanded = false,
  onToggleExpand,
  className = ''
}) => {
  const age = profile?.age ?? 30;
  const bodyweight = profile?.bodyweight ?? 90;
  const lbs = Math.round(bodyweight * 2.20462);
  const training = profile?.yearsTraining ?? 5;
  const shbg = profile?.shbg ?? 30;
  const arom = profile?.aromatase ?? 'moderate';
  const anxiety = profile?.anxiety ?? 'moderate';
  const experience = formatExperience(profile?.experience);

  const descriptors = [
    `${age}y`,
    `${lbs} lb`,
    `${training}y training`,
    `SHBG ${shbg}`,
    `Arom ${arom}`,
    `Anxiety ${anxiety}`,
    experience
  ];
  const summary = descriptors.join(' • ');

  const toggleExpand = () => {
    if (typeof onToggleExpand === 'function') {
      onToggleExpand();
    }
  };

  const ActionButton = ({ label, onClick, tone = 'neutral' }) => {
    const toneClasses = {
      neutral: 'text-physio-text-secondary hover:text-physio-text-primary border-physio-bg-border',
      accent: 'text-physio-accent-mint border-physio-accent-mint hover:bg-physio-accent-mint hover:text-physio-bg-core',
      danger: 'text-physio-error border-physio-error/60 hover:bg-physio-error hover:text-physio-bg-core'
    };
    return (
      <button
        type="button"
        onClick={onClick}
        className={`px-3 py-1 text-[11px] font-semibold rounded-full border transition-standard ${toneClasses[tone]}`}
      >
        {label}
      </button>
    );
  };

  return (
    <section
      className={`bg-physio-bg-secondary/70 border border-physio-bg-border/70 rounded-[32px] px-4 py-2 shadow-physio-subtle transition-all duration-200 ${className}`.trim()}
    >
      <div className="flex items-center gap-3 min-h-[48px]">
        <button
          type="button"
          onClick={toggleExpand}
          aria-expanded={expanded}
          className="flex items-center gap-1 rounded-full border border-physio-bg-border/60 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-physio-text-tertiary hover:text-physio-text-primary"
        >
          Profile
          <span className={`transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`}>⌄</span>
        </button>
        <p className="text-sm font-medium text-physio-text-secondary truncate">
          {summary}
        </p>
        <div className="flex items-center gap-2 ml-auto">
          {unsaved && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-physio-warning/15 text-physio-warning border border-physio-warning/40">
              Unsaved
            </span>
          )}
          {filterItems.length > 0 && (
            <FilterStatusBadge
              items={filterItems}
              onReset={onResetFilters}
              onManagePrefs={onManageFilters}
              size="compact"
              label="Filters"
            />
          )}
          <ActionButton label="Edit profile" onClick={onEditProfile} />
          <ActionButton label="Save" onClick={onSaveProfile} tone="accent" />
          <ActionButton label="Reset" onClick={onResetProfile} tone="danger" />
        </div>
      </div>

      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
          expanded ? 'max-h-32 opacity-100 pt-3 border-t border-physio-bg-border/70 mt-2' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-physio-text-primary">
          {descriptors.map(item => (
            <span
              key={item}
              className="px-2 py-0.5 rounded-full bg-physio-bg-core/80 border border-physio-bg-border/60"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProfileContextBar;
