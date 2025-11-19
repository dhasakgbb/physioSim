import React, { useMemo, useState, useRef, useEffect } from 'react';
import { compoundData } from '../../data/compoundData';
import { PATHWAY_NODES, COMPOUND_VECTORS } from '../../data/pathwayMap';

// --- Configuration ---
const ROW_HEIGHT = 60; // Reduced from 70 for better laptop fit
const COL_WIDTH_PERCENT = 33;

// Map "dirty" vector keys to clean Pathway Node keys
const KEY_MAPPING = {
  neuro: 'non_genomic',
  nitrogen: 'ar_genomic',
  igf1: 'ar_genomic', // Simplified for viz
  anti_e: 'estrogen', // Special handling needed (negative)
  rbc: 'liver', // Simplified
  dht: 'non_genomic'
};

// Map Pathways to Final Outcomes (0-1 impact)
const OUTCOME_MAP = {
  ar_genomic: { muscle: 1.0, fat_loss: 0.4, mood: 0.2, stress: 0.1 },
  non_genomic: { muscle: 0.3, fat_loss: 0.2, mood: 0.8, stress: 0.3 },
  estrogen: { muscle: 0.1, fat_loss: -0.2, mood: -0.4, stress: 0.2 }, // High E2 is bad for mood/stress
  prolactin: { muscle: 0, fat_loss: -0.1, mood: -0.6, stress: 0.2 },
  liver: { muscle: 0, fat_loss: 0, mood: -0.2, stress: 1.0 },
  cortisol: { muscle: 0.5, fat_loss: 0.3, mood: 0.2, stress: -0.5 }, // Blocking cortisol reduces stress
  shbg: { muscle: 0.2, fat_loss: 0, mood: 0, stress: 0 }
};

const OUTCOME_NODES = {
  muscle: { label: 'Hypertrophy', color: '#10b981' },
  fat_loss: { label: 'Lipolysis', color: '#f59e0b' },
  mood: { label: 'Neuro/Mood', color: '#8b5cf6' },
  stress: { label: 'Systemic Load', color: '#ef4444' }
};

