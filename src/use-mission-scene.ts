import { useEffect, useRef, useState } from "react";
import type { MutableRefObject, RefObject } from "react";
import * as THREE from "three";
import { getLaunchFrame, makeInitialRocketState } from "./physics/bodies";
import type { ManeuverInput } from "./physics/bodies";
import {
  describeMoonLanding,
  formatSpeed,
  getMissionPhase,
  normalizeFocusLabelToPreset,
} from "./mission";
import type { CameraTarget } from "./mission";
import type { EarthMoonSimulation, SimulationTelemetry } from "./sim/simulation";
import { TRAIL_POINT_CAPACITY } from "./sim/trail";
import {
  DISTANCE_SCALE,
  EARTH_DRAW_RADIUS,
  metersToScene,
  MOON_DRAW_RADIUS,
  ROCKET_DRAW_RADIUS,
} from "./three/objects";
import { createThreeScene } from "./three/scene";
import type { ThreeSceneBundle } from "./three/scene";
import {
  clearFollowTarget,
  clearLookTarget,
  createCameraRig,
  getCameraDebugSnapshot,
  setFollowTarget,
  setLookTarget,
  setOverview,
  syncSelection,
  updateCameraRig,
  updateFromControlsChange,
  updateFromControlsStart,
} from "./three/camera-rig";
import type {
  CameraRigDebugSnapshot,
  CameraRigSelection,
  CameraRigState,
  CameraRigTarget,
} from "./three/camera-rig";

type UseMissionSceneParams = {
  mountRef: RefObject<HTMLDivElement | null>;
  simulation: EarthMoonSimulation;
  setRunning: (value: boolean) => void;
  setStatus: (value: string) => void;
  setTelemetry: (value: SimulationTelemetry) => void;
  runningRef: MutableRefObject<boolean>;
  maneuverInputRef: MutableRefObject<ManeuverInput>;
  launchSpeedRef: MutableRefObject<number>;
  launchAngleRef: MutableRefObject<number>;
  launchAzimuthRef: MutableRefObject<number>;
  showTrail: boolean;
  showVectors: boolean;
};

type CameraSelection = {
  isOverviewActive: boolean;
  lockTarget: CameraTarget | null;
  lookTarget: CameraTarget | null;
};

type CameraDebugState = CameraRigDebugSnapshot;

const UI_SYNC_INTERVAL_MS = 100;
const OVERVIEW_CAMERA_POSITION = new THREE.Vector3(-210, 120, 210);
const OVERVIEW_CAMERA_TARGET = new THREE.Vector3(56, 0, 0);
const CAMERA_DIRECTION = new THREE.Vector3();
const LABEL_WORLD_POSITION = new THREE.Vector3();

function createInitialCameraRig(): CameraRigState {
  return createCameraRig({
    overviewPosition: OVERVIEW_CAMERA_POSITION,
    overviewTarget: OVERVIEW_CAMERA_TARGET,
  });
}

function toCameraSelection(selection: CameraRigSelection): CameraSelection {
  return {
    isOverviewActive: selection.overview,
    lockTarget: selection.followTarget,
    lookTarget: selection.lookTarget,
  };
}

function getFocusLabel(object: THREE.Object3D): string {
  return String(object.userData.focusLabel ?? "target");
}

function toCameraRigTarget(object: THREE.Object3D): CameraRigTarget | null {
  const key = normalizeFocusLabelToPreset(object.userData.focusLabel);
  if (!key || key === "overview") return null;

  return {
    key,
    object,
  };
}

function findFocusableByPreset(
  scene: THREE.Scene,
  preset: CameraTarget,
): CameraRigTarget | null {
  let focusable: CameraRigTarget | null = null;
  scene.traverse((object) => {
    if (focusable) return;
    const target = toCameraRigTarget(object);
    if (target?.key === preset) {
      focusable = target;
    }
  });

  return focusable;
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
      ? (bodyRadius / (cameraDistance * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)))) *
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

