import React, { useState, useEffect } from "react";
import { compoundData } from "../../data/compoundData";
import { useStack } from "../../context/StackContext";
import Card from "../ui/Card";

const PathwayGroup = ({ label, description, compounds, onSelect, color }) => (
  <Card
    variant="glass"
    className={`flex flex-col gap-3 p-4 border ${color} min-w-[240px] h-full`}
  >
    <div className="mb-1 min-h-[48px]">
      <h4 className="text-sm font-bold text-physio-text-primary uppercase tracking-widest">
        {label}
      </h4>
      <p className="text-xs text-physio-text-tertiary leading-tight mt-1">
        {description}
      </p>
    </div>
    <div className="flex flex-wrap gap-2 content-start">
      {compounds.map(([key, data]) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className="group relative flex items-center gap-2.5 pl-1.5 pr-3 py-2 rounded-lg bg-physio-bg-core border border-physio-border-subtle hover:border-physio-accent-primary transition-all hover:shadow-neo-sm active:scale-95 active:bg-physio-bg-highlight/10"
        >
          <div
            className="w-2 h-9 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <div className="text-left">
            <span className="block text-xs font-bold text-physio-text-primary leading-none">
              {data.abbreviation}
            </span>
            <span className="block text-xs text-physio-text-tertiary leading-none mt-1">
              {data.type}
            </span>
          </div>
        </button>
      ))}
    </div>
  </Card>
);

const CompoundDock = () => {
  const { handleAddCompound } = useStack();
  const [highlighted, setHighlighted] = useState(false);

  useEffect(() => {
    const handleHighlight = () => {
      setHighlighted(true);
      setTimeout(() => setHighlighted(false), 2500);
    };
    window.addEventListener("highlight-library", handleHighlight);
    return () =>
      window.removeEventListener("highlight-library", handleHighlight);
  }, []);

  const genomic = Object.entries(compoundData).filter(
    ([key, data]) => data.pathway === "ar_genomic",
  );
  const nonGenomic = Object.entries(compoundData).filter(
    ([key, data]) => data.pathway === "non_genomic",
  );

  return (
    <div
      className={`relative flex gap-4 items-stretch pb-2 overflow-x-auto transition-all duration-500 rounded-xl p-2 ${highlighted ? "bg-physio-accent-primary/10 ring-2 ring-physio-accent-primary shadow-[0_0_30px_rgba(99,102,241,0.3)]" : ""}`}
    >
      {highlighted && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-physio-accent-primary text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg animate-bounce z-50 whitespace-nowrap flex items-center gap-2">
          <span>👇</span> Select a Compound to Begin
        </div>
      )}
      <PathwayGroup
        label="Genomic AR Agonists"
        description="Primary tissue builders. High receptor affinity. Diminishing returns if stacked heavily."
        compounds={genomic}
        onSelect={handleAddCompound}
        color="border-emerald-500/20"
      />
      <PathwayGroup
        label="Non-Genomic / CNS"
        description="Rapid signaling, CNS drive, & nutrient partitioning. High toxicity load."
        compounds={nonGenomic}
        onSelect={handleAddCompound}
        color="border-amber-500/20"
      />
    </div>
  );
};

export default CompoundDock;
