package math

import "math"

const (
	DefaultAnabolicMaxEffect = 100.0
	DefaultAnabolicEC50      = 200.0
	DefaultAnabolicHillCoeff = 2.0
)

// CalculateAnabolicEffect computes anabolic response using a Hill equation.
func CalculateAnabolicEffect(concentration, ec50, hillCoeff, maxEffect float64) float64 {
	if concentration <= 0 || maxEffect <= 0 {
		return 0
	}
	if hillCoeff <= 0 {
		hillCoeff = 1
	}
	ec50 = math.Max(ec50, 1e-9)

	numer := maxEffect * math.Pow(concentration, hillCoeff)
	denom := math.Pow(ec50, hillCoeff) + math.Pow(concentration, hillCoeff)
	return numer / denom
}
