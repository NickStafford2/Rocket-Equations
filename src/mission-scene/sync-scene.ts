import type { MutableRefObject } from "react";
import * as THREE from "three";
import {
  EARTH_ANGULAR_SPEED,
  getLaunchFrame,
  makeInitialRocketState,
  moonVelocityMeters,
} from "../physics/bodies";
import type { ManeuverInput } from "../physics/bodies";
import {
  describeMoonLanding,
  formatSpeed,
  getMissionPhase,
} from "../mission";
import type { EarthMoonSimulation, SimulationTelemetry } from "../sim/simulation";
import { TRAIL_POINT_CAPACITY } from "../sim/trail";
import {
  DISTANCE_SCALE,
  EARTH_DRAW_RADIUS,
  metersToScene,
  MOON_DRAW_RADIUS,
  ROCKET_DRAW_RADIUS,
} from "../three/objects";
import { syncSatelliteSystem } from "../three/objects/satellites";
import type { ThreeSceneBundle } from "../three/scene";
import { getCameraDebugSnapshot, type CameraRigState } from "../three/camera-rig";
import type { CameraDebugState } from "./types";

const UI_SYNC_INTERVAL_MS = 100;
const CAMERA_DIRECTION = new THREE.Vector3();
const INDICATOR_MOON_VELOCITY = new THREE.Vector3();
const INDICATOR_RELATIVE_VELOCITY = new THREE.Vector3();
const LABEL_WORLD_POSITION = new THREE.Vector3();
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const WORLD_FORWARD = new THREE.Vector3(0, 0, 1);

type SimulationState = ReturnType<EarthMoonSimulation["getState"]>;
type TelemetryState = ReturnType<EarthMoonSimulation["getTelemetry"]>;

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

type FrameState = {
  now: number;
  simState: SimulationState;
  telemetry: TelemetryState;
  launchFrame: ReturnType<typeof getLaunchFrame>;
  previewState: ReturnType<typeof makeInitialRocketState>;
  aimArrowLength: number;
  stagedLaunchPreviewVisible: boolean;
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
    stagedLaunchPreviewVisible: !running && simState.t === 0 && !simState.impact,
  };
}

function syncCelestialBodies(bundle: ThreeSceneBundle, frame: FrameState) {
  const { objects } = bundle;

  objects.earthRotatingFrame.rotation.y = EARTH_ANGULAR_SPEED * frame.simState.t;
  syncSatelliteSystem(objects.satelliteSystem, frame.simState.t);
  objects.moon.position.copy(metersToScene(frame.telemetry.moonPosition));
  objects.rocket.position.copy(metersToScene(frame.simState.rocket.position));
}

function syncRocketVisuals(
  bundle: ThreeSceneBundle,
  frame: FrameState,
  {
    thrusting,
    showThrustDirectionArrow,
  }: {
    thrusting: boolean;
    showThrustDirectionArrow: boolean;
  },
) {
  const { objects } = bundle;

  objects.thrustDirectionArrow.position.copy(objects.rocket.position);
  objects.thrustDirectionArrow.visible = showThrustDirectionArrow;
  objects.enginePlume.visible = frame.stagedLaunchPreviewVisible ? false : thrusting;

  if (objects.enginePlume.visible) {
    const plumeScale = 0.9 + Math.abs(Math.sin(frame.simState.t * 0.08)) * 0.45;
    objects.enginePlume.scale.setScalar(plumeScale);
  }

  if (frame.simState.rocket.heading.lengthSq() <= 1e-6) {
    return;
  }

  const heading = frame.simState.rocket.heading.clone().normalize();
  objects.thrustDirectionArrow.setDirection(heading);
  objects.thrustDirectionArrow.setLength(
    ROCKET_DRAW_RADIUS * 11,
    ROCKET_DRAW_RADIUS * 2.8,
    ROCKET_DRAW_RADIUS * 1.4,
  );
  objects.rocket.quaternion.setFromUnitVectors(WORLD_UP, heading);
}

function syncLaunchPreview(bundle: ThreeSceneBundle, frame: FrameState) {
  const { objects } = bundle;
  const { launchFrame, previewState, stagedLaunchPreviewVisible, aimArrowLength } =
    frame;

  objects.launchRing.visible = stagedLaunchPreviewVisible;
  objects.launchLocationArrow.visible = stagedLaunchPreviewVisible;
  objects.launchTangentArrow.visible = stagedLaunchPreviewVisible;
  objects.launchAimArrow.visible = stagedLaunchPreviewVisible;

  const launchOrigin = metersToScene(launchFrame.position);
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
  objects.launchAimArrow.setDirection(previewState.velocity.clone().normalize());
  objects.launchAimArrow.setLength(
    aimArrowLength,
    Math.max(4, aimArrowLength * 0.22),
    Math.max(2, aimArrowLength * 0.11),
  );
}

