import React, { useState, useEffect } from "react";
import Logo from "../ui/Logo";

const DashboardLayout = ({
  leftRail, // Zone A: Active Stack
  centerStage, // Zone B: Visualization
  rightRail, // Zone C: Vitals/Intel
  headerControls, // Optional controls for the header
  className = "",
}) => {
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  useEffect(() => {
    const openStackDrawer = () => setShowLeft(true);
    window.addEventListener("open-stack-drawer", openStackDrawer);
    return () => window.removeEventListener("open-stack-drawer", openStackDrawer);
  }, []);

  return (
    <div
      className={`flex flex-col h-screen bg-physio-bg-core text-physio-text-primary overflow-hidden ${className}`}
    >
      {/* Mobile/Tablet Header (Visible < XL) */}
      <div className="xl:hidden flex items-center justify-between px-4 py-3 bg-physio-bg-surface z-40">
        <button
          onClick={() => setShowLeft(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-physio-bg-highlight/50 text-xs font-bold text-physio-text-primary"
        >
          <span className="text-lg">🧪</span> Stack
        </button>

        <div className="scale-75 origin-center">
          <Logo />
        </div>

        <button
          onClick={() => setShowRight(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-physio-bg-highlight/50 text-xs font-bold text-physio-text-primary"
        >
          Vitals <span className="text-lg">❤️</span>
        </button>
      </div>

      {/* Main Workspace (Zones A, B, C) */}
      <div className="flex-1 flex min-h-0 relative">
        {/* ZONE A: Active Stack Rail (Desktop: Fixed / Mobile: Drawer) */}
        <aside className="hidden xl:flex w-80 flex-col bg-physio-bg-surface z-20">
          <div className="flex-1 min-h-0">{leftRail}</div>
        </aside>

        {/* Mobile Drawer: Left */}
        {showLeft && (
          <div className="absolute inset-0 z-50 flex xl:hidden">
            <div className="w-80 h-full bg-physio-bg-surface shadow-2xl flex flex-col animate-slide-in-left relative">
              <button
                onClick={() => setShowLeft(false)}
                className="absolute top-3 right-3 z-30 p-2 rounded-lg bg-physio-bg-core/70 text-physio-text-tertiary hover:text-physio-text-primary"
              >
                ✕
              </button>
              <div className="flex-1 overflow-hidden">{leftRail}</div>
            </div>
            <div
              className="flex-1 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowLeft(false)}
            />
          </div>
        )}

        {/* ZONE B: Center Stage (Visualization) */}
        <main className="flex-1 flex flex-col relative z-10 min-w-0 overflow-hidden">
          <header className="hidden md:flex h-24 items-center justify-between px-8 bg-physio-bg-surface">
            <div className="flex items-center gap-4 scale-110 origin-left">
              <Logo />
            </div>
            {/* Global Toolbar (PDF, Share, etc) */}
            {headerControls && (
              <div className="flex items-center gap-4">{headerControls}</div>
            )}
          </header>

          <div className="flex-1 relative p-4 md:p-6 overflow-hidden flex flex-col dot-grid rounded-[32px] border border-physio-border-subtle/40">
            {centerStage}
          </div>
        </main>

        {/* ZONE C: Vitals & Intel (Desktop: Fixed / Mobile: Drawer) */}
        <aside className="hidden xl:flex w-80 min-w-[320px] flex-col bg-physio-bg-surface z-20">
          <div className="p-4">
            <h2 className="text-xs font-bold text-physio-text-tertiary uppercase tracking-widest">
              Projected Vitals
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{rightRail}</div>
        </aside>

        {/* Mobile Drawer: Right */}
        {showRight && (
          <div className="absolute inset-0 z-50 flex justify-end xl:hidden">
            <div
              className="flex-1 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowRight(false)}
            />
            <div className="w-80 h-full bg-physio-bg-surface shadow-2xl flex flex-col animate-slide-in-right">
              <div className="p-4 flex justify-between items-center bg-physio-bg-surface">
                <h2 className="text-sm font-bold text-physio-text-primary uppercase tracking-widest">
                  Projected Vitals
                </h2>
                <button
                  onClick={() => setShowRight(false)}
                  className="p-2 text-physio-text-tertiary hover:text-physio-text-primary"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">{rightRail}</div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default DashboardLayout;
