import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, it, beforeEach, expect, vi } from "vitest";
import Dashboard from "../Dashboard";
import { StackProvider } from "../../../context/StackContext";
import { SimulationProvider } from "../../../context/SimulationContext";

vi.mock("../CenterPane", () => {
  const MockCenterPane = () => <div data-testid="net-chart">Net chart</div>;
  return {
    __esModule: true,
    CenterPane: MockCenterPane,
    default: MockCenterPane,
  };
});

vi.mock("../LinearPathwayFlow", () => ({
  __esModule: true,
  default: () => <div data-testid="pathway-chart" />,
}));

vi.mock("../OptimizerPane", () => ({
  __esModule: true,
  default: () => <div data-testid="optimizer-pane">Optimizer</div>,
}));

vi.mock("../SignalingNetwork", () => ({
  __esModule: true,
  default: () => <div data-testid="network-chart">Network</div>,
}));

const renderDashboard = () =>
  render(
    <StackProvider>
      <SimulationProvider>
        <Dashboard />
      </SimulationProvider>
    </StackProvider>,
  );

describe("Dashboard deep linking", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("loads optimize mode when ?view=optimize is present", async () => {
    window.history.replaceState({}, "", "/?view=optimize");
    expect(window.location.search).toBe("?view=optimize");
    const params = new URLSearchParams(window.location.search);
    expect(params.get("view")).toBe("optimize");
    renderDashboard();
    expect(await screen.findByTestId("optimizer-pane")).toBeInTheDocument();
  });

  it("falls back to explore when no view param is provided", () => {
    renderDashboard();
    expect(screen.getByTestId("net-chart")).toBeInTheDocument();
  });
});
