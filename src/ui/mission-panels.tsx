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
  ] as const;

  return (
    <div className="flex flex-col items-stretch gap-2 rounded-2xl px-2 py-1.5 text-sm shadow-none">
      <div className="flex flex-row items-baseline gap-1 backdrop-blur-md">
        <div className="text-3xl font-semibold tracking-[0.2em] text-slate-300 uppercase">
          Status:
        </div>
        <div className="text-2xl text-slate-100">{status}</div>
      </div>
      <div className="mt-4 w-fit backdrop-blur-md">
        {items.map(([label, value]) => (
          <div key={label} className="flex flex-row justify-between gap-4">
            <div className="text-[0.68rem] font-semibold tracking-[0.2em] text-slate-400 uppercase">
              {label}:
            </div>
            <div className="font-medium text-slate-100">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
