import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  interactionPairs,
  interactionHeatmapModes,
  interactionDimensions,
  defaultSensitivities,
  goalPresets,
  stackOptimizerCombos
} from '../data/interactionEngineData';
import {
  computeHeatmapValue,
  evaluatePairDimension,
  generatePrimaryCurveSeries,
  buildSurfaceData
} from '../utils/interactionEngine';
import { generateStackOptimizerResults } from '../utils/stackOptimizer';
import { compoundData } from '../data/compoundData';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import PDFExport from './PDFExport';

const uniqueCompounds = Array.from(
  new Set(Object.values(interactionPairs).flatMap(pair => pair.compounds))
);

const heatmapColorScale = (value, maxValue, mode) => {
  if (maxValue === 0) return '#e5e7eb';
  const normalized = Math.min(value / maxValue, 1);
  if (mode === 'benefit') {
    return `rgba(14,165,233,${0.2 + normalized * 0.8})`;
  }
  if (mode === 'risk') {
    return `rgba(248,113,113,${0.2 + normalized * 0.8})`;
  }
  return `rgba(168,85,247,${0.2 + normalized * 0.8})`;
};

const SurfaceCell = ({ score }) => {
  const capped = Math.max(Math.min(score, 5), -5);
  const hue = capped >= 0 ? 190 : 0;
  const intensity = Math.min(Math.abs(capped) / 5, 1);
  const alpha = 0.2 + intensity * 0.6;
  const color = `hsla(${hue}, 80%, 60%, ${alpha})`;

  return (
    <div
      className="w-5 h-5 md:w-6 md:h-6"
      style={{ backgroundColor: color, border: '1px solid rgba(255,255,255,0.05)' }}
      title={`${score.toFixed(1)} net`}
    />
  );
};

