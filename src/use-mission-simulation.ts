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
  | "KeyD";

type PressedMissionControls = Record<MissionControlKey, boolean>;

const INITIAL_PRESSED_CONTROLS: PressedMissionControls = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  KeyW: false,
  KeyA: false,
  KeyS: false,
  KeyD: false,
};

export function useMissionSimulation() {
  const runningRef = useRef(false);
  const launchSpeedRef = useRef(DEFAULT_SPEED);
  const launchAngleRef = useRef(DEFAULT_ANGLE_DEG);
  const launchAzimuthRef = useRef(DEFAULT_LAUNCH_AZIMUTH_DEG);
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
        turn: keyStateRef.current.right ? 1 : keyStateRef.current.left ? -1 : 0,
      };
    }

    function setControlPressed(control: MissionControlKey, pressed: boolean) {
      setPressedControls((current) =>
        current[control] === pressed
          ? current
          : { ...current, [control]: pressed },
      );
    }

    function pressControl(control: MissionControlKey) {
      if (control === "ArrowLeft") {
        keyStateRef.current.left = true;
      } else if (control === "ArrowRight") {
        keyStateRef.current.right = true;
      } else if (control === "ArrowUp") {
        keyStateRef.current.thrust = true;
      } else if (control === "KeyW") {
        setDtState((current) => clampDt(current * 10));
      } else if (control === "KeyS") {
        setDtState((current) => clampDt(current / 10));
      } else if (control === "KeyA") {
        setDtState((current) => clampDt(current * 0.98));
      } else if (control === "KeyD") {
        setDtState((current) => clampDt(current * 1.02));
      }

      setControlPressed(control, true);
      syncManeuverInput();
    }

    function releaseControl(control: MissionControlKey) {
      if (control === "ArrowLeft") {
        keyStateRef.current.left = false;
      } else if (control === "ArrowRight") {
        keyStateRef.current.right = false;
      } else if (control === "ArrowUp") {
        keyStateRef.current.thrust = false;
      }

      setControlPressed(control, false);
      syncManeuverInput();
    }

    function toMissionControl(
      code: string,
    ): MissionControlKey | null {
      if (code === "ArrowLeft") return "ArrowLeft";
      if (code === "ArrowRight") return "ArrowRight";
      if (code === "ArrowUp" || code === "Space") return "ArrowUp";
      if (code === "KeyW") return "KeyW";
      if (code === "KeyA") return "KeyA";
      if (code === "KeyS") return "KeyS";
      if (code === "KeyD") return "KeyD";
      return null;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (isInteractiveElement(event.target)) return;

      const control = toMissionControl(event.code);
      if (!control) return;

      event.preventDefault();
      pressControl(control);
    }

    function onKeyUp(event: KeyboardEvent) {
      const control = toMissionControl(event.code);
      if (!control) return;

      event.preventDefault();
      releaseControl(control);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  function setDt(value: number) {
    setDtState(clampDt(value));
  }

  function resetSimulation() {
    maneuverInputRef.current = { thrusting: false, turn: 0 };
    keyStateRef.current = { left: false, right: false, thrust: false };
    setPressedControls(INITIAL_PRESSED_CONTROLS);
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

  function toggleRunning() {
    if (simulation.getState().impact) {
      resetSimulation();
    }

    setRunning((previous) => {
      const nextRunning = !previous;
      runningRef.current = nextRunning;
      setStatus(
        nextRunning
          ? `Running. Use arrow keys to fly, Up or Space to burn, and WASD to adjust delta t (${formatDt(dt)} s).`
          : "Paused.",
      );
      return nextRunning;
    });
  }

  function pressMissionControl(control: MissionControlKey) {
    if (control === "ArrowLeft") {
      keyStateRef.current.left = true;
    } else if (control === "ArrowRight") {
      keyStateRef.current.right = true;
    } else if (control === "ArrowUp") {
      keyStateRef.current.thrust = true;
    } else if (control === "KeyW") {
      setDtState((current) => clampDt(current * 10));
    } else if (control === "KeyS") {
      setDtState((current) => clampDt(current / 10));
    } else if (control === "KeyA") {
      setDtState((current) => clampDt(current * 0.98));
    } else if (control === "KeyD") {
      setDtState((current) => clampDt(current * 1.02));
    }

    setPressedControls((current) =>
      current[control] ? current : { ...current, [control]: true },
    );
    maneuverInputRef.current = {
      thrusting: keyStateRef.current.thrust,
      turn: keyStateRef.current.right ? 1 : keyStateRef.current.left ? -1 : 0,
    };
  }

  function releaseMissionControl(control: MissionControlKey) {
    if (control === "ArrowLeft") {
      keyStateRef.current.left = false;
    } else if (control === "ArrowRight") {
      keyStateRef.current.right = false;
    } else if (control === "ArrowUp") {
      keyStateRef.current.thrust = false;
    }

    setPressedControls((current) =>
      current[control] ? { ...current, [control]: false } : current,
    );
    maneuverInputRef.current = {
      thrusting: keyStateRef.current.thrust,
      turn: keyStateRef.current.right ? 1 : keyStateRef.current.left ? -1 : 0,
    };
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
