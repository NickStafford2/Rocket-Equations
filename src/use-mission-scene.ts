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
} from "./mission-scene/camera/camera-rig";
import type { ThreeSceneBundle } from "./three/scene";
import {
  findFocusableByPreset,
  getFocusLabel,
} from "./mission-scene/camera/camera";

import {
  createInitialCameraDebugState,
  createInitialCameraRig,
  toCameraSelection,
} from "./mission-scene/camera/camera-presets";
import { startMissionSceneRuntime } from "./mission-scene/runtime";
import type {
  CameraDebugState,
  CameraSelection,
  UseMissionSceneParams,
} from "./mission-scene/types";

export function useMissionScene({
  mountRef,
  bundle,
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
  showPrediction,
  showThrustDirectionArrow,
  showMoonLandingArrow,
  preventMoonCameraIntersection,
}: UseMissionSceneParams) {
  const bundleRef = useRef<ThreeSceneBundle | null>(null);
  const runtimeRef = useRef<ReturnType<typeof startMissionSceneRuntime> | null>(
    null,
  );
  const cameraRigRef = useRef<CameraRigState>(createInitialCameraRig());
  const showTrailRef = useRef(showTrail);
  const showPredictionRef = useRef(showPrediction);
  const showThrustDirectionArrowRef = useRef(showThrustDirectionArrow);
  const showMoonLandingArrowRef = useRef(showMoonLandingArrow);
  const preventMoonCameraIntersectionRef = useRef(
    preventMoonCameraIntersection,
  );
  const lastUiSyncAtRef = useRef(0);
  const lastCameraDebugSyncAtRef = useRef(0);
  const lastTelemetryTimeRef = useRef<number | null>(null);
  const lastRunningStatusRef = useRef<string | null>(null);
  const previousTrailLengthRef = useRef(0);
  const followSelectionHandlerRef = useRef<(target: CameraRigTarget) => void>(
    () => {},
  );
  const syncCameraSelectionHandlerRef = useRef<() => void>(() => {});
  const [cameraSelection, setCameraSelection] = useState<CameraSelection>({
    isOverviewActive: true,
    lockTarget: null,
    lookTarget: null,
  });
  const [cameraDebug, setCameraDebug] = useState<CameraDebugState>(
    createInitialCameraDebugState,
  );
  const [earthLodDebug, setEarthLodDebug] = useState("LOD 0 · 8K · near");

  function syncCameraSelectionFromRig() {
    setCameraSelection(toCameraSelection(syncSelection(cameraRigRef.current)));
  }

  function requestSceneRender() {
    runtimeRef.current?.requestRender();
  }

  function applyFollowSelection(target: CameraRigTarget) {
    const bundle = bundleRef.current;
    if (!bundle) return;

    setFollowTarget(
      cameraRigRef.current,
      target,
      bundle.camera,
      bundle.cameraController,
    );
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
    showPredictionRef.current = showPrediction;
    requestSceneRender();
  }, [showPrediction]);

  useEffect(() => {
    showThrustDirectionArrowRef.current = showThrustDirectionArrow;
    requestSceneRender();
  }, [showThrustDirectionArrow]);

  useEffect(() => {
    showMoonLandingArrowRef.current = showMoonLandingArrow;
    requestSceneRender();
  }, [showMoonLandingArrow]);

  useEffect(() => {
    preventMoonCameraIntersectionRef.current = preventMoonCameraIntersection;
    requestSceneRender();
  }, [preventMoonCameraIntersection]);

  useEffect(() => {
    requestSceneRender();
  }, [running, launchSpeed, launchAngleDeg, launchAzimuthDeg]);

  useEffect(() => {
    bundleRef.current = bundle;
  }, [bundle]);

  useEffect(() => {
    followSelectionHandlerRef.current = applyFollowSelection;
    syncCameraSelectionHandlerRef.current = syncCameraSelectionFromRig;
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !bundle) return;

    const runtime = startMissionSceneRuntime({
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
      onFollowSelection: (target) => followSelectionHandlerRef.current(target),
      onSyncCameraSelection: () => syncCameraSelectionHandlerRef.current(),
    });
    runtimeRef.current = runtime;

    return () => {
      runtime.cleanup();
      if (bundleRef.current === bundle) {
        bundleRef.current = null;
      }
      runtimeRef.current = null;
      cameraRigRef.current = createInitialCameraRig();
      previousTrailLengthRef.current = 0;
    };
  }, [
    bundle,
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
    earthLodDebug,
    applyOverviewCamera,
    applyLockTarget,
    applyLookAtTarget,
    requestSceneRender,
  };
}
