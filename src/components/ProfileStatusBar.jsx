import React from 'react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { formatProfileSummary, isProfileCustomized } from './PersonalizationPanel';

const ProfileStatusBar = ({
  profile,
  unsaved = false,
  onEditProfile,
  onSaveProfile = () => {}
}) => {
  const summary = formatProfileSummary(profile);
  const customized = isProfileCustomized(profile);

  return (
    <Card className="px-4 py-3 flex flex-wrap items-center gap-3" variant="glass">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-xs uppercase tracking-wide text-physio-text-tertiary">Profile</span>
        <Badge variant="neutral" size="md">
          {summary || 'Baseline'}
        </Badge>
        {customized && (
          <Badge variant="primary" size="sm">
            Custom
          </Badge>
        )}
        {unsaved && (
          <Badge variant="warning" size="sm">
            Unsaved profile
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 ml-auto">
        {unsaved && typeof onSaveProfile === 'function' && (
          <Button
            onClick={onSaveProfile}
            variant="ghost"
            size="sm"
            className="text-physio-accent-warning border-physio-accent-warning hover:bg-physio-accent-warning/10"
          >
            Save profile
          </Button>
        )}
        <Button
          onClick={onEditProfile}
          variant="secondary"
          size="sm"
        >
          Edit profile
        </Button>
      </div>
    </Card>
  );
};

export default ProfileStatusBar;
