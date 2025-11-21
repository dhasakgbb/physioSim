# MATH: Modeling & Analytics Technical Handbook

> _This document assumes no prior knowledge of physioSim. It walks through every layer—from the data structures that describe a compound, to the math that predicts labs, to the UI components that render those values. When in doubt, start here._

---

## 0. What Is physioSim?

physioSim is a **full-stack pharmacology simulator**. Users build an “Active Stack” of compounds (testosterone, Anavar, HCG, etc.), choose dosing schedules, and instantly see:

- **Projected benefits** (hypertrophy, strength, fat loss) based on curated dose-response curves.
- **Projected risks** (toxicity, suppression, organ strain) based on biomarker heuristics and interaction models.
- **Virtual lab work** (HDL, LDL, AST/ALT, estradiol, creatinine, hematocrit, testosterone) so they can compare stacks without real blood draws.
- **System load** gauges to highlight which organ system is closest to failure.

The codebase is split into:

1. **Data layer** (`src/data/compoundData.js`, `interactionEngineData.js`, etc.).
2. **Math & simulation layer** (`stackEngine.js`, `simulationEngine.js`, `interactionEngine.js`).
3. **Presentation layer** (React components and hooks under `src/components`, `src/hooks`, `src/context`).

Everything described below lives inside those three layers.

### 0.1 Key Concepts & Data Objects

| Term | Definition | Declared In |
| --- | --- | --- |
| **Compound** | A single anabolic agent with metadata, curves, biomarkers, and signal/drag traits (`potency`, `saturationCeiling`, `toxicityCoefficient`). | `src/data/compoundData.js` |
| **Stack** | An ordered list of `{ compound, dose, frequency, ester? }` objects supplied by the user. | `StackContext` state |
| **Profile** | Represents the athlete (bodyweight, body fat, age, training style, experience, sensitivities). Adjusts math defaults. | `src/utils/personalization.js` |
| **Metrics** | Result of `evaluateStack`. Includes totals, warnings, projected labs, pathway loads, system load, and physics metadata. | `stackEngine` return value |
| **Physics Metrics** | Deterministic outputs from `simulationEngine`: projected labs, system load, weekly mg metadata. | `stackEngine` → `metrics.analytics` |

### 0.2 Example Stack Input

```jsonc
[
  { "compound": "testosterone", "dose": 600, "frequency": 3.5, "ester": "enanthate" },
  { "compound": "anavar", "dose": 50, "frequency": 1 },
  { "compound": "eq", "dose": 400, "frequency": 3.5 }
]
```

- Injectables default to mg **per week** (`frequency` ≈ injections/week). Orals default to mg **per day** (frequency `1` → daily, automatically multiplied by 7 internally).
- The stack and the loaded `profile` are the only user-facing inputs; everything else is derived.

### 0.3 Life of a Simulation (High-Level)

1. User edits the stack (React components dispatch to `StackContext`).
2. `StackContext` recomputes `metrics = evaluateStack({ stackInput, profile })`.
3. `evaluateStack` looks up each compound, evaluates benefit/risk curves, applies user multipliers, calculates interactions, computes pathway loads, and calls `calculateCycleMetrics` for labs + physics metadata.
4. The resulting `metrics` object is shared through `SimulationContext` and consumed by UI widgets (`RightInspector`, dashboards, charts, etc.).

The rest of the handbook unpacks these steps with code references and formulas.

---

## 1. Compound Schema (`src/data/compoundData.js`)

Every compound entry follows the same pattern. Below is a trimmed but annotated example so the structure is obvious even if you have never seen the file before.

```js
export const compoundData = {
  anavar: {
    name: "Anavar (Oxandrolone)",
    abbreviation: "Var",
    type: "oral",           // drives dosing defaults & oral toxicity modeling
    toxicityTier: 1,          // scalar for liver surge math
    bioavailability: 0.8,     // fraction of the labeled dose that survives first pass
    suppressiveFactor: 2,     // contributes to max suppression warning
    conversionFactor: 0,      // mg → ng/dL conversion (0 because Anavar doesn't add serum T)
    flags: {
      aromatization: 0,
      isSuppressive: true,
    },
    defaultEster: "oral",    // orals still use the ester slot for uniform handling
    esters: {
      oral: { halfLife: 9, weight: 1.0 },
    },
    biomarkers: {
      shbg: -1,
      igf1: +1,
      rbc: +1,
      cortisol: -1,
      liver_toxicity: +2,     // critical! feeds AST/ALT + hepatic load
      renal_toxicity: 1,
    },
    benefitCurve: [
      { dose: 0, value: 0.0 },
      { dose: 50, value: 1.2 },
      { dose: 100, value: 1.8 },
    ],
    riskCurve: [
      { dose: 0, value: 0.0 },
      { dose: 50, value: 0.7 },
      { dose: 100, value: 1.8 },
    ],
      potency: 0.85,             // slope for anabolic signal (1.0 = testosterone baseline)
      saturationCeiling: 1.9,    // signal cap (low for Anavar)
      toxicity: {               // organ-specific drag coefficients
         hepatic: 0.65,
         lipid: 0.55,
         renal: 0.35,
         neuro: 0.2,
      },
      pathwayWeights: {
         ar: 0.6,
         nonGenomic: 0.3,
         antiCatabolic: 0.1,
         shbgBinding: 0.2,
      },
      metabolicVectors: {
         aromatization: 0.2,
         dhtConversion: 0.05,
         glycogenLoad: 0.6,
         lipolysis: 0.3,
      },
      anabolicRating: 0.65,      // tissue accretion strength
      androgenicRating: 0.35,    // CNS drive / aggression
      cosmeticFactor: 0.05,      // positive = wetter / glycogenic
  },
  // … dozens of compounds
};
```

