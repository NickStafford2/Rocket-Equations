type ControlsProps = {
  launchSpeed: number;
  launchAngleDeg: number;
  launchAzimuthDeg: number;
  dt: number;
  showTrail: boolean;
  showVectors: boolean;
  running: boolean;
  onCameraPreset: (
    preset: "overview" | "earth" | "moon" | "sun" | "rocket",
  ) => void;
  onLaunchSpeedChange: (value: number) => void;
  onLaunchAngleChange: (value: number) => void;
  onLaunchAzimuthChange: (value: number) => void;
  onDtChange: (value: number) => void;
  onShowTrailChange: (value: boolean) => void;
  onShowVectorsChange: (value: boolean) => void;
  onToggleRunning: () => void;
  onReset: () => void;
};

export function Controls({
  launchSpeed,
  launchAngleDeg,
  launchAzimuthDeg,
  dt,
  showTrail,
  showVectors,
  running,
  onCameraPreset,
  onLaunchSpeedChange,
  onLaunchAngleChange,
  onLaunchAzimuthChange,
  onDtChange,
  onShowTrailChange,
  onShowVectorsChange,
  onToggleRunning,
  onReset,
}: ControlsProps) {
  return (
    <div className="space-y-5 rounded-[2rem] border border-white/10 bg-[#07111f]/85 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.4)] backdrop-blur">
      <div className="space-y-3">
        <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[0.72rem] font-semibold tracking-[0.24em] text-cyan-100 uppercase">
          Mission Controls
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Translunar Launch
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            The rocket begins on Earth&apos;s surface, receives an initial
            impulse, and then coasts under Earth and Moon gravity only.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-300/12 bg-cyan-300/8 px-4 py-3 text-xs leading-5 text-slate-200">
          Changing any launch input immediately restages the rocket at t = 0 so
          the preview arrows always match the next launch.
        </div>
      </div>

      <div className="space-y-4 rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
        <div className="text-[0.72rem] font-semibold tracking-[0.24em] text-slate-400 uppercase">
          Launch Inputs
        </div>

        <label className="block space-y-2">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-200">Launch speed</span>
            <span className="text-cyan-100">
              {launchSpeed.toLocaleString()} m/s
            </span>
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
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-200">Launch location around Earth</span>
            <span className="text-cyan-100">
              {launchAzimuthDeg.toFixed(0)}°
            </span>
          </div>
          <input
            className="w-full"
            type="range"
            min={0}
            max={360}
            step={1}
            value={launchAzimuthDeg}
            onChange={(e) => onLaunchAzimuthChange(Number(e.target.value))}
          />
          <div className="text-xs leading-5 text-slate-400">
            Rotates the launch point around Earth&apos;s equator.
          </div>
        </label>

        <label className="block space-y-2">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-200">
              Flight path angle above local tangent
            </span>
            <span className="text-cyan-100">{launchAngleDeg.toFixed(1)}°</span>
          </div>
          <input
            className="w-full"
            type="range"
            min={0}
            max={180}
            step={1}
            value={launchAngleDeg}
            onChange={(e) => onLaunchAngleChange(Number(e.target.value))}
          />
          <div className="text-xs leading-5 text-slate-400">
            The preview is planar: 0° follows the local tangent, 90° points
            straight away from Earth, and 180° reverses along the tangent.
          </div>
        </label>

        <label className="block space-y-2">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-200">Integration time step</span>
            <span className="text-cyan-100">{dt.toFixed(0)} s</span>
          </div>
          <input
            className="w-full"
            type="range"
            min={5}
            max={1000}
            step={5}
            value={dt}
            onChange={(e) => onDtChange(Number(e.target.value))}
          />
          <div className="text-xs leading-5 text-slate-400">
            Smaller steps improve accuracy near Earth and the Moon but require
            more frames to cover the same mission time.
          </div>
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-2xl bg-[#8be3ff] px-4 py-2 font-semibold text-[#03111a] shadow-[0_14px_30px_rgba(91,207,255,0.25)] transition-colors hover:bg-[#9ce8ff]"
          onClick={onToggleRunning}
        >
          {running ? "Pause" : "Start"}
        </button>
        <button
          type="button"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 font-semibold text-slate-100 transition-colors hover:bg-white/10"
          onClick={onReset}
        >
          Reset
        </button>
      </div>

      <div className="space-y-3 rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
        <div className="text-[0.72rem] font-semibold tracking-[0.24em] text-slate-400 uppercase">
          Camera
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10"
            onClick={() => onCameraPreset("overview")}
          >
            Overview
          </button>
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10"
            onClick={() => onCameraPreset("earth")}
          >
            Earth
          </button>
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10"
            onClick={() => onCameraPreset("moon")}
          >
            Moon
          </button>
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10"
            onClick={() => onCameraPreset("rocket")}
          >
            Rocket
          </button>
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10"
            onClick={() => onCameraPreset("sun")}
          >
            Sun
          </button>
        </div>
        <div className="text-xs leading-5 text-slate-400">
          Double-click Earth, Moon, Rocket, or Sun to focus the camera.
        </div>
      </div>

      <div className="space-y-3 rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
        <div className="text-[0.72rem] font-semibold tracking-[0.24em] text-slate-400 uppercase">
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
  );
}
