import { CameraSelectionPanel } from "./scene-hud/CameraSelectionPanel";
import { ControlPad } from "./scene-hud/ControlPad";
import { SettingsPanel } from "./scene-hud/SettingsPanel";
import { SoundtrackPanel } from "./scene-hud/SoundtrackPanel";
import { TelemetryOverlay } from "./scene-hud/TelemetryOverlay";
import type { SceneHudProps } from "./scene-hud/types";

export function SceneHud({
  isOverviewActive,
  currentLockTarget,
  currentLookTarget,
  cameraDebug,
  running,
  elapsedMissionTime,
  currentSpeed,
  moonRelativeSpeed,
  earthAltitude,
  moonAltitude,
  status,
  launchSpeed,
  launchAngleDeg,
  launchAzimuthDeg,
  dt,
  showTrail,
  showThrustDirectionArrow,
  pressedControls,
  onOverview,
  onLockTarget,
  onLookAtTarget,
  onToggleRunning,
  onReset,
  onLaunchSpeedChange,
  onLaunchAngleChange,
  onLaunchAzimuthChange,
  onDtChange,
  onShowTrailChange,
  onToggleThrustDirectionArrow,
  onMissionControlPress,
  onMissionControlRelease,
}: SceneHudProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between">
      <TelemetryOverlay
        elapsedMissionTime={elapsedMissionTime}
        currentSpeed={currentSpeed}
        moonRelativeSpeed={moonRelativeSpeed}
        earthAltitude={earthAltitude}
        moonAltitude={moonAltitude}
        status={status}
      />

      <div className="flex flex-col items-end gap-3">
        <SoundtrackPanel />

        <SettingsPanel
          launchSpeed={launchSpeed}
          launchAngleDeg={launchAngleDeg}
          launchAzimuthDeg={launchAzimuthDeg}
          dt={dt}
          showTrail={showTrail}
          showThrustDirectionArrow={showThrustDirectionArrow}
          onLaunchSpeedChange={onLaunchSpeedChange}
          onLaunchAngleChange={onLaunchAngleChange}
          onLaunchAzimuthChange={onLaunchAzimuthChange}
          onDtChange={onDtChange}
          onShowTrailChange={onShowTrailChange}
          onToggleThrustDirectionArrow={onToggleThrustDirectionArrow}
        />
      </div>

      <div className="flex flex-row gap-3">
        <CameraSelectionPanel
          isOverviewActive={isOverviewActive}
          currentLockTarget={currentLockTarget}
          currentLookTarget={currentLookTarget}
          onOverview={onOverview}
          onLockTarget={onLockTarget}
          cameraDebug={cameraDebug}
          onLookAtTarget={onLookAtTarget}
        />

        <ControlPad
          running={running}
          pressedControls={pressedControls}
          onToggleRunning={onToggleRunning}
          onReset={onReset}
          onMissionControlPress={onMissionControlPress}
          onMissionControlRelease={onMissionControlRelease}
        />
      </div>
    </div>
  );
}
