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
  onManageFilters
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

  return (
    <section className="bg-physio-bg-secondary/80 border border-physio-bg-border rounded-3xl px-5 py-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between shadow-physio-subtle">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-physio-text-tertiary">Profile context</p>
        <div className="text-sm md:text-base text-physio-text-primary font-semibold flex flex-wrap gap-2">
          {descriptors.map(item => (
            <span key={item} className="px-2 py-0.5 rounded-full bg-physio-bg-core/80 text-physio-text-secondary border border-physio-bg-border/70">
              {item}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 justify-end">
        {unsaved && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-physio-warning/15 text-physio-warning border border-physio-warning/40">
            Unsaved profile edits
          </span>
        )}
        {filterItems.length > 0 && (
          <FilterStatusBadge
            items={filterItems}
            onReset={onResetFilters}
            onManagePrefs={onManageFilters}
            size="pill"
          />
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEditProfile}
            className="px-3 py-1.5 rounded-full border border-physio-bg-border text-xs font-semibold text-physio-text-secondary hover:text-physio-text-primary hover:border-physio-accent-cyan transition"
          >
            Edit profile
          </button>
          <button
            type="button"
            onClick={onSaveProfile}
            className="px-3 py-1.5 rounded-full border border-physio-accent-mint text-xs font-semibold text-physio-accent-mint hover:bg-physio-accent-mint hover:text-physio-bg-core transition"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onResetProfile}
            className="px-3 py-1.5 rounded-full border border-physio-bg-border text-xs font-semibold text-physio-text-tertiary hover:text-physio-error hover:border-physio-error/50 transition"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProfileContextBar;
