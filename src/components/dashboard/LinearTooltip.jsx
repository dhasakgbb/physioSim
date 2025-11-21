import React from "react";

const LinearTooltip = ({
  active,
  payload = [],
  label,
  labelPrefix = "Dose",
  unit = "mgEq",
  highlightKeys = [],
}) => {
  if (!active || !payload?.length) return null;

  const filteredPayload = highlightKeys.length
    ? payload.filter((entry) => highlightKeys.includes(entry.dataKey))
    : payload;

  const deduped = [];
  const seen = new Set();
  filteredPayload.forEach((entry) => {
    const key = entry.dataKey ?? entry.name;
    if (!key) return;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(entry);
  });

  if (!deduped.length) return null;

  const formattedLabel = Number.isFinite(label)
    ? `${label > 0 ? "+" : ""}${Math.round(label)}`
    : label;

  return (
    <div className="bg-[#0B0C0E]/90 backdrop-blur-md border border-white/10 p-3 rounded shadow-2xl min-w-[150px]">
      <p className="text-[10px] text-gray-500 font-mono uppercase mb-2">
        {labelPrefix}: <span className="text-gray-200">{formattedLabel} {unit}</span>
      </p>

      <div className="flex flex-col gap-1">
        {deduped.map((entry) => (
          <div key={entry.dataKey ?? entry.name} className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: entry.color || entry.stroke || "#22d3ee" }}
              />
              <span className="text-xs text-gray-300 font-medium">{entry.name}</span>
            </div>
            <span className="text-xs font-mono text-white">
              {Number.isFinite(entry.value) ? Number(entry.value).toFixed(1) : "--"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LinearTooltip;
