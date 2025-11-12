# AAS Dose-Response Visualization Tool: Complete Implementation Spec
## For LLM Development (Claude Code, etc.)

**Version:** 2.0  
**Status:** Ready for Development  
**Target Output:** React component with D3.js/Recharts, full interactivity, export functionality

---

## 1. OVERVIEW

### What to Build
Single integrated interactive tool showing:
- **Benefit curves** (solid lines) — anabolic/mass/strength gains
- **Risk curves** (dotted lines) — side burden (lipids, cardio, psych, organ stress)
- **Both on same chart** with dual-axis or side-by-side toggle
- **Per-compound methodology cards** (expandable, evidence-tiered)
- **Uncertainty bands** (width = confidence level)
- **Export to PDF** with full methodology

### Core Philosophy
- **Transparency over false precision** — flag where data exists vs. modeled
- **Evidence hierarchy visible** — Tier 1/2/3/4 tagged on every curve point
- **Uncertainty quantified** — bands show ±margins; tooltips explain sources
- **No overclaiming** — "modeled based on patterns" not "proven"

---

## 2. DATA SPECIFICATION: RISK CURVES

### Risk Curve Definition
Risk at dose X = Weighted aggregate of component risks:

```
Risk(X) = 0.3 × Risk_lipid(X) 
        + 0.3 × Risk_cardio(X) 
        + 0.2 × Risk_psych(X) 
        + 0.1 × Risk_hepatic(X) 
        + 0.1 × Risk_suppression(X)
```

**Scale:** 0-5.5 (normalized to match benefit scale for visual comparison)

### Per-Compound Risk Data

#### Testosterone Risk
**Tiers:** Tier 1 (0-600mg), Tier 3 (600-1200mg)

**Component Breakdown:**
- **Lipid Risk (0-600mg):** Bhasin data; HDL decline ~1.5 mmol/L per 100mg
  - Risk_lipid(dose) = (dose / 100) × 0.25, capped at 2.5 by 600mg
  - Confidence: High (measured data)
- **Lipid Risk (600-1200mg):** Extrapolated linear (assumption: continues)
  - Risk_lipid(dose) = 2.5 + ((dose - 600) / 600) × 0.5
  - Confidence: Low (no human data >600mg)
- **Cardio Risk (0-600mg):** Clinical inference; mild LVH signs
  - Risk_cardio(dose) = (dose / 600) × 1.5
  - Confidence: Medium (sparse echo data)
- **Cardio Risk (600-1200mg):** Assumed logistic acceleration
  - Risk_cardio(dose) = 1.5 + logistic_rise((dose - 600), midpoint=900, steepness=0.01)
  - Confidence: Low (modeled)
- **Hepatic Risk:** Assumed minimal; linear rise
  - Risk_hepatic(dose) = (dose / 1200) × 0.8
  - Confidence: Very low (almost no data at supraphysio)
- **Suppression Risk:** HPTA suppression dose-dependent
  - Risk_suppression(dose) = (dose / 600) × 1.2, capped at 1.2
  - Confidence: Medium (clinical TRT analogs)

**Composite Risk (Test) by Dose:**
| Dose | Risk | Tier | Notes |
|------|------|------|-------|
| 0 | 0.0 | Tier 0 | Baseline |
| 100 | 0.2 | Tier 1 | Measured (lipids only) |
| 300 | 0.9 | Tier 1 | Bhasin data |
| 600 | 2.1 | Tier 1 | Bhasin; visible HDL decline, mild LVH |
| 800 | 3.2 | Tier 3 | Extrapolated; cardio accelerating |
| 1000 | 4.0 | Tier 3 | High risk; severe lipid + cardio stress |
| 1200 | 4.5 | Tier 3 | Modeled peak risk; hepatic + cardio |

**Uncertainty Bands:**
- 0-600mg: ±0.2 (tight; empirical)
- 600-1200mg: ±0.5 (wide; modeled)

---

