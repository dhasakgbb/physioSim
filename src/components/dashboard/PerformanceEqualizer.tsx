import React from "react";

// MOCK DATA: "Base" is natural limit. "Boost" is from the stack.
const PERFORMANCE_METRICS = [
  { id: "mass", label: "Hypertrophy", bio: "Nitrogen", base: 60, boost: 35 }, // Total 95%
  { id: "str", label: "Strength", bio: "Neural Drive", base: 50, boost: 65 }, // Total 115% (Supra-physiological)
  { id: "end", label: "Endurance", bio: "RBC / EPO", base: 70, boost: 10 },
  { id: "joint", label: "Collagen", bio: "Synthesis", base: 40, boost: 5 },
  { id: "fat", label: "Lipolysis", bio: "Metabolism", base: 50, boost: 40 },
];

export const PerformanceEqualizer = () => {
  return (
    <div className="flex flex-col h-full w-full bg-[#0B0C0E] border-l border-white/5 relative p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Phenotype Projector</h3>
          <p className="text-[9px] text-gray-500">PROJECTED CAPABILITIES</p>
        </div>

        {/* The "Supra" Badge */}
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-mono">ENHANCED</span>
        </div>
      </div>

      {/* The Equalizer Stage */}
      <div className="flex-1 flex items-end justify-between gap-2 relative">
        {/* The "Natural Genetic Limit" Line */}
        <div className="absolute top-[30%] w-full flex flex-col pointer-events-none z-10">
          <div className="w-full h-px bg-white/10 border-t border-dashed border-gray-600" />
          <span className="text-[8px] text-gray-600 uppercase font-mono mt-1 text-right">Genetic Limit</span>
        </div>

        {/* The Bars */}
        {PERFORMANCE_METRICS.map((metric) => {
          const total = metric.base + metric.boost;
          const isSupra = total > 100; // Crossed genetic limit

          return (
            <div key={metric.id} className="flex flex-col items-center gap-2 h-full w-full group">
              {/* The Bar Container */}
              <div className="relative w-full h-full bg-white/5 rounded-sm overflow-hidden flex flex-col justify-end">
                {/* 1. Base Potential (Natural) */}
                <div
                  className="w-full bg-gray-700/30 border-t border-gray-600 transition-all duration-500"
                  style={{ height: `${metric.base}%` }}
                />

                {/* 2. The Stack Boost (The Drug Effect) */}
                <div
                  className={`w-full transition-all duration-500 relative border-t ${isSupra ? "bg-indigo-500 shadow-[0_0_15px_rgba(94,106,210,0.5)] border-indigo-400" : "bg-emerald-500 border-emerald-400"}`}
                  style={{ height: `${metric.boost}%` }}
                >
                  {/* Scanline Effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50" />
                </div>
              </div>

              {/* Labels */}
              <div className="text-center">
                <div className={`text-[10px] font-bold ${isSupra ? "text-indigo-400" : "text-gray-400"}`}>
                  {metric.label}
                </div>
                <div className="text-[8px] text-gray-600 font-mono uppercase tracking-tight">{metric.bio}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PerformanceEqualizer;
