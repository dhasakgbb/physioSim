import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Chart Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center bg-physio-bg-surface/50 border border-dashed border-physio-accent-critical/30 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-physio-accent-critical/10 flex items-center justify-center mb-3">
            <span className="text-xl">⚠️</span>
          </div>
          <h4 className="text-sm font-bold text-physio-text-primary mb-1">
            Visualization Unavailable
          </h4>
          <p className="text-xs text-physio-text-tertiary max-w-[200px]">
            We encountered an error rendering this chart. Try adjusting your
            inputs.
          </p>
          {this.state.error && (
            <div className="mt-4 p-2 bg-red-900/20 border border-red-500/20 rounded text-[10px] text-red-400 font-mono max-w-full overflow-auto">
              {this.state.error.toString()}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
