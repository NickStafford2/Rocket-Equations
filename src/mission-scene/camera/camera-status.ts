import type { CameraRigState, CameraRigTarget } from "./camera-types";

export function getTargetLabel(target: CameraRigTarget): string {
  return String(target.object.userData.focusLabel ?? target.key);
}

export function getOverviewStatus(rig: CameraRigState): string {
  return rig.positionTransitioning || rig.targetTransitioning
    ? "Overview transition canceled."
    : "Free camera enabled.";
}

export function getTrackingCanceledStatus(): string {
  return "Camera tracking canceled.";
}

export function getControlsStartStatus(rig: CameraRigState): string | null {
  if (rig.mode === "free") {
    return null;
  }

  if (rig.mode === "overview") {
    return getOverviewStatus(rig);
  }

  return getTrackingCanceledStatus();
}

export function getFollowTargetStatus(target: CameraRigTarget): string {
  return `Locked on ${getTargetLabel(target)}.`;
}

export function getLookTargetStatus(target: CameraRigTarget): string {
  return `Looking at ${getTargetLabel(target)}.`;
}

export function getModeSummary(rig: CameraRigState): string {
  if (rig.mode === "overview") return "overview";
  if (!rig.follow && !rig.look) return "free";

  if (rig.follow && rig.look && rig.follow.key !== rig.look.key) {
    return `follow:${rig.follow.key} look:${rig.look.key}`;
  }

  const target = rig.look ?? rig.follow;
  return target ? `locked:${target.key}` : "free";
}

export function drainCameraRigStatuses(rig: CameraRigState): string[] {
  const statuses: string[] = [];

  if (rig.pendingOverviewStatus) {
    statuses.push(rig.pendingOverviewStatus);
    rig.pendingOverviewStatus = null;
  }

  if (rig.pendingPositionStatus) {
    statuses.push(rig.pendingPositionStatus);
    rig.pendingPositionStatus = null;
  }

  if (rig.pendingTargetStatus) {
    statuses.push(rig.pendingTargetStatus);
    rig.pendingTargetStatus = null;
  }

  return statuses;
}
