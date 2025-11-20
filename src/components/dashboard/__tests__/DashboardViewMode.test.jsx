import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { act } from "react";
import Dashboard from "../Dashboard";
import { StackProvider } from "../../../context/StackContext";

vi.mock("../../../context/StackContext", () => {
  const React = require("react");
  const StackContext = React.createContext();

  const StackProvider = ({ children }) => {
    const [viewMode, setViewMode] = React.useState("net");
    const value = React.useMemo(
      () => ({
        stack: [],
        setStack: vi.fn(),
        userProfile: {},
        setUserProfile: vi.fn(),
        inspectedCompound: null,
        setInspectedCompound: vi.fn(),
        viewMode,
        setViewMode,
        durationWeeks: 12,
        setDurationWeeks: vi.fn(),
        metrics: {},
      }),
      [viewMode],
    );

    return (
      <StackContext.Provider value={value}>{children}</StackContext.Provider>
    );
  };

  const useStack = () => React.useContext(StackContext);

  return {
    StackProvider,
    useStack,
    VIEW_MODE_SLUGS: { net: "explore", optimize: "optimize", network: "signaling" },
  };
});

vi.mock("../DashboardLayout", () => ({
  default: ({ headerControls, centerStage }) => (
    <div>
      <div data-testid="header">{headerControls}</div>
      <div data-testid="stage">{centerStage}</div>
    </div>
  ),
}));

vi.mock("../ActiveStackRail", () => ({
  default: () => <div data-testid="stack-rail" />,
}));

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

vi.mock("../SignalingNetwork", () => ({
  default: () => <div data-testid="network-chart">Network chart</div>,
}));

vi.mock("../OptimizerPane", () => ({
  default: () => <div data-testid="optimizer-pane">Optimizer Pane</div>,
}));

vi.mock("../DonationModal", () => ({
  default: () => null,
}));

vi.mock("../CompoundInspector", () => ({
  default: () => null,
}));

describe("Dashboard view switching", () => {
  it("switches between Explore, Optimize, and Signaling", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(
        <StackProvider>
          <Dashboard />
        </StackProvider>,
      );
    });

    // Explore view is default
    expect(screen.getByTestId("net-chart")).toBeInTheDocument();
    expect(screen.queryByTestId("optimizer-pane")).not.toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole("link", { name: /optimize/i }));
    });
    expect(screen.getByTestId("optimizer-pane")).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole("link", { name: /signaling/i }));
    });
    expect(screen.getByTestId("network-chart")).toBeInTheDocument();
  });
});