The fields fall into five categories:

1. **Display**: `name`, `abbreviation`, `color`, `category`, `pathway`, `binding` (e.g., Ki metadata).
2. **Dose handling**: `type`, `defaultEster`, `esters`, `bioavailability`, `halfLife` (convert user input to weekly active mg).
3. **Scoring hooks**: `benefitCurve`, `riskCurve`, `biomarkers`, `flags`, `toxicityTier`, `suppressiveFactor`, plus the **signal/drag traits** (`potency`, `saturationCeiling`) and **qualitative vectors** (`pathwayWeights`, `metabolicVectors`, `anabolicRating`, `androgenicRating`, `cosmeticFactor`).
4. **Toxicity buckets**: per-organ coefficients under `toxicity.{hepatic,lipid,renal,neuro,cardio,progestogenic,...}` that feed the drag equation and targeted warnings.
5. **Physics hints**: flags that feed the deterministic labs (`aiStrength`, `antiInflammatory`, `conversionFactor`, etc.).
6. **Peripheral metadata**: `sideEffectProfile`, `evidenceProvenance`, etc. (mostly informational today, ready for future heuristics).

### 1.1 Per-Compound Impact Channels (Where Liver/Lipid/Strength Numbers Come From)

Every compound informs the analytics layer through three parallel channels. This is the authoritative mapping for “how do we calculate the liver hit, lipid damage, or strength gain for a single drug?”

1. **Signal channel (benefits / strength / hypertrophy)**
    - Inputs: `benefitCurve`, `potency`, `saturationCeiling`, `anabolicRating`, `androgenicRating`, `pathwayWeights.ar`, `pathwayWeights.nonGenomic`.
    - In `stackEngine` we evaluate the curve at the active dose, apply the profile scalars, and compute:
       $$Signal = sigmoid(\text{activeMg} \times potency,\ saturationCeiling)$$
    - `anabolicRating` steers the hypertrophy term, `androgenicRating` funnels into the strength/CNS bonus, and `pathwayWeights` allocate that signal to the AR vs non-genomic dashboards. The resulting values populate:
       - `metrics.totals.benefit`
       - `metrics.analytics.projectedGains.hypertrophy/strength`
       - Pathway charts (e.g., `MechanismMonitor`).

2. **Drag channel (organ stress across hepatic/lipid/renal/etc.)**
    - Inputs: `toxicity` dictionary, `toxicityTier`, `biomarkers` with negative values (e.g., `liver_toxicity`, `hdl`), oral flags.
    - For each organ bucket we accumulate:
       $$OrganLoad_{organ} += (activeMg \times toxicity[organ])^{1.4}$$
    - Hepatic and lipid loads additionally ingest biomarker deltas, so a compound with `biomarkers.liver_toxicity = 2` boosts AST/ALT beyond the toxicity bucket alone. Oral compounds trigger the surge math in §3.3 via `toxicityTier` once the daily dose exceeds 10 mg.
    - These numbers surface as:
       - `metrics.analytics.systemLoad.<hepatic|lipid|renal|neuro>`
       - Lab projections: AST/ALT map to hepatic load, HDL/LDL map to lipid load, creatinine/eGFR map to renal load.

3. **Lab coefficient channel (direct biomarker curves)**
    - Inputs: `biomarkers` object, `conversionFactor`, `flags` (e.g., `aromatization`, `aiStrength`).
    - Each biomarker entry is a signed scalar that feeds the deterministic lab sigmoids described in §3.2. Example mappings:
       - `biomarkers.liver_toxicity` → AST/ALT sigmoid load + hepatic system load multiplier.
       - `biomarkers.lipid_profile` (HDL negative / LDL positive) → HDL/LDL sigmoids.
       - `biomarkers.rbc` → hematocrit sigmoid + cardiovascular system load.
       - `biomarkers.cns_drive` or `androgenicRating` → projects into strength gain and neuro load.
       - `conversionFactor` → translates active mg into serum testosterone for the labs panel.

Put differently:

| Field | Drives | Consumes |
| --- | --- | --- |
| `toxicity.hepatic` + `biomarkers.liver_toxicity` + oral surge | AST/ALT values, `systemLoad.hepatic`, hepatic warnings | `simulationEngine`, `useSystemLoad` |
| `toxicity.lipid` + HDL/LDL biomarkers | HDL/LDL labs, `systemLoad.cardiovascular`, lipid warnings | `simulationEngine`, Lab Report UI |
| `toxicity.renal` + `biomarkers.renal_toxicity` | Creatinine, eGFR, `systemLoad.renal` | `simulationEngine`, Banner triggers |
| `flags.aromatization` + `flags.estrogenicity` | Serum E2 (first term only) vs `systemLoad.estrogenic` (both terms) | `simulationEngine`, estrogenic warnings/Banners |
| `toxicity.progestogenic` + `biomarkers.prolactin` | `projectedLabs.prolactin`, `systemLoad.progestogenic`, progesterone-driven gyno warnings | `simulationEngine`, RightInspector banners |
| `benefitCurve` + `anabolicRating` + `androgenicRating` | Hypertrophy/strength projections, net gain bars | `stackEngine`, `ProjectedGains` widgets |

