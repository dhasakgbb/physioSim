package math

import "math"

const (
	// DefaultToxicityVMax represents the theoretical max toxicity score we allow a compound to reach.
	DefaultToxicityVMax = 100.0
	// DefaultToxicityKm is the concentration (mg/L equivalent) at which toxicity hits 50% of Vmax.
	DefaultToxicityKm = 250.0
)

// CalculateToxicity computes a saturation curve using Michaelis-Menten kinetics.
// concentration is the instantaneous serum concentration from the Bateman model.
// vmax and km can be tuned per compound or scenario; defaults are provided above.
func CalculateToxicity(concentration, vmax, km float64) float64 {
	if concentration <= 0 || vmax <= 0 {
		return 0
	}
	km = math.Max(km, 1e-9)

	return vmax * concentration / (km + concentration)
}
