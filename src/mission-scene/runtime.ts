import type { MutableRefObject } from "react";
import * as THREE from "three";
import type { ManeuverInput } from "../physics/bodies";
import type { EarthMoonSimulation, SimulationTelemetry } from "../sim/simulation";
import type { ThreeSceneBundle } from "../three/scene";
import {
  updateCameraRig,
  updateFromControlsChange,
  updateFromControlsStart,
  type CameraRigState,
  type CameraRigTarget,
} from "../three/camera-rig";
import { findFocusableObject } from "./camera";
import { getCameraClipPlanes } from "./camera-clip-planes";
import { syncMissionScene } from "./sync-scene";
import type { CameraDebugState } from "./types";

type StartMissionSceneRuntimeParams = {
  mount: HTMLDivElement;
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
  showMoonLandingArrowRef: MutableRefObject<boolean>;
  preventMoonCameraIntersectionRef: MutableRefObject<boolean>;
  previousTrailLengthRef: MutableRefObject<number>;
  lastUiSyncAtRef: MutableRefObject<number>;
  lastCameraDebugSyncAtRef: MutableRefObject<number>;
  lastTelemetryTimeRef: MutableRefObject<number | null>;
  lastRunningStatusRef: MutableRefObject<string | null>;
  setRunning: (value: boolean) => void;
  setStatus: (value: string) => void;
  setTelemetry: (value: SimulationTelemetry) => void;
  setCameraDebug: (value: CameraDebugState) => void;
  setEarthLodDebug: (value: string) => void;
  onFollowSelection: (target: CameraRigTarget) => void;
  onSyncCameraSelection: () => void;
};

type MissionSceneRuntime = {
  bundle: ThreeSceneBundle;
  requestRender: () => void;
  cleanup: () => void;
};

