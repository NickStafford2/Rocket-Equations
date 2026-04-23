import { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { ManeuverInput } from "../physics/bodies";
import { clampDt, isInteractiveElement } from "../mission";
import type { EarthMoonSimulation, SimulationTelemetry } from "../sim/simulation";
import { createSimulationConfig } from "./config";
import {
  createRunningStatus,
  PAUSED_STATUS,
  RESET_STATUS,
} from "./status";
import {
  createInitialDirectionKeyState,
  INITIAL_PRESSED_CONTROLS,
  MISSION_CONTROL_BY_CODE,
  type DirectionKeyState,
  type MissionControlKey,
  type PressedMissionControls,
} from "./types";

type UseMissionControlsParams = {
  simulation: EarthMoonSimulation;
  runningRef: MutableRefObject<boolean>;
  maneuverInputRef: MutableRefObject<ManeuverInput>;
  launchSpeedRef: MutableRefObject<number>;
  launchAngleRef: MutableRefObject<number>;
  launchAzimuthRef: MutableRefObject<number>;
  dtRef: MutableRefObject<number>;
  setRunning: (value: boolean | ((previous: boolean) => boolean)) => void;
  setStatus: (value: string) => void;
  setTelemetry: (value: SimulationTelemetry) => void;
  setDtState: (value: number | ((current: number) => number)) => void;
};

type UseMissionControlsResult = {
  pressedControls: PressedMissionControls;
  pressMissionControl: (control: MissionControlKey) => void;
  releaseMissionControl: (control: MissionControlKey) => void;
  resetSimulation: () => void;
  toggleRunning: () => void;
};

export function useMissionControls({
  simulation,
  runningRef,
  maneuverInputRef,
  launchSpeedRef,
  launchAngleRef,
  launchAzimuthRef,
  dtRef,
  setRunning,
  setStatus,
  setTelemetry,
  setDtState,
}: UseMissionControlsParams): UseMissionControlsResult {
  const [pressedControls, setPressedControls] = useState<PressedMissionControls>(
    INITIAL_PRESSED_CONTROLS,
  );
  const keyStateRef = useRef<DirectionKeyState>(createInitialDirectionKeyState());

  const syncManeuverInput = useCallback(() => {
    maneuverInputRef.current = {
      thrusting: keyStateRef.current.thrust,
      turn: keyStateRef.current.right ? 1 : keyStateRef.current.left ? -1 : 0,
    };
  }, [maneuverInputRef]);

  const setControlPressed = useCallback(
    (control: MissionControlKey, pressed: boolean) => {
      setPressedControls((current) =>
        current[control] === pressed ? current : { ...current, [control]: pressed },
      );
    },
    [],
  );

  const adjustDt = useCallback(
    (multiplier: number) => {
      setDtState((current) => {
        const nextDt = clampDt(current * multiplier);
        dtRef.current = nextDt;
        return nextDt;
      });
    },
    [dtRef, setDtState],
  );

  const resetSimulation = useCallback(() => {
    maneuverInputRef.current = { thrusting: false, turn: 0 };
    keyStateRef.current = createInitialDirectionKeyState();
    setPressedControls(INITIAL_PRESSED_CONTROLS);
    simulation.setConfig(
      createSimulationConfig({
        launchSpeed: launchSpeedRef.current,
        launchAngleDeg: launchAngleRef.current,
        launchAzimuthDeg: launchAzimuthRef.current,
        dt: dtRef.current,
      }),
    );
    simulation.reset();
    runningRef.current = false;
    setRunning(false);
    setTelemetry(simulation.getTelemetry());
    setStatus(RESET_STATUS);
  }, [
    dtRef,
    launchAngleRef,
    launchAzimuthRef,
    launchSpeedRef,
    maneuverInputRef,
    runningRef,
    setRunning,
    setStatus,
    setTelemetry,
    simulation,
  ]);

  const toggleRunning = useCallback(() => {
    if (simulation.getState().impact) {
      resetSimulation();
    }

    setRunning((previous) => {
      const nextRunning = !previous;
      runningRef.current = nextRunning;
      setStatus(nextRunning ? createRunningStatus(dtRef.current) : PAUSED_STATUS);
      return nextRunning;
    });
  }, [dtRef, resetSimulation, runningRef, setRunning, setStatus, simulation]);

  const pressMissionControl = useCallback(
    (control: MissionControlKey) => {
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
    },
    [adjustDt, resetSimulation, setControlPressed, syncManeuverInput, toggleRunning],
  );

  const releaseMissionControl = useCallback(
    (control: MissionControlKey) => {
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
    },
    [setControlPressed, syncManeuverInput],
  );

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
  }, [pressMissionControl, releaseMissionControl]);

  return {
    pressedControls,
    pressMissionControl,
    releaseMissionControl,
    resetSimulation,
    toggleRunning,
  };
}
