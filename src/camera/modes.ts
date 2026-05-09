import type { CameraFrame } from "./frames";
import type { CameraTarget } from "./targets";

export type CameraMode = "overview" | "free" | "inertialFollow" | "bodyOrbit";

export function resolveCameraMode({
  overviewActive,
  followTarget,
  lookTarget,
  frame,
}: {
  overviewActive: boolean;
  followTarget: CameraTarget | null;
  lookTarget: CameraTarget | null;
  frame: CameraFrame | null;
}): CameraMode {
  if (overviewActive) {
    return "overview";
  }

  if (!followTarget && !lookTarget) {
    return "free";
  }

  if (followTarget?.id === "rocket" && frame?.kind === "bodyLocal") {
    return "bodyOrbit";
  }

  return "inertialFollow";
}
