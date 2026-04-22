type CameraPreset = "overview" | "earth" | "moon" | "sun" | "rocket";

type SceneHudProps = {
  currentCameraPreset: CameraPreset | null;
  running: boolean;
  onCameraPreset: (preset: CameraPreset) => void;
  onToggleRunning: () => void;
  onReset: () => void;
};

const cameraButtons: Array<{ label: string; preset: CameraPreset }> = [
  { label: "Overview", preset: "overview" },
  { label: "Earth", preset: "earth" },
  { label: "Moon", preset: "moon" },
  { label: "Rocket", preset: "rocket" },
  { label: "Sun", preset: "sun" },
];

const baseButtonClassName =
  "rounded-xl border px-3 py-2 text-sm font-medium backdrop-blur transition-colors";

const defaultButtonClassName =
  "border-white/35 bg-white/8 text-white/90 hover:bg-white/12";

const selectedButtonClassName =
  "border-cyan-100/75 bg-cyan-300/20 text-cyan-50 shadow-[0_0_0_1px_rgba(207,250,254,0.18)_inset]";

export function SceneHud({
  currentCameraPreset,
  running,
  onCameraPreset,
  onToggleRunning,
  onReset,
}: SceneHudProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute inset-x-5 bottom-5 flex justify-center">
        <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-2 rounded-[1.4rem] border border-white/12 bg-[#07111f]/35 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-md">
          <button
            type="button"
            className={`${baseButtonClassName} ${
              running ? selectedButtonClassName : defaultButtonClassName
            }`}
            onClick={onToggleRunning}
          >
            {running ? "Pause" : "Start"}
          </button>
          <button
            type="button"
            className={`${baseButtonClassName} ${defaultButtonClassName}`}
            onClick={onReset}
          >
            Reset
          </button>
          {cameraButtons.map(({ label, preset }) => {
            const isSelected = currentCameraPreset === preset;

            return (
              <button
                key={preset}
                type="button"
                className={`${baseButtonClassName} ${
                  isSelected ? selectedButtonClassName : defaultButtonClassName
                }`}
                onClick={() => onCameraPreset(preset)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
