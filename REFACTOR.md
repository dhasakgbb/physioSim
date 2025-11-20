# Operation Iron Phoenix (Refactor Plan)

We are burning the old JavaScript codebase to the ground and building a new, industrial-grade simulation engine from the ashes. The target experience is the same neon Cyberpunk UI, but delivered through the "Google Enterprise Stack" so it runs with the precision of a flight simulator.

## Architecture: The Google Stack

- **Frontend**: Angular 19 (Stable/Next) with Signals for zero-latency reactivity.
- **Backend**: Go 1.23 for concurrent physics/math processing.
- **Protocol**: gRPC (Protobuf) replaces JSON as the binary data contract.
- **Visuals**: Apache ECharts (Canvas) for 60fps rendering.

## Phase 0 – The Foundation (Monorepo + Contract)

Goal: Establish the folder structure and the strict data contracts.

```
physiosim-enterprise
├── proto          # Source of truth for API definitions
├── backend        # Go simulation engine
├── frontend       # Angular cockpit
└── tools          # Build scripts / automation
```

Contract requirements (`proto/physiosim/v1/engine.proto`):
- `enum EsterType` (Enanthate, Propionate, etc.).
- `message Compound` includes ID, Name, Dosage, EsterType, Absorption_K (ka), Elimination_K (ke).
- `message Cycle`, `message SimulationRequest` (list of compounds, duration), `message DataPoint` (Day, SerumConcentration, AnabolicScore, ToxicityScore).
- `service SimulationEngine` with RPC `RunSimulation`.

## Phase 1 – The Engine (Go Backend)

Goal: Build the math solver that runs Bateman + Hill equations.

- Initialize Go module under `/backend`.
- Implement `pkg/pharmacokinetics/bateman.go` with the double-exponential Bateman function for ester ramp-up.
- Add Michaelis-Menten logic for toxicity saturation curves.
- Create the solver loop that sums overlapping curves (superposition) and prepares for Monte Carlo (10,000 cycles in parallel via goroutines).
- Expose the `Simulate()` function over gRPC (default port `:50051`).

## Phase 2 – The Cockpit (Angular Frontend)

Goal: Rebuild the Cyberpunk UI on Angular 19.

- **Asset Heist**: bring JetBrains Mono + Orbitron fonts and the neon color tokens (`--neon-cyan`, `--void-black`) into `styles.scss`.
- **Component Architecture**:
	- Left panel: `ActiveMixtureComponent` recreates the Tactical Dropdown.
	- Center panel: `SimulationChartComponent` initializes Apache ECharts.
	- Right panel: `TelemetryHudComponent` restores radar/gauge charts.
- Use Angular Signals (`input()`, `computed()`) for state; defer NgRx/Redux for now.

## Phase 3 – The Connection (gRPC-Web)

Goal: Make the frontend talk to the backend via gRPC-Web.

- Generate TypeScript clients from the proto definitions.
- Provide a browser-compatible bridge—either Envoy or Go's `improbable-eng/grpc-web` wrapper—to translate HTTP/1.1 requests into native gRPC calls.
- Wire user inputs (Signals) → gRPC clients → Go backend → chart updates.

### Implementation Notes (2025-02-XX)

- The shipping server (`cmd/server/main.go`) now boots *two* listeners: raw gRPC on `PHYSIOSIM_GRPC_ADDR` (default `:50051`) and grpc-web + `/healthz` HTTP on `PHYSIOSIM_GRPCWEB_ADDR` (default `:8080`).
- `github.com/improbable-eng/grpc-web/go/grpcweb` wraps the in-process gRPC server, and `github.com/rs/cors` allows any dev origin to call it.
- Proto regeneration is centralized in `./tools/generate-proto.sh`. The script ensures `protoc`, `protoc-gen-go`, `protoc-gen-go-grpc`, and `protoc-gen-grpc-web` exist, prepends `$(go env GOPATH)/bin` to `PATH`, then writes Go stubs under `backend/` and TypeScript grpc-web clients under `frontend/src/app/generated`.
- Run `./tools/generate-proto.sh` whenever `proto/physiosim/v1/engine.proto` changes to keep both runtimes in sync.

## Phase 4 – The Feature Migration (Parity)

Goal: Everything the old app did, the new stack does better.

- Rebuild the Tactical Dropdown search logic.
- Re-implement the hybrid Input + Slider control so drags stream gRPC updates instantly.
- Construct the Optimization Panel with the "Text-Only" Mode Selector, wired into the Go Monte Carlo solver.

## Phase 5 – Scientific Validation (QA)

Goal: Prove the new math is better.

- **Spike Test**: Testosterone Propionate should spike fast (Day 1) while Undecanoate humps slowly (Day 5–7). Fail if both look like simple decay curves.
- **Crash Test**: Massive oral dose (2000 mg) should send toxicity exponential (Michaelis-Menten saturation). Fail if toxicity grows linearly.

## Ignition Prompt (Kick-start Phase 0 + 1)

```
We are initiating Operation Iron Phoenix. We are building the PhysioSim Enterprise platform from scratch.

Architecture:
Root: Monorepo structure.
Backend: Go (Golang) 1.23.
Frontend: Angular 19.
Communication: gRPC (Protobuf).

Step 1: Define the Contract (Phase 0)
Create proto/physiosim/v1/engine.proto with:
	enum EsterType (Enanthate, Propionate, etc.).
	message Compound (ID, Name, Dosage, EsterType, Absorption_K, Elimination_K).
	message SimulationRequest (List of Compounds, Duration).
	message DataPoint (Day, SerumConcentration, AnabolicScore, ToxicityScore).
	service SimulationEngine with RPC RunSimulation.

Step 2: Initialize the Backend (Phase 1)
	Create Go module under backend/.
	Generate Go structs from the .proto file.
	Create pkg/math/bateman.go with:
		func CalculateConcentration(dose float64, ka float64, ke float64, time float64) float64
	Set up cmd/server/main.go to host gRPC on port 50051.

Output: Provide the .proto file content and the Go bateman.go logic.
```