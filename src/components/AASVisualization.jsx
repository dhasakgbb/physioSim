import React, { useState, useRef, useEffect, useCallback, lazy, Suspense, useMemo } from 'react';
import DoseResponseChart from './DoseResponseChart';
import OralDoseChart from './OralDoseChart';
import CustomLegend from './CustomLegend';
import MethodologyModal from './MethodologyModal';
import InteractionHeatmap from './InteractionHeatmap';
import StackBuilder from './StackBuilder';
import PersonalizationPanel from './PersonalizationPanel.jsx';
import ProfileContextBar from './ProfileContextBar.jsx';
import NavigationRail from './NavigationRail.jsx';
import CompoundChipRail from './CompoundChipRail.jsx';
import UtilityCardRow from './UtilityCardRow.jsx';
import CompoundInsightCard from './CompoundInsightCard.jsx';
import ChartControlBar from './ChartControlBar';
import ContextDrawer from './ContextDrawer';
import { compoundData } from '../data/compoundData';
import { defaultProfile, PROFILE_STORAGE_KEY } from '../utils/personalization';
import { readJSONStorage, writeJSONStorage, removeStorageKey } from '../utils/storage';
import { LAYOUT_FILTER_PREFS_KEY } from '../utils/storageKeys';

const EvidencePanel = lazy(() => import('./EvidencePanel'));

const mergeStoredProfile = (storedProfile) => {
  if (!storedProfile) return { ...defaultProfile };
  const merged = {
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
  if (storedProfile.meta) {
    merged.meta = { ...storedProfile.meta };
  }
  return merged;
};

const withProfileMeta = (profile = defaultProfile) => ({
  ...profile,
  meta: {
    ...(profile?.meta || {}),
    unsaved: profile?.meta?.unsaved ?? false,
    savedAt: profile?.meta?.savedAt ?? null
  }
});

const FILTER_TRACKING_OPTIONS = [
  {
    key: 'viewMode',
    label: 'Chart view mode',
    helper: 'Benefit-only or risk-only counts as dirty.'
  },
  {
    key: 'density',
    label: 'Layout density',
    helper: 'Compressed layout toggles the chip.'
  },
  {
    key: 'interaction',
    label: 'Interaction controls',
    helper: 'Heatmap focus, goal preset, evidence blend.'
  },
  {
    key: 'legend',
    label: 'Legend visibility',
    helper: 'Hide/show compounds counts as dirty + resets with the global button.'
  }
];

const NAV_TABS = [
  { key: 'injectables', label: 'Injectables' },
  { key: 'orals', label: 'Orals' },
  { key: 'interactions', label: 'Interactions' },
  { key: 'stack', label: 'Stack Builder' }
];

const defaultFilterPrefs = FILTER_TRACKING_OPTIONS.reduce((acc, option) => {
  acc[option.key] = option.key === 'legend' ? false : true;
  return acc;
}, {});

const buildDefaultVisibilityMap = () =>
  Object.keys(compoundData).reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {});

