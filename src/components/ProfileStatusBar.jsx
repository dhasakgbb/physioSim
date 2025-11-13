import React from 'react';
import { formatProfileSummary, isProfileCustomized } from './PersonalizationPanel';

const ProfileStatusBar = ({
  profile,
  unsaved = false,
  onEditProfile,
  onToggleLabMode,
  onSaveProfile = () => {}
}) => {
  const summary = formatProfileSummary(profile);
  const customized = isProfileCustomized(profile);
  const labEnabled = Boolean(profile?.labMode?.enabled);

  return (
    <div className="bg-physio-bg-secondary/80 border border-physio-bg-border rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3 shadow-physio-subtle">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-xs uppercase tracking-wide text-physio-text-tertiary">Profile</span>
        <span className="px-3 py-1 rounded-full bg-physio-bg-core border border-physio-bg-border text-physio-text-primary">
          {summary || 'Baseline'}
        </span>
        {customized && (
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-physio-accent-cyan/10 text-physio-accent-cyan border border-physio-accent-cyan/50">
            Custom
          </span>
        )}
        {unsaved && (
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-physio-warning/15 text-physio-warning border border-physio-warning/60">
            Unsaved profile
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 ml-auto">
        {unsaved && typeof onSaveProfile === 'function' && (
          <button
            type="button"
            onClick={onSaveProfile}
            className="px-3 py-1.5 rounded-full border border-physio-warning/60 text-physio-warning text-xs font-semibold hover:bg-physio-warning/10 transition"
          >
            Save profile
          </button>
        )}
        <button
          type="button"
          onClick={onToggleLabMode}
          className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition ${
            labEnabled
              ? 'border-physio-accent-violet text-physio-accent-violet bg-physio-bg-core'
              : 'border-physio-bg-border text-physio-text-tertiary hover:text-physio-text-primary'
          }`}
        >
          {labEnabled ? 'Lab mode on' : 'Lab mode off'}
        </button>
        <button
          type="button"
          onClick={onEditProfile}
          className="px-3 py-1.5 rounded-full border border-physio-accent-cyan text-physio-accent-cyan text-xs font-semibold hover:bg-physio-accent-cyan/10 transition"
        >
          Edit profile
        </button>
      </div>
    </div>
  );
};

export default ProfileStatusBar;
