import { useEffect, useRef, useState } from "react";
import type { MutableRefObject, RefObject } from "react";
import * as THREE from "three";
import {
  getLaunchFrame,
  makeInitialRocketState,
} from "./physics/bodies";
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
import { createThreeScene } from "./three/scene";
import type { ThreeSceneBundle } from "./three/scene";
import {
  DISTANCE_SCALE,
  metersToScene,
  ROCKET_DRAW_RADIUS,
} from "./three/objects";

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

type CameraDebugState = {
  mode: string;
  position: {
    x: string;
    y: string;
    z: string;
  };
  target: {
    x: string;
    y: string;
    z: string;
  };
};

type OverviewModeState = {
  active: boolean;
  position: THREE.Vector3;
  target: THREE.Vector3;
  transitioning: boolean;
  status: string;
};

type LockModeState = {
  preset: CameraTarget;
  object: THREE.Object3D;
  offset: THREE.Vector3;
  transitioning: boolean;
  status: string;
};

type LookModeState = {
  preset: CameraTarget;
  object: THREE.Object3D;
  transitioning: boolean;
  status: string;
};

type CameraTrackingState = {
  overview: OverviewModeState;
  lock: LockModeState | null;
  look: LookModeState | null;
};

const FALLBACK_VIEW_DIRECTION = new THREE.Vector3(1.25, 0.75, 1.15).normalize();
const UI_SYNC_INTERVAL_MS = 100;

function createLockModeState(
  camera: THREE.PerspectiveCamera,
  controls: ThreeSceneBundle["controls"],
  targetObject: THREE.Object3D,
): LockModeState | null {
  const focusRadius = Number(targetObject.userData.focusRadius ?? 12);
  const focusLabel = String(targetObject.userData.focusLabel ?? "target");
  const preset = normalizeFocusLabelToPreset(focusLabel);
  if (!preset || preset === "overview") return null;

  const currentOffset = camera.position.clone().sub(controls.target);
  const viewDirection =
    currentOffset.lengthSq() > 1e-6
      ? currentOffset.normalize()
      : FALLBACK_VIEW_DIRECTION.clone();

  return {
    preset,
    object: targetObject,
    offset: viewDirection.multiplyScalar(
      THREE.MathUtils.clamp(focusRadius * 5, 4, 520),
    ),
    transitioning: true,
    status: `Locked on ${focusLabel}.`,
  };
}

function createLookModeState(targetObject: THREE.Object3D): LookModeState | null {
  const focusLabel = String(targetObject.userData.focusLabel ?? "target");
  const preset = normalizeFocusLabelToPreset(focusLabel);
  if (!preset || preset === "overview") return null;

  return {
    preset,
    object: targetObject,
    transitioning: true,
    status: `Looking at ${focusLabel}.`,
  };
}