#### NPP (Nandrolone Phenylpropionate) Risk
**Tiers:** Tier 2 (0-300mg), Tier 3 (300-600mg), Tier 4 (600+)

**Component Breakdown:**
- **Lipid Risk:** Similar to Test but slightly milder (lower androgenicity)
  - Risk_lipid(dose) = (dose / 100) × 0.2, capped at 1.2
  - Confidence: Medium (clinical Deca data extrapolated)
- **Prolactin Risk:** Steep rise; highly variable individually
  - Risk_prolactin(dose) = logistic_rise(dose, midpoint=250mg, steepness=0.015)
  - Formula: ~1.0 at 200mg, ~2.0 at 350mg, ~2.8 at 600mg+
  - Confidence: Low-Medium (forum reports; no quantified human dose-response)
- **Suppression Risk:** More severe than Test (progesterone effects)
  - Risk_suppression(dose) = (dose / 500) × 1.5, capped at 1.5
  - Confidence: Medium (clinical analogs)
- **Hepatic:** Minimal
  - Risk_hepatic(dose) = (dose / 1200) × 0.4
- **Cardio:** Mild
  - Risk_cardio(dose) = (dose / 1000) × 0.6

**Composite Risk (NPP) by Dose:**
| Dose | Risk | Tier | Notes |
|------|------|------|-------|
| 0 | 0.0 | Tier 0 | Baseline |
| 100 | 0.3 | Tier 2 | Mild; therapeutic range |
| 200 | 0.8 | Tier 2 | Prolactin emerging |
| 300 | 1.5 | Tier 2/3 | "Deca dick" threshold reports |
| 400 | 2.2 | Tier 3 | Significant prolactin + lipid |
| 600 | 3.0 | Tier 4 | High risk; prolactin dominates |

**Uncertainty Bands:**
- 0-300mg: ±0.25 (prolactin highly individual)
- 300-600mg: ±0.5 (anecdotal; high variance)

---

#### Trenbolone (Tren) Risk
**Tiers:** Tier 3 (0-400mg), Tier 4 (400+)

**Component Breakdown:**
- **Lipid Risk:** Severe; most potent compound
  - Risk_lipid(dose) = (dose / 100) × 0.35, no cap (continues rising)
  - Formula: ~1.4 at 100mg, ~3.5 at 300mg, ~5.0+ at 500mg
  - Confidence: Low (no human data; inferred from androgenicity)
- **Cardio Risk:** Assumed severe due to high potency + lipid + aromatization profile
  - Risk_cardio(dose) = logistic_rise(dose, midpoint=200mg, steepness=0.02)
  - Formula: ~0.8 at 100mg, ~2.0 at 200mg, ~3.5 at 400mg
  - Confidence: Very Low (no human studies; theory-based)
- **Psych/Neuro Risk:** Aggression, paranoia, insomnia (unique to Tren)
  - Risk_psych(dose) = logistic_rise(dose, midpoint=250mg, steepness=0.018)
  - Formula: ~0.3 at 100mg, ~1.5 at 250mg, ~3.0 at 400mg+
  - Confidence: Very Low (self-reported forum data; high bias)
- **Hepatic:** Minimal (not 17-alpha-alkylated)
  - Risk_hepatic(dose) = (dose / 1200) × 0.3
- **Suppression:** Severe
  - Risk_suppression(dose) = (dose / 400) × 2.0, capped at 2.0

**Composite Risk (Tren) by Dose:**
| Dose | Risk | Tier | Notes |
|------|------|------|-------|
| 0 | 0.0 | Tier 0 | Baseline |
| 100 | 0.8 | Tier 3 | Mild; animal HED-scaled |
| 200 | 2.0 | Tier 3 | Aggression/mood emerging |
| 300 | 3.2 | Tier 4 | Significant psych + lipid risk |
| 400 | 4.2 | Tier 4 | High risk; sides accelerate |
| 500 | 4.8 | Tier 4 | Very high risk; "not worth it" |
| 600+ | 5.0+ | Tier 4 | **CRITICAL RISK ZONE** |