If a compound feels inaccurate in liver, lipid, or strength outputs, the fix is always to re-check these inputs: `biomarkers` for the raw lab direction, `toxicity` for organ buckets, and `potency/anabolicRating` for signal.

Whenever you add or edit a compound, confirm that its `biomarkers` cover **all** downstream consumers. For example, failing to set `liver_toxicity` means the physics engine will under-report ALT/AST even if the UI calls the compound “C17-aa”. Also set `binding.ki` (or at least `pathways.ar_affinity`) so the receptor competition math knows how hard the compound fights for AR occupancy. High-affinity agents (low Ki) like Trenbolone will monopolize the AR while mild SARMs with higher Ki values leave plenty of free receptor space.

Finally, populate the signal/drag traits and qualitative vectors:

- `potency` (slope vs mg): Testosterone baseline = `1.0`; fast-acting agents go up to ~`1.8`; mild SARMs dip below `0.8`.
- `saturationCeiling`: rough 0–4 scale representing the asymptote. Injectables can live in the 3–3.5 range; small orals stay around 1.6–2.0.
- `pathwayWeights`: relative strength across `ar`, `nonGenomic`, `antiCatabolic`, `shbgBinding`. Numbers should sum to ≤1; we normalize internally.
- `metabolicVectors`: `aromatization`, `dhtConversion`, `glycogenLoad`, `lipolysis`. Use these to differentiate “wet” vs “dry” compounds and true fat burners.
- `anabolicRating` vs `androgenicRating`: coarse 0–1 scalars used for tissue vs CNS drive multipliers.
- `cosmeticFactor`: -1 (dry/diuretic) → +1 (very wet). Feeds the “fullness” output. (Redundant with metabolic vectors but convenient for UI copy.)
- `toxicity.{hepatic,lipid,renal,neuro,cardio,progestogenic}`: per-organ drag coefficients. Use 0.1–0.3 for mild pressure, 0.6+ for brutal compounds.

The engine falls back to safe defaults (1.0 / 2.4 / uniform pathway weights / 0.2 toxicity buckets) if omitted, but setting real values is what makes net-gain modeling feel realistic.

---

## 2. Lifecycle of `evaluateStack` (`src/utils/stackEngine.js`)

`evaluateStack` is the central brain. It receives the raw stack + profile and produces everything the UI needs. Think of it as four large phases:

### 2.1 Normalization & Profile Scalars

1. `normalizeStackInput` builds two helper maps:
   - `compounds`: ordered array of unique compound codes.
   - `doses`: map of compound → numeric dose (mg/week or mg/day depending on type).
2. `calculateUserScalars(profile)` estimates:
   - **Capacity scalar** (lean body mass) to stretch saturation thresholds.
   - **Aromatase scalar** (body fat) to magnify estrogenic risk.
   - **Age penalties** (older athletes recover slower, so risk climbs).
   - **Experience multipliers** (beginner vs blast/cruise) for both benefits and saturation ceilings.
   - **Sex-specific overrides** (female virilization cliff at ~20 mg/wk).
3. Thresholds such as `SATURATION_THRESHOLD` and `TOXICITY_THRESHOLD` are multiplied by those scalars so a 120 lb novice and a 260 lb pro do not hit the same ceilings at the same dose.

### 2.2 Per-Compound Scoring

For each compound:

1. **Weekly conversion / Active load**: orals multiply by 7, injectables respect the provided weekly mg. Half-life + ester weight convert that to **active serum mg** per day so the Hill equation sees the same units the physics engine does.
2. **State tracking**:
   - `totalSystemicLoad += weeklyDose`.
   - `totalGenomicLoad += activeGenomicDose * pathwayWeight`.
   - `maxSuppression = max(maxSuppressiveFactor, suppressiveFactor)`.
3. **Benefit/Risk curves**:
   - `evaluateCompoundResponse` interpolates the benefit and risk curves and returns both the value and metadata (confidence interval, plateau dose, etc.).
   - `personalizeScore` tweaks those values based on the user profile and evidence weights.
4. **Context multipliers** (experience, aromatase factor, SHBG crush, diet state, training style, injection stability) adjust the raw numbers.
5. **Aggregation**:
   - Genomic vs non-genomic benefit buckets.
   - `rawRiskSum` (pre-interactions, pre-penalties).
   - `byCompound[code] = { benefit, risk, meta }` for UI breakdowns.

#### 2.2.1 Signal vs Drag (Modified Sigmoid w/ Toxicity Penalty)

Simple linear curves could not explain why hypertrophy plateaus while the athlete crashes. The scoring pass now decomposes every compound into two interacting terms derived from the new schema fields:

1. **Anabolic Signal** — now evaluated with the Hill (Emax) model so the nomenclature tracks pharmacology textbooks. For every compound we derive `E_max` from the peak of its `benefitCurve`, estimate `EC_50` from the dose that reaches half that peak (falling back to the default if the curve is sparse), and default the Hill coefficient `n` to 2 unless the compound overrides it. The response at the current dose `C` becomes $$Signal = \frac{E_{\text{max}} \times C^n}{EC_{50}^n + C^n}$$. Higher `potency` values lower the inferred `EC_50`, so Trenbolone rockets upward while milder drugs like Anavar require more exposure to reach the same fraction of `E_max`.

