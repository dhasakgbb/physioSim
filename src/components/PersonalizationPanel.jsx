import React, { useEffect, useMemo, useState } from "react";
import {
  defaultProfile,
  buildPersonalizationNarrative,
  defaultCurveScales,
} from "../utils/personalization";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Slider from "./ui/Slider";

const numericFields = [
  {
    name: "age",
    label: "Age",
    min: 18,
    max: 70,
    suffix: "yrs",
    helper: "Biological recovery capacity declines with age.",
  },
  {
    name: "bodyweight",
    label: "Bodyweight",
    min: 50,
    max: 150,
    suffix: "kg",
    helper: "Heavy lifters leverage compounds differently.",
  },
  {
    name: "yearsTraining",
    label: "Years Training",
    min: 0,
    max: 25,
    suffix: "yrs",
    helper: "Training age tracks muscle memory + receptor density.",
  },
  {
    name: "shbg",
    label: "SHBG (optional)",
    min: 5,
    max: 120,
    suffix: "nmol/L",
    helper: "High SHBG buffers Test; low SHBG amplifies it.",
  },
];

const selectFields = [
  {
    name: "arSensitivity",
    label: "AR Sensitivity (CAG Repeats)",
    helper: "Genetic response potential. Hyper-responders grow twice as fast.",
    options: [
      { value: "low_responder", label: "Low Responder (High CAG)" },
      { value: "normal", label: "Normal" },
      { value: "hyper_responder", label: "Hyper Responder (Low CAG)" },
    ],
  },
  {
    name: "aromatase",
    label: "Aromatase (CYP19A1)",
    helper: "Genetic estrogen conversion rate.",
    options: [
      { value: "low", label: "Low (Dry)" },
      { value: "moderate", label: "Normal" },
      { value: "high", label: "High (Wet)" },
    ],
  },
  {
    name: "anxiety",
    label: "Neuro Sensitivity (COMT)",
    helper: "Dopamine breakdown rate. Slow COMT = High Anxiety.",
    options: [
      { value: "low", label: "Fast COMT (Resilient)" },
      { value: "moderate", label: "Normal" },
      { value: "high", label: "Slow COMT (Anxious)" },
    ],
  },
  {
    name: "dietState",
    label: "Energy State (Diet)",
    helper: "Calories dictate hormone function. Deficits crush anabolism.",
    options: [
      { value: "cutting", label: "Deficit (Cutting)" },
      { value: "maintenance", label: "Maintenance" },
      { value: "bulking", label: "Surplus (Bulking)" },
    ],
  },
  {
    name: "trainingStyle",
    label: "Training Stimulus",
    helper: "Steroids amplify the specific signal sent by training.",
    options: [
      { value: "bodybuilding", label: "Bodybuilding (Hypertrophy)" },
      { value: "powerlifting", label: "Powerlifting (Strength)" },
      { value: "crossfit", label: "CrossFit (Mixed/Endurance)" },
    ],
  },
  {
    name: "experience",
    label: "Prior Compound Experience",
    helper: "Impacts desensitization and risk tolerance.",
    options: [
      { value: "none", label: "None yet" },
      { value: "test_only", label: "Testosterone only" },
      { value: "multi_compound", label: "Multiple compounds" },
      { value: "blast_cruise", label: "Blast/Cruise veteran" },
    ],
  },
];

const scaleFields = [
  {
    key: "ageImpact",
    label: "Age sensitivity",
    helper: "Scales how strongly age drags benefit / inflates risk.",
  },
  {
    key: "trainingImpact",
    label: "Training load boost",
    helper: "Controls bonus for heavy lifters and CI tightening.",
  },
  {
    key: "shbgImpact",
    label: "SHBG weighting",
    helper: "Amplify or soften SHBG drag on Testosterone.",
  },
  {
    key: "aromataseImpact",
    label: "Aromatase weighting",
    helper: "Adjust estrogenic risk acceleration for wet compounds.",
  },
  {
    key: "anxietyImpact",
    label: "Neuro sensitivity",
    helper: "Impacts Tren/Halo risk slope for anxiety-prone users.",
  },
  {
    key: "experienceImpact",
    label: "Experience effect",
    helper: "Tweak novice boost vs. veteran dampening.",
  },
  {
    key: "uncertaintyImpact",
    label: "Uncertainty width",
    helper:
      "Widen or tighten the confidence bands if data feels too strict or loose.",
  },
];