**Uncertainty Bands:**
- 0-400mg: ±0.6 (no human data; highly modeled)
- 400+: ±0.8 (almost entirely speculative; extrapolated from patterns)

---

#### EQ (Equipoise/Boldenone) Risk
**Tiers:** Tier 2 (0-600mg), Tier 4 (600+)

**Component Breakdown:**
- **Lipid Risk:** Mild (weak androgenic)
  - Risk_lipid(dose) = (dose / 200) × 0.15, capped at 0.75
- **Anxiety/Neuro Risk:** Unique to EQ; mechanism unclear
  - Risk_psych(dose) = logistic_rise(dose, midpoint=600mg, steepness=0.008)
  - Formula: ~0.2 at 300mg, ~0.6 at 600mg, ~1.0 at 800mg
  - Confidence: Very Low (anecdotal; unclear if dose-dependent or individual)
- **Cardio:** Minimal
  - Risk_cardio(dose) = (dose / 1200) × 0.4
- **Suppression:** Moderate
  - Risk_suppression(dose) = (dose / 800) × 1.0, capped at 1.0

**Composite Risk (EQ) by Dose:**
| Dose | Risk | Tier | Notes |
|------|------|------|-------|
| 0 | 0.0 | Tier 0 | Baseline |
| 200 | 0.3 | Tier 2 | Very mild |
| 400 | 0.6 | Tier 2 | Emerging anxiety in some |
| 600 | 1.0 | Tier 2/4 | Plateau; anxiety inconsistent |
| 800 | 1.3 | Tier 4 | Anecdotal; high variance |

**Uncertainty Bands:**
- 0-600mg: ±0.3 (sparse data)
- 600+: ±0.6 (anxiety mechanism unknown; treat as speculative)

---

#### Masteron (Drostanolone) Risk
**Tiers:** Tier 4 (entirely)

**Component Breakdown:**
- **Androgenic Risk:** High potency but low dose typical (cosmetic compound)
  - Risk_androgenic(dose) = (dose / 200) × 0.4
- **Prostate Risk:** Theoretical; not measured
  - Risk_prostate(dose) = (dose / 600) × 0.5
- **Lipid:** Moderate
  - Risk_lipid(dose) = (dose / 300) × 0.2, capped at 0.6
- Other components: Minimal

**Composite Risk (Masteron) by Dose:**
| Dose | Risk | Tier | Notes |
|------|------|------|-------|
| 0 | 0.0 | Tier 0 | Baseline |
| 200 | 0.4 | Tier 4 | Cosmetic dose; anecdotal |
| 400 | 0.8 | Tier 4 | Weak compound; low absolute risk |
| 600 | 1.1 | Tier 4 | Prostate risk theoretical |

**Uncertainty Bands:**
- All: ±0.5 (no human data; entirely speculative)

---

#### Primobolan (Methenolone) Risk
**Tiers:** Tier 2 (0-200mg), Tier 4 (200+)

**Component Breakdown:**
- **Hepatic Risk (17-alpha-alkylated oral form):** If oral; minimal if injectable
  - Risk_hepatic(dose) = (dose / 500) × 0.6 [oral]; 0.2 [injectable, assumed]
- **Lipid Risk:** Very mild
  - Risk_lipid(dose) = (dose / 400) × 0.15, capped at 0.45
- **Androgenic:** Low
  - Risk_androgenic(dose) = (dose / 1000) × 0.2

**Composite Risk (Primobolan) by Dose:**
| Dose | Risk | Tier | Notes |
|------|------|------|-------|
| 0 | 0.0 | Tier 0 | Baseline |
| 100 | 0.2 | Tier 2 | Therapeutic; minimal risk |
| 200 | 0.4 | Tier 2/4 | Anecdotal weak compound |
| 400 | 0.6 | Tier 4 | High cost; rare to use this high |
| 600 | 0.8 | Tier 4 | Speculative |

