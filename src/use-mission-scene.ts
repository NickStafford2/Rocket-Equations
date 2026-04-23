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
import type { CameraPreset, CameraTarget } from "./mission";
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

type FocusTransition = {
  mode: "overview" | "snap" | "look";
  preset: CameraPreset;
  object?: THREE.Object3D;
  offset?: THREE.Vector3;
  position?: THREE.Vector3;
  target?: THREE.Vector3;
  status: string;
};

const FALLBACK_VIEW_DIRECTION = new THREE.Vector3(1.25, 0.75, 1.15).normalize();
const UI_SYNC_INTERVAL_MS = 100;

function createFocusTransition(
  camera: THREE.PerspectiveCamera,
  controls: ThreeSceneBundle["controls"],
  targetObject: THREE.Object3D,
  mode: "snap" | "look",
): FocusTransition | null {
  const focusRadius = Number(targetObject.userData.focusRadius ?? 12);
  const focusLabel = String(targetObject.userData.focusLabel ?? "target");
  const preset = normalizeFocusLabelToPreset(focusLabel);
  if (!preset || preset === "overview") return null;

  if (mode === "look") {
    return {
      mode,
      preset,
      object: targetObject,
      status: `Looking at ${focusLabel}.`,
    };
  }

  const currentOffset = camera.position.clone().sub(controls.target);
  const viewDirection =
    currentOffset.lengthSq() > 1e-6
      ? currentOffset.normalize()
      : FALLBACK_VIEW_DIRECTION.clone();

  return {
    mode,
    preset,
    object: targetObject,
    offset: viewDirection.multiplyScalar(
      THREE.MathUtils.clamp(focusRadius * 5, 4, 520),
    ),
    status: `Focused on ${focusLabel}.`,
  };
}

function resolveFocusTransitionTarget(
  transition: FocusTransition,
  currentCameraPosition: THREE.Vector3,
): { position: THREE.Vector3; target: THREE.Vector3 } {
  if (transition.mode === "overview") {
    return {
      position: transition.position!.clone(),
      target: transition.target!.clone(),
    };
  }

  const worldPosition = new THREE.Vector3();
  transition.object!.getWorldPosition(worldPosition);

  return {
    position:
      transition.mode === "snap"
        ? worldPosition.clone().add(transition.offset!)
        : currentCameraPosition.clone(),
    target: worldPosition,
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
  const focusTransitionRef = useRef<FocusTransition | null>(null);
  const activeFocusRef = useRef<FocusTransition | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());
  const showTrailRef = useRef(showTrail);
  const showVectorsRef = useRef(showVectors);
  const lastUiSyncAtRef = useRef(0);
  const lastTelemetryTimeRef = useRef<number | null>(null);
  const lastRunningStatusRef = useRef<string | null>(null);
  const previousTrailLengthRef = useRef(0);
  const [currentCameraPreset, setCurrentCameraPreset] =
    useState<CameraPreset | null>("overview");
  const [currentLookTarget, setCurrentLookTarget] =
    useState<CameraTarget | null>(null);

  function applyFocusSelection(
    targetObject: THREE.Object3D,
    mode: "snap" | "look",
  ) {
    const bundle = bundleRef.current;
    if (!bundle) return;

    const transition = createFocusTransition(
      bundle.camera,
      bundle.controls,
      targetObject,
      mode,
    );
    if (!transition) return;

    activeFocusRef.current = transition;
    focusTransitionRef.current = transition;

    const focusLabel = String(targetObject.userData.focusLabel ?? "target");
    if (mode === "snap") {
      setCurrentCameraPreset(transition.preset);
      setCurrentLookTarget(null);
      setStatus(`Focusing ${focusLabel}...`);
      return;
    }

    setCurrentCameraPreset(null);
    setCurrentLookTarget(transition.preset as CameraTarget);
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
          applyFocusSelection(focusable, "snap");
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
      activeFocusRef.current = null;
      focusTransitionRef.current = null;
      setCurrentCameraPreset(null);
      setCurrentLookTarget(null);
    }

    window.addEventListener("resize", onResize);
    mount.addEventListener("pointerdown", onScenePointerDown);
    controls.addEventListener("start", onControlsStart);
    renderer.domElement.addEventListener("dblclick", onDoubleClick);

    function frame() {
      if (runningRef.current) {
        simulation.tick(maneuverInputRef.current);
      }

      syncScene();

      if (activeFocusRef.current) {
        const desiredFocus = resolveFocusTransitionTarget(
          activeFocusRef.current,
          camera.position,
        );
        const isTransitioning = focusTransitionRef.current !== null;
        const transitionAlpha = isTransitioning ? 0.12 : 1;

        if (activeFocusRef.current.mode !== "look") {
          camera.position.lerp(desiredFocus.position, transitionAlpha);
        }
        controls.target.lerp(desiredFocus.target, transitionAlpha);

        if (isTransitioning) {
          const cameraSettled =
            activeFocusRef.current.mode === "look" ||
            camera.position.distanceTo(desiredFocus.position) < 0.8;
          const targetSettled =
            controls.target.distanceTo(desiredFocus.target) < 0.35;

          if (cameraSettled && targetSettled) {
            setStatus(activeFocusRef.current.status);
            focusTransitionRef.current = null;
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
      renderer.domElement.removeEventListener("dblclick", onDoubleClick);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      bundleRef.current = null;
      focusTransitionRef.current = null;
      activeFocusRef.current = null;
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

  function applyCameraPreset(preset: CameraPreset) {
    const bundle = bundleRef.current;
    if (!bundle) return;

    if (preset === "overview") {
      const transition: FocusTransition = {
        mode: "overview",
        preset: "overview",
        position: new THREE.Vector3(-210, 120, 210),
        target: new THREE.Vector3(56, 0, 0),
        status: "Overview camera restored.",
      };
      activeFocusRef.current = transition;
      focusTransitionRef.current = transition;
      setCurrentCameraPreset("overview");
      setCurrentLookTarget(null);
      setStatus("Restoring overview camera...");
      return;
    }

    const focusable = findFocusableByPreset(bundle.scene, preset);
    if (!focusable) return;
    applyFocusSelection(focusable, "snap");
  }

  function applyLookAtTarget(target: CameraTarget) {
    const bundle = bundleRef.current;
    if (!bundle) return;

    const focusable = findFocusableByPreset(bundle.scene, target);
    if (!focusable) return;
    applyFocusSelection(focusable, "look");
  }

  return {
    currentCameraPreset,
    currentLookTarget,
    applyCameraPreset,
    applyLookAtTarget,
  };
}
