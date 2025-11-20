This is the **PhysioSim v2.0 Design Standard**.

This document bridges the gap between "looking cool" and "production engineering." It is designed to be handed directly to a frontend developer. It solves the "Tech Debt" issue by enforcing a **strict Design Token system**—if a value isn't in the token list, it doesn't exist in the code.

### 1. Core Design Philosophy: "The Linear Standard"
We are moving away from "Neon Gaming UI" to **"Pro-Grade Bio-Engineering."**
* **Principle A: Borders, not Backgrounds.** We do not use different background colors to separate sections. We use a single deep background and separate content with 1px subtle borders.
* **Principle B: Inner Glows.** Active elements don't drop shadows *outwards*; they glow *inwards* or emit a subtle colored light, mimicking an OLED screen.
* **Principle C: Information Density.** We use the "Compact" scale. No wasted whitespace.

---

### 2. The Design Tokens (Source of Truth)
**Action:** Delete all current hardcoded colors. Copy these into your `tailwind.config.js` or CSS Variables root.

#### **A. The "OLED Gunmetal" Palette**
* `bg-main`: `#0B0C0E` (The void. Not pure black, but 98% black.)
* `bg-surface`: `#13151A` (The card surface. Slightly cooler grey.)
* `bg-surface-hover`: `#1A1D23` (Interaction state.)
* `border-subtle`: `rgba(255, 255, 255, 0.06)` (The default separator.)
* `border-highlight`: `rgba(255, 255, 255, 0.12)` (Hover borders.)

#### **B. The "Bio-Luminescent" Accents**
* `primary-indigo`: `#5E6AD2` (Use for "Optimize" buttons and sliders.)
* `signal-green`: `#27D796` (Use for "Normal" range and positive deltas.)
* `signal-orange`: `#F3A041` (Use for Warnings.)
* `signal-red`: `#E05555` (Use for Critical/Redline.)

#### **C. Effects (The "Secret Sauce")**
* `glass-panel`: `backdrop-filter: blur(12px); background: rgba(19, 21, 26, 0.7);`
* `glow-primary`: `box-shadow: 0px 0px 12px rgba(94, 106, 210, 0.4);`
* `glow-green`: `box-shadow: 0px 0px 12px rgba(39, 215, 150, 0.3);`

---

### 3. Component Specifications

#### **A. The "Active Mixture" Rail (Left Sidebar)**
* **Transformation:** Currently, it feels like a separate widget. We will integrate it as a "Command Strip."
* **Styling:**
    * **Input Cards:** Remove the distinct background. Use a `border-subtle` outline.
    * **Sliders:**
        * **Track:** 2px height, color `#2A2E35`.
        * **Thumb:** 12px circle, `primary-indigo` fill, with `glow-primary`.
        * **Interaction:** On hover, the thumb scales to 14px and the glow intensity doubles.
    * **Typography:** Compound names (e.g., "Anavar") in **Inter** (Sans), dosage numbers in **JetBrains Mono** (Code).

#### **B. The "Virtual Phlebotomist" (Right Rail)**
* **Transformation:** Convert the "List of text" into a **"Bento Grid" of micro-charts.**
* **New Layout:**
    * Create small 120px wide x 60px tall "Cells" for each vital.
    * **Visual:**
        * Top Left: Label (`LDL`).
        * Top Right: Live Value (`111`).
        * Bottom: A **Bullet Chart** (Horizontal bar).
            * Background Bar: Dark Grey (Range).
            * Foreground Bar: White (Current Value).
            * Vertical Tick: The "Max Safe" limit.
    * **Logic:** If the white bar passes the vertical tick, the bar turns `signal-orange` and glows.

#### **C. The Sankey Diagram (Center Stage)**
* **Transformation:** "Cables, not Ribbons."
* **Style:**
    * **Nodes:** Small pills with `border-highlight` and `bg-surface`.
    * **Lines:** Reduce opacity to 20% by default.
    * **Hover Effect:** When hovering "NPP", all unrelated lines fade to 5% opacity. The "NPP" lines surge to 80% opacity and turn `primary-indigo`.
    * **Motion:** Add a slow "pulse" animation (2s duration) to any node exceeding 85% capacity.

---

### 4. Implementation & Migration Plan (Removing Tech Debt)

To ensure we don't just pile new code on top of old code, follow this "Strangler Fig" refactoring path:

* **Phase 1: The Purge**
    * Search your codebase for `box-shadow`. Remove all "drop shadows" (shadows that go downwards). Replace them with the `glow-*` classes defined above.
    * Search for `border-radius`. Replace all values > `12px` with `8px` (Standard) or `4px` (Tight).
    * Delete any CSS class that references a hardcoded color like `#000000` or `#121212`. Replace with `var(--bg-main)`.

* **Phase 2: The "Ghost" Wireframe**
    * For the Empty State (Image 4), implement a background SVG pattern of faint grid lines and chemical hexagons (opacity 2%). This prevents the "Black Void" feeling without adding noise.

* **Phase 3: Component Isolation**
    * Build the **"Phlebotomist Cell"** as a React/Vue component in isolation. It must take `value`, `min`, `max`, and `label` as props. Once perfect, swap out the entire Right Rail.

