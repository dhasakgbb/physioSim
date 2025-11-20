package engine

import (
	"testing"

	enginepb "github.com/dhasakgbb/physioSim/backend/physiosim/v1"
)

func TestSolverRunProducesDataPoints(t *testing.T) {
	solver := NewSolver(SolverConfig{TimeStepDays: 1, MaxConcurrency: 2})

	req := &enginepb.SimulationRequest{
		DurationDays: 3,
		Compounds: []*enginepb.Compound{
			{
				Id:           "testosterone",
				Name:         "Testosterone Propionate",
				DosageMg:     100,
				AbsorptionK:  1.2,
				EliminationK: 0.4,
			},
		},
	}

	resp := solver.Run(req)
	if got := len(resp.GetDataPoints()); got != int(req.DurationDays) {
		t.Fatalf("expected %d datapoints, got %d", req.DurationDays, got)
	}

	var sawPositive bool
	for idx, point := range resp.GetDataPoints() {
		if point == nil {
			t.Fatalf("nil datapoint at day %d", idx)
		}
		if point.Day != int32(idx) {
			t.Fatalf("expected day %d, got %d", idx, point.Day)
		}
		if point.SerumConcentration < 0 {
			t.Fatalf("expected non-negative concentration at day %d", idx)
		}
		if point.SerumConcentration > 0 {
			sawPositive = true
		}
		if point.ToxicityScore < 0 {
			t.Fatalf("toxicity score should be non-negative at day %d", idx)
		}
	}

	if !sawPositive {
		t.Fatalf("expected at least one positive concentration value")
	}
}

func TestSolverHandlesEmptyRequest(t *testing.T) {
	solver := NewSolver(SolverConfig{})

	resp := solver.Run(&enginepb.SimulationRequest{DurationDays: 0})
	if len(resp.GetDataPoints()) != 0 {
		t.Fatalf("expected zero datapoints for zero duration")
	}
}

func TestSolverRunBatch(t *testing.T) {
	solver := NewSolver(SolverConfig{MaxConcurrency: 3})
	reqs := []*enginepb.SimulationRequest{
		{DurationDays: 1},
		{DurationDays: 2},
		{DurationDays: 0},
	}

	results := solver.RunBatch(reqs)
	if len(results) != len(reqs) {
		t.Fatalf("expected %d results, got %d", len(reqs), len(results))
	}

	if len(results[0].GetDataPoints()) != 1 {
		t.Fatalf("first request should have 1 datapoint")
	}
	if len(results[1].GetDataPoints()) != 2 {
		t.Fatalf("second request should have 2 datapoints")
	}
	if len(results[2].GetDataPoints()) != 0 {
		t.Fatalf("third request should be empty due to zero duration")
	}
}
