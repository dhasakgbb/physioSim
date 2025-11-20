Software Design Document: physioSim Refactor (v2.0)Project Name: physioSim Enterprise WorkstationTarget Architecture: Google Enterprise Stack (Local)Objective: Refactor an existing consumer-web simulation tool into a high-density, high-performance desktop engineering console.Design Language: Google Material 3 (Enterprise/Compact Density).1. Architectural OverviewThe system is a Localhost Client-Server Application.Frontend: Angular 19+ (Standalone Components, Signals) serving a Single Page Application (SPA).Backend: Go (Golang) 1.22+ serving a gRPC API.Communication: gRPC-Web (Binary Protobuf) over HTTP/1.1 or HTTP/2.Visualization: Apache ECharts (Canvas-based rendering).1.1 The "Local" ConstraintThere is no cloud infrastructure. The Go binary acts as the web server.Frontend builds to static files dist/browser/.Backend embeds these files using embed.FS and serves them on localhost:8080.2. Design System Specification (Material Enterprise)We are abandoning the "Cyberpunk" aesthetic for a Dark Mode Data Terminal.2.1 Color Palette (Material Tokens)Use these exact hex codes in CSS variables.Token NameValueSemantic Usage--sys-surface#1E1F22Main app background (Not black).--sys-surface-container#2B2D31Sidebars, Cards, Panels.--sys-surface-bright#3C4043Input fields, active states.--sys-outline#4E5155Borders, Dividers.--sys-on-surface#E3E3E3Primary Text.--sys-on-surface-variant#C4C7C5Labels, Axis text, Units.--sys-primary#8AB4F8(Google Blue) Active Tabs, Anabolic Data.--sys-error#F28B82(Google Red) Toxicity, Alerts.--sys-warning#FDD663(Google Yellow) Diminishing Returns.--sys-tertiary#C58AF9(Google Violet) Signaling Pathways.2.2 TypographyHeaders: Google Sans (or Open Sans fallback). Weight: 500.Body: Roboto. Weight: 400.Data/Tables: Roboto Mono. Weight: 400. (Critical for tabular alignment).2.3 Layout StructureThe app uses a 3-Column "Holy Grail" Layout with fixed positioning (no window scrolling, only panel scrolling).Left Drawer (320px fixed): "Active Mixture" (Input Controls).Center Stage (Flex Grow): Charts, Sankey Diagrams, Optimization Results.Right Drawer (300px fixed, collapsible): "Telemetry" (Vitals & Stats).3. Data Layer: Protocol Buffers (The Contract)File: proto/physiosim/v1/physiosim.protoStrictly enforce this schema. No loose JSON.Protocol Bufferssyntax = "proto3";
package physiosim.v1;
option go_package = "github.com/physiosim/gen/go/physiosim/v1";

service SimulationService {
rpc SimulateCycle (CycleRequest) returns (CycleResponse);
}

enum CompoundID {
COMPOUND_UNSPECIFIED = 0;
TESTOSTERONE = 1;
TRENBOLONE = 2;
NANDROLONE = 3;
MASTERON = 4;
PRIMOBOLAN = 5;
ANADROL = 6;
ANAVAR = 7;
}

enum EsterID {
ESTER_UNSPECIFIED = 0;
NONE = 1; // Suspension/Oral
ACETATE = 2;
PROPIONATE = 3;
ENANTHATE = 4;
CYPIONATE = 5;
DECANOATE = 6;
UNDECANOATE = 7;
}

message CompoundInput {
string ui_id = 1; // Unique ID for UI tracking
CompoundID compound = 2;
EsterID ester = 3;
double dosage_mg = 4;
double frequency_days = 5; // e.g., 3.5
}

message CycleRequest {
repeated CompoundInput compounds = 1;
int32 duration_weeks = 2;
}

message CycleResponse {
repeated DailyPoint time_series = 1; // Array of 84+ points (daily)
map<string, double> aggregate_stats = 2; // "SystemicLoad", "Anabolism"
}

message DailyPoint {
int32 day = 1;
double serum_concentration = 2;
double toxicity_load = 3;
} 4. Backend Implementation (Go)Root Directory: /backend4.1 StructurePlaintext/cmd
/server
main.go # Embeds frontend, starts HTTP/gRPC server
/internal
/math
pk_engine.go # The Pharmacokinetics logic (Half-life calc)
constants.go # MAP[CompoundID] -> MolecularWeight, Affinity
/api
handler.go # Implements the Proto Server interface
4.2 Math Logic (pk_engine.go)Requirement: Must support Superposition. The serum level at Day N is the sum of remaining active mg from all previous injections.Formula: $C(t) = D \cdot e^{-kt}$Optimization: Pre-calculate k (elimination constant) based on the EsterID half-life lookup. Do not calculate half-life inside the loop.5. Frontend Implementation (Angular 19)Root Directory: /frontend5.1 StructurePlaintext/src
/app
/core
/services
grpc.service.ts # Wrapper for gRPC-Web client
state.service.ts # Signal Store (Global State)
/features
/mixture-panel # Left Sidebar
/chart-panel # Center Stage
/telemetry-panel # Right Sidebar
/shared
/ui # Reusable "Material Enterprise" components
5.2 State Management (Signals)Do not use RxJS for synchronous UI state. Use Signals.TypeScript// state.service.ts (Concept)
export class StateService {
// The Source of Truth
activeCompounds = signal<CompoundInput[]>([]);

// Derived State (Computed)
totalWeeklyMg = computed(() =>
this.activeCompounds().reduce((acc, c) => acc + (c.dosage_mg / c.frequency_days) \* 7, 0)
);

// Effects
constructor() {
// Auto-trigger simulation when inputs change
effect(() => {
this.grpcService.simulate(this.activeCompounds());
});
}
}
5.3 Charts (Apache ECharts)Goal: High performance, no lag on dragging sliders.Renderer: canvas (not SVG).Downsampling: Use sampling: 'lttb' in the series config to handle high-density data points.Theme: Create a custom object theme.json using the Color Palette from Section 2.1.