**Uncertainty Bands:**
- 0-200mg: ±0.15 (therapeutic data)
- 200+: ±0.5 (weak data; extrapolated)

---

## 3. UX SPECIFICATION

### Layout: Dual-View Toggle
```
┌─────────────────────────────────────────────────────────┐
│ [Benefit View] [Risk View] [Integrated View]           │
└─────────────────────────────────────────────────────────┘
│                                                         │
│  Chart (benefit curves, or risk curves, or both)       │
│  - X-axis: Weekly Dose (mg)                            │
│  - Y-axis: Score (0-5.5)                               │
│  - Solid lines: Benefit / Risk                          │
│  - Uncertainty bands: Shaded regions                    │
│  - Legend: Toggle per compound                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
[Hover tooltip: Tier, Source, Caveat, CI]
[Scroll/Zoom: Enabled]
[Drag/Pan: Enabled]
[Legend: Click to toggle compound visibility]
```

**Three View Modes:**

### View 1: Benefit Only
- Shows solid lines (benefit curves)
- No risk curves
- Focus: Understanding anabolic plateau points

### View 2: Risk Only
- Shows dotted lines (risk curves)
- No benefit curves
- Focus: Understanding risk escalation

### View 3: Integrated (Default)
- Shows both benefit (solid) + risk (dotted) for each compound
- Same color; different line styles
- Allows visual comparison: "benefit plateaus at 300mg, risk keeps climbing at 400mg"

---

### Interactive Methodology Card (Expandable)
Clicking a compound name or chart legend opens:

```
╔═══════════════════════════════════════════════════╗
║ TESTOSTERONE - Methodology Breakdown              ║
╠═══════════════════════════════════════════════════╣
║ Evidence Hierarchy:                               ║
║  • 0-600mg: Tier 1 (Bhasin et al., n=43)        ║
║  • 600-1200mg: Tier 3 (Extrapolated)            ║
║                                                   ║
║ Benefit Curve:                                    ║
║  - Linear 0-600mg; plateau 600+ (receptor sat.)  ║
║  - Sources: Bhasin 1996/2001, Forbes 1985       ║
║  - Confidence: 85-90%                            ║
║  - Key Limitation: No human data >600mg          ║
║                                                   ║
║ Risk Curve (Lipid + Cardio + Hepatic):          ║
║  - Lipid: Bhasin data (HDL ↓1.5 per 100mg)     ║
║  - Cardio: Clinical inference; LVH risk assumed ║
║  - Hepatic: Minimal; linear extrapolation       ║
║  - Confidence: 60-70% (cardio/hepatic modeled) ║
║  - Key Limitation: No >600mg cardio data        ║
║                                                   ║
║ Individual Variance:                             ║
║  - AR CAG repeats: ±15-20% responder variance   ║
║  - Aromatization: CYP19A1 polymorphisms         ║
║  - Training genetics: ±20-30% unmeasured        ║
║                                                   ║
║ Assumptions:                                      ║
║  ✓ Age 25-40, male, no pre-existing HTN/dyslip ║
║  ✓ Proper AI use (not modeled separately)       ║
║  ✓ Training/diet adequate (not limiting)        ║
║  ✓ 12-16 week cycles; PCT protocol followed    ║
║                                                   ║
║ [PDF Export] [Close]                            ║
╚═══════════════════════════════════════════════════╝
```

### Tooltip on Hover
```
Compound: Testosterone
Dose: 600 mg/week

BENEFIT:
★ Score: 5.0
Tier: Tier 1 (Measured)
Source: Bhasin et al. (1996, 2001) — RCT, n=43, 6mo
Caveat: Direct data; linear gains observed
Confidence Interval: ±0.15 (High)

RISK:
★ Score: 2.1
Tier: Tier 1 (Lipid measured) + Tier 3 (Cardio extrapolated)
Source: Bhasin (lipids); Clinical inference (LVH)
Caveat: Lipid decline empirical; cardio modeled
Confidence Interval: ±0.35 (Medium)

Individual Variance: ±20-30% typical
```

