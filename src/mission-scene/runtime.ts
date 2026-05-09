import type { MutableRefObject } from "react";
import * as THREE from "three";
import type { ManeuverInput } from "../physics/bodies";
import type {
  EarthMoonSimulation,
  SimulationTelemetry,
} from "../sim/simulation";
import type { ThreeSceneBundle } from "../three/scene";
import {
  isCameraRigAnimating,
  updateCameraRig,
  updateFromControlsChange,
  updateFromControlsStart,
} from "./camera/camera-state";
import { findFocusableObject } from "./camera/camera-target";
import { syncMissionScene } from "./sync-scene";
import type { CameraDebugState } from "./types";
import type { CameraRigState, CameraRigTarget } from "./camera/camera-types";

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
  const { camera, cameraController, render, renderer, scene } = bundle;
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

  function stopFrameLoop() {
    if (animationFrameId === null) return;
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    previousFrameTimeMs = null;
  }

  function startFrameLoop() {
    if (
      disposed ||
      document.visibilityState === "hidden" ||
      animationFrameId !== null
    ) {
      return;
    }

    animationFrameId = requestAnimationFrame(frame);
  }

  function shouldKeepRendering() {
    return (
      renderRequested ||
      runningRef.current ||
      controlsInteracting ||
      isCameraRigAnimating(cameraRigRef.current)
    );
  }

  function requestRender() {
    renderRequested = true;
    startFrameLoop();
  }

  function syncEarthLodDebug() {
    const nextDebug = bundle.objects.earthRenderers.nearAtmosphere.root.visible
      ? "Near Atmosphere Renderer"
      : (() => {
          const earth = bundle.objects.earth;
          const levelIndex = earth.getCurrentLevel();
          const detail = levelIndex === 0 ? "8K" : "2K";
          const range =
            levelIndex === 0 ? "near" : levelIndex === 1 ? "mid" : "far";
          return `LOD ${levelIndex} · ${detail} · ${range}`;
        })();

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
      controls: cameraController,
      scene,
      deltaSeconds: elapsedRealSeconds,
      preventMoonCameraIntersection: preventMoonCameraIntersectionRef.current,
    });
    cameraController.syncClipPlanes({
      camera,
      followTarget: cameraRigRef.current.follow?.key ?? null,
      lookTarget: cameraRigRef.current.look?.key ?? null,
    });
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
  const detachCameraControlHandlers = cameraController.bindInteractionHandlers({
    onControlStart: onControlsStart,
    onControl: onControlsChange,
    onControlEnd: onControlsEnd,
    onUpdate: requestRender,
  });
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
      detachCameraControlHandlers();
      renderer.domElement.removeEventListener("dblclick", onDoubleClick);
      stopFrameLoop();
    },
  };
}