2. **Systemic Drag** — an exponential penalty seeded by `toxicityCoefficient`. It starts near zero but accelerates aggressively for harsh drugs. Values for injectables stay around 0.1–0.2, methylated orals live in the 0.35–0.55 range.

3. **Net Gain** — the per-compound contribution is `Signal - Drag`. Gains plateau when the signal hits its ceiling; they regress only when drag surpasses that asymptote, which usually coincides with the system-load widgets going critical.

Pseudo-code (mirrors the implementation in `stackEngine`):

```ts
const { emax, ec50, hillCoefficient } = deriveHillParams(compound);
const signal = (emax * Math.pow(dose, hillCoefficient)) /
   (Math.pow(ec50, hillCoefficient) + Math.pow(dose, hillCoefficient));
const toxicityDrag = Math.pow(dose * toxicityCoefficient, 1.5);
const netGain = signal - toxicityDrag;
```

This model lets us explain to users that “the drug is still powerful, but your body is failing.” UI components can now plateau the benefit bars, tint the tips red, or fire warnings when drag dominates. Regression is only surfaced when drag > signal **and** system-load buckets cross their critical thresholds, keeping the story aligned: the drug keeps signaling, but the athlete can no longer capitalize because the body is cooked.

#### 2.2.2 Pathway Weights, SHBG Levers, and Synergy Bonuses

Potency alone cannot describe why Proviron “frees up” other steroids or why Dbol still works despite weak AR affinity. Each compound now declares pathway weights:

- `ar` — receptor binding strength (feeds Ki derivation when no explicit `binding.ki` is provided).
- `nonGenomic` — membrane-level cascades, e.g., rapid glycogen storage, nitric-oxide effects.
- `antiCatabolic` — cortisol suppression, SHBG binding, nutrient partitioning, appetite rescue.

During scoring we project the active load onto this vector to build a richer state object. High `ar` entries boost the main signal; high `nonGenomic` entries raise the “fluid/fullness” term (see below); high `antiCatabolic` entries damp the drag curve (representing appetite retention) and apply a SHBG relief multiplier to the rest of the stack. We also compute a **CNS synergy bonus**: when the running `androgenicRating` sum is high and the stack still has headroom (system load < critical), we allow up to +8 % extra anabolic signal, arguing that aggression/CNS drive improves training intensity.

#### 2.2.3 Tissue vs Fluid Split (Hypertrophy Quality)

The “Projected Gains” meter now consists of two explicit components:

1. **Tissue Accretion** — `tissueGain = sigmoid(activeLoad * anabolicRating)` and feeds protein synthesis outputs. This value is what persists after the cycle.
2. **Cosmetic Volume** — `fullnessGain = activeLoad * cosmeticFactor`, bounded to ±3 units. Positive numbers mean water/glycogen/pump (Dbol, Anadrol); negative numbers mean drying out (Winstrol, Masteron).

UI components stack these values so athletes can see “9/10 but mostly water” vs “6/10 but dry, real tissue.” Hooks also compute a tissue-to-fluid ratio for messaging.

#### 2.2.4 Organ-Specific Toxicity Buckets

`toxicityCoefficient` is now a dictionary. Each bucket (`hepatic`, `lipid`, `renal`, `neuro`, `cardio`, etc.) feeds both the exponential drag term and the system-load gauges:

```ts
const organDrag = Object.entries(compound.toxicity).reduce((acc, [organ, coeff]) => {
   const load = Math.pow(activeLoad * coeff, 1.4);
   organLoads[organ] += load;
   return acc + load * organWeights[organ];
}, 0);
```

When multiple compounds hammer the same organ, the bucket trips faster, unlocking specific warnings (e.g., “CRITICAL HEPATIC LOAD” vs “CNS overload”). Mixing organ targets still raises total drag, but it lets the education layer explain why some stacks feel worse than others. The aggregated `organDrag` replaces the old scalar `toxicityDrag` in the Hill expression above.

#### 2.2.5 The Free Hormone Cascade (SHBG Modeling)

Sex Hormone Binding Globulin (SHBG) dictates how much of any androgen is actually free to work. We now model that tug of war explicitly with two metadata hooks on every compound:

- `shbgRelief` (0–10) – how aggressively the compound suppresses hepatic SHBG synthesis (Winny/Proviron score high, Anavar sits mid, injectables usually zero).
- `shbgBindable` (boolean) – whether the compound’s signal jumps when SHBG falls (Testosterone, Equipoise, and other aromatizable injectables are true).

The physics layer turns these flags into a global **Free Hormone Multiplier**:

1. **Aggregate the crushers** – before the main scoring loop we scan `stackInput`, convert each dose to an approximate daily amount, and accumulate `reliefScore += shbgRelief × (ln(dailyMg + 1) / 3.5)`. The log keeps 25 mg Winstrol meaningful without rewarding 100 mg four-fold.
2. **Translate score → multiplier** – `multiplier = clamp(1 + reliefScore / 25, 1.0, 1.35)`. A neutral stack stays at `1.0`, while Winny + Proviron caps around `1.35` (≈ 35 % more free hormone) to avoid runaway feedback.
3. **Boost the victims** – any compound with `shbgBindable = true` has its benefit-side dose multiplied by the new scalar before the Hill curves fire. Thus 500 mg Test behaves like 650 mg if enough SHBG crushers are present, without granting the same bonus to the crushers themselves.

