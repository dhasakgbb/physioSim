import React from 'react';

const DashboardLayout = ({ 
  leftRail,   // Zone A: Active Stack
  centerStage, // Zone B: Visualization
  rightRail,  // Zone C: Vitals/Intel
  bottomDock, // Zone D: Compound Picker
  className = ''
}) => {
  return (
    <div className={`flex flex-col h-screen bg-physio-bg-core text-physio-text-primary overflow-hidden ${className}`}>
      
      {/* Main Workspace (Zones A, B, C) */}
      <div className="flex-1 flex min-h-0">
        
        {/* ZONE A: Active Stack Rail (Left) */}
        <aside className="w-80 flex flex-col border-r border-physio-border-subtle bg-physio-bg-surface/50 backdrop-blur-md z-20">
          <div className="p-4 border-b border-physio-border-subtle">
            <h2 className="text-xs font-bold text-physio-text-tertiary uppercase tracking-widest">Active Mixture</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {leftRail}
          </div>
        </aside>

        {/* ZONE B: Center Stage (Visualization) */}
        <main className="flex-1 flex flex-col relative z-10 min-w-0">
          <header className="h-16 flex items-center justify-between px-8 border-b border-physio-border-subtle">
            <h1 className="text-lg font-semibold tracking-tight text-physio-text-primary">
              PhysioLab <span className="text-physio-text-tertiary font-normal">/ Net Interaction Model</span>
            </h1>
            {/* Global Toolbar (PDF, Share, etc) could go here */}
          </header>
          
          <div className="flex-1 relative p-6 overflow-hidden flex flex-col">
            {centerStage}
          </div>
        </main>

        {/* ZONE C: Vitals & Intel (Right) */}
        <aside className="w-80 min-w-[320px] flex flex-col border-l border-physio-border-subtle bg-physio-bg-surface/30 z-20">
           <div className="p-4 border-b border-physio-border-subtle">
            <h2 className="text-xs font-bold text-physio-text-tertiary uppercase tracking-widest">Projected Vitals</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {rightRail}
          </div>
        </aside>
      </div>

      {/* ZONE D: The Dock (Bottom) */}
      <footer className="h-auto min-h-[140px] py-6 border-t border-physio-border-subtle bg-physio-bg-core z-30 flex items-center justify-center px-8 relative">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-4 py-1 bg-physio-bg-core border border-physio-border-subtle rounded-t-xl border-b-0 text-[10px] text-physio-text-tertiary uppercase tracking-wider">
          Compound Library
        </div>
        <div className="w-full max-w-5xl">
          {bottomDock}
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;
