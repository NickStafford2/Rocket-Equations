type MissionOverviewProps = {
  lunarTransferGap: string;
  landingTargetSpeed: string;
};

type MissionTelemetryPanelProps = {
  elapsedMissionTime: string;
  currentSpeed: string;
  moonRelativeSpeed: string;
  earthAltitude: string;
  moonAltitude: string;
  status: string;
};

export function MissionOverview({
  lunarTransferGap,
  landingTargetSpeed,
}: MissionOverviewProps) {
  return (
    <div className="mb-6 rounded-[2.25rem] border border-white/10 bg-[#07111f]/78 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur">
      <h1 className="my-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
        To the Moon!
      </h1>
      <p>
        Goal: touch down below {landingTargetSpeed} Moon-relative speed. Current
        Earth-to-Moon surface gap: {lunarTransferGap}.
      </p>
    </div>
  );
}

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
    <div className="flex min-w-max flex-row items-stretch gap-2 rounded-[2rem] border border-white/6 bg-transparent px-2 py-1.5 text-sm shadow-none">
      {items.map(([label, value]) => (
        <TelemetryRow key={label} label={label} value={value} />
      ))}
    </div>
  );
}

type TelemetryRowProps = {
  label: string;
  value: string;
};

function TelemetryRow({ label, value }: TelemetryRowProps) {
  return (
    <div className="flex-none rounded-[1.35rem] border border-white/8 bg-black/20 px-3 py-2">
      <div className="text-[0.68rem] font-semibold tracking-[0.2em] text-slate-400 uppercase">
        {label}
      </div>
      <div className="mt-1 text-base font-medium text-slate-100">{value}</div>
    </div>
  );
}