function findFocusableByPreset(
  scene: THREE.Scene,
  preset: CameraTarget,
): THREE.Object3D | null {
  let focusable: THREE.Object3D | null = null;
  scene.traverse((object) => {
    if (focusable) return;
    if (String(object.userData.focusLabel).toLowerCase() === preset) {
      focusable = object;
    }
  });

  return focusable;
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
  const cameraTrackingRef = useRef<CameraTrackingState>({
    overview: {
      active: true,
      position: new THREE.Vector3(-210, 120, 210),
      target: new THREE.Vector3(56, 0, 0),
      transitioning: false,
      status: "Overview camera restored.",
    },
    lock: null,
    look: null,
  });
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
      x: "-210.0",
      y: "120.0",
      z: "210.0",
    },
    target: {
      x: "56.0",
      y: "0.0",
      z: "0.0",
    },
  });

  function setCameraSelectionState(selection: CameraSelection) {
    setCameraSelection(selection);
  }

  function syncCameraSelectionFromTracking() {
    const tracking = cameraTrackingRef.current;
    setCameraSelectionState({
      isOverviewActive: tracking.overview.active,
      lockTarget: tracking.lock?.preset ?? null,
      lookTarget: tracking.look?.preset ?? null,
    });
  }

  function clearOverviewMode() {
    cameraTrackingRef.current.overview = {
      ...cameraTrackingRef.current.overview,
      active: false,
      transitioning: false,
    };
  }

  function clearAllCameraTracking(status?: string) {
    clearOverviewMode();
    cameraTrackingRef.current.lock = null;
    cameraTrackingRef.current.look = null;
    syncCameraSelectionFromTracking();
    if (status) setStatus(status);
  }

  function applyLockSelection(targetObject: THREE.Object3D) {
    const bundle = bundleRef.current;
    if (!bundle) return;

    const lockState = createLockModeState(
      bundle.camera,
      bundle.controls,
      targetObject,
    );
    if (!lockState) return;

    const focusLabel = String(targetObject.userData.focusLabel ?? "target");
    clearOverviewMode();
    cameraTrackingRef.current.lock = lockState;
    if (!cameraTrackingRef.current.look) {
      cameraTrackingRef.current.look = {
        preset: lockState.preset,
        object: lockState.object,
        transitioning: true,
        status: `Looking at ${focusLabel}.`,
      };
    }
    syncCameraSelectionFromTracking();
    setStatus(`Locking on ${focusLabel}...`);
  }

  function applyLookSelection(targetObject: THREE.Object3D) {
    const lookState = createLookModeState(targetObject);
    if (!lookState) return;

    const focusLabel = String(targetObject.userData.focusLabel ?? "target");
    clearOverviewMode();
    cameraTrackingRef.current.look = lookState;
    syncCameraSelectionFromTracking();
    setStatus(`Turning toward ${focusLabel}...`);
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
    ): THREE.Object3D | null {
      let current: THREE.Object3D | null = object;

      while (current) {
        if (current.userData.focusLabel) return current;
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
        const tracking = cameraTrackingRef.current;
        const mode = tracking.overview.active
          ? "overview"
          : tracking.lock && tracking.look
            ? `lock:${tracking.lock.preset} look:${tracking.look.preset}`
            : tracking.lock
              ? `lock:${tracking.lock.preset}`
              : tracking.look
                ? `look:${tracking.look.preset}`
                : "free";
        setCameraDebug({
          mode,
          position: {
            x: camera.position.x.toFixed(1),
            y: camera.position.y.toFixed(1),
            z: camera.position.z.toFixed(1),
          },
          target: {
            x: controls.target.x.toFixed(1),
            y: controls.target.y.toFixed(1),
            z: controls.target.z.toFixed(1),
          },
        });
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
          applyLockSelection(focusable);
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
      const overview = cameraTrackingRef.current.overview;
      if (!overview.active) return;

      if (overview.transitioning) {
        clearAllCameraTracking("Overview transition canceled.");
        return;
      }

      clearAllCameraTracking("Free camera enabled.");
    }

    function onControlsChange() {
      const lockMode = cameraTrackingRef.current.lock;
      if (!lockMode || lockMode.transitioning) return;

      const trackedPosition = new THREE.Vector3();
      lockMode.object.getWorldPosition(trackedPosition);
      lockMode.offset.copy(camera.position.clone().sub(trackedPosition));
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

      const tracking = cameraTrackingRef.current;
      const overview = tracking.overview;
      const lockMode = tracking.lock;
      const lookMode = tracking.look;

      const targetObject = lookMode?.object ?? lockMode?.object ?? null;
      const targetPosition = targetObject
        ? new THREE.Vector3().setFromMatrixPosition(targetObject.matrixWorld)
        : null;

      if (overview.active) {
        const alpha = overview.transitioning ? 0.12 : 1;
        camera.position.lerp(overview.position, alpha);
        controls.target.lerp(overview.target, alpha);

        if (
          overview.transitioning &&
          camera.position.distanceTo(overview.position) < 0.8 &&
          controls.target.distanceTo(overview.target) < 0.35
        ) {
          setStatus(overview.status);
          cameraTrackingRef.current.overview = {
            ...overview,
            transitioning: false,
          };
        }
      } else {
        if (lockMode) {
          const lockPosition = new THREE.Vector3().setFromMatrixPosition(
            lockMode.object.matrixWorld,
          );
          const desiredPosition = lockPosition.clone().add(lockMode.offset);
          const alpha = lockMode.transitioning ? 0.12 : 1;
          camera.position.lerp(desiredPosition, alpha);

          if (
            lockMode.transitioning &&
            camera.position.distanceTo(desiredPosition) < 0.8
          ) {
            setStatus(lockMode.status);
            cameraTrackingRef.current.lock = {
              ...lockMode,
              transitioning: false,
            };
          }
        }

        if (targetPosition) {
          const lookIsTransitioning = lookMode?.transitioning ?? false;
          const targetAlpha = lookIsTransitioning ? 0.12 : 1;
          controls.target.lerp(targetPosition, targetAlpha);

          if (
            lookMode &&
            lookMode.transitioning &&
            controls.target.distanceTo(targetPosition) < 0.35
          ) {
            setStatus(lookMode.status);
            cameraTrackingRef.current.look = {
              ...lookMode,
              transitioning: false,
            };
          }
        }
      }

      controls.update();
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
      cameraTrackingRef.current = {
        overview: {
          active: false,
          position: new THREE.Vector3(-210, 120, 210),
          target: new THREE.Vector3(56, 0, 0),
          transitioning: false,
          status: "Overview camera restored.",
        },
        lock: null,
        look: null,
      };
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
    cameraTrackingRef.current = {
      overview: {
        active: true,
        position: new THREE.Vector3(-210, 120, 210),
        target: new THREE.Vector3(56, 0, 0),
        transitioning: true,
        status: "Overview camera restored.",
      },
      lock: null,
      look: null,
    };
    syncCameraSelectionFromTracking();
    setStatus("Restoring overview camera...");
  }

  function applyLockTarget(target: CameraTarget) {
    const bundle = bundleRef.current;
    if (!bundle) return;

    const currentLock = cameraTrackingRef.current.lock;
    if (currentLock?.preset === target) {
      cameraTrackingRef.current.lock = null;
      if (
        cameraTrackingRef.current.look?.preset === target &&
        cameraTrackingRef.current.look.object === currentLock.object
      ) {
        cameraTrackingRef.current.look = null;
      }
      syncCameraSelectionFromTracking();
      setStatus("Camera unlocked.");
      return;
    }

    const focusable = findFocusableByPreset(bundle.scene, target);
    if (!focusable) return;
    applyLockSelection(focusable);
  }

  function applyLookAtTarget(target: CameraTarget) {
    const bundle = bundleRef.current;
    if (!bundle) return;

    const currentLook = cameraTrackingRef.current.look;
    if (currentLook?.preset === target) {
      cameraTrackingRef.current.look = null;
      syncCameraSelectionFromTracking();
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
