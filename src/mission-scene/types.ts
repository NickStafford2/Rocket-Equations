import type { MutableRefObject, RefObject } from "react";
import type { ManeuverInput } from "../physics/bodies";
import type { CameraTarget } from "../mission";
import type { EarthMoonSimulation, SimulationTelemetry } from "../sim/simulation";
import type { CameraRigDebugSnapshot } from "../three/camera-rig";

export type UseMissionSceneParams = {
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
  showThrustDirectionArrow: boolean;
};

export type CameraSelection = {
  isOverviewActive: boolean;
  lockTarget: CameraTarget | null;
  lookTarget: CameraTarget | null;
};

export type CameraDebugState = CameraRigDebugSnapshot;
