import type { MutableRefObject } from "react";
import * as THREE from "three";
import { getLaunchFrame, makeInitialRocketState } from "../physics/bodies";
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
import type { ThreeSceneBundle } from "../three/scene";
import { getCameraDebugSnapshot, type CameraRigState } from "../three/camera-rig";
import type { CameraDebugState } from "./types";

const UI_SYNC_INTERVAL_MS = 100;
const CAMERA_DIRECTION = new THREE.Vector3();
const LABEL_WORLD_POSITION = new THREE.Vector3();
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const WORLD_FORWARD = new THREE.Vector3(0, 0, 1);

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
  const { camera, controls, objects, orientationIndicator, renderer } = bundle;
  const now = performance.now();
  const simState = simulation.getState();
  const telemetry = simulation.getTelemetry();
  const launchFrame = getLaunchFrame(0, launchAzimuthRef.current);
  const previewState = makeInitialRocketState(
    launchSpeedRef.current,
    launchAngleRef.current,
    launchAzimuthRef.current,
  );
  const normalizedLaunchSpeed = THREE.MathUtils.clamp(
    (launchSpeedRef.current - 7800) / (12100 - 7800),
    0,
    1,
  );
  const aimArrowLength = THREE.MathUtils.lerp(12, 30, normalizedLaunchSpeed);
  const stagedLaunchPreviewVisible = !runningRef.current;

  objects.moon.position.copy(metersToScene(telemetry.moonPosition));
  objects.rocket.position.copy(metersToScene(simState.rocket.position));
  objects.thrustDirectionArrow.position.copy(objects.rocket.position);
  objects.thrustDirectionArrow.visible = showThrustDirectionArrowRef.current;
  objects.enginePlume.visible =
    runningRef.current && maneuverInputRef.current.thrusting;
  if (objects.enginePlume.visible) {
    const plumeScale = 0.9 + Math.abs(Math.sin(simState.t * 0.08)) * 0.45;
    objects.enginePlume.scale.setScalar(plumeScale);
  }

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

  objects.trailLine.visible = showTrailRef.current;
  syncTrail({
    simulation,
    trailLine: objects.trailLine,
    previousTrailLengthRef,
  });

  if (simState.rocket.heading.lengthSq() > 1e-6) {
    const heading = simState.rocket.heading.clone().normalize();
    objects.thrustDirectionArrow.setDirection(heading);
    objects.thrustDirectionArrow.setLength(
      ROCKET_DRAW_RADIUS * 11,
      ROCKET_DRAW_RADIUS * 2.8,
      ROCKET_DRAW_RADIUS * 1.4,
    );
    objects.rocket.quaternion.setFromUnitVectors(WORLD_UP, heading);
  }

  orientationIndicator.frame.quaternion.copy(camera.quaternion).invert();
  orientationIndicator.rocket.quaternion.copy(objects.rocket.quaternion);

  updateFarAwayLabel(
    objects.earthLabel,
    objects.earthGroup,
    camera,
    renderer.domElement.clientHeight,
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
    renderer.domElement.clientHeight,
    MOON_DRAW_RADIUS,
    MOON_DRAW_RADIUS * 24,
    9,
    20,
    90,
  );

  syncMissionUi({
    now,
    simState,
    telemetry,
    runningRef,
    lastUiSyncAtRef,
    lastTelemetryTimeRef,
    lastRunningStatusRef,
    setRunning,
    setStatus,
    setTelemetry,
  });

  if (now - lastCameraDebugSyncAtRef.current >= UI_SYNC_INTERVAL_MS) {
    lastCameraDebugSyncAtRef.current = now;
    setCameraDebug(getCameraDebugSnapshot(cameraRigRef.current, camera, controls));
  }
}

function syncTrail({
  simulation,
  trailLine,
  previousTrailLengthRef,
}: {
  simulation: EarthMoonSimulation;
  trailLine: ThreeSceneBundle["objects"]["trailLine"];
  previousTrailLengthRef: MutableRefObject<number>;
}) {
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
  const trailPositions = trailLine.geometry.getAttribute(
    "position",
  ) as THREE.BufferAttribute;
  const positionArray = trailPositions.array as Float32Array;

  simulation.copyTrailPositionsTo(positionArray, DISTANCE_SCALE, startIndex);
  trailPositions.needsUpdate = true;
  trailLine.geometry.setDrawRange(0, trailLength);
  previousTrailLengthRef.current = trailLength;
}

function syncMissionUi({
  now,
  simState,
  telemetry,
  runningRef,
  lastUiSyncAtRef,
  lastTelemetryTimeRef,
  lastRunningStatusRef,
  setRunning,
  setStatus,
  setTelemetry,
}: {
  now: number;
  simState: ReturnType<EarthMoonSimulation["getState"]>;
  telemetry: ReturnType<EarthMoonSimulation["getTelemetry"]>;
  runningRef: MutableRefObject<boolean>;
  lastUiSyncAtRef: MutableRefObject<number>;
  lastTelemetryTimeRef: MutableRefObject<number | null>;
  lastRunningStatusRef: MutableRefObject<string | null>;
  setRunning: (value: boolean) => void;
  setStatus: (value: string) => void;
  setTelemetry: (value: SimulationTelemetry) => void;
}) {
  if (simState.impact?.target === "earth") {
    runningRef.current = false;
    setRunning(false);
    lastUiSyncAtRef.current = now;
    lastTelemetryTimeRef.current = simState.t;
    lastRunningStatusRef.current = null;
    setTelemetry(telemetry);
    setStatus(`Rocket impacted Earth at ${formatSpeed(simState.impact.speed)}.`);
    return;
  }

  if (simState.impact?.target === "moon") {
    runningRef.current = false;
    setRunning(false);
    lastUiSyncAtRef.current = now;
    lastTelemetryTimeRef.current = simState.t;
    lastRunningStatusRef.current = null;
    setTelemetry(telemetry);
    setStatus(describeMoonLanding(simState.impact));
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
  } else if (!runningRef.current) {
    lastRunningStatusRef.current = null;
  }
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
