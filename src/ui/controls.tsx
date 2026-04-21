type ControlsProps = {
  launchSpeed: number
  launchAngleDeg: number
  dt: number
  showTrail: boolean
  showVectors: boolean
  running: boolean
  onLaunchSpeedChange: (value: number) => void
  onLaunchAngleChange: (value: number) => void
  onDtChange: (value: number) => void
  onShowTrailChange: (value: boolean) => void
  onShowVectorsChange: (value: boolean) => void
  onToggleRunning: () => void
  onReset: () => void
}

export function Controls({
  launchSpeed,
  launchAngleDeg,
  dt,
  showTrail,
  showVectors,
  running,
  onLaunchSpeedChange,
  onLaunchAngleChange,
  onDtChange,
  onShowTrailChange,
  onShowVectorsChange,
  onToggleRunning,
  onReset,
}: ControlsProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl p-5 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Earth–Moon launch simulation</h1>
        <p className="mt-2 text-sm text-slate-300 leading-6">
          Choose a launch speed and angle, then watch a ballistic trajectory evolve
          under Earth and Moon gravity.
        </p>
      </div>

      <div className="space-y-4">
        <label className="block">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Launch speed</span>
            <span className="text-slate-300">{launchSpeed.toLocaleString()} m/s</span>
          </div>
          <input
            className="w-full"
            type="range"
            min={9000}
            max={12000}
            step={50}
            value={launchSpeed}
            onChange={(e) => onLaunchSpeedChange(Number(e.target.value))}
          />
        </label>

        <label className="block">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Launch angle from local tangent</span>
            <span className="text-slate-300">{launchAngleDeg.toFixed(1)}°</span>
          </div>
          <input
            className="w-full"
            type="range"
            min={-90}
            max={90}
            step={1}
            value={launchAngleDeg}
            onChange={(e) => onLaunchAngleChange(Number(e.target.value))}
          />
        </label>

        <label className="block">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Simulation time step</span>
            <span className="text-slate-300">{dt.toFixed(0)} s</span>
          </div>
          <input
            className="w-full"
            type="range"
            min={2}
            max={200}
            step={1}
            value={dt}
            onChange={(e) => onDtChange(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 px-4 py-2 font-medium"
          onClick={onToggleRunning}
        >
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          className="rounded-2xl bg-slate-800 hover:bg-slate-700 px-4 py-2 font-medium"
          onClick={onReset}
        >
          Reset
        </button>
      </div>

      <div className="flex flex-col gap-2 text-sm">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={showTrail}
            onChange={(e) => onShowTrailChange(e.target.checked)}
          />
          Show trail
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={showVectors}
            onChange={(e) => onShowVectorsChange(e.target.checked)}
          />
          Show velocity and acceleration vectors
        </label>
      </div>
    </div>
  )
}
