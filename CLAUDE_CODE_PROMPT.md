# Claude Code Prompt: AAS Dose-Response Visualization Tool
## Complete Delivery Specification

**Mission:** Build a production-ready React component visualizing AAS dose-response relationships with integrated benefit & risk curves, interactive methodology, uncertainty quantification, and PDF export.

**Target User:** Informed adults seeking harm reduction context.  
**Tech Stack:** React 18+, Recharts, jsPDF, TailwindCSS.  
**Delivery Time Estimate:** 6-8 hours.

---

## CRITICAL STARTING POINT

### You Have Two Reference Documents
1. **DESIGN.md** (`AAS_HarmReduction_Design_Doc.md`)
   - Evidence hierarchy (Tier 1-4)
   - Per-compound methodology
   - Limitations & assumptions
   - What's empirical vs. modeled

2. **IMPLEMENT.md** (`AAS_TOOL_IMPLEMENTATION_SPEC.md`)
   - Complete risk curve data (all doses, all compounds)
   - UX specification (views, cards, tooltips)
   - Data structures (JSON schema)
   - Testing requirements
   - Implementation checklist

### Before Writing Code
**Read both completely.** This takes 45 min but saves 2 hours of mistakes. If you start coding without reading, you'll get the data wrong.

---

## REQUIREMENTS SUMMARY

### 1. Core Features (Must-Have)

#### Feature 1: Dual-View Toggle
- Three buttons: `[Benefit View] [Risk View] [Integrated View]`
- **Benefit View:** Solid lines only (benefit curves)
- **Risk View:** Dotted lines only (risk curves)
- **Integrated View:** Both (default) — solid + dotted, same color, different line styles
- State persists across interactions

#### Feature 2: Chart Rendering (All 6 Compounds)
- X-Axis: Weekly Dose (0-1200 mg)
- Y-Axis: Score (0-5.5)
- Benefit: Solid lines, 2px stroke
- Risk: Dotted lines (strokeDasharray="5 5"), 2px stroke
- Colors: Test=Blue, NPP=Orange, Tren=Red, EQ=Green, Masteron=Purple, Primo=Brown
- Points: Circular markers (r=4) at each data point
- Uncertainty Bands: Shaded regions (opacity 0.15-0.3, wider band = lower confidence)

#### Feature 3: Uncertainty Bands (CRITICAL)
- **Tier 1 (empirical):** Narrow band (±0.15)
- **Tier 2/3 (extrapolated):** Medium band (±0.3-0.5)
- **Tier 4 (speculative):** Wide band (±0.6-0.8)
- **Tren plateau (300-1200mg):** Band width ±0.63, showing "we don't know exactly"

#### Feature 4: Interactive Legend
- Click to toggle compound visibility
- Visual feedback when hidden (opacity or strikethrough)
- All curves disappear together (benefit + risk)

#### Feature 5: Hover Tooltip
Shows on mouse over any data point:
```
Compound: [Name]
Dose: [X] mg/week

BENEFIT:
★ Score: [value]
Tier: [1/2/3/4 + description]
Source: [Study/method]
Caveat: [Explanation]
Confidence: ±[CI] ([High/Medium/Low])

RISK:
★ Score: [value]
Tier: [breakdown]
Source: [Study/method]
Caveat: [Explanation]
Confidence: ±[CI]

Individual Variance: ±20-30% typical
```

#### Feature 6: Expandable Methodology Card
- Click compound name in legend to open
- Shows evidence breakdown per compound
- Includes: Evidence hierarchy, benefit rationale, risk rationale, sources, limitations, assumptions, individual variance
- Modal or slide-out panel (your choice)
- Scrollable if content exceeds viewport
- Can be closed

#### Feature 7: Zoom & Pan
- Scroll to zoom in/out
- Click + drag to pan
- Double-click to reset
- Works on desktop; pinch-zoom on mobile

