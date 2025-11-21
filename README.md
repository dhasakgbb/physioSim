# AAS Dose-Response Visualization Tool

**Version 2.0** | Evidence-based harm reduction modeling with multi-compound analysis and comprehensive stack planning

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.2-61dafb.svg)
![Recharts](https://img.shields.io/badge/Recharts-2.10-8884d8.svg)

> **Architecture Decision**: This project uses React as the primary frontend framework. The Angular prototype in `/frontend/` has been deprecated and will be removed in a future release.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Data Specifications](#data-specifications)
- [Testing](#testing)
- [Architecture](#architecture)
- [Methodology](#methodology)
- [Contributing](#contributing)
- [Disclaimer](#disclaimer)
- [License](#license)

---

## 🎯 Overview

This interactive visualization tool presents dose-response relationships for **11 anabolic-androgenic steroids** (6 injectables + 5 orals) with explicit evidence grounding, uncertainty quantification, and comprehensive stack planning capabilities. Built for harm reduction education, it transparently shows:

- **Benefit curves** (anabolic gains: mass, strength, tissue development)
- **Risk curves** (aggregate side burden: lipids, cardio, psych, organ stress)
- **Uncertainty bands** (confidence intervals proportional to evidence quality)
- **Evidence tiers** (Tier 1-4: human RCTs → anecdotal patterns)
- **Compound interactions** (38 interaction pairs with synergy calculations)
- **Stack metrics** (benefit:risk ratios with interaction modifiers)
- **Ancillary protocols** (automated harm reduction recommendations)

### Core Philosophy

**Transparency over false precision.** Every data point is tagged with its evidence tier, source, and confidence interval. Wide uncertainty bands communicate "we don't know well" rather than hiding limitations.

### What's New in v2.0

- ✨ **5 Oral Compounds**: Dianabol, Anadrol, Winstrol, Anavar, Halotestin
- 🔗 **Interaction Matrix**: 38 compound interaction pairs with detailed analysis
- 🧪 **Stack Builder**: Build multi-compound stacks with automated synergy calculations
- ⚠️ **Side Effect Profiles**: Comprehensive side effect data for all 11 compounds
- 💊 **Ancillary Calculator**: Automated protocol generation with cost estimates and blood work schedules
- 🧠 **Unified Advanced Workflow**: Dense analytics (dimension chips, dose sweeps, surfaces, optimizers, sensitivity sliders) stay active for every user, with persistent scoring/evidence chips replacing legacy presets or lab-only gating.
- 🛝 **Obsidian Pro UI System**: The ProfileContextBar, NavigationRail, compound chip belt, spotlight chart shell, and the new premium `DoseSlider` now provide a consistent “Zone A + Zone B” experience across injectables, orals, interactions, and Stack Builder (keyboard roving index, focus rings, and filter chips included).
- 🧮 **Interaction Drawer Reflow**: The matrix is now a zoned viewport with lean-back / lean-in modes, a pinned summary rail, and a slide-up detail drawer that houses the pair summary, vertical dose sliders, modular analytics cards, and optimizers without forcing the user to scroll through disparate sections.

---

## ✨ Features

### 📊 Spotlight View Modes

- **Benefit**: Highlight the pure anabolic signal with thin bezier lines and plateau guardrails.
- **Risk**: Under-curve fills expose cumulative burden (lipids, cardio, hepatic, neuro) per compound.
- **Efficiency**: Live benefit ÷ risk ratios identify the sweet spot for each dose.
- **Uncertainty**: Mist overlays isolate confidence bands so you can inspect data quality without distraction.

The `ChartControlBar` pins this segmented control to the top of every hero chart, doubles as the hub for guardrail chips, and reports non-default selections to the global filter state.

### 📈 Interactive Chart

- All 6 compounds rendered with color-coded curves
- Uncertainty bands (width = confidence level)
- Hover tooltips showing Tier, Source, Caveat, CI
- Zoom/pan functionality (scroll to zoom, drag to pan, double-click to reset)
- Responsive design (mobile, tablet, desktop)
- Obsidian Pro polish: benefit curves glow inside mist gradients, risk curves use under-curve fills that warm as burden climbs, uncertainty mode isolates a mint veil, and legend hover states dim non-focused compounds so each curve gets a true spotlight moment.

### 📚 Expandable Methodology Cards

Click any compound name to view:

- Evidence hierarchy breakdown
- Benefit & risk curve rationale
- Key sources (Bhasin, Yarrow, forum aggregates)
- Limitations & assumptions
- Individual variance factors

### 🧭 Injectables / Orals Flow

![Injectables tab flow](docs/injectables-tab-flow.svg)

- **ProfileContextBar** condenses personalization (age, weight, SHBG, aromatase, anxiety, experience) into a single strip with Edit/Save/Reset actions plus the new filter badge cluster.
- **NavigationRail + CompoundChipRail** replace the legacy tab buttons, keeping tab switching, keyboard focus, and compound visibility controls in one matte belt directly under the profile strip.
- **Hero surface** pairs the spotlight chart with a vertical legend + `CompoundInsightCard` stack so hover, dimming, and personalized guardrails live together; everything sits inside a rounded “Zone B” shell shared by injectables and orals.
- **UtilityCardRow** introduces the Sweet Spot Finder, PDF Export, and Model Settings cards as the permanent CTA trio under every hero section.
- **Context drawer** (“Need context?”) still lazy-loads the evidence deck but now carries refreshed guardrail copy (e.g., oral hepatic risk) and scenario tiles tuned to the new layout.
- **Compressed mode toggle** remains below the nav rail, tracks with the global filters badge, and tightens spacing across all cards when dense layout is preferred.
- **Lazy loading guardrails** continue to keep EvidencePanel off the main bundle until a drawer opens, protecting first paint on lower-power devices.

### 📄 PDF Export

Download complete report including:

- High-resolution chart
- Full methodology per compound
- Evidence tier system
- Disclaimer & sources

### ⚠️ Disclaimer Banner

Always-visible harm reduction notice with collapsible details.

---

## 🆕 NEW: Multi-Compound Analysis Features (v2.0)

### 🔗 Interaction Matrix

Comprehensive interaction analysis for all compound pairs:

**Features:**

- **Visual Heatmap**: Color-coded compatibility matrix (excellent → forbidden)
- **38 Interaction Pairs**: Injectable-injectable, oral-injectable, and oral-oral combinations
- **Rating System**: ✓✓ (Excellent) → ✗ (Forbidden) with 6-level scale
- **Detailed Cards**: Click any cell for comprehensive interaction information including:
  - Mechanisms and pharmacological interactions
  - Synergy values (benefit/risk modifiers)
  - Recommended protocols and dosing ratios
  - Stack benefits and risks
  - Safety cautions and expert recommendations
- **Always-On Analytics**: Evidence blending slider, dimension chips, dose sweep, dose surface, optimizers, and sensitivity controls stay visible—no lab toggle required.
- **Template + Custom Optimizers**: Built-in three-compound templates sample dozens of dose permutations, while the custom optimizer sweeps up to four compounds; both pipelines can pre-fill Stack Builder.
- **Net Scoring Chips**: Sticky headers and recommendation cards display the Net benefit − risk score plus evidence mix so you immediately know why a pair ranked the way it did (and the selections persist via local storage).
- **Premium Dose Slider Controls**: Pair detail sliders now run on the shared `DoseSlider` kit (mist gradients, plateau/evidence markers, JetBrains mini-tooltips) so Interaction tweaking feels identical to Stack Builder adjustments.
- **Lean-back vs. Lean-in Modes**: Toggle between a minimalist glyph-based palette for a quick scan or the numeric + micro-bar view for deep dives. Lean-back mode color codes synergy/guardrail status; lean-in mode brings back exact values plus micro-trend bars.
- **Drawer Workspace**: Clicking any matrix cell slides up a consolidated workspace with a summary badge, vertical sliders, modular cards (Benefit vs Risk, Interaction Curve, Dose Surface, Stack Suggestions), and the multi/custom optimizers so everything updates off one shared `selectedPair` state.

**Usage:**

1. Navigate to "🔗 Interaction Matrix" tab
2. View three heatmaps: Injectable-Injectable, Oral-Injectable, Oral-Oral
3. Click any colored cell to open detailed interaction card
4. Review mechanisms, protocols, and safety guidance

**Rating Guide:**

- **✓✓ Excellent**: Positive synergy, well-tolerated (e.g., Test + Anavar)
- **✓ Good**: Compatible mechanisms, manageable risks (e.g., Test + Masteron)
- **~ Compatible**: Additive effects, no major conflicts (e.g., NPP + Primo)
- **⚠️ Caution**: High risk or conflicting goals, advanced only (e.g., Tren + Dbol)
- **❌ Dangerous**: Extreme risk elevation (e.g., Tren + Anadrol)
- **✗ Forbidden**: Never recommended (e.g., stacking two orals)

#### Unified Advanced Workflow

- The legacy simple vs. lab split is gone—everyone lands in the dense layout with the full analytics stack (dimension chips, dose sweep, surface grid, optimizers, sensitivity sliders) ready to go.
- The heatmap control strip pins the Net benefit − risk scoring model and evidence mix slider, and both preferences persist via local storage so investigations pick up where you left off.
- Template and custom optimizer outputs pre-fill Stack Builder, which mirrors the same scoring/evidence chips for saved cycles and PDF exports so there’s zero preset juggling between surfaces.

### 🧪 Stack Builder

Interactive tool for building multi-compound stacks with automated analysis:

**Features:**

- **Compound Selection**: Add any combination of injectables and orals
- **Dose Inputs**: Specify dose for each compound (mg/week for injectables, mg/day for orals)
- **Real-Time Metrics**: Instant calculation of:
  - Base benefit and risk scores (sum of individual compounds)
  - Synergy modifiers (from interaction matrix)
  - Adjusted scores (base × synergy modifiers)
  - Benefit:risk ratios (base and adjusted)
- **Ancillary Protocol Generation**: Automatic calculation of required ancillaries based on stack composition
- **Cost Estimation**: Total weekly cost for all ancillary medications
- **Blood Work Schedule**: Required monitoring frequency and target values
- **Net Benefit − Risk Orientation**: Sticky orientation bar, saved cycles, and exports now highlight the Net benefit − risk chip, ratios, and guardrail status instead of goal presets.
- **Optimizer Prefills**: One click loads template/custom optimizer outputs (and their evidence mix) directly from InteractionHeatmap into Stack Builder for deeper iteration.
- **Premium Dose Slider Kit**: Every compound card now uses the Obsidian Pro `DoseSlider` (mist track, guardrail markers, micro-tooltips) plus numeric inputs so you can drag through inflection points or type precise doses without losing guardrail context.

**Usage:**

1. Navigate to "🧪 Stack Builder" tab
2. Select compound from dropdown and enter dose
3. Click "Add to Stack"
4. Repeat for all compounds in your stack
5. Review stack metrics (benefit, risk, synergy)
6. Review automated ancillary protocol (essential, recommended, optional)
7. Check blood work requirements and monitoring frequency

**Example Stack:**

```
Testosterone 600mg/week + NPP 300mg/week + Anavar 50mg/day

Base Scores:
- Benefit: 9.2
- Risk: 4.5
- Ratio: 2.04

Synergy:
- Benefit: -5% (slight receptor competition)
- Risk: +40% (cumulative suppression + sides)

Adjusted:
- Benefit: 8.74
- Risk: 6.3
- Ratio: 1.39

Required Ancillaries:
- Anastrozole 0.5mg EOD ($2/week)
- Cabergoline 0.5mg 2x/week ($8/week)
- TUDCA 500mg daily ($15/week)
- Fish Oil 4g daily ($5/week)
Total: $30/week

Blood Work:
- Lipid panel (every 6 weeks)
- Liver enzymes (every 4 weeks - oral present)
- Estradiol sensitive (every 6 weeks)
- Prolactin (every 8 weeks - 19-nor present)
- CBC (every 8 weeks)
```

### ⚠️ Side Effect Profiles

Detailed side effect data for all 11 compounds:

**Features:**

- **Compound-Specific Profiles**: Select any compound to view its complete side effect breakdown
- **Common Side Effects**: List of frequent sides with severity, onset, dose-dependence, and management
- **Lipid Impact**: HDL decline, LDL increase, triglyceride changes
- **Cardiovascular Effects**: Blood pressure, LVH risk, hematocrit elevation
- **Hepatic Impact** (orals): ALT/AST elevation, cholestasis risk, reversibility
- **Psychological Effects** (Tren, Halo): Aggression, mood changes, insomnia
- **HPTA Suppression**: Recovery timeline, PCT requirements
- **Category Context**: Links to general side effect categories (estrogenic, progestational, androgenic, hepatic, cardiovascular, psychological)

**Usage:**

1. Navigate to "⚠️ Side Effects" tab
2. Select compound from dropdown
3. Review all side effect categories
4. Note management strategies for each side effect
5. Compare side effects across different compounds

**Side Effect Categories:**

- **Estrogenic**: Gynecomastia, water retention (Test, Dbol, Anadrol)
- **Progestational**: Sexual dysfunction, prolactin elevation (NPP, Tren)
- **Androgenic**: Acne, hair loss, prostate (all compounds, severity varies)
- **Hepatic**: Liver enzyme elevation (all orals - TUDCA mandatory)
- **Cardiovascular**: BP, lipids, LVH (all compounds, worst: Tren, orals)
- **Psychological**: Aggression, anxiety, insomnia (Tren, Halo, EQ)

### 💊 Ancillary Medications Reference

Comprehensive database of 15 ancillary medications:

**Features:**

- **Category Filtering**: Filter by drug class (AI, SERM, dopamine agonist, liver support, etc.)
- **Expandable Drug Cards**: Click any drug for detailed information:
  - Mechanism of action
  - Dosing protocols (multiple tiers: low, moderate, high)
  - Potential side effects
  - Availability and cost
  - Blood work targets
  - Advantages and cautions
- **General Guidelines**: Harm reduction best practices for each category

**Included Ancillaries:**

- **Aromatase Inhibitors**: Anastrozole, Letrozole, Exemestane
- **SERMs**: Tamoxifen, Raloxifene, Clomid
- **Dopamine Agonists**: Cabergoline, Pramipexole
- **Liver Support**: TUDCA, NAC
- **Blood Pressure**: Telmisartan, Lisinopril, Nebivolol
- **Lipid Support**: Fish Oil, Rosuvastatin, Berberine
- **HPTA Support**: HCG

**Usage:**

1. Navigate to "💊 Ancillaries" tab
2. Browse all ancillaries or filter by category
3. Click any drug card to expand full details
4. Review dosing protocols, mechanisms, and costs
5. Reference general guidelines for each category

**Key Information:**

- **Cost Estimates**: Weekly cost ranges for budgeting
- **Dosing Tiers**: Low, moderate, and high dose protocols
- **Blood Work Targets**: Optimal ranges (e.g., E2: 20-30 pg/mL, Prolactin: <15 ng/mL)
- **Cautions**: Important warnings and contraindications

---

## 🚀 Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- Modern browser (Chrome, Firefox, Safari)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/physioSim.git
cd physioSim

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

The app will be available at `http://localhost:5173`

---

## 🎮 Usage

### Basic Navigation

1. **Select View Mode**: Toggle between Benefit, Risk, Efficiency, or Uncertainty spotlight lenses
2. **Explore Compounds**: Hover over data points to see detailed tooltips
3. **Toggle Visibility**: Click compound names in legend to show/hide curves
4. **View Methodology**: Click "Methodology" buttons to see evidence breakdown
5. **Zoom & Pan**: Scroll to zoom, drag to pan, double-click to reset
6. **Export**: Click "Export PDF Report" to download full documentation

### Understanding the Chart

- **Solid lines** = Benefit curves (anabolic gains)
- **Dotted lines** = Risk curves (side burden)
- **Shaded bands** = Uncertainty (wider = lower confidence)
- **Colors**: Test=Blue, NPP=Orange, Tren=Red, EQ=Green, Masteron=Purple, Primo=Brown

### Evidence Tiers

- **Tier 1** (Green): Empirical human RCT data (highest confidence)
- **Tier 2** (Blue): Clinical/therapeutic human data, extrapolated
- **Tier 3** (Yellow): Animal studies converted to human equivalent dose
- **Tier 4** (Red): Pharmacological theory + community reports (lowest confidence)

---

## 📊 Data Specifications

### Compounds Included

1. **Testosterone (Test)** - Tier 1 data 0-600mg (Bhasin et al.)
2. **NPP (Nandrolone Phenylpropionate)** - Tier 2/3 data
3. **Trenbolone (Tren)** - Tier 3/4 data (NO human studies)
4. **EQ (Equipoise/Boldenone)** - Tier 2/4 data
5. **Masteron (Drostanolone)** - Tier 4 data (entirely anecdotal)
6. **Primobolan (Methenolone)** - Tier 2/4 data

### Critical Data Points

#### Testosterone

- **Benefit**: Linear 0-600mg (Tier 1), plateau 600-1200mg (Tier 3)
- **Risk**: Measured lipid decline 0-600mg; extrapolated cardio/hepatic 600+
- **Confidence**: 85-90% (0-600mg); 60-70% (600+)

#### Trenbolone (CRITICAL)

- **Benefit**: FLAT PLATEAU post-300mg (4.87) - gains stop increasing, not declining
- **Risk**: Escalates rapidly; psych/neuro sides dominate 200-400mg
- **Confidence**: 65-70% benefit; 40-50% risk (NO human data at any dose)
- **Uncertainty band**: ±0.63 at plateau (wide = "we don't know exactly")

### Data Sources

Primary literature:

- Bhasin et al. (1996, 2001) - Test supraphysio dose-response, n=43, 6 months
- Yarrow et al. (2011) - Tren anabolic response in rats, HED-scaled
- Blaquier et al. (1991) - NPP dose-response in rat protein synthesis
- Forbes (1985) - LBM plateau meta-analysis

Community aggregates:

- r/steroids wiki - ~3,000 cycle logs (2020-2025)
- Meso-Rx forums - ~2,000 cycle reports (archived)
- AnabolicMinds/Eroids - ~1,000 aggregated reports

---

## 🧪 Testing

### Run Test Suite

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run specific test file
npm test dataValidation.test.js
```

### Test Coverage

#### Data Validation Tests

- ✅ All 6 compounds present
- ✅ Testosterone values match Bhasin data
- ✅ **Trenbolone benefit FLAT post-300mg (not declining)** - CRITICAL
- ✅ Uncertainty bands proportional to confidence
- ✅ All curves start at (0, 0)
- ✅ Risk curves monotonically increasing
- ✅ Data structure integrity

#### Component Tests

- ✅ Disclaimer banner renders and toggles
- ✅ View toggle switches modes correctly
- ✅ Legend toggles compound visibility
- ✅ Methodology cards open/close
- ✅ PDF export functionality

### Interaction Test Guidelines

- `src/test/setup.js` shims `localStorage`, `scrollTo`, and other browser APIs so Vitest can exercise the heavy UI safely—importing this file is handled automatically by the test runner.
- Prefer the shared `renderWithAct` helper (see `src/test/stackBuilder.test.jsx`) so component mounts and async user-event chains are wrapped in `act(...)` by default.
- When using `userEvent`, always `await` the call (e.g., `await user.click(...)`) to avoid reintroducing act warnings.
- If you add a new helper, keep it colocated with the relevant tests and document the usage in this section so future contributors follow the “render + act” pattern.

### Key Test: Tren Benefit Plateau

```javascript
// From dataValidation.test.js
it("should have benefit FLAT (not declining) post-300mg", () => {
  const tren = compoundData.trenbolone;
  const benefit400 = tren.benefitCurve.find((p) => p.dose === 400);
  const benefit500 = tren.benefitCurve.find((p) => p.dose === 500);
  const benefit600 = tren.benefitCurve.find((p) => p.dose === 600);

  expect(benefit400.value).toBeCloseTo(4.87, 2);
  expect(benefit500.value).toBe(benefit400.value); // FLAT
  expect(benefit600.value).toBe(benefit400.value); // FLAT
});
```

---

## 🏗️ Architecture

### Project Structure

```
physioSim/
├── src/
│   ├── components/
│   │   ├── AASVisualization.jsx      # Main orchestrator
│   │   ├── DisclaimerBanner.jsx      # Warning banner
│   │   ├── ViewToggle.jsx            # Benefit/Risk/Integrated toggle
│   │   ├── DoseResponseChart.jsx     # Recharts visualization
│   │   ├── CustomTooltip.jsx         # Hover tooltips
│   │   ├── CustomLegend.jsx          # Interactive legend
│   │   ├── MethodologyModal.jsx      # Expandable evidence cards
│   │   └── PDFExport.jsx             # Report generation
│   ├── data/
│   │   └── compoundData.js           # All curve data (DO NOT MODIFY)
│   ├── test/
│   │   ├── setup.js
│   │   ├── dataValidation.test.js    # Data integrity tests
│   │   └── components.test.jsx       # Component tests
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── DESIGN.md                          # Evidence basis & methodology
├── IMPLEMENT.md                       # Technical specs & data
├── CLAUDE_CODE_PROMPT.md              # Build instructions
└── README.md
```

### Tech Stack

- **Frontend**: React 18.2
- **Charting**: Recharts 2.10 (D3-based)
- **Styling**: TailwindCSS 3.4
- **PDF Export**: jsPDF + html2canvas
- **Build Tool**: Vite 5.0
- **Testing**: Vitest + Testing Library

### Data Flow

1. `compoundData.js` contains all curve data (immutable)
2. `AASVisualization.jsx` manages state (view mode, visible compounds, modal)
3. `DoseResponseChart.jsx` transforms data for Recharts rendering
4. `CustomTooltip.jsx` fetches point-specific data on hover
5. `MethodologyModal.jsx` displays compound methodology on click

---

## 📖 Methodology

### Evidence Hierarchy

**Tier 1: Empirical Human Data** (Highest Confidence)

- Randomized controlled trials at specific doses
- Example: Bhasin et al. Test 0-600mg

**Tier 2: Clinical/Therapeutic Human Data** (High Confidence)

- Therapeutic doses extrapolated via pharmacology
- Example: Nandrolone 50-100mg clinical use

**Tier 3: Animal Studies + HED Scaling** (Medium Confidence)

- Animal dose-response converted to human equivalent
- Formula: HED = Animal Dose × (Animal Km / Human Km)
- Example: Yarrow Tren rat study scaled to human

**Tier 4: Mechanism + Anecdotal Patterns** (Lower Confidence)

- Pharmacological theory + community reports
- High bias (survivorship, reporting, confounders)
- Example: Tren plateau at 300mg (forum consensus)

### Risk Scoring Formula

```
Risk(X) = 0.3 × Risk_lipid(X)
        + 0.3 × Risk_cardio(X)
        + 0.2 × Risk_psych(X)
        + 0.1 × Risk_hepatic(X)
        + 0.1 × Risk_suppression(X)
```

Normalized to 0-5.5 scale for visual comparison with benefit curves.

### Assumptions Baked In

- Male, age 25-40
- Proper AI/SERM use (not modeled separately)
- Training/diet adequate (not limiting factor)
- No pre-existing HTN, dyslipidemia, cardiac disease
- Duration: 12-16 week cycles (not chronic year-round)
- PCT protocol followed

**Individual variance: ±20-30% typical** (genetics, compliance, health status)

---

## 🤝 Contributing

### Code Contributions

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Make changes and add tests
4. Run test suite (`npm test`)
5. Commit with clear messages (`git commit -m 'Add feature: X'`)
6. Push to branch (`git push origin feature/YourFeature`)
7. Open a Pull Request

### Data Contributions

**CRITICAL**: Do NOT modify data without rigorous sourcing.

If you have new human RCT data:

1. Provide full citation (journal, DOI, authors, year, sample size)
2. Document methodology in DESIGN.md
3. Update compoundData.js with Tier 1 flag
4. Narrow uncertainty bands
5. Add to test suite

If you have anecdotal aggregates:

1. Document sample size and aggregation method
2. Flag as Tier 4
3. Widen uncertainty bands
4. Add caveats

### Bug Reports

Please include:

- Browser/OS version
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots if applicable

---

## ⚠️ Disclaimer

### HARM REDUCTION MODELING, NOT MEDICAL ADVICE

This tool visualizes dose-response relationships based on limited human data, animal studies, and community patterns. **It is educational only** and does not constitute medical, pharmaceutical, or health advice.

**Key Points:**

- These compounds are controlled substances in most jurisdictions
- Individual responses vary widely (±20-30% typical); **your response may differ**
- Risk curves are modeled, not empirically measured, at most doses
- **Consult a healthcare provider before using AAS**
- This tool assumes proper ancillary use, training, diet, and baseline health

**What This Tool Is NOT:**

- ❌ A prescription for dosing
- ❌ A guarantee of specific outcomes
- ❌ Validated for your individual physiology
- ❌ A replacement for medical supervision

**What This Tool IS:**

- ✅ A thinking tool for understanding tradeoffs
- ✅ A harm reduction resource showing diminishing returns
- ✅ A transparent model with explicit uncertainty
- ✅ An educational framework for risk-aware decision-making

### No Overclaiming Language

This tool avoids:

- "Optimal dose is X" → Instead: "appears to peak around X±Y"
- "The science shows" → Instead: "based on available evidence"
- "Proven" → Instead: "modeled based on theory + patterns"

For Tier 4 data, explicit warnings:

- "Speculative" or "high uncertainty"
- "No human data; modeled from animal studies + community reports"
- "Treat as hypothesis, not established fact"

---

## 📜 License

MIT License

Copyright (c) 2025 physioSim

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 📚 References

### Primary Literature

1. **Bhasin, S., et al. (1996).** "The effects of supraphysiologic doses of testosterone on muscle size and strength in normal men." _New England Journal of Medicine_, 335(1), 1-7.

2. **Bhasin, S., et al. (2001).** "Testosterone dose-response relationships in healthy young men." _American Journal of Physiology-Endocrinology and Metabolism_, 281(6), E1172-E1181.

3. **Yarrow, J. F., et al. (2011).** "Tissue selectivity and potential clinical applications of trenbolone (17β-hydroxyestra-4,9,11-trien-3-one): A potent anabolic steroid with reduced androgenic and estrogenic activity." _Steroids_, 76(1-2), 106-116.

4. **Forbes, G. B. (1985).** "The effect of anabolic steroids on lean body mass: The dose response curve." _Metabolism_, 34(6), 571-573.

5. **Blaquier, J. A., et al. (1991).** "Dose-response relationships for nandrolone decanoate on protein synthesis in rat skeletal muscle." _Journal of Steroid Biochemistry and Molecular Biology_, 39(4), 545-551.

### Community Resources

- r/steroids wiki - Aggregated cycle logs and harm reduction guides
- Meso-Rx forums - Historical cycle reports (2000-2025)
- AnabolicMinds/Eroids - Community experience aggregates

### Harm Reduction Experts

- Dr. Thomas O'Connor - TRT/AAS medicine, clinical perspective
- VigorousSteve - YouTube harm reduction framing
- r/steroids community - Peer harm reduction discussion

---

## 🆘 Support

### Issues & Questions

- **GitHub Issues**: [https://github.com/yourusername/physioSim/issues](https://github.com/yourusername/physioSim/issues)
- **Documentation**: See DESIGN.md and IMPLEMENT.md for detailed methodology

### Feedback

This tool is a living project. If you:

- Find contradictory evidence
- Have suggestions for UI/UX improvements
- Encounter bugs or errors
- Want to contribute cycle data (anonymized)

Please open an issue or submit a PR.

---

## 🗓️ Changelog

### Version 1.0 (2025-01-XX)

- Initial release
- All 6 compounds with benefit/risk curves
- Evidence hierarchy (Tier 1-4)
- Uncertainty quantification
- Interactive tooltips & methodology cards
- PDF export functionality
- Comprehensive test suite
- Responsive design (mobile/tablet/desktop)

### Planned Features (v1.1+)

- [ ] Individual variance slider ("Show my curve if I'm a poor/good responder")
- [ ] Comparison mode (overlay 2 compounds side-by-side)
- [ ] Data table view (numerical values for all doses)
- [ ] Dark mode toggle
- [ ] Print-friendly mode
- [ ] Cycle duration modeling (cumulative effects)
- [ ] Stacking calculator (multiple compounds)

---

## 🙏 Acknowledgments

This tool would not exist without:

- **Bhasin et al.** for conducting the only supraphysio testosterone RCT
- **Yarrow et al.** for HED-scaled animal data on trenbolone
- **r/steroids community** for peer harm reduction discussion
- **Open-source maintainers** of React, Recharts, Vite, and Vitest

---

**Built with ❤️ for harm reduction education**

_Remember: This is a thinking tool, not a prescription. Stay safe, stay informed, and prioritize your health._
