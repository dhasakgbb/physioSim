# AAS Dose-Response Tool - Quick Start Guide

## 🚀 Get Started in 3 Minutes

### Step 1: Install Dependencies

```bash
cd /Users/damian/GitHub/physioSim
npm install
```

**Time: 15-30 seconds**

---

### Step 2: Run Development Server

```bash
npm run dev
```

**Opens at:** `http://localhost:5173`

**Time: 2-3 seconds**

---

### Step 3: Explore the Tool

1. **Default View**: Integrated view (Benefit + Risk curves for all 6 compounds)
2. **Hover**: Mouse over any data point to see detailed tooltip
3. **Toggle View**: Click "Benefit View" or "Risk View" buttons
4. **Hide/Show**: Click compound names in legend to toggle visibility
5. **Methodology**: Click "Methodology" buttons to see evidence details
6. **Export**: Click "Export PDF Report" to download full documentation

---

## 🧪 Run Tests

```bash
npm test
```

**Expected:** 29 tests passing (21 data validation + 8 component tests)

**Time: <1 second**

---

## 🏗️ Build for Production

```bash
npm run build
```

**Output:** `dist/` folder ready for deployment

**Time: 2-3 seconds**

---

## 📱 Test Responsive Design

Open in browser and use DevTools:
- **Mobile**: 375px width (iPhone SE)
- **Tablet**: 768px width (iPad)
- **Desktop**: 1440px+ width

---

## ✅ Verification Checklist

After starting the app, verify:

- [ ] All 6 compounds visible in legend (Test, NPP, Tren, EQ, Masteron, Primo)
- [ ] Disclaimer banner visible at top (yellow with warning icon)
- [ ] View toggle buttons working (Benefit/Risk/Integrated)
- [ ] Chart renders with solid lines (benefit) and dotted lines (risk)
- [ ] Uncertainty bands visible (shaded regions around curves)
- [ ] Hover tooltips show up on mouse over data points
- [ ] Tooltips display Tier, Source, Caveat, CI
- [ ] Methodology buttons open detailed cards
- [ ] Legend toggles hide/show compounds
- [ ] PDF export button present (top right)
- [ ] Responsive on mobile (stacked layout)

---

## 🎯 Critical Data Points to Verify

### Testosterone (Blue)
- **100mg**: Benefit ≈ 0.83, Risk ≈ 0.2
- **600mg**: Benefit = 5.0, Risk ≈ 2.1
- **Tier 1** (0-600mg empirical data)

### Trenbolone (Red) - CRITICAL
- **300mg**: Benefit ≈ 4.33, Risk ≈ 3.2
- **400mg**: Benefit = 4.87, Risk ≈ 4.2
- **500-1200mg**: Benefit = 4.87 (FLAT plateau, NOT declining)
- **Wide uncertainty band** (±0.63 at plateau)
- **Tier 4** (no human data; anecdotal)

### NPP (Orange)
- **300mg**: Benefit = 3.0, Risk ≈ 1.5
- **600mg**: Benefit ≈ 3.25, Risk = 3.0 (prolactin-driven)
- **Tier 2/3** (therapeutic extrapolated)

---

## 🔍 Troubleshooting

### Issue: `npm install` fails
**Solution:** Check Node.js version (need 18+)
```bash
node --version  # Should be v18.0.0 or higher
```

### Issue: Port 5173 already in use
**Solution:** Kill existing process or use different port
```bash
npm run dev -- --port 3000
```

### Issue: Tests fail
**Solution:** Check if jsdom is installed
```bash
npm install -D jsdom happy-dom
npm test
```

### Issue: Chart not rendering
**Solution:** Check browser console for errors; ensure Recharts loaded

### Issue: PDF export fails
**Solution:** Check browser allows downloads; try different browser

---

## 📚 Next Steps

1. **Read README.md** - Comprehensive documentation
2. **Read DESIGN.md** - Evidence basis & methodology
3. **Read IMPLEMENT.md** - Technical specs & data sources
4. **Read VERIFICATION.md** - Requirements checklist
5. **Read BUILD_SUMMARY.md** - Build status & test results

---

## 🎓 Understanding the Tool

### Evidence Tiers

- **Tier 1 (Green)**: Human RCT data (highest confidence)
  - Example: Test 0-600mg (Bhasin et al.)
  
- **Tier 2 (Blue)**: Clinical data extrapolated
  - Example: NPP therapeutic doses scaled up
  
- **Tier 3 (Yellow)**: Animal studies + HED scaling
  - Example: Tren rat studies converted to human doses
  
- **Tier 4 (Red)**: Theory + community reports (lowest confidence)
  - Example: Tren plateau at 300mg (forum consensus)

### Uncertainty Bands

- **Narrow band** (Tier 1): ±0.15 (high confidence)
- **Medium band** (Tier 2/3): ±0.3-0.5 (medium confidence)
- **Wide band** (Tier 4): ±0.6-0.8 (low confidence, speculative)

**Wider = less certain** - This is by design to show uncertainty honestly.

### Tooltip Information

When you hover over a data point, you see:
- **★ Score**: Benefit or risk value (0-5.5 scale)
- **Tier**: Evidence level (1/2/3/4)
- **Source**: Study or method (e.g., "Bhasin et al. 1996")
- **Caveat**: Explanation of limitations
- **Confidence**: ±CI with High/Medium/Low label

---

## ⚠️ Remember

**This tool is for educational purposes only.**

- NOT medical advice
- NOT a prescription for dosing
- Individual responses vary ±20-30%
- Consult healthcare provider before using AAS
- These compounds are controlled substances

**Use as a thinking tool for understanding risk/benefit tradeoffs.**

---

## 🏆 Success Criteria

You'll know the tool is working correctly if:

✅ All 29 tests pass  
✅ Tren benefit is FLAT post-300mg (4.87 at 400-1200mg)  
✅ Uncertainty bands visible and proportional to confidence  
✅ Tooltips show Tier/Source/Caveat/CI  
✅ Methodology cards display full evidence breakdown  
✅ PDF export generates 8+ page report  
✅ Responsive on mobile/tablet/desktop  
✅ No console errors  

---

## 📞 Support

- **GitHub Issues**: [https://github.com/yourusername/physioSim/issues](https://github.com/yourusername/physioSim/issues)
- **Documentation**: See README.md, DESIGN.md, IMPLEMENT.md

---

**Ready to go!** 🚀

Run `npm run dev` and start exploring the tool.