const AASVisualization = () => {
  // Active tab: 'injectables', 'orals', 'interactions', 'stack'
  const [activeTab, setActiveTab] = useState('injectables');
  
  // View mode: 'benefit', 'risk', 'efficiency', or 'uncertainty'
  const [viewMode, setViewMode] = useState('benefit');
  
  // Visible compounds (all visible by default)
  const [visibleCompounds, setVisibleCompounds] = useState(() => buildDefaultVisibilityMap());
  const [hoveredCompound, setHoveredCompound] = useState(null);
  
  // Methodology modal state
  const [selectedCompound, setSelectedCompound] = useState(null);

  // Personalization state
  const [userProfile, setUserProfile] = useState(() => {
    const stored = readJSONStorage(PROFILE_STORAGE_KEY, null);
    if (!stored) return withProfileMeta(defaultProfile);
    return withProfileMeta(mergeStoredProfile(stored));
  });
  const applyProfileUpdate = useCallback(
    (updater, { markUnsaved = true } = {}) => {
      setUserProfile(prev => {
        const previous = prev || defaultProfile;
        const nextValue = typeof updater === 'function' ? updater(previous) : updater;
        const normalized = withProfileMeta(nextValue);
        if (markUnsaved) {
          return {
            ...normalized,
            meta: {
              ...normalized.meta,
              unsaved: true
            }
          };
        }
        return {
          ...normalized,
          meta: {
            ...normalized.meta,
            unsaved: false
          }
        };
      });
    },
    []
  );
  const profileUnsaved = Boolean(userProfile?.meta?.unsaved);
  const [uiMode, setUIMode] = useState(() => (userProfile?.labMode?.enabled ? 'lab' : 'simple'));

  useEffect(() => {
    writeJSONStorage(PROFILE_STORAGE_KEY, userProfile);
  }, [userProfile]);


  const handleClearProfile = () => {
    removeStorageKey(PROFILE_STORAGE_KEY);
    applyProfileUpdate(() => ({ ...defaultProfile }), { markUnsaved: false });
  };

  const handleSaveProfile = () => {
    applyProfileUpdate(
      prev => ({
        ...prev,
        meta: {
          ...(prev?.meta || {}),
          savedAt: Date.now()
        }
      }),
      { markUnsaved: false }
    );
  };

  const [stackPrefill, setStackPrefill] = useState(null);
  const [filterPrefs, setFilterPrefs] = useState(defaultFilterPrefs);
  const [contextCollapsed, setContextCollapsed] = useState({
    injectables: true,
    orals: true
  });
  const [evidenceReady, setEvidenceReady] = useState({
    injectables: false,
    orals: false
  });
  const [compressedMode, setCompressedMode] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [filtersDirty, setFiltersDirty] = useState(false);
  const [interactionFiltersDirty, setInteractionFiltersDirty] = useState(false);
  const [interactionResetKey, setInteractionResetKey] = useState(0);
  const [filterPrefsOpen, setFilterPrefsOpen] = useState(false);

  const activeCompoundType = useMemo(() => {
    if (activeTab === 'injectables') return 'injectable';
    if (activeTab === 'orals') return 'oral';
    return null;
  }, [activeTab]);

  const activeCompoundKeys = useMemo(() => {
    if (!activeCompoundType) return [];
    return Object.keys(compoundData).filter(key => compoundData[key]?.type === activeCompoundType);
  }, [activeCompoundType]);

  const legendHiddenCount = useMemo(() => {
    if (!activeCompoundKeys.length) return 0;
    return activeCompoundKeys.filter(key => !visibleCompounds[key]).length;
  }, [activeCompoundKeys, visibleCompounds]);

  const filterStatusItems = useMemo(() => {
    const items = [];
    if (filterPrefs.viewMode && viewMode !== 'benefit') {
      items.push({
        key: 'viewMode',
        label: 'View mode',
        description:
          viewMode === 'risk'
            ? 'Risk lens active'
            : viewMode === 'efficiency'
            ? 'Efficiency ratio view'
            : 'Uncertainty spotlight'
      });
    }
    if (filterPrefs.density && compressedMode) {
      items.push({ key: 'density', label: 'Layout density', description: 'Compressed spacing enabled' });
    }
    if (filterPrefs.legend && legendHiddenCount > 0) {
      items.push({
        key: 'legend',
        label: 'Legend filters',
        description: `${legendHiddenCount} hidden ${legendHiddenCount === 1 ? 'compound' : 'compounds'}`
      });
    }
    if (filterPrefs.interaction && interactionFiltersDirty) {
      items.push({ key: 'interaction', label: 'Interaction focus', description: 'Custom heatmap filters' });
    }
    return items;
  }, [filterPrefs, viewMode, compressedMode, legendHiddenCount, interactionFiltersDirty]);

  useEffect(() => {
    const stored = readJSONStorage(LAYOUT_FILTER_PREFS_KEY, null);
    if (stored) {
      setFilterPrefs(prev => ({
        ...prev,
        ...stored
      }));
    }
  }, []);

  useEffect(() => {
    writeJSONStorage(LAYOUT_FILTER_PREFS_KEY, filterPrefs);
  }, [filterPrefs]);

  const toggleContextDrawer = (tabKey) => {
    setContextCollapsed(prev => {
      const nextCollapsed = !prev[tabKey];
      if (!nextCollapsed) {
        setEvidenceReady(prevReady => {
          if (prevReady[tabKey]) return prevReady;
          return {
            ...prevReady,
            [tabKey]: true
          };
        });
      }
      return {
        ...prev,
        [tabKey]: nextCollapsed
      };
    });
  };

  const handleInterfaceModeChange = useCallback((mode) => {
    setUIMode(mode);
    applyProfileUpdate(
      prev => ({
        ...prev,
        labMode: {
          ...(prev?.labMode || defaultProfile.labMode),
          enabled: mode === 'lab'
        }
      }),
      { markUnsaved: false }
    );
  }, [applyProfileUpdate]);

  const handlePrefillStack = (compounds) => {
    setStackPrefill({ id: Date.now(), compounds });
    setActiveTab('stack');
  };

  useEffect(() => {
    setFiltersDirty(filterStatusItems.length > 0);
  }, [filterStatusItems]);

  const handleInteractionFiltersDirty = useCallback((dirty) => {
    setInteractionFiltersDirty(dirty);
  }, []);

  const resetAllFilters = useCallback(() => {
    setViewMode('benefit');
    setCompressedMode(false);
    setVisibleCompounds(buildDefaultVisibilityMap());
    setInteractionResetKey(prev => prev + 1);
    setInteractionFiltersDirty(false);
    setHoveredCompound(null);
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
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-physio-text-secondary">Interface mode</span>
            <div className="inline-flex rounded-full border border-physio-bg-border bg-physio-bg-core">
              <button
                onClick={() => handleInterfaceModeChange('simple')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full transition ${
                  uiMode === 'simple'
                    ? 'bg-physio-accent-cyan text-white shadow-physio-strong'
                    : 'text-physio-text-secondary'
                }`}
              >
                Simple
              </button>
              <button
                onClick={() => handleInterfaceModeChange('lab')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full transition ${
                  uiMode === 'lab'
                    ? 'bg-physio-accent-violet text-white shadow-physio-strong'
                    : 'text-physio-text-secondary'
                }`}
              >
                Lab
              </button>
            </div>
            <span className="text-xs text-physio-text-tertiary">
              {uiMode === 'simple'
                ? 'Keeps focus on planning and guardrails.'
                : 'Shows evidence sliders, interaction surfaces, and optimizers.'}
            </span>
          </div>
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

        <div className="space-y-5 mb-8">
          <ProfileContextBar
            profile={userProfile}
            unsaved={profileUnsaved}
            onEditProfile={() => setProfileModalOpen(true)}
            onSaveProfile={handleSaveProfile}
            onResetProfile={handleClearProfile}
            filterItems={filterStatusItems}
            onResetFilters={resetAllFilters}
            onManageFilters={() => setFilterPrefsOpen(true)}
          />

          <div className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <NavigationRail tabs={NAV_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
              <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                <button
                  onClick={() => setFilterPrefsOpen(prev => !prev)}
                  className="px-3 py-1.5 rounded-full border border-physio-bg-border text-xs font-semibold text-physio-text-secondary hover:text-physio-text-primary hover:border-physio-accent-cyan transition"
                >
                  Filter tracking
                </button>
                {filtersDirty && (
                  <button
                    onClick={resetAllFilters}
                    className="px-3 py-1.5 rounded-full border border-physio-accent-cyan text-xs font-semibold text-physio-accent-cyan hover:bg-physio-accent-cyan/10 transition"
                  >
                    Reset filters
                  </button>
                )}
                <button
                  onClick={() => setCompressedMode(prev => !prev)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition ${
                    compressedMode
                      ? 'border-physio-accent-cyan text-physio-accent-cyan'
                      : 'border-physio-bg-border text-physio-text-secondary hover:text-physio-text-primary'
                  }`}
                >
                  {compressedMode ? 'Dense layout' : 'Comfort layout'}
                </button>
              </div>
            </div>

            {filterPrefsOpen && (
              <div className="p-4 border border-physio-bg-border rounded-2xl bg-physio-bg-secondary shadow-physio-subtle">
                <p className="text-xs uppercase tracking-wide text-physio-text-tertiary mb-2">Filters counted</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-physio-text-secondary">
                  {FILTER_TRACKING_OPTIONS.map(pref => (
                    <label
                      key={pref.key}
                      className="flex items-start gap-2 bg-physio-bg-core border border-physio-bg-border rounded-xl p-3 cursor-pointer"
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

            {activeCompoundType && (
              <CompoundChipRail
                compoundType={activeCompoundType}
                visibleCompounds={visibleCompounds}
                toggleCompound={toggleCompound}
                onHover={setHoveredCompound}
                highlightedCompound={hoveredCompound}
              />
            )}
          </div>
        </div>

        {/* Injectable Compounds Tab */}
        {activeTab === 'injectables' && (
          <>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-physio-text-primary">Injectable Compounds</h2>
              <p className="text-sm text-physio-text-secondary">Dose scale: mg/week (0-1200mg)</p>
            </div>
            <section className="bg-physio-bg-secondary/80 border border-physio-bg-border rounded-4xl p-4 sm:p-6 shadow-physio-subtle space-y-6">
              <div className="flex flex-col xl:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <ChartControlBar viewMode={viewMode} setViewMode={setViewMode} />
                  <div className="bg-physio-bg-core/80 border border-physio-bg-border rounded-3xl p-3 sm:p-4" ref={chartRef}>
                    <DoseResponseChart
                      viewMode={viewMode}
                      visibleCompounds={visibleCompounds}
                      userProfile={userProfile}
                      highlightedCompound={hoveredCompound}
                    />
                  </div>
                </div>

                <aside className="xl:w-80 space-y-4">
                  <CustomLegend
                    visibleCompounds={visibleCompounds}
                    toggleCompound={toggleCompound}
                    onMethodologyClick={openMethodology}
                    onToggleAll={(action, keys) => {
                      setVisibleCompounds(prev => {
                        const next = { ...prev };
                        (keys || activeCompoundKeys).forEach(key => {
                          if (action === 'all-on') next[key] = true;
                          if (action === 'all-off') next[key] = false;
                        });
                        return next;
                      });
                    }}
                    activeTab={activeTab}
                    onCompoundHover={setHoveredCompound}
                    highlightedCompound={hoveredCompound}
                  />

                  <div className="bg-physio-bg-core/60 border border-physio-bg-border rounded-3xl p-3 space-y-3 max-h-[520px] overflow-auto">
                    <p className="text-xs uppercase tracking-wide text-physio-text-tertiary">Compound insights</p>
                    <div className="grid gap-3">
                      {activeCompoundKeys.length ? (
                        activeCompoundKeys.map(compoundKey => (
                          <CompoundInsightCard
                            key={compoundKey}
                            compoundKey={compoundKey}
                            profile={userProfile}
                            onHover={setHoveredCompound}
                            onToggle={toggleCompound}
                            visible={visibleCompounds[compoundKey]}
                            isHighlighted={hoveredCompound === compoundKey}
                          />
                        ))
                      ) : (
                        <p className="text-xs text-physio-text-secondary">No injectables available.</p>
                      )}
                    </div>
                  </div>
                </aside>
              </div>

              <UtilityCardRow
                compoundType="injectable"
                visibleCompounds={visibleCompounds}
                userProfile={userProfile}
                chartRef={chartRef}
                onOpenProfile={() => setProfileModalOpen(true)}
              />
            </section>

            <ContextDrawer
              dataSection="context-drawer"
              collapsed={contextCollapsed.injectables}
              onToggle={() => toggleContextDrawer('injectables')}
              renderEvidence={() =>
                evidenceReady.injectables ? (
                  <Suspense fallback={<p className="text-xs text-physio-text-tertiary">Loading evidence deck…</p>}>
                    <EvidencePanel activeTab={activeTab} visibleCompounds={visibleCompounds} />
                  </Suspense>
                ) : (
                  <p className="text-xs text-physio-text-tertiary">Expand the drawer to load the evidence breakdown.</p>
                )
              }
            >
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
            </ContextDrawer>
          </>
        )}

        {/* Oral Compounds Tab */}
        {activeTab === 'orals' && (
          <>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-physio-text-primary">Oral Compounds</h2>
              <p className="text-sm text-physio-text-secondary">Dose scale: mg/day (0-100mg)</p>
            </div>
            <section className="bg-physio-bg-secondary/80 border border-physio-bg-border rounded-4xl p-4 sm:p-6 shadow-physio-subtle space-y-6">
              <div className="flex flex-col xl:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <ChartControlBar viewMode={viewMode} setViewMode={setViewMode} />
                  <div className="bg-physio-bg-core/80 border border-physio-bg-border rounded-3xl p-3 sm:p-4" ref={chartRef}>
                    <OralDoseChart
                      viewMode={viewMode}
                      visibleCompounds={visibleCompounds}
                      userProfile={userProfile}
                      highlightedCompound={hoveredCompound}
                    />
                  </div>
                </div>

                <aside className="xl:w-80 space-y-4">
                  <CustomLegend
                    visibleCompounds={visibleCompounds}
                    toggleCompound={toggleCompound}
                    onMethodologyClick={openMethodology}
                    onToggleAll={(action, keys) => {
                      setVisibleCompounds(prev => {
                        const next = { ...prev };
                        (keys || activeCompoundKeys).forEach(key => {
                          if (action === 'all-on') next[key] = true;
                          if (action === 'all-off') next[key] = false;
                        });
                        return next;
                      });
                    }}
                    activeTab={activeTab}
                    onCompoundHover={setHoveredCompound}
                    highlightedCompound={hoveredCompound}
                  />

                  <div className="bg-physio-bg-core/60 border border-physio-bg-border rounded-3xl p-3 space-y-3 max-h-[520px] overflow-auto">
                    <p className="text-xs uppercase tracking-wide text-physio-text-tertiary">Compound insights</p>
                    <div className="grid gap-3">
                      {activeCompoundKeys.length ? (
                        activeCompoundKeys.map(compoundKey => (
                          <CompoundInsightCard
                            key={compoundKey}
                            compoundKey={compoundKey}
                            profile={userProfile}
                            onHover={setHoveredCompound}
                            onToggle={toggleCompound}
                            visible={visibleCompounds[compoundKey]}
                            isHighlighted={hoveredCompound === compoundKey}
                          />
                        ))
                      ) : (
                        <p className="text-xs text-physio-text-secondary">No oral compounds available.</p>
                      )}
                    </div>
                  </div>
                </aside>
              </div>

              <UtilityCardRow
                compoundType="oral"
                visibleCompounds={visibleCompounds}
                userProfile={userProfile}
                chartRef={chartRef}
                onOpenProfile={() => setProfileModalOpen(true)}
              />
            </section>

            <ContextDrawer
              dataSection="context-drawer-orals"
              collapsed={contextCollapsed.orals}
              onToggle={() => toggleContextDrawer('orals')}
              renderEvidence={() =>
                evidenceReady.orals ? (
                  <Suspense fallback={<p className="text-xs text-physio-text-tertiary">Loading evidence deck…</p>}>
                    <EvidencePanel activeTab={activeTab} visibleCompounds={visibleCompounds} />
                  </Suspense>
                ) : (
                  <p className="text-xs text-physio-text-tertiary">Expand the drawer to load the evidence breakdown.</p>
                )
              }
            >
              <section>
                <h4 className="font-semibold text-physio-text-secondary mb-2">Risk Guardrails</h4>
                <ul className="space-y-1.5">
                  <li><strong>Liver Stress:</strong> Keep Alk-Phos/ALT bloodwork within 1.3x baseline every 6 weeks.</li>
                  <li><strong>Blood Pressure:</strong> Above 140/90? Pause orals immediately.</li>
                  <li><strong>Cycle Length:</strong> 6-8 weeks max for 17aa orals. Longer = +hepatic risk.</li>
                </ul>
              </section>
              <section>
                <h4 className="font-semibold text-physio-text-secondary mb-2">Stack Patterns</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-physio-bg-tertiary rounded-lg p-4 border-2 border-physio-accent-cyan">
                    <div className="font-bold text-physio-accent-cyan mb-2">⚡ Kickstart</div>
                    <p>Dbol 30mg (Weeks 1-4) layered onto Test E base. Watch BP + hematocrit.</p>
                  </div>
                  <div className="bg-physio-bg-tertiary rounded-lg p-4 border-2 border-physio-accent-violet">
                    <div className="font-bold text-physio-accent-violet mb-2">✨ Hardening</div>
                    <p>Anavar 40-60mg with Test 300mg. Add Masteron if bodyfat &lt;12%.</p>
                  </div>
                  <div className="bg-physio-bg-tertiary rounded-lg p-4 border-2 border-physio-accent-mint">
                    <div className="font-bold text-physio-accent-mint mb-2">🧱 Recomp</div>
                    <p>Turinabol 50mg with NPP 300mg offers dry gain profile + manageable BP.</p>
                  </div>
                  <div className="bg-physio-bg-tertiary rounded-lg p-4 border-2 border-physio-error">
                    <div className="font-bold text-physio-error mb-2">⚠️ Guardrails</div>
                    <p>Never stack two 17aa orals together. Avoid alcohol/NSAIDs during oral cycles.</p>
                  </div>
                </div>
              </section>
              <section>
                <h4 className="font-semibold text-physio-text-secondary mb-2">Bloodwork Monitoring</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-physio-text-secondary">
                  <div>
                    <p className="font-semibold text-physio-text-primary">Baseline</p>
                    <p>AST/ALT, Alk Phos, Bilirubin, Lipids, BP</p>
                  </div>
                  <div>
                    <p className="font-semibold text-physio-text-primary">Mid-cycle</p>
                    <p>Repeat hepatic panel + BP weekly</p>
                  </div>
                  <div>
                    <p className="font-semibold text-physio-text-primary">Post-cycle</p>
                    <p>Ensure enzymes normalize before next cycle</p>
                  </div>
                </div>
              </section>
            </ContextDrawer>
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
              uiMode={uiMode}
            />
          </div>
        )}

        {/* Stack Builder Tab */}
        {activeTab === 'stack' && (
          <div className="mt-6">
            <StackBuilder prefillStack={stackPrefill} userProfile={userProfile} uiMode={uiMode} />
          </div>
        )}

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

      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-physio-bg-secondary border border-physio-bg-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-physio-bg-border">
              <div>
                <p className="text-xs uppercase tracking-wide text-physio-text-tertiary">Profile controls</p>
                <h3 className="text-xl font-semibold text-physio-text-primary">Personalize guidance</h3>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="px-3 py-1.5 rounded-full border border-physio-bg-border text-physio-text-secondary hover:text-physio-text-primary"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <PersonalizationPanel
                profile={userProfile}
                onProfileChange={applyProfileUpdate}
                onClearProfile={handleClearProfile}
                compressed
              />
            </div>
          </div>
        </div>
      )}

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