---

### Export to PDF
**Button Location:** Top-right of chart

**PDF Contents:**
1. Chart (high-res PNG/SVG)
2. Disclaimer
3. Data table (benefit + risk by dose for each compound)
4. Per-compound methodology (Tier breakdown, sources, limitations)
5. Evidence hierarchy legend
6. Assumptions & caveats
7. Changelog (version, updates)

**Example PDF Structure:**
```
Page 1: Title + Disclaimer
Page 2: Integrated Benefit/Risk Chart
Page 3: Evidence Hierarchy Legend
Page 4: Testosterone Methodology
Page 5: NPP Methodology
Page 6: Tren Methodology
Page 7: EQ, Masteron, Primobolan Methodology (condensed)
Page 8: Data Table (all compounds, all doses)
Page 9: Assumptions, Individual Variance, Sources
```

---

## 4. IMPLEMENTATION DETAILS

### Tech Stack
- **React** (component structure)
- **Recharts** (charting; simpler than D3.js for this use case)
  - Alternative: **D3.js** if custom interactivity needed
- **jsPDF + html2canvas** (PDF export)
- **TailwindCSS** (styling)

### Data Structure
```javascript
const compoundData = {
  testosterone: {
    name: 'Testosterone',
    color: '#0066CC',
    abbreviation: 'Test',
    benefitCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: null, ci: 0.0 },
      { dose: 100, value: 0.83, tier: 'Tier 1', source: 'Bhasin 1996', ci: 0.15 },
      { dose: 300, value: 2.5, tier: 'Tier 1', source: 'Bhasin 1996', ci: 0.15 },
      { dose: 600, value: 5.0, tier: 'Tier 1', source: 'Bhasin 1996', ci: 0.15 },
      { dose: 900, value: 5.2, tier: 'Tier 3', source: 'Extrapolated (receptor model)', ci: 0.5 },
      { dose: 1200, value: 5.2, tier: 'Tier 3', source: 'Extrapolated (receptor model)', ci: 0.5 },
    ],
    riskCurve: [
      { dose: 0, value: 0.0, tier: 'Tier 0', source: null, ci: 0.0 },
      { dose: 100, value: 0.2, tier: 'Tier 1', source: 'Bhasin lipids', ci: 0.2 },
      { dose: 600, value: 2.1, tier: 'Tier 1', source: 'Bhasin lipids + clinical inference', ci: 0.25 },
      { dose: 1000, value: 4.0, tier: 'Tier 3', source: 'Extrapolated cardio/hepatic', ci: 0.5 },
      { dose: 1200, value: 4.5, tier: 'Tier 3', source: 'Extrapolated cardio/hepatic', ci: 0.5 },
    ],
    uncertaintyBands: {
      benefit: { min: 0, max: 600, band: 0.15, minOffset: 600, maxOffset: 1200, band: 0.5 },
      risk: { min: 0, max: 600, band: 0.25, minOffset: 600, maxOffset: 1200, band: 0.5 },
    },
    methodology: {
      summary: 'Tier 1 (0-600mg, Bhasin et al.); Tier 3 (600-1200mg, extrapolated)',
      benefitRationale: 'Linear dose-response 0-600mg; plateau driven by androgen receptor saturation (~85-90% occupancy)',
      riskRationale: 'Lipid decline empirical (Bhasin); cardio/hepatic modeled from clinical inference',
      sources: ['Bhasin et al. (1996, 2001)', 'Forbes (1985)', 'r/steroids wiki'],
      limitations: ['No human data >600mg', 'Individual aromatization variance ±20%', 'Duration assumed 12-16 weeks'],
      assumptions: ['Age 25-40', 'Proper AI use', 'Training/diet adequate', 'Baseline health'],
      individualVariance: ['AR CAG repeats: ±15-20%', 'CYP19A1: aromatization variance', 'Genetics unknown: ±20-30%'],
    }
  },
  // ... (npp, trenbolone, eq, masteron, primobolan follow same structure)
}
```

