import React, { useEffect, useMemo, useState } from 'react';
import { defaultProfile, buildPersonalizationNarrative, labPresets, defaultLabScales } from '../utils/personalization';

const numericFields = [
  { name: 'age', label: 'Age', min: 18, max: 70, suffix: 'yrs', helper: 'Biological recovery capacity declines with age.' },
  { name: 'bodyweight', label: 'Bodyweight', min: 50, max: 150, suffix: 'kg', helper: 'Heavy lifters leverage compounds differently.' },
  { name: 'yearsTraining', label: 'Years Training', min: 0, max: 25, suffix: 'yrs', helper: 'Training age tracks muscle memory + receptor density.' },
  { name: 'shbg', label: 'SHBG (optional)', min: 5, max: 120, suffix: 'nmol/L', helper: 'High SHBG buffers Test; low SHBG amplifies it.' }
];

const selectFields = [
  {
    name: 'aromatase',
    label: 'Aromatase Tendency',
    helper: 'Self-reported: how easily you convert to estrogen.',
    options: [
      { value: 'low', label: 'Low' },
      { value: 'moderate', label: 'Moderate' },
      { value: 'high', label: 'High' }
    ]
  },
  {
    name: 'anxiety',
    label: 'Anxiety Sensitivity',
    helper: 'Important for Tren/Halo neuro-psych sides.',
    options: [
      { value: 'low', label: 'Low' },
      { value: 'moderate', label: 'Moderate' },
      { value: 'high', label: 'High' }
    ]
  },
  {
    name: 'experience',
    label: 'Prior Compound Experience',
    helper: 'Impacts desensitization and risk tolerance.',
    options: [
      { value: 'none', label: 'None yet' },
      { value: 'test_only', label: 'Testosterone only' },
      { value: 'multi_compound', label: 'Multiple compounds' },
      { value: 'blast_cruise', label: 'Blast/Cruise veteran' }
    ]
  }
];

const labScaleFields = [
  { key: 'ageImpact', label: 'Age sensitivity', helper: 'Scales how strongly age drags benefit / inflates risk.' },
  { key: 'trainingImpact', label: 'Training load boost', helper: 'Controls bonus for heavy lifters and CI tightening.' },
  { key: 'shbgImpact', label: 'SHBG weighting', helper: 'Amplify or soften SHBG drag on Testosterone.' },
  { key: 'aromataseImpact', label: 'Aromatase weighting', helper: 'Adjust estrogenic risk acceleration for wet compounds.' },
  { key: 'anxietyImpact', label: 'Neuro sensitivity', helper: 'Impacts Tren/Halo risk slope for anxiety-prone users.' },
  { key: 'experienceImpact', label: 'Experience effect', helper: 'Tweak novice boost vs. veteran dampening.' },
  { key: 'uncertaintyImpact', label: 'Uncertainty width', helper: 'Widen or tighten CI bands when lab mode is active.' }
];

const experienceLabels = {
  none: 'No cycle history',
  test_only: 'Test-only background',
  multi_compound: 'Multi-compound user',
  blast_cruise: 'Blast/cruise veteran'
};

const isProfileCustomized = (profile = defaultProfile) => {
  if (!profile) return false;
  const trackedKeys = ['age', 'bodyweight', 'yearsTraining', 'shbg', 'aromatase', 'anxiety', 'experience'];
  return (
    trackedKeys.some(key => (profile?.[key] ?? defaultProfile[key]) !== defaultProfile[key]) ||
    Boolean(profile?.labMode?.enabled)
  );
};

const formatProfileSummary = (profile = defaultProfile) => {
  if (!profile) return 'Using baseline defaults';
  const tokens = [];
  if (profile.age) tokens.push(`${profile.age}y`);
  if (profile.bodyweight) tokens.push(`${Math.round(Number(profile.bodyweight) * 2.2)} lb`);
  if (profile.yearsTraining) tokens.push(`${profile.yearsTraining}y training`);
  if (profile.shbg) tokens.push(`SHBG ${profile.shbg}`);
  if (profile.aromatase) tokens.push(`Arom ${profile.aromatase}`);
  if (profile.anxiety) tokens.push(`Anxiety ${profile.anxiety}`);
  if (profile.experience) tokens.push(experienceLabels[profile.experience] || profile.experience);
  if (profile.labMode?.enabled) tokens.push(`Lab preset: ${profile.labMode?.preset || 'custom'}`);
  return tokens.filter(Boolean).join(' • ') || 'Using baseline defaults';
};

