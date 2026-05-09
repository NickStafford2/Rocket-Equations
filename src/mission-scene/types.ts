import type { MutableRefObject, RefObject } from "react";
import type { ManeuverInput } from "../physics/bodies";
import type { CameraTarget } from "../mission";
import type {
  RenderSpaceAnchor,
  RenderSpaceMode,
  RenderSpaceProjection,
} from "../render-space/frame";
import type { EarthMoonSimulation, SimulationTelemetry } from "../sim/simulation";

export type UseMissionSceneParams = {
  mountRef: RefObject<HTMLDivElement | null>;
  simulation: EarthMoonSimulation;
  running: boolean;
  setRunning: (value: boolean) => void;
  setStatus: (value: string) => void;
  setTelemetry: (value: SimulationTelemetry) => void;
  runningRef: MutableRefObject<boolean>;
  maneuverInputRef: MutableRefObject<ManeuverInput>;
  launchSpeed: number;
  launchAngleDeg: number;
  launchAzimuthDeg: number;
  launchSpeedRef: MutableRefObject<number>;
  launchAngleRef: MutableRefObject<number>;
  launchAzimuthRef: MutableRefObject<number>;
  showTrail: boolean;
  showPrediction: boolean;
  showThrustDirectionArrow: boolean;
  showMoonLandingArrow: boolean;
  preventMoonCameraIntersection: boolean;
};

export type CameraSelection = {
  isOverviewActive: boolean;
  lockTarget: CameraTarget | null;
  lookTarget: CameraTarget | null;
};

export type CameraDebugState = {
  mode: string;
  renderSpaceMode: RenderSpaceMode;
  renderSpaceAnchor: RenderSpaceAnchor;
  renderSpaceProjection: RenderSpaceProjection;
  renderOrigin: {
    x: string;
    y: string;
    z: string;
  };
  position: {
    x: string;
    y: string;
    z: string;
  };
  target: {
    x: string;
    y: string;
    z: string;
  };
};
