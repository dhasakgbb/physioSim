import React from "react";

const variants = {
  primary:
    "bg-white text-black font-semibold border border-black/10 hover:bg-zinc-200/80",
  secondary:
    "bg-physio-bg-highlight border border-physio-border-strong text-physio-text-primary hover:bg-physio-bg-input",
  ghost:
    "bg-transparent text-physio-text-secondary hover:text-physio-accent-primary hover:bg-physio-bg-highlight/40",
  danger:
    "bg-physio-accent-critical/10 text-physio-accent-critical border border-physio-accent-critical/30 hover:bg-physio-accent-critical/20",
  success:
    "bg-physio-accent-success/10 text-physio-accent-success border border-physio-accent-success/30 hover:bg-physio-accent-success/20",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
  icon: "p-2",
};

const Button = ({
  children,
  onClick,
  className = "",
  variant = "primary",
  size = "md",
  disabled = false,
  type = "button",
  icon: Icon,
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

export default Button;
