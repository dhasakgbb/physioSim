import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, it, beforeEach, expect } from "vitest";
import Dashboard from "../Dashboard";
import { StackProvider } from "../../../context/StackContext";

const renderDashboard = () =>
  render(
    <StackProvider>
      <Dashboard />
    </StackProvider>,
  );

describe("Dashboard deep linking", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("loads optimize mode when ?view=optimize is present", () => {
    window.history.replaceState({}, "", "/?view=optimize");
    expect(window.location.search).toBe("?view=optimize");
    const params = new URLSearchParams(window.location.search);
    expect(params.get("view")).toBe("optimize");
    renderDashboard();
    expect(screen.getByTestId("optimizer-pane")).toBeInTheDocument();
  });

  it("falls back to explore when no view param is provided", () => {
    renderDashboard();
    expect(screen.getByTestId("net-chart")).toBeInTheDocument();
  });
});
