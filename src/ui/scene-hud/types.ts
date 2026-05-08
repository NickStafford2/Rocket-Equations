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
  earthLodDebug: string;
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
  timeWarp: number;
  showTrail: boolean;
  showPrediction: boolean;
  showThrustDirectionArrow: boolean;
  showMoonLandingArrow: boolean;
  preventMoonCameraIntersection: boolean;
  pressedControls: Record<MissionControlKey, boolean>;
  onOverview: () => void;
  onLockTarget: (target: CameraTarget) => void;
  onLookAtTarget: (target: CameraTarget) => void;
  onToggleRunning: () => void;
  onReset: () => void;
  onLaunchSpeedChange: (value: number) => void;
  onLaunchAngleChange: (value: number) => void;
  onLaunchAzimuthChange: (value: number) => void;
  onTimeWarpChange: (value: number) => void;
  onShowTrailChange: (value: boolean) => void;
  onShowPredictionChange: (value: boolean) => void;
  onShowMoonLandingArrowChange: (value: boolean) => void;
  onPreventMoonCameraIntersectionChange: (value: boolean) => void;
  onToggleThrustDirectionArrow: () => void;
  onMissionControlPress: (control: MissionControlKey) => void;
  onMissionControlRelease: (control: MissionControlKey) => void;
};
