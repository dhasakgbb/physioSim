import React from "react";

const Logo = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon Container */}
      <div className="relative w-8 h-8 flex items-center justify-center rounded-full border-2 border-cyan-400 bg-transparent">
        {/* Pulse Wave SVG */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-purple-500"
        >
          <path
            d="M2 12H5L8 3L13 21L17 12H22"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="text-xl tracking-tight text-white">
        <span className="font-normal">physio</span>
        <span className="font-bold">Sim</span>
      </div>
    </div>
  );
};

export default Logo;
