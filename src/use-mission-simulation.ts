import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_ANGLE_DEG,
  DEFAULT_DT,
  DEFAULT_LAUNCH_AZIMUTH_DEG,
  DEFAULT_SPEED,
  DEFAULT_THRUST_ACCELERATION,
  DEFAULT_TURN_RATE_DEG,
} from "./physics/bodies";
import type { ManeuverInput } from "./physics/bodies";
import { EarthMoonSimulation } from "./sim/simulation";
import { clampDt, formatDt, isInteractiveElement } from "./mission";

export type MissionControlKey =
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "KeyW"
  | "KeyA"
  | "KeyS"
  | "KeyD"
  | "Space"
  | "KeyR";

type PressedMissionControls = Record<MissionControlKey, boolean>;

const INITIAL_PRESSED_CONTROLS: PressedMissionControls = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  KeyW: false,
  KeyA: false,
  KeyS: false,
  KeyD: false,
  Space: false,
  KeyR: false,
};

const MISSION_CONTROL_BY_CODE: Partial<Record<string, MissionControlKey>> = {
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  ArrowUp: "ArrowUp",
  Space: "Space",
  KeyW: "KeyW",
  KeyA: "KeyA",
  KeyS: "KeyS",
  KeyD: "KeyD",
  KeyR: "KeyR",
};

export function useMissionSimulation() {
  const runningRef = useRef(false);
  const launchSpeedRef = useRef(DEFAULT_SPEED);
  const launchAngleRef = useRef(DEFAULT_ANGLE_DEG);
  const launchAzimuthRef = useRef(DEFAULT_LAUNCH_AZIMUTH_DEG);
  const dtRef = useRef(DEFAULT_DT);
  const launchConfigInitializedRef = useRef(false);
  const maneuverInputRef = useRef<ManeuverInput>({
    thrusting: false,
    turn: 0,
  });
  const keyStateRef = useRef({
    left: false,
    right: false,
    thrust: false,
  });

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
  const [dt, setDtState] = useState(DEFAULT_DT);
  const [showTrail, setShowTrail] = useState(true);
  const [showThrustDirectionArrow, setShowThrustDirectionArrow] = useState(true);
  const [pressedControls, setPressedControls] = useState<PressedMissionControls>(
    INITIAL_PRESSED_CONTROLS,
  );
  const [status, setStatus] = useState(
    "Rocket staged on Earth's surface. Use the arrow keys to fly, Space to start or pause, R to restart, and WASD to change delta t.",
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
    dtRef.current = dt;
  }, [dt]);

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
    function onKeyDown(event: KeyboardEvent) {
      if (isInteractiveElement(event.target)) return;

      const control = MISSION_CONTROL_BY_CODE[event.code] ?? null;
      if (!control) return;

      if (event.repeat && (control === "Space" || control === "KeyR")) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      pressMissionControl(control);
    }

    function onKeyUp(event: KeyboardEvent) {
      const control = MISSION_CONTROL_BY_CODE[event.code] ?? null;
      if (!control) return;

      event.preventDefault();
      releaseMissionControl(control);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  function setDt(value: number) {
    const nextDt = clampDt(value);
    dtRef.current = nextDt;
    setDtState(nextDt);
  }

  function syncManeuverInput() {
    maneuverInputRef.current = {
      thrusting: keyStateRef.current.thrust,
      turn: keyStateRef.current.right ? 1 : keyStateRef.current.left ? -1 : 0,
    };
  }

  function setControlPressed(control: MissionControlKey, pressed: boolean) {
    setPressedControls((current) =>
      current[control] === pressed ? current : { ...current, [control]: pressed },
    );
  }

  function adjustDt(multiplier: number) {
    setDtState((current) => {
      const nextDt = clampDt(current * multiplier);
      dtRef.current = nextDt;
      return nextDt;
    });
  }

  function applyControlPress(control: MissionControlKey) {
    switch (control) {
      case "ArrowLeft":
        keyStateRef.current.left = true;
        break;
      case "ArrowRight":
        keyStateRef.current.right = true;
        break;
      case "ArrowUp":
        keyStateRef.current.thrust = true;
        break;
      case "Space":
        toggleRunning();
        break;
      case "KeyR":
        resetSimulation();
        break;
      case "KeyW":
        adjustDt(10);
        break;
      case "KeyA":
        adjustDt(0.98);
        break;
      case "KeyS":
        adjustDt(0.1);
        break;
      case "KeyD":
        adjustDt(1.02);
        break;
    }

    setControlPressed(control, true);
    syncManeuverInput();
  }

  function applyControlRelease(control: MissionControlKey) {
    switch (control) {
      case "ArrowLeft":
        keyStateRef.current.left = false;
        break;
      case "ArrowRight":
        keyStateRef.current.right = false;
        break;
      case "ArrowUp":
        keyStateRef.current.thrust = false;
        break;
      default:
        break;
    }

    setControlPressed(control, false);
    syncManeuverInput();
  }

  function resetSimulation() {
    maneuverInputRef.current = { thrusting: false, turn: 0 };
    keyStateRef.current = { left: false, right: false, thrust: false };
    setPressedControls(INITIAL_PRESSED_CONTROLS);
    simulation.setConfig({
      launchSpeed: launchSpeedRef.current,
      launchAngleDeg: launchAngleRef.current,
      launchAzimuthDeg: launchAzimuthRef.current,
      dt: dtRef.current,
      thrustAcceleration: DEFAULT_THRUST_ACCELERATION,
      turnRateDeg: DEFAULT_TURN_RATE_DEG,
    });
    simulation.reset();
    runningRef.current = false;
    setRunning(false);
    setTelemetry(simulation.getTelemetry());
    setStatus("Rocket reset to Earth's surface.");
  }

  function toggleRunning() {
    if (simulation.getState().impact) {
      resetSimulation();
    }

    setRunning((previous) => {
      const nextRunning = !previous;
      runningRef.current = nextRunning;
      setStatus(
        nextRunning
          ? `Running. Use Left and Right to steer, Up to burn, Space to pause, R to restart, and WASD to adjust delta t (${formatDt(dtRef.current)} s).`
          : "Paused.",
      );
      return nextRunning;
    });
  }

  function pressMissionControl(control: MissionControlKey) {
    applyControlPress(control);
  }

  function releaseMissionControl(control: MissionControlKey) {
    applyControlRelease(control);
  }

  return {
    simulation,
    running,
    setRunning,
    launchSpeed,
    setLaunchSpeed,
    launchAngleDeg,
    setLaunchAngleDeg,
    launchAzimuthDeg,
    setLaunchAzimuthDeg,
    dt,
    setDt,
    showTrail,
    setShowTrail,
    showThrustDirectionArrow,
    setShowThrustDirectionArrow,
    status,
    setStatus,
    telemetry,
    setTelemetry,
    resetSimulation,
    toggleRunning,
    runningRef,
    maneuverInputRef,
    pressedControls,
    pressMissionControl,
    releaseMissionControl,
    launchSpeedRef,
    launchAngleRef,
    launchAzimuthRef,
  };
}
