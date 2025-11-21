import React, { useEffect, useMemo, useState } from "react";
import SerumStabilityChart from "./SerumStabilityChart";
import CycleEvolutionChart from "./CycleEvolutionChart";
import OptimizerPane from "./OptimizerPane";
import SignalingNetwork from "./SignalingNetwork";
import { useStack } from "../../context/StackContext";
import { CenterPane } from "./CenterPane";

const NET_FAMILY_TABS = new Set(["efficiency", "serum", "evolution"]);
const VIEW_MODE_TO_TAB = {
  net: "efficiency",
  optimize: "optimize",
  network: "pathways",
};
const TAB_TO_VIEW_MODE = {
  efficiency: "net",
  serum: "net",
  evolution: "net",
  optimize: "optimize",
  pathways: "network",
};

const TabbedChartCanvas = ({ onTimeScrub }) => {
  const {
    stack,
    userProfile,
    setUserProfile,
    setStack,
    metrics,
    viewMode,
    setViewMode,
  } = useStack();

  const initialTab = useMemo(() => VIEW_MODE_TO_TAB[viewMode] || "efficiency", [viewMode]);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const targetTab = VIEW_MODE_TO_TAB[viewMode];
    if (!targetTab) return;

    if (viewMode === "net") {
      if (!NET_FAMILY_TABS.has(activeTab)) {
        setActiveTab(targetTab);
      }
      return;
    }

    if (activeTab !== targetTab) {
      setActiveTab(targetTab);
    }
  }, [viewMode, activeTab]);

  const tabs = [
    { id: 'efficiency', label: 'Efficiency' },
    { id: 'serum', label: 'Serum Levels' },
    { id: 'evolution', label: 'Evolution' },
    { id: 'optimize', label: 'Optimize' },
    { id: 'pathways', label: 'Pathways' },
  ];

  const renderActiveChart = () => {
    if (activeTab === 'efficiency') {
      return <CenterPane onTimeScrub={onTimeScrub} />;
    }

    if (activeTab === 'serum') {
      return <SerumStabilityChart onTimeScrub={onTimeScrub} />;
    }

    if (activeTab === 'evolution') {
      return <CycleEvolutionChart onTimeScrub={onTimeScrub} />;
    }

    if (activeTab === 'optimize') {
      return (
        <OptimizerPane
          stack={stack}
          userProfile={userProfile}
          onUpdateProfile={setUserProfile}
          onApplyOptimization={(newStack) => setStack(newStack)}
        />
      );
    }

    if (activeTab === 'pathways') {
      return <SignalingNetwork stack={stack} metrics={metrics} />;
    }

    return null;
  };

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);
    const mappedMode = TAB_TO_VIEW_MODE[nextTab] || "net";
    if (mappedMode !== viewMode) {
      setViewMode(mappedMode);
    }
  };

  const openDrawer = (target) => {
    if (typeof window === "undefined") return;
    const eventName = target === "stack" ? "open-stack-drawer" : "open-inspector-drawer";
    window.dispatchEvent(new CustomEvent(eventName));
  };

  return (
    <main className="flex flex-col h-screen w-full bg-[#0A0A0A] overflow-hidden relative">
      <header className="h-14 shrink-0 flex items-center justify-between border-b border-white/5 px-6 bg-[#0B0C0E]">
        <div className="flex bg-[#1a1d23] p-0.5 rounded-lg border border-white/5">
          {tabs.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            const isFirst = idx === 0;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-3 pt-[3px] pb-[5px] text-[11px] font-medium uppercase tracking-wide transition-all ${
                  isActive
                    ? 'linear-active shadow-glow-indigo'
                    : 'text-secondary hover:text-primary hover:bg-element/40'
                } ${isActive || isFirst ? '' : 'ml-1'}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 xl:hidden">
            <button
              type="button"
              onClick={() => openDrawer("stack")}
              className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/80 border border-white/10 rounded-full hover:text-white hover:border-white/40"
            >
              Stack
            </button>
            <button
              type="button"
              onClick={() => openDrawer("inspector")}
              className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/80 border border-white/10 rounded-full hover:text-white hover:border-white/40"
            >
              Vitals
            </button>
          </div>
          <span className="flex h-2 w-2 rounded-full bg-emerald shadow-glow-indigo" />
          <span className="text-[10px] font-mono text-secondary uppercase tracking-[0.35em]">System Ready</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="flex flex-col min-h-full gap-4 p-4 pb-10">
          {renderActiveChart()}
        </div>
      </div>
    </main>
  );
};

export default TabbedChartCanvas;