const InteractionHeatmap = ({ userProfile, onPrefillStack }) => {
  const pairIds = Object.keys(interactionPairs);
  const [selectedPairId, setSelectedPairId] = useState(pairIds[0]);
  const [heatmapMode, setHeatmapMode] = useState('benefit');
  const [sensitivities, setSensitivities] = useState(() => ({ ...defaultSensitivities }));
  const [evidenceBlend, setEvidenceBlend] = useState(0.35);
  const [goalPreset, setGoalPreset] = useState('lean_mass');
  const pairDetailRef = useRef(null);

  const selectedPair = interactionPairs[selectedPairId];
  const dimensionKeys = useMemo(() => {
    const keys = new Set();
    Object.keys(selectedPair?.synergy || {}).forEach(k => keys.add(k));
    Object.keys(selectedPair?.penalties || {}).forEach(k => keys.add(k));
    return Array.from(keys);
  }, [selectedPair]);

  const [selectedDimension, setSelectedDimension] = useState(selectedPair?.defaultDimension || dimensionKeys[0] || null);
  const [primaryCompound, setPrimaryCompound] = useState(selectedPair?.compounds[0]);
  const [doses, setDoses] = useState(() => ({ ...selectedPair?.defaultDoses }));

  const handlePairChange = (pairId) => {
    setSelectedPairId(pairId);
    const pair = interactionPairs[pairId];
    const keys = new Set();
    Object.keys(pair.synergy || {}).forEach(k => keys.add(k));
    Object.keys(pair.penalties || {}).forEach(k => keys.add(k));
    const nextDimension = pair.defaultDimension || Array.from(keys)[0];
    setSelectedDimension(nextDimension);
    setPrimaryCompound(pair.compounds[0]);
    setDoses({ ...pair.defaultDoses });
  };

  useEffect(() => {
    if (!selectedPair) return;
    if (!selectedDimension || !dimensionKeys.includes(selectedDimension)) {
      setSelectedDimension(selectedPair.defaultDimension || dimensionKeys[0] || null);
    }
  }, [selectedPair, dimensionKeys, selectedDimension]);

  const dimensionResult = useMemo(() => {
    if (!selectedPair || !selectedDimension) return null;
    return evaluatePairDimension({
      pairId: selectedPairId,
      dimensionKey: selectedDimension,
      doses,
      profile: userProfile,
      sensitivities,
      evidenceBlend
    });
  }, [selectedPairId, selectedDimension, doses, userProfile, sensitivities, evidenceBlend, selectedPair]);

  const chartData = useMemo(() => {
    if (!selectedPair || !selectedDimension) return [];
    return generatePrimaryCurveSeries({
      pairId: selectedPairId,
      dimensionKey: selectedDimension,
      primaryCompound,
      doses,
      profile: userProfile,
      sensitivities,
      evidenceBlend
    });
  }, [selectedPairId, selectedDimension, primaryCompound, doses, userProfile, sensitivities, evidenceBlend, selectedPair]);

  const surfaceData = useMemo(() => {
    if (!selectedPair) return [];
    return buildSurfaceData({
      pairId: selectedPairId,
      profile: userProfile,
      sensitivities,
      evidenceBlend,
      presetKey: goalPreset
    });
  }, [selectedPairId, userProfile, sensitivities, evidenceBlend, goalPreset, selectedPair]);

  const surfaceRows = useMemo(() => {
    if (!selectedPair) return [];
    const [compoundA, compoundB] = selectedPair.compounds;
    const grouped = surfaceData.reduce((acc, point) => {
      const key = point[compoundB];
      if (!acc[key]) acc[key] = [];
      acc[key].push(point);
      return acc;
    }, {});
    return Object.keys(grouped)
      .sort((a, b) => Number(b) - Number(a))
      .map(rowKey => grouped[rowKey].sort((a, b) => a[compoundA] - b[compoundA]));
  }, [surfaceData, selectedPair]);

  const heatmapValues = useMemo(() => {
    const values = {};
    pairIds.forEach(id => {
      values[id] = computeHeatmapValue({
        pairId: id,
        mode: heatmapMode,
        profile: userProfile,
        sensitivities,
        evidenceBlend
      });
    });
    return values;
  }, [pairIds, heatmapMode, userProfile, sensitivities, evidenceBlend]);

  const maxHeatmapValue = Math.max(...Object.values(heatmapValues));

  const updateDose = (compoundKey, value) => {
    setDoses(prev => ({
      ...prev,
      [compoundKey]: Number(value)
    }));
  };

  const updateSensitivity = (key, value) => {
    setSensitivities(prev => ({
      ...prev,
      [key]: Number(value)
    }));
  };

  const selectedSurfacePair = interactionPairs[selectedPairId];
  const [compoundAKey, compoundBKey] = selectedPair?.compounds || [];
  const secondarySummary = selectedPair
    ? selectedPair.compounds
        .filter(c => c !== primaryCompound)
        .map(c => `${compoundData[c]?.abbreviation || c} fixed @ ${doses?.[c] ?? selectedPair.defaultDoses?.[c] ?? 0}mg`)
        .join(', ')
    : '';

  const recommendations = useMemo(() => {
    if (!selectedPair) return [];
    const seen = new Set();
    const sorted = [...surfaceData].sort((a, b) => b.score - a.score);
    const top = [];
    for (const point of sorted) {
      const key = `${point[compoundAKey]}-${point[compoundBKey]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      top.push(point);
      if (top.length >= 4) break;
    }
    return top;
  }, [surfaceData, selectedPair, compoundAKey, compoundBKey]);

  const handleSendCurrentToStack = () => {
    if (!selectedPair || !onPrefillStack) return;
    const payload = selectedPair.compounds.map(key => ({
      compound: key,
      dose: doses?.[key] ?? selectedPair.defaultDoses?.[key] ?? 0
    }));
    onPrefillStack(payload);
  };

  const handleSendRecommendation = (point) => {
    if (!selectedPair || !onPrefillStack) return;
    const payload = selectedPair.compounds.map(key => ({
      compound: key,
      dose: point[key]
    }));
    onPrefillStack(payload);
  };

  const tooltipFormatter = (value, name) => {
    if (name === 'Interaction Total') return [`${value.toFixed(2)}`, 'With Interaction'];
    if (name === 'Naïve Sum') return [`${value.toFixed(2)}`, 'Without Interaction'];
    return [`${value.toFixed(2)}`, name];
  };

  const stackResults = useMemo(() => {
    return generateStackOptimizerResults({
      profile: userProfile,
      goalOverride: goalPreset
    });
  }, [userProfile, goalPreset]);

  return (
    <div className="space-y-8">
      {/* Heatmap / Overview */}
      <section className="bg-physio-bg-secondary border border-physio-bg-border rounded-2xl p-6 shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-physio-text-primary">Interaction Matrix</h2>
            <p className="text-sm text-physio-text-secondary">
              Click a cell to load dose-aware synergy modeling for that pair.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {interactionHeatmapModes.map(mode => (
              <button
                key={mode.key}
                onClick={() => setHeatmapMode(mode.key)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                  heatmapMode === mode.key
                    ? 'border-physio-accent-cyan text-physio-accent-cyan'
                    : 'border-physio-bg-border text-physio-text-tertiary hover:text-physio-text-primary'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid gap-0" style={{ gridTemplateColumns: `140px repeat(${uniqueCompounds.length}, 100px)` }}>
              <div className="h-14"></div>
              {uniqueCompounds.map(key => (
                <div
                  key={key}
                  className="h-14 flex items-center justify-center text-sm font-semibold border border-physio-bg-border bg-physio-bg-core"
                  style={{ color: compoundData[key]?.color || '#fff' }}
                >
                  {compoundData[key]?.abbreviation || key}
                </div>
              ))}

              {uniqueCompounds.map(row => (
                <React.Fragment key={row}>
                  <div
                    className="h-14 flex items-center justify-center text-sm font-semibold border border-physio-bg-border bg-physio-bg-core"
                    style={{ color: compoundData[row]?.color || '#fff' }}
                  >
                    {compoundData[row]?.abbreviation || row}
                  </div>
                  {uniqueCompounds.map(col => {
                    const pair = Object.values(interactionPairs).find(p =>
                      (p.compounds[0] === row && p.compounds[1] === col) ||
                      (p.compounds[0] === col && p.compounds[1] === row)
                    );
                    if (!pair) {
                      return (
                        <div key={`${row}-${col}`} className="h-14 border border-physio-bg-border bg-physio-bg-secondary flex items-center justify-center text-xs text-physio-text-tertiary">
                          —
                        </div>
                      );
                    }
                    const value = heatmapValues[pair.id] || 0;
                    const color = heatmapColorScale(value, maxHeatmapValue, heatmapMode);
                    const isSelected = pair.id === selectedPairId;
                    return (
                      <button
                        key={`${row}-${col}`}
                        onClick={() => handlePairChange(pair.id)}
                        className={`h-14 border border-physio-bg-border flex items-center justify-center text-sm font-semibold transition ${
                          isSelected ? 'ring-2 ring-physio-accent-cyan ring-inset' : ''
                        }`}
                        style={{ backgroundColor: color, color: '#0F172A' }}
                        title={pair.label}
                      >
                        {value.toFixed(2)}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div ref={pairDetailRef} className="space-y-8">
      {/* Pair Detail */}
      <section className="bg-physio-bg-secondary border border-physio-bg-border rounded-2xl p-6 shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-physio-text-primary">{selectedPair?.label}</h2>
            <p className="text-sm text-physio-text-secondary">{selectedPair?.summary}</p>
            <p className="text-xs text-physio-text-tertiary mt-1">
              Interaction model v0.3 • Evidence blend auto-updates (clinical vs anecdote weighting).
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs items-center">
            <div className="px-3 py-1 rounded-lg bg-physio-bg-core border border-physio-bg-border text-physio-text-secondary">
              Evidence mix: clinical {(1 - evidenceBlend) * 100 >> 0}% · anecdote {(evidenceBlend) * 100 >> 0}%
            </div>
            <div className="px-3 py-1 rounded-lg bg-physio-bg-core border border-physio-bg-border text-physio-text-secondary">
              Goal preset: {goalPresets[goalPreset]?.label}
            </div>
            <button
              onClick={handleSendCurrentToStack}
              className="px-3 py-1.5 rounded-lg border border-physio-accent-cyan text-physio-accent-cyan font-semibold hover:bg-physio-accent-cyan/10 transition"
            >
              Send to Stack Builder
            </button>
            <PDFExport chartRef={pairDetailRef} filename="interaction-report.pdf" />
          </div>
        </div>

        {/* Dimension selector */}
        <div className="flex flex-wrap gap-2">
          {dimensionKeys.map(key => {
            const dim = interactionDimensions[key];
            return (
              <button
                key={key}
                onClick={() => setSelectedDimension(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  selectedDimension === key
                    ? 'border-physio-accent-cyan text-physio-accent-cyan'
                    : 'border-physio-bg-border text-physio-text-tertiary hover:text-physio-text-primary'
                }`}
              >
                {dim?.label || key}
              </button>
            );
          })}
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedPair?.compounds.map(compoundKey => {
            const [min, max] = selectedPair?.doseRanges?.[compoundKey] || [0, 1000];
            const doseValue = doses?.[compoundKey] ?? selectedPair?.defaultDoses?.[compoundKey] ?? 0;
            return (
              <label key={compoundKey} className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-physio-text-primary">{compoundData[compoundKey]?.name}</span>
                  <button
                    onClick={() => setPrimaryCompound(compoundKey)}
                    className={`text-xs px-2 py-0.5 rounded border ${
                      primaryCompound === compoundKey ? 'border-physio-accent-cyan text-physio-accent-cyan' : 'border-physio-bg-border text-physio-text-tertiary'
                    }`}
                  >
                    {primaryCompound === compoundKey ? 'Primary Axis' : 'Set Primary'}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step="10"
                    value={doseValue}
                    onChange={e => updateDose(compoundKey, e.target.value)}
                    className="flex-1"
                  />
                  <div className="text-right">
                    <div className="text-physio-text-primary font-semibold">{doseValue} mg</div>
                    <div className="text-xs text-physio-text-tertiary">Range {min}-{max} mg</div>
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        {/* Metrics */}
        {dimensionResult && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4">
              <div className="text-xs text-physio-text-tertiary">Naïve sum</div>
              <div className="text-2xl font-bold text-physio-text-primary">{dimensionResult.naive.toFixed(2)}</div>
              <p className="text-xs text-physio-text-secondary mt-1">Base contributions without interaction.</p>
            </div>
            <div className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4">
              <div className="text-xs text-physio-text-tertiary">Interaction delta</div>
              <div className={`text-2xl font-bold ${dimensionResult.delta >= 0 ? 'text-physio-accent-mint' : 'text-physio-error'}`}>
                {dimensionResult.delta >= 0 ? '+' : ''}
                {dimensionResult.delta.toFixed(2)}
              </div>
              <p className="text-xs text-physio-text-secondary mt-1">Correction applied via synergy/penalty layer.</p>
            </div>
            <div className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4">
              <div className="text-xs text-physio-text-tertiary">Total modeled</div>
              <div className="text-2xl font-bold text-physio-accent-cyan">{dimensionResult.total.toFixed(2)}</div>
              <p className="text-xs text-physio-text-secondary mt-1">Final value for {interactionDimensions[selectedDimension]?.label}.</p>
            </div>
            <div className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4">
              <div className="text-xs text-physio-text-tertiary">Shape saturation</div>
              <div className="text-2xl font-bold text-physio-text-primary">
                {(dimensionResult.doseShape * 100).toFixed(0)}%
              </div>
              <p className="text-xs text-physio-text-secondary mt-1">How deep into the interaction well you are.</p>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-physio-text-primary">Primary Dose Sweep</h3>
              <p className="text-xs text-physio-text-tertiary">
                Sweeping {compoundData[primaryCompound]?.abbreviation} while {secondarySummary}
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--physio-bg-border)" />
              <XAxis
                dataKey="dose"
                label={{ value: `${compoundData[primaryCompound]?.abbreviation} dose`, position: 'insideBottom', offset: -10 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 6]} />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Line type="monotone" dataKey="basePrimary" name={`${compoundData[primaryCompound]?.abbreviation} alone`} stroke="#38bdf8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="naive" name="Naïve Sum" stroke="#a5b4fc" strokeDasharray="4 4" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="total" name="Interaction Total" stroke="#34d399" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Surface */}
        <div className="bg-physio-bg-core border border-physio-bg-border rounded-lg p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-physio-text-primary">Dose Surface — Net Score</h3>
              <p className="text-xs text-physio-text-tertiary">
                Colored by benefit − risk using the {goalPresets[goalPreset]?.label}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(goalPresets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => setGoalPreset(key)}
                  className={`px-3 py-1 rounded-lg border ${
                    goalPreset === key ? 'border-physio-accent-cyan text-physio-accent-cyan' : 'border-physio-bg-border text-physio-text-tertiary'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="inline-flex flex-col gap-1">
              {selectedSurfacePair &&
                surfaceRows.map((row, idx) => (
                  <div key={idx} className="flex gap-1">
                    {row.map((point, cellIdx) => (
                      <SurfaceCell key={cellIdx} score={point.score} />
                    ))}
                  </div>
                ))}
            </div>
          </div>
          {recommendations.length > 0 && (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {recommendations.map((point, idx) => {
                const benefit = point.benefit;
                const risk = point.risk;
                const ratio = risk > 0 ? (benefit / risk).toFixed(2) : '—';
                return (
                  <div key={idx} className="border border-physio-bg-border rounded-lg p-4 bg-physio-bg-secondary flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm text-physio-text-tertiary">
                      <span>Recommendation #{idx + 1}</span>
                      <span className={`font-semibold ${point.score >= 0 ? 'text-physio-accent-cyan' : 'text-physio-error'}`}>
                        Net {point.score.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-physio-text-primary">
                      {compoundData[compoundAKey]?.abbreviation || compoundAKey}: <strong>{point[compoundAKey]} mg</strong> •{' '}
                      {compoundData[compoundBKey]?.abbreviation || compoundBKey}: <strong>{point[compoundBKey]} mg</strong>
                    </div>
                    <div className="text-xs text-physio-text-secondary flex gap-4">
                      <span>Benefit {benefit.toFixed(2)}</span>
                      <span>Risk {risk.toFixed(2)}</span>
                      <span>Ratio {ratio}</span>
                    </div>
                    <button
                      onClick={() => handleSendRecommendation(point)}
                      className="mt-2 px-3 py-1.5 rounded-lg border border-physio-accent-cyan text-physio-accent-cyan text-xs font-semibold hover:bg-physio-accent-cyan/10"
                    >
                      Load in Stack Builder
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Multi-Compound Optimizer */}
      <section className="bg-physio-bg-secondary border border-physio-bg-border rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-physio-text-primary">Multi-Compound Optimizer</h3>
            <p className="text-sm text-physio-text-secondary">
              Sampling predefined three-compound templates using your personalization + synergy model.
            </p>
          </div>
          <div className="text-xs text-physio-text-tertiary">
            Presets: {stackOptimizerCombos.map(combo => combo.label).join(' • ')}
          </div>
        </div>

        {stackResults.length === 0 ? (
          <p className="text-sm text-physio-text-tertiary">No stack data available.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {stackResults.map(result => (
              <article key={`${result.comboId}-${Object.values(result.doses).join('-')}`} className="border border-physio-bg-border rounded-xl p-4 bg-physio-bg-core flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm text-physio-text-tertiary">
                  <span>{stackOptimizerCombos.find(combo => combo.id === result.comboId)?.label || result.label}</span>
                  <span className={`font-semibold ${result.score >= 0 ? 'text-physio-accent-cyan' : 'text-physio-error'}`}>
                    Net {result.score.toFixed(2)}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-physio-text-primary">
                  {result.compounds.map(compoundKey => (
                    <div key={compoundKey}>
                      {compoundData[compoundKey]?.abbreviation || compoundKey}: <strong>{result.doses[compoundKey]} mg</strong>
                      <span className="text-xs text-physio-text-tertiary"> {compoundData[compoundKey]?.type === 'oral' ? 'per day' : 'per week'}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-physio-text-secondary">
                  <span>Benefit {result.adjustedBenefit.toFixed(2)}</span>
                  <span>Risk {result.adjustedRisk.toFixed(2)}</span>
                  <span>Ratio {result.ratio.toFixed(2)}</span>
                </div>
                <div className="text-xs text-physio-text-tertiary">
                  Synergy: {((result.synergy?.benefitSynergy || 0) * 100).toFixed(1)}% benefit · {((result.synergy?.riskSynergy || 0) * 100).toFixed(1)}% risk
                </div>
                <button
                  onClick={() =>
                    onPrefillStack?.(
                      result.compounds.map(compoundKey => ({
                        compound: compoundKey,
                        dose: result.doses[compoundKey]
                      }))
                    )
                  }
                  className="mt-2 px-3 py-1.5 rounded-lg border border-physio-accent-cyan text-physio-accent-cyan text-xs font-semibold hover:bg-physio-accent-cyan/10"
                >
                  Load in Stack Builder
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
      </div>

      {/* Controls */}
      <section className="bg-physio-bg-secondary border border-physio-bg-border rounded-2xl p-6 shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-physio-text-primary">Interaction Penalty Modifiers</h3>
            <p className="text-sm text-physio-text-secondary">Tune sensitivities so the model respects your physiology.</p>
          </div>
          <div className="text-xs text-physio-text-tertiary">
            Evidence blending slider leans toward clinical (left) or anecdote (right).
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'estrogen', label: 'Estrogen Sensitivity', helper: 'Higher = gyno/bloat prone. Amplifies estrogenic penalties.' },
            { key: 'water', label: 'Water Retention Sensitivity', helper: 'Impacts bloat + cosmetic softness penalties.' },
            { key: 'neuro', label: 'Neuro Sensitivity', helper: 'If Tren/Halo wreck your sleep, slide right.' },
            { key: 'cardio', label: 'Cardio / BP Sensitivity', helper: 'Impacts BP + hematocrit penalties.' }
          ].map(field => (
            <label key={field.key} className="border border-physio-bg-border rounded-lg p-4 bg-physio-bg-core text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-physio-text-primary">{field.label}</span>
                <span className="text-xs text-physio-accent-cyan">{sensitivities[field.key].toFixed(2)}×</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={sensitivities[field.key]}
                onChange={e => updateSensitivity(field.key, e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-physio-text-tertiary">{field.helper}</p>
            </label>
          ))}
        </div>

        <div className="border border-physio-bg-border rounded-lg p-4 bg-physio-bg-core">
          <label className="text-sm font-semibold text-physio-text-primary flex items-center justify-between">
            Evidence weighting
            <span className="text-xs text-physio-text-tertiary">
              Clinical {(1 - evidenceBlend) * 100 >> 0}% / Anecdote {(evidenceBlend) * 100 >> 0}%
            </span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={evidenceBlend}
            onChange={e => setEvidenceBlend(Number(e.target.value))}
            className="w-full mt-3"
          />
          <div className="flex justify-between text-xs text-physio-text-tertiary mt-2">
            <span>Clinical bias</span>
            <span>Anecdote / bro science bias</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InteractionHeatmap;
