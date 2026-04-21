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
    <div className="rounded-[2rem] border border-white/10 bg-[#07111f]/85 shadow-[0_30px_90px_rgba(0,0,0,0.4)] p-5 space-y-5 backdrop-blur">
      <div className="space-y-3">
        <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-cyan-100">
          Mission Controls
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Translunar Launch</h1>
          <p className="mt-2 text-sm text-slate-300 leading-6">
            The rocket begins on Earth&apos;s surface, receives an initial impulse,
            and then coasts under Earth and Moon gravity only.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[0.72rem] uppercase tracking-[0.18em] text-slate-300">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Surface start
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Ballistic coast
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Earth + Moon gravity
          </span>
        </div>
      </div>

      <div className="space-y-4 rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
        <div className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
          Launch Inputs
        </div>

        <label className="block space-y-2">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-200">Launch speed</span>
            <span className="text-cyan-100">{launchSpeed.toLocaleString()} m/s</span>
          </div>
          <input
            className="w-full"
            type="range"
            min={7800}
            max={12100}
            step={50}
            value={launchSpeed}
            onChange={(e) => onLaunchSpeedChange(Number(e.target.value))}
          />
        </label>

        <label className="block space-y-2">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-200">Flight path angle from local tangent</span>
            <span className="text-cyan-100">{launchAngleDeg.toFixed(1)}°</span>
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

        <label className="block space-y-2">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-200">Integration time step</span>
            <span className="text-cyan-100">{dt.toFixed(0)} s</span>
          </div>
          <input
            className="w-full"
            type="range"
            min={5}
            max={120}
            step={5}
            value={dt}
            onChange={(e) => onDtChange(Number(e.target.value))}
          />
          <div className="text-xs leading-5 text-slate-400">
            Smaller steps improve accuracy near Earth and the Moon but require more
            frames to cover the same mission time.
          </div>
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-2xl bg-[#8be3ff] hover:bg-[#9ce8ff] text-[#03111a] px-4 py-2 font-semibold shadow-[0_14px_30px_rgba(91,207,255,0.25)] transition-colors"
          onClick={onToggleRunning}
        >
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          type="button"
          className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 font-semibold text-slate-100 transition-colors"
          onClick={onReset}
        >
          Reset
        </button>
      </div>

      <div className="space-y-3 rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
        <div className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
          View Options
        </div>
        <label className="inline-flex items-center gap-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={showTrail}
            onChange={(e) => onShowTrailChange(e.target.checked)}
          />
          Show trail
        </label>
        <label className="inline-flex items-center gap-3 text-sm text-slate-200">
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
