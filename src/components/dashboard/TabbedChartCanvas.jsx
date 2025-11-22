import React, { useEffect, useMemo, useState, Suspense, lazy } from "react";
import LinearPathwayFlow from "./LinearPathwayFlow";

import { useStack } from "../../context/StackContext";
import StatusIndicator from "./StatusIndicator";
import { CenterPane } from "./CenterPane";

const AnalyticsPane = lazy(() => import("./AnalyticsPane"));
const OptimizerPane = lazy(() => import("./OptimizerPane"));

const PaneFallback = ({ label }) => (
  <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-white/5 bg-[#050608] text-[11px] uppercase tracking-[0.3em] text-gray-500">
    Loading {label}…
  </div>
);

const NET_FAMILY_TABS = new Set(["efficiency", "pathways", "analytics", "physics"]);
const VIEW_MODE_TO_TAB = {
  net: "efficiency",
  optimize: "optimize",

  analytics: "analytics",
};
const TAB_TO_VIEW_MODE = {
  efficiency: "net",
  pathways: "net",
  evolution: "net",
  analytics: "analytics",
  optimize: "optimize",

};

const TabbedChartCanvas = ({ onTimeScrub, scrubbedPoint }) => {
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
    { id: 'analytics', label: 'QSP Analytics' },
    { id: 'pathways', label: 'Pathway Flow' },
    { id: 'optimize', label: 'Optimize' },
  ];

  const renderActiveChart = () => {
    if (activeTab === 'efficiency') {
      return <CenterPane onTimeScrub={onTimeScrub} scrubbedPoint={scrubbedPoint} />;
    }

    if (activeTab === 'analytics') {
      return (
        <Suspense fallback={<PaneFallback label="Analytics" />}>
          <AnalyticsPane />
        </Suspense>
      );
    }

    if (activeTab === 'pathways') {
      return <LinearPathwayFlow onTimeScrub={onTimeScrub} />;
    }

    if (activeTab === 'optimize') {
      return (
        <Suspense fallback={<PaneFallback label="Optimizer" />}>
          <OptimizerPane
            stack={stack}
            userProfile={userProfile}
            onUpdateProfile={setUserProfile}
            onApplyOptimization={(newStack) => setStack(newStack)}
          />
        </Suspense>
      );
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
      <header className="flex items-start justify-between border-b border-white/5 px-6 py-4 overflow-x-auto scrollbar-hide">
        <div className="flex bg-[#1a1d23] p-0.5 rounded-lg border border-white/5 overflow-x-auto scrollbar-hide whitespace-nowrap">
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
          <StatusIndicator />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide relative">
        <div className="flex flex-col min-h-full gap-4 p-4 pb-10">
          {renderActiveChart()}
        </div>
      </div>
    </main>
  );
};

export default TabbedChartCanvas;
