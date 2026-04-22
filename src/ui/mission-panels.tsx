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
  layout?: "grid" | "row";
  statusInline?: boolean;
  className?: string;
  rowsClassName?: string;
  rowClassName?: string;
  statusClassName?: string;
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
  layout = "grid",
  statusInline = false,
  className,
  rowsClassName,
  rowClassName,
  statusClassName,
}: MissionTelemetryPanelProps) {
  const rowsBaseClassName =
    layout === "row"
      ? "mt-2 flex flex-row flex-wrap items-stretch gap-2"
      : "mt-4 grid gap-3 sm:grid-cols-2";

  const statusContent = (
    <div
      className={`rounded-2xl border border-cyan-300/10 bg-cyan-300/8 px-4 py-3 text-slate-200 ${statusClassName ?? ""}`}
    >
      Status: {status}
    </div>
  );

  return (
    <div
      className={`rounded-[2rem] border border-white/10 bg-[#07111f]/85 p-5 text-sm shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur ${className ?? ""}`}
    >
      <div className="text-[0.72rem] font-semibold tracking-[0.24em] text-slate-400 uppercase">
        Telemetry
      </div>
      <div className={`${rowsBaseClassName} ${rowsClassName ?? ""}`}>
        <TelemetryRow
          label="Elapsed mission time"
          value={elapsedMissionTime}
          className={rowClassName}
        />
        <TelemetryRow
          label="Current speed"
          value={currentSpeed}
          className={rowClassName}
        />
        <TelemetryRow
          label="Moon-relative speed"
          value={moonRelativeSpeed}
          className={rowClassName}
        />
        <TelemetryRow
          label="Altitude above Earth"
          value={earthAltitude}
          className={rowClassName}
        />
        <TelemetryRow
          label="Altitude above Moon"
          value={moonAltitude}
          className={rowClassName}
        />
        {statusInline ? statusContent : null}
      </div>
      {statusInline ? null : <div className="mt-4">{statusContent}</div>}
    </div>
  );
}

export function MissionKeyboardHelp() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#07111f]/82 p-5 text-sm leading-6 text-slate-300 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur">
      Keyboard flight controls are live while the mission is running: Left/Right
      rotate the ship, and Up or Space fires the engine forward. W multiplies
      delta t by 10, S divides it by 10, A trims it down by 2%, and D bumps it
      up by 2%.
    </div>
  );
}

type TelemetryRowProps = {
  label: string;
  value: string;
  className?: string;
};

function TelemetryRow({ label, value, className }: TelemetryRowProps) {
  return (
    <div
      className={`rounded-[1.35rem] border border-white/8 bg-white/4 px-4 py-3 ${className ?? ""}`}
    >
      <div className="text-[0.68rem] font-semibold tracking-[0.2em] text-slate-400 uppercase">
        {label}
      </div>
      <div className="mt-1 text-base font-medium text-slate-100">{value}</div>
    </div>
  );
}