const experienceLabels = {
  none: "No cycle history",
  test_only: "Test-only background",
  multi_compound: "Multi-compound user",
  blast_cruise: "Blast/cruise veteran",
};

export const isProfileCustomized = (profile = defaultProfile) => {
  if (!profile) return false;
  const trackedKeys = [
    "age",
    "bodyweight",
    "yearsTraining",
    "shbg",
    "aromatase",
    "anxiety",
    "arSensitivity",
    "experience",
    "dietState",
    "trainingStyle",
  ];
  return trackedKeys.some(
    (key) => (profile?.[key] ?? defaultProfile[key]) !== defaultProfile[key],
  );
};

export const formatProfileSummary = (profile = defaultProfile) => {
  if (!profile) return "Using baseline defaults";
  const tokens = [];
  if (profile.age) tokens.push(`${profile.age}y`);
  if (profile.bodyweight)
    tokens.push(`${Math.round(Number(profile.bodyweight) * 2.2)} lb`);
  if (profile.yearsTraining) tokens.push(`${profile.yearsTraining}y training`);
  if (profile.shbg) tokens.push(`SHBG ${profile.shbg}`);
  if (profile.arSensitivity && profile.arSensitivity !== "normal")
    tokens.push(`CAG: ${profile.arSensitivity}`);
  if (profile.aromatase) tokens.push(`Arom ${profile.aromatase}`);
  if (profile.anxiety) tokens.push(`COMT ${profile.anxiety}`);
  if (profile.dietState && profile.dietState !== "maintenance")
    tokens.push(profile.dietState.toUpperCase());
  if (profile.trainingStyle && profile.trainingStyle !== "bodybuilding")
    tokens.push(profile.trainingStyle === "powerlifting" ? "PL" : "XFIT");
  if (profile.experience)
    tokens.push(experienceLabels[profile.experience] || profile.experience);
  return tokens.filter(Boolean).join(" • ") || "Using baseline defaults";
};

