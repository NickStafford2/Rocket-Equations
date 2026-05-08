import { useEffect, useMemo, useRef, useState } from "react";
import type { ManeuverInput } from "./physics/bodies";
import { EarthMoonSimulation } from "./sim/simulation";
import { clampTimeWarp } from "./mission";
import { createSimulationConfig } from "./mission-simulation/config";

import {
  ROCKET_DEFAULT_ANGLE_DEG,
  DEFAULT_TIME_WARP,
  ROCKET_DEFAULT_LAUNCH_AZIMUTH_DEG,
  ROCKET_DEFAULT_SPEED,
} from "./physics/bodies";
import {
  INITIAL_MISSION_STATUS,
  RESTAGED_STATUS,
} from "./mission-simulation/status";
import { useMissionControls } from "./mission-simulation/use-mission-controls";

export type { MissionControlKey } from "./mission-simulation/types";

export function useMissionSimulation() {
  const runningRef = useRef(false);
  const launchSpeedRef = useRef(ROCKET_DEFAULT_SPEED);
  const launchAngleRef = useRef(ROCKET_DEFAULT_ANGLE_DEG);
  const launchAzimuthRef = useRef(ROCKET_DEFAULT_LAUNCH_AZIMUTH_DEG);
  const timeWarpRef = useRef(DEFAULT_TIME_WARP);
  const launchConfigInitializedRef = useRef(false);
  const maneuverInputRef = useRef<ManeuverInput>({
    thrusting: false,
    turn: 0,
  });

  const simulation = useMemo(
    () =>
      new EarthMoonSimulation(
        createSimulationConfig({
          launchSpeed: ROCKET_DEFAULT_SPEED,
          launchAngleDeg: ROCKET_DEFAULT_ANGLE_DEG,
          launchAzimuthDeg: ROCKET_DEFAULT_LAUNCH_AZIMUTH_DEG,
          timeWarp: DEFAULT_TIME_WARP,
        }),
      ),
    [],
  );

  const [running, setRunning] = useState(false);
  const [launchSpeed, setLaunchSpeed] = useState(ROCKET_DEFAULT_SPEED);
  const [launchAngleDeg, setLaunchAngleDeg] = useState(
    ROCKET_DEFAULT_ANGLE_DEG,
  );
  const [launchAzimuthDeg, setLaunchAzimuthDeg] = useState(
    ROCKET_DEFAULT_LAUNCH_AZIMUTH_DEG,
  );
  const [timeWarp, setTimeWarp] = useState(DEFAULT_TIME_WARP);
  const [showTrail, setShowTrail] = useState(true);
  const [showPrediction, setShowPrediction] = useState(true);
  const [showThrustDirectionArrow, setShowThrustDirectionArrow] =
    useState(true);
  const [showMoonLandingArrow, setShowMoonLandingArrow] = useState(true);
  const [preventMoonCameraIntersection, setPreventMoonCameraIntersection] =
    useState(true);
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
    timeWarpRef.current = timeWarp;
  }, [timeWarp]);

  useEffect(() => {
    simulation.setConfig(
      createSimulationConfig({
        launchSpeed,
        launchAngleDeg,
        launchAzimuthDeg,
        timeWarp: timeWarp,
      }),
    );
  }, [timeWarp, launchAngleDeg, launchAzimuthDeg, launchSpeed, simulation]);

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
    timeWarpRef: timeWarpRef,
    setRunning,
    setStatus,
    setTelemetry,
    setTimeWarpState: setTimeWarp,
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

  function setTimeWarpState(value: number) {
    const nextTimeWarp = clampTimeWarp(value);
    timeWarpRef.current = nextTimeWarp;
    setTimeWarp(nextTimeWarp);
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
    timeWarp: timeWarp,
    setTimeWarp: setTimeWarpState,
    showTrail,
    setShowTrail,
    showPrediction,
    setShowPrediction,
    showThrustDirectionArrow,
    setShowThrustDirectionArrow,
    showMoonLandingArrow,
    setShowMoonLandingArrow,
    preventMoonCameraIntersection,
    setPreventMoonCameraIntersection,
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
