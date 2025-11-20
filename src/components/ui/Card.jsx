import React from "react";

const variants = {
  default: "bg-physio-bg-highlight border border-physio-border-subtle",
  glass: "glass-panel",
  highlight: "bg-physio-bg-input border border-physio-border-strong",
  core: "bg-physio-bg-surface border border-physio-border-strong",
};

const Card = ({
  children,
  className = "",
  variant = "default",
  title,
  action,
  noPadding = false,
  ...props
}) => {
  return (
    <div
      className={`
        rounded-2xl overflow-hidden shadow-neo-sm transition-all duration-300
        ${variants[variant] || variants.default}
        ${className}
      `}
      {...props}
    >
      {(title || action) && (
        <div className="px-6 py-4 border-b border-physio-border-subtle flex items-center justify-between">
          {title && (
            <h3 className="text-lg font-semibold text-physio-text-primary tracking-tight">
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? "" : "p-6"}>{children}</div>
    </div>
  );
};

export default Card;
