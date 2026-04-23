type MissionTelemetryPanelProps = {
  elapsedMissionTime: string;
  currentSpeed: string;
  moonRelativeSpeed: string;
  earthAltitude: string;
  moonAltitude: string;
  status: string;
};

export function MissionTelemetryPanel({
  elapsedMissionTime,
  currentSpeed,
  moonRelativeSpeed,
  earthAltitude,
  moonAltitude,
  status,
}: MissionTelemetryPanelProps) {
  const items = [
    ["Elapsed mission time", elapsedMissionTime],
    ["Current speed", currentSpeed],
    ["Moon-relative speed", moonRelativeSpeed],
    ["Altitude above Earth", earthAltitude],
    ["Altitude above Moon", moonAltitude],
    ["Status", status],
  ] as const;

  return (
    <div className="bg-red flex flex-col items-stretch gap-2 border border-white/6 px-2 py-1.5 text-sm shadow-none">
      {items.map(([label, value]) => (
        <div key={label}>
          <div className="text-[0.68rem] font-semibold tracking-[0.2em] text-slate-400 uppercase">
            {label}
          </div>
          <div className="mt-1 text-base font-medium text-slate-100">
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}
