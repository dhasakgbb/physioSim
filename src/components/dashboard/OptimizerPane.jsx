import React, { useState, useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { evaluateStack } from '../../utils/stackEngine';
import { simulateSerum } from '../../utils/pharmacokinetics';
import { COLORS } from '../../utils/theme';

// --- ICONS ---
const IconTrendingUp = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const IconTrendingDown = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const IconAlert = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

// --- COMPONENTS ---

const Sparkline = ({ data, dataKey, color }) => {
  if (!data || data.length === 0) return null;
  
  const min = Math.min(...data.map(d => d[dataKey]));
  const max = Math.max(...data.map(d => d[dataKey]));
  const domain = [min * 0.9, max * 1.1];

  return (
    <div className="w-16 h-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis domain={domain} hide />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={1.5} 
            dot={false} 
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const VitalRow = ({ label, value, unit, status, trend, history, reference }) => {
  let statusColor = "bg-physio-bg-highlight"; // Default / Neutral
  let valueColor = "text-physio-text-primary";
  
  if (status === "critical") {
    statusColor = "bg-physio-accent-critical";
    valueColor = "text-physio-accent-critical";
  } else if (status === "warning") {
    statusColor = "bg-physio-accent-warning";
    valueColor = "text-physio-accent-warning";
  } else if (status === "optimal") {
    statusColor = "bg-physio-accent-success";
    valueColor = "text-physio-accent-success";
  }

  return (
    <div className="flex items-center justify-between py-2 px-3 border-b border-physio-border-subtle hover:bg-physio-bg-highlight/30 transition-colors group">
      {/* Left: Indicator & Label */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-1 h-8 rounded-full ${statusColor} opacity-80`} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-physio-text-secondary truncate">{label}</span>
            {status === "critical" && <span className="text-physio-accent-critical"><IconAlert /></span>}
          </div>
          <div className="text-[10px] text-physio-text-tertiary truncate">
            Ref: {reference}
          </div>
        </div>
      </div>

      {/* Center: Sparkline (Hidden on very small screens) */}
      <div className="hidden sm:block mx-4 opacity-50 group-hover:opacity-100 transition-opacity">
        <Sparkline data={history} dataKey="value" color={status === 'critical' ? COLORS.risk : COLORS.benefit} />
      </div>

      {/* Right: Value & Unit */}
      <div className="text-right">
        <div className={`text-sm font-mono font-bold ${valueColor}`}>
          {value}
        </div>
        <div className="text-[10px] text-physio-text-tertiary flex items-center justify-end gap-1">
          {trend === 'up' && <span className="text-physio-accent-critical"><IconTrendingUp /></span>}
          {trend === 'down' && <span className="text-physio-accent-success"><IconTrendingDown /></span>}
          {unit}
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ title, isOpen, onToggle }) => (
  <button 
    onClick={onToggle}
    className="w-full flex items-center justify-between px-4 py-2 bg-physio-bg-surface border-y border-physio-border-subtle hover:bg-physio-bg-highlight transition-colors"
  >
    <span className="text-xs font-bold text-physio-text-primary uppercase tracking-wider">
      {title}
    </span>
    <span className={`text-physio-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
      ▼
    </span>
  </button>
);

const VitalsPane = ({ stack, userProfile }) => {
  const [sections, setSections] = useState({
    lipids: true,
    hormonal: true,
    organ: true,
    hematology: true
  });

  const toggleSection = (key) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Generate Simulation Data for Sparklines
  const simulationData = useMemo(() => {
    if (!stack.length) return null;

    // Run a 12-week simulation to get trend data
    const duration = 12;
    const releaseProfile = simulateSerum(stack, duration);
    
    // We need to sample points (e.g., weekly) and calculate projected labs for each point
    // This is an approximation: we assume the "activeCompounds" passed to calculateProjectedLabs
    // can be mocked by scaling the dose based on the serum level.
    
    const history = [];
    const weeklyDoseMap = {};
    stack.forEach(s => weeklyDoseMap[s.compound] = s.dose);

    // Sample every 7 days
    for (let day = 0; day <= duration * 7; day += 7) {
      const dayData = releaseProfile.find(d => d.day === day) || releaseProfile[releaseProfile.length - 1];
      
      // Mock active compounds for this day based on serum levels
      // If serum level is 50% of steady state, we treat it as 50% dose for lab calc
      // This is a heuristic but works for visualization
      const mockActiveCompounds = stack.map(item => {
        const serumLevel = dayData[item.compound] || 0;
        // Rough steady state approximation: Weekly Dose / 7 * HalfLifeFactor... 
        // Actually, simpler: just use the serum level directly if the engine supported it.
        // But the engine takes "dose". 
        // Let's just assume the engine calculates "Steady State" labs.
        // So we can scale the steady state labs by the (Current Total Serum / Peak Total Serum).
        return {
          ...item,
          weeklyDose: item.dose // This is static, so labs will be static unless we trick it.
        };
      });

      // Actually, calculateProjectedLabs uses "weeklyDose".
      // To show a trend, we need to scale the dose.
      // Let's calculate the "Load Ratio" for this day.
      const totalWeeklyDose = stack.reduce((sum, s) => sum + s.dose, 0);
      const currentLoad = dayData.total;
      // A rough scalar: If I'm on 500mg/wk, steady state serum might be ~800mg.
      // So Ratio = Current / (Weekly * 1.5 approx).
      // Let's just use the `evaluateStack` result for the final state, and interpolate from baseline?
      // No, that's boring.
      
      // Better approach:
      // The `stackEngine` doesn't export `calculateProjectedLabs` directly (it's internal).
      // But `evaluateStack` returns `analytics.projectedLabs`.
      // So we can call `evaluateStack` with scaled doses?
      // Yes.
      
      const scalar = totalWeeklyDose > 0 ? (currentLoad / (totalWeeklyDose * 1.2)) : 0; // 1.2 is a fudge factor for accumulation
      const effectiveScalar = Math.min(scalar, 1.5); // Cap it

      const scaledStack = stack.map(s => ({
        ...s,
        dose: s.dose * effectiveScalar
      }));

      const result = evaluateStack({ stackInput: scaledStack, profile: userProfile });
      history.push({
        week: day / 7,
        ...result.analytics.projectedLabs
      });
    }
    
    return history;

  }, [stack, userProfile]);

  // Get Current (Steady State) Values
  const currentLabs = useMemo(() => {
    const result = evaluateStack({ stackInput: stack, profile: userProfile });
    return result.analytics.projectedLabs;
  }, [stack, userProfile]);

  if (!stack.length) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-physio-bg-core text-physio-text-tertiary">
        <div className="text-center">
          <p className="text-4xl mb-2">🩺</p>
          <p className="text-xs uppercase tracking-widest">Vitals Monitor Offline</p>
        </div>
      </div>
    );
  }

  // Helper to format history for sparkline
  const getHistory = (key) => simulationData?.map(d => ({ value: d[key] })) || [];

  return (
    <div className="absolute inset-0 bg-physio-bg-core flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-physio-border-subtle bg-physio-bg-surface sticky top-0 z-10">
        <h2 className="text-xs font-bold text-physio-text-primary uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-physio-accent-success animate-pulse"/>
          Live Telemetry
        </h2>
      </div>

      {/* 1. LIPIDS */}
      <SectionHeader title="Lipid Profile" isOpen={sections.lipids} onToggle={() => toggleSection('lipids')} />
      {sections.lipids && (
        <div className="animate-fade-in">
          <VitalRow 
            label="HDL Cholesterol" 
            value={currentLabs.hdl.toFixed(0)} 
            unit="mg/dL" 
            reference="> 40"
            status={currentLabs.hdl < 30 ? "critical" : currentLabs.hdl < 40 ? "warning" : "optimal"}
            trend="down"
            history={getHistory('hdl')}
          />
          <VitalRow 
            label="LDL Cholesterol" 
            value={currentLabs.ldl.toFixed(0)} 
            unit="mg/dL" 
            reference="< 100"
            status={currentLabs.ldl > 160 ? "critical" : currentLabs.ldl > 130 ? "warning" : "optimal"}
            trend="up"
            history={getHistory('ldl')}
          />
        </div>
      )}

      {/* 2. HORMONAL */}
      <SectionHeader title="Endocrine" isOpen={sections.hormonal} onToggle={() => toggleSection('hormonal')} />
      {sections.hormonal && (
        <div className="animate-fade-in">
          <VitalRow 
            label="Total Testosterone" 
            value={currentLabs.totalTestosterone.toFixed(0)} 
            unit="ng/dL" 
            reference="300-1000"
            status={currentLabs.totalTestosterone > 3000 ? "warning" : "optimal"}
            trend="up"
            history={getHistory('totalTestosterone')}
          />
          <VitalRow 
            label="Free Testosterone" 
            value={currentLabs.freeTestosterone.toFixed(1)} 
            unit="pg/mL" 
            reference="35-155"
            status="optimal"
            trend="up"
            history={getHistory('freeTestosterone')}
          />
          <VitalRow 
            label="Estradiol (E2)" 
            value={currentLabs.estradiol.toFixed(1)} 
            unit="pg/mL" 
            reference="10-40"
            status={currentLabs.estradiol > 80 || currentLabs.estradiol < 10 ? "critical" : currentLabs.estradiol > 50 ? "warning" : "optimal"}
            trend={currentLabs.estradiol > 40 ? "up" : "flat"}
            history={getHistory('estradiol')}
          />
          <VitalRow 
            label="Prolactin" 
            value={currentLabs.prolactin.toFixed(1)} 
            unit="ng/mL" 
            reference="4-15"
            status={currentLabs.prolactin > 25 ? "critical" : currentLabs.prolactin > 18 ? "warning" : "optimal"}
            trend={currentLabs.prolactin > 15 ? "up" : "flat"}
            history={getHistory('prolactin')}
          />
        </div>
      )}

      {/* 3. ORGAN STRESS */}
      <SectionHeader title="Organ Stress" isOpen={sections.organ} onToggle={() => toggleSection('organ')} />
      {sections.organ && (
        <div className="animate-fade-in">
          <VitalRow 
            label="AST (Liver)" 
            value={currentLabs.ast.toFixed(0)} 
            unit="U/L" 
            reference="10-40"
            status={currentLabs.ast > 80 ? "critical" : currentLabs.ast > 45 ? "warning" : "optimal"}
            trend="up"
            history={getHistory('ast')}
          />
          <VitalRow 
            label="ALT (Liver)" 
            value={currentLabs.alt.toFixed(0)} 
            unit="U/L" 
            reference="7-56"
            status={currentLabs.alt > 90 ? "critical" : currentLabs.alt > 60 ? "warning" : "optimal"}
            trend="up"
            history={getHistory('alt')}
          />
          <VitalRow 
            label="Creatinine (Kidney)" 
            value={currentLabs.creatinine.toFixed(2)} 
            unit="mg/dL" 
            reference="0.7-1.3"
            status={currentLabs.creatinine > 1.5 ? "critical" : currentLabs.creatinine > 1.35 ? "warning" : "optimal"}
            trend="up"
            history={getHistory('creatinine')}
          />
           <VitalRow 
            label="Neurotoxicity" 
            value={currentLabs.neuroRisk.toFixed(1)} 
            unit="Index" 
            reference="< 2.0"
            status={currentLabs.neuroRisk > 6 ? "critical" : currentLabs.neuroRisk > 3 ? "warning" : "optimal"}
            trend="up"
            history={getHistory('neuroRisk')}
          />
        </div>
      )}

      {/* 4. HEMATOLOGY */}
      <SectionHeader title="Hematology" isOpen={sections.hematology} onToggle={() => toggleSection('hematology')} />
      {sections.hematology && (
        <div className="animate-fade-in">
          <VitalRow 
            label="Hematocrit" 
            value={currentLabs.hematocrit.toFixed(1)} 
            unit="%" 
            reference="38-50"
            status={currentLabs.hematocrit > 54 ? "critical" : currentLabs.hematocrit > 51 ? "warning" : "optimal"}
            trend="up"
            history={getHistory('hematocrit')}
          />
        </div>
      )}
    </div>
  );
};

export default VitalsPane;