### Chart Rendering Logic

**Benefit View:**
```javascript
<LineChart data={benefitData}>
  <XAxis dataKey="dose" label="Weekly Dose (mg)" />
  <YAxis label="Benefit Score (★ 0–5.5)" domain={[0, 5.5]} />
  {compounds.map(compound => (
    <Line 
      key={`${compound}-benefit`}
      dataKey={`${compound}-benefit-value`}
      stroke={compound.color}
      strokeWidth={2}
      dot={{ r: 4 }}
      isAnimationActive={true}
    />
  ))}
  {compounds.map(compound => (
    <>
      <Area 
        key={`${compound}-benefit-upper`}
        dataKey={`${compound}-benefit-upper`}
        fill={compound.color}
        opacity={0.15}
        isAnimationActive={false}
      />
      <Area 
        key={`${compound}-benefit-lower`}
        dataKey={`${compound}-benefit-lower`}
        fill={compound.color}
        opacity={0.15}
        isAnimationActive={false}
      />
    </>
  ))}
  <Tooltip content={<CustomTooltip type="benefit" />} />
  <Legend onClick={handleLegendClick} />
</LineChart>
```

**Integrated View:**
```javascript
// Same chart with both solid (benefit) and dotted (risk) lines
// Benefit: solid line, risk: dotted line (strokeDasharray="5 5")
// Same color, different line style allows visual comparison
```

### Tooltip Component
```javascript
const CustomTooltip = ({ active, payload, type }) => {
  if (!active || !payload) return null;
  
  const data = payload[0].payload;
  const isRisk = type === 'risk' || payload[0].name.includes('Risk');
  const compound = payload[0].name.split(' ')[0];
  const tierData = isRisk 
    ? compoundData[compound].riskCurve
    : compoundData[compound].benefitCurve;
  
  const point = tierData.find(p => p.dose === data.dose);
  
  return (
    <div style={{background: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '4px'}}>
      <p><strong>{compound}</strong></p>
      <p>Dose: {data.dose} mg/week</p>
      <p>Score: ★{point.value.toFixed(1)}</p>
      <p>Tier: {point.tier}</p>
      <p>Source: {point.source}</p>
      <p>Confidence: ±{point.ci.toFixed(2)}</p>
    </div>
  );
};
```

### PDF Export Logic
```javascript
const handlePDFExport = async () => {
  const canvas = await html2canvas(chartRef.current);
  const imgData = canvas.toDataURL('image/png');
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Page 1: Title + Disclaimer
  pdf.setFontSize(16);
  pdf.text('AAS Dose-Response Models: Benefit & Risk', 10, 10);
  pdf.setFontSize(10);
  pdf.text('HARM REDUCTION MODELING, NOT MEDICAL ADVICE', 10, 20);
  // ... add disclaimer text
  
  // Page 2: Chart
  pdf.addPage();
  pdf.addImage(imgData, 'PNG', 10, 10, 190, 130);
  
  // Page 3+: Methodology (per compound)
  Object.entries(compoundData).forEach(([key, compound]) => {
    pdf.addPage();
    pdf.setFontSize(14);
    pdf.text(`${compound.name} (${compound.abbreviation})`, 10, 10);
    pdf.setFontSize(10);
    pdf.text(`Evidence Hierarchy: ${compound.methodology.summary}`, 10, 30);
    // ... add methodology details
  });
  
  pdf.save('AAS_DoseResponse_Report.pdf');
};
```

---

## 5. SPECIFIC IMPLEMENTATION CHECKLIST

