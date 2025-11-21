import { describe, expect, it } from "vitest";
import { evaluateHillSignal } from "../stackEngine.js";

const buildMeta = (overrides = {}) => ({
  benefitCurve: [
    { dose: 0, value: 0 },
    { dose: 200, value: 4 },
    { dose: 600, value: 8 },
    { dose: 1000, value: 9 },
  ],
  basePotency: 1,
  ...overrides,
});

describe("evaluateHillSignal", () => {
  it("derives Emax and EC50 from benefit curves", () => {
    const meta = buildMeta();
    const { params } = evaluateHillSignal(0, meta);
    expect(params.emax).toBeCloseTo(9, 4);
    expect(params.ec50).toBeGreaterThan(200);
    expect(params.ec50).toBeLessThan(600);
  });

  it("produces saturating responses at high doses", () => {
    const meta = buildMeta();
    const low = evaluateHillSignal(200, meta).value;
    const high = evaluateHillSignal(1000, meta).value;
    const { params } = evaluateHillSignal(1000, meta);

    expect(high).toBeGreaterThan(low);
    expect(high).toBeLessThanOrEqual(params.emax + 1e-6);
  });

  it("respects potency overrides when deriving EC50", () => {
    const baseline = buildMeta({ benefitCurve: [] });
    const potent = buildMeta({ benefitCurve: [], signal: { potency: 2 } });

    const baselineParams = evaluateHillSignal(400, baseline).params;
    const potentParams = evaluateHillSignal(400, potent).params;

    expect(potentParams.ec50).toBeLessThan(baselineParams.ec50);
  });
});