#### Feature 8: Disclaimer Banner
- Always visible at top
- Yellow/orange background (#ffe), dark border
- Full text from IMPLEMENT.md
- Optional collapse button

#### Feature 9: PDF Export
- Button in top-right
- Exports to `AAS_DoseResponse_Report_[YYYYMMDD].pdf`
- Pages: Title + disclaimer, chart, evidence legend, per-compound methodology, data table, sources
- Loading spinner during export (<5 seconds)

#### Feature 10: Responsive Design
- **Mobile (375px):** Stacked layout, bottom legend, touch-friendly
- **Tablet (768px):** Side-by-side, right legend
- **Desktop (1440px):** Full layout, no overflow
- Test on actual devices or emulator

---

## DATA REQUIREMENTS

### Critical: All Data From IMPLEMENT.md, Section 2
- **Do NOT invent numbers.** Copy exactly from IMPLEMENT.md.
- All 6 compounds: Test, NPP, Tren, EQ, Masteron, Primobolan
- Every dose point (0, 100, 200, ..., 1200 mg)
- Every data point tagged with Tier (1/2/3/4)
- Uncertainty bands (confidence intervals per Tier)

### Data Structure (from IMPLEMENT.md, Section 4)
```javascript
const compoundData = {
  testosterone: {
    name: 'Testosterone',
    color: '#0066CC',
    abbreviation: 'Test',
    benefitCurve: [
      { dose, value, tier, source, caveat, ci },
      ...
    ],
    riskCurve: [
      { dose, value, tier, source, caveat, ci },
      ...
    ],
    methodology: {
      summary, benefitRationale, riskRationale,
      sources, limitations, assumptions, individualVariance
    }
  },
  // ... npp, trenbolone, eq, masteron, primobolan
}
```

---

## CRITICAL IMPLEMENTATION NOTES

### Tren Benefit Plateau (Do NOT Decline)
MUST be flat post-300mg at ~4.87, not declining.

**Correct:**
```javascript
{ dose: 300, value: 4.333 },
{ dose: 400, value: 4.87 },  // Peak
{ dose: 500, value: 4.87 },  // ← FLAT
{ dose: 600, value: 4.87 },  // ← FLAT
{ dose: 1200, value: 4.87 }, // ← FLAT
```

**Wrong (don't do):**
```javascript
{ dose: 400, value: 4.87 },
{ dose: 500, value: 4.8 },   // ❌ Declining
{ dose: 600, value: 4.7 },   // ❌ Declining
```

Why: Data shows "plateau" (gains stop increasing), not "decline" (gains reverse). Wide uncertainty band (±0.63) communicates "we don't know if it stays flat or varies."

### Uncertainty Bands Must Be Visually Obvious
- Tier 1: Tight band, light shade
- Tier 4: Wide band, darker shade (warning zone)
- Use opacity to differentiate: Tier 1 (opacity 0.15), Tier 4 (opacity 0.3)

### Evidence Tiers Must Be Visible
Every tooltip must clearly state Tier + evidence basis.

**Good:**
```
Tier: Tier 1 (Measured in human RCT)
Source: Bhasin et al. (1996), n=43
Caveat: Direct empirical data
Confidence: ±0.15
```

**Bad:**
```
Source: Bhasin study
Confidence: ±0.15
```

### No Overclaiming Language
**Prohibited:**
- "Optimal dose is X" → Use "appears to peak around X"
- "The science shows" → Use "based on available evidence"
- "Proven" → Use "modeled based on theory + patterns"

**Required for Tier 4:**
- "Speculative" or "high uncertainty"
- "No human data; modeled from animal studies + community reports"
- "Treat as hypothesis, not established fact"

---

## TESTING CHECKLIST

### Must-Pass Unit Tests
```javascript
// Data validation
test('trenbolone risk at 400mg ≈ 4.2', () => {
  expect(calculateTrenRisk(400)).toBeCloseTo(4.2, 1);
});

test('trenbolone benefit flat post-300mg (no decline)', () => {
  const data = getTrenBenefit();
  const p300 = data.find(d => d.dose === 300).value;
  const p600 = data.find(d => d.dose === 600).value;
  expect(p600).toBeLessThanOrEqual(p300 + 0.1);
});

test('trenbolone uncertainty band wider than test band', () => {
  const trenCI = getTrenData().riskCurve.find(p => p.dose === 400).ci;
  const testCI = getTestData().riskCurve.find(p => p.dose === 400).ci;
  expect(trenCI).toBeGreaterThan(testCI);
});

// Feature testing
test('benefit view hides risk curves', () => {
  render(<AASVisualization />);
  fireEvent.click(screen.getByText('Benefit View'));
  expect(riskCurves).not.toBeVisible();
});

test('legend toggle hides compound', () => {
  render(<AASVisualization />);
  fireEvent.click(screen.getByText('Testosterone'));
  expect(testosteroneCurves).not.toBeVisible();
});

test('tooltip shows on hover', () => {
  render(<AASVisualization />);
  fireEvent.mouseEnter(chartPoint);
  expect(screen.getByText(/Tier 1/)).toBeInTheDocument();
});

test('methodology card opens', () => {
  render(<AASVisualization />);
  fireEvent.click(legendItem);
  expect(screen.getByText(/Evidence Hierarchy/)).toBeInTheDocument();
});

test('PDF export completes', async () => {
  render(<AASVisualization />);
  fireEvent.click(screen.getByText('Export PDF'));
  await waitFor(() => expect(jsPDF).toHaveBeenCalled());
});
```

### Responsive Tests
- iPhone SE (375px)
- iPad (768px)
- Desktop (1440px)
- Landscape orientation

### Browser Tests
- Chrome
- Firefox
- Safari

---

## DELIVERY CHECKLIST

Before submitting, verify ALL:

### Data
- [ ] All 6 compounds present
- [ ] Benefit curves match IMPLEMENT.md exactly
- [ ] Risk curves match IMPLEMENT.md exactly
- [ ] Uncertainty bands proportional to confidence
- [ ] Tren benefit FLAT post-300mg (not declining)
- [ ] All data points tagged with Tier (1/2/3/4)

### Features
- [ ] Dual-view toggle working
- [ ] All 6 compounds render correctly
- [ ] Uncertainty bands visible
- [ ] Legend toggles visibility
- [ ] Hover tooltip shows Tier/Source/Caveat/CI
- [ ] Methodology cards open and display correctly
- [ ] Zoom/Pan functional
- [ ] Disclaimer visible
- [ ] PDF export works (file downloads, all pages present)

### Code Quality
- [ ] No console errors
- [ ] No hardcoded magic numbers
- [ ] No external API calls (all data local)
- [ ] All tests passing
- [ ] Comments on complex logic
- [ ] README included

### Testing
- [ ] Unit tests pass
- [ ] Data validation passes
- [ ] Tren plateau verified (flat, not declining)
- [ ] Responsive design tested on 3+ sizes
- [ ] PDF export tested

### UX
- [ ] Mobile responsive
- [ ] Buttons have hover states
- [ ] Tooltips stay on-screen
- [ ] Methodology cards scrollable if needed
- [ ] Modal can be closed

---

## STEP-BY-STEP BUILD GUIDE

### Step 1: Read Both Docs (45 min)
Read DESIGN.md completely, then IMPLEMENT.md completely. Understand:
- Evidence hierarchy (Tier 1-4)
- All 6 compounds' data
- UX requirements
- Testing needs

### Step 2: Create Data Structure (30 min)
Copy all data from IMPLEMENT.md, Section 2 into `data/compoundData.js`.

Verify: `console.log(compoundData.testosterone.benefitCurve)` shows all points with Tier tags.

### Step 3: Build Base Chart (1-2 hours)
- Use Recharts to render benefit + risk curves
- Get all 6 compounds rendering
- Add uncertainty bands
- Add legend toggle

**Test:** All curves visible, legend toggle works, no errors.

### Step 4: Add Interactive Elements (1-2 hours)
- Hover tooltip
- View mode toggle (Benefit/Risk/Integrated)
- Expandable methodology cards

**Test:** Tooltip shows correct data, view toggle works, cards open/close.

### Step 5: Add Advanced Features (1 hour)
- Zoom/Pan
- PDF export
- Responsive design

**Test:** All working on desktop and mobile.

### Step 6: Testing & Verification (1 hour)
Run through delivery checklist. Fix any failures.

### Step 7: Documentation & Package (30 min)
- Write README
- Add inline comments
- Verify build runs cleanly

---

## FINAL SUCCESS CRITERIA

✅ All 6 compounds render correctly (benefit + risk)  
✅ Uncertainty bands visible and proportional to confidence  
✅ Tren benefit FLAT (not declining) with ±0.63 band  
✅ Tooltips show Tier, Source, Caveat, CI  
✅ Methodology cards explain evidence basis  
✅ View toggle works (Benefit/Risk/Integrated)  
✅ Legend toggle hides/shows compounds  
✅ PDF export includes full methodology  
✅ Responsive on mobile/tablet/desktop  
✅ No console errors; tests pass  
✅ Language appropriately qualified  
✅ Component production-ready  

**If all 12 true, you've succeeded.**

---

## COMMON MISTAKES TO AVOID

❌ Don't invent data — use only IMPLEMENT.md  
❌ Don't decline Tren benefit — keep flat post-300mg  
❌ Don't hide uncertainty — make bands visible  
❌ Don't overclaim — use qualifiers  
❌ Don't skip testing — catch errors early  
❌ Don't hide curves silently — user should know what's hidden  
❌ Don't ignore mobile — test on actual device  
❌ Don't forget PDF methodology — make it self-explanatory  
❌ Don't use external APIs — all data local  
❌ Don't hardcode labels — use data structure  

---

## QUICK REFERENCE

- **Evidence Hierarchy:** DESIGN.md, Section 1
- **Per-Compound Methodology:** DESIGN.md, Section 2
- **Risk Curve Data:** IMPLEMENT.md, Section 2
- **UX Specification:** IMPLEMENT.md, Section 3
- **Data Structure:** IMPLEMENT.md, Section 4
- **Testing Requirements:** IMPLEMENT.md, Section 6

---

## FINAL NOTES

**Philosophy:** This tool communicates uncertainty transparently. Wide bands, Tier tags, detailed tooltips, methodology cards — all serve honesty. Users may make real health decisions; accuracy matters.

**Timeline:** 6-8 hours total (data: 1h, chart: 2h, interactivity: 2h, testing/polish: 1-2h).

**Ready to Start?**
1. Read DESIGN.md
2. Read IMPLEMENT.md
3. Create data structure
4. Build chart
5. Add interactivity
6. Test & deliver

You've got clear specs. This is straightforward. Good luck.