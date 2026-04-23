import { memo } from "react";
import type { MissionControlKey } from "../../use-mission-simulation";
import { HoverHelp } from "../hover-help";
import type { SceneHudProps } from "./types";

type ControlPadProps = Pick<
  SceneHudProps,
  | "running"
  | "pressedControls"
  | "onToggleRunning"
  | "onReset"
  | "onMissionControlPress"
  | "onMissionControlRelease"
>;

export const ControlPad = memo(function ControlPad({
  running,
  pressedControls,
  onMissionControlPress,
  onMissionControlRelease,
}: ControlPadProps) {
  const missionCluster: KeyboardClusterConfig = {
    label: "Mission keys",
    className: "min-w-[176px]",
    rows: [
      [
        {
          control: "Space",
          label: "Space",
          caption: running ? "Pause" : "Start",
          wide: true,
        },
      ],
      [{ control: "KeyR", label: "R", caption: "Restart" }],
    ],
  };

  const ARROW_CLUSTER: KeyboardClusterConfig = {
    label: "Arrow keys",
    description:
      "Left and Right rotate the ship. Up applies thrust while you hold it.",
    className: "min-w-[176px]",
    rows: [
      [{ control: "ArrowUp", label: "↑", caption: "Thrust" }],
      [
        { control: "ArrowLeft", label: "←", caption: "Left" },
        { control: "ArrowRight", label: "→", caption: "Right" },
      ],
    ],
  };

  const WASD_CLUSTER: KeyboardClusterConfig = {
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

  return (
    <div className="pointer-events-auto flex h-fit flex-wrap items-end justify-center gap-3 rounded-[1.4rem] border border-white/12 bg-[#07111f]/35 px-4 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-md">
      <KeyboardCluster
        cluster={WASD_CLUSTER}
        pressedControls={pressedControls}
        onPress={onMissionControlPress}
        onRelease={onMissionControlRelease}
      />
      <KeyboardCluster
        cluster={missionCluster}
        pressedControls={pressedControls}
        onPress={onMissionControlPress}
        onRelease={onMissionControlRelease}
      />
      <KeyboardCluster
        cluster={ARROW_CLUSTER}
        pressedControls={pressedControls}
        onPress={onMissionControlPress}
        onRelease={onMissionControlRelease}
      />
    </div>
  );
});

type KeyboardKeyConfig = {
  control: MissionControlKey;
  label: string;
  caption: string;
  wide?: boolean;
};

type KeyboardClusterConfig = {
  label: string;
  description?: string;
  className?: string;
  rows: KeyboardKeyConfig[][];
};

function KeyboardCluster({
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
    <div
      className={`flex flex-col items-center gap-2 ${cluster.className ?? ""}`}
    >
      <div className="flex items-center gap-1.5 text-[0.62rem] font-semibold tracking-[0.24em] text-slate-400 uppercase">
        <span>{cluster.label}</span>
        {cluster.description ? (
          <HoverHelp description={cluster.description} />
        ) : null}
      </div>
      {cluster.rows.map((row, rowIndex) => (
        <div
          key={`${cluster.label}-${rowIndex}`}
          className="flex items-center justify-center gap-2"
        >
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
      className={`flex h-14 ${wide ? "min-w-[7.5rem]" : "min-w-14"} touch-none flex-col items-center justify-center rounded-[1rem] border px-3 transition-colors select-none ${className}`}
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
      <span className="text-base font-semibold tracking-[0.08em] uppercase">
        {label}
      </span>
      <span className="mt-0.5 text-[0.58rem] font-medium tracking-[0.16em] uppercase opacity-70">
        {caption}
      </span>
    </button>
  );
}
