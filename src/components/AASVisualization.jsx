import React, { useState, useRef, useEffect, useCallback } from 'react';
import DoseResponseChart from './DoseResponseChart';
import OralDoseChart from './OralDoseChart';
import CustomLegend from './CustomLegend';
import MethodologyModal from './MethodologyModal';
import InteractionHeatmap from './InteractionHeatmap';
import StackBuilder from './StackBuilder';
import SideEffectProfile from './SideEffectProfile';
import AncillaryCalculator from './AncillaryCalculator';
import PersonalizationPanel from './PersonalizationPanel.jsx';
import EvidencePanel from './EvidencePanel';
import ChartControlBar from './ChartControlBar';
import { compoundData } from '../data/compoundData';
import { defaultProfile, PROFILE_STORAGE_KEY } from '../utils/personalization';

const mergeStoredProfile = (storedProfile) => {
  if (!storedProfile) return { ...defaultProfile };
  return {
    ...defaultProfile,
    ...storedProfile,
    labMode: {
      ...defaultProfile.labMode,
      ...(storedProfile.labMode || {}),
      scales: {
        ...defaultProfile.labMode.scales,
        ...(storedProfile.labMode?.scales || {})
      }
    }
  };
};

const CollapseChevron = ({ open }) => (
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

const FILTER_PREF_KEY = 'layoutFilterPrefs';
const defaultFilterPrefs = {
  viewMode: true,
  density: true,
  interaction: true
};

const AASVisualization = () => {
  // Active tab: 'injectables', 'orals', 'interactions', 'stack'
  const [activeTab, setActiveTab] = useState('injectables');
  
  // View mode: 'benefit', 'risk', or 'integrated'
  const [viewMode, setViewMode] = useState('integrated');
  
  // Visible compounds (all visible by default)
  const [visibleCompounds, setVisibleCompounds] = useState(
    Object.keys(compoundData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {})
  );
  
  // Methodology modal state
  const [selectedCompound, setSelectedCompound] = useState(null);

  // Personalization state
  const [userProfile, setUserProfile] = useState(() => {
    if (typeof window === 'undefined') return defaultProfile;
    try {
      const stored = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!stored) return { ...defaultProfile };
      const parsed = JSON.parse(stored);
      return mergeStoredProfile(parsed);
    } catch (error) {
      console.warn('Failed to parse stored profile', error);
      return { ...defaultProfile };
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(userProfile));
    } catch (error) {
      console.warn('Failed to persist profile', error);
    }
  }, [userProfile]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(FILTER_PREF_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFilterPrefs(prev => ({
          ...prev,
          ...parsed
        }));
      }
    } catch (error) {
      console.warn('Failed to load filter prefs', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(FILTER_PREF_KEY, JSON.stringify(filterPrefs));
    } catch (error) {
      console.warn('Failed to persist filter prefs', error);
    }
  }, [filterPrefs]);

  const handleClearProfile = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
    setUserProfile({ ...defaultProfile });
  };

  const [stackPrefill, setStackPrefill] = useState(null);
  const [contextCollapsed, setContextCollapsed] = useState({
    injectables: true,
    orals: true
  });
  const [compressedMode, setCompressedMode] = useState(false);
  const [evidencePanelCollapsed, setEvidencePanelCollapsed] = useState(true);
  const [filtersDirty, setFiltersDirty] = useState(false);
  const [interactionFiltersDirty, setInteractionFiltersDirty] = useState(false);
  const [interactionResetKey, setInteractionResetKey] = useState(0);
  const [filterPrefs, setFilterPrefs] = useState(defaultFilterPrefs);
  const [filterPrefsOpen, setFilterPrefsOpen] = useState(false);

  const toggleContextDrawer = (tabKey) => {
    setContextCollapsed(prev => ({
      ...prev,
      [tabKey]: !prev[tabKey]
    }));
  };

  const handlePrefillStack = (compounds) => {
    setStackPrefill({ id: Date.now(), compounds });
    setActiveTab('stack');
  };

  useEffect(() => {
    const viewDirty = viewMode !== 'integrated';
    const densityDirty = compressedMode;
    const interactionDirty = interactionFiltersDirty;
    const dirty =
      (filterPrefs.viewMode && viewDirty) ||
      (filterPrefs.density && densityDirty) ||
      (filterPrefs.interaction && interactionDirty);
    setFiltersDirty(dirty);
  }, [viewMode, compressedMode, interactionFiltersDirty, filterPrefs]);

  const handleInteractionFiltersDirty = useCallback((dirty) => {
    setInteractionFiltersDirty(dirty);
  }, []);

  const resetAllFilters = useCallback(() => {
    setViewMode('integrated');
    setCompressedMode(false);
    setInteractionResetKey(prev => prev + 1);
    setInteractionFiltersDirty(false);
  }, []);

  // Reference for chart (for PDF export)
  const chartRef = useRef(null);

  const toggleCompound = (compoundKey) => {
    setVisibleCompounds(prev => ({
      ...prev,
      [compoundKey]: !prev[compoundKey]
    }));
  };

  const openMethodology = (compoundKey) => {
    setSelectedCompound(compoundKey);
  };

  const closeMethodology = () => {
    setSelectedCompound(null);
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-h1 text-physio-text-primary mb-2">
            physioLab — AAS Dose-Response Analyzer
          </h1>
          <p className="text-lg text-physio-text-secondary">
            Evidence-based harm reduction modeling with transparent uncertainty quantification
          </p>
        </header>

        <div className="flex flex-wrap items-center justify-end gap-2 mb-4">
          <span className="text-xs uppercase tracking-wide text-physio-text-tertiary">Layout density</span>
          <button
            onClick={() => setCompressedMode(prev => !prev)}
            className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-standard ${
              compressedMode
                ? 'bg-physio-accent-cyan text-white border-physio-accent-cyan'
                : 'border-physio-bg-border text-physio-text-secondary hover:text-physio-text-primary'
            }`}
          >
            {compressedMode ? 'Compressed mode on' : 'Compressed mode off'}
          </button>
        </div>

        <PersonalizationPanel
          profile={userProfile}
          onProfileChange={setUserProfile}
          onClearProfile={handleClearProfile}
          compressed={compressedMode}
        />

        {/* Tab Navigation - Underline Style */}
        <div className="mb-8 border-b border-physio-bg-border relative">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('injectables')}
              className={`px-4 py-3 font-medium transition-standard relative ${
                activeTab === 'injectables'
                  ? 'text-physio-accent-cyan'
                  : 'text-physio-text-secondary hover:text-physio-text-primary'
              }`}
            >
              Injectables
              {activeTab === 'injectables' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-physio-accent-cyan"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('orals')}
              className={`px-4 py-3 font-medium transition-standard relative ${
                activeTab === 'orals'
                  ? 'text-physio-accent-cyan'
                  : 'text-physio-text-secondary hover:text-physio-text-primary'
              }`}
            >
              Orals
              {activeTab === 'orals' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-physio-accent-cyan"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('interactions')}
              className={`px-4 py-3 font-medium transition-standard relative ${
                activeTab === 'interactions'
                  ? 'text-physio-accent-cyan'
                  : 'text-physio-text-secondary hover:text-physio-text-primary'
              }`}
            >
              Interactions
              {activeTab === 'interactions' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-physio-accent-cyan"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('stack')}
              className={`px-4 py-3 font-medium transition-standard relative ${
                activeTab === 'stack'
                  ? 'text-physio-accent-cyan'
                  : 'text-physio-text-secondary hover:text-physio-text-primary'
              }`}
            >
              Stack Builder
              {activeTab === 'stack' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-physio-accent-cyan"></div>
              )}
            </button>
          </div>
          <div className="flex flex-wrap justify-between items-center gap-3 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterPrefsOpen(prev => !prev)}
                className="px-3 py-1.5 rounded-full border border-physio-bg-border text-physio-text-secondary hover:text-physio-text-primary hover:border-physio-accent-cyan transition"
              >
                Manage filter tracking
              </button>
            </div>
            {filtersDirty && (
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-full border border-physio-accent-cyan text-physio-accent-cyan bg-physio-bg-secondary">
                  Filters active
                </span>
                <button
                  onClick={resetAllFilters}
                  className="px-3 py-1.5 rounded-full border border-physio-bg-border text-physio-text-secondary hover:text-physio-text-primary hover:border-physio-accent-cyan transition"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
          {filterPrefsOpen && (
            <div className="mt-3 p-4 border border-physio-bg-border rounded-xl bg-physio-bg-secondary max-w-xl">
              <p className="text-xs uppercase tracking-wide text-physio-text-tertiary mb-2">Filters counted</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-physio-text-secondary">
                {[
                  { key: 'viewMode', label: 'Chart view mode', helper: 'Benefit-only or risk-only counts as dirty.' },
                  { key: 'density', label: 'Layout density', helper: 'Compressed layout toggles the chip.' },
                  { key: 'interaction', label: 'Interaction controls', helper: 'Heatmap focus, goal, evidence blend.' }
                ].map(pref => (
                  <label
                    key={pref.key}
                    className="flex items-start gap-2 bg-physio-bg-core border border-physio-bg-border rounded-lg p-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filterPrefs[pref.key]}
                      onChange={() =>
                        setFilterPrefs(prev => ({
                          ...prev,
                          [pref.key]: !prev[pref.key]
                        }))
                      }
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-semibold text-physio-text-primary">{pref.label}</span>
                      <span className="text-xs text-physio-text-secondary">{pref.helper}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => setFilterPrefsOpen(false)}
                  className="px-3 py-1.5 rounded-full border border-physio-bg-border text-physio-text-secondary hover:text-physio-text-primary"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Injectable Compounds Tab */}
        {activeTab === 'injectables' && (
          <>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-physio-text-primary">Injectable Compounds</h2>
              <p className="text-sm text-physio-text-secondary">Dose scale: mg/week (0-1200mg)</p>
            </div>
            
            <ChartControlBar
              viewMode={viewMode}
              setViewMode={setViewMode}
              compoundType="injectable"
              visibleCompounds={visibleCompounds}
              userProfile={userProfile}
              chartRef={chartRef}
            />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Chart - Takes 3 columns on large screens */}
              <div className="lg:col-span-3">
                <div ref={chartRef}>
                  <DoseResponseChart
                    viewMode={viewMode}
                    visibleCompounds={visibleCompounds}
                    userProfile={userProfile}
                  />
                </div>
              </div>

              {/* Legend - Takes 1 column on large screens */}
              <div className="lg:col-span-1">
                <CustomLegend
                  visibleCompounds={visibleCompounds}
                  toggleCompound={toggleCompound}
                  onMethodologyClick={openMethodology}
                  activeTab={activeTab}
                />
              </div>
            </div>

            {/* Context Drawer */}
            <div className={`${compressedMode ? 'mt-4' : 'mt-6'} bg-physio-bg-secondary border-2 border-physio-accent-cyan rounded-lg ${compressedMode ? 'p-4' : 'p-5'}`}>
              <button
                type="button"
                onClick={() => toggleContextDrawer('injectables')}
                className="w-full flex items-center justify-between text-left"
              >
                <div>
                  <p className="text-xs uppercase tracking-wide text-physio-text-tertiary">Need context?</p>
                  <h3 className="text-lg font-bold text-physio-accent-cyan">Expand to learn how to read the charts</h3>
                </div>
                <CollapseChevron open={!contextCollapsed.injectables} />
              </button>
              {!contextCollapsed.injectables && (
                <div className={`text-sm text-physio-text-primary ${compressedMode ? 'mt-3 space-y-4' : 'mt-5 space-y-6'}`}>
                  <section>
                    <h4 className="font-semibold text-physio-text-secondary mb-2">Quick Guide</h4>
                    <ul className="space-y-1.5">
                      <li><strong>Solid lines = Benefit</strong> • Dotted lines = Risk</li>
                      <li><strong>Shaded bands = Uncertainty</strong> • Wider = less confident data</li>
                      <li><strong>Legend:</strong> Click compounds to show/hide • Tap ⓘ for methodology</li>
                    </ul>
                  </section>
                  <section>
                    <h4 className="font-semibold text-physio-text-secondary mb-2">Common Scenarios</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-physio-bg-tertiary rounded-lg p-4 border-2 border-physio-accent-mint">
                        <div className="font-bold text-physio-accent-mint mb-2">🔰 First Cycle?</div>
                        <p>Start with <strong>Testosterone only</strong> at 300-500mg/week. Observe your baseline response before layering other compounds.</p>
                      </div>
                      <div className="bg-physio-bg-tertiary rounded-lg p-4 border-2 border-physio-accent-cyan">
                        <div className="font-bold text-physio-accent-cyan mb-2">📈 Mass Building</div>
                        <p>Test 500mg + NPP 300mg — optional Dbol 20-30mg (weeks 1-4) for kickstart. Monitor E2 closely.</p>
                      </div>
                      <div className="bg-physio-bg-tertiary rounded-lg p-4 border-2 border-physio-accent-violet">
                        <div className="font-bold text-physio-accent-violet mb-2">✂️ Cutting / Recomp</div>
                        <p>Test 300-400mg + Masteron 400mg. Optional Anavar 50mg (weeks 8-14) for final hardening. Skip wet compounds.</p>
                      </div>
                      <div className="bg-physio-bg-tertiary rounded-lg p-4 border-2 border-physio-error">
                        <div className="font-bold text-physio-error mb-2">⚠️ High Risk ≠ High Reward</div>
                        <p>Tren benefit plateaus ~300mg while risk keeps climbing. Anadrol &gt;75mg pushes hepatic thresholds quickly.</p>
                      </div>
                    </div>
                  </section>
                  <section>
                    <h4 className="font-semibold text-physio-text-secondary mb-2">Evidence Tier System</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border-l-4 border-physio-tier-1 pl-4">
                        <div className="font-bold text-physio-tier-1">Tier 1 · Highest confidence</div>
                        <p className="text-physio-text-secondary">Randomized controlled trials in humans at specific doses.</p>
                      </div>
                      <div className="border-l-4 border-physio-tier-2 pl-4">
                        <div className="font-bold text-physio-tier-2">Tier 2 · High confidence</div>
                        <p className="text-physio-text-secondary">Clinical/therapeutic human data extrapolated to supra levels.</p>
                      </div>
                      <div className="border-l-4 border-physio-tier-3 pl-4">
                        <div className="font-bold text-physio-tier-3">Tier 3 · Medium confidence</div>
                        <p className="text-physio-text-secondary">Animal studies converted to human equivalent dose (HED).</p>
                      </div>
                      <div className="border-l-4 border-physio-tier-4 pl-4">
                        <div className="font-bold text-physio-tier-4">Tier 4 · Low confidence</div>
                        <p className="text-physio-text-secondary">Mechanistic models + aggregated community reports.</p>
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </>
        )}

        {/* Oral Compounds Tab */}
        {activeTab === 'orals' && (
          <>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-physio-text-primary">Oral Compounds</h2>
              <p className="text-sm text-physio-text-secondary">Dose scale: mg/day (0-100mg)</p>
            </div>
            
            <ChartControlBar
              viewMode={viewMode}
              setViewMode={setViewMode}
              compoundType="oral"
              visibleCompounds={visibleCompounds}
              userProfile={userProfile}
              chartRef={chartRef}
            />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Chart - Takes 3 columns on large screens */}
              <div className="lg:col-span-3">
                <div ref={chartRef}>
                  <OralDoseChart
                    viewMode={viewMode}
                    visibleCompounds={visibleCompounds}
                    userProfile={userProfile}
                  />
                </div>
              </div>

              {/* Legend - Takes 1 column on large screens */}
              <div className="lg:col-span-1">
                <CustomLegend
                  visibleCompounds={visibleCompounds}
                  toggleCompound={toggleCompound}
                  onMethodologyClick={openMethodology}
                  activeTab={activeTab}
                />
              </div>
            </div>

            {/* Context Drawer */}
            <div className={`${compressedMode ? 'mt-4' : 'mt-6'} bg-physio-bg-secondary border-2 border-physio-accent-cyan rounded-lg ${compressedMode ? 'p-4' : 'p-5'}`}>
              <button
                type="button"
                onClick={() => toggleContextDrawer('orals')}
                className="w-full flex items-center justify-between text-left"
              >
                <div>
                  <p className="text-xs uppercase tracking-wide text-physio-text-tertiary">Need context?</p>
                  <h3 className="text-lg font-bold text-physio-accent-cyan">Expand to learn how to read the charts</h3>
                </div>
                <CollapseChevron open={!contextCollapsed.orals} />
              </button>
              {!contextCollapsed.orals && (
                <div className={`text-sm text-physio-text-primary ${compressedMode ? 'mt-3 space-y-4' : 'mt-5 space-y-6'}`}>
                  <section>
                    <h4 className="font-semibold text-physio-text-secondary mb-2">Quick Guide</h4>
                    <ul className="space-y-1.5">
                      <li><strong>Solid lines = Benefit</strong> • Dotted lines = Risk</li>
                      <li><strong>Shaded bands = Uncertainty</strong> • Wider = less confident data</li>
                      <li><strong>Legend:</strong> Click compounds to show/hide • Tap ⓘ for methodology</li>
                    </ul>
                  </section>
                  <section>
                    <h4 className="font-semibold text-physio-text-secondary mb-2">Common Scenarios</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-physio-bg-tertiary rounded-lg p-4 border-2 border-physio-accent-mint">
                        <div className="font-bold text-physio-accent-mint mb-2">🔰 First Oral Run</div>
                        <p>Start conservative (Anavar or Tbol 30-40mg). Pair with a TRT-level Test base to manage hormonal balance.</p>
                      </div>
                      <div className="bg-physio-bg-tertiary rounded-lg p-4 border-2 border-physio-accent-cyan">
                        <div className="font-bold text-physio-accent-cyan mb-2">📈 Photo/Stage Finish</div>
                        <p>Lean Test base + Anavar or Winstrol for 4–6 weeks. Layer cardio + hydration management.</p>
                      </div>
                      <div className="bg-physio-bg-tertiary rounded-lg p-4 border-2 border-physio-accent-violet">
                        <div className="font-bold text-physio-accent-violet mb-2">⚙️ Power Boost</div>
                        <p>Dbol 20-30mg (short bursts) to spike neural drive, but manage BP and hematocrit tightly.</p>
                      </div>
                      <div className="bg-physio-bg-tertiary rounded-lg p-4 border-2 border-physio-error">
                        <div className="font-bold text-physio-error mb-2">⚠️ Don’t Stack Orals</div>
                        <p>Doubling up (e.g., Anadrol + Winstrol) cuts into hepatic budget fast. Keep liver support + labs front and center.</p>
                      </div>
                    </div>
                  </section>
                  <section>
                    <h4 className="font-semibold text-physio-text-secondary mb-2">Evidence Tier System</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border-l-4 border-physio-tier-1 pl-4">
                        <div className="font-bold text-physio-tier-1">Tier 1 · Highest confidence</div>
                        <p className="text-physio-text-secondary">Randomized controlled trials in humans at specific doses.</p>
                      </div>
                      <div className="border-l-4 border-physio-tier-2 pl-4">
                        <div className="font-bold text-physio-tier-2">Tier 2 · High confidence</div>
                        <p className="text-physio-text-secondary">Clinical/therapeutic human data extrapolated to supra levels.</p>
                      </div>
                      <div className="border-l-4 border-physio-tier-3 pl-4">
                        <div className="font-bold text-physio-tier-3">Tier 3 · Medium confidence</div>
                        <p className="text-physio-text-secondary">Animal studies converted to human equivalent dose (HED).</p>
                      </div>
                      <div className="border-l-4 border-physio-tier-4 pl-4">
                        <div className="font-bold text-physio-tier-4">Tier 4 · Low confidence</div>
                        <p className="text-physio-text-secondary">Mechanistic models + aggregated community reports.</p>
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </>
        )}

        {/* Interaction Matrix Tab */}
        {activeTab === 'interactions' && (
          <div className="mt-6">
            <InteractionHeatmap
              userProfile={userProfile}
              onPrefillStack={handlePrefillStack}
              resetSignal={interactionResetKey}
              onFiltersDirtyChange={handleInteractionFiltersDirty}
            />
          </div>
        )}

        {/* Stack Builder Tab */}
        {activeTab === 'stack' && (
          <div className="mt-6">
            <StackBuilder prefillStack={stackPrefill} userProfile={userProfile} />
          </div>
        )}

        <section className="mt-8 bg-physio-bg-secondary border border-physio-bg-border rounded-2xl p-5 shadow-sm">
          <button
            type="button"
            onClick={() => setEvidencePanelCollapsed(prev => !prev)}
            className="w-full flex items-center justify-between text-left"
          >
            <div>
              <p className="text-xs uppercase tracking-wide text-physio-text-tertiary">Deep dive</p>
              <h3 className="text-xl font-bold text-physio-text-primary">Evidence & Confidence Layer</h3>
            </div>
            <CollapseChevron open={!evidencePanelCollapsed} />
          </button>
          {!evidencePanelCollapsed && (
            <div className="mt-4">
              <EvidencePanel
                activeTab={activeTab}
                visibleCompounds={visibleCompounds}
              />
            </div>
          )}
        </section>


        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-physio-text-tertiary pb-8">
          <p>Version 1.0 | Last Updated: {new Date().toLocaleDateString()}</p>
          <p className="mt-2">
            This tool is for educational purposes only and does not constitute medical advice.
          </p>
          <p className="mt-2">
            Built with React, Recharts, and evidence-based harm reduction principles.
          </p>
        </footer>
      </div>

      {/* Methodology Modal */}
      {selectedCompound && (
        <MethodologyModal
          compound={selectedCompound}
          onClose={closeMethodology}
        />
      )}
    </div>
  );
};

export default AASVisualization;
