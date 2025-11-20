package main

import (
	context "context"
	"log"
	"net"

	"github.com/dhasakgbb/physioSim/backend/internal/engine"
	enginepb "github.com/dhasakgbb/physioSim/backend/physiosim/v1"
	"google.golang.org/grpc"
	"google.golang.org/grpc/status"
)

const defaultAddr = ":50051"

type simulationServer struct {
	enginepb.UnimplementedSimulationEngineServer
	solver *engine.Solver
}

func (s *simulationServer) RunSimulation(ctx context.Context, req *enginepb.SimulationRequest) (*enginepb.SimulationResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, status.FromContextError(err).Err()
	}

	resp := s.solver.Run(req)
	return resp, nil
}

func main() {
	lis, err := net.Listen("tcp", defaultAddr)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	srv := &simulationServer{solver: engine.NewSolver(engine.SolverConfig{})}
	grpcServer := grpc.NewServer()
	enginepb.RegisterSimulationEngineServer(grpcServer, srv)

	log.Printf("SimulationEngine gRPC server listening on %s", defaultAddr)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
