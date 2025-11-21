import React, { useMemo, useState, useRef, useEffect } from "react";
import { compoundData } from "../../data/compoundData";
import { PATHWAY_NODES, COMPOUND_VECTORS } from "../../data/pathwayMap";

// --- Configuration ---
const ROW_HEIGHT = 110; // Increased to prevent overlap
const COL_WIDTH_PERCENT = 33;

// --- Cool-toned Categorical Color Palette (Blues, Teals, Violets) ---
const CATEGORICAL_COLORS = {
  // Pathway colors (cool tones for categorical distinction)
  ar_genomic: '#3b82f6',    // Blue - primary muscle pathway
  non_genomic: '#06b6d4',  // Cyan - rapid signaling
  estrogen: '#8b5cf6',     // Purple - hormonal modulation
  prolactin: '#6366f1',    // Indigo - lactogenic effects
  liver: '#0ea5e9',         // Sky blue - metabolic processing
  cortisol: '#0891b2',      // Teal - stress modulation
  shbg: '#7c3aed',         // Violet - binding modulation
};

// Status colors (reserved exclusively for semantic meaning)
const STATUS_COLORS = {
  success: '#10b981',      // Green - good/normal
  warning: '#f59e0b',      // Orange - caution/warning
  danger: '#ef4444',       // Red - bad/critical
  neutral: '#6b7280',      // Gray - neutral/inactive
};

// Interactive highlighting colors (bright for emphasis)
const HIGHLIGHT_COLORS = {
  primary: '#3b82f6',      // Bright blue for active elements
  secondary: '#06b6d4',    // Bright cyan for related elements
  muted: 'rgba(255,255,255,0.1)', // Subtle for inactive elements
};

// Map "dirty" vector keys to clean Pathway Node keys
const KEY_MAPPING = {
  neuro: "non_genomic",
  nitrogen: "ar_genomic",
  igf1: "ar_genomic", // Simplified for viz
  anti_e: "estrogen", // Special handling needed (negative)
  rbc: "liver", // Simplified
  dht: "non_genomic",
};

// Map Pathways to Final Outcomes (0-1 impact)
const OUTCOME_MAP = {
  ar_genomic: { muscle: 1.0, fat_loss: 0.4, mood: 0.2, stress: 0.1 },
  non_genomic: { muscle: 0.3, fat_loss: 0.2, mood: 0.8, stress: 0.3 },
  estrogen: { muscle: 0.1, fat_loss: -0.2, mood: -0.4, stress: 0.2 }, // High E2 is bad for mood/stress
  prolactin: { muscle: 0, fat_loss: -0.1, mood: -0.6, stress: 0.2 },
  liver: { muscle: 0, fat_loss: 0, mood: -0.2, stress: 1.0 },
  cortisol: { muscle: 0.5, fat_loss: 0.3, mood: 0.2, stress: -0.5 }, // Blocking cortisol reduces stress
  shbg: { muscle: 0.2, fat_loss: 0, mood: 0, stress: 0 },
};

const OUTCOME_NODES = {
  muscle: { label: "Hypertrophy", color: STATUS_COLORS.success },
  fat_loss: { label: "Lipolysis", color: STATUS_COLORS.warning },
  mood: { label: "Neuro/Mood", color: STATUS_COLORS.neutral },
  stress: { label: "Systemic Load", color: STATUS_COLORS.danger },
};

const CircularProgress = ({
  value,
  max = 100,
  color,
  size = 56,
  strokeWidth = 5,
  label,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const normalizedValue = Math.min(Math.max(value, 0), max);
  const offset = circumference - (normalizedValue / max) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg className="transform -rotate-90 w-full h-full overflow-visible">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#374151" // gray-700
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Indicator */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <span className="absolute text-sm font-bold text-physio-text-primary font-mono">
          {value}
        </span>
      </div>
      <span className="text-[10px] font-bold text-physio-text-secondary uppercase tracking-wider text-center leading-tight">
        {label}
      </span>
    </div>
  );
};

