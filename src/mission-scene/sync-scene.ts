import type { MutableRefObject } from "react";
import * as THREE from "three";
import {
  EARTH_ANGULAR_SPEED,
  getLaunchFrame,
  makeInitialRocketState,
  moonVelocityMeters,
} from "../physics/bodies";
import type { ManeuverInput } from "../physics/bodies";
import type {
  EarthMoonSimulation,
  SimulationTelemetry,
} from "../sim/simulation";
import {
  ORBIT_METERS_TO_SCENE_UNITS,
  EARTH_RENDER_RADIUS_SCENE_UNITS,
  MOON_RENDER_RADIUS_SCENE_UNITS,
} from "../three/objects/constants";
import { syncCelestialBodies } from "./sync-celestial-bodies";
import { syncRocketVisuals } from "./sync-rocket-visuals";
import { syncTrailDisplay, syncPredictionDisplay } from "./sync-trails";
import { syncMissionUi, syncCameraDebug } from "./sync-ui";
import type { ThreeSceneBundle } from "../three/scene";
import { type CameraRigState } from "../three/camera-rig";
import type { CameraDebugState } from "./types";
import type { FrameState } from "./frame-state";

export const CAMERA_DIRECTION = new THREE.Vector3();
const INDICATOR_MOON_VELOCITY = new THREE.Vector3();
const INDICATOR_RELATIVE_VELOCITY = new THREE.Vector3();
const LABEL_WORLD_POSITION = new THREE.Vector3();
const WORLD_FORWARD = new THREE.Vector3(0, 0, 1);

export type TelemetryState = ReturnType<EarthMoonSimulation["getTelemetry"]>;

type SyncMissionSceneParams = {
  bundle: ThreeSceneBundle;
  simulation: EarthMoonSimulation;
  cameraRigRef: MutableRefObject<CameraRigState>;
  runningRef: MutableRefObject<boolean>;
  maneuverInputRef: MutableRefObject<ManeuverInput>;
  launchSpeedRef: MutableRefObject<number>;
  launchAngleRef: MutableRefObject<number>;
  launchAzimuthRef: MutableRefObject<number>;
  showTrailRef: MutableRefObject<boolean>;
  showPredictionRef: MutableRefObject<boolean>;
  showThrustDirectionArrowRef: MutableRefObject<boolean>;
  previousTrailLengthRef: MutableRefObject<number>;
  lastUiSyncAtRef: MutableRefObject<number>;
  lastCameraDebugSyncAtRef: MutableRefObject<number>;
  lastTelemetryTimeRef: MutableRefObject<number | null>;
  lastRunningStatusRef: MutableRefObject<string | null>;
  setRunning: (value: boolean) => void;
  setStatus: (value: string) => void;
  setTelemetry: (value: SimulationTelemetry) => void;
  setCameraDebug: (value: CameraDebugState) => void;
};

export function syncMissionScene({
  bundle,
  simulation,
  cameraRigRef,
  runningRef,
  maneuverInputRef,
  launchSpeedRef,
  launchAngleRef,
  launchAzimuthRef,
  showTrailRef,
  showPredictionRef,
  showThrustDirectionArrowRef,
  previousTrailLengthRef,
  lastUiSyncAtRef,
  lastCameraDebugSyncAtRef,
  lastTelemetryTimeRef,
  lastRunningStatusRef,
  setRunning,
  setStatus,
  setTelemetry,
  setCameraDebug,
}: SyncMissionSceneParams) {
  const frame = createFrameState({
    simulation,
    launchSpeed: launchSpeedRef.current,
    launchAngleDeg: launchAngleRef.current,
    launchAzimuthDeg: launchAzimuthRef.current,
    running: runningRef.current,
  });

  syncCelestialBodies(bundle, frame);
  syncRocketVisuals(bundle, frame, {
    thrusting: maneuverInputRef.current.thrusting,
    showThrustDirectionArrow: showThrustDirectionArrowRef.current,
  });
  syncLaunchPreview(bundle, frame);
  syncTrailDisplay({
    bundle,
    simulation,
    showTrail: showTrailRef.current,
    previousTrailLengthRef,
  });
  syncPredictionDisplay({
    bundle,
    simulation,
    frame,
    running: runningRef.current,
    showPrediction: showPredictionRef.current,
  });
  syncOrientationIndicator(bundle, frame);
  syncFarAwayLabels(bundle);
  syncMissionUi({
    frame,
    runningRef,
    lastUiSyncAtRef,
    lastTelemetryTimeRef,
    lastRunningStatusRef,
    setRunning,
    setStatus,
    setTelemetry,
  });
  syncCameraDebug({
    bundle,
    cameraRigRef,
    frameNow: frame.now,
    lastCameraDebugSyncAtRef,
    setCameraDebug,
  });
}