const ChevronIcon = ({ open }) => (
  <svg
    className={`w-4 h-4 text-physio-text-tertiary transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
      clipRule="evenodd"
    />
  </svg>
);

const PersonalizationPanel = ({ profile, onProfileChange, onClearProfile, compressed = false }) => {
  const narrative = buildPersonalizationNarrative(profile);
  const labModeEnabled = profile?.labMode?.enabled;
  const labPreset = profile?.labMode?.preset || 'baseline';
  const labScales = { ...defaultLabScales, ...(profile?.labMode?.scales || {}) };
  const [collapsed, setCollapsed] = useState(false);
  const [autoCollapsed, setAutoCollapsed] = useState(false);
  const profileSummary = useMemo(() => formatProfileSummary(profile), [profile]);
  const customized = useMemo(() => isProfileCustomized(profile), [profile]);

  useEffect(() => {
    if (customized && !autoCollapsed) {
      setCollapsed(true);
      setAutoCollapsed(true);
    }
  }, [customized, autoCollapsed]);

  const handleNumericChange = (field, rawValue) => {
    const value = rawValue === '' ? '' : Number(rawValue);
    onProfileChange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectChange = (field, value) => {
    onProfileChange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetProfile = () => {
    onProfileChange(() => ({ ...defaultProfile }));
  };

  const toggleLabMode = () => {
    onProfileChange(prev => ({
      ...prev,
      labMode: {
        ...prev.labMode,
        enabled: !labModeEnabled
      }
    }));
  };

  const applyLabPreset = (presetKey) => {
    const preset = labPresets[presetKey] || labPresets.baseline;
    onProfileChange(prev => ({
      ...prev,
      labMode: {
        enabled: true,
        preset: presetKey,
        scales: { ...preset.scales }
      }
    }));
  };

  const updateLabScale = (key, value) => {
    const numeric = Number(value);
    onProfileChange(prev => ({
      ...prev,
      labMode: {
        ...(prev.labMode || {}),
        enabled: true,
        scales: {
          ...(prev.labMode?.scales || {}),
          [key]: numeric
        }
      }
    }));
  };

  const containerPadding = compressed ? 'p-4' : 'p-6';
  const headerSpacing = compressed ? 'mb-4' : 'mb-6';
  const gridGap = compressed ? 'gap-3' : 'gap-4';
  const blockSpacing = compressed ? 'mt-4' : 'mt-6';
  const cardPadding = compressed ? 'p-3' : 'p-4';

  return (
    <section className={`mb-8 bg-physio-bg-core border-2 border-physio-accent-cyan/60 rounded-2xl shadow-lg ${containerPadding}`}>
      <div className={`flex flex-col md:flex-row md:items-center gap-3 ${collapsed ? 'mb-0' : 'mb-4'}`}>
        <button
          type="button"
          onClick={() => setCollapsed(prev => !prev)}
          aria-expanded={!collapsed}
          className={`flex-1 text-left bg-physio-bg-secondary border border-physio-bg-border rounded-xl ${compressed ? 'px-3 py-2' : 'px-4 py-3'} hover:border-physio-accent-cyan transition-standard`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-physio-text-primary">
                {customized ? 'Profile (custom)' : 'Profile (baseline)'}
              </p>
              <p className="text-xs text-physio-text-secondary truncate">{profileSummary}</p>
            </div>
            <ChevronIcon open={!collapsed} />
          </div>
        </button>
        {collapsed && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCollapsed(false)}
              className="px-3 py-2 text-xs font-semibold border border-physio-accent-cyan text-physio-accent-cyan rounded-lg hover:bg-physio-accent-cyan hover:text-physio-bg-core transition-standard"
            >
              Edit profile
            </button>
            <button
              onClick={resetProfile}
              className="px-3 py-2 text-xs font-semibold border border-physio-bg-border rounded-lg text-physio-text-secondary hover:text-physio-text-primary transition-standard"
            >
              Reset
            </button>
            <button
              onClick={() => onClearProfile?.()}
              className="px-3 py-2 text-xs font-semibold border border-physio-bg-border rounded-lg text-physio-text-secondary hover:text-physio-text-primary transition-standard"
            >
              Forget saved
            </button>
          </div>
        )}
      </div>

      {!collapsed && (
        <>
          <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${headerSpacing}`}>
            <div>
              <h2 className="text-2xl font-bold text-physio-text-primary">Personalized Dose-Response</h2>
              <p className="text-sm text-physio-text-secondary">
                Plug in your physiology to morph the benefit vs. risk curves in real time.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 self-start md:self-auto">
              <button
                onClick={resetProfile}
                className="px-4 py-2 border border-physio-accent-cyan rounded-lg text-sm font-semibold text-physio-accent-cyan hover:bg-physio-accent-cyan hover:text-physio-bg-core transition-standard"
              >
                Reset to baseline
              </button>
              <button
                onClick={() => onClearProfile?.()}
                className="px-4 py-2 border border-physio-bg-border rounded-lg text-sm font-semibold text-physio-text-secondary hover:text-physio-text-primary transition-standard"
              >
                Forget saved profile
              </button>
            </div>
          </div>

      <div className={`grid grid-cols-1 md:grid-cols-4 ${gridGap}`}>
        {numericFields.map(field => (
          <label key={field.name} className="flex flex-col text-sm">
            <span className="font-semibold text-physio-text-secondary">{field.label}</span>
            <div className="mt-1 flex items-center bg-physio-bg-secondary border border-physio-bg-border rounded-lg">
              <input
                type="number"
                min={field.min}
                max={field.max}
                value={profile[field.name] ?? ''}
                placeholder={field.optional ? 'optional' : ''}
                onChange={e => handleNumericChange(field.name, e.target.value)}
                className="flex-1 bg-transparent px-3 py-2 focus:outline-none text-physio-text-primary"
              />
              <span className="px-3 text-xs uppercase tracking-wide text-physio-text-tertiary border-l border-physio-bg-border">
                {field.suffix}
              </span>
            </div>
            <span className="mt-1 text-xs text-physio-text-tertiary">{field.helper}</span>
          </label>
        ))}
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-3 ${gridGap} ${compressed ? 'mt-4' : 'mt-5'}`}>
        {selectFields.map(field => (
          <label key={field.name} className="flex flex-col text-sm">
            <span className="font-semibold text-physio-text-secondary">{field.label}</span>
            <select
              value={profile[field.name]}
              onChange={e => handleSelectChange(field.name, e.target.value)}
              className="mt-1 bg-physio-bg-secondary border border-physio-bg-border rounded-lg px-3 py-2 focus:outline-none text-physio-text-primary"
            >
              {field.options.map(option => (
                <option key={option.value} value={option.value} className="bg-physio-bg-core text-physio-text-primary">
                  {option.label}
                </option>
              ))}
            </select>
            <span className="mt-1 text-xs text-physio-text-tertiary">{field.helper}</span>
          </label>
        ))}
      </div>

      <div className={`${blockSpacing} bg-physio-bg-secondary border border-physio-bg-border rounded-xl ${cardPadding}`}>
        <div className="flex items-center mb-2 text-sm font-semibold text-physio-accent-cyan">
          <span className="mr-2">🧠</span>
          Real-time narrative
        </div>
        <ul className="list-disc list-inside text-sm text-physio-text-primary space-y-1">
          {narrative.map((point, idx) => (
            <li key={idx}>{point}</li>
          ))}
        </ul>
      </div>

      <div className={`${blockSpacing} border border-physio-bg-border rounded-xl bg-physio-bg-secondary ${cardPadding}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-physio-text-primary">Lab Mode (advanced coefficients)</h3>
            <p className="text-xs text-physio-text-secondary">Override curve heuristics with responder presets or manual sliders.</p>
          </div>
          <button
            onClick={toggleLabMode}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-standard ${
              labModeEnabled
                ? 'border-physio-accent-cyan text-physio-accent-cyan'
                : 'border-physio-bg-border text-physio-text-tertiary'
            }`}
          >
            {labModeEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>

        {labModeEnabled && (
          <div className="mt-4 space-y-4">
            <label className="text-xs font-semibold text-physio-text-secondary">
              Preset
              <select
                value={labPreset}
                onChange={e => applyLabPreset(e.target.value)}
                className="mt-1 w-full bg-physio-bg-core border border-physio-bg-border rounded-lg px-3 py-2 text-sm text-physio-text-primary"
              >
                {Object.entries(labPresets).map(([key, preset]) => (
                  <option key={key} value={key} className="bg-physio-bg-core text-physio-text-primary">
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {labScaleFields.map(field => (
                <div key={field.key} className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-physio-text-primary mb-1">
                    <span>{field.label}</span>
                    <span className="text-physio-accent-cyan">{labScales[field.key].toFixed(2)}×</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={labScales[field.key]}
                    onChange={e => updateLabScale(field.key, parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-[11px] text-physio-text-tertiary mt-1">{field.helper}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
        </>
      )}
    </section>
  );
};

export default PersonalizationPanel;
