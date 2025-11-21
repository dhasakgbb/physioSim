import React, { useState, useEffect } from "react";

const DashboardLayout = ({
  leftRail, // Zone A: Active Stack
  centerStage, // Zone B: Visualization
  rightRail, // Zone C: Vitals/Intel
  className = "",
}) => {
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  useEffect(() => {
    const openStackDrawer = () => setShowLeft(true);
    const openInspectorDrawer = () => setShowRight(true);

    window.addEventListener("open-stack-drawer", openStackDrawer);
    window.addEventListener("open-inspector-drawer", openInspectorDrawer);

    return () => {
      window.removeEventListener("open-stack-drawer", openStackDrawer);
      window.removeEventListener("open-inspector-drawer", openInspectorDrawer);
    };
  }, []);

  return (
    <div className={`app-shell text-physio-text-primary ${className}`}>
      <div className="main-stage">
        <div className="col-left flex flex-col">
          <div className="flex-1 min-h-0">{leftRail}</div>
        </div>

        <div className="col-center flex flex-col min-h-0">
          <div className="flex-1 min-h-0">{centerStage}</div>
        </div>

        <div className="col-right flex flex-col min-h-0">
          <div className="flex-1 min-h-0">{rightRail}</div>
        </div>
      </div>

      {showLeft && (
        <div className="absolute inset-0 z-50 flex xl:hidden">
          <div className="w-80 h-full bg-physio-bg-surface shadow-2xl flex flex-col animate-slide-in-left relative">
            <button
              onClick={() => setShowLeft(false)}
              className="absolute top-3 right-3 z-30 p-2 rounded-lg bg-physio-bg-core/70 text-physio-text-tertiary hover:text-physio-text-primary"
            >
              ✕
            </button>
            <div className="flex-1 overflow-hidden">{leftRail}</div>
          </div>
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLeft(false)}
          />
        </div>
      )}

      {showRight && (
        <div className="absolute inset-0 z-50 flex justify-end xl:hidden">
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRight(false)}
          />
          <div className="w-80 h-full bg-physio-bg-surface shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-4 flex justify-between items-center bg-physio-bg-surface">
              <h2 className="text-sm font-bold text-physio-text-primary uppercase tracking-widest">
                Inspector
              </h2>
              <button
                onClick={() => setShowRight(false)}
                className="p-2 text-physio-text-tertiary hover:text-physio-text-primary"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">{rightRail}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
