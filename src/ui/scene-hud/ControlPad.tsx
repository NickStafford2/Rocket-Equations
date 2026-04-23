import { memo } from "react";
import { KeyboardCluster, type KeyboardClusterConfig } from "./shared";
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
    <div className="pointer-events-auto flex flex-wrap items-end justify-center gap-3 rounded-[1.4rem] border border-white/12 bg-[#07111f]/35 px-4 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-md">
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