const SignalingNetwork = ({ stack, metrics }) => {
  const [hoverState, setHoverState] = useState({
    activeNodes: new Set(),
    activeLinks: new Set(),
    isHovering: false,
  });
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: Math.max(
            600,
            Object.keys(PATHWAY_NODES).length * ROW_HEIGHT + 200,
          ),
        });
      }
    };

    // Initial sizing
    updateDimensions();

    // Watch for resize
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // 1. Calculate Data Model
  const { nodes, links } = useMemo(() => {
    const inputNodes = [];
    const pathwayNodes = [];
    const outputNodes = [];
    const activeLinks = [];

    // Calculate vertical centering offsets
    const pathwayCount = Object.keys(PATHWAY_NODES).length;
    const inputCount = stack.length;
    const outputCount = Object.keys(OUTCOME_NODES).length;

    const pathwayTotalHeight = pathwayCount * ROW_HEIGHT;
    const inputTotalHeight = inputCount * ROW_HEIGHT;
    const outputTotalHeight = outputCount * ROW_HEIGHT;

    // Center smaller columns relative to the tallest one (usually pathways)
    // Base Y is 120 to clear headers
    const baseY = 120;
    const inputStartY =
      baseY + Math.max(0, (pathwayTotalHeight - inputTotalHeight) / 2);
    const pathwayStartY = baseY;
    const outputStartY =
      baseY + Math.max(0, (pathwayTotalHeight - outputTotalHeight) / 2);

    // --- A. INPUT NODES ---
    stack.forEach((item, idx) => {
      inputNodes.push({
        id: `input-${item.compound}`,
        type: "input",
        label: compoundData[item.compound].name,
        color: compoundData[item.compound].color || "#9ca3af",
        y: idx * ROW_HEIGHT + inputStartY,
        x: 0, // Left
        data: item,
      });
    });

    // --- B. PATHWAY NODES ---
    const pathwayKeys = Object.keys(PATHWAY_NODES);
    const pathwayLoads = {};
    pathwayKeys.forEach((key, idx) => {
      pathwayLoads[key] = 0;
      pathwayNodes.push({
        id: `path-${key}`,
        type: "pathway",
        key: key,
        label: PATHWAY_NODES[key].label,
        color: PATHWAY_NODES[key].color,
        y: idx * ROW_HEIGHT + pathwayStartY,
        x: 1, // Center (logical coord)
      });
    });

    // --- C. CALCULATE LOADS & LINKS (Input -> Pathway) ---
    stack.forEach((item) => {
      const vector = COMPOUND_VECTORS[item.compound] || {};
      const meta = compoundData[item.compound];
      
      // Standardize Dose Factor with Engine (Weekly Dose / 300)
      const weeklyDose = meta.type === "oral" ? item.dose * 7 : item.dose;
      const doseFactor = weeklyDose / 300;

      Object.entries(vector).forEach(([rawKey, rawStrength]) => {
        const key = KEY_MAPPING[rawKey] || rawKey;
        const strength = Math.abs(rawStrength) * doseFactor; // Handle negatives later if needed

        if (pathwayLoads[key] !== undefined) {
          // We accumulate locally for link generation, but will override node intensity from metrics
          pathwayLoads[key] += strength;

          // Create Link
          activeLinks.push({
            source: `input-${item.compound}`,
            target: `path-${key}`,
            value: strength,
            color: meta.color,
            type: "input-path",
          });
        }
      });
    });

    // Update Pathway Nodes with Intensity
    // USE SINGLE SOURCE OF TRUTH if available
    pathwayNodes.forEach((node) => {
      if (metrics?.analytics?.pathwayLoads?.[node.key] !== undefined) {
        node.intensity = metrics.analytics.pathwayLoads[node.key];
      } else {
        node.intensity = pathwayLoads[node.key];
      }

      // --- SPILLOVER LOGIC (AR > 500) ---
      if (node.key === "ar_genomic" && node.intensity > 500) {
        const excess = node.intensity - 500;
        node.intensity = 500; // Cap the AR node

        // Create Systemic Waste Node
        const wasteNodeId = "path-systemic_waste";
        let wasteNode = pathwayNodes.find((n) => n.id === wasteNodeId);
        
        if (!wasteNode) {
          wasteNode = {
            id: wasteNodeId,
            type: "pathway",
            key: "systemic_waste",
            label: "Systemic Waste",
            color: "#EF4444", // Red
            y: node.y + ROW_HEIGHT * 0.8, // Offset slightly below AR
            x: 1,
            intensity: 0,
          };
          pathwayNodes.push(wasteNode);
        }
        
        wasteNode.intensity += excess;

        // Create Spillover Link (Visual only, from AR to Waste)
        activeLinks.push({
          source: node.id,
          target: wasteNodeId,
          value: excess,
          color: "#EF4444",
          type: "spillover",
        });
      }
    });

    // --- D. CALCULATE OUTPUT LOADS & LINKS (Pathway -> Output) ---
    // Moved before Output Node creation to populate 'mood' value
    const outputKeys = Object.keys(OUTCOME_NODES);
    const outputLoads = { muscle: 0, fat_loss: 0, mood: 0, stress: 0 };

    pathwayNodes.forEach((pNode) => {
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
            type: "path-out",
          });
        }
      });
    });

    // --- E. OUTPUT NODES ---
    outputKeys.forEach((key, idx) => {
      let displayValue = 0;
      let displayLabel = OUTCOME_NODES[key].label;

      // Inject Real Metrics if available
      if (metrics && metrics.totals) {
        const t = metrics.totals;
        if (key === "muscle")
          displayValue = Number(t.genomicBenefit.toFixed(1));
        if (key === "stress") displayValue = Number(t.totalRisk.toFixed(1));
        if (key === "fat_loss")
          displayValue = Number((t.totalBenefit * 0.35).toFixed(1));
        // FIX: Use graph-calculated load for Mood since Engine doesn't aggregate it well
        if (key === "mood") displayValue = Number(outputLoads.mood.toFixed(1));
      }

      outputNodes.push({
        id: `out-${key}`,
        type: "output",
        key: key,
        label: displayLabel,
        displayValue: displayValue,
        color: OUTCOME_NODES[key].color,
        y: idx * ROW_HEIGHT + outputStartY,
        x: 2, // Right
      });
    });

    // Update Output Nodes with Intensity (for visual glow)
    outputNodes.forEach((node) => {
      node.intensity = outputLoads[node.key];
    });

    return {
      nodes: [...inputNodes, ...pathwayNodes, ...outputNodes],
      links: activeLinks,
    };
  }, [stack, metrics]);

  // Interaction Logic: Trace Paths
  const handleNodeHover = (nodeId) => {
    if (!nodeId) {
      setHoverState({
        activeNodes: new Set(),
        activeLinks: new Set(),
        isHovering: false,
      });
      return;
    }

    const activeNodes = new Set([nodeId]);
    const activeLinks = new Set();

    // Helper: Find all connected nodes recursively
    const trace = (currentId, direction) => {
      links.forEach((link) => {
        const isOutgoing = direction === "forward" && link.source === currentId;
        const isIncoming =
          direction === "backward" && link.target === currentId;

        if (isOutgoing) {
          const linkKey = `${link.source}-${link.target}`;
          if (!activeLinks.has(linkKey)) {
            activeLinks.add(linkKey);
            activeNodes.add(link.target);
            trace(link.target, "forward");
          }
        }
        if (isIncoming) {
          const linkKey = `${link.source}-${link.target}`;
          if (!activeLinks.has(linkKey)) {
            activeLinks.add(linkKey);
            activeNodes.add(link.source);
            trace(link.source, "backward");
          }
        }
      });
    };

    trace(nodeId, "forward");
    trace(nodeId, "backward");

    setHoverState({ activeNodes, activeLinks, isHovering: true });
  };

  // Helper to get coordinates
  const getCoords = (node, colWidth) => {
    let x = 0;
    if (node.type === "input") x = 120; // Padding left (increased to prevent cutoff)
    if (node.type === "pathway") x = colWidth * 1.5; // Center
    if (node.type === "output") x = colWidth * 3 - 120; // Padding right (increased to prevent cutoff)
    return { x, y: node.y };
  };

  const colWidth = dimensions.width / 3;

  // Render Lines
  const renderLinks = () => {
    // Sort links so highlighted ones are rendered last (on top)
    const sortedLinks = [...links].sort((a, b) => {
      const aKey = `${a.source}-${a.target}`;
      const bKey = `${b.source}-${b.target}`;
      const aActive = hoverState.activeLinks.has(aKey);
      const bActive = hoverState.activeLinks.has(bKey);
      return aActive === bActive ? 0 : aActive ? 1 : -1;
    });

    return sortedLinks.map((link, i) => {
      const sourceNode = nodes.find((n) => n.id === link.source);
      const targetNode = nodes.find((n) => n.id === link.target);
      if (!sourceNode || !targetNode) return null;

      const start = getCoords(sourceNode, colWidth);
      const end = getCoords(targetNode, colWidth);

      // Adjust start/end to be at the edges of the cards
      // Input Card: w-48 (192px) -> Half 96px
      // Pathway Card: w-40 (160px) -> Half 80px
      // Output Card: w-32 (128px) -> Half 64px

      const startOffset = sourceNode.type === "input" ? 100 : 85;
      const endOffset = targetNode.type === "output" ? 70 : 85;

      const startX = start.x + startOffset;
      const endX = end.x - endOffset;

      // Tighter Bezier Control Points for cable-like curves
      const curveTension = 0.3; // Reduced from 0.5 for tighter curves
      const verticalOffset = 25; // Small vertical offset for cable-like appearance

      const cp1x = startX + (endX - startX) * curveTension;
      const cp1y = start.y + (start.y < end.y ? verticalOffset : -verticalOffset);
      const cp2x = endX - (endX - startX) * curveTension;
      const cp2y = end.y + (end.y < start.y ? verticalOffset : -verticalOffset);

      const pathData = `M ${startX} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${end.y}`;

      const linkKey = `${link.source}-${link.target}`;
      const isDimmed =
        hoverState.isHovering && !hoverState.activeLinks.has(linkKey);
      const isHighlighted = hoverState.activeLinks.has(linkKey);

      return (
        <g
          key={linkKey}
          className={
            isDimmed
              ? "opacity-10 transition-opacity duration-300"
              : "opacity-100 transition-opacity duration-300"
          }
        >
          <title>{`Signal Strength: ${link.value.toFixed(2)}`}</title>
          {/* Glow Effect for Highlighted */}
          {isHighlighted && (
            <path
              d={pathData}
              fill="none"
              stroke={HIGHLIGHT_COLORS.primary}
              strokeWidth={Math.max(link.value * 0.8, 2) + 6}
              strokeOpacity={0.4}
              style={{ filter: "blur(6px)" }}
            />
          )}
          {/* Main Line */}
          <path
            d={pathData}
            fill="none"
            stroke={isHighlighted ? "var(--primary-indigo)" : HIGHLIGHT_COLORS.muted}
            strokeWidth={
              isHighlighted
                ? Math.max(link.value * 0.5, 1) + 2
                : Math.max(link.value * 0.5, 1)
            }
            strokeOpacity={isDimmed ? 0.05 : (isHighlighted ? 0.8 : 0.2)}
            className="transition-all duration-300"
          />
          {/* Animated Particle (only if active) */}
          {!isDimmed && (
            <circle r={isHighlighted ? 3 : 2} fill="#fff">
              <animateMotion
                dur={`${Math.max(2000 - link.value * 100, 500)}ms`}
                repeatCount="indefinite"
                path={pathData}
              />
            </circle>
          )}

          {/* Inline Percentage Label */}
          {link.value > 5 && !isDimmed && (
            <text
              x={startX + (endX - startX) * 0.5}
              y={Math.min(start.y, end.y) + Math.abs(end.y - start.y) * 0.5}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-white font-bold text-xs pointer-events-none select-none"
              style={{
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                fontSize: Math.max(10, Math.min(14, link.value * 0.3)),
              }}
            >
              {Math.round(link.value)}%
            </text>
          )}
        </g>
      );
    });
  };

  const isEmpty = !stack || stack.length === 0;

  return (
    <div className={`relative w-full h-full overflow-hidden flex flex-col ${isEmpty ? 'ghost-wireframe' : ''}`}>

      {/* Scrollable Area */}
      <div
        className="relative flex-1 w-full overflow-y-auto"
        ref={containerRef}
      >
        <div
          style={{ height: dimensions.height, minHeight: "100%" }}
          className="relative w-full"
        >
          {/* Grid Background */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(#27272A 1px, transparent 1px), linear-gradient(90deg, #27272A 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* SVG Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {renderLinks()}
          </svg>

          {/* Empty State */}
          {nodes.filter((n) => n.type === "input").length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="bg-physio-bg-surface/80 backdrop-blur px-6 py-4 rounded-xl border border-physio-border-subtle text-center">
                <p className="text-physio-text-secondary font-medium">
                  No Active Compounds
                </p>
                <p className="text-xs text-physio-text-tertiary mt-1">
                  Add compounds to the stack to visualize signaling pathways.
                </p>
              </div>
            </div>
          )}

          {/* Nodes Layer */}
          <div className="absolute inset-0 z-10">
            {nodes.map((node) => {
              const coords = getCoords(node, colWidth);
              const isDimmed =
                hoverState.isHovering && !hoverState.activeNodes.has(node.id);

              return (
                <div
                  key={node.id}
                  className={`absolute transform -translate-y-1/2 -translate-x-1/2 transition-all duration-300 cursor-pointer
                    ${isDimmed ? "opacity-20 grayscale" : "opacity-100 scale-105"}
                  `}
                  style={{ left: coords.x, top: coords.y }}
                  onMouseEnter={() => handleNodeHover(node.id)}
                  onMouseLeave={() => handleNodeHover(null)}
                >
                  {node.type === "output" ? (
                    <div className="flex flex-col items-center justify-center w-32 py-3 rounded-2xl border border-physio-border-subtle bg-[#1e293b]/90 backdrop-blur-sm shadow-lg">
                      <CircularProgress
                        value={node.displayValue}
                        max={15} // Assuming 15 is max score
                        color={node.color}
                        label={node.label}
                      />
                    </div>
                  ) : (
                    <NodeCard node={node} />
                  )}
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
  const isInput = node.type === "input";

  // Calculate saturation percentage - pathway-specific limits
  const pathwayLimits = {
    ar_genomic: 500,
    non_genomic: 200,
    neuro: 200,
    liver: 150,
    estrogen: 150,
    prolactin: 150,
    progesterone: 150,
    cortisol: 150,
    shbg: 150,
    heart: 150,
  };

  const limit = pathwayLimits[node.key] || 200; // Default to 200 for unknown pathways
  const saturation = Math.min((node.intensity / limit) * 100, 100);
  const isSaturated = saturation > 80;

  // Dynamic node sizing based on load intensity
  const baseWidth = isInput ? 192 : 160; // Base widths in pixels (w-48 = 192px, w-40 = 160px)
  const intensityFactor = Math.max(0.7, Math.min(1.0, 0.7 + (saturation / 100) * 0.3)); // Scale from 0.7x to 1.0x
  const dynamicWidth = Math.round(baseWidth * intensityFactor);
  const dynamicHeight = Math.round(48 * intensityFactor); // Base height is 48px (py-3)

  // Dynamic styles based on intensity
  const glowIntensity = Math.min(node.intensity * 1.5, 25);
  const glow = node.intensity
    ? `0 0 ${glowIntensity}px ${node.color}60`
    : "none";
  const border = node.intensity > 15 ? "#ef4444" : node.color || "#4b5563";

  // Breathing animation for nodes near capacity
  const breathingAnimation = saturation > 70 ? "animate-pulse" : "";
  const breathingIntensity = saturation > 80 ? 0.8 : saturation > 70 ? 0.4 : 0;

  // Pulse animation for nodes exceeding 85% capacity (2s duration)
  const pulseAnimation = saturation > 85 ? "animate-pulse" : "";
  const pulseIntensity = saturation > 85 ? 0.6 : 0;

  return (
    <div
      className={`
        relative flex items-center justify-between rounded-lg border bg-physio-bg-surface
        transition-all duration-500 ease-out
        ${pulseAnimation}
      `}
      style={{
        width: `${dynamicWidth}px`,
        padding: `${Math.round(8 * intensityFactor)}px`,
        minHeight: `${dynamicHeight}px`,
        borderColor: 'var(--border-highlight)',
        boxShadow: saturation > 85
          ? `0 0 ${pulseIntensity * 20}px rgba(239, 68, 68, ${pulseIntensity})`
          : 'none',
        opacity: saturation > 10 ? 1 : 0.7, // Fade out very low intensity nodes
        animationDuration: '2s',
      }}
    >
      <div className="flex flex-col w-full">
        <div className="flex justify-between items-center mb-1">
          <span
            className={`font-bold text-physio-text-primary truncate pr-2 ${
              intensityFactor > 0.85 ? 'text-sm' : 'text-xs'
            }`}
            style={{
              fontSize: intensityFactor > 0.9 ? '14px' : intensityFactor > 0.8 ? '13px' : '12px'
            }}
          >
            {node.label}
          </span>
          {/* Intensity indicator dots */}
          {saturation > 20 && (
            <div className="flex gap-0.5">
              {Array.from({ length: Math.min(3, Math.floor(saturation / 30)) }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-1 rounded-full ${
                    isSaturated ? 'bg-red-400' : 'bg-physio-accent-primary'
                  }`}
                  style={{
                    opacity: 0.6 + (i * 0.2), // Gradient effect
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {node.intensity !== undefined && (
          <div className="w-full">
            <div className="flex justify-between text-[9px] text-physio-text-tertiary mb-1">
              <span>Load</span>
              <span className={isSaturated ? "text-red-400 font-bold" : ""}>
                {Math.round(saturation)}%
              </span>
            </div>
            <div
              className="w-full bg-gray-800 rounded-full overflow-hidden"
              style={{ height: `${Math.max(2, Math.round(6 * intensityFactor))}px` }}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isSaturated ? "animate-pulse" : ""
                } ${saturation > 80 ? "shadow-[0_0_6px_rgba(239,68,68,0.8)]" : ""}`}
                style={{
                  width: `${saturation}%`,
                  backgroundColor: isSaturated ? "#ef4444" : node.color,
                  boxShadow: saturation > 60 ? `0 0 ${saturation > 80 ? 8 : 4}px ${node.color}80` : 'none',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Connection Points */}
      {!isInput && (
        <div className="absolute -left-1 w-2 h-2 bg-physio-text-tertiary rounded-full" />
      )}
      <div className="absolute -right-1 w-2 h-2 bg-physio-text-tertiary rounded-full" />
    </div>
  );
};

export default SignalingNetwork;
