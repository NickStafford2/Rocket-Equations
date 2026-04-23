import { useEffect, useMemo, useRef, useState } from "react";
import type { ManeuverInput } from "./physics/bodies";
import { EarthMoonSimulation } from "./sim/simulation";
import { clampDt } from "./mission";
import {
  createSimulationConfig,
  DEFAULT_ANGLE_DEG,
  DEFAULT_DT,
  DEFAULT_LAUNCH_AZIMUTH_DEG,
  DEFAULT_SPEED,
} from "./mission-simulation/config";
import {
  INITIAL_MISSION_STATUS,
  RESTAGED_STATUS,
} from "./mission-simulation/status";
import { useMissionControls } from "./mission-simulation/use-mission-controls";

export type { MissionControlKey } from "./mission-simulation/types";

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

  const simulation = useMemo(
    () =>
      new EarthMoonSimulation(
        createSimulationConfig({
          launchSpeed: DEFAULT_SPEED,
          launchAngleDeg: DEFAULT_ANGLE_DEG,
          launchAzimuthDeg: DEFAULT_LAUNCH_AZIMUTH_DEG,
          dt: DEFAULT_DT,
        }),
      ),
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
  const [status, setStatus] = useState(INITIAL_MISSION_STATUS);
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
    simulation.setConfig(
      createSimulationConfig({
        launchSpeed,
        launchAngleDeg,
        launchAzimuthDeg,
        dt,
      }),
    );
  }, [dt, launchAngleDeg, launchAzimuthDeg, launchSpeed, simulation]);

  const {
    pressedControls,
    pressMissionControl,
    releaseMissionControl,
    resetSimulation,
    toggleRunning,
  } = useMissionControls({
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
  });

  useEffect(() => {
    if (!launchConfigInitializedRef.current) {
      launchConfigInitializedRef.current = true;
      return;
    }

    runningRef.current = false;
    simulation.reset();
    setRunning(false);
    setTelemetry(simulation.getTelemetry());
    setStatus(RESTAGED_STATUS);
  }, [launchAngleDeg, launchAzimuthDeg, launchSpeed, simulation]);

  function setDt(value: number) {
    const nextDt = clampDt(value);
    dtRef.current = nextDt;
    setDtState(nextDt);
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
