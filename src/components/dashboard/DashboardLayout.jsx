import React, { useState } from 'react';

const DashboardLayout = ({ 
  leftRail,   // Zone A: Active Stack
  centerStage, // Zone B: Visualization
  rightRail,  // Zone C: Vitals/Intel
  bottomDock, // Zone D: Compound Picker
  className = ''
}) => {
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  return (
    <div className={`flex flex-col h-screen bg-physio-bg-core text-physio-text-primary overflow-hidden ${className}`}>
      
      {/* Mobile/Tablet Header (Visible < XL) */}
      <div className="xl:hidden flex items-center justify-between px-4 py-3 border-b border-physio-border-subtle bg-physio-bg-surface z-40">
         <button 
           onClick={() => setShowLeft(true)} 
           className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-physio-bg-highlight/50 text-xs font-bold text-physio-text-primary border border-physio-border-subtle"
         >
           <span className="text-lg">🧪</span> Stack
         </button>
         
         <span className="font-bold text-sm tracking-tight text-physio-text-tertiary">PhysioLab Mobile</span>
         
         <button 
           onClick={() => setShowRight(true)} 
           className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-physio-bg-highlight/50 text-xs font-bold text-physio-text-primary border border-physio-border-subtle"
         >
           Vitals <span className="text-lg">❤️</span>
         </button>
      </div>

      {/* Main Workspace (Zones A, B, C) */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* ZONE A: Active Stack Rail (Desktop: Fixed / Mobile: Drawer) */}
        <aside className="hidden xl:flex w-80 flex-col border-r border-physio-border-subtle bg-physio-bg-surface/50 backdrop-blur-md z-20">
          <div className="p-4 border-b border-physio-border-subtle">
            <h2 className="text-xs font-bold text-physio-text-tertiary uppercase tracking-widest">Active Mixture</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {leftRail}
          </div>
        </aside>

        {/* Mobile Drawer: Left */}
        {showLeft && (
          <div className="absolute inset-0 z-50 flex xl:hidden">
            <div className="w-80 h-full bg-physio-bg-surface border-r border-physio-border-strong shadow-2xl flex flex-col animate-slide-in-left">
               <div className="p-4 border-b border-physio-border-subtle flex justify-between items-center bg-physio-bg-core">
                 <h2 className="text-sm font-bold text-physio-text-primary uppercase tracking-widest">Active Mixture</h2>
                 <button onClick={() => setShowLeft(false)} className="p-2 text-physio-text-tertiary hover:text-physio-text-primary">✕</button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {leftRail}
               </div>
            </div>
            <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setShowLeft(false)} />
          </div>
        )}

        {/* ZONE B: Center Stage (Visualization) */}
        <main className="flex-1 flex flex-col relative z-10 min-w-0 overflow-hidden">
          <header className="hidden md:flex h-16 items-center justify-between px-8 border-b border-physio-border-subtle">
            <h1 className="text-lg font-semibold tracking-tight text-physio-text-primary">
              PhysioLab <span className="text-physio-text-tertiary font-normal">/ Net Interaction Model</span>
            </h1>
            {/* Global Toolbar (PDF, Share, etc) could go here */}
          </header>
          
          <div className="flex-1 relative p-4 md:p-6 overflow-hidden flex flex-col">
            {centerStage}
          </div>
        </main>

        {/* ZONE C: Vitals & Intel (Desktop: Fixed / Mobile: Drawer) */}
        <aside className="hidden xl:flex w-80 min-w-[320px] flex-col border-l border-physio-border-subtle bg-physio-bg-surface/30 z-20">
           <div className="p-4 border-b border-physio-border-subtle">
            <h2 className="text-xs font-bold text-physio-text-tertiary uppercase tracking-widest">Projected Vitals</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {rightRail}
          </div>
        </aside>

        {/* Mobile Drawer: Right */}
        {showRight && (
          <div className="absolute inset-0 z-50 flex justify-end xl:hidden">
            <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setShowRight(false)} />
            <div className="w-80 h-full bg-physio-bg-surface border-l border-physio-border-strong shadow-2xl flex flex-col animate-slide-in-right">
               <div className="p-4 border-b border-physio-border-subtle flex justify-between items-center bg-physio-bg-core">
                 <h2 className="text-sm font-bold text-physio-text-primary uppercase tracking-widest">Projected Vitals</h2>
                 <button onClick={() => setShowRight(false)} className="p-2 text-physio-text-tertiary hover:text-physio-text-primary">✕</button>
               </div>
               <div className="flex-1 overflow-y-auto p-4">
                 {rightRail}
               </div>
            </div>
          </div>
        )}

      </div>

      {/* ZONE D: The Dock (Bottom) */}
      <footer className="h-auto min-h-[140px] py-6 border-t border-physio-border-subtle bg-physio-bg-core z-30 flex items-center justify-center px-4 md:px-8 relative">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-4 py-1 bg-physio-bg-core border border-physio-border-subtle rounded-t-xl border-b-0 text-[10px] text-physio-text-tertiary uppercase tracking-wider">
          Compound Library
        </div>
        <div className="w-full max-w-5xl overflow-x-auto">
          {bottomDock}
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;
