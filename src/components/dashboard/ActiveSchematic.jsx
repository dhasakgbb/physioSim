import React, { useMemo } from "react";
import { motion } from "framer-motion";

// --- LINEAR PALETTE ---
const COLORS = {
  bg: "#0B0C0E",
  panel: "#161719",
  border: "#2C2D30",
  textMain: "#E5E7EB",
  textDim: "#6B7280",
  accent1: "#5E6AD2",  // Indigo
  accent2: "#10B981",  // Emerald
  accent3: "#EF4444",  // Red
  accent4: "#F59E0B",  // Amber
  accent5: "#3B82F6",  // Blue
  accent6: "#EC4899",  // Pink
  accent7: "#F97316"   // Orange
};

const ActiveSchematic = ({ activeDose, geneticCapacity, saturationMetrics, receptorState }) => {
  // Use receptorState spillover (which accounts for binding inefficiency) if available
  const totalSpillover = receptorState ? receptorState.totalSpillover : (saturationMetrics?.spillover || 0);
  const totalBound = receptorState ? receptorState.totalBound : (saturationMetrics?.saturation || 0);
  
  // Route spillover to pathways
  const cnsLoad = totalSpillover * 0.4;
  const retentionLoad = totalSpillover * 0.25;
  const hepaticLoad = totalSpillover * 0.35 * 1.5;
  const estrogenicLoad = totalSpillover * 0.15;
  const renalLoad = totalSpillover * 0.2;
  const hematocritLoad = totalSpillover * 0.18;
  const lipidLoad = totalSpillover * 0.3;
  const nutrientPartLoad = totalBound * 0.5; // Nutrient partitioning based on bound
  
  // Efficiency & Saturation State
  const efficiency = geneticCapacity > 0 ? (totalBound / (totalBound + totalSpillover)) * 100 : 0;
  const saturationPct = geneticCapacity > 0 ? (totalBound / geneticCapacity) * 100 : 0;
  const genomicPct = Math.min(100, saturationPct);
  const spilloverPct = geneticCapacity > 0 ? (totalSpillover / geneticCapacity) * 100 : 0;

  // Adaptation Phase
  const adaptationPhase = saturationMetrics?.adaptationPhase || 1;
  const adaptationRate = saturationMetrics?.adaptationRate || 0;
  const isHardCap = saturationMetrics?.isHardCap || false;
  
  const phaseInfo = useMemo(() => {
    if (isHardCap) return { name: "CEILING", color: COLORS.accent3, desc: "Hard Cap" };
    if (adaptationPhase === 3) return { name: "STRAIN", color: COLORS.accent4, desc: "Diminishing Returns" };
    if (adaptationPhase === 2) return { name: "SURGE", color: COLORS.accent2, desc: "Peak Adaptation" };
    return { name: "BASELINE", color: COLORS.textDim, desc: "Standard Response" };
  }, [adaptationPhase, isHardCap]);

  // 12 Pathways data
  const pathways = useMemo(() => [
    { name: "GENOMIC", value: Math.min(150, genomicPct), status: genomicPct > 80 ? "Maximal" : genomicPct > 50 ? "Active" : "Low", color: COLORS.accent2 },
    { name: "NON-GENOMIC", value: Math.min(150, spilloverPct), status: spilloverPct > 80 ? "Spillover" : spilloverPct > 30 ? "Active" : "Low", color: COLORS.accent1 },
    { name: "ANTI-CATABOLIC", value: Math.min(150, (retentionLoad / 50) * 100), status: retentionLoad > 30 ? "Active" : "Low", color: COLORS.accent5 },
    { name: "ESTROGENIC (E2)", value: Math.min(150, (estrogenicLoad / 30) * 100), status: estrogenicLoad > 15 ? "Elevated" : "Controlled", color: COLORS.accent6 },
    { name: "PROGESTOGENIC", value: 10, status: "Inactive", color: COLORS.textDim },
    { name: "ANDROGENIC (DHT)", value: 65, status: "Elevated", color: COLORS.accent7 },
    { name: "HEPATIC LOAD", value: Math.min(150, (hepaticLoad / 50) * 100), status: hepaticLoad > 30 ? "Warning" : "Stable", color: COLORS.accent3 },
    { name: "RENAL PRESSURE", value: Math.min(150, (renalLoad / 40) * 100), status: renalLoad > 20 ? "Watch" : "Stable", color: COLORS.accent2 },
    { name: "HEMATOCRIT", value: Math.min(150, (hematocritLoad / 40) * 100), status: hematocritLoad > 20 ? "Watch" : "Normal", color: COLORS.accent4 },
    { name: "CNS DRIVE", value: Math.min(150, (cnsLoad / 50) * 100), status: cnsLoad > 30 ? "High" : "Moderate", color: COLORS.accent1 },
    { name: "LIPID SKEW", value: Math.min(150, (lipidLoad / 50) * 100), status: lipidLoad > 30 ? "Degrading" : "Stable", color: COLORS.accent4 },
    { name: "NUTRIENT PART.", value: Math.min(150, (nutrientPartLoad / 100) * 100), status: nutrientPartLoad > 50 ? "Efficient" : "Low", color: COLORS.accent2 }
  ], [genomicPct, spilloverPct, retentionLoad, estrogenicLoad, hepaticLoad, renalLoad, hematocritLoad, cnsLoad, lipidLoad, nutrientPartLoad]);

  return (
    <div className="w-full h-full flex flex-col gap-4 p-6 bg-[#0B0C0E] font-mono">
      {/* ROW 1: GAUGE + PATHWAY GRID */}
      <div className="grid grid-cols-12 gap-6 h-[280px]">
        {/* RECEPTOR GAUGE (Left) */}
        <div className="col-span-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] text-[#6B7280] uppercase tracking-widest">RECEPTOR SATURATION</h3>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: phaseInfo.color }} />
              <span className="text-[9px] text-[#6B7280] uppercase tracking-wider">{phaseInfo.name}</span>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center relative">
            <svg width="220" height="220" viewBox="0 0 240 240">
              {/* Outer Ring (Spillover) */}
              <circle cx="120" cy="120" r="90" fill="none" stroke="#1F2937" strokeWidth="18" />
              <motion.circle
                cx="120" cy="120" r="90"
                fill="none"
                stroke={COLORS.accent1}
                strokeWidth="18"
                strokeDasharray={`${(spilloverPct / 100) * 565.48} 565.48`}
                strokeLinecap="round"
                transform="rotate(-90 120 120)"
                initial={{ strokeDasharray: "0 565.48" }}
                animate={{ strokeDasharray: `${(spilloverPct / 100) * 565.48} 565.48` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              
              {/* Inner Ring (Genomic) */}
              <circle cx="120" cy="120" r="65" fill="none" stroke="#1F2937" strokeWidth="18" />
              <motion.circle
                cx="120" cy="120" r="65"
                fill="none"
                stroke={phaseInfo.color}
                strokeWidth="18"
                strokeDasharray={`${(genomicPct / 100) * 408.41} 408.41`}
                strokeLinecap="round"
                transform="rotate(-90 120 120)"
                initial={{ strokeDasharray: "0 408.41" }}
                animate={{ strokeDasharray: `${(genomicPct / 100) * 408.41} 408.41` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              />

              {/* Center Text */}
              <text x="120" y="108" textAnchor="middle" fill={COLORS.textDim} fontSize="9" fontFamily="monospace">
                EFFICIENCY
              </text>
              <text x="120" y="132" textAnchor="middle" fill={COLORS.textMain} fontSize="28" fontWeight="bold" fontFamily="monospace">
                {Math.round(efficiency)}%
              </text>
              <text x="120" y="148" textAnchor="middle" fill={phaseInfo.color} fontSize="8" fontFamily="monospace">
                {phaseInfo.desc}
              </text>
            </svg>
          </div>
        </div>

        {/* 12-PATHWAY GRID (Right) */}
        <div className="col-span-8 grid grid-cols-4 gap-2.5 content-start">
          {pathways.map((pathway, i) => (
            <PathwayCard key={i} {...pathway} delay={i * 0.03} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Pathway Card Component
const PathwayCard = ({ name, value, status, color, delay }) => (
  <div className="flex flex-col gap-1 p-2 bg-[#161719] rounded border border-[#2C2D30] h-[60px]">
    <div className="text-[7px] text-[#6B7280] uppercase tracking-widest font-bold leading-tight">
      {name}
    </div>
    
    {/* Progress Bar */}
    <div className="relative h-0.5 bg-[#374151] rounded-full overflow-hidden">
      <motion.div 
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (value / 150) * 100)}%` }}
        transition={{ duration: 0.8, delay, ease: "easeOut" }}
      />
    </div>
    
    {/* Value + Status */}
    <div className="text-[10px] text-white font-mono leading-tight">
      {Math.round(value)}% <span className="text-[#6B7280]">//</span> {status}
    </div>
  </div>
);

export default ActiveSchematic;
