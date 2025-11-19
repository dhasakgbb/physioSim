import React from 'react';

const Input = ({ 
  label, 
  error, 
  className = '', 
  containerClassName = '',
  id,
  ...props 
}) => {
  const inputId = id || props.name || Math.random().toString(36).substr(2, 9);
  
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-physio-text-secondary uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full bg-physio-bg-core border border-physio-border-strong rounded-lg px-4 py-2.5
          text-physio-text-primary placeholder-physio-text-muted
          focus:outline-none focus:border-physio-accent-primary focus:ring-1 focus:ring-physio-accent-primary/50
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          ${error ? 'border-physio-accent-critical focus:border-physio-accent-critical focus:ring-physio-accent-critical/50' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <span className="text-xs text-physio-accent-critical ml-1">{error}</span>
      )}
    </div>
  );
};

export default Input;