function syncTrailDisplay({
  bundle,
  simulation,
  showTrail,
  previousTrailLengthRef,
}: {
  bundle: ThreeSceneBundle;
  simulation: EarthMoonSimulation;
  showTrail: boolean;
  previousTrailLengthRef: MutableRefObject<number>;
}) {
  bundle.objects.trailLine.visible = showTrail;

  const trailLength = simulation.getTrailLength();
  const previousTrailLength = previousTrailLengthRef.current;
  const trailIsSlidingWindow =
    trailLength === TRAIL_POINT_CAPACITY &&
    previousTrailLength === TRAIL_POINT_CAPACITY;

  if (trailLength === previousTrailLength && !trailIsSlidingWindow) {
    return;
  }

  const startIndex =
    trailLength < previousTrailLength || trailIsSlidingWindow
      ? 0
      : previousTrailLength;
  const trailPositions = bundle.objects.trailLine.geometry.getAttribute(
    "position",
  ) as THREE.BufferAttribute;
  const positionArray = trailPositions.array as Float32Array;

  simulation.copyTrailPositionsTo(positionArray, DISTANCE_SCALE, startIndex);
  trailPositions.needsUpdate = true;
  bundle.objects.trailLine.geometry.setDrawRange(0, trailLength);
  previousTrailLengthRef.current = trailLength;
}

function syncPredictionDisplay({
  bundle,
  simulation,
  frame,
  running,
  showPrediction,
}: {
  bundle: ThreeSceneBundle;
  simulation: EarthMoonSimulation;
  frame: FrameState;
  running: boolean;
  showPrediction: boolean;
}) {
  bundle.objects.predictionLine.visible = showPrediction;

  if (!showPrediction) {
    return;
  }

  const sourceState = frame.stagedLaunchPreviewVisible
    ? {
        t: 0,
        position: frame.previewState.position,
        velocity: frame.previewState.velocity,
      }
    : {
        t: frame.simState.t,
        position: frame.simState.rocket.position,
        velocity: frame.simState.rocket.velocity,
      }

  const predictionUpdated = simulation.refreshPrediction(
    frame.now,
    sourceState,
    running,
  )
  const predictionLength = simulation.getPredictionLength();

  if (
    !predictionUpdated &&
    bundle.objects.predictionLine.geometry.drawRange.count === predictionLength
  ) {
    return;
  }

  const predictionPositions = bundle.objects.predictionLine.geometry.getAttribute(
    "position",
  ) as THREE.BufferAttribute;
  const positionArray = predictionPositions.array as Float32Array;

  simulation.copyPredictionPositionsTo(positionArray, DISTANCE_SCALE);
  predictionPositions.needsUpdate = true;
  bundle.objects.predictionLine.geometry.setDrawRange(0, predictionLength);
}

function syncOrientationIndicator(bundle: ThreeSceneBundle, frame: FrameState) {
  const { camera, objects, orientationIndicator, relativeVelocityIndicator } =
    bundle;

  orientationIndicator.frame.quaternion.copy(camera.quaternion).invert();
  orientationIndicator.rocket.quaternion.copy(objects.rocket.quaternion);

  relativeVelocityIndicator.frame.quaternion.copy(camera.quaternion).invert();
  INDICATOR_MOON_VELOCITY.copy(moonVelocityMeters(frame.simState.t));
  INDICATOR_RELATIVE_VELOCITY
    .copy(INDICATOR_MOON_VELOCITY)
    .sub(frame.simState.rocket.velocity);
  relativeVelocityIndicator.setValueLabel(
    formatSignedVelocityDelta(
      INDICATOR_MOON_VELOCITY.length() - frame.simState.rocket.velocity.length(),
    ),
  );

  if (INDICATOR_RELATIVE_VELOCITY.lengthSq() <= 1e-6) {
    relativeVelocityIndicator.arrow.visible = false;
    return;
  }

  INDICATOR_RELATIVE_VELOCITY.normalize();
  relativeVelocityIndicator.arrow.visible = true;
  relativeVelocityIndicator.arrow.position.copy(
    INDICATOR_RELATIVE_VELOCITY,
  );
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
    EARTH_DRAW_RADIUS,
    EARTH_DRAW_RADIUS * 18,
    10,
    24,
    150,
  );
  updateFarAwayLabel(
    objects.moonLabel,
    objects.moon,
    camera,
    viewportHeight,
    MOON_DRAW_RADIUS,
    MOON_DRAW_RADIUS * 24,
    9,
    20,
    90,
  );
}

