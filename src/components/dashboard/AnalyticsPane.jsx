import React from 'react';
import ReceptorSaturationChart from '../charts/ReceptorSaturationChart';
import SerumConcentrationChart from '../charts/SerumConcentrationChart';
import OrganStressHeatmap from '../charts/OrganStressHeatmap';

const AnalyticsPane = () => {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-2">
      {/* Serum Concentration - Full Width on Mobile, Half on Large */}
      <div className="col-span-1 lg:col-span-2">
        <SerumConcentrationChart />
      </div>

      {/* Receptor Saturation */}
      <div className="col-span-1">
        <ReceptorSaturationChart />
      </div>

      {/* Organ Stress */}
      <div className="col-span-1">
        <OrganStressHeatmap />
      </div>
    </div>
  );
};

export default AnalyticsPane;
