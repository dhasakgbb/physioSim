import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { act } from "react";
import Dashboard from "../Dashboard";
import { StackProvider } from "../../../context/StackContext";
import { SimulationProvider } from "../../../context/SimulationContext";

vi.mock("../../../context/StackContext", () => {
  const React = require("react");
  const StackContext = React.createContext();

  const StackProvider = ({ children }) => {
    const [viewMode, setViewMode] = React.useState("net");
    const staticFns = React.useMemo(
      () => ({
        setStack: vi.fn(),
        setUserProfile: vi.fn(),
        setInspectedCompound: vi.fn(),
      }),
      [],
    );

    const value = React.useMemo(
      () => ({
        stack: [],
        userProfile: {},
        inspectedCompound: null,
        metrics: {},
        viewMode,
        setViewMode,
        ...staticFns,
      }),
      [viewMode, staticFns],
    );

    return (
      <StackContext.Provider value={value}>{children}</StackContext.Provider>
    );
  };

  return {
    StackProvider,
    useStack: () => React.useContext(StackContext),
    VIEW_MODE_SLUGS: { net: "explore", optimize: "optimize", network: "signaling" },
  };
});

vi.mock("../../../context/SimulationContext", () => {
  const React = require("react");
  const SimulationContext = React.createContext();

  const SimulationProvider = ({ children }) => {
    const value = React.useMemo(
      () => ({
        compounds: [],
        setCompounds: vi.fn(),
        metrics: {},
        updateDose: vi.fn(),
        updateFrequency: vi.fn(),
        updateEster: vi.fn(),
        removeCompound: vi.fn(),
        addCompound: vi.fn(),
      }),
      [],
    );

    return (
      <SimulationContext.Provider value={value}>
        {children}
      </SimulationContext.Provider>
    );
  };

  return {
    SimulationProvider,
    useSimulation: () => React.useContext(SimulationContext),
  };
});

vi.mock("../DashboardLayout", () => ({
  default: ({ leftRail, centerStage, rightRail }) => (
    <div>
      <div data-testid="left">{leftRail}</div>
      <div data-testid="stage">{centerStage}</div>
      <div data-testid="right">{rightRail}</div>
    </div>
  ),
}));

vi.mock("../ActiveStackRail", () => ({
  default: () => <div data-testid="stack-rail" />,
}));

vi.mock("../CenterPane", () => {
  const MockCenterPane = () => <div data-testid="net-chart">Net chart</div>;
  return {
    __esModule: true,
    CenterPane: MockCenterPane,
    default: MockCenterPane,
  };
});

vi.mock("../VitalSigns", () => ({
  default: () => <div data-testid="vitals" />,
}));

vi.mock("../MechanismMonitor", () => ({
  default: () => <div data-testid="mechanism" />,
}));

vi.mock("../BiomarkerMatrix", () => ({
  default: () => <div data-testid="biomarker" />,
}));

vi.mock("../LabReportCard", () => ({
  default: () => <div data-testid="lab" />,
}));

vi.mock("../NetEffectChart", () => ({
  default: () => <div data-testid="net-chart">Net chart</div>,
}));

vi.mock("../LinearPathwayFlow", () => ({
  __esModule: true,
  default: () => <div data-testid="pathway-flow">Pathway Flow</div>,
}));

vi.mock("../OptimizerPane", () => ({
  default: () => <div data-testid="optimizer-pane">Optimizer Pane</div>,
}));

vi.mock("../CompoundInspector", () => ({
  default: () => null,
}));

describe("Dashboard tab switching", () => {
  it("switches between Efficiency, Optimize, and Pathways", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(
        <StackProvider>
          <SimulationProvider>
            <Dashboard />
          </SimulationProvider>
        </StackProvider>,
      );
    });

    // Explore view is default
    expect(screen.getByTestId("net-chart")).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /optimize/i }));
    });
    expect(screen.getByTestId("optimizer-pane")).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /pathway flow/i }));
    });
    expect(screen.getByTestId("pathway-flow")).toBeInTheDocument();
  });
});
