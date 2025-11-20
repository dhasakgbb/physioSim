package main

import (
	context "context"
	"errors"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/dhasakgbb/physioSim/backend/internal/engine"
	enginepb "github.com/dhasakgbb/physioSim/backend/physiosim/v1"
	grpcweb "github.com/improbable-eng/grpc-web/go/grpcweb"
	"github.com/rs/cors"
	"google.golang.org/grpc"
	"google.golang.org/grpc/status"
)

const (
	defaultGRPCAddr    = ":50051"
	defaultGrpcWebAddr = ":8080"
	grpcAddrEnv        = "PHYSIOSIM_GRPC_ADDR"
	grpcWebAddrEnv     = "PHYSIOSIM_GRPCWEB_ADDR"
)

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
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	grpcAddr := envOr(grpcAddrEnv, defaultGRPCAddr)
	grpcWebAddr := envOr(grpcWebAddrEnv, defaultGrpcWebAddr)

	lis, err := net.Listen("tcp", grpcAddr)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	srv := &simulationServer{solver: engine.NewSolver(engine.SolverConfig{})}
	grpcServer := grpc.NewServer()
	enginepb.RegisterSimulationEngineServer(grpcServer, srv)

	go func() {
		log.Printf("SimulationEngine gRPC server listening on %s", grpcAddr)
		if err := grpcServer.Serve(lis); err != nil && !errors.Is(err, grpc.ErrServerStopped) {
			log.Fatalf("failed to serve gRPC: %v", err)
		}
	}()

	grpcWebServer := grpcweb.WrapServer(
		grpcServer,
		grpcweb.WithOriginFunc(func(origin string) bool { return true }),
	)

	httpHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet && r.URL.Path == "/healthz" {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte("ok"))
			return
		}

		if grpcWebServer.IsGrpcWebRequest(r) || grpcWebServer.IsGrpcWebSocketRequest(r) || grpcWebServer.IsAcceptableGrpcCorsRequest(r) {
			grpcWebServer.ServeHTTP(w, r)
			return
		}

		w.WriteHeader(http.StatusNotFound)
	})

	corsWrapped := cors.New(cors.Options{
		AllowOriginFunc:  func(origin string) bool { return true },
		AllowedMethods:   []string{http.MethodPost, http.MethodGet, http.MethodOptions},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	}).Handler(httpHandler)

	httpServer := &http.Server{
		Addr:    grpcWebAddr,
		Handler: corsWrapped,
	}

	go func() {
		log.Printf("grpc-web proxy listening on %s", grpcWebAddr)
		if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("failed to start grpc-web proxy: %v", err)
		}
	}()

	<-ctx.Done()
	log.Print("shutdown signal received, draining servers...")
	grpcServer.GracefulStop()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		log.Printf("error shutting down grpc-web proxy: %v", err)
	}
	log.Print("servers stopped cleanly")
}

func envOr(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
