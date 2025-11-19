import React from 'react';
import FilterStatusBadge from './FilterStatusBadge';
import Badge from './ui/Badge';
import Button from './ui/Button';
import Card from './ui/Card';

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

  return (
    <div className={`flex items-center gap-6 h-full ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-physio-text-tertiary uppercase tracking-wider">Active Profile</span>
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded bg-physio-bg-highlight border border-physio-border-subtle text-xs font-mono text-physio-text-primary shadow-sm">
              {age}y
            </div>
            <div className="px-2 py-0.5 rounded bg-physio-bg-highlight border border-physio-border-subtle text-xs font-mono text-physio-text-primary shadow-sm">
              {lbs} lb
            </div>
            <div className="px-2 py-0.5 rounded bg-physio-bg-highlight border border-physio-border-subtle text-xs font-medium text-physio-text-secondary shadow-sm">
              {experience}
            </div>
          </div>
        </div>
        
        <div className="h-8 w-px bg-gradient-to-b from-transparent via-physio-border-subtle to-transparent mx-2 hidden md:block" />
        
        <div className="hidden md:flex flex-col">
           <span className="text-[10px] font-bold text-physio-text-tertiary uppercase tracking-wider">Physiology</span>
           <div className="flex items-center gap-3 text-xs text-physio-text-secondary">
             <span className="flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-physio-accent-secondary/50"></span>
               SHBG {shbg}
             </span>
             <span className="flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-physio-accent-warning/50"></span>
               Arom {arom}
             </span>
             <span className="flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-physio-accent-primary/50"></span>
               Anxiety {anxiety}
             </span>
           </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 ml-auto">
        {unsaved && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-physio-accent-warning/10 border border-physio-accent-warning/20 text-[10px] font-bold text-physio-accent-warning uppercase tracking-wide animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-physio-accent-warning" />
            Unsaved
          </div>
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
        <div className="flex items-center gap-2 pl-4 border-l border-physio-border-subtle">
          <Button size="sm" variant="ghost" onClick={onEditProfile} className="text-xs">Edit</Button>
          <Button size="sm" variant="primary" onClick={onSaveProfile} className="shadow-[0_0_15px_rgba(99,102,241,0.3)]">Save</Button>
          <Button size="sm" variant="ghost" onClick={onResetProfile} className="text-physio-accent-critical hover:bg-physio-accent-critical/10 text-xs">Reset</Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileContextBar;
