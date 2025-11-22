// ActiveSchematic.jsx
// Engineering‑precision view of receptor load and downstream pathways.
// Linear Design Ideal: "Solid vs. Signal" — Hardware (Solid) vs Throughput (Dashed)
// Signal Flow Architecture: Saturation & Spillover Physics Engine

import React from "react";
import { motion } from "framer-motion";
import { getSaturationStatus, getAdaptationPhaseLabel } from "../../engine/SaturationPhysics";

// --- CONFIGURATION: The "Linear" Palette ---
const COLORS = {
  bg: "#0B0C0E",
  panel: "#141517",
  border: "#2C2D30",
  textMain: "#EDEDED",
  textDim: "#8A8B8D",
  // Semantic Colors
  genomic: "#10B981",   // Emerald (Keepable Gain)
  signal: "#6366F1",    // Indigo (Rentable Gain)
  toxicity: "#EF4444",  // Red (Cost)
  trace: "#3F3F46"      // Zinc-700 (Idle Circuit)
};

const ActiveSchematic = ({ 
  activeDose = 0, 
  geneticCapacity = 100,
  saturationMetrics = null 
}) => {
  // Use saturation metrics if provided, otherwise calculate basic values
  const hasMetrics = saturationMetrics && saturationMetrics.activeDose !== undefined;
  
  const saturation = hasMetrics 
    ? saturationMetrics.saturation 
    : Math.min(activeDose || 0, geneticCapacity || 100);
  
  const spillover = hasMetrics 
    ? saturationMetrics.spillover 
    : Math.max(0, (activeDose || 0) - (geneticCapacity || 100));
  
  const efficiencyPct = hasMetrics ? saturationMetrics.efficiencyPct : 100;
  const adaptationRate = hasMetrics ? saturationMetrics.adaptationRate : 0;
  const adaptationPhase = hasMetrics ? saturationMetrics.adaptationPhase : 1;
  const isHardCap = hasMetrics ? saturationMetrics.isHardCap : false;
  const isSaturated = hasMetrics ? saturationMetrics.isSaturated : spillover > 0;
  
  // Spillover routing
  const spilloverToCNS = hasMetrics ? saturationMetrics.spilloverToCNS : 0;
  const spilloverToToxicity = hasMetrics ? saturationMetrics.spilloverToToxicity : 0;
  const spilloverToRetention = hasMetrics ? saturationMetrics.spilloverToRetention : 0;
  
  const safeCapacity = geneticCapacity || 100;
  const saturationPct = safeCapacity > 0 ? (saturation / safeCapacity) * 100 : 0;
  const spilloverPct = safeCapacity > 0 ? (spillover / safeCapacity) * 100 : 0; // Relative to capacity for scale
  
  // Get status from saturation metrics
  const status = hasMetrics 
    ? getSaturationStatus(saturationMetrics)
    : { 
        status: spillover > 0 ? "SATURATION_SPILLOVER" : "GENOMIC_OPTIMAL", 
        color: spillover > 0 ? "text-indigo-400" : "text-emerald-400", 
        bgColor: spillover > 0 ? "bg-indigo-500/10" : "bg-emerald-500/10" 
      };
  
  // 2. DYNAMIC LAYOUT CONSTANTS
  // We map the flow lines based on SVG coordinates
  const originX = 150; // Center of Donut
  const originY = 150;

  return (
    <div className="w-full max-w-4xl p-8 bg-[#0B0C0E] rounded-lg border border-[#2C2D30] font-sans">
      
      {/* HEADER: Technical Readout */}
      <div className="flex justify-between items-end mb-12 border-b border-[#2C2D30] pb-4">
        <div>
          <h2 className="text-sm font-medium text-white tracking-wide">MECHANISM MONITOR</h2>
          <p className="text-[10px] text-[#8A8B8D] font-mono mt-1 uppercase tracking-wider">
            Real-time Pharmacokinetic Flow
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-[#8A8B8D] font-mono uppercase mr-3">System Status</span>
          <span className={`text-xs font-mono px-2 py-1 rounded ${status.color} ${status.bgColor}`}>
            {status.status}
          </span>
        </div>
      </div>

      {/* DETAILED STATUS READOUT (When Saturated) */}
      {isSaturated && hasMetrics && (
        <div className="mb-8 p-4 rounded border border-[#2C2D30] bg-[#141517]">
          <div className="grid grid-cols-2 gap-4 text-[10px] font-mono">
            <div>
              <span className="text-[#8A8B8D] uppercase tracking-wider">EFFICIENCY</span>
              <div className={`text-lg font-bold mt-1 ${efficiencyPct < 60 ? 'text-red-400' : efficiencyPct < 80 ? 'text-orange-400' : 'text-yellow-400'}`}>
                {efficiencyPct}%
              </div>
              <span className={`text-[8px] ${efficiencyPct < 60 ? 'text-red-400' : 'text-[#8A8B8D]'}`}>
                {efficiencyPct < 60 ? 'CRITICAL LOW' : efficiencyPct < 80 ? 'SUBOPTIMAL' : 'ACCEPTABLE'}
              </span>
            </div>
            <div>
              <span className="text-[#8A8B8D] uppercase tracking-wider">ADAPTATION</span>
              <div className="text-lg font-bold mt-1 text-indigo-400">
                {adaptationRate > 0 ? `+${adaptationRate.toFixed(1)}%` : '0%'} / WK
              </div>
              <span className="text-[8px] text-[#8A8B8D]">
                {getAdaptationPhaseLabel(adaptationPhase)}
              </span>
            </div>
            {spillover > 0 && (
              <>
                <div>
                  <span className="text-[#8A8B8D] uppercase tracking-wider">GENOMIC FLOW</span>
                  <div className="text-lg font-bold mt-1 text-emerald-400">
                    MAXED
                  </div>
                  <span className="text-[8px] text-[#8A8B8D]">
                    {Math.round(Math.max(0, safeCapacity - saturation))}mg capacity remaining
                  </span>
                </div>
                <div>
                  <span className="text-[#8A8B8D] uppercase tracking-wider">SPILLOVER</span>
                  <div className="text-lg font-bold mt-1 text-indigo-400">
                    {Math.round(spillover)}mg
                  </div>
                  <span className="text-[8px] text-[#8A8B8D]">
                    → CNS / TOXICITY
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-8 relative h-[400px]">
        
        {/* --- LEFT COL: THE AR GAUGE (Input) --- */}
        <div className="col-span-4 flex flex-col items-center justify-center relative z-10">
          
          <div className="relative w-[260px] h-[260px]">
            <svg width="260" height="260" viewBox="0 0 260 260" className="transform -rotate-90">
              
              {/* A. GENOMIC RING (Inner - Hardware) */}
              {/* Background Track */}
              <circle cx="130" cy="130" r="80" stroke={COLORS.trace} strokeWidth="2" fill="none" opacity="0.3" />
              {/* Active Fill (Solid) */}
              <motion.circle 
                cx="130" cy="130" r="80" 
                stroke={COLORS.genomic} strokeWidth="8" fill="none" strokeLinecap="round"
                initial={{ strokeDasharray: "0 502" }} // 2*pi*80 ≈ 502
                animate={{ strokeDasharray: `${(saturationPct / 100) * 502} 502` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />

              {/* B. SPILLOVER RING (Outer - Throughput) */}
              {/* Only appears if spillover exists. Dashed style indicates "Flux" not "Structure" */}
              {spillover > 0 && (
                <>
                   <circle cx="130" cy="130" r="100" stroke={COLORS.trace} strokeWidth="1" fill="none" opacity="0.2" strokeDasharray="4 4" />
                   <motion.circle 
                    cx="130" cy="130" r="100" 
                    stroke={COLORS.signal} strokeWidth="4" fill="none"
                    strokeDasharray="4 8" // Dotted look for "Energy"
                    initial={{ strokeDashoffset: 628 }} // 2*pi*100 ≈ 628
                    animate={{ strokeDashoffset: 628 - ((spilloverPct / 100) * 628) }}
                    transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                  />
                </>
              )}
              
              {/* C. CENTER READOUT */}
            </svg>
            
            {/* HTML Overlay for Text (Not rotated) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <span className="text-[10px] text-[#8A8B8D] uppercase tracking-widest mb-1">Receptor Load</span>
               <span className="text-3xl font-mono font-bold text-white tracking-tight">
                 {Math.round(saturationPct + spilloverPct)}%
               </span>
               {hasMetrics && (
                 <span className={`text-[10px] font-mono mt-1 ${efficiencyPct < 60 ? 'text-red-400' : efficiencyPct < 80 ? 'text-orange-400' : 'text-[#8A8B8D]'}`}>
                   {efficiencyPct}% EFF
                 </span>
               )}
               {!hasMetrics && (
                 <span className="text-[10px] font-mono text-[#8A8B8D] mt-1">
                   {Math.round(activeDose || 0)} MG
                 </span>
               )}
            </div>
          </div>
        </div>

        {/* --- MIDDLE COL: THE TRACE MANIFOLD (Connection) --- */}
        {/* This SVG sits absolutely over the grid to draw connection lines */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <svg width="100%" height="100%">
            {/* Connection 1: Inner Ring -> Genomic Card (NUCLEUS) */}
            <SchematicPath startY={200} endY={80} color={COLORS.genomic} isActive={true} />
            
            {/* Connection 2: Outer Ring -> Non-Genomic Signaling Card (Only if spillover) */}
            <SchematicPath startY={150} endY={160} color={COLORS.signal} isActive={spilloverToCNS > 0} isDashed={true} />
            
            {/* Connection 3: Outer Ring -> Anti-Catabolic Card (Only if spillover) */}
            <SchematicPath startY={250} endY={240} color={COLORS.signal} isActive={spilloverToRetention > 0} isDashed={true} />
            
            {/* Connection 4: Outer Ring -> Toxicity Card (Only if spillover) */}
            <SchematicPath startY={300} endY={320} color={COLORS.toxicity} isActive={spilloverToToxicity > 0} isDashed={true} />
          </svg>
        </div>

        {/* --- RIGHT COL: THE PATHWAY CARDS (Output) --- */}
        <div className="col-span-8 flex flex-col justify-center gap-6 pl-12 z-10">
          
          {/* CARD 1: GENOMIC */}
          <PathwayCard 
            label="GENOMIC TRANSCRIPTION" 
            value={`${Math.round(saturationPct)}%`} 
            subtext="Tissue Accretion (Capped)"
            color={COLORS.genomic}
            active={true}
          />

          {/* CARD 2: NON-GENOMIC SIGNALING */}
          <PathwayCard 
            label="NON-GENOMIC SIGNALING" 
            value={spilloverToCNS > 0 ? `${Math.round((spilloverToCNS / safeCapacity) * 100)}%` : "IDLE"} 
            subtext="CNS Drive / Membrane Receptors"
            color={COLORS.signal}
            active={spilloverToCNS > 0}
          />

          {/* CARD 3: ANTI-CATABOLIC */}
          <PathwayCard 
            label="ANTI-CATABOLIC" 
            value={spilloverToRetention > 0 ? `${Math.round((spilloverToRetention / safeCapacity) * 100)}%` : "IDLE"} 
            subtext="Cortisol Antagonism / Water / Glycogen"
            color={COLORS.signal}
            active={spilloverToRetention > 0}
            isDimmed={!spilloverToRetention}
          />

          {/* CARD 4: TOXICITY */}
          <PathwayCard 
            label="SYSTEMIC OXIDATION" 
            value={spilloverToToxicity > 0 ? "ELEVATED" : "BASELINE"} 
            subtext="Hepatic / Renal / Lipid Load"
            color={COLORS.toxicity}
            active={spilloverToToxicity > 0}
            isWarning={true}
          />

        </div>
      </div>
    </div>
  );
};

// --- SUBCOMPONENTS FOR CLEANER CODE ---

const SchematicPath = ({ startY, endY, color, isActive, isDashed }) => {
  // Draws a smooth S-curve from the Donut (approx x=280) to the Card (approx x=500)
  const d = `M 280 ${startY} C 380 ${startY}, 380 ${endY}, 500 ${endY}`;
  
  return (
    <>
      {/* 1. The Track (Faint) */}
      <path d={d} stroke={COLORS.trace} strokeWidth="1" fill="none" opacity="0.2" />
      
      {/* 2. The Active Signal (Animated Dash) */}
      {isActive && (
        <motion.path 
          d={d} 
          stroke={color} 
          strokeWidth={isDashed ? "1" : "2"} 
          fill="none"
          strokeDasharray={isDashed ? "4 4" : "none"} // Dashed for Spillover
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      )}
    </>
  );
};

const PathwayCard = ({ label, value, subtext, color, active, isWarning, isDimmed = false }) => (
  <div className="flex items-center group">
    <div className={`w-1.5 h-1.5 rounded-full mr-4 transition-colors duration-300 ${active ? '' : 'bg-[#2C2D30]'}`} style={{ backgroundColor: active ? color : undefined }} />
    <div className={`flex-1 p-4 rounded border transition-all duration-300 ${active ? 'border-[#2C2D30] bg-[#141517]' : 'border-transparent bg-transparent'} ${isDimmed || !active ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#8A8B8D] mb-1">{label}</h3>
          <div className="text-sm font-medium text-[#EDEDED]">{subtext}</div>
        </div>
        <div className="text-lg font-mono font-bold" style={{ color: active ? (isWarning ? COLORS.toxicity : "#EDEDED") : "#2C2D30" }}>
          {value}
        </div>
      </div>
    </div>
  </div>
);

export default ActiveSchematic;
