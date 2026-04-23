import { useEffect, useRef, useState } from "react";
import type { CameraTarget } from "./mission";
import {
  clearFollowTarget,
  clearLookTarget,
  setFollowTarget,
  setLookTarget,
  setOverview,
  syncSelection,
  type CameraRigTarget,
  type CameraRigState,
} from "./three/camera-rig";
import type { ThreeSceneBundle } from "./three/scene";
import {
  createInitialCameraDebugState,
  createInitialCameraRig,
  findFocusableByPreset,
  getFocusLabel,
  toCameraSelection,
} from "./mission-scene/camera";
import { startMissionSceneRuntime } from "./mission-scene/runtime";
import type {
  CameraDebugState,
  CameraSelection,
  UseMissionSceneParams,
} from "./mission-scene/types";

export function useMissionScene({
  mountRef,
  simulation,
  running,
  setRunning,
  setStatus,
  setTelemetry,
  runningRef,
  maneuverInputRef,
  launchSpeed,
  launchAngleDeg,
  launchAzimuthDeg,
  launchSpeedRef,
  launchAngleRef,
  launchAzimuthRef,
  showTrail,
  showThrustDirectionArrow,
}: UseMissionSceneParams) {
  const bundleRef = useRef<ThreeSceneBundle | null>(null);
  const runtimeRef = useRef<ReturnType<typeof startMissionSceneRuntime> | null>(null);
  const cameraRigRef = useRef<CameraRigState>(createInitialCameraRig());
  const showTrailRef = useRef(showTrail);
  const showThrustDirectionArrowRef = useRef(showThrustDirectionArrow);
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
  const [cameraDebug, setCameraDebug] = useState<CameraDebugState>(
    createInitialCameraDebugState,
  );

  function syncCameraSelectionFromRig() {
    setCameraSelection(toCameraSelection(syncSelection(cameraRigRef.current)));
  }

  function requestSceneRender() {
    runtimeRef.current?.requestRender();
  }

  function applyFollowSelection(target: CameraRigTarget) {
    const bundle = bundleRef.current;
    if (!bundle) return;

    setFollowTarget(cameraRigRef.current, target, bundle.camera, bundle.controls);
    syncCameraSelectionFromRig();
    setStatus(`Locking on ${getFocusLabel(target.object)}...`);
    requestSceneRender();
  }

  function applyLookSelection(target: CameraRigTarget) {
    setLookTarget(cameraRigRef.current, target);
    syncCameraSelectionFromRig();
    setStatus(`Turning toward ${getFocusLabel(target.object)}...`);
    requestSceneRender();
  }

  useEffect(() => {
    showTrailRef.current = showTrail;
    requestSceneRender();
  }, [showTrail]);

  useEffect(() => {
    showThrustDirectionArrowRef.current = showThrustDirectionArrow;
    requestSceneRender();
  }, [showThrustDirectionArrow]);

  useEffect(() => {
    requestSceneRender();
  }, [running, launchSpeed, launchAngleDeg, launchAzimuthDeg]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const runtime = startMissionSceneRuntime({
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
      onFollowSelection: applyFollowSelection,
      onSyncCameraSelection: syncCameraSelectionFromRig,
    });
    bundleRef.current = runtime.bundle;
    runtimeRef.current = runtime;

    return () => {
      runtime.cleanup();
      bundleRef.current = null;
      runtimeRef.current = null;
      cameraRigRef.current = createInitialCameraRig();
      previousTrailLengthRef.current = 0;
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
    requestSceneRender();
  }

  function applyLockTarget(target: CameraTarget) {
    const bundle = bundleRef.current;
    if (!bundle) return;

    const currentFollow = cameraRigRef.current.follow;
    if (currentFollow?.key === target) {
      clearFollowTarget(cameraRigRef.current);
      syncCameraSelectionFromRig();
      setStatus("Camera unlocked.");
      requestSceneRender();
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
      requestSceneRender();
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
    requestSceneRender,
  };
}
