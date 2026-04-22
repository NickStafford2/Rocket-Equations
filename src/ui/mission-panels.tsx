type MissionOverviewProps = {
  missionPhase: string;
  currentSpeed: string;
  peakAltitudeEarth: string;
  closestMoonApproach: string;
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
  className?: string;
};

export function MissionOverview({
  missionPhase,
  currentSpeed,
  peakAltitudeEarth,
  closestMoonApproach,
  lunarTransferGap,
  landingTargetSpeed,
}: MissionOverviewProps) {
  return (
    <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_380px]">
      <div className="rounded-[2.25rem] border border-white/10 bg-[#07111f]/78 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex flex-wrap items-center gap-3 text-[0.72rem] font-semibold tracking-[0.24em] text-cyan-100 uppercase">
          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1">
            Earth to Moon
          </span>
          <span className="rounded-full border border-amber-300/20 bg-amber-200/10 px-3 py-1 text-amber-100">
            Three.js orbital sandbox
          </span>
        </div>

        <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
          Fly from Earth to the Moon and try to land with zero relative
          velocity.
        </h1>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Mission Phase" value={missionPhase} accent="cyan" />
          <MetricCard label="Current Speed" value={currentSpeed} accent="amber" />
          <MetricCard
            label="Peak Earth Altitude"
            value={peakAltitudeEarth}
            accent="cyan"
          />
          <MetricCard
            label="Closest Moon Approach"
            value={closestMoonApproach}
            accent="amber"
          />
        </div>
      </div>

      <div className="rounded-[2.25rem] border border-white/10 bg-[#0b1628]/82 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="text-[0.72rem] font-semibold tracking-[0.24em] text-slate-400 uppercase">
          Mission Notes
        </div>
        <div className="mt-4 space-y-4 text-sm leading-6 text-slate-300">
          <p>
            The current model is Earth-Moon gravity plus a steerable main engine
            for small course corrections and landing burns.
          </p>
          <p>
            Distances and body sizes use the same compression factor, so the
            visual proportions stay consistent even though the whole system is
            scaled down.
          </p>
          <p className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-slate-200">
            Goal: touch down below {landingTargetSpeed} Moon-relative speed.
            Current Earth-to-Moon surface gap: {lunarTransferGap}.
          </p>
        </div>
      </div>
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
  className,
}: MissionTelemetryPanelProps) {
  return (
    <div
      className={`rounded-[2rem] border border-white/10 bg-[#07111f]/85 p-5 text-sm shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur ${className ?? ""}`}
    >
      <div className="text-[0.72rem] font-semibold tracking-[0.24em] text-slate-400 uppercase">
        Telemetry
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <TelemetryRow label="Elapsed mission time" value={elapsedMissionTime} />
        <TelemetryRow label="Current speed" value={currentSpeed} />
        <TelemetryRow label="Moon-relative speed" value={moonRelativeSpeed} />
        <TelemetryRow label="Altitude above Earth" value={earthAltitude} />
        <TelemetryRow label="Altitude above Moon" value={moonAltitude} />
      </div>
      <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/8 px-4 py-3 text-slate-200">
        Status: {status}
      </div>
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

type MetricCardProps = {
  label: string;
  value: string;
  accent: "cyan" | "amber";
};

function MetricCard({ label, value, accent }: MetricCardProps) {
  const accentClasses =
    accent === "cyan"
      ? "border-cyan-300/12 bg-cyan-300/8 text-cyan-50"
      : "border-amber-300/12 bg-amber-300/8 text-amber-50";

  return (
    <div
      className={`min-h-[7.75rem] min-w-0 rounded-[1.5rem] border px-4 py-4 ${accentClasses}`}
    >
      <div className="truncate text-[0.68rem] font-semibold tracking-[0.22em] text-slate-300 uppercase">
        {label}
      </div>
      <div className="mt-2 truncate text-xl font-semibold text-white tabular-nums">
        {value}
      </div>
    </div>
  );
}

type TelemetryRowProps = {
  label: string;
  value: string;
};

function TelemetryRow({ label, value }: TelemetryRowProps) {
  return (
    <div className="rounded-[1.35rem] border border-white/8 bg-white/4 px-4 py-3">
      <div className="text-[0.68rem] font-semibold tracking-[0.2em] text-slate-400 uppercase">
        {label}
      </div>
      <div className="mt-1 text-base font-medium text-slate-100">{value}</div>
    </div>
  );
}
