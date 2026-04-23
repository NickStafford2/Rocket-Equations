import type { CameraTarget } from "../mission";
import { MissionTelemetryPanel } from "./mission-panels";

type SceneHudProps = {
  isOverviewActive: boolean;
  currentLockTarget: CameraTarget | null;
  currentLookTarget: CameraTarget | null;
  running: boolean;
  elapsedMissionTime: string;
  currentSpeed: string;
  moonRelativeSpeed: string;
  earthAltitude: string;
  moonAltitude: string;
  status: string;
  onOverview: () => void;
  onLockTarget: (target: CameraTarget) => void;
  onLookAtTarget: (target: CameraTarget) => void;
  onToggleRunning: () => void;
  onReset: () => void;
};

const baseButtonClassName =
  "rounded-xl border px-3 py-2 text-sm font-medium backdrop-blur transition-colors";

const defaultButtonClassName =
  "border-white/35 bg-white/8 text-white/90 hover:bg-white/12";

const selectedButtonClassName =
  "border-cyan-100/75 bg-cyan-300/20 text-cyan-50 shadow-[0_0_0_1px_rgba(207,250,254,0.18)_inset]";

function getButtonClassName(isSelected: boolean): string {
  return `${baseButtonClassName} ${
    isSelected ? selectedButtonClassName : defaultButtonClassName
  }`;
}

export function SceneHud({
  isOverviewActive,
  currentLockTarget,
  currentLookTarget,
  running,
  elapsedMissionTime,
  currentSpeed,
  moonRelativeSpeed,
  earthAltitude,
  moonAltitude,
  status,
  onOverview,
  onLockTarget,
  onLookAtTarget,
  onToggleRunning,
  onReset,
}: SceneHudProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="pointer-events-auto absolute inset-x-5 overflow-x-auto">
        <MissionTelemetryPanel
          elapsedMissionTime={elapsedMissionTime}
          currentSpeed={currentSpeed}
          moonRelativeSpeed={moonRelativeSpeed}
          earthAltitude={earthAltitude}
          moonAltitude={moonAltitude}
          status={status}
        />
      </div>

      <div className="absolute bottom-5 left-5">
        <div className="pointer-events-auto flex items-end gap-3 rounded-[1.4rem] border border-white/12 bg-[#07111f]/35 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-md">
          <div className="flex flex-col gap-2">
            <div className="px-1 text-[0.65rem] font-semibold tracking-[0.2em] text-slate-300 uppercase">
              Camera
            </div>
            <button
              type="button"
              className={getButtonClassName(isOverviewActive)}
              onClick={onOverview}
            >
              Overview
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="px-1 text-[0.65rem] font-semibold tracking-[0.2em] text-slate-300 uppercase">
              Lock On
            </div>
            <button
              type="button"
              className={getButtonClassName(currentLockTarget === "earth")}
              onClick={() => onLockTarget("earth")}
            >
              Earth
            </button>
            <button
              type="button"
              className={getButtonClassName(currentLockTarget === "moon")}
              onClick={() => onLockTarget("moon")}
            >
              Moon
            </button>
            <button
              type="button"
              className={getButtonClassName(currentLockTarget === "rocket")}
              onClick={() => onLockTarget("rocket")}
            >
              Rocket
            </button>
            <button
              type="button"
              className={getButtonClassName(currentLockTarget === "sun")}
              onClick={() => onLockTarget("sun")}
            >
              Sun
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="px-1 text-[0.65rem] font-semibold tracking-[0.2em] text-slate-300 uppercase">
              Look At
            </div>
            <button
              type="button"
              className={getButtonClassName(currentLookTarget === "earth")}
              onClick={() => onLookAtTarget("earth")}
            >
              Earth
            </button>
            <button
              type="button"
              className={getButtonClassName(currentLookTarget === "moon")}
              onClick={() => onLookAtTarget("moon")}
            >
              Moon
            </button>
            <button
              type="button"
              className={getButtonClassName(currentLookTarget === "rocket")}
              onClick={() => onLookAtTarget("rocket")}
            >
              Rocket
            </button>
            <button
              type="button"
              className={getButtonClassName(currentLookTarget === "sun")}
              onClick={() => onLookAtTarget("sun")}
            >
              Sun
            </button>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-5 bottom-5 flex justify-center">
        <div className="pointer-events-auto flex items-center justify-center gap-2 rounded-[1.4rem] border border-white/12 bg-[#07111f]/35 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-md">
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
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
