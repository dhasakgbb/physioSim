import React from 'react';

const variants = {
  neutral: 'bg-physio-bg-highlight text-physio-text-secondary border-physio-border-subtle',
  primary: 'bg-physio-accent-primary/10 text-physio-accent-primary border-physio-accent-primary/20',
  success: 'bg-physio-accent-success/10 text-physio-accent-success border-physio-accent-success/20',
  warning: 'bg-physio-accent-warning/10 text-physio-accent-warning border-physio-accent-warning/20',
  critical: 'bg-physio-accent-critical/10 text-physio-accent-critical border-physio-accent-critical/20',
  info: 'bg-physio-accent-secondary/10 text-physio-accent-secondary border-physio-accent-secondary/20',
};

const Badge = ({ 
  children, 
  className = '', 
  variant = 'neutral',
  size = 'md',
  ...props 
}) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-0.5';
  
  return (
    <span 
      className={`
        inline-flex items-center font-mono font-medium rounded border
        ${variants[variant] || variants.neutral}
        ${sizeClasses}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