export function useMissionScene({
  mountRef,
  simulation,
  setRunning,
  setStatus,
  setTelemetry,
  runningRef,
  maneuverInputRef,
  launchSpeedRef,
  launchAngleRef,
  launchAzimuthRef,
  showTrail,
  showVectors,
}: UseMissionSceneParams) {
  const animationRef = useRef<number | null>(null);
  const bundleRef = useRef<ThreeSceneBundle | null>(null);
  const cameraRigRef = useRef<CameraRigState>(createInitialCameraRig());
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());
  const showTrailRef = useRef(showTrail);
  const showVectorsRef = useRef(showVectors);
  const lastUiSyncAtRef = useRef(0);
  const lastCameraDebugSyncAtRef = useRef(0);
  const lastTelemetryTimeRef = useRef<number | null>(null);
  const lastRunningStatusRef = useRef<string | null>(null);
  const previousTrailLengthRef = useRef(0);
  const [cameraSelection, setCameraSelection] = useState<CameraSelection>({
    isOverviewActive: true,
    lockTarget: null,
    lookTarget: null,
  });
  const [cameraDebug, setCameraDebug] = useState<CameraDebugState>({
    mode: "overview",
    position: {
      x: OVERVIEW_CAMERA_POSITION.x.toFixed(1),
      y: OVERVIEW_CAMERA_POSITION.y.toFixed(1),
      z: OVERVIEW_CAMERA_POSITION.z.toFixed(1),
    },
    target: {
      x: OVERVIEW_CAMERA_TARGET.x.toFixed(1),
      y: OVERVIEW_CAMERA_TARGET.y.toFixed(1),
      z: OVERVIEW_CAMERA_TARGET.z.toFixed(1),
    },
  });

  function syncCameraSelectionFromRig() {
    setCameraSelection(toCameraSelection(syncSelection(cameraRigRef.current)));
  }

  function applyFollowSelection(target: CameraRigTarget) {
    const bundle = bundleRef.current;
    if (!bundle) return;

    setFollowTarget(cameraRigRef.current, target, bundle.camera, bundle.controls);
    syncCameraSelectionFromRig();
    setStatus(`Locking on ${getFocusLabel(target.object)}...`);
  }

  function applyLookSelection(target: CameraRigTarget) {
    setLookTarget(cameraRigRef.current, target);
    syncCameraSelectionFromRig();
    setStatus(`Turning toward ${getFocusLabel(target.object)}...`);
  }

  useEffect(() => {
    showTrailRef.current = showTrail;
  }, [showTrail]);

  useEffect(() => {
    showVectorsRef.current = showVectors;
  }, [showVectors]);

  useEffect(() => {
    const mountElement = mountRef.current;
    if (!mountElement) return;
    const mount = mountElement;

    const bundle = createThreeScene(mount);
    const {
      camera,
      controls,
      objects,
      orientationIndicator,
      render,
      resize,
      renderer,
      scene,
    } = bundle;
    bundleRef.current = bundle;

    previousTrailLengthRef.current = 0;

    const trailPositions = objects.trailLine.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;

    function syncTrail() {
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
      const positionArray = trailPositions.array as Float32Array;
      simulation.copyTrailPositionsTo(positionArray, DISTANCE_SCALE, startIndex);

      trailPositions.needsUpdate = true;
      objects.trailLine.geometry.setDrawRange(0, trailLength);
      previousTrailLengthRef.current = trailLength;
    }

    function findFocusableObject(
      object: THREE.Object3D | null,
    ): CameraRigTarget | null {
      let current: THREE.Object3D | null = object;

      while (current) {
        const target = toCameraRigTarget(current);
        if (target) return target;
        current = current.parent;
      }

      return null;
    }

    function syncScene() {
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
      objects.enginePlume.visible =
        runningRef.current && maneuverInputRef.current.thrusting;
      if (objects.enginePlume.visible) {
        const plumeScale = 0.9 + Math.abs(Math.sin(simState.t * 0.08)) * 0.45;
        objects.enginePlume.scale.setScalar(plumeScale);
      }

      objects.launchRing.visible = stagedLaunchPreviewVisible;
      objects.launchLocationArrow.visible = stagedLaunchPreviewVisible;
      objects.launchTangentArrow.visible = stagedLaunchPreviewVisible;
      objects.launchNormalArrow.visible = false;
      objects.launchAimArrow.visible = stagedLaunchPreviewVisible;

      const launchOrigin = metersToScene(launchFrame.position);
      objects.launchLocationArrow.position.set(0, 0, 0);
      objects.launchLocationArrow.setDirection(launchFrame.radialHat.clone());
      objects.launchLocationArrow.setLength(launchOrigin.length(), 6, 3);
      objects.launchRing.position.copy(launchOrigin);
      objects.launchRing.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        launchFrame.radialHat.clone(),
      );
      objects.launchTangentArrow.position.copy(launchOrigin);
      objects.launchTangentArrow.setDirection(launchFrame.tangentHat.clone());
      objects.launchTangentArrow.setLength(14, 3.5, 1.75);
      objects.launchNormalArrow.position.copy(launchOrigin);
      objects.launchNormalArrow.setDirection(launchFrame.radialHat.clone());
      objects.launchNormalArrow.setLength(14, 3.5, 1.75);
      objects.launchAimArrow.position.copy(launchOrigin);
      objects.launchAimArrow.setDirection(
        previewState.velocity.clone().normalize(),
      );
      objects.launchAimArrow.setLength(
        aimArrowLength,
        Math.max(4, aimArrowLength * 0.22),
        Math.max(2, aimArrowLength * 0.11),
      );

      objects.trailLine.visible = showTrailRef.current;
      syncTrail();

      objects.velocityArrow.visible = showVectorsRef.current;
      objects.accelerationArrow.visible = showVectorsRef.current;

      if (showVectorsRef.current) {
        const rocketPosition = objects.rocket.position.clone();
        const velocity = simState.rocket.velocity.clone();
        const acceleration = simState.rocket.acceleration.clone();

        const velocityLength = Math.max(velocity.length(), 1);
        objects.velocityArrow.position.copy(rocketPosition);
        objects.velocityArrow.setDirection(velocity.normalize());
        objects.velocityArrow.setLength(Math.min(60, velocityLength / 250), 6, 4);

        const accelerationLength = Math.max(acceleration.length(), 1e-9);
        objects.accelerationArrow.position.copy(rocketPosition);
        objects.accelerationArrow.setDirection(acceleration.normalize());
        objects.accelerationArrow.setLength(
          Math.min(50, accelerationLength * 1.5e6),
          6,
          4,
        );
      }

      if (simState.rocket.heading.lengthSq() > 1e-6) {
        const heading = simState.rocket.heading.clone().normalize();
        objects.thrustDirectionArrow.setDirection(heading);
        objects.thrustDirectionArrow.setLength(
          ROCKET_DRAW_RADIUS * 11,
          ROCKET_DRAW_RADIUS * 2.8,
          ROCKET_DRAW_RADIUS * 1.4,
        );
        objects.rocket.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          heading,
        );
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

      if (simState.impact?.target === "earth") {
        runningRef.current = false;
        setRunning(false);
        lastUiSyncAtRef.current = now;
        lastTelemetryTimeRef.current = simState.t;
        lastRunningStatusRef.current = null;
        setTelemetry(telemetry);
        setStatus(`Rocket impacted Earth at ${formatSpeed(simState.impact.speed)}.`);
      } else if (simState.impact?.target === "moon") {
        runningRef.current = false;
        setRunning(false);
        lastUiSyncAtRef.current = now;
        lastTelemetryTimeRef.current = simState.t;
        lastRunningStatusRef.current = null;
        setTelemetry(telemetry);
        setStatus(describeMoonLanding(simState.impact));
      } else {
        const telemetryChanged = lastTelemetryTimeRef.current !== simState.t;
        const shouldSyncUi =
          telemetryChanged &&
          (now - lastUiSyncAtRef.current >= UI_SYNC_INTERVAL_MS ||
            !runningRef.current);

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

      if (now - lastCameraDebugSyncAtRef.current >= UI_SYNC_INTERVAL_MS) {
        lastCameraDebugSyncAtRef.current = now;
        setCameraDebug(getCameraDebugSnapshot(cameraRigRef.current, camera, controls));
      }
    }

    function onDoubleClick(event: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y =
        -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(pointerRef.current, camera);
      const intersections = raycasterRef.current.intersectObjects(
        scene.children,
        true,
      );

      for (const hit of intersections) {
        const focusable = findFocusableObject(hit.object);
        if (focusable) {
          applyFollowSelection(focusable);
          return;
        }
      }
    }

    function onResize() {
      if (!mountRef.current) return;
      camera.aspect =
        mountRef.current.clientWidth /
        Math.max(mountRef.current.clientHeight, 1);
      camera.updateProjectionMatrix();
      resize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    }

    function onScenePointerDown() {
      mount.focus({ preventScroll: true });
    }

    function onControlsStart() {
      const status = updateFromControlsStart(cameraRigRef.current);
      if (!status) return;

      syncCameraSelectionFromRig();
      setStatus(status);
    }

    function onControlsChange() {
      updateFromControlsChange(cameraRigRef.current, camera);
    }

    window.addEventListener("resize", onResize);
    mount.addEventListener("pointerdown", onScenePointerDown);
    controls.addEventListener("start", onControlsStart);
    controls.addEventListener("change", onControlsChange);
    renderer.domElement.addEventListener("dblclick", onDoubleClick);

    function frame() {
      if (runningRef.current) {
        simulation.tick(maneuverInputRef.current);
      }

      syncScene();
      const cameraStatuses = updateCameraRig(cameraRigRef.current, {
        camera,
        controls,
        scene,
      });
      if (cameraStatuses.length > 0) {
        setStatus(cameraStatuses.join(" "));
      }

      render();
      animationRef.current = requestAnimationFrame(frame);
    }

    frame();

    return () => {
      window.removeEventListener("resize", onResize);
      mount.removeEventListener("pointerdown", onScenePointerDown);
      controls.removeEventListener("start", onControlsStart);
      controls.removeEventListener("change", onControlsChange);
      renderer.domElement.removeEventListener("dblclick", onDoubleClick);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      bundleRef.current = null;
      cameraRigRef.current = createInitialCameraRig();
      previousTrailLengthRef.current = 0;
      bundle.dispose();
    };
  }, [
    mountRef,
    simulation,
    setRunning,
    setStatus,
    setTelemetry,
    runningRef,
    maneuverInputRef,
    launchSpeedRef,
    launchAngleRef,
    launchAzimuthRef,
  ]);

  function applyOverviewCamera() {
    setOverview(cameraRigRef.current);
    syncCameraSelectionFromRig();
    setStatus("Restoring overview camera...");
  }

  function applyLockTarget(target: CameraTarget) {
    const bundle = bundleRef.current;
    if (!bundle) return;

    const currentFollow = cameraRigRef.current.follow;
    if (currentFollow?.key === target) {
      clearFollowTarget(cameraRigRef.current);
      syncCameraSelectionFromRig();
      setStatus("Camera unlocked.");
      return;
    }

    const focusable = findFocusableByPreset(bundle.scene, target);
    if (!focusable) return;
    applyFollowSelection(focusable);
  }

  function applyLookAtTarget(target: CameraTarget) {
    const bundle = bundleRef.current;
    if (!bundle) return;

    const currentLook = cameraRigRef.current.look;
    if (currentLook?.key === target) {
      clearLookTarget(cameraRigRef.current);
      syncCameraSelectionFromRig();
      setStatus("Look-at released.");
      return;
    }

    const focusable = findFocusableByPreset(bundle.scene, target);
    if (!focusable) return;
    applyLookSelection(focusable);
  }

  return {
    isOverviewActive: cameraSelection.isOverviewActive,
    currentLockTarget: cameraSelection.lockTarget,
    currentLookTarget: cameraSelection.lookTarget,
    cameraDebug,
    applyOverviewCamera,
    applyLockTarget,
    applyLookAtTarget,
  };
}