We log the raw score, multiplier, and per-compound contributions into `analytics.shbgSynergy` and surface a “SHBG Synergy Detected” badge whenever the bonus exceeds +5 %. The badge explains *why* the stack suddenly shows more androgen signal (“Winstrol is displacing SHBG, increasing free-testosterone potency by +18 %”), closing the loop between metadata, physics, and UI.

#### 2.2.6 Neural Tone vs Toxicity (Drive vs Fatigue)

Strength perception is not purely anabolic; it is also neurological. To reflect the “wired but tired” experience common with Anadrol, Trenbolone, and other high-androgen compounds, the physics engine now derives a `cnsProfile` inside `calculateCycleMetrics` before the analytics payload is returned:

1. **Drive (Adrenergic Excitation)** – Each compound advertises an `androgenicRating`. During the physics pass we accumulate $$Drive = \sum (androgenicRating \times (\tfrac{weeklyDose}{200})^{0.85})$$ so peak-dose oral stimulants like Halotestin register instantly while gentler agents such as Primobolan barely move the needle.
2. **Fatigue (Systemic Drag)** – Every compound can also provide a `neuroToxicity` flag (falls back to legacy `toxicity.neuro`). We convert those into a neurotoxicity load and blend it with bulk mg pressure plus the finalized `systemLoad.total` percentage: $$Fatigue = (\tfrac{saturationMg}{TOXICITY_{CEILING}})^{1.05} \times 3 + (\tfrac{systemLoad.total}{100}) \times 2.4 + (\tfrac{neuroToxicLoad}{6})^{1.05} \times 1.8$$

The resulting object includes `drive`, `fatigue`, `net`, `state`, `detail`, and `signals` (debug scalars). Downstream we still surface `analytics.workoutQuality`, but it now mirrors `cnsProfile` so UI code can render badges such as “GOD MODE” vs “WIRED BUT TIRED” alongside the numeric telemetry.

#### Receptor Competition & Ki-Based Occupancy

- Every compound may now declare `binding.ki` (nM). When omitted we derive a Ki from `pathways.ar_affinity` by anchoring Testosterone at $K_i = 0.9\text{ nM}$ and scaling inversely with the affinity score. This keeps older data usable while letting us plug in published dissociation constants as they become available.
- Instead of heuristically clamping high-affinity stacks, we compute fractional occupancy with the Law of Mass Action. For each compound we normalize its steady-state exposure (`saturationMg / 400`) and divide by its Ki to obtain a binding term. The fraction of receptors occupied by compound $i$ is then $$\text{Occupancy}_i = \frac{[i]/K_{d,i}}{1 + \sum_j [j]/K_{d,j}}$$ which guarantees the occupancies sum to ≤1 and automatically privileges low-Ki ligands.
- The simulation engine records `analytics.receptorCompetition` with the total occupancy, free fraction, and per-compound breakdown (`{ compound, ki, saturationMg, occupancy }`). UI layers can narrate “Tren monopolizes 62 % of AR sites; only 18 % remain free for Testosterone” without inventing spillover doses.
- Aromatization and DHT conversion now work off the actual free hormone (total saturation load) with no artificial “spill” penalties—the free fraction reported above already implies how much substrate remains for enzymatic conversion.

### 2.3 Interaction Modeling & Non-Linear Corrections

1. **Pair loops**: for each registered pair in `interactionEngineData`, `evaluatePairDimension` computes synergy or penalty deltas using Hill curves, evidence weights, and user sensitivities.
2. **Genomic saturation**: once total genomic load breaches the capacity-adjusted threshold, excess load is logarithmically damped so doubling the milligrams does not double the gains.
3. **Toxicity avalanche**: systemic load beyond the toxicity threshold gets scaled by $1 + (\text{excess}/1500)^{1.5}$.
4. **Global penalties**: heuristics for oral stacking, estrogen imbalance, renal clamps, etc., add additive penalties.
5. **Age/recovery penalties**: final risk is multiplied by `(1 + agePenalty)` and incremented by `recoveryPenalty`.

### 2.4 Analytics Handshake

Before returning, the engine enriches the result with physics data:

1. `calculatePathwayLoads(activeCompounds)` – weights each compound’s pathway contributions and scales them for the Signaling Network dashboard.
2. `buildPhysicsStack(activeCompounds, stackInput)` – transforms weekly doses + frequencies into the canonical shape the physics engine expects (explicit frequency, ester, and normalized dosage per administration).
3. `calculateCycleMetrics` – described in the next section. Its output becomes `metrics.analytics.projectedLabs`, `metrics.analytics.systemLoad`, `metrics.analytics.physicsMeta`, and `metrics.analytics.physicsGains`.

The final object includes:

- `totals`: benefit/risk/net numbers, penalties, suppression score, etc.
- `warnings`: array of safety alerts that the UI surfaces.
- `analytics`: everything chart widgets need.

---

## 3. Physics / Simulation Engine (`src/utils/simulationEngine.js`)

The physics engine is deterministic: the same stack always produces the same labs. It complements the probabilistic score curves by modeling accumulation, ester half-lives, and organ stress.

### 3.1 Input Preparation

Each entry passed from `buildPhysicsStack` contains:

```ts
{
  id: "testosterone",
  dosage: 150,        // mg per administration (daily for orals, per shot for injectables)
  frequency: 3.5,     // injections per week (or 7 for daily ED)
  ester: "enanthate"
}
```

