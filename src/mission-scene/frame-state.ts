import * as THREE from "three";
import { makeInitialRocketState, R_EARTH } from "../physics/bodies";
import type { EarthMoonSimulation } from "../sim/simulation";

const MIN_PREVIEW_SPEED_METERS_PER_SECOND = 7800;
const MAX_PREVIEW_SPEED_METERS_PER_SECOND = 12100;
const MIN_AIM_ARROW_LENGTH = 12;
const MAX_AIM_ARROW_LENGTH = 30;

export type FrameState = {
  now: number;
  simState: ReturnType<EarthMoonSimulation["getState"]>;
  telemetry: ReturnType<EarthMoonSimulation["getTelemetry"]>;
  launchFrame: ReturnType<EarthMoonSimulation["getLaunchFrame"]>;
  previewState: ReturnType<typeof makeInitialRocketState>;
  aimArrowLength: number;
  stagedLaunchPreviewVisible: boolean;
};

export function createFrameState({
  simulation,
  launchSpeed,
  launchAngleDeg,
  launchAzimuthDeg,
  running,
}: {
  simulation: EarthMoonSimulation;
  launchSpeed: number;
  launchAngleDeg: number;
  launchAzimuthDeg: number;
  running: boolean;
}): FrameState {
  const now = performance.now();
  const simState = simulation.getState();
  const telemetry = simulation.getTelemetry();
  const launchFrame = simulation.getLaunchFrame();
  const launchAltitudeMeters = Math.max(launchFrame.position.length() - R_EARTH, 0);
  const previewState = makeInitialRocketState(
    launchSpeed,
    launchAngleDeg,
    launchAzimuthDeg,
    launchAltitudeMeters,
  );
  const normalizedLaunchSpeed = THREE.MathUtils.clamp(
    (launchSpeed - MIN_PREVIEW_SPEED_METERS_PER_SECOND) /
      (MAX_PREVIEW_SPEED_METERS_PER_SECOND -
        MIN_PREVIEW_SPEED_METERS_PER_SECOND),
    0,
    1,
  );

  return {
    now,
    simState,
    telemetry,
    launchFrame,
    previewState,
    aimArrowLength: THREE.MathUtils.lerp(
      MIN_AIM_ARROW_LENGTH,
      MAX_AIM_ARROW_LENGTH,
      normalizedLaunchSpeed,
    ),
    stagedLaunchPreviewVisible:
      !running && simState.t === 0 && !simState.impact,
  };
}
