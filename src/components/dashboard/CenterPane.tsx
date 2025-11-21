// @ts-nocheck
import React from "react";
import DoseEfficiencyChart from "./DoseEfficiencyChart";

type CenterPaneProps = {
  onTimeScrub?: (point: unknown) => void;
};

type BenefitRowProps = {
  label: string;
  value: string;
};

const BenefitRow: React.FC<BenefitRowProps> = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between text-[11px] text-gray-400">
      <span>{label}</span>
      <span className="font-mono text-cyan-400">{value}</span>
    </div>
    <div className="h-1 w-full rounded-full bg-white/5">
      <div className="h-full w-[60%] rounded-full bg-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]" />
    </div>
  </div>
);

export const CenterPane: React.FC<CenterPaneProps> = ({ onTimeScrub }) => {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#0B0C0E]">
      {/* ------------------------------------------------------- */}
      {/* TOP ZONE: THE CHART (Rigid Landscape - 450px Fixed)     */}
      {/* ------------------------------------------------------- */}
      <div className="relative flex h-[450px] w-full shrink-0 flex-col border-b border-white/5">
        <div className="relative flex-1">
          <DoseEfficiencyChart onTimeScrub={onTimeScrub} />
        </div>
      </div>

      {/* ------------------------------------------------------- */}
      {/* BOTTOM ZONE: THE 3 CARDS (Context Rail)                 */}
      {/* ------------------------------------------------------- */}
      <div className="grid flex-1 grid-cols-3 divide-x divide-white/5 bg-[#0B0C0E]">
        {/* CARD 1: BENEFITS BREAKDOWN (Active) */}
        <div className="relative flex h-full flex-col justify-between bg-white/[0.01] p-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.65em] text-cyan-500">Net Benefits</h4>
              <span className="text-[10px] font-mono text-gray-500">Projected Gains</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-light text-white">+45.2</div>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <BenefitRow label="Hypertrophy" value="+14.2%" />
            <BenefitRow label="Neural Drive" value="+8.5%" />
            <BenefitRow label="Nitrogen Retention" value="+22.1%" />
          </div>
        </div>

        {/* CARD 2: CYCLE ROI */}
        <div className="relative flex h-full flex-col justify-between p-6">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Cycle ROI</h4>
            <div className="mt-5 space-y-5">
              <div>
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wide">
                  <span className="text-cyan-400">Anabolic Score</span>
                  <span className="font-mono text-lg text-white">9.2/10</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-[92%] rounded-full bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wide">
                  <span className="text-rose-400">Systemic Cost</span>
                  <span className="font-mono text-lg text-white">4.5/10</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-[45%] rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]" />
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-emerald-400">Net Benefit</p>
                  <p className="font-mono text-3xl text-emerald-400">+4.7</p>
                </div>
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-300">
                  Optimal
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: HALF-LIFE DECAY */}
        <div className="relative flex h-full flex-col justify-between p-6">
          <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.65em] text-rose-500">Active Half-Life</h4>
          <div className="flex flex-1 items-end justify-between gap-1">
            <div className="group relative h-[30%] w-1/3 rounded-t-sm bg-gradient-to-t from-rose-500/20 to-rose-500">
              <div className="absolute -top-4 w-full text-center text-[9px] text-gray-500 opacity-0 transition-opacity group-hover:opacity-100">8h</div>
            </div>
            <div className="group relative h-[80%] w-1/3 rounded-t-sm bg-gradient-to-t from-indigo-500/20 to-indigo-500">
              <div className="absolute -top-4 w-full text-center text-[9px] text-gray-500 opacity-0 transition-opacity group-hover:opacity-100">4.5d</div>
            </div>
            <div className="relative h-[10%] w-1/3 rounded-t-sm border-t border-white/10 bg-white/5" />
          </div>
          <div className="mt-2 flex justify-between text-[9px] font-mono text-gray-500">
            <span>Now</span>
            <span>2 Wks</span>
            <span>4 Wks</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CenterPane;
