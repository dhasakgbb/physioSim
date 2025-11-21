import React from "react";
import { useSystemLoad } from "../../hooks/useSystemLoad";

const StatusIndicator = () => {
  const { systemIndex } = useSystemLoad();

  let statusConfig = {
    color: "bg-emerald-500",
    shadow: "shadow-[0_0_8px_rgba(16,185,129,0.6)]",
    text: "text-emerald-500",
    label: "System Ready",
    animate: "animate-pulse",
  };

  if (systemIndex >= 90) {
    statusConfig = {
      color: "bg-red-500",
      shadow: "shadow-[0_0_12px_rgba(239,68,68,0.8)]",
      text: "text-red-500",
      label: "System Failure",
      animate: "animate-ping", // Fast pulse effect
    };
  } else if (systemIndex >= 70) {
    statusConfig = {
      color: "bg-amber-500",
      shadow: "shadow-[0_0_8px_rgba(245,158,11,0.6)]",
      text: "text-amber-500",
      label: "Elevated Load",
      animate: "",
    };
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-2 w-2">
        {systemIndex >= 90 && (
           <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${statusConfig.color} ${statusConfig.animate}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${statusConfig.color} ${statusConfig.shadow} ${systemIndex < 70 ? "animate-pulse" : ""}`}></span>
      </div>
      <span className={`text-[10px] font-mono uppercase tracking-[0.35em] ${statusConfig.text}`}>
        {statusConfig.label}
      </span>
    </div>
  );
};

export default StatusIndicator;
