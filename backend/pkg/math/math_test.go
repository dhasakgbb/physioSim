package math

import (
	"math"
	"testing"
)

func TestCalculateConcentration(t *testing.T) {
	got := CalculateConcentration(100, 1.5, 0.5, 2)
	if got <= 0 {
		t.Fatalf("expected positive concentration, got %f", got)
	}

	symmetric := CalculateConcentration(50, 1.0, 1.0, 1.0)
	expected := 50 * math.Pow(1.0, 2) * 1.0 * math.Exp(-1.0)
	if math.Abs(symmetric-expected) > 1e-9 {
		t.Fatalf("unexpected symmetric limit value: got %f want %f", symmetric, expected)
	}
}

func TestCalculateToxicity(t *testing.T) {
	if toxicity := CalculateToxicity(0, DefaultToxicityVMax, DefaultToxicityKm); toxicity != 0 {
		t.Fatalf("expected zero toxicity for zero concentration, got %f", toxicity)
	}

	mid := CalculateToxicity(DefaultToxicityKm, DefaultToxicityVMax, DefaultToxicityKm)
	if diff := math.Abs(mid - DefaultToxicityVMax/2); diff > 1e-6 {
		t.Fatalf("expected half Vmax at Km, diff=%f", diff)
	}

	high := CalculateToxicity(DefaultToxicityKm*100, DefaultToxicityVMax, DefaultToxicityKm)
	if math.Abs(high-DefaultToxicityVMax) > 1.0 {
		t.Fatalf("expected near Vmax for high concentration, got %f", high)
	}

	custom := CalculateToxicity(500, 400, 100)
	if custom <= 0 || custom > 400 {
		t.Fatalf("custom toxicity out of range: %f", custom)
	}
}

func TestCalculateAnabolicEffect(t *testing.T) {
	if effect := CalculateAnabolicEffect(0, DefaultAnabolicEC50, DefaultAnabolicHillCoeff, DefaultAnabolicMaxEffect); effect != 0 {
		t.Fatalf("expected zero effect at zero concentration, got %f", effect)
	}

	mid := CalculateAnabolicEffect(DefaultAnabolicEC50, DefaultAnabolicEC50, 2, 100)
	if diff := math.Abs(mid - 50); diff > 1e-6 {
		t.Fatalf("expected 50 effect at EC50, diff=%f", diff)
	}

	high := CalculateAnabolicEffect(DefaultAnabolicEC50*10, DefaultAnabolicEC50, 2, DefaultAnabolicMaxEffect)
	if math.Abs(high-DefaultAnabolicMaxEffect) > 2 {
		t.Fatalf("expected saturation near MaxEffect, got %f", high)
	}
}
