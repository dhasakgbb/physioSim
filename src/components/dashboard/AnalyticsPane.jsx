import React from "react";
import ReceptorSaturationChart from "../charts/ReceptorSaturationChart";
import OrganStressHeatmap from "../charts/OrganStressHeatmap";

const AnalyticsPane = () => {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="col-span-1">
        <ReceptorSaturationChart />
      </div>
      <div className="col-span-1">
        <OrganStressHeatmap />
      </div>
    </div>
  );
};

export default AnalyticsPane;