Core helpers:

- `getWeeklyFrequency(freq)` normalizes human strings ("EOD", "3x/wk") and numeric inputs into a multiplier.
- `getActiveMg(dose, esterKey, compound)` multiplies by ester weight to convert total mg to released mg.
- `getSaturationLevel(activeMg, halfLifeHours, frequency)` multiplies `activeMg` by the pharmacokinetic accumulation ratio $R_{ac} = \frac{1}{1 - e^{-k_e \tau}}$, where $k_e = \ln(2) / t_{1/2}$ and $\tau = \frac{168}{\text{frequency}}$ hours (defaulting to weekly pins when unspecified). The ratio is clamped to a safe ceiling (6×) to prevent runaway concentrations when very long half-lives meet ultra-frequent dosing.

### 3.2 Per-Compound Calculations

For each normalized compound:

1. Compute `weeklyDose`, `activeMg`, `saturationMg`, `esterHalfLife`, `loadRatio = saturationMg / 500`, and `relativePotency = efficiencyRatio * loadRatio`.
2. Increment projected gains:
   - Hypertrophy += `igf1 * relativePotency * 1.5`.
   - Strength += `cns_drive * relativePotency * 1.2`.
   - Fat loss += `(cortisol < 0 ? 1 : 0) * relativePotency`.
3. Increment system loads:
   - Cardiovascular += `(rbc || 0) * loadRatio * 2.5`.
   - Hepatic += `(liver_toxicity || 0) * loadRatio * 5.0` (plus extra oral penalties later).
   - Renal += `(renal_toxicity || 0) * loadRatio * 4.0`.
   - Neuro += `(neurotoxicity || 0) * loadRatio * 4.0`.
4. Update lab placeholders:
    - SHBG decreases, HDL decreases, LDL increases, hematocrit increases, creatinine increases based on biomarker weights.
    - `projectedLabs.totalTestosterone += saturationMg * conversionFactor` where available.

#### Biological Floors & Ceilings (Sigmoid Lab Modeling)

Linear deltas made it too easy to predict impossible labs (negative HDL, 3,000 ALT). Each biomarker now flows through a bounded sigmoid so we respect the body’s physiological clamps:

$$LabValue = L_{min} + \frac{L_{max} - L_{min}}{1 + e^{-k\,(Load - Midpoint)}}$$

- **Inputs**:
   - `Load` = the scaled signal we already compute (e.g., hepatic load, androgen load, RBC drive).
   - `L_min` / `L_max` = hard biological floors/ceilings (HDL bottoms around 5 mg/dL, hematocrit tops near 63% before viscosity stalls growth, AST/ALT cap around 400 unless we explicitly simulate failure).
   - `Midpoint` = load where the marker sits halfway between `L_min` and `L_max`.
   - `k` = steepness. Tight curves (`k ≈ 1.4`) give sharp cliffs (HDL crashes fast), smaller values keep things gentle (hematocrit).
- **Effects**:
   - HDL asymptotically approaches its floor, so a brutal oral stack might hit 7 mg/dL but never zero.
   - Hematocrit slows near its ceiling until the system load kill-switch trips, echoing splenic sequestration/viscosity drag.
   - Renal and hepatic markers plateau realistically, preventing “ALT 3,000” memes.
- **Implementation note**: we still calculate a raw `baseline + load * multiplier` internally, but we feed that into the sigmoid as the `Load` term so tuning remains intuitive. Each marker owns its own `[L_min, L_max, Midpoint, k]` tuple inside `simulationEngine`.
5. Collect aromatization totals, anti-estrogen strength, methyl-estrogen load, and nor-19 load for later use.

### 3.3 Oral Stress & Liver Modeling

- Base `liver_toxicity` contributions already increased AST/ALT, but the simulator adds an **oral surge** when daily oral dose exceeds 10 mg:
  - `oralRatio = max(1, dailyDose / 25)`.
  - `oralHepaticSurge = (oralRatio^1.35) * (6 * toxicityTier)`.
  - ALT += `oralHepaticSurge * 2.2`, AST += `oralHepaticSurge * 1.8`, hepatic system load += `oralHepaticSurge * 0.9`.
  - `oralStressLoad` accumulates for use in the global toxicity scalar.

### 3.4 Estradiol & Hormone Modeling

- `aromPressure = totalAromatizableLoad / 350`.
- `aiMitigation = 1 / (1 + antiEstrogenStrength * 0.6)`.
- Estradiol = `min(350, (25 + aromPressure^1.35 * 35) * aiMitigation + methylEstrogenLoad * 0.05)`.
- Value is stored under both `projectedLabs.e2` and `projectedLabs.estradiol` so older UI code keeps working.

### 3.4.1 The 19-Nor Engine (Progesterone / Prolactin Physics)

19-nor compounds behave nothing like the Test + Oral models. Trenbolone, Nandrolone, and Ment hard-bind to both the Androgen and Progesterone receptors, creating gyno risk even when serum Estradiol is low. The simulator now captures that biology through two coupled mechanisms:

1. **Receptor Dominance / Spillover**
    - Each compound contributes an affinity-weighted load: `affinityLoad = saturationMg × affinityMultiplier`. Overrides map Tren (5×), Ment (4×), Nandrolone (1.5×); everything else defaults to 1×.
    - When `Σ affinityLoad` exceeds the receptor ceiling (2,600 mgEq), low-affinity aromatizers (Test, EQ) are “spilled” off the AR. The displaced load routes into `totalAromatizableLoad`, effectively bumping Estradiol even if the user keeps Test constant. This reproduces the “High Tren + High Test = estrogen chaos” anecdote while letting “High Tren + Low Test” stay manageable.

