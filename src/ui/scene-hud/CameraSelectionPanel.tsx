import { memo } from "react";
import {
  CAMERA_CONTROL_PANEL_CLASS_NAME,
  CameraTargetColumn,
  getButtonClassName,
} from "./shared";
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
  return (
    <div className={CAMERA_CONTROL_PANEL_CLASS_NAME}>
      <CameraDebugPanel cameraDebug={cameraDebug} />
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
