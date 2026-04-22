import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  DEFAULT_ANGLE_DEG,
  DEFAULT_DT,
  DEFAULT_LAUNCH_AZIMUTH_DEG,
  DEFAULT_SPEED,
  DEFAULT_THRUST_ACCELERATION,
  DEFAULT_TURN_RATE_DEG,
  EARTH_MOON_DISTANCE,
  R_EARTH,
  R_MOON,
  getLaunchFrame,
  makeInitialRocketState,
  SOFT_LANDING_SPEED,
} from "./physics/bodies";
import type { ImpactState, ManeuverInput } from "./physics/bodies";
import { EarthMoonSimulation } from "./sim/simulation";
import { createOrientationIndicator } from "./three/orientation-indicator";
import { createThreeScene } from "./three/scene";
import type { ThreeSceneBundle } from "./three/scene";
import { metersToScene, ROCKET_DRAW_RADIUS } from "./three/objects";
import { Controls } from "./ui/controls";

const MIN_DT = 0.1;
const MAX_DT = 1000;

function formatDistance(meters: number): string {
  const clamped = Math.max(meters, 0);

  if (clamped >= 1_000_000_000) {
    return `${(clamped / 1_000_000_000).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })} million km`;
  }

  return `${(clamped / 1000).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })} km`;
}

function formatSpeed(speed: number): string {
  if (speed >= 1000) {
    return `${(speed / 1000).toFixed(2)} km/s`;
  }

  return `${speed.toFixed(0)} m/s`;
}

function formatRelativeSpeed(speed: number): string {
  if (speed >= 1000) {
    return `${(speed / 1000).toFixed(3)} km/s`;
  }

  return `${speed.toFixed(1)} m/s`;
}

function formatElapsed(hours: number): string {
  const days = Math.floor(hours / 24);
  const remainingHours = hours - days * 24;

  if (days === 0) {
    return `${remainingHours.toFixed(1)} hr`;
  }

  return `${days} d ${remainingHours.toFixed(1)} hr`;
}

function formatDt(dt: number): string {
  if (dt >= 100) return dt.toFixed(0);
  if (dt >= 10) return dt.toFixed(1);
  return dt.toFixed(2);
}

function clampDt(dt: number): number {
  return THREE.MathUtils.clamp(dt, MIN_DT, MAX_DT);
}

function getMissionPhase(
  altitudeEarth: number,
  altitudeMoon: number,
  relativeMoonSpeed: number,
): string {
  const safeAltitudeEarth = Math.max(altitudeEarth, 0);
  const safeAltitudeMoon = Math.max(altitudeMoon, 0);

  if (safeAltitudeMoon < 15_000 && relativeMoonSpeed < 250)
    return "Landing burn";
  if (safeAltitudeMoon < 80_000) return "Lunar approach";
  if (safeAltitudeEarth < 80_000) return "Surface departure";
  if (safeAltitudeEarth < 40_000_000) return "Earth escape arc";

  return "Translunar coast";
}

function describeMoonLanding(impact: ImpactState): string {
  if (impact.softLanding) {
    return `Soft lunar landing at ${formatRelativeSpeed(impact.relativeSpeed)} relative speed.`;
  }

  return `Hard lunar impact at ${formatRelativeSpeed(impact.relativeSpeed)} relative speed. Target is ${formatRelativeSpeed(
    SOFT_LANDING_SPEED,
  )} or less.`;
}

function isInteractiveElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;

  return (
    target.isContentEditable ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    tag === "BUTTON"
  );
}

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const orientationRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const launchSpeedRef = useRef(DEFAULT_SPEED);
  const launchAngleRef = useRef(DEFAULT_ANGLE_DEG);
  const launchAzimuthRef = useRef(DEFAULT_LAUNCH_AZIMUTH_DEG);
  const launchConfigInitializedRef = useRef(false);
  const bundleRef = useRef<ThreeSceneBundle | null>(null);
  const focusTransitionRef = useRef<{
    position: THREE.Vector3;
    target: THREE.Vector3;
    status: string;
  } | null>(null);
  const previousRocketPositionRef = useRef(new THREE.Vector3());
  const maneuverInputRef = useRef<ManeuverInput>({
    thrusting: false,
    turn: 0,
  });
  const keyStateRef = useRef({
    left: false,
    right: false,
    thrust: false,
  });
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());

  const simulation = useMemo(
    () =>
      new EarthMoonSimulation({
        launchSpeed: DEFAULT_SPEED,
        launchAngleDeg: DEFAULT_ANGLE_DEG,
        launchAzimuthDeg: DEFAULT_LAUNCH_AZIMUTH_DEG,
        dt: DEFAULT_DT,
        thrustAcceleration: DEFAULT_THRUST_ACCELERATION,
        turnRateDeg: DEFAULT_TURN_RATE_DEG,
      }),
    [],
  );

  const [running, setRunning] = useState(false);
  const [launchSpeed, setLaunchSpeed] = useState(DEFAULT_SPEED);
  const [launchAngleDeg, setLaunchAngleDeg] = useState(DEFAULT_ANGLE_DEG);
  const [launchAzimuthDeg, setLaunchAzimuthDeg] = useState(
    DEFAULT_LAUNCH_AZIMUTH_DEG,
  );
  const [dt, setDt] = useState(DEFAULT_DT);
  const [showTrail, setShowTrail] = useState(true);
  const [showVectors, setShowVectors] = useState(false);
  const [status, setStatus] = useState(
    "Rocket staged on Earth's surface. Use the arrow keys to fly, Up or Space to thrust, and WASD to change delta t.",
  );
  const [telemetry, setTelemetry] = useState(() => simulation.getTelemetry());

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    launchSpeedRef.current = launchSpeed;
    launchAngleRef.current = launchAngleDeg;
    launchAzimuthRef.current = launchAzimuthDeg;
  }, [launchSpeed, launchAngleDeg, launchAzimuthDeg]);

  useEffect(() => {
    simulation.setConfig({
      launchSpeed,
      launchAngleDeg,
      launchAzimuthDeg,
      dt,
      thrustAcceleration: DEFAULT_THRUST_ACCELERATION,
      turnRateDeg: DEFAULT_TURN_RATE_DEG,
    });
  }, [simulation, launchSpeed, launchAngleDeg, launchAzimuthDeg, dt]);

  useEffect(() => {
    if (!launchConfigInitializedRef.current) {
      launchConfigInitializedRef.current = true;
      return;
    }

    runningRef.current = false;
    simulation.reset();
    setRunning(false);
    setTelemetry(simulation.getTelemetry());
    setStatus("Rocket restaged with updated launch conditions.");
  }, [simulation, launchSpeed, launchAngleDeg, launchAzimuthDeg]);

  useEffect(() => {
    function syncManeuverInput() {
      maneuverInputRef.current = {
        thrusting: keyStateRef.current.thrust,
        turn: keyStateRef.current.right
          ? 1
          : keyStateRef.current.left
            ? -1
            : 0,
      };
    }

    function onKeyDown(event: KeyboardEvent) {
      if (isInteractiveElement(event.target)) return;

      let handled = true;
      if (event.code === "ArrowLeft") {
        keyStateRef.current.left = true;
      } else if (event.code === "ArrowRight") {
        keyStateRef.current.right = true;
      } else if (
        event.code === "ArrowUp" ||
        event.code === "Space"
      ) {
        keyStateRef.current.thrust = true;
      } else if (event.code === "KeyW") {
        setDt((current) => clampDt(current * 10));
      } else if (event.code === "KeyS") {
        setDt((current) => clampDt(current / 10));
      } else if (event.code === "KeyA") {
        setDt((current) => clampDt(current * 0.98));
      } else if (event.code === "KeyD") {
        setDt((current) => clampDt(current * 1.02));
      } else {
        handled = false;
      }

      if (!handled) return;
      event.preventDefault();
      syncManeuverInput();
    }

    function onKeyUp(event: KeyboardEvent) {
      let handled = true;
      if (event.code === "ArrowLeft") {
        keyStateRef.current.left = false;
      } else if (event.code === "ArrowRight") {
        keyStateRef.current.right = false;
      } else if (
        event.code === "ArrowUp" ||
        event.code === "Space"
      ) {
        keyStateRef.current.thrust = false;
      } else {
        handled = false;
      }

      if (!handled) return;
      event.preventDefault();
      syncManeuverInput();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    const orientationMount = orientationRef.current;
    if (!mount || !orientationMount) return;

    const bundle = createThreeScene(mount);
    const orientationIndicator = createOrientationIndicator(orientationMount);
    const { camera, controls, objects, render, resize, renderer, scene } =
      bundle;
    bundleRef.current = bundle;

    const initialState = simulation.getState();
    const initialRocketPosition = metersToScene(initialState.rocket.position);
    previousRocketPositionRef.current.copy(initialRocketPosition);

    function syncScene() {
      const simState = simulation.getState();
      const telemetryNow = simulation.getTelemetry();
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
      const aimArrowLength = THREE.MathUtils.lerp(
        12,
        30,
        normalizedLaunchSpeed,
      );
      const stagedLaunchPreviewVisible = !runningRef.current;

      objects.moon.position.copy(metersToScene(telemetryNow.moonPosition));
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
      objects.trailLine.visible = showTrail;
      const trailPoints = simulation.getTrail().map((p) => metersToScene(p));
      objects.trailLine.geometry.dispose();
      objects.trailLine.geometry = new THREE.BufferGeometry().setFromPoints(
        trailPoints,
      );

      objects.velocityArrow.visible = showVectors;
      objects.accelerationArrow.visible = showVectors;

      if (showVectors) {
        const rocketPos = objects.rocket.position.clone();
        const v = simState.rocket.velocity.clone();
        const a = simState.rocket.acceleration.clone();

        const vLen = Math.max(v.length(), 1);
        objects.velocityArrow.position.copy(rocketPos);
        objects.velocityArrow.setDirection(v.normalize());
        objects.velocityArrow.setLength(Math.min(60, vLen / 250), 6, 4);

        const aLen = Math.max(a.length(), 1e-9);
        objects.accelerationArrow.position.copy(rocketPos);
        objects.accelerationArrow.setDirection(a.normalize());
        objects.accelerationArrow.setLength(Math.min(50, aLen * 1.5e6), 6, 4);
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

      orientationIndicator.rocket.quaternion.copy(objects.rocket.quaternion);

      setTelemetry(telemetryNow);

      if (simState.impact?.target === "earth") {
        runningRef.current = false;
        setRunning(false);
        setStatus(
          `Rocket impacted Earth at ${formatSpeed(simState.impact.speed)}.`,
        );
      } else if (simState.impact?.target === "moon") {
        runningRef.current = false;
        setRunning(false);
        setStatus(describeMoonLanding(simState.impact));
      } else if (runningRef.current) {
        setStatus(
          `Running: ${getMissionPhase(
            telemetryNow.altitudeEarth,
            telemetryNow.altitudeMoon,
            telemetryNow.relativeMoonSpeed,
          )}.`,
        );
      }
    }

    function focusOnObject(targetObject: THREE.Object3D) {
      const worldPosition = new THREE.Vector3();
      targetObject.getWorldPosition(worldPosition);

      const focusRadius = Number(targetObject.userData.focusRadius ?? 12);
      const focusLabel = String(targetObject.userData.focusLabel ?? "target");
      const currentOffset = camera.position.clone().sub(controls.target);
      const fallbackOffset = new THREE.Vector3(1.25, 0.75, 1.15);
      const viewDirection =
        currentOffset.lengthSq() > 1e-6
          ? currentOffset.normalize()
          : fallbackOffset.normalize();
      const focusDistance = THREE.MathUtils.clamp(focusRadius * 5, 4, 520);
      const desiredPosition = worldPosition
        .clone()
        .add(viewDirection.multiplyScalar(focusDistance));

      focusTransitionRef.current = {
        position: desiredPosition,
        target: worldPosition,
        status: `Focused on ${focusLabel}.`,
      };
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
          focusOnObject(focusable);
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
      orientationIndicator.resize();
    }

    window.addEventListener("resize", onResize);
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
          camera.position.distanceTo(focusTransitionRef.current.position) <
            0.8 &&
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
      orientationIndicator.render();
      animationRef.current = requestAnimationFrame(frame);
    }

    frame();

    return () => {
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("dblclick", onDoubleClick);
      if (animationRef.current !== null)
        cancelAnimationFrame(animationRef.current);
      bundleRef.current = null;
      focusTransitionRef.current = null;
      orientationIndicator.dispose();
      bundle.dispose();
    };
  }, [simulation, showTrail, showVectors]);

  function resetSimulation() {
    maneuverInputRef.current = { thrusting: false, turn: 0 };
    keyStateRef.current = { left: false, right: false, thrust: false };
    simulation.setConfig({
      launchSpeed,
      launchAngleDeg,
      launchAzimuthDeg,
      dt,
      thrustAcceleration: DEFAULT_THRUST_ACCELERATION,
      turnRateDeg: DEFAULT_TURN_RATE_DEG,
    });
    simulation.reset();
    runningRef.current = false;
    setRunning(false);
    setTelemetry(simulation.getTelemetry());
    setStatus("Rocket reset to Earth's surface.");
  }

  function applyCameraPreset(
    preset: "overview" | "earth" | "moon" | "sun" | "rocket",
  ) {
    const bundle = bundleRef.current;
    if (!bundle) return;

    if (preset === "overview") {
      focusTransitionRef.current = {
        position: new THREE.Vector3(-210, 120, 210),
        target: new THREE.Vector3(56, 0, 0),
        status: "Overview camera restored.",
      };
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
    const currentOffset = bundle.camera.position
      .clone()
      .sub(bundle.controls.target);
    const viewDirection =
      currentOffset.lengthSq() > 1e-6
        ? currentOffset.normalize()
        : new THREE.Vector3(1.25, 0.75, 1.15).normalize();

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
    setStatus(`Focusing ${focusedObject.userData.focusLabel}...`);
  }

  const missionPhase = getMissionPhase(
    telemetry.altitudeEarth,
    telemetry.altitudeMoon,
    telemetry.relativeMoonSpeed,
  );
  const currentAltitudeEarth = Math.max(telemetry.altitudeEarth, 0);
  const currentAltitudeMoon = Math.max(telemetry.altitudeMoon, 0);
  const lunarTransferGap = Math.max(
    EARTH_MOON_DISTANCE - R_EARTH - R_MOON - currentAltitudeEarth,
    0,
  );

  return (
    <div className="min-h-screen overflow-hidden bg-[#02060d] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(79,172,255,0.18),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(255,185,107,0.14),_transparent_28%),linear-gradient(180deg,_rgba(2,6,13,0.94),_rgba(3,9,18,0.98))]" />
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:72px_72px] opacity-40" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-4 py-4 md:px-6 lg:px-8 lg:py-6">
        <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_380px]">
          <div className="rounded-[2.25rem] border border-white/10 bg-[#07111f]/78 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="flex flex-wrap items-center gap-3 text-[0.72rem] font-semibold tracking-[0.24em] text-cyan-100 uppercase">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1">
                Earth to Moon
              </span>
              <span className="rounded-full border border-amber-300/20 bg-amber-200/10 px-3 py-1 text-amber-100">
                Three.js orbital sandbox
              </span>
            </div>

            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
              Fly from Earth to the Moon and try to land with zero relative
              velocity.
            </h1>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Mission Phase"
                value={missionPhase}
                accent="cyan"
              />
              <MetricCard
                label="Current Speed"
                value={formatSpeed(telemetry.speed)}
                accent="amber"
              />
              <MetricCard
                label="Peak Earth Altitude"
                value={formatDistance(telemetry.peakAltitudeEarth)}
                accent="cyan"
              />
              <MetricCard
                label="Closest Moon Approach"
                value={formatDistance(telemetry.closestMoonApproach)}
                accent="amber"
              />
            </div>
          </div>

          <div className="rounded-[2.25rem] border border-white/10 bg-[#0b1628]/82 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="text-[0.72rem] font-semibold tracking-[0.24em] text-slate-400 uppercase">
              Mission Notes
            </div>
            <div className="mt-4 space-y-4 text-sm leading-6 text-slate-300">
              <p>
                The current model is Earth-Moon gravity plus a steerable main
                engine for small course corrections and landing burns.
              </p>
              <p>
                Distances and body sizes use the same compression factor, so the
                visual proportions stay consistent even though the whole system
                is scaled down.
              </p>
              <p className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-slate-200">
                Goal: touch down below {formatRelativeSpeed(SOFT_LANDING_SPEED)}{" "}
                Moon-relative speed. Current Earth-to-Moon surface gap:{" "}
                {formatDistance(lunarTransferGap)}.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="space-y-5">
            <Controls
              launchSpeed={launchSpeed}
              launchAngleDeg={launchAngleDeg}
              launchAzimuthDeg={launchAzimuthDeg}
              dt={dt}
              showTrail={showTrail}
              showVectors={showVectors}
              running={running}
              onCameraPreset={applyCameraPreset}
              onLaunchSpeedChange={setLaunchSpeed}
              onLaunchAngleChange={setLaunchAngleDeg}
              onLaunchAzimuthChange={setLaunchAzimuthDeg}
              onDtChange={setDt}
              onShowTrailChange={setShowTrail}
              onShowVectorsChange={setShowVectors}
              onToggleRunning={() => {
                if (simulation.getState().impact) {
                  resetSimulation();
                }

                setRunning((prev) => {
                  const nextRunning = !prev;
                  runningRef.current = nextRunning;
                  setStatus(
                    nextRunning
                      ? `Running. Use arrow keys to fly, Up or Space to burn, and WASD to adjust delta t (${formatDt(dt)} s).`
                      : "Paused.",
                  );
                  return nextRunning;
                });
              }}
              onReset={resetSimulation}
            />

            <div className="rounded-[2rem] border border-white/10 bg-[#07111f]/85 p-5 text-sm shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur">
              <div className="text-[0.72rem] font-semibold tracking-[0.24em] text-slate-400 uppercase">
                Telemetry
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <TelemetryRow
                  label="Elapsed mission time"
                  value={formatElapsed(telemetry.hours)}
                />
                <TelemetryRow
                  label="Current speed"
                  value={formatSpeed(telemetry.speed)}
                />
                <TelemetryRow
                  label="Moon-relative speed"
                  value={formatRelativeSpeed(telemetry.relativeMoonSpeed)}
                />
                <TelemetryRow
                  label="Altitude above Earth"
                  value={formatDistance(currentAltitudeEarth)}
                />
                <TelemetryRow
                  label="Altitude above Moon"
                  value={formatDistance(currentAltitudeMoon)}
                />
              </div>
              <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/8 px-4 py-3 text-slate-200">
                Status: {status}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#07111f]/82 p-5 text-sm leading-6 text-slate-300 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur">
              Keyboard flight controls are live while the mission is running:
              Left/Right rotate the ship, and Up or Space fires the engine
              forward. W multiplies delta t by 10, S divides it by 10, A trims
              it down by 2%, and D bumps it up by 2%.
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#030914]/78 shadow-[0_40px_100px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-x-0 top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 bg-gradient-to-b from-[#040b16]/95 to-transparent px-5 py-4 text-xs tracking-[0.22em] text-slate-300 uppercase">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-cyan-100">
                  Scene View
                </span>
                <span>Orbit view with Y-up orbital plane</span>
              </div>
              <div className="flex flex-wrap gap-2 text-[0.68rem]">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Drag to rotate
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Wheel to zoom
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Right-drag to pan
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Up/Space thrust
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  WASD time warp
                </span>
              </div>
            </div>

            <div
              ref={mountRef}
              className="h-[min(78vh,860px)] min-h-[620px] w-full"
            />

            <div className="pointer-events-none absolute bottom-5 right-5 z-20 rounded-[1.4rem] border border-cyan-300/14 bg-[#07111f]/78 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.32)] backdrop-blur">
              <div className="mb-2 text-[0.64rem] font-semibold tracking-[0.24em] text-cyan-100 uppercase">
                Orientation Vector
              </div>
              <div
                ref={orientationRef}
                className="h-[132px] w-[132px] rounded-[1rem] border border-white/8 bg-[radial-gradient(circle_at_30%_20%,rgba(125,211,252,0.14),transparent_42%),linear-gradient(180deg,rgba(4,11,22,0.95),rgba(6,15,28,0.88))]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  accent: "cyan" | "amber";
};

function MetricCard({ label, value, accent }: MetricCardProps) {
  const accentClasses =
    accent === "cyan"
      ? "border-cyan-300/12 bg-cyan-300/8 text-cyan-50"
      : "border-amber-300/12 bg-amber-300/8 text-amber-50";

  return (
    <div
      className={`min-h-[7.75rem] min-w-0 rounded-[1.5rem] border px-4 py-4 ${accentClasses}`}
    >
      <div className="truncate text-[0.68rem] font-semibold tracking-[0.22em] text-slate-300 uppercase">
        {label}
      </div>
      <div className="mt-2 truncate text-xl font-semibold text-white tabular-nums">
        {value}
      </div>
    </div>
  );
}

type TelemetryRowProps = {
  label: string;
  value: string;
};

function TelemetryRow({ label, value }: TelemetryRowProps) {
  return (
    <div className="rounded-[1.35rem] border border-white/8 bg-white/4 px-4 py-3">
      <div className="text-[0.68rem] font-semibold tracking-[0.2em] text-slate-400 uppercase">
        {label}
      </div>
      <div className="mt-1 text-base font-medium text-slate-100">{value}</div>
    </div>
  );
}
