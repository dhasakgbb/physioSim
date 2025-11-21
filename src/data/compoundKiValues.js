// Ki Values for Androgen Receptor Binding
// All values in nM (nanomolar)
// Source: Derived from AR RBA studies (Saartok 1984 set) + direct measurements

export const compoundKiValues = {
  testosterone: {
    ki: 0.90,
    kiSource: "Anchor; high-affinity AR assays & structural data",
    isDirectMeasurement: true,
  },

  dht: {
    ki: 1.00,
    kiSource: "Derived from AR RBA 60–120% vs T (mid 90%)",
    derivedFrom: { rbaPercent: 90, formula: "0.9 * 100 / 90" },
  },

  eq: {
    ki: 1.44,
    kiSource: "Derived from AR RBA 50–75% vs T (mid 62.5%)",
    derivedFrom: { rbaPercent: 62.5, formula: "0.9 * 100 / 62.5" },
  },

  nandrolone: {
    ki: 0.58,
    kiSource: "Derived from AR RBA 154–155% vs T (mid 154.5%)",
    derivedFrom: { rbaPercent: 154.5, formula: "0.9 * 100 / 154.5" },
  },

  trenbolone: {
    ki: 0.47,
    kiSource: "Derived from AR RBA 190–197% vs T (mid 193.5%)",
    derivedFrom: { rbaPercent: 193.5, formula: "0.9 * 100 / 193.5" },
  },

  trestolone: {
    ki: 0.80,
    kiSource: "Derived from AR RBA 100–125% vs T (mid 112.5%)",
    derivedFrom: { rbaPercent: 112.5, formula: "0.9 * 100 / 112.5" },
  },

  dienolone: {
    ki: 0.67,
    kiSource: "Derived from AR RBA 134% vs T",
    derivedFrom: { rbaPercent: 134, formula: "0.9 * 100 / 134" },
  },

  dimethyldienolone: {
    ki: 0.74,
    kiSource: "Derived from AR RBA 122% vs T",
    derivedFrom: { rbaPercent: 122, formula: "0.9 * 100 / 122" },
  },

  dimethyltrienolone: {
    ki: 0.46,
    kiSource: "Derived from AR RBA 180–210% vs T (mid 195%)",
    derivedFrom: { rbaPercent: 195, formula: "0.9 * 100 / 195" },
    note: "aka metribolone (but NOT R1881)",
  },

  normethandrone: {
    ki: 0.62,
    kiSource: "Derived from AR RBA 146% vs T",
    derivedFrom: { rbaPercent: 146, formula: "0.9 * 100 / 146" },
  },

  levonorgestrel: {
    ki: 1.05,
    kiSource: "Derived from AR RBA 84–87% vs T (mid 85.5%)",
    derivedFrom: { rbaPercent: 85.5, formula: "0.9 * 100 / 85.5" },
  },

  norethisterone: {
    ki: 2.05,
    kiSource: "Derived from AR RBA 43–45% vs T (mid 44%)",
    derivedFrom: { rbaPercent: 44, formula: "0.9 * 100 / 44" },
  },

  norgestrienone: {
    ki: 1.29,
    kiSource: "Derived from AR RBA ~70% vs T",
    derivedFrom: { rbaPercent: 70, formula: "0.9 * 100 / 70" },
  },

  tibolone_delta4: {
    ki: 1.29,
    kiSource: "Derived from AR RBA 70% vs T (Δ4-Tibolone)",
    derivedFrom: { rbaPercent: 70, formula: "0.9 * 100 / 70" },
  },

  oxandrolone: {
    ki: 62.0,
    kiSource: "BindingDB human AR Ki (direct measurement)",
    isDirectMeasurement: true,
    anomalyNote: "Unexpectedly weak binding (~69× weaker than T); clinical effects may involve non-AR mechanisms or metabolic activation",
  },
};