2. **Progesterone / Prolactin Pressure**
    - While iterating compounds we accumulate two signals:
       - `nor19Load = Σ saturationMg × biomarkers.prolactin` (Tren/Nand/Trest carry positive coefficients).
       - `progestinDoseLoad = Σ loadRatio × toxicity.progestogenic` (captures data-layer toxicity bucket).
    - After Estradiol is calculated we blend the signals:
       $$ProgestogenicScore = \max\Big(0, \frac{nor19Load}{600} + \frac{progestinDoseLoad}{8} + \frac{\max(0, E2 - 35)}{50} \Big)$$
    - `systemLoad.progestogenic = clamp(ProgestogenicScore × 12, 0, 100)` becomes the new Hormonal Pressure bucket, while `projectedLabs.prolactin = min(60, 12 + ProgestogenicScore × 6)` feeds the labs UI. High Estradiol amplifies Progesterone receptor density, so stacking Deca + high E2 explodes the score just like in real bloodwork.

The net effect: users finally see prolactin warnings trip on Tren/Nand cycles even when serum E2 looks “normal,” and they understand why lowering their Test dose (reducing displacement) calms everything down.

### 3.5 System Load Total & Kill Switch

1. Raw toxicity = sum of cardiovascular + hepatic + renal + neuro buckets.
2. Convert to percent using a harsher divisor (60) and add `oralStressLoad`.
3. Add mg-based pressure: if `totalSaturationMg / TOXICITY_CEILING > 0.4`, apply `((pressure - 0.4)^1.1) * 140`.
4. Apply **critical penalty multiplier** when labs breach thresholds:
   - HDL < 30 (+0.3, with another +0.6 when < 20).
   - LDL > 180 (+0.3).
   - ALT or AST > 80 (+0.4).
   - Creatinine > 1.4 (+0.5).
5. Cap at 100 and compute the dominant pressure (largest of the four buckets) for UI highlighting.

### 3.6 Final Output

```ts
return {
  projectedGains,   // hypertrophy, strength, fatLoss, composite
  systemLoad,       // per-bucket totals + % + dominantPressure
  projectedLabs,    // lab panel consumed by UI
  meta: { totalActiveMg, totalSaturationMg, efficiencyRatio },
};
```

This object is stored under `metrics.analytics` by the stack engine.

### 3.7 Time-Series Pharmacokinetics (Roadmap)

The current physics pass compresses each compound into a steady-state snapshot. That is sufficient for ranking stacks, but it does not capture **peaks, troughs, or day-level load swings**. Users planning front-loaded blasts or staggered oral windows keep asking why the labs look identical even when they reshuffle injection timing. We need a time-series model to answer those questions.

#### 3.7.1 What Is Missing Today

- **Temporal nuance**: All calculations assume instantaneous steady state. A 2× loading dose and a smooth taper collapse into the exact same `saturationMg` even though their trajectories differ for ~10 days.
- **Oral day curves**: We spike AST/ALT using daily dose, but HDL, LDL, cortisol, estradiol, and neuro load never see the intra-week oscillations that short half-life agents create.
- **UI hooks**: Charts such as Cycle Evolution, Dose Efficiency, and future “PK rail” concepts need a real timeline so they can render daily dots instead of re-using aggregate values.

#### 3.7.2 Daily Decay Loop Proposal

1. **Expand the schedule**: For each stack entry, generate explicit administrations (timestamp + mg). Injectables use `frequency` to decide spacing, orals always add seven daily events per week.
2. **Translate half-life to decay constant**: For an ester half-life $t_{1/2}$ (in hours), compute $\lambda = \ln 2 / t_{1/2}$.
3. **Iterate the timeline**: Step through a configurable horizon (e.g., 60 days) in 24-hour increments. At each step:
   - Add the dose(s) due for that day to the compound’s active pool.
   - Apply exponential decay: $$\text{activePool}_{t+1} = (\text{activePool}_t + \text{dose}_t) \times e^{-\lambda \Delta t}$$ where $\Delta t$ is 24 hours.
   - Derive labs/system loads from that **daily** active pool instead of the steady-state approximation.
4. **Aggregate for UI**: Persist the daily vectors under `physicsMeta.timeline` so components can pull either the raw series (sparklines) or derived stats (max, min, time above threshold).

This loop gives us a natural place to inject oral grace periods, circadian multipliers, or “missed shot” penalties later because timing becomes explicit.

#### 3.7.3 Data Shape & Integration Plan

- **New objects**: Store `timeline.days[] = { dayIndex, activeMgByCompound, labs, systemLoadBuckets }` so both dashboards and future exports can consume the same structure.
- **Back-compat**: Continue computing the existing steady-state snapshot by averaging the daily data. That way legacy components (RightInspector, LabReportCard) can read the same fields until they are upgraded to stream-aware versions.
- **Computational budget**: 60 days × ~15 compounds × <10 biomarkers per compound is still trivial (<50 k operations) in JavaScript, so running this loop on every stack change is safe.

#### 3.7.4 Validation Checklist

