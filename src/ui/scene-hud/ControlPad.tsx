import { memo } from "react";
import {
  ARROW_CLUSTER,
  KeyboardCluster,
  WASD_CLUSTER,
  type KeyboardClusterConfig,
} from "./shared";
import { MissionControls } from "./MissionControls";
import type { ControlPadProps } from "./types";

export const ControlPad = memo(function ControlPad({
  running,
  pressedControls,
  onToggleRunning,
  onReset,
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

  return (
    <div className="pointer-events-auto flex flex-wrap items-end justify-center gap-3 rounded-[1.4rem] border border-white/12 bg-[#07111f]/35 px-4 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-md">
      <KeyboardCluster
        cluster={ARROW_CLUSTER}
        pressedControls={pressedControls}
        onPress={onMissionControlPress}
        onRelease={onMissionControlRelease}
      />
      <KeyboardCluster
        cluster={WASD_CLUSTER}
        pressedControls={pressedControls}
        onPress={onMissionControlPress}
        onRelease={onMissionControlRelease}
      />
      <MissionControls
        running={running}
        onToggleRunning={onToggleRunning}
        onReset={onReset}
      />
      <KeyboardCluster
        cluster={missionCluster}
        pressedControls={pressedControls}
        onPress={onMissionControlPress}
        onRelease={onMissionControlRelease}
      />
    </div>
  );
});
