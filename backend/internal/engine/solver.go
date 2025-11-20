package engine

import (
	"sync"

	enginepb "github.com/dhasakgbb/physioSim/backend/physiosim/v1"
	mathpkg "github.com/dhasakgbb/physioSim/backend/pkg/math"
)

// SolverConfig captures configurable parameters for the simulation engine.
type SolverConfig struct {
	TimeStepDays   float64
	MaxConcurrency int
	ToxicityVMax   float64
	ToxicityKm     float64
	AnabolicMax    float64
	AnabolicEC50   float64
	AnabolicHill   float64
}

// Solver performs pharmacokinetic simulations over requested durations.
type Solver struct {
	cfg SolverConfig
}

// NewSolver constructs a solver with sane defaults.
func NewSolver(cfg SolverConfig) *Solver {
	if cfg.TimeStepDays <= 0 {
		cfg.TimeStepDays = 1.0
	}
	if cfg.MaxConcurrency <= 0 {
		cfg.MaxConcurrency = 4
	}
	if cfg.ToxicityVMax <= 0 {
		cfg.ToxicityVMax = mathpkg.DefaultToxicityVMax
	}
	if cfg.ToxicityKm <= 0 {
		cfg.ToxicityKm = mathpkg.DefaultToxicityKm
	}
	if cfg.AnabolicMax <= 0 {
		cfg.AnabolicMax = mathpkg.DefaultAnabolicMaxEffect
	}
	if cfg.AnabolicEC50 <= 0 {
		cfg.AnabolicEC50 = mathpkg.DefaultAnabolicEC50
	}
	if cfg.AnabolicHill <= 0 {
		cfg.AnabolicHill = mathpkg.DefaultAnabolicHillCoeff
	}

	return &Solver{cfg: cfg}
}

// Run executes the simulation for the provided request.
func (s *Solver) Run(req *enginepb.SimulationRequest) *enginepb.SimulationResponse {
	if req == nil || req.DurationDays <= 0 {
		return &enginepb.SimulationResponse{}
	}

	days := int(req.DurationDays)
	dataPoints := make([]*enginepb.DataPoint, days)

	tasks := make(chan int, days)
	var wg sync.WaitGroup

	workerCount := s.cfg.MaxConcurrency
	if workerCount > days {
		workerCount = days
	}

	wg.Add(workerCount)
	for i := 0; i < workerCount; i++ {
		go func() {
			defer wg.Done()
			for day := range tasks {
				s.computeDay(dataPoints, req.GetCompounds(), day)
			}
		}()
	}

	for day := 0; day < days; day++ {
		tasks <- day
	}
	close(tasks)
	wg.Wait()

	return &enginepb.SimulationResponse{DataPoints: dataPoints}
}

// RunBatch executes multiple simulation requests concurrently.
func (s *Solver) RunBatch(requests []*enginepb.SimulationRequest) []*enginepb.SimulationResponse {
	if len(requests) == 0 {
		return nil
	}

	results := make([]*enginepb.SimulationResponse, len(requests))
	jobs := make(chan int, len(requests))
	var wg sync.WaitGroup

	workerCount := s.cfg.MaxConcurrency
	if workerCount > len(requests) {
		workerCount = len(requests)
	}

	wg.Add(workerCount)
	for i := 0; i < workerCount; i++ {
		go func() {
			defer wg.Done()
			for idx := range jobs {
				results[idx] = s.Run(requests[idx])
			}
		}()
	}

	for idx := range requests {
		jobs <- idx
	}
	close(jobs)
	wg.Wait()

	return results
}

func (s *Solver) computeDay(dest []*enginepb.DataPoint, compounds []*enginepb.Compound, day int) {
	t := float64(day) * s.cfg.TimeStepDays
	concentration, toxicity := s.aggregateCompounds(compounds, t)
	anabolic := mathpkg.CalculateAnabolicEffect(concentration, s.cfg.AnabolicEC50, s.cfg.AnabolicHill, s.cfg.AnabolicMax)

	dest[day] = &enginepb.DataPoint{
		Day:                int32(day),
		SerumConcentration: concentration,
		AnabolicScore:      anabolic,
		ToxicityScore:      toxicity,
	}
}

func (s *Solver) aggregateCompounds(compounds []*enginepb.Compound, time float64) (float64, float64) {
	if len(compounds) == 0 {
		return 0, 0
	}

	totalConc := 0.0
	totalToxicity := 0.0
	for _, c := range compounds {
		if c == nil {
			continue
		}

		dose := c.GetDosageMg()
		ka := c.GetAbsorptionK()
		ke := c.GetEliminationK()
		conc := mathpkg.CalculateConcentration(dose, ka, ke, time)
		totalConc += conc
		totalToxicity += mathpkg.CalculateToxicity(conc, s.cfg.ToxicityVMax, s.cfg.ToxicityKm)
	}

	return totalConc, totalToxicity
}
