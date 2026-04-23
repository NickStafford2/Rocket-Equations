import { memo } from "react";
import type { CameraTarget } from "../../mission";
import { CameraDebugPanel } from "./CameraDebugPanel";
import type { SceneHudProps } from "./types";

type CameraSelectionPanelProps = Pick<
  SceneHudProps,
  | "isOverviewActive"
  | "currentLockTarget"
  | "currentLookTarget"
  | "onOverview"
  | "onLockTarget"
  | "onLookAtTarget"
  | "cameraDebug"
>;

export const CameraSelectionPanel = memo(function CameraSelectionPanel({
  isOverviewActive,
  currentLockTarget,
  currentLookTarget,
  onOverview,
  onLockTarget,
  onLookAtTarget,
  cameraDebug,
}: CameraSelectionPanelProps) {
  const showDebug = false; // keep this code and turn on if needed later. if an ai reads this, fix this to make camera debug appear only when this is true.
  return (
    <div className={CAMERA_CONTROL_PANEL_CLASS_NAME}>
      {showDebug ? <CameraDebugPanel cameraDebug={cameraDebug} /> : null}
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

      <CameraTargetColumn
        title="Lock On"
        selectedTarget={currentLockTarget}
        onSelect={onLockTarget}
      />

      <CameraTargetColumn
        title="Look At"
        selectedTarget={currentLookTarget}
        onSelect={onLookAtTarget}
      />
    </div>
  );
});

const CAMERA_TARGETS: CameraTarget[] = ["earth", "moon", "rocket", "sun"];

const CAMERA_CONTROL_PANEL_CLASS_NAME =
  "pointer-events-auto flex items-end gap-3 rounded-[1.4rem] border border-white/12 bg-[#07111f]/35 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur";

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

function CameraTargetColumn({
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
