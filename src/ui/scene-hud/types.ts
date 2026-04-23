import type { CameraTarget } from "../../mission";
import type { MissionControlKey } from "../../use-mission-simulation";

export type CameraDebugProps = {
  mode: string;
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

export type SceneHudProps = {
  isOverviewActive: boolean;
  currentLockTarget: CameraTarget | null;
  currentLookTarget: CameraTarget | null;
  cameraDebug: CameraDebugProps;
  running: boolean;
  elapsedMissionTime: string;
  currentSpeed: string;
  moonRelativeSpeed: string;
  earthAltitude: string;
  moonAltitude: string;
  status: string;
  launchSpeed: number;
  launchAngleDeg: number;
  launchAzimuthDeg: number;
  dt: number;
  showTrail: boolean;
  showThrustDirectionArrow: boolean;
  pressedControls: Record<MissionControlKey, boolean>;
  onOverview: () => void;
  onLockTarget: (target: CameraTarget) => void;
  onLookAtTarget: (target: CameraTarget) => void;
  onToggleRunning: () => void;
  onReset: () => void;
  onLaunchSpeedChange: (value: number) => void;
  onLaunchAngleChange: (value: number) => void;
  onLaunchAzimuthChange: (value: number) => void;
  onDtChange: (value: number) => void;
  onShowTrailChange: (value: boolean) => void;
  onToggleThrustDirectionArrow: () => void;
  onMissionControlPress: (control: MissionControlKey) => void;
  onMissionControlRelease: (control: MissionControlKey) => void;
};

export type TelemetryOverlayProps = Pick<
  SceneHudProps,
  | "elapsedMissionTime"
  | "currentSpeed"
  | "moonRelativeSpeed"
  | "earthAltitude"
  | "moonAltitude"
  | "status"
>;

export type ControlPadProps = Pick<
  SceneHudProps,
  | "running"
  | "pressedControls"
  | "onToggleRunning"
  | "onReset"
  | "onMissionControlPress"
  | "onMissionControlRelease"
>;

export type MissionControlsProps = Pick<
  ControlPadProps,
  "running" | "onToggleRunning" | "onReset"
>;

export type SettingsPanelProps = Pick<
  SceneHudProps,
  | "launchSpeed"
  | "launchAngleDeg"
  | "launchAzimuthDeg"
  | "dt"
  | "showTrail"
  | "showThrustDirectionArrow"
  | "onLaunchSpeedChange"
  | "onLaunchAngleChange"
  | "onLaunchAzimuthChange"
  | "onDtChange"
  | "onShowTrailChange"
  | "onToggleThrustDirectionArrow"
>;

export type CameraSelectionPanelProps = Pick<
  SceneHudProps,
  | "isOverviewActive"
  | "currentLockTarget"
  | "currentLookTarget"
  | "onOverview"
  | "onLockTarget"
  | "onLookAtTarget"
  | "cameraDebug"
>;