function syncMissionUi({
  frame,
  runningRef,
  lastUiSyncAtRef,
  lastTelemetryTimeRef,
  lastRunningStatusRef,
  setRunning,
  setStatus,
  setTelemetry,
}: {
  frame: FrameState;
  runningRef: MutableRefObject<boolean>;
  lastUiSyncAtRef: MutableRefObject<number>;
  lastTelemetryTimeRef: MutableRefObject<number | null>;
  lastRunningStatusRef: MutableRefObject<string | null>;
  setRunning: (value: boolean) => void;
  setStatus: (value: string) => void;
  setTelemetry: (value: SimulationTelemetry) => void;
}) {
  const { now, simState, telemetry } = frame;

  if (simState.impact?.target === "earth") {
    stopAndSyncImpact({
      now,
      t: simState.t,
      telemetry,
      status: `Rocket impacted Earth at ${formatSpeed(simState.impact.speed)}.`,
      runningRef,
      lastUiSyncAtRef,
      lastTelemetryTimeRef,
      lastRunningStatusRef,
      setRunning,
      setStatus,
      setTelemetry,
    });
    return;
  }

  if (simState.impact?.target === "moon") {
    stopAndSyncImpact({
      now,
      t: simState.t,
      telemetry,
      status: describeMoonLanding(simState.impact),
      runningRef,
      lastUiSyncAtRef,
      lastTelemetryTimeRef,
      lastRunningStatusRef,
      setRunning,
      setStatus,
      setTelemetry,
    });
    return;
  }

  const telemetryChanged = lastTelemetryTimeRef.current !== simState.t;
  const shouldSyncUi =
    telemetryChanged &&
    (now - lastUiSyncAtRef.current >= UI_SYNC_INTERVAL_MS || !runningRef.current);

  if (shouldSyncUi) {
    lastUiSyncAtRef.current = now;
    lastTelemetryTimeRef.current = simState.t;
    setTelemetry(telemetry);
  }

  if (runningRef.current && shouldSyncUi) {
    const runningStatus = `Running: ${getMissionPhase(
      telemetry.altitudeEarth,
      telemetry.altitudeMoon,
      telemetry.relativeMoonSpeed,
    )}.`;

    if (lastRunningStatusRef.current !== runningStatus) {
      lastRunningStatusRef.current = runningStatus;
      setStatus(runningStatus);
    }
    return;
  }

  if (!runningRef.current) {
    lastRunningStatusRef.current = null;
  }
}

function stopAndSyncImpact({
  now,
  t,
  telemetry,
  status,
  runningRef,
  lastUiSyncAtRef,
  lastTelemetryTimeRef,
  lastRunningStatusRef,
  setRunning,
  setStatus,
  setTelemetry,
}: {
  now: number;
  t: number;
  telemetry: TelemetryState;
  status: string;
  runningRef: MutableRefObject<boolean>;
  lastUiSyncAtRef: MutableRefObject<number>;
  lastTelemetryTimeRef: MutableRefObject<number | null>;
  lastRunningStatusRef: MutableRefObject<string | null>;
  setRunning: (value: boolean) => void;
  setStatus: (value: string) => void;
  setTelemetry: (value: SimulationTelemetry) => void;
}) {
  runningRef.current = false;
  setRunning(false);
  lastUiSyncAtRef.current = now;
  lastTelemetryTimeRef.current = t;
  lastRunningStatusRef.current = null;
  setTelemetry(telemetry);
  setStatus(status);
}

function syncCameraDebug({
  bundle,
  cameraRigRef,
  frameNow,
  lastCameraDebugSyncAtRef,
  setCameraDebug,
}: {
  bundle: ThreeSceneBundle;
  cameraRigRef: MutableRefObject<CameraRigState>;
  frameNow: number;
  lastCameraDebugSyncAtRef: MutableRefObject<number>;
  setCameraDebug: (value: CameraDebugState) => void;
}) {
  if (frameNow - lastCameraDebugSyncAtRef.current < UI_SYNC_INTERVAL_MS) {
    return;
  }

  lastCameraDebugSyncAtRef.current = frameNow;
  setCameraDebug(
    getCameraDebugSnapshot(cameraRigRef.current, bundle.camera, bundle.controls),
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
    LABEL_WORLD_POSITION.sub(camera.position).normalize().dot(CAMERA_DIRECTION) >
    0.1;
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

  const scale = THREE.MathUtils.clamp(cameraDistance * 0.05, minScale, maxScale);
  sprite.scale.set(scale, scale * 0.375, 1);
}
