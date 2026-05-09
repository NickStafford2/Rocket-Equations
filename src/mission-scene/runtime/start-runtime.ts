import type { EarthRendererOverride } from "../earth-renderer-mode";
import type { MutableRefObject } from "react";
import type { ManeuverInput } from "../../physics/bodies";
import type {
  EarthMoonSimulation,
  SimulationTelemetry,
} from "../../sim/simulation";
import type { ThreeSceneBundle } from "../../three/scene";
import { isCameraRigAnimating } from "../camera/camera-state";
import { updateCameraRig } from "../camera/camera-update";
import type { CameraRigState, CameraRigTarget } from "../camera/camera-types";
import type { CameraDebugState } from "../types";
import { syncMissionScene } from "../sync-scene";
import { createMissionFrameLoop } from "./frame-loop";
import { bindMissionSceneEvents } from "./events";
import { getEarthLodDebug } from "./earth-lod-debug";

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
  earthRendererOverrideRef: MutableRefObject<EarthRendererOverride>;
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
  earthRendererOverrideRef,
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
  const { camera, cameraController, render, scene } = bundle;

  let controlsInteracting = false;
  let lastEarthLodDebug: string | null = null;

  previousTrailLengthRef.current = 0;

  function shouldKeepRendering() {
    return (
      runningRef.current ||
      controlsInteracting ||
      isCameraRigAnimating(cameraRigRef.current)
    );
  }

  function syncEarthLodDebug() {
    const nextDebug = getEarthLodDebug(bundle, earthRendererOverrideRef.current);

    if (nextDebug === lastEarthLodDebug) {
      return;
    }

    lastEarthLodDebug = nextDebug;
    setEarthLodDebug(nextDebug);
  }

  const frameLoop = createMissionFrameLoop({
    shouldRun: shouldKeepRendering,
    onFrame: (elapsedRealSeconds) => {
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
        earthRendererOverrideRef,
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
    },
  });

  const unbindMissionSceneEvents = bindMissionSceneEvents({
    mount,
    bundle,
    cameraRigRef,
    setStatus,
    onFollowSelection,
    onSyncCameraSelection,
    onControlsInteractionChange: (value) => {
      controlsInteracting = value;
    },
    requestRender: frameLoop.requestRender,
    stopFrameLoop: frameLoop.stop,
  });

  if (document.visibilityState === "visible") {
    frameLoop.requestRender();
  }

  return {
    bundle,
    requestRender: frameLoop.requestRender,
    cleanup: () => {
      unbindMissionSceneEvents();
      frameLoop.dispose();
    },
  };
}
