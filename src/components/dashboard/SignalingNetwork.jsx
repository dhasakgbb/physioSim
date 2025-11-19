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

const SignalingNetwork = ({ stack }) => {
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
      outputNodes.push({
        id: `out-${key}`,
        type: 'output',
        key: key,
        label: OUTCOME_NODES[key].label,
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
  }, [stack]);

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
        <g key={`${link.source}-${link.target}-${i}`}>
          {/* Glow Effect for Highlighted */}
          {isHighlighted && (
            <path
              d={pathData}
              fill="none"
              stroke={link.color}
              strokeWidth={Math.max(link.value * 0.8, 2) + 4}
              strokeOpacity={0.2}
              style={{ filter: 'blur(4px)' }}
            />
          )}
          {/* Main Line */}
          <path
            d={pathData}
            fill="none"
            stroke={link.color}
            strokeWidth={Math.max(link.value * 0.5, 1)}
            strokeOpacity={isDimmed ? 0.1 : 0.6}
            className="transition-all duration-300"
          />
          {/* Animated Particle (only if active) */}
          {!isDimmed && (
            <circle r="2" fill="#fff">
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
    <div className="relative w-full h-full min-h-[500px] bg-physio-bg-core rounded-xl overflow-hidden border border-physio-border-subtle shadow-2xl" ref={containerRef}>
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
      
      {/* Column Headers */}
      <div className="absolute top-4 w-full flex justify-between px-10 pointer-events-none text-xs font-bold text-physio-text-tertiary uppercase tracking-widest">
        <span>Compounds</span>
        <span>Pathways</span>
        <span>Outcomes</span>
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

  return (
    <div 
      className={`
        relative flex items-center justify-between px-4 py-3 rounded-lg border bg-physio-bg-surface/90 backdrop-blur-sm
        ${isInput ? 'w-48' : 'w-40'}
      `}
      style={{ 
        borderColor: border,
        boxShadow: glow
      }}
    >
      <div className="flex flex-col">
        <span className="text-xs font-bold text-physio-text-primary">{node.label}</span>
        {node.intensity !== undefined && (
          <div className="flex items-center mt-1 space-x-2">
            <div className="h-1 w-16 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(node.intensity * 5, 100)}%`, backgroundColor: node.color }}
              />
            </div>
            <span className="text-[9px] font-mono text-physio-text-secondary">{Math.round(node.intensity)}%</span>
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
