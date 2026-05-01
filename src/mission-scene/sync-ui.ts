import { getMissionPhase, describeMoonLanding, formatSpeed } from "../mission";
import {
  getCameraDebugSnapshot,
  type CameraRigState,
} from "../three/camera-rig";
import type { CameraDebugState } from "./types";
import type { ThreeSceneBundle } from "../three/scene";
import type { MutableRefObject } from "react";
import type { FrameState } from "./frame-state";
import type { SimulationTelemetry } from "../sim/simulation";

const UI_SYNC_INTERVAL_MS = 100;

export function syncMissionUi({
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
  telemetry: SimulationTelemetry;
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

export function syncCameraDebug({
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
    getCameraDebugSnapshot(
      cameraRigRef.current,
      bundle.camera,
      bundle.controls,
    ),
  );
}
