import { formatDt } from "../../mission";
import type { CameraTarget } from "../../mission";
import type { MissionControlKey } from "../../use-mission-simulation";
import { HoverHelp } from "../hover-help";

type KeyboardKeyConfig = {
  control: MissionControlKey;
  label: string;
  caption: string;
  wide?: boolean;
};

export type KeyboardClusterConfig = {
  label: string;
  description?: string;
  className?: string;
  rows: KeyboardKeyConfig[][];
};

const baseButtonClassName =
  "rounded-xl border px-3 py-2 text-sm font-medium backdrop-blur transition-colors";

const defaultButtonClassName =
  "border-white/35 bg-white/8 text-white/90 hover:bg-white/12";

const selectedButtonClassName =
  "border-cyan-100/75 bg-cyan-300/20 text-cyan-50 shadow-[0_0_0_1px_rgba(207,250,254,0.18)_inset]";

export const CAMERA_TARGETS: CameraTarget[] = ["earth", "moon", "rocket", "sun"];

export const CAMERA_CONTROL_PANEL_CLASS_NAME =
  "pointer-events-auto flex items-end gap-3 rounded-[1.4rem] border border-white/12 bg-[#07111f]/35 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-md";

export const ARROW_CLUSTER: KeyboardClusterConfig = {
  label: "Arrow keys",
  description: "Left and Right rotate the ship. Up applies thrust while you hold it.",
  className: "min-w-[176px]",
  rows: [
    [{ control: "ArrowUp", label: "↑", caption: "Thrust" }],
    [
      { control: "ArrowLeft", label: "←", caption: "Left" },
      { control: "ArrowRight", label: "→", caption: "Right" },
    ],
  ],
};

export const WASD_CLUSTER: KeyboardClusterConfig = {
  label: "WASD",
  description:
    "W multiplies delta t by 10, S divides it by 10, A trims it down by 2%, and D increases it by 2%.",
  className: "min-w-[232px]",
  rows: [
    [{ control: "KeyW", label: "W", caption: "x10" }],
    [
      { control: "KeyA", label: "A", caption: "-2%" },
      { control: "KeyS", label: "S", caption: "/10" },
      { control: "KeyD", label: "D", caption: "+2%" },
    ],
  ],
};

export function getButtonClassName(isSelected: boolean): string {
  return `${baseButtonClassName} ${
    isSelected ? selectedButtonClassName : defaultButtonClassName
  }`;
}

export function CameraTargetColumn({
  title,
  selectedTarget,
  onSelect,
}: {
  title: string;
  selectedTarget: CameraTarget | null;
  onSelect: (target: CameraTarget) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="px-1 text-[0.65rem] font-semibold tracking-[0.2em] text-slate-300 uppercase">
        {title}
      </div>
      {CAMERA_TARGETS.map((target) => (
        <button
          key={target}
          type="button"
          className={getButtonClassName(selectedTarget === target)}
          onClick={() => onSelect(target)}
        >
          {target[0].toUpperCase()}
          {target.slice(1)}
        </button>
      ))}
    </div>
  );
}

type CompactSliderProps = {
  label: string;
  description: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
};

export function CompactSlider({
  label,
  description,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
}: CompactSliderProps) {
  return (
    <label className="block rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-3 text-[0.72rem] text-slate-200">
        <LabelWithHelp label={label} description={description} />
        <span className="text-cyan-100">{valueLabel}</span>
      </div>
      <input
        className="block w-full accent-cyan-300"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

type CompactCheckboxProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

export function CompactCheckbox({
  label,
  description,
  checked,
  onChange,
}: CompactCheckboxProps) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-slate-200">
      <LabelWithHelp label={label} description={description} />
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

export function KeyboardCluster({
  cluster,
  pressedControls,
  onPress,
  onRelease,
}: {
  cluster: KeyboardClusterConfig;
  pressedControls: Record<MissionControlKey, boolean>;
  onPress: (control: MissionControlKey) => void;
  onRelease: (control: MissionControlKey) => void;
}) {
  return (
    <div className={`flex flex-col items-center gap-2 ${cluster.className ?? ""}`}>
      <div className="flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
        <span>{cluster.label}</span>
        {cluster.description ? <HoverHelp description={cluster.description} /> : null}
      </div>
      {cluster.rows.map((row, rowIndex) => (
        <div key={`${cluster.label}-${rowIndex}`} className="flex items-center justify-center gap-2">
          {row.map((keyConfig) => (
            <KeyboardKeyButton
              key={keyConfig.control}
              label={keyConfig.label}
              caption={keyConfig.caption}
              control={keyConfig.control}
              pressed={pressedControls[keyConfig.control]}
              onPress={onPress}
              onRelease={onRelease}
              wide={keyConfig.wide}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

type KeyboardKeyButtonProps = {
  label: string;
  caption: string;
  control: MissionControlKey;
  pressed: boolean;
  onPress: (control: MissionControlKey) => void;
  onRelease: (control: MissionControlKey) => void;
  wide?: boolean;
};

function KeyboardKeyButton({
  label,
  caption,
  control,
  pressed,
  onPress,
  onRelease,
  wide = false,
}: KeyboardKeyButtonProps) {
  const className = pressed
    ? "border-white/95 bg-white text-slate-950 shadow-[0_0_0_1px_rgba(255,255,255,0.5)_inset,0_10px_22px_rgba(255,255,255,0.18)]"
    : "border-white/20 bg-[linear-gradient(180deg,rgba(248,250,252,0.18),rgba(148,163,184,0.08))] text-slate-100 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_12px_24px_rgba(2,6,23,0.35)] hover:border-white/30 hover:bg-[linear-gradient(180deg,rgba(248,250,252,0.24),rgba(148,163,184,0.12))]";

  return (
    <button
      type="button"
      aria-label={`${label} control`}
      className={`flex h-14 ${wide ? "min-w-[7.5rem]" : "min-w-14"} select-none touch-none flex-col items-center justify-center rounded-[1rem] border px-3 transition-colors ${className}`}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        onPress(control);
      }}
      onPointerUp={(event) => {
        event.preventDefault();
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        onRelease(control);
      }}
      onPointerLeave={() => onRelease(control)}
      onPointerCancel={() => onRelease(control)}
    >
      <span className="text-base font-semibold uppercase tracking-[0.08em]">
        {label}
      </span>
      <span className="mt-0.5 text-[0.58rem] font-medium uppercase tracking-[0.16em] opacity-70">
        {caption}
      </span>
    </button>
  );
}

function LabelWithHelp({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <span>{label}</span>
      <HoverHelp description={description} />
    </span>
  );
}

export function formatTimeStepLabel(dt: number) {
  return `${formatDt(dt)} s`;
}
