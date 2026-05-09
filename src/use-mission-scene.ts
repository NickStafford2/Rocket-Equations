import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import {
  clearFollowTarget,
  clearLookTarget,
  setFollowTarget,
  setLookTarget,
  setOverview,
  syncSelection,
  type CameraControllerState,
} from "./camera/controller";
import {
  createCameraTargetRegistry,
  type CameraTarget as RegisteredCameraTarget,
} from "./camera/targets";
import type { CameraTarget } from "./mission";
import {
  createInitialCameraController,
  createInitialCameraDebugState,
  findCameraTargetByPreset,
  toCameraSelection,
} from "./mission-scene/camera";
import { startMissionSceneRuntime } from "./mission-scene/runtime";
import type {
  CameraDebugState,
  CameraSelection,
  UseMissionSceneParams,
} from "./mission-scene/types";
import { createThreeScene, type ThreeSceneBundle } from "./three/scene";

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
  showPrediction,
  showThrustDirectionArrow,
}: UseMissionSceneParams) {
  const bundleRef = useRef<ThreeSceneBundle | null>(null);
  const runtimeRef = useRef<ReturnType<typeof startMissionSceneRuntime> | null>(
    null,
  );
  const cameraControllerRef = useRef<CameraControllerState | null>(null);
  const showTrailRef = useRef(showTrail);
  const showPredictionRef = useRef(showPrediction);
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
  const [earthLodDebug, setEarthLodDebug] = useState("LOD 0 · 8K · near");

  function syncCameraSelectionFromController() {
    const controller = cameraControllerRef.current;
    if (!controller) return;

    setCameraSelection(toCameraSelection(syncSelection(controller)));
  }

  function requestSceneRender() {
    runtimeRef.current?.requestRender();
  }

  function applyFollowSelection(target: RegisteredCameraTarget) {
    const bundle = bundleRef.current;
    const controller = cameraControllerRef.current;
    if (!bundle || !controller) return;

    bundle.scene.updateMatrixWorld(true);
    setFollowTarget(controller, target, bundle.camera, bundle.controls);
    syncCameraSelectionFromController();
    setStatus(`Locking on ${target.label}...`);
    requestSceneRender();
  }

  function applyLookSelection(target: RegisteredCameraTarget) {
    const controller = cameraControllerRef.current;
    if (!controller) return;

    setLookTarget(controller, target);
    syncCameraSelectionFromController();
    setStatus(`Turning toward ${target.label}...`);
    requestSceneRender();
  }

  const onRuntimeFollowSelection = useEffectEvent(
    (target: RegisteredCameraTarget) => {
      applyFollowSelection(target);
    },
  );
  const onRuntimeSyncCameraSelection = useEffectEvent(() => {
    syncCameraSelectionFromController();
  });

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
    requestSceneRender();
  }, [running, launchSpeed, launchAngleDeg, launchAzimuthDeg]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const bundle = createThreeScene(mount);
    const cameraTargetRegistry = createCameraTargetRegistry(bundle);
    cameraControllerRef.current = createInitialCameraController(
      cameraTargetRegistry,
    );

    const runtime = startMissionSceneRuntime({
      mount,
      bundle,
      simulation,
      cameraControllerRef:
        cameraControllerRef as MutableRefObject<CameraControllerState>,
      runningRef,
      maneuverInputRef,
      launchSpeedRef,
      launchAngleRef,
      launchAzimuthRef,
      showTrailRef,
      showPredictionRef,
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
      setEarthLodDebug,
      onFollowSelection: onRuntimeFollowSelection,
      onSyncCameraSelection: onRuntimeSyncCameraSelection,
    });
    bundleRef.current = bundle;
    runtimeRef.current = runtime;

    return () => {
      runtime.cleanup();
      bundleRef.current = null;
      runtimeRef.current = null;
      cameraControllerRef.current = null;
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
    const controller = cameraControllerRef.current;
    if (!controller) return;

    setOverview(controller);
    syncCameraSelectionFromController();
    setStatus("Restoring overview camera...");
    requestSceneRender();
  }

  function applyLockTarget(target: CameraTarget) {
    const controller = cameraControllerRef.current;
    if (!controller) return;

    const currentFollow = controller.follow;
    if (currentFollow?.id === target) {
      clearFollowTarget(controller);
      syncCameraSelectionFromController();
      setStatus("Camera unlocked.");
      requestSceneRender();
      return;
    }

    const focusable = findCameraTargetByPreset(controller.registry, target);
    if (!focusable) return;
    applyFollowSelection(focusable);
  }

  function applyLookAtTarget(target: CameraTarget) {
    const controller = cameraControllerRef.current;
    if (!controller) return;

    const currentLook = controller.look;
    if (currentLook?.id === target) {
      clearLookTarget(controller);
      syncCameraSelectionFromController();
      setStatus("Look-at released.");
      requestSceneRender();
      return;
    }

    const focusable = findCameraTargetByPreset(controller.registry, target);
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
