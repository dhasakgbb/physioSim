This Design Document (DD) outlines the architectural and aesthetic refactoring of **physioSim** from a "Cyberpunk/Gaming" interface to a **Google Material Enterprise (GM3) High-Density Workstation**.

This specification mirrors the standards used in **Google Cloud Console**, **TensorBoard**, and **Google Analytics 4**.

---

# 1. Design Philosophy: The "Trader's Terminal"

The current UI prioritizes "immersion" (neon, glow, dark contrasts). The new UI prioritizes **signal-to-noise ratio** and **precision**.

- **Core Shift:** From "Game Interface" $\rightarrow$ "Bio-Analytics Workstation."
- **Visual Hierarchy:** Data comes first. Controls come second. Chrome (borders/backgrounds) comes last.
- **Density:** "High/Compact." We assume the user is an expert (Intermediate/Advanced Lifter) who does not need large touch targets or explanatory fluff.

---

# 2. Foundation System (The "Skin")

### 2.1 Color Palette (Material Dark Theme)

We abandon the pure `#000000` black for semantic dark grays to reduce eye strain and allow for elevation depth.

| Role                  | Hex Code  | Usage                                                                 |
| :-------------------- | :-------- | :-------------------------------------------------------------------- |
| **Surface Base**      | `#1E1F22` | Main application background (Not pitch black).                        |
| **Surface Container** | `#2B2D31` | Panels (Active Mixture, Vitals).                                      |
| **Surface Bright**    | `#3C4043` | Input fields, cards, hover states.                                    |
| **Primary**           | `#8AB4F8` | (Google Blue) Active selections, primary buttons, anabolic signaling. |
| **Secondary**         | `#C58AF9` | (Google Violet) Secondary compounds, complex signaling.               |
| **Error/Critical**    | `#F28B82` | (Google Red) Liver toxicity, lipid stress, critical alerts.           |
| **Warning**           | `#FDD663` | (Google Yellow) Diminishing returns, borderline values.               |

### 2.2 Typography

- **Headings:** _Google Sans_ (Medium/Bold).
- **Body/Labels:** _Roboto_.
- **Data/Code:** _Roboto Mono_ or _JetBrains Mono_. (Crucial for aligning numerical tables like bloodwork).

---

# 3. Global Layout & Navigation (The "Skeleton")

The layout shifts from a rigid Grid to a **Flexible Panel System**.

### 3.1 The App Shell

- **Top App Bar (Height: 48dp):**
  - **Left:** Logo + Cycle Name ("Bulking Cycle 2025") [Dropdown to switch scenarios].
  - **Center:** Tabs: `Explore` (Charts), `Signaling` (Sankey), `Optimize` (Solver).
  - **Right:** `Export`, `Save`, `User Profile`.
- **Left Sidebar (Inputs):** Collapsible "Property Inspector" drawer.
- **Right Sidebar (Outputs):** Collapsible "Telemetry" drawer.
- **Main Stage:** The center content area (Context-aware).

---

# 4. View-Specific Specifications

### 4.1 The Left Panel: "Active Mixture" (Refactor)

_Current Problem:_ Large cards take up too much vertical space. Sliders are imprecise.

- **Refactor Goal:** **Data Grid / Property Inspector**.
- **Component:** `Compact List` with `Input Groups`.
- **Layout:**
  - **Row 1:** **Compound Name** (Bold, e.g., "Test Enanthate").
  - **Row 2:** **Input Field** (Numeric box, e.g., `500`) + **Unit** (`mg/wk`).
  - **Row 3:** **Micro-Slider** (A thin line below the input for coarse adjustment).
- **Visuals:** Remove the "X" and gear icons. Use a "Meatball Menu" (`...`) for advanced options (ester selection).
- **Add Button:** A persistent "Tonal Button" at the bottom: `+ Add Compound`.

### 4.2 The Right Panel: "Projected Vitals" (Refactor)

_Current Problem:_ Wall of text. Red text is hard to read.

- **Refactor Goal:** **Telemetry Dashboard**.
- **Component:** `Data Table` with Sparklines.
- **Layout:**
  - **Header:** Metrics grouped by system (Cardiovascular, Hepatic, Renal).
  - **Rows:**
    - **Col 1 (Status):** A 4px colored vertical bar (Green/Yellow/Red) indicating risk.
    - **Col 2 (Label):** "LDL Cholesterol".
    - **Col 3 (Value):** "225" (Mono font).
    - **Col 4 (Trend):** A small SVG sparkline showing the value over the 12-week timeline.
- **Alerts:** "Critical" is no longer a text label. It is an Icon (⚠️) that shows a tooltip on hover.

### 4.3 View A: Dose Efficiency (The Chart)

_Reference Image: `image_0428fe.jpg`_

- **Transformation:**
  - **Library:** Migrate to **Apache ECharts** or **Plotly** (WebGL).
  - **Grid:** Introduce a visible, faint gray grid (`#444`) for precise reading.
  - **Cursors:** Crosshair cursor that snaps to data points (TradingView style).
  - **Areas:** Replace hatched red lines with solid, low-opacity fills (`rgba(242, 139, 130, 0.1)`).
  - **Legend:** Move outside the chart area to the top-right corner to prevent data occlusion.
  - **Annotations:** The "Diminishing Returns" vertical line becomes a dashed yellow line with a text label anchored to the top axis.

### 4.4 View B: Signaling (The Sankey)

_Reference Image: `image_0428f7.jpg`_

- **Transformation:**
  - **Nodes:** Rectangles with rounded corners (4dp). Background: `Surface Bright`.
  - **Links (Ribbons):** Reduce opacity to 40% so overlapping paths are visible.
  - **Interactivity:**
    - **Hover State:** Dim all paths _except_ the one connected to the hovered node (Focus Mode).
  - **Metrics:** "Hypertrophy Score" bubbles move to a structured column on the far right, aligned vertically for comparison.

### 4.5 View C: Optimization (The Solver)

_Reference Image: `image_0428d9.jpg`_

- **Transformation:**
  - **Format:** Change from "Big Cards" to **Expansion Panels** (Accordions).
  - **Selection:** "Peak Efficiency", "Max Tolerable Load", and "Redline" become Radio Button groups.
  - **Action:** The "Advanced Personalization" toggle becomes a "More Options" dropdown.
  - **Biometrics Form:** Convert to a 2-column grid. Use `OutlinedInput` with floating labels (Standard Material Design).
  - **Button:** The "Run Optimization" button becomes a FAB (Floating Action Button) or a sticky footer button, ensuring it's always accessible.

---

# 5. Migration Plan & Technologies

### Phase 1: The Shell & State (Weeks 1-2)

- **Action:** Build the generic Angular/React shell with the Sidebar and Top Bar layout.
- **Key Tech:** `Angular Material` (Components) or `MUI` (React).
- **Deliverable:** A blank dashboard with working collapsing sidebars and theme toggling.

### Phase 2: The Visualization Engine (Weeks 3-4)

- **Action:** Replace current chart library with **ECharts**.
- **Focus:** Replicate the "Dose Efficiency" chart. Ensure the curve smoothing matches the current "physioSim" math logic but renders on an HTML5 Canvas.

### Phase 3: The Input Grid (Week 5)

- **Action:** Refactor the "Active Mixture" panel.
- **Logic:** Bind the inputs to the state manager (NgRx/Redux). Ensure typing "500" updates the chart instantly (Reactive Programming).

### Phase 6. Next Step

To begin this migration, I can provide the **CSS/Styling definitions** for the "Google Enterprise Dark Mode" (the specific hex codes, box shadows, and font weights) so you can immediately apply the "skin" before refactoring the layout.
