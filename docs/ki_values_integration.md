# Ki Values Integration - Complete

## ✅ Review Summary

All Ki value calculations have been **validated and approved** for integration. See [ki_values_review.md](./ki_values_review.md) for full details.

- **15 compounds** with Ki values
- **All calculations verified** mathematically correct
- **Oxandrolone flagged** as anomaly (62 nM vs expected ~0.9 nM range)

## 📦 Integration Location

**File Created:** `/Volumes/LaCie/GitHub/physioSim/src/data/compoundKiValues.js`

This file exports `compoundKiValues` object containing:

- `ki` - Binding constant in nM (nanomolar)
- `kiSource` - Citation or derivation method
- `derivedFrom` - RBA percentage and formula (for derived values)
- `isDirectMeasurement` - Boolean flag for direct vs derived
- `anomalyNote` - Special notes (e.g., oxandrolone)

## 🔧 Usage Example

```javascript
import { compoundKiValues } from "./data/compoundKiValues";

// Get Ki value for testosterone
const testKi = compoundKiValues.testosterone.ki; // 0.90 nM

// Get Ki value for trenbolone
const trenKi = compoundKiValues.trenbolone.ki; // 0.47 nM

// Check if value is from direct measurement
const isDirect = compoundKiValues.testosterone.isDirectMeasurement; // true

// Get derivation info
const nandDeriv = compoundKiValues.nandrolone.derivedFrom;
// { rbaPercent: 154.5, formula: "0.9 * 100 / 154.5" }
```

## 🧬 Integration with Existing `compoundData.js`

**Option 1: Import and reference**

```javascript
import { compoundKiValues } from "./compoundKiValues";

export const compoundData = {
  testosterone: {
    // ... existing properties
    binding: compoundKiValues.testosterone,
  },
  // ...
};
```

**Option 2: Direct embedding** (if you prefer single file)
Add a `binding` property to each compound in `compoundData.js`:

```javascript
testosterone: {
  //... existing properties
  binding: {
    ki: 0.90,
    kiSource: "Anchor; high-affinity AR assays",
  },
}
```

## 📊 Ki Values Quick Reference

| Compound           | Ki (nM)  | Relative to T  |
| ------------------ | -------- | -------------- |
| Dimethyltrienolone | 0.46     | 1.96× stronger |
| Trenbolone         | 0.47     | 1.91× stronger |
| Nandrolone         | 0.58     | 1.55× stronger |
| Normethandrone     | 0.62     | 1.45× stronger |
| Dienolone          | 0.67     | 1.34× stronger |
| Dimethyldienolone  | 0.74     | 1.22× stronger |
| Trestolone         | 0.80     | 1.13× stronger |
| **Testosterone**   | **0.90** | **Reference**  |
| DHT                | 1.00     | 0.90× (weaker) |
| Levonorgestrel     | 1.05     | 0.86×          |
| Norgestrienone     | 1.29     | 0.70×          |
| Tibolone Δ4        | 1.29     | 0.70×          |
| Boldenone (EQ)     | 1.44     | 0.63×          |
| Norethisterone     | 2.05     | 0.44×          |
| Oxandrolone ⚠️     | 62.0     | 0.015×         |

## ⚠️ Important Notes

1. **Oxandrolone anomaly**: The 62 nM value is from direct measurement but suggests very weak binding. Clinical effects likely involve:

   - Metabolic activation to more active forms
   - Non-AR mediated anabolic pathways
   - Tissue-specific mechanisms

2. **Lower Ki = Higher Affinity**: Remember that Ki is an inverse measure of binding affinity.

3. **Application**: These values can be used for:
   - Receptor occupancy calculations
   - Dose-response modeling
   - Competitive binding simulations
   - Stacking synergy predictions

## ✅ Status

- [x] Calculations verified
- [x] Data structure created
- [x] Documentation complete
- [ ] **Next**: Integrate into dose-response calculations (if needed)
- [ ] **Next**: Update AR affinity scores in compoundData.js based on Ki values (optional)
