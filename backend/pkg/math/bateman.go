package math

import "math"

// CalculateConcentration models single dose concentration over time using the Bateman function.
// dose is administered mass in mg, ka is absorption rate constant, ke is elimination rate constant,
// time is elapsed time in days.
func CalculateConcentration(dose float64, ka float64, ke float64, t float64) float64 {
	if dose <= 0 || ka <= 0 || ke <= 0 || t < 0 {
		return 0
	}

	if math.Abs(ka-ke) < 1e-9 {
		return dose * math.Pow(ka, 2) * t * math.Exp(-ke*t)
	}

	coef := dose * ka / (ka - ke)
	return coef * (math.Exp(-ke*t) - math.Exp(-ka*t))
}