function createFrameState({
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
  const launchFrame = getLaunchFrame(0, launchAzimuthDeg);
  const previewState = makeInitialRocketState(
    launchSpeed,
    launchAngleDeg,
    launchAzimuthDeg,
  );
  const normalizedLaunchSpeed = THREE.MathUtils.clamp(
    (launchSpeed - 7800) / (12100 - 7800),
    0,
    1,
  );

  return {
    now,
    simState,
    telemetry,
    launchFrame,
    previewState,
    aimArrowLength: THREE.MathUtils.lerp(12, 30, normalizedLaunchSpeed),
    stagedLaunchPreviewVisible:
      !running && simState.t === 0 && !simState.impact,
  };
}

function syncLaunchPreview(bundle: ThreeSceneBundle, frame: FrameState) {
  const { objects } = bundle;
  const {
    launchFrame,
    previewState,
    stagedLaunchPreviewVisible,
    aimArrowLength,
  } = frame;

  objects.launchRing.visible = stagedLaunchPreviewVisible;
  objects.launchLocationArrow.visible = stagedLaunchPreviewVisible;
  objects.launchTangentArrow.visible = stagedLaunchPreviewVisible;
  objects.launchAimArrow.visible = stagedLaunchPreviewVisible;

  const launchOrigin = launchFrame.position
    .clone()
    .multiplyScalar(ORBIT_METERS_TO_SCENE_UNITS);
  objects.launchLocationArrow.position.set(0, 0, 0);
  objects.launchLocationArrow.setDirection(launchFrame.radialHat.clone());
  objects.launchLocationArrow.setLength(launchOrigin.length(), 6, 3);
  objects.launchRing.position.copy(launchOrigin);
  objects.launchRing.quaternion.setFromUnitVectors(
    WORLD_FORWARD,
    launchFrame.radialHat.clone(),
  );
  objects.launchTangentArrow.position.copy(launchOrigin);
  objects.launchTangentArrow.setDirection(launchFrame.tangentHat.clone());
  objects.launchTangentArrow.setLength(14, 3.5, 1.75);
  objects.launchAimArrow.position.copy(launchOrigin);
  objects.launchAimArrow.setDirection(
    previewState.velocity.clone().normalize(),
  );
  objects.launchAimArrow.setLength(
    aimArrowLength,
    Math.max(4, aimArrowLength * 0.22),
    Math.max(2, aimArrowLength * 0.11),
  );
}

function syncOrientationIndicator(bundle: ThreeSceneBundle, frame: FrameState) {
  const { camera, objects, orientationIndicator, relativeVelocityIndicator } =
    bundle;

  orientationIndicator.frame.quaternion.copy(camera.quaternion).invert();
  orientationIndicator.rocket.quaternion.copy(objects.rocket.quaternion);

  relativeVelocityIndicator.frame.quaternion.copy(camera.quaternion).invert();
  INDICATOR_MOON_VELOCITY.copy(moonVelocityMeters(frame.simState.t));
  INDICATOR_RELATIVE_VELOCITY.copy(INDICATOR_MOON_VELOCITY).sub(
    frame.simState.rocket.velocity,
  );
  relativeVelocityIndicator.setValueLabel(
    formatSignedVelocityDelta(
      INDICATOR_MOON_VELOCITY.length() -
        frame.simState.rocket.velocity.length(),
    ),
  );

  if (INDICATOR_RELATIVE_VELOCITY.lengthSq() <= 1e-6) {
    relativeVelocityIndicator.arrow.visible = false;
    return;
  }

  INDICATOR_RELATIVE_VELOCITY.normalize();
  relativeVelocityIndicator.arrow.visible = true;
  relativeVelocityIndicator.arrow.position.copy(INDICATOR_RELATIVE_VELOCITY);
  relativeVelocityIndicator.arrow.position.multiplyScalar(
    -relativeVelocityIndicator.arrowLength * 0.5,
  );
  relativeVelocityIndicator.arrow.setDirection(INDICATOR_RELATIVE_VELOCITY);
}

function formatSignedVelocityDelta(valueMetersPerSecond: number): string {
  const sign = valueMetersPerSecond < 0 ? "-" : "";
  return `${sign}${(Math.abs(valueMetersPerSecond) / 1000).toFixed(2)} km/s`;
}

function syncFarAwayLabels(bundle: ThreeSceneBundle) {
  const { camera, objects, renderer } = bundle;
  const viewportHeight = renderer.domElement.clientHeight;

  updateFarAwayLabel(
    objects.earthLabel,
    objects.earthGroup,
    camera,
    viewportHeight,
    EARTH_RENDER_RADIUS_SCENE_UNITS,
    EARTH_RENDER_RADIUS_SCENE_UNITS * 18,
    10,
    24,
    150,
  );
  updateFarAwayLabel(
    objects.moonLabel,
    objects.moon,
    camera,
    viewportHeight,
    MOON_RENDER_RADIUS_SCENE_UNITS,
    MOON_RENDER_RADIUS_SCENE_UNITS * 24,
    9,
    20,
    90,
  );
}

function updateFarAwayLabel(
  sprite: THREE.Sprite,
  anchor: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  viewportHeight: number,
  bodyRadius: number,
  showDistance: number,
  minScale: number,
  maxScale: number,
  maxScreenDiameterPx: number,
) {
  anchor.getWorldPosition(LABEL_WORLD_POSITION);
  const cameraDistance = camera.position.distanceTo(LABEL_WORLD_POSITION);
  camera.getWorldDirection(CAMERA_DIRECTION);
  const inFrontOfCamera =
    LABEL_WORLD_POSITION.sub(camera.position)
      .normalize()
      .dot(CAMERA_DIRECTION) > 0.1;
  const projectedDiameterPx =
    cameraDistance > 1e-6
      ? (bodyRadius /
          (cameraDistance *
            Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)))) *
        viewportHeight
      : Number.POSITIVE_INFINITY;

  sprite.visible =
    cameraDistance >= showDistance &&
    inFrontOfCamera &&
    projectedDiameterPx <= maxScreenDiameterPx;
  if (!sprite.visible) return;

  const scale = THREE.MathUtils.clamp(
    cameraDistance * 0.05,
    minScale,
    maxScale,
  );
  sprite.scale.set(scale, scale * 0.375, 1);
}