### Must-Have Features
- [ ] Dual-view toggle (Benefit / Risk / Integrated)
- [ ] All 6 compounds rendered with correct curves + uncertainty bands
- [ ] Hover tooltip showing Tier, Source, CI, caveat
- [ ] Expandable methodology card per compound (triggered by legend click)
- [ ] Disclaimer visible at top
- [ ] PDF export with full methodology
- [ ] Zoom/Pan enabled
- [ ] Legend toggle (show/hide compounds)
- [ ] Responsive design (works on mobile, tablet, desktop)

### Nice-to-Have Features
- [ ] Data table view (show numerical values for each dose)
- [ ] Comparison mode (select 2 compounds; show overlaid)
- [ ] Individual variance slider ("Show my curve if I'm a poor/good responder")
- [ ] Feedback form (submit cycle data for future model refinement)
- [ ] Version history / changelog
- [ ] Print-friendly mode (alternative to PDF)
- [ ] Dark mode toggle

### Performance Considerations
- Chart should render in <1 second
- PDF export should complete in <5 seconds
- Mobile should be responsive (no lag on zoom/pan)
- Use React.memo for expensive components

---

## 6. DATA VALIDATION & TESTING

### Unit Tests to Include
```javascript
// Test: Risk curve components sum correctly
expect(testRiskTotal(dose: 600)).toBe(approximately(2.1, tolerance: 0.05));

// Test: Uncertainty bands are wider for lower tiers
expect(trenBand(dose: 400)).toBeGreaterThan(testBand(dose: 400));

// Test: Benefit curves plateau past threshold (no decline)
expect(trenBenefit(dose: 1000)).toBeLessThanOrEqual(trenBenefit(dose: 600));

// Test: All curves start at 0, 0
compounds.forEach(c => {
  expect(c.benefitCurve[0].value).toBe(0);
  expect(c.riskCurve[0].value).toBe(0);
});
```

### Visual Regression Tests
- Generate baseline PNGs for each view mode
- Compare new renders against baseline
- Flag significant changes (>5% pixel diff)

---

## 7. HANDOFF CHECKLIST

### What You're Providing
- ✓ This spec document (complete)
- ✓ Design doc with evidence hierarchy (AAS_HarmReduction_Design_Doc.md)
- ✓ Benefit curve HTML/React component (reference implementation)
- ✓ Risk curve data (this document, Section 2)
- ✓ Color scheme, typography guidelines
- ✓ UX flow diagrams (Sections 3)
- ✓ Data structures (Section 4)
- ✓ Testing requirements (Section 6)

### What LLM Needs to Build
1. **React component** integrating benefit + risk curves
2. **Interactive methodology cards** (expandable per compound)
3. **PDF export** with full methodology appendix
4. **Dual-view toggle** + legend management
5. **Tooltip system** showing Tier/Source/CI
6. **Responsive design** for desktop/mobile
7. **Unit + visual regression tests**
8. **Deploy-ready** (handles edge cases, loading states, errors)

### Example Prompt for LLM (Claude Code)
```
Here's a complete specification for an AAS dose-response visualization tool.

Key files:
- AAS_HarmReduction_Design_Doc.md (evidence hierarchy, methodology)
- AAS_TOOL_IMPLEMENTATION_SPEC.md (this file; UX, data, implementation)
- [Reference benefit curve HTML] (existing implementation to learn from)

Your task:
1. Build a React component (Recharts) with three view modes: Benefit, Risk, Integrated
2. Include all 6 compounds with benefit/risk curves from the spec
3. Implement uncertainty bands (width = confidence level)
4. Add expandable methodology cards (click legend to open)
5. Implement PDF export with methodology appendix
6. Add hover tooltips showing Tier, Source, Caveat, CI
7. Enable zoom/pan/legend toggle
8. Responsive design (mobile-friendly)
9. Include unit tests for data validation

Data structures and all curve specifications are in Section 2 & 4 of the spec.

Do NOT overclaim precision. Every curve point should be tagged with evidence tier.
Make uncertainty visible through band width.

Start with the data structure, then render the chart, then add interactivity.
```

---

## 8. NOTES FOR LLM DEVELOPER

