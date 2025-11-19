import React, { useState } from "react";
import Card from "./ui/Card";
import Button from "./ui/Button";
import { disclaimerText } from "../data/compoundData";

const DisclaimerBanner = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Card className="bg-physio-accent-warning/10 border-physio-accent-warning p-4 mb-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-physio-accent-warning mb-2">
            ⚠️ HARM REDUCTION MODELING, NOT MEDICAL ADVICE
          </h2>
          {!isCollapsed && (
            <div className="text-sm text-physio-text-primary whitespace-pre-line">
              {disclaimerText}
            </div>
          )}
        </div>
        <Button
          onClick={() => setIsCollapsed(!isCollapsed)}
          variant="ghost"
          size="sm"
          className="ml-4 text-physio-accent-warning hover:bg-physio-accent-warning/10"
        >
          {isCollapsed ? "Show" : "Hide"}
        </Button>
      </div>
    </Card>
  );
};

export default DisclaimerBanner;
