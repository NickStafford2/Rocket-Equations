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
import type { CameraPreset } from "./mission";
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
  position: THREE.Vector3;
  target: THREE.Vector3;
  status: string;
};

const FALLBACK_VIEW_DIRECTION = new THREE.Vector3(1.25, 0.75, 1.15).normalize();
const UI_SYNC_INTERVAL_MS = 100;

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
  const previousRocketPositionRef = useRef(new THREE.Vector3());
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

    previousRocketPositionRef.current.copy(
      metersToScene(simulation.getState().rocket.position),
    );
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

    function applyFocusTransition(targetObject: THREE.Object3D) {
      const worldPosition = new THREE.Vector3();
      targetObject.getWorldPosition(worldPosition);

      const focusRadius = Number(targetObject.userData.focusRadius ?? 12);
      const focusLabel = String(targetObject.userData.focusLabel ?? "target");
      const currentOffset = camera.position.clone().sub(controls.target);
      const viewDirection =
        currentOffset.lengthSq() > 1e-6
          ? currentOffset.normalize()
          : FALLBACK_VIEW_DIRECTION.clone();
      const focusDistance = THREE.MathUtils.clamp(focusRadius * 5, 4, 520);

      focusTransitionRef.current = {
        position: worldPosition
          .clone()
          .add(viewDirection.multiplyScalar(focusDistance)),
        target: worldPosition,
        status: `Focused on ${focusLabel}.`,
      };
      setCurrentCameraPreset(normalizeFocusLabelToPreset(focusLabel));
      setStatus(`Focusing ${focusLabel}...`);
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
          applyFocusTransition(focusable);
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
      if (!focusTransitionRef.current) {
        setCurrentCameraPreset(null);
      }
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

      const rocketPosition = objects.rocket.position.clone();
      if (focusTransitionRef.current) {
        camera.position.lerp(focusTransitionRef.current.position, 0.12);
        controls.target.lerp(focusTransitionRef.current.target, 0.12);

        if (
          camera.position.distanceTo(focusTransitionRef.current.position) < 0.8 &&
          controls.target.distanceTo(focusTransitionRef.current.target) < 0.35
        ) {
          setStatus(focusTransitionRef.current.status);
          focusTransitionRef.current = null;
        }
      } else {
        const rocketDelta = rocketPosition
          .clone()
          .sub(previousRocketPositionRef.current);
        camera.position.add(rocketDelta);
        controls.target.add(rocketDelta);
      }

      controls.update();
      previousRocketPositionRef.current.copy(rocketPosition);
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
      focusTransitionRef.current = {
        position: new THREE.Vector3(-210, 120, 210),
        target: new THREE.Vector3(56, 0, 0),
        status: "Overview camera restored.",
      };
      setCurrentCameraPreset("overview");
      setStatus("Restoring overview camera...");
      return;
    }

    let focusable: THREE.Object3D | null = null;
    bundle.scene.traverse((object) => {
      if (focusable) return;
      if (String(object.userData.focusLabel).toLowerCase() === preset) {
        focusable = object;
      }
    });

    if (!focusable) return;
    const focusedObject = focusable as THREE.Object3D;

    const worldPosition = new THREE.Vector3();
    focusedObject.getWorldPosition(worldPosition);

    const focusRadius = Number(focusedObject.userData.focusRadius ?? 12);
    const currentOffset = bundle.camera.position.clone().sub(bundle.controls.target);
    const viewDirection =
      currentOffset.lengthSq() > 1e-6
        ? currentOffset.normalize()
        : FALLBACK_VIEW_DIRECTION.clone();

    focusTransitionRef.current = {
      position: worldPosition
        .clone()
        .add(
          viewDirection.multiplyScalar(
            THREE.MathUtils.clamp(focusRadius * 5, 4, 520),
          ),
        ),
      target: worldPosition,
      status: `Focused on ${focusedObject.userData.focusLabel}.`,
    };
    setCurrentCameraPreset(preset);
    setStatus(`Focusing ${focusedObject.userData.focusLabel}...`);
  }

  return {
    currentCameraPreset,
    applyCameraPreset,
  };
}
