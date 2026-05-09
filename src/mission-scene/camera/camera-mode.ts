import type { CameraRigState } from "./camera-types";

export function syncCameraRigMode(rig: CameraRigState) {
  if (rig.mode === "overview") return;

  if (!rig.follow && !rig.look) {
    rig.mode = "free";
    rig.positionTransitioning = false;
    rig.targetTransitioning = false;
    rig.pendingPositionStatus = null;
    rig.pendingTargetStatus = null;
    rig.pendingOverviewStatus = null;
    return;
  }

  rig.pendingOverviewStatus = null;
  rig.mode = "tracking";
}
