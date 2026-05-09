import type { EarthRendererOverride } from "./earth-renderer-mode";
import type { MutableRefObject } from "react";
import type {
  EarthMoonSimulation,
  SimulationTelemetry,
} from "../sim/simulation";
import type { ThreeSceneBundle } from "../three/scene";
import { type CameraRigState } from "./camera/camera-types";
import { createFrameState } from "./frame-state";
import { syncRocketVisuals } from "./rocket/sync-rocket-visuals";
import { syncCelestialBodies } from "./sync-celestial-bodies";
import { syncFarAwayLabels } from "./sync-far-away-labels";
import { syncOrientationIndicator } from "./sync-indicators";
import { syncLaunchPreview } from "./sync-launch-preview";
import { syncPredictionDisplay } from "./sync-prediction-display";
import { syncRenderMode } from "./sync-render-mode";
import { syncTrailDisplay } from "./sync-trails";
import { syncCameraDebug, syncMissionUi } from "./sync-ui";
import type { CameraDebugState } from "./types";

type SyncMissionSceneParams = {
  bundle: ThreeSceneBundle;
  simulation: EarthMoonSimulation;
  cameraRigRef: MutableRefObject<CameraRigState>;
  runningRef: MutableRefObject<boolean>;
  launchSpeedRef: MutableRefObject<number>;
  launchAngleRef: MutableRefObject<number>;
  launchAzimuthRef: MutableRefObject<number>;
  showTrailRef: MutableRefObject<boolean>;
  showPredictionRef: MutableRefObject<boolean>;
  showThrustDirectionArrowRef: MutableRefObject<boolean>;
  showMoonLandingArrowRef: MutableRefObject<boolean>;
  earthRendererOverrideRef: MutableRefObject<EarthRendererOverride>;
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
}: SyncMissionSceneParams) {
  const frame = createFrameState({
    simulation,
    launchSpeed: launchSpeedRef.current,
    launchAngleDeg: launchAngleRef.current,
    launchAzimuthDeg: launchAzimuthRef.current,
    running: runningRef.current,
  });

  syncCelestialBodies(bundle, frame);
  syncRenderMode(bundle, frame, {
    earthRendererOverride: earthRendererOverrideRef.current,
    showMoonLandingArrow: showMoonLandingArrowRef.current,
  });
  syncRocketVisuals(bundle, frame, {
    thrusting: frame.simState.thrusting,
    showThrustDirectionArrow: showThrustDirectionArrowRef.current,
  });
  syncLaunchPreview(bundle, frame);
  syncTrailDisplay({
    bundle,
    simulation,
    frame,
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
    frame,
    frameNow: frame.now,
    lastCameraDebugSyncAtRef,
    setCameraDebug,
  });
}
