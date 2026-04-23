import type { MutableRefObject } from "react";
import * as THREE from "three";
import type { ManeuverInput } from "../physics/bodies";
import type { EarthMoonSimulation, SimulationTelemetry } from "../sim/simulation";
import type { ThreeSceneBundle } from "../three/scene";
import { createThreeScene } from "../three/scene";
import {
  updateCameraRig,
  updateFromControlsChange,
  updateFromControlsStart,
  type CameraRigState,
  type CameraRigTarget,
} from "../three/camera-rig";
import { findFocusableObject } from "./camera";
import { syncMissionScene } from "./sync-scene";
import type { CameraDebugState } from "./types";

type StartMissionSceneRuntimeParams = {
  mount: HTMLDivElement;
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
  onFollowSelection: (target: CameraRigTarget) => void;
  onSyncCameraSelection: () => void;
};

type MissionSceneRuntime = {
  bundle: ThreeSceneBundle;
  cleanup: () => void;
};

export function startMissionSceneRuntime({
  mount,
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
  onFollowSelection,
  onSyncCameraSelection,
}: StartMissionSceneRuntimeParams): MissionSceneRuntime {
  const bundle = createThreeScene(mount);
  const { camera, controls, render, resize, renderer, scene } = bundle;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let animationFrameId: number | null = null;
  let disposed = false;

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

  function onResize() {
    camera.aspect = mount.clientWidth / Math.max(mount.clientHeight, 1);
    camera.updateProjectionMatrix();
    resize(mount.clientWidth, mount.clientHeight);
  }

  function onScenePointerDown() {
    mount.focus({ preventScroll: true });
  }

  function onControlsStart() {
    const status = updateFromControlsStart(cameraRigRef.current);
    if (!status) return;

    onSyncCameraSelection();
    setStatus(status);
  }

  function onControlsChange() {
    updateFromControlsChange(cameraRigRef.current, camera);
  }

  function stopFrameLoop() {
    if (animationFrameId === null) return;
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  function startFrameLoop() {
    if (disposed || document.visibilityState === "hidden" || animationFrameId !== null) {
      return;
    }

    animationFrameId = requestAnimationFrame(frame);
  }

  function onVisibilityChange() {
    if (document.visibilityState === "hidden") {
      stopFrameLoop();
      return;
    }

    startFrameLoop();
  }

  function frame() {
    animationFrameId = null;

    if (runningRef.current) {
      simulation.tick(maneuverInputRef.current);
    }

    syncMissionScene({
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
    });

    const cameraStatuses = updateCameraRig(cameraRigRef.current, {
      camera,
      controls,
      scene,
    });
    if (cameraStatuses.length > 0) {
      setStatus(cameraStatuses.join(" "));
    }

    render();
    startFrameLoop();
  }

  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", onVisibilityChange);
  mount.addEventListener("pointerdown", onScenePointerDown);
  controls.addEventListener("start", onControlsStart);
  controls.addEventListener("change", onControlsChange);
  renderer.domElement.addEventListener("dblclick", onDoubleClick);

  if (document.visibilityState === "visible") {
    frame();
  }

  return {
    bundle,
    cleanup: () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      mount.removeEventListener("pointerdown", onScenePointerDown);
      controls.removeEventListener("start", onControlsStart);
      controls.removeEventListener("change", onControlsChange);
      renderer.domElement.removeEventListener("dblclick", onDoubleClick);
      stopFrameLoop();
      bundle.dispose();
    },
  };
}
