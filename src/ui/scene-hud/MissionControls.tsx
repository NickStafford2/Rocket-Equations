import { memo } from "react";
import { getButtonClassName } from "./shared";
import type { MissionControlsProps } from "./types";

export const MissionControls = memo(function MissionControls({
  running,
  onToggleRunning,
  onReset,
}: MissionControlsProps) {
  return (
    <div className="flex min-w-[168px] flex-col items-center gap-2 self-stretch">
      <div className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
        Mission
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className={getButtonClassName(running)}
          onClick={onToggleRunning}
        >
          {running ? "Pause" : "Start"}
        </button>
        <button
          type="button"
          className={getButtonClassName(false)}
          onClick={onReset}
        >
          Restart
        </button>
      </div>
    </div>
  );
});
