# AAS Visualization Tool: Expanded Design Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Structures](#data-structures)
4. [Interaction Matrix Methodology](#interaction-matrix-methodology)
5. [Stack Metrics Calculation](#stack-metrics-calculation)
6. [Ancillary Protocol Algorithm](#ancillary-protocol-algorithm)
7. [Side Effect Categorization](#side-effect-categorization)
8. [Component Architecture](#component-architecture)
9. [Future Enhancements](#future-enhancements)

## Overview

This expanded documentation covers the **Phase 2 expansion** of the AAS Dose-Response Visualization Tool, which adds:
- Multi-compound interaction analysis
- Stack building with synergy calculations
- 5 oral compounds (Dianabol, Anadrol, Winstrol, Anavar, Halotestin)
- Comprehensive side effect profiles
- Ancillary medication protocol generation

### Version History
- **v1.0 (Original)**: Dose-response curves for 6 injectable compounds
- **v2.0 (Current)**: Full stack analysis, interactions, oral compounds, ancillary protocols

## Architecture

### Component Hierarchy

```
App
└── AASVisualization (Main Container)
    ├── DisclaimerBanner
    ├── Tab Navigation (5 tabs)
    ├── Tab: Dose-Response Curves
    │   ├── ViewToggle
    │   ├── DoseResponseChart
    │   ├── CustomLegend
    │   └── PDFExport
    ├── Tab: Interaction Matrix
    │   └── InteractionHeatmap
    │       └── InteractionDetailCard (modal)
    ├── Tab: Stack Builder
    │   └── StackBuilder
    │       ├── Compound selector
    │       ├── Stack metrics display
    │       └── Ancillary protocol display
    ├── Tab: Side Effects
    │   └── SideEffectProfile
    └── Tab: Ancillaries
        └── AncillaryCalculator
```

### Data Layer Structure

```
src/data/
├── compoundData.js          # 11 compounds (6 injectables + 5 orals)
├── interactionMatrix.js     # 38 interaction pairs + helpers
└── sideFxAndAncillaries.js  # Side effect categories + ancillary database
```

## Data Structures

### Compound Data Structure (Expanded)

Each compound now includes:

```javascript
{
  name: String,                 // Full name
  color: String,                // Hex color for visualization
  abbreviation: String,         // Short form
  type: 'injectable' | 'oral',  // Compound type
  category: String,             // Classification (base, progestin, androgen, etc.)
  usagePattern: String,         // Typical usage (orals only)
  
  // Dose-response curves (existing)
  benefitCurve: Array,
  riskCurve: Array,
  methodology: Object,
  
  // NEW: Side effect profile
  sideEffectProfile: {
    common: Array<{
      name: String,
      severity: String,
      onset: String,
      doseDependent: Boolean | String,
      management: String
    }>,
    lipidProfile: {...},
    cardiovascular: {...},
    hepatic: {...},          // Orals only
    psychological: {...},    // Tren, Halo
    hpta: {...}
  },
  
  // NEW: Ancillary requirements
  ancillaryRequirements: {
    aromataseInhibitor: {...},
    dopamineAgonist: {...}, // 19-nors only
    tudca: {...},           // Orals only
    bloodPressureManagement: {...},
    lipidManagement: {...}
  }
}
```

### Interaction Matrix Data Structure

Interactions are stored as flat key-value pairs for efficient lookup:

```javascript
{
  'testosterone_npp': {
    description: String,
    synergy: { benefit: Number, risk: Number },  // -1.0 to +1.0 modifiers
    mechanisms: Array<String>,
    recommendedRatio: String,
    recommendedProtocol: Object,
    recommendation: String,
    caution: String,
    stackBenefit: String,
    stackRisk: String,
    rating: 'excellent' | 'good' | 'compatible' | 'caution' | 'dangerous' | 'forbidden'
  },
  // ... 37 more pairs
}
```

#### Interaction Pair Coverage

- Injectable-Injectable: 15 pairs (all combinations of 6 injectables)
- Oral-Injectable: 19 pairs (key combinations)
- Oral-Oral: 4 pairs (all marked "forbidden")
- **Total**: 38 interaction definitions

### Side Effect & Ancillary Data Structure

```javascript
sideEffectCategories = {
  estrogenic: {
    name: String,
    description: String,
    compounds: Array<String>,
    sides: Array<{name, severity, description, management, timeline}>
  },
  // ... 5 more categories
}

ancillaries = {
  anastrozole: {
    name: String,
    category: 'aromatase_inhibitor' | 'serm' | 'dopamine_agonist' | ...,
    mechanism: String,
    dosing: Object | String,
    sides: String,
    caution: String,
    cost: {weekly: Number, note: String},
    availability: String,
    bloodworkTarget: String,
    advantages: String
  },
  // ... 14 more ancillaries
}
```

## Interaction Matrix Methodology

### Synergy Calculation

Synergy modifiers represent how compounds amplify or mitigate each other's effects:

```
Adjusted Benefit = Base Benefit × (1 + Σ Benefit Synergies)
Adjusted Risk = Base Risk × (1 + Σ Risk Synergies)
```

**Example**: Test (600mg) + NPP (300mg)

```
Base: Test Benefit = 5.0, NPP Benefit = 3.0 → Total = 8.0
Synergy: testosterone_npp = { benefit: -0.15, risk: 0.2 }
Adjusted Benefit = 8.0 × (1 - 0.15) = 6.8  (-15% due to receptor competition)
Adjusted Risk = (2.1 + 1.5) × (1 + 0.2) = 4.32  (+20% due to cumulative suppression)
```

### Rating System

Interaction ratings are determined by:

1. **Excellent (✓✓)**: Positive benefit synergy, low/negative risk synergy, well-tolerated
2. **Good (✓)**: Compatible mechanisms, manageable risks, established protocols
3. **Compatible (~)**: Additive effects, no major synergy or conflict
4. **Caution (⚠️)**: Conflicting goals OR high risk synergy, advanced users only
5. **Dangerous (❌)**: Extreme risk elevation, contradictory mechanisms
6. **Forbidden (✗)**: Never recommended (e.g., stacking two orals)

### Heatmap Color Coding

- Excellent: `#00AA00` (Green)
- Good: `#90EE90` (Light Green)
- Compatible: `#FFEB99` (Light Yellow)
- Caution: `#FFB347` (Orange)
- Dangerous: `#FF6B6B` (Red)
- Forbidden: `#8B0000` (Dark Red)

## Stack Metrics Calculation

### Base Score Calculation

For each compound in stack:
1. **Interpolate** benefit/risk scores at specified dose using linear interpolation between curve points
2. **Sum** all individual scores

### Synergy Application

For each **pair** of compounds in stack:
1. Look up interaction in `interactionMatrix`
2. Extract `synergy.benefit` and `synergy.risk` modifiers
3. Sum all synergy modifiers across all pairs

### Final Metrics

```javascript
{
  totalBenefit: Σ(individualBenefits),
  totalRisk: Σ(individualRisks),
  benefitRiskRatio: totalBenefit / totalRisk,
  
  benefitSynergy: Σ(synergyModifiers.benefit),  // across all pairs
  riskSynergy: Σ(synergyModifiers.risk),
  
  adjustedBenefit: totalBenefit × (1 + benefitSynergy),
  adjustedRisk: totalRisk × (1 + riskSynergy),
  adjustedRatio: adjustedBenefit / adjustedRisk
}
```

### Example: Test + NPP + Anavar Stack

```
Compounds:
- Testosterone 600mg/week
- NPP 300mg/week  
- Anavar 50mg/day

Base Scores:
- Test: Benefit 5.0, Risk 2.1
- NPP: Benefit 3.0, Risk 1.5
- Anavar: Benefit 1.2, Risk 0.9
- Total Base: Benefit 9.2, Risk 4.5

Synergy (3 pairs):
- testosterone_npp: benefit -0.15, risk +0.2
- testosterone_anavar: benefit +0.05, risk +0.1
- npp_anavar: benefit +0.05, risk +0.2
- Total Synergy: benefit -0.05, risk +0.5

Adjusted Scores:
- Adjusted Benefit: 9.2 × (1 - 0.05) = 8.74
- Adjusted Risk: 4.5 × (1 + 0.5) = 6.75
- Adjusted Ratio: 8.74 / 6.75 = 1.29
```

**Interpretation**: Slight negative benefit synergy (receptor competition), moderate risk elevation (cumulative sides), but overall manageable ratio.

## Ancillary Protocol Algorithm

### `getAncillaryProtocol(stack)` Logic

#### Step 1: Analyze Stack Composition

```javascript
hasAromatizingCompounds = stack includes testosterone, dianabol, or anadrol
has19Nors = stack includes npp or trenbolone
hasOrals = stack includes any oral compound
totalTestDose = sum of testosterone dose
```

#### Step 2: Determine Essential Ancillaries

**Aromatase Inhibitor (AI)**:
- Trigger: Any aromatizing compound present
- Dosing calculation:
  ```javascript
  totalAromatizingDose = testDose + (dbolDose × 15) + (adrolDose × 10)
  
  if (totalAromatizingDose < 400) → 0.25mg anastrozole E3D
  else if (totalAromatizingDose < 700) → 0.5mg anastrozole EOD
  else → 0.5-1mg anastrozole daily
  ```

**Dopamine Agonist**:
- Trigger: Any 19-nor present (NPP, Tren)
- Dosing: Cabergoline 0.25-0.5mg 2x/week
- Target: Prolactin <15 ng/mL

**TUDCA (Liver Support)**:
- Trigger: Any oral present
- Dosing calculation:
  ```javascript
  hasHarshOral = stack includes anadrol, halotestin, or winstrol
  tudcaDose = hasHarshOral ? '1000-1500mg daily' : '500-1000mg daily'
  ```

#### Step 3: Determine Recommended Ancillaries

**Blood Pressure Management**:
- Trigger: Trenbolone OR testDose >700 OR any oral present
- Examples: Telmisartan 40-80mg, ARBs, ACE inhibitors

**Lipid Support**:
- Universal: Fish oil 3-4g EPA/DHA daily
- Enhanced if harsh compounds present

**HCG**:
- Universal recommendation (250-500 IU 2x/week)
- Especially important for 19-nors or cycles >12 weeks

#### Step 4: Calculate Total Weekly Cost

Sum `cost.weekly` across all essential and recommended ancillaries.

#### Step 5: Generate Monitoring Requirements

Based on stack composition:
- **Lipid Panel**: Every 6-8 weeks (more frequent with orals)
- **Liver Enzymes**: Every 4 weeks if orals present
- **Estradiol (Sensitive)**: Every 6-8 weeks if aromatizing compounds
- **Prolactin**: Every 8 weeks if 19-nors
- **CBC**: Every 6-12 weeks (frequent if EQ present)
- **Blood Pressure**: 3x weekly at home (daily if Tren/orals)

## Side Effect Categorization

### Category System

Side effects are grouped into **6 categories**:

1. **Estrogenic**: Gynecomastia, water retention, emotional lability
2. **Progestational**: Sexual dysfunction (deca dick), prolactin elevation
3. **Androgenic**: Acne, hair loss (MPB), prostate enlargement
4. **Hepatic**: ALT/AST elevation, cholestasis, jaundice (orals only)
5. **Cardiovascular**: Hypertension, lipid decline, LVH, elevated HCT
6. **Psychological**: Aggression, anxiety, insomnia (Tren, Halo, EQ)

### Side Effect Data Structure

Each side effect includes:
- **Name**: Clinical term
- **Severity**: low, medium, high (or positive for benefits)
- **Description**: Explanation of mechanism
- **Management**: Harm reduction strategies
- **Timeline**: Onset and resolution timeframes

### Compound-Category Mapping

```javascript
sideEffectCategories.estrogenic.compounds = ['testosterone', 'dianabol', 'anadrol']
sideEffectCategories.progestational.compounds = ['npp', 'trenbolone']
sideEffectCategories.hepatic.compounds = ['dianabol', 'anadrol', 'winstrol', 'anavar', 'halotestin']
sideEffectCategories.psychological.compounds = ['trenbolone', 'eq', 'halotestin', 'high_dose_all']
// cardiovascular and androgenic apply to all compounds
```

## Component Architecture

### State Management

**AASVisualization (Parent)**:
- `activeTab`: Controls which major view is displayed
- `viewMode`: Benefit/Risk/Integrated (for dose-response tab only)
- `visibleCompounds`: Legend toggles (for dose-response tab only)
- `selectedCompound`: Methodology modal state

**StackBuilder (Standalone State)**:
- `stack`: Array of {compound, dose} objects
- `selectedCompound`: For adding new compound
- `dose`: Input value for new compound
- Computed: `stackMetrics`, `ancillaryProtocol`

**InteractionHeatmap (Standalone State)**:
- `selectedInteraction`: For detail modal {compound1, compound2}

**SideEffectProfile (Standalone State)**:
- `selectedCompound`: Dropdown selection

**AncillaryCalculator (Standalone State)**:
- `expandedDrug`: For collapsible drug cards
- `filterCategory`: Category filter

### Data Flow

```
User Interaction
      ↓
  Component State Update
      ↓
  Data Calculation (useMemo / functions)
      ↓
  Derived State (metrics, protocols)
      ↓
  UI Rendering
```

Example: Stack Builder

```
User adds compound → stack array updated
                         ↓
                    useMemo calculates:
                      - Base benefit/risk scores
                      - Synergy from interactionMatrix
                      - Adjusted scores
                         ↓
                    useMemo generates:
                      - Ancillary protocol via getAncillaryProtocol()
                         ↓
                    UI renders:
                      - Stack metrics display
                      - Ancillary protocol cards
```

### Performance Optimizations

1. **useMemo** for expensive calculations (stack metrics, ancillary protocol)
2. **Conditional rendering** - only active tab components mount
3. **Lazy imports** (future enhancement) - code splitting by tab
4. **Memoized selectors** - avoid recalculating compound lists

## Future Enhancements

### Planned Features

1. **Cycle Timeline Builder**
   - Drag-and-drop compound scheduling
   - Kickstart/mid-cycle/finisher timing
   - Automated ancillary protocol adjustment based on cycle week
   - PCT scheduling

2. **Blood Work Integration**
   - Input actual lab values
   - Compare to predicted ranges
   - Alert on dangerous values
   - Historical tracking

3. **User Profiles**
   - Save stack configurations
   - Personal response tracking (actual vs predicted)
   - Genetic factors (CYP19A1, AR CAG repeats, etc.)
   - Medical history integration

4. **Advanced Interactions**
   - Triple-compound synergies (currently only pairwise)
   - Time-dependent interactions (e.g., kickstart then drop)
   - Ester kinetics modeling (saturation curves)

5. **Enhanced PDF Export**
   - Include interaction matrix heatmap
   - Stack analysis report
   - Ancillary protocol printout
   - Blood work schedule

6. **Mobile App**
   - React Native port
   - Offline functionality
   - Blood work reminders/notifications
   - Dosing schedule tracker

### Technical Debt

1. **Testing Coverage**
   - Current: 29 tests (dose-response only)
   - Needed: ~50+ tests covering new features
   - Interaction matrix validation tests
   - Stack builder integration tests
   - Ancillary protocol logic tests

2. **Accessibility**
   - ARIA labels for interactive elements
   - Keyboard navigation for all features
   - Screen reader optimization
   - High contrast mode

3. **Performance**
   - Virtualize large lists (heatmap cells, ancillary list)
   - Lazy load oral compound data
   - Service worker for offline capability
   - Bundle size optimization (currently ~800KB)

4. **Data Quality**
   - Peer review of all interaction ratings
   - Expanded citations and references
   - User-contributed data validation
   - Expert consultation (endocrinologists, toxicologists)

## References

### Primary Literature
- Bhasin S, et al. (1996, 2001) - Testosterone dose-response RCTs
- Yarrow JF, et al. (2011) - Trenbolone animal studies
- Blaquier J, et al. (1991) - Nandrolone dose-response

### Community Sources
- r/steroids wiki and cycle reports
- Meso-Rx forum aggregated data
- AnabolicMinds community logs
- VigorousSteve harm reduction guidance

### Pharmacological References
- Kicman AT (2008) - Pharmacology of AAS
- van Amsterdam J, et al. (2010) - Adverse health effects
- Pope HG, et al. - Psychiatric effects of AAS

### Harm Reduction Frameworks
- National Harm Reduction Coalition guidelines
- European Monitoring Centre for Drugs and Drug Addiction (EMCDDA)
- Needle Exchange Programs (clinical protocols)

---

**Document Version**: 2.0  
**Last Updated**: December 2024  
**Authors**: Development Team  
**Status**: Living Document (subject to updates as new evidence emerges)

