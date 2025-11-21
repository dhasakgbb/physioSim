import React, { useState } from 'react';
// Import your icons and types here

export const ActiveMixture = ({ compounds, onRemove, onUpdate }) => {
  // LOGIC: Only show empty state if array is empty
  const isEmpty = compounds.length === 0;

  return (
    <div className="flex flex-col h-full w-full bg-[#0F1115] relative overflow-hidden">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
        <h2 className="text-xs font-bold tracking-widest text-gray-500 uppercase">Active Stack ({compounds.length})</h2>
        <button className="text-xs text-indigo-400 hover:text-indigo-300">+ Add</button>
      </div>

      {/* BODY - CONDITIONAL RENDERING */}
      <div className="flex-1 overflow-y-auto scrollbar-hide relative">
        
        {/* STATE A: THE EMPTY STATE (Only visible if isEmpty) */}
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 opacity-40">
            <div className="h-12 w-12 mb-3 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              {/* Icon placeholder */}
              <span className="text-xl">🧬</span>
            </div>
            <h3 className="text-sm font-medium text-gray-300">No Compounds</h3>
            <p className="text-xs text-gray-600 mt-1">Deploy from console to begin.</p>
          </div>
        )}

        {/* STATE B: THE LIST (Only visible if !isEmpty) */}
        {!isEmpty && (
          <div className="flex flex-col divide-y divide-white/5">
            {compounds.map((compound) => (
              <CompoundRow 
                key={compound.id} 
                data={compound} 
                onRemove={onRemove}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// SUB-COMPONENT: THE ROW (Fixes the Text Overlap)
const CompoundRow = ({ data, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="group flex flex-col bg-[#0F1115] hover:bg-[#16181c] transition-colors cursor-pointer">
      {/* TOP ROW: Always Visible */}
      <div 
        className="flex items-center h-14 px-4 gap-3 w-full"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* 1. Color Dot / Icon (Fixed) */}
        <div className="shrink-0 h-2 w-2 rounded-full" style={{ backgroundColor: data.color || '#6366f1' }} />

        {/* 2. Text Stack (THE FIX: min-w-0) */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="truncate text-sm font-medium text-gray-200 pr-2">
              {data.name}
            </span>
            {/* Optional Badge */}
            {data.type === 'Oral' && (
              <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                ORAL
              </span>
            )}
          </div>
          <span className="truncate text-xs text-gray-500 font-mono mt-0.5">
            {data.dosage} mg • {data.ester}
          </span>
        </div>

        {/* 3. Action Area (Fixed) */}
        <div className="shrink-0 flex items-center">
           {/* Expand/Collapse Chevron */}
           <span className={`text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </div>

      {/* EXPANDED DRAWER: Sliders go here */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 bg-[#13151A] border-t border-dashed border-white/5">
          <div className="mt-3">
            <label className="text-[10px] uppercase text-gray-500 font-bold">Dosage Adjustment</label>
            <input 
              type="range" 
              className="w-full mt-2 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
            />
            <div className="flex justify-between mt-1 text-xs font-mono text-gray-400">
              <span>0mg</span>
              <span>{data.dosage}mg</span>
              <span>1000mg</span>
            </div>
          </div>
          
          {/* Remove Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); onRemove(data.id); }}
            className="mt-4 w-full py-1.5 text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded border border-red-500/20 transition-colors"
          >
            Remove Compound
          </button>
        </div>
      )}
    </div>
  );
};