const MAX_REAL_FRAME_ELAPSED_SECONDS = 0.25;
export function startMissionSceneRuntime({
  mount,
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
  showMoonLandingArrowRef,
  preventMoonCameraIntersectionRef,
  previousTrailLengthRef,
  lastUiSyncAtRef,
  lastCameraDebugSyncAtRef,
  lastTelemetryTimeRef,
  lastRunningStatusRef,
  setRunning,
  setStatus,
  setTelemetry,
  setCameraDebug,
  setEarthLodDebug,
  onFollowSelection,
  onSyncCameraSelection,
}: StartMissionSceneRuntimeParams): MissionSceneRuntime {
  const { camera, controls, render, renderer, scene } = bundle;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let animationFrameId: number | null = null;
  let disposed = false;
  let controlsInteracting = false;
  let renderRequested = false;
  let previousFrameTimeMs: number | null = null;
  let lastEarthLodDebug: string | null = null;

  previousTrailLengthRef.current = 0;

  function onDoubleClick(event: MouseEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects(scene.children, true);

    for (const hit of intersections) {
      const focusable = findFocusableObject(hit.object);
      if (focusable) {
        onFollowSelection(focusable);
        return;
      }
    }
  }

  function onScenePointerDown() {
    mount.focus({ preventScroll: true });
  }

  function onControlsStart() {
    controlsInteracting = true;
    const status = updateFromControlsStart(cameraRigRef.current);
    if (status) {
      onSyncCameraSelection();
      setStatus(status);
    }
    requestRender();
  }

  function onControlsChange() {
    updateFromControlsChange(cameraRigRef.current, camera);
    requestRender();
  }

  function onControlsEnd() {
    controlsInteracting = false;
    requestRender();
  }

  function syncCameraClipPlanes() {
    const { near: nextNear, far: nextFar } = getCameraClipPlanes({
      followTarget: cameraRigRef.current.follow?.key ?? null,
      lookTarget: cameraRigRef.current.look?.key ?? null,
      distanceToTarget: camera.position.distanceTo(controls.target),
    });

    if (
      Math.abs(camera.near - nextNear) <= 1e-6 &&
      Math.abs(camera.far - nextFar) <= 1e-3
    ) {
      return;
    }

    camera.near = nextNear;
    camera.far = nextFar;
    camera.updateProjectionMatrix();
  }

  function stopFrameLoop() {
    if (animationFrameId === null) return;
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    previousFrameTimeMs = null;
  }

  function startFrameLoop() {
    if (disposed || document.visibilityState === "hidden" || animationFrameId !== null) {
      return;
    }

    animationFrameId = requestAnimationFrame(frame);
  }

  function shouldKeepRendering() {
    return (
      renderRequested ||
      runningRef.current ||
      controlsInteracting ||
      cameraRigRef.current.positionTransitioning ||
      cameraRigRef.current.targetTransitioning
    );
  }

  function requestRender() {
    renderRequested = true;
    startFrameLoop();
  }

  function syncEarthLodDebug() {
    const earth = bundle.objects.earth;
    const levelIndex = earth.getCurrentLevel();
    const detail =
      levelIndex === 0 ? "8K" : "2K";
    const range =
      levelIndex === 0 ? "near" : levelIndex === 1 ? "mid" : "far";
    const nextDebug = `LOD ${levelIndex} · ${detail} · ${range}`;

    if (nextDebug === lastEarthLodDebug) {
      return;
    }

    lastEarthLodDebug = nextDebug;
    setEarthLodDebug(nextDebug);
  }

  function onVisibilityChange() {
    if (document.visibilityState === "hidden") {
      stopFrameLoop();
      return;
    }

    requestRender();
  }

  function frame(nowMs: number) {
    animationFrameId = null;
    renderRequested = false;

    const elapsedRealSeconds =
      previousFrameTimeMs === null
        ? 0
        : Math.min(
            (nowMs - previousFrameTimeMs) / 1000,
            MAX_REAL_FRAME_ELAPSED_SECONDS,
          );
    previousFrameTimeMs = nowMs;

    if (runningRef.current && elapsedRealSeconds > 0) {
      simulation.tick(
        maneuverInputRef.current,
        elapsedRealSeconds * simulation.getTimeWarp(),
      );
    }

    syncMissionScene({
      bundle,
      simulation,
      cameraRigRef,
      runningRef,
      launchSpeedRef,
      launchAngleRef,
      launchAzimuthRef,
      showTrailRef,
      showPredictionRef,
      showThrustDirectionArrowRef,
      showMoonLandingArrowRef,
      previousTrailLengthRef,
      lastUiSyncAtRef,
      lastCameraDebugSyncAtRef,
      lastTelemetryTimeRef,
      lastRunningStatusRef,
      setRunning,
      setStatus,
      setTelemetry,
      setCameraDebug,
    });

    const cameraStatuses = updateCameraRig(cameraRigRef.current, {
      camera,
      controls,
      scene,
      preventMoonCameraIntersection: preventMoonCameraIntersectionRef.current,
    });
    syncCameraClipPlanes();
    if (cameraStatuses.length > 0) {
      setStatus(cameraStatuses.join(" "));
    }

    syncEarthLodDebug();
    render();
    if (shouldKeepRendering()) {
      startFrameLoop();
      return;
    }

    previousFrameTimeMs = null;
  }

  document.addEventListener("visibilitychange", onVisibilityChange);
  mount.addEventListener("pointerdown", onScenePointerDown);
  controls.addEventListener("start", onControlsStart);
  controls.addEventListener("change", onControlsChange);
  controls.addEventListener("end", onControlsEnd);
  renderer.domElement.addEventListener("dblclick", onDoubleClick);

  if (document.visibilityState === "visible") {
    requestRender();
  }

  return {
    bundle,
    requestRender,
    cleanup: () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      mount.removeEventListener("pointerdown", onScenePointerDown);
      controls.removeEventListener("start", onControlsStart);
      controls.removeEventListener("change", onControlsChange);
      controls.removeEventListener("end", onControlsEnd);
      renderer.domElement.removeEventListener("dblclick", onDoubleClick);
      stopFrameLoop();
    },
  };
}
