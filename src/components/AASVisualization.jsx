import React, { useState, useRef, useEffect } from 'react';
import ViewToggle from './ViewToggle';
import DoseResponseChart from './DoseResponseChart';
import OralDoseChart from './OralDoseChart';
import CustomLegend from './CustomLegend';
import MethodologyModal from './MethodologyModal';
import PDFExport from './PDFExport';
import InteractionHeatmap from './InteractionHeatmap';
import StackBuilder from './StackBuilder';
import SideEffectProfile from './SideEffectProfile';
import AncillaryCalculator from './AncillaryCalculator';
import PersonalizationPanel from './PersonalizationPanel.jsx';
import EvidencePanel from './EvidencePanel';
import SweetSpotFinder from './SweetSpotFinder';
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

  const handleClearProfile = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
    setUserProfile({ ...defaultProfile });
  };

  const [stackPrefill, setStackPrefill] = useState(null);

  const handlePrefillStack = (compounds) => {
    setStackPrefill({ id: Date.now(), compounds });
    setActiveTab('stack');
  };
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

        <PersonalizationPanel
          profile={userProfile}
          onProfileChange={setUserProfile}
          onClearProfile={handleClearProfile}
        />

        {/* Tab Navigation - Underline Style */}
        <div className="mb-8 border-b border-physio-bg-border">
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
        </div>

        {/* Injectable Compounds Tab */}
        {activeTab === 'injectables' && (
          <>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-physio-text-primary">Injectable Compounds</h2>
              <p className="text-sm text-physio-text-secondary">Dose scale: mg/week (0-1200mg)</p>
            </div>
            
            {/* Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <SweetSpotFinder
                  compoundType="injectable"
                  visibleCompounds={visibleCompounds}
                  userProfile={userProfile}
                />
                <PDFExport chartRef={chartRef} />
              </div>
            </div>

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

            {/* Quick Guide */}
            <div className="mt-8 bg-physio-bg-secondary border-2 border-physio-accent-cyan rounded-lg p-5">
              <h3 className="text-lg font-bold text-physio-accent-cyan mb-3">
                📘 Quick Guide
              </h3>
              <ul className="space-y-1.5 text-sm text-physio-text-primary">
                <li><strong>Solid lines = Benefit</strong> • Dotted lines = Risk</li>
                <li><strong>Shaded bands = Uncertainty</strong> • Wider = less confident data</li>
                <li><strong>Legend:</strong> Click compounds to show/hide • Click ⓘ for methodology</li>
              </ul>
            </div>

            {/* Scenario Callouts */}
            <div className="mt-6 bg-physio-bg-secondary border-2 border-physio-accent-cyan rounded-lg p-6">
              <h3 className="text-xl font-bold text-physio-accent-cyan mb-4">
                💡 Common Scenarios
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-physio-bg-tertiary rounded-lg p-4 border-2 border-physio-accent-mint">
                  <div className="font-bold text-physio-accent-mint mb-2">🔰 First Cycle?</div>
                  <div className="text-sm text-physio-text-primary">Start with <strong>Testosterone only</strong> at 300-500mg/week. Observe: this is your baseline response. Add complexity only after you understand how YOU respond to Test alone.</div>
                </div>
                <div className="bg-physio-bg-tertiary rounded-lg p-4 border-2 border-physio-accent-cyan">
                  <div className="font-bold text-physio-accent-cyan mb-2">📈 Mass Building?</div>
                  <div className="text-sm text-physio-text-primary">Test 500mg + NPP 300mg = classic bulk stack. Optional: Dbol 20-30mg (weeks 1-4) for kickstart. Watch E2 closely with Dbol.</div>
                </div>
                <div className="bg-physio-bg-tertiary rounded-lg p-4 border-2 border-physio-accent-violet">
                  <div className="font-bold text-physio-accent-violet mb-2">✂️ Cutting/Recomp?</div>
                  <div className="text-sm text-physio-text-primary">Test 300-400mg + Masteron 400mg. Optional: Anavar 50mg (weeks 8-14) for final hardening. Avoid wet compounds (Dbol, Adrol).</div>
                </div>
                <div className="bg-physio-bg-tertiary rounded-lg p-4 border-2 border-physio-error">
                  <div className="font-bold text-physio-error mb-2">⚠️ High Risk = High Reward?</div>
                  <div className="text-sm text-physio-text-primary"><strong>No.</strong> Trenbolone benefit plateaus at 300mg, but risk keeps climbing. Anadrol &gt;75mg = hepatic crisis territory. More ≠ better at extreme doses.</div>
                </div>
              </div>
            </div>

            {/* Evidence Tiers Quick Reference */}
            <div className="mt-6 bg-physio-bg-secondary border-2 border-physio-bg-border rounded-lg p-6">
              <h3 className="text-xl font-bold text-physio-text-primary mb-3">
                📊 Evidence Tier System
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="border-l-4 border-physio-tier-1 pl-4">
                  <div className="font-bold text-physio-tier-1">Tier 1 (Highest Confidence)</div>
                  <div className="text-physio-text-secondary">Randomized controlled trials in humans at specific doses</div>
                </div>
                <div className="border-l-4 border-physio-tier-2 pl-4">
                  <div className="font-bold text-physio-tier-2">Tier 2 (High Confidence)</div>
                  <div className="text-physio-text-secondary">Clinical/therapeutic human data, extrapolated to supraphysiological doses</div>
                </div>
                <div className="border-l-4 border-physio-tier-3 pl-4">
                  <div className="font-bold text-physio-tier-3">Tier 3 (Medium Confidence)</div>
                  <div className="text-physio-text-secondary">Animal studies converted to human equivalent dose (HED)</div>
                </div>
                <div className="border-l-4 border-physio-tier-4 pl-4">
                  <div className="font-bold text-physio-tier-4">Tier 4 (Lower Confidence)</div>
                  <div className="text-physio-text-secondary">Pharmacological theory + aggregated community reports</div>
                </div>
              </div>
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
            
            {/* Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <SweetSpotFinder
                  compoundType="oral"
                  visibleCompounds={visibleCompounds}
                  userProfile={userProfile}
                />
                <PDFExport chartRef={chartRef} />
              </div>
            </div>

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
          </>
        )}

        {/* Interaction Matrix Tab */}
        {activeTab === 'interactions' && (
          <div className="mt-6">
            <InteractionHeatmap
              userProfile={userProfile}
              onPrefillStack={handlePrefillStack}
            />
          </div>
        )}

        {/* Stack Builder Tab */}
        {activeTab === 'stack' && (
          <div className="mt-6">
            <StackBuilder prefillStack={stackPrefill} />
          </div>
        )}

        <EvidencePanel
          activeTab={activeTab}
          visibleCompounds={visibleCompounds}
        />


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