const SignalingNetwork = ({ stack, metrics }) => {
  const [hoveredNode, setHoveredNode] = useState(null); // { type, id }
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: Math.max(500, Object.keys(PATHWAY_NODES).length * ROW_HEIGHT + 80)
      });
    }
  }, [containerRef.current]);

  // 1. Calculate Data Model
  const { nodes, links } = useMemo(() => {
    const inputNodes = [];
    const pathwayNodes = [];
    const outputNodes = [];
    const activeLinks = [];

    // --- A. INPUT NODES ---
    stack.forEach((item, idx) => {
      inputNodes.push({
        id: `input-${item.compound}`,
        type: 'input',
        label: compoundData[item.compound].name,
        color: compoundData[item.compound].color || '#9ca3af',
        y: (idx * ROW_HEIGHT) + 80, // Start a bit down
        x: 0, // Left
        data: item
      });
    });

    // --- B. PATHWAY NODES ---
    const pathwayKeys = Object.keys(PATHWAY_NODES);
    const pathwayLoads = {};
    pathwayKeys.forEach((key, idx) => {
      pathwayLoads[key] = 0;
      pathwayNodes.push({
        id: `path-${key}`,
        type: 'pathway',
        key: key,
        label: PATHWAY_NODES[key].label,
        color: PATHWAY_NODES[key].color,
        y: (idx * ROW_HEIGHT) + 50,
        x: 1, // Center (logical coord)
      });
    });

    // --- C. CALCULATE LOADS & LINKS (Input -> Pathway) ---
    stack.forEach((item) => {
      const vector = COMPOUND_VECTORS[item.compound] || {};
      const meta = compoundData[item.compound];
      const doseFactor = item.dose / (meta.type === 'oral' ? 40 : 300);

      Object.entries(vector).forEach(([rawKey, rawStrength]) => {
        const key = KEY_MAPPING[rawKey] || rawKey;
        const strength = Math.abs(rawStrength) * doseFactor; // Handle negatives later if needed
        
        if (pathwayLoads[key] !== undefined) {
          pathwayLoads[key] += strength;

          // Create Link
          activeLinks.push({
            source: `input-${item.compound}`,
            target: `path-${key}`,
            value: strength,
            color: meta.color,
            type: 'input-path'
          });
        }
      });
    });

    // Update Pathway Nodes with Intensity
    pathwayNodes.forEach(node => {
      node.intensity = pathwayLoads[node.key];
    });

    // --- D. OUTPUT NODES ---
    const outputKeys = Object.keys(OUTCOME_NODES);
    const outputLoads = { muscle: 0, fat_loss: 0, mood: 0, stress: 0 };

    outputKeys.forEach((key, idx) => {
      let displayValue = null;
      let displayLabel = OUTCOME_NODES[key].label;

      // Inject Real Metrics if available
      if (metrics && metrics.totals) {
        const t = metrics.totals;
        if (key === 'muscle') displayValue = t.genomicBenefit.toFixed(1);
        if (key === 'stress') displayValue = t.totalRisk.toFixed(1);
        if (key === 'fat_loss') displayValue = (t.totalBenefit * 0.35).toFixed(1); 
        if (key === 'mood') displayValue = t.nonGenomicBenefit.toFixed(1);
      }

      outputNodes.push({
        id: `out-${key}`,
        type: 'output',
        key: key,
        label: displayLabel,
        displayValue: displayValue,
        color: OUTCOME_NODES[key].color,
        y: (idx * ROW_HEIGHT) + 80,
        x: 2 // Right
      });
    });

    // --- E. CALCULATE OUTPUTS & LINKS (Pathway -> Output) ---
    pathwayNodes.forEach(pNode => {
      if (pNode.intensity <= 0) return;
      
      const map = OUTCOME_MAP[pNode.key];
      if (!map) return;

      Object.entries(map).forEach(([outKey, factor]) => {
        const impact = pNode.intensity * factor;
        if (Math.abs(impact) > 0.1) {
          outputLoads[outKey] += impact;
          
          activeLinks.push({
            source: pNode.id,
            target: `out-${outKey}`,
            value: Math.abs(impact),
            color: pNode.color,
            type: 'path-out'
          });
        }
      });
    });

    // Update Output Nodes
    outputNodes.forEach(node => {
      node.intensity = outputLoads[node.key];
    });

    return { 
      nodes: [...inputNodes, ...pathwayNodes, ...outputNodes], 
      links: activeLinks 
    };
  }, [stack, metrics]);

  // Helper to get coordinates
  const getCoords = (node, colWidth) => {
    let x = 0;
    if (node.type === 'input') x = 40; // Padding left
    if (node.type === 'pathway') x = colWidth * 1.5; // Center
    if (node.type === 'output') x = colWidth * 3 - 40; // Padding right
    return { x, y: node.y };
  };

  const colWidth = dimensions.width / 3;

  // Render Lines
  const renderLinks = () => {
    return links.map((link, i) => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);
      if (!sourceNode || !targetNode) return null;

      const start = getCoords(sourceNode, colWidth);
      const end = getCoords(targetNode, colWidth);

      // Adjust start/end to be at the edges of the cards
      const startX = start.x + (sourceNode.type === 'input' ? 100 : 60); // Card width approx
      const endX = end.x - (targetNode.type === 'output' ? 100 : 60);

      // Bezier Control Points
      const cp1x = startX + (endX - startX) * 0.5;
      const cp1y = start.y;
      const cp2x = startX + (endX - startX) * 0.5;
      const cp2y = end.y;

      const pathData = `M ${startX} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${end.y}`;

      // Hover Logic
      const isDimmed = hoveredNode && (
        (hoveredNode.type === 'input' && link.source !== hoveredNode.id) ||
        (hoveredNode.type === 'pathway' && link.target !== hoveredNode.id && link.source !== hoveredNode.id) ||
        (hoveredNode.type === 'output' && link.target !== hoveredNode.id)
      );

      const isHighlighted = hoveredNode && !isDimmed;

      return (
        <g key={`${link.source}-${link.target}-${i}`} className={isDimmed ? 'opacity-10 transition-opacity duration-300' : 'opacity-100 transition-opacity duration-300'}>
          {/* Glow Effect for Highlighted */}
          {isHighlighted && (
            <path
              d={pathData}
              fill="none"
              stroke={link.color}
              strokeWidth={Math.max(link.value * 0.8, 2) + 6}
              strokeOpacity={0.4}
              style={{ filter: 'blur(6px)' }}
            />
          )}
          {/* Main Line */}
          <path
            d={pathData}
            fill="none"
            stroke={link.color}
            strokeWidth={isHighlighted ? Math.max(link.value * 0.5, 1) + 2 : Math.max(link.value * 0.5, 1)}
            strokeOpacity={isDimmed ? 0.1 : 0.8}
            className="transition-all duration-300"
          />
          {/* Animated Particle (only if active) */}
          {!isDimmed && (
            <circle r={isHighlighted ? 3 : 2} fill="#fff">
              <animateMotion
                dur={`${Math.max(2000 - (link.value * 100), 500)}ms`}
                repeatCount="indefinite"
                path={pathData}
              />
            </circle>
          )}
        </g>
      );
    });
  };

  return (
    <div className="relative w-full h-full min-h-[500px] bg-physio-bg-core rounded-xl border border-physio-border-subtle shadow-2xl overflow-hidden flex flex-col">
      {/* Column Headers - Fixed at top */}
      <div className="w-full flex justify-between px-10 py-4 bg-physio-bg-core z-20 border-b border-physio-border-subtle text-xs font-bold text-physio-text-tertiary uppercase tracking-widest">
        <span>Compounds</span>
        <span>Pathways</span>
        <span>Outcomes</span>
      </div>

      {/* Scrollable Area */}
      <div className="relative flex-1 w-full overflow-y-auto" ref={containerRef}>
        <div style={{ height: dimensions.height, minHeight: '100%' }} className="relative w-full">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
               style={{ 
                 backgroundImage: 'linear-gradient(#1f2937 1px, transparent 1px), linear-gradient(90deg, #1f2937 1px, transparent 1px)', 
                 backgroundSize: '40px 40px' 
               }} 
          />

          {/* SVG Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {renderLinks()}
          </svg>

          {/* Empty State */}
          {nodes.filter(n => n.type === 'input').length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="bg-physio-bg-surface/80 backdrop-blur px-6 py-4 rounded-xl border border-physio-border-subtle text-center">
                <p className="text-physio-text-secondary font-medium">No Active Compounds</p>
                <p className="text-xs text-physio-text-tertiary mt-1">Add compounds to the stack to visualize signaling pathways.</p>
              </div>
            </div>
          )}

          {/* Nodes Layer */}
          <div className="absolute inset-0 z-10">
            {nodes.map(node => {
              const coords = getCoords(node, colWidth);
              const isDimmed = hoveredNode && hoveredNode.id !== node.id && 
                !links.some(l => (l.source === hoveredNode.id && l.target === node.id) || (l.target === hoveredNode.id && l.source === node.id));

              return (
                <div
                  key={node.id}
                  className={`absolute transform -translate-y-1/2 -translate-x-1/2 transition-all duration-300 cursor-pointer
                    ${isDimmed ? 'opacity-30 grayscale' : 'opacity-100 scale-105'}
                  `}
                  style={{ left: coords.x, top: coords.y }}
                  onMouseEnter={() => setHoveredNode({ id: node.id, type: node.type })}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <NodeCard node={node} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const NodeCard = ({ node }) => {
  const isInput = node.type === 'input';
  const isOutput = node.type === 'output';
  
  // Dynamic styles based on intensity
  const glow = node.intensity ? `0 0 ${Math.min(node.intensity * 2, 20)}px ${node.color}40` : 'none';
  const border = node.intensity > 15 ? '#ef4444' : (node.color || '#4b5563');

  // Calculate saturation percentage (assuming 20 is max "safe" load for viz)
  const saturation = Math.min((node.intensity / 20) * 100, 100);
  const isSaturated = saturation > 80;

  return (
    <div 
      className={`
        relative flex items-center justify-between px-4 py-3 rounded-lg border bg-physio-bg-surface/90 backdrop-blur-sm
        ${isInput ? 'w-48' : 'w-40'}
        transition-all duration-300
      `}
      style={{ 
        borderColor: border,
        boxShadow: glow,
        transform: isSaturated ? 'scale(1.02)' : 'scale(1)'
      }}
    >
      <div className="flex flex-col w-full">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-bold text-physio-text-primary truncate pr-2">{node.label}</span>
          {node.displayValue && (
             <span className={`text-xs font-mono font-bold ${node.key === 'stress' ? 'text-red-400' : 'text-green-400'}`}>
               {node.displayValue}
             </span>
          )}
        </div>
        
        {node.intensity !== undefined && !node.displayValue && (
          <div className="w-full">
            <div className="flex justify-between text-[9px] text-physio-text-tertiary mb-0.5">
               <span>Load</span>
               <span className={isSaturated ? 'text-red-400 font-bold' : ''}>{Math.round(saturation)}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${isSaturated ? 'animate-pulse' : ''}`}
                style={{ 
                  width: `${saturation}%`, 
                  backgroundColor: isSaturated ? '#ef4444' : node.color 
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Connection Points */}
      {!isInput && <div className="absolute -left-1 w-2 h-2 bg-physio-text-tertiary rounded-full" />}
      {!isOutput && <div className="absolute -right-1 w-2 h-2 bg-physio-text-tertiary rounded-full" />}
    </div>
  );
};

export default SignalingNetwork;
