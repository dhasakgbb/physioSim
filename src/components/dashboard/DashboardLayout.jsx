import React, { useState } from "react";
import Logo from "../ui/Logo";

const DashboardLayout = ({
  leftRail, // Zone A: Active Stack
  centerStage, // Zone B: Visualization
  rightRail, // Zone C: Vitals/Intel
  bottomDock, // Zone D: Compound Picker
  headerControls, // Optional controls for the header
  className = "",
}) => {
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);

  return (
    <div
      className={`flex flex-col h-screen bg-physio-bg-core text-physio-text-primary overflow-hidden font-sans ${className}`}
    >
      {/* GLOBAL HEADER (Slim 48dp) */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-physio-border-subtle bg-physio-bg-surface z-50">
        <div className="flex items-center gap-4">
          <div className="scale-75 origin-left">
            <Logo />
          </div>
          <div className="h-4 w-px bg-physio-border-subtle mx-2" />
          <h1 className="text-sm font-medium text-physio-text-secondary tracking-tight">
            PhysioSim <span className="text-xs text-physio-text-tertiary ml-1">Pro</span>
          </h1>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-3">
          {headerControls}
          <button className="p-1.5 hover:bg-physio-bg-highlight rounded text-physio-text-secondary transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <div className="w-6 h-6 rounded-full bg-physio-accent-primary/20 text-physio-accent-primary flex items-center justify-center text-xs font-bold">
            D
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE (Tiled Layout) */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* LEFT RAIL: Active Mixture (Collapsible) */}
        <aside 
          className={`
            flex flex-col border-r border-physio-border-subtle bg-physio-bg-surface transition-all duration-300 ease-in-out
            ${showLeft ? 'w-72 translate-x-0' : 'w-0 -translate-x-full opacity-0'}
          `}
        >
          <div className="h-9 flex items-center justify-between px-3 border-b border-physio-border-subtle bg-physio-bg-surface">
            <span className="text-xs font-bold text-physio-text-secondary uppercase tracking-wider">Active Mixture</span>
            <button onClick={() => setShowLeft(false)} className="text-physio-text-tertiary hover:text-physio-text-primary">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {leftRail}
          </div>
        </aside>

        {/* COLLAPSED LEFT TRIGGER */}
        {!showLeft && (
          <button 
            onClick={() => setShowLeft(true)}
            className="w-6 border-r border-physio-border-subtle bg-physio-bg-surface hover:bg-physio-bg-highlight flex items-center justify-center transition-colors z-10"
          >
            <svg className="w-3 h-3 text-physio-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* CENTER STAGE: Visualization */}
        <main className="flex-1 flex flex-col min-w-0 bg-physio-bg-core relative">
          {/* Chart Toolbar Area could go here */}
          <div className="flex-1 relative overflow-hidden flex flex-col">
            {centerStage}
          </div>
          
          {/* BOTTOM DOCK: Compound Picker (Collapsible or Fixed Height) */}
          <div className="h-auto min-h-[120px] border-t border-physio-border-subtle bg-physio-bg-surface z-20">
             {bottomDock}
          </div>
        </main>

        {/* COLLAPSED RIGHT TRIGGER */}
        {!showRight && (
          <button 
            onClick={() => setShowRight(true)}
            className="w-6 border-l border-physio-border-subtle bg-physio-bg-surface hover:bg-physio-bg-highlight flex items-center justify-center transition-colors z-10"
          >
            <svg className="w-3 h-3 text-physio-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* RIGHT RAIL: Vitals (Collapsible) */}
        <aside 
          className={`
            flex flex-col border-l border-physio-border-subtle bg-physio-bg-surface transition-all duration-300 ease-in-out
            ${showRight ? 'w-80 translate-x-0' : 'w-0 translate-x-full opacity-0'}
          `}
        >
          <div className="h-9 flex items-center justify-between px-3 border-b border-physio-border-subtle bg-physio-bg-surface">
            <span className="text-xs font-bold text-physio-text-secondary uppercase tracking-wider">Projected Vitals</span>
            <button onClick={() => setShowRight(false)} className="text-physio-text-tertiary hover:text-physio-text-primary">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {rightRail}
          </div>
        </aside>

      </div>
    </div>
  );
};

export default DashboardLayout;