1. Compare daily curves for known pharmacokinetic profiles (e.g., Test E, Test P, Anadrol) against reference calculators.
2. Ensure the day 42 snapshot aligns with the current steady-state numbers (regression test).
3. Verify UI components gracefully handle the richer analytics object before flipping the feature flag.

Documenting this plan here keeps the entire team aligned on how the future PK upgrade will look. When the decay loop lands, update this section with concrete APIs and references.

---

## 4. Analytics Consumers (Where the Numbers Go)

| Consumer | File | Inputs | Output |
| --- | --- | --- | --- |
| **Projected Labs panel** | `src/components/dashboard/RightInspector.jsx` | `metrics.analytics.projectedLabs` | Bullet charts with warning gradients. HDL colors are inverted (low HDL = red). |
| **Virtual Phlebotomist card** | `src/components/dashboard/LabReportCard.jsx` | Same labs + `metrics.totals` | Rows w/ status chips (critical/warning/normal) plus contextual banners (e.g., methyl-E2). |
| **System load hook** | `src/hooks/useSystemLoad.ts` | `metrics.analytics.systemLoad`, `metrics.analytics.pathwayLoads`, `metrics.analytics.projectedLabs` | Gauge + category bars with domain-specific penalties (LDL, hematocrit, AST/ALT, creatinine). |
| **Dose Efficiency / Evolution charts** | `src/components/dashboard/*` | `metrics.totals`, `metrics.analytics.physicsGains`, time-scrubbed snapshots | Visualize anabolic vs toxicity curves, highlight Sweet Spot mgEq. |
| **Warnings banners** | `StackContext` consumer components | `metrics.warnings` | Tooltips/banners for missing Test base, renal clamp, oral synergy, etc. |
| **TabbedChartCanvas** (recently updated) | `src/components/dashboard/TabbedChartCanvas.jsx` | `metrics.analytics` (varies per tab) | Multi-tab visualization canvas that shares projected labs/system load depending on active tab. |

The important takeaway: **all** UI layers pull from the same `metrics` object. If you change the math in `simulationEngine` or `stackEngine`, every visualization updates automatically.

---

## 5. Worked Example (Putting It All Together)

Suppose a user selects `1,000 mg/week Testosterone Enanthate` and `100 mg/day Anadrol`.

1. **Stack input**: Two entries are stored in `StackContext`.
2. **Normalization**: Testosterone stays at 1,000 mg/week; Anadrol becomes 700 mg/week (100 × 7).
3. **Per-compound scoring**:
   - Benefit curves award large hypertrophy values, but Anadrol’s risk curve + aromatase scalar jack up `rawRiskSum`.
4. **Interactions**: Anadrol + Testosterone triggers cardiovascular penalties via `interactionEngineData`.
5. **Physics engine**:
   - Total aromatizable load from Testosterone pushes estradiol toward 150–200 pg/mL.
   - Oral surge logic detects 100 mg/day Anadrol, forcing AST/ALT toward triple digits and injecting huge hepatic load.
   - Kill switch multiplies `systemLoad.total`, so `useSystemLoad` shows 80–90% with “Hepatic” as dominant pressure.
6. **UI**:
   - Lab cards glow red for HDL, LDL, AST/ALT, estradiol.
   - Dose Efficiency chart shows toxicity line piercing the anabolic line.

If any of the above steps look wrong, inspect `compoundData` for missing biomarkers, then walk through `evaluateStack` and `simulationEngine` with those values in mind.

---

## 6. Extending & Debugging the Model

### 6.1 Adding or Editing a Compound

1. Create/modify the entry in `compoundData`.
2. Double-check:
   - `benefitCurve`/`riskCurve` cover realistic dosing.
   - `biomarkers` include every downstream effect (liver, renal, IGF, CNS, anti-e, etc.).
   - `flags` communicate aromatization, AI behavior, methyl-estrogen creation, blood-pressure impact.
   - `toxicityTier` makes sense for oral vs injectable use.
3. Optional: add interaction definitions in `interactionEngineData` for special pair behavior.

### 6.2 Tuning Physics Outputs

- Adjust the multipliers next to `projectedLabs` changes if a biomarker universally undershoots (e.g., HDL drop per `loadRatio`).
- For extreme discrepancies, tweak the oral surge constants or the mg-based pressure exponent.
- Re-run a known “stress test” stack (1.4 g Test + 150 mg/day Anavar) to confirm HDL, LDL, LFTs, and system load spike appropriately.

### 6.3 Adding New Metrics

1. Extend `projectedLabs` or `systemLoad` in `simulationEngine`.
2. Expose those through `metrics.analytics` (automatic once you mutate the object).
3. Consume via contexts/hooks/components (e.g., add a new row to `LabReportCard` or new category in `useSystemLoad`).

### 6.4 Debug Checklist

- **Missing biomarker?** Check `compoundData` entry first.
- **Unexpected lab value?** Log `physicsMetrics.projectedLabs` inside `stackEngine` to inspect raw numbers before UI formatting.
- **System load too low?** Inspect `systemLoad` buckets + `oralStressLoad` + `criticalPenaltyMultiplier`.
- **Curve mismatch?** Use `evaluateCompoundResponse` directly in a test to ensure your new curve data interpolates correctly.

---

Keep this handbook updated whenever you change the math layer. A future contributor should be able to read it and, without prior exposure to physioSim, understand how a dose typed into the UI becomes a warning, lab value, or toxicity spike on screen.