### Key Principles
1. **Transparency > Precision** — Show uncertainty bands prominently. Wide bands = "we don't know well."
2. **Evidence Tier Visibility** — Every data point should indicate if it's Tier 1 (measured) or Tier 4 (speculative).
3. **No Overclaiming** — Tooltips should say "modeled based on patterns" for Tier 4, not "proven."
4. **Responsive Interactivity** — Hover, zoom, pan should feel smooth; tooltips should load instantly.
5. **PDF as Documentation** — Export should be self-contained; someone reading the PDF understands evidence basis.

### Common Pitfalls to Avoid
- **Don't smooth curves where data gaps exist** — interpolation is okay, but flag it (wider band, lighter color)
- **Don't blend evidence tiers silently** — if a curve switches from Tier 1 to Tier 3, make it visible (band widens)
- **Don't hardcode colors/labels** — use data structure for maintainability
- **Don't assume screen size** — test on mobile, tablet, desktop
- **Don't export PDF without methodology** — make it self-explanatory

### Testing Checklist Before Handoff
- [ ] All 6 compounds render correctly
- [ ] Benefit curves show flattening (no decline) past saturation point
- [ ] Risk curves show expected acceleration for high-risk compounds (Tren)
- [ ] Uncertainty bands proportional to confidence level
- [ ] Hover tooltip shows correct Tier/Source/CI
- [ ] PDF export includes full methodology (>3 pages)
- [ ] Zoom/pan doesn't cause rendering lag
- [ ] Responsive on iPhone SE (375px width), iPad, desktop (1440px+)
- [ ] Legend toggle works; hidden compounds don't appear in tooltip
- [ ] Disclaimer visible without scrolling
- [ ] All links/buttons have working handlers

---

## 9. VERSION CONTROL & FUTURE UPDATES

### When to Update This Spec
- **New human RCT data published** → Update Tier 1 curves immediately, narrow confidence bands
- **Community data contradicts model** → Widen bands, note discrepancy in methodology
- **Mechanism theory updates** → Review and flag in changelog
- **Safety signal emerges** → Escalate risk curve + add alert to disclaimer

### Versioning
- v2.0: Initial integrated release (current)
- v2.1: Expected — TAME trial results (2025-2026)
- v3.0: Planned — if new AAS human RCTs emerge

---

## APPENDIX: Example Data Points (Quick Ref)

### Testosterone
- **Benefit:** 0 → 2.5 (300mg) → 5.0 (600mg) → 5.2 (900mg, plateau)
- **Risk:** 0 → 0.9 (300mg) → 2.1 (600mg) → 4.0 (1000mg)
- **Confidence:** High 0-600mg; Medium 600+

### NPP
- **Benefit:** 0 → 3.0 (300mg, plateau) → 3.25 (600mg, flat)
- **Risk:** 0 → 1.5 (300mg) → 3.0 (600mg, prolactin-driven)
- **Confidence:** Medium throughout (prolactin highly variable)

### Trenbolone
- **Benefit:** 0 → 4.3 (300mg, peak) → 4.87 (600mg, flat plateau ±0.63)
- **Risk:** 0 → 3.2 (300mg) → 4.8 (500mg) → 5.0+ (600mg, very high)
- **Confidence:** Low throughout (no human data)

### EQ
- **Benefit:** 0 → 0.75 (300mg) → 1.5 (600mg) → 3.0 (1200mg, gentle rise)
- **Risk:** 0 → 0.6 (600mg) → 1.3 (1200mg, anxiety unclear)
- **Confidence:** Low-Medium (sparse data, anecdote-heavy)

### Masteron & Primobolan
- **Benefit:** Flat/low throughout (cosmetic, weak compounds)
- **Risk:** Minimal; gradual linear rise
- **Confidence:** Very low (no human data)

---

**Document Version:** 2.0  
**Last Updated:** [Current Date]  
**Status:** Ready for Development  
**Next Review:** When new evidence emerges or TAME trial publishes