const ChevronIcon = ({ open }) => (
  <svg
    className={`w-4 h-4 text-physio-text-tertiary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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

const PersonalizationPanel = ({
  profile,
  onProfileChange,
  onClearProfile,
  compressed = false,
}) => {
  const narrative = buildPersonalizationNarrative(profile);
  const curveScales = {
    ...defaultCurveScales,
    ...(profile?.curveScales || {}),
  };
  const [collapsed, setCollapsed] = useState(false);
  const [autoCollapsed, setAutoCollapsed] = useState(false);
  const profileSummary = useMemo(
    () => formatProfileSummary(profile),
    [profile],
  );
  const customized = useMemo(() => isProfileCustomized(profile), [profile]);

  useEffect(() => {
    if (customized && !autoCollapsed) {
      setCollapsed(true);
      setAutoCollapsed(true);
    }
  }, [customized, autoCollapsed]);

  const handleNumericChange = (field, rawValue) => {
    const value = rawValue === "" ? "" : Number(rawValue);
    onProfileChange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectChange = (field, value) => {
    onProfileChange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetProfile = () => {
    onProfileChange(() => ({ ...defaultProfile }));
  };

  const updateCurveScale = (key, value) => {
    const numeric = Number(value);
    onProfileChange((prev) => ({
      ...prev,
      curveScales: {
        ...(prev?.curveScales || {}),
        [key]: numeric,
      },
    }));
  };

  const resetCurveScales = () => {
    onProfileChange((prev) => ({
      ...prev,
      curveScales: { ...defaultCurveScales },
    }));
  };

  const containerPadding = compressed ? "p-4" : "p-6";
  const headerSpacing = compressed ? "mb-4" : "mb-6";
  const gridGap = compressed ? "gap-3" : "gap-4";
  const blockSpacing = compressed ? "mt-4" : "mt-6";
  const cardPadding = compressed ? "p-3" : "p-4";

  return (
    <Card className={`mb-8 ${containerPadding}`} variant="highlight">
      <div
        className={`flex flex-col md:flex-row md:items-center gap-3 ${collapsed ? "mb-0" : "mb-4"}`}
      >
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-expanded={!collapsed}
          className={`flex-1 text-left bg-physio-bg-secondary border border-physio-bg-border rounded-xl ${compressed ? "px-3 py-2" : "px-4 py-3"} hover:border-physio-accent-cyan transition-standard`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-physio-text-primary">
                {customized ? "Profile (custom)" : "Profile (baseline)"}
              </p>
              <p className="text-xs text-physio-text-secondary truncate">
                {profileSummary}
              </p>
            </div>
            <ChevronIcon open={!collapsed} />
          </div>
        </button>
        {collapsed && (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setCollapsed(false)}
              variant="secondary"
              size="sm"
            >
              Edit profile
            </Button>
            <Button onClick={resetProfile} variant="ghost" size="sm">
              Reset
            </Button>
            <Button
              onClick={() => onClearProfile?.()}
              variant="ghost"
              size="sm"
            >
              Forget saved
            </Button>
          </div>
        )}
      </div>

      {!collapsed && (
        <>
          <div
            className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${headerSpacing}`}
          >
            <div>
              <h2 className="text-2xl font-bold text-physio-text-primary">
                Personalized Dose-Response
              </h2>
              <p className="text-sm text-physio-text-secondary">
                Plug in your physiology to morph the benefit vs. risk curves in
                real time.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 self-start md:self-auto">
              <Button onClick={resetProfile} variant="secondary" size="sm">
                Reset to baseline
              </Button>
              <Button
                onClick={() => onClearProfile?.()}
                variant="ghost"
                size="sm"
              >
                Forget saved profile
              </Button>
            </div>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-4 ${gridGap}`}>
            {numericFields.map((field) => (
              <label key={field.name} className="flex flex-col text-sm">
                <span className="font-semibold text-physio-text-secondary">
                  {field.label}
                </span>
                <div className="mt-1">
                  <Input
                    type="number"
                    min={field.min}
                    max={field.max}
                    value={profile[field.name] ?? ""}
                    placeholder={field.optional ? "optional" : ""}
                    onChange={(e) =>
                      handleNumericChange(field.name, e.target.value)
                    }
                    label={null}
                  />
                  <div className="text-right text-xs uppercase tracking-wide text-physio-text-tertiary mt-1">
                    {field.suffix}
                  </div>
                </div>
                <span className="mt-1 text-xs text-physio-text-tertiary">
                  {field.helper}
                </span>
              </label>
            ))}
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-3 ${gridGap} ${compressed ? "mt-4" : "mt-5"}`}
          >
            {selectFields.map((field) => (
              <label key={field.name} className="flex flex-col text-sm">
                <span className="font-semibold text-physio-text-secondary">
                  {field.label}
                </span>
                <select
                  value={profile[field.name]}
                  onChange={(e) =>
                    handleSelectChange(field.name, e.target.value)
                  }
                  className="mt-1 bg-physio-bg-secondary border border-physio-bg-border rounded-lg px-3 py-2 focus:outline-none text-physio-text-primary"
                >
                  {field.options.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-physio-bg-core text-physio-text-primary"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="mt-1 text-xs text-physio-text-tertiary">
                  {field.helper}
                </span>
              </label>
            ))}
          </div>

          <div
            className={`${blockSpacing} bg-physio-bg-secondary border border-physio-bg-border rounded-xl ${cardPadding}`}
          >
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

          <div
            className={`${blockSpacing} border border-physio-bg-border rounded-xl bg-physio-bg-secondary ${cardPadding}`}
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-bold text-physio-text-primary">
                  Response tuning sliders
                </h3>
                <p className="text-xs text-physio-text-secondary">
                  Dial the heuristics that tailor benefit/risk curves to your
                  physiology.
                </p>
              </div>
              <Button
                onClick={resetCurveScales}
                variant="ghost"
                size="sm"
                className="text-physio-accent-cyan border-physio-accent-cyan hover:bg-physio-accent-cyan/10"
              >
                Reset sliders
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {scaleFields.map((field) => (
                <div
                  key={field.key}
                  className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-3"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-physio-text-primary mb-1">
                    <span>{field.label}</span>
                    <span className="text-physio-accent-cyan">
                      {curveScales[field.key].toFixed(2)}×
                    </span>
                  </div>
                  <Slider
                    min={0.5}
                    max={1.5}
                    step={0.05}
                    value={curveScales[field.key]}
                    onChange={(value) => updateCurveScale(field.key, value)}
                  />
                  <p className="text-[11px] text-physio-text-tertiary mt-1">
                    {field.helper}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default PersonalizationPanel;
