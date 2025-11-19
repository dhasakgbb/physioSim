import React, { useState, useRef, useEffect, useCallback, lazy, Suspense, useMemo } from 'react';
import DoseResponseChart from './DoseResponseChart';
import OralDoseChart from './OralDoseChart';
import CustomLegend from './CustomLegend';
import MethodologyModal from './MethodologyModal';
import InteractionHeatmap from './InteractionHeatmap';
import StackBuilder from './StackBuilder';
import PersonalizationPanel from './PersonalizationPanel.jsx';
import UtilityCardRow from './UtilityCardRow.jsx';
import CompoundInsightCard from './CompoundInsightCard.jsx';
import ChartControlBar from './ChartControlBar';
import Layout from './Layout';
import { compoundData } from '../data/compoundData';
import { defaultProfile, PROFILE_STORAGE_KEY } from '../utils/personalization';
import { readJSONStorage, writeJSONStorage, removeStorageKey } from '../utils/storage';
import { LAYOUT_FILTER_PREFS_KEY } from '../utils/storageKeys';

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
  { key: 'injectables', label: 'Injectables Dashboard' },
  { key: 'orals', label: 'Orals Dashboard' },
  { key: 'interactions', label: 'Interaction Matrix' },
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
  const [compressedMode, setCompressedMode] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileStripExpanded, setProfileStripExpanded] = useState(false);
  const [filtersDirty, setFiltersDirty] = useState(false);
  const [interactionFiltersDirty, setInteractionFiltersDirty] = useState(false);
  const [interactionResetKey, setInteractionResetKey] = useState(0);

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
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      navTabs={NAV_TABS}
      userProfile={userProfile}
      profileUnsaved={profileUnsaved}
      onEditProfile={() => {
        setProfileStripExpanded(true);
        setProfileModalOpen(true);
      }}
      onSaveProfile={handleSaveProfile}
      onResetProfile={handleClearProfile}
      profileExpanded={profileStripExpanded}
      onToggleProfileExpand={() => setProfileStripExpanded(prev => !prev)}
      filterItems={filterStatusItems}
      onResetFilters={resetAllFilters}
      onManageFilters={() => {}} // Placeholder for now
    >
      {/* Injectable Compounds Tab */}
      {activeTab === 'injectables' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 animate-fade-in">
          <div className="space-y-4 min-w-0">
            <ChartControlBar viewMode={viewMode} setViewMode={setViewMode} />
            <div className="bg-physio-bg-core border border-physio-border-subtle rounded-xl p-1 overflow-hidden relative group">
              <div ref={chartRef} className="h-[500px] w-full">
                <DoseResponseChart
                  viewMode={viewMode}
                  visibleCompounds={visibleCompounds}
                  userProfile={userProfile}
                  highlightedCompound={hoveredCompound}
                />
              </div>
            </div>
            
            <UtilityCardRow
              compoundType="injectable"
              visibleCompounds={visibleCompounds}
              userProfile={userProfile}
              chartRef={chartRef}
              onOpenProfile={() => setProfileModalOpen(true)}
            />
          </div>

          <div className="space-y-4">
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
            
            <div className="bg-physio-bg-core border border-physio-border-subtle rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-physio-text-tertiary">Intel</p>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {activeCompoundKeys.map(compoundKey => (
                  <CompoundInsightCard
                    key={compoundKey}
                    compoundKey={compoundKey}
                    profile={userProfile}
                    onHover={setHoveredCompound}
                    onToggle={toggleCompound}
                    visible={visibleCompounds[compoundKey]}
                    isHighlighted={hoveredCompound === compoundKey}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Oral Compounds Tab */}
      {activeTab === 'orals' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 animate-fade-in">
          <div className="space-y-4 min-w-0">
            <ChartControlBar viewMode={viewMode} setViewMode={setViewMode} />
            <div className="bg-physio-bg-core border border-physio-border-subtle rounded-xl p-1 overflow-hidden">
              <div ref={chartRef} className="h-[500px] w-full">
                <OralDoseChart
                  viewMode={viewMode}
                  visibleCompounds={visibleCompounds}
                  userProfile={userProfile}
                  highlightedCompound={hoveredCompound}
                />
              </div>
            </div>
            
            <UtilityCardRow
              compoundType="oral"
              visibleCompounds={visibleCompounds}
              userProfile={userProfile}
              chartRef={chartRef}
              onOpenProfile={() => setProfileModalOpen(true)}
            />
          </div>

          <div className="space-y-4">
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
            
            <div className="bg-physio-bg-core border border-physio-border-subtle rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-physio-text-tertiary">Insights</p>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {activeCompoundKeys.map(compoundKey => (
                  <CompoundInsightCard
                    key={compoundKey}
                    compoundKey={compoundKey}
                    profile={userProfile}
                    onHover={setHoveredCompound}
                    onToggle={toggleCompound}
                    visible={visibleCompounds[compoundKey]}
                    isHighlighted={hoveredCompound === compoundKey}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interaction Matrix Tab */}
      {activeTab === 'interactions' && (
        <div className="animate-fade-in">
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
        <div className="animate-fade-in">
          <StackBuilder prefillStack={stackPrefill} userProfile={userProfile} uiMode={uiMode} />
        </div>
      )}

      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-physio-bg-surface border border-physio-border-active rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-physio-border-subtle">
              <div>
                <p className="text-xs uppercase tracking-wide text-physio-text-tertiary">Profile</p>
                <h3 className="text-xl font-bold text-physio-text-primary">Personalize Model</h3>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="px-3 py-1.5 rounded border border-physio-border-subtle text-physio-text-secondary hover:text-physio-text-primary hover:bg-physio-bg-subtle"
              >
                Close
              </button>
            </div>
            <div className="p-6">
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
    </Layout>
  );
};

export default AASVisualization;
