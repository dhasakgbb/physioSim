import React, { useState } from "react";
import SerumStabilityChart from "./SerumStabilityChart";
import CycleEvolutionChart from "./CycleEvolutionChart";
import OptimizerPane from "./OptimizerPane";
import SignalingNetwork from "./SignalingNetwork";
import { useStack } from "../../context/StackContext";
import { CenterPane } from "./CenterPane";

const TabbedChartCanvas = ({ onTimeScrub }) => {
  const { stack, userProfile, setUserProfile, setStack, metrics } = useStack();
  const [activeTab, setActiveTab] = useState('efficiency');

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

  const openDrawer = (target) => {
    if (typeof window === "undefined") return;
    const eventName = target === "stack" ? "open-stack-drawer" : "open-inspector-drawer";
    window.dispatchEvent(new CustomEvent(eventName));
  };

  return (
    <div className="flex flex-col h-full">
      {/* CENTER PANE HEADER - The only navigation that matters */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/5 px-6 bg-[#0B0C0E]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex bg-[#1a1d23] p-0.5 rounded-lg border border-white/5">
          {tabs.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            const isFirst = idx === 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 text-[11px] font-medium uppercase tracking-wide transition-all ${
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

      {/* Chart Content - Full Canvas */}
      <div className="flex-1 relative min-h-0">
        {renderActiveChart()}
      </div>
    </div>
  );
};

export default TabbedChartCanvas;
