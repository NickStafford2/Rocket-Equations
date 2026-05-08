import { MissionTelemetryPanel } from "./mission-panels";
import { CameraSelectionPanel } from "./scene-hud/CameraSelectionPanel";
import { ControlPad } from "./scene-hud/ControlPad";
import { MissionOverview } from "./scene-hud/MissionOverview";
import { SettingsPanel } from "./scene-hud/SettingsPanel";
import type { SceneHudProps } from "./scene-hud/types";

export function SceneHud({
  isOverviewActive,
  currentLockTarget,
  currentLookTarget,
  cameraDebug,
  earthLodDebug,
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
  timeWarp: timeWarp,
  showTrail,
  showPrediction,
  showThrustDirectionArrow,
  showMoonLandingArrow,
  pressedControls,
  onOverview,
  onLockTarget,
  onLookAtTarget,
  onToggleRunning,
  onReset,
  onLaunchSpeedChange,
  onLaunchAngleChange,
  onLaunchAzimuthChange,
  onTimeWarpChange: onTimeWarpChange,
  onShowTrailChange,
  onShowPredictionChange,
  onShowMoonLandingArrowChange,
  onToggleThrustDirectionArrow,
  onMissionControlPress,
  onMissionControlRelease,
}: SceneHudProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex h-full w-full shrink-0 grow-0 flex-col justify-between overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col items-end gap-3 overflow-hidden">
        <MissionOverview />
        <div className="flex min-h-0 w-full flex-1 flex-row justify-between">
          <MissionTelemetryPanel
            elapsedMissionTime={elapsedMissionTime}
            currentSpeed={currentSpeed}
            moonRelativeSpeed={moonRelativeSpeed}
            earthAltitude={earthAltitude}
            moonAltitude={moonAltitude}
            status={status}
          />
          <div className="flex min-h-0 shrink-0 flex-col overflow-hidden">
            <SettingsPanel
              launchSpeed={launchSpeed}
              launchAngleDeg={launchAngleDeg}
              launchAzimuthDeg={launchAzimuthDeg}
              timeWarp={timeWarp}
              showTrail={showTrail}
              showPrediction={showPrediction}
              showThrustDirectionArrow={showThrustDirectionArrow}
              showMoonLandingArrow={showMoonLandingArrow}
              onLaunchSpeedChange={onLaunchSpeedChange}
              onLaunchAngleChange={onLaunchAngleChange}
              onLaunchAzimuthChange={onLaunchAzimuthChange}
              onTimeWarpChange={onTimeWarpChange}
              onShowTrailChange={onShowTrailChange}
              onShowPredictionChange={onShowPredictionChange}
              onShowMoonLandingArrowChange={onShowMoonLandingArrowChange}
              onToggleThrustDirectionArrow={onToggleThrustDirectionArrow}
            />
            <div className="pointer-events-none mt-3 min-w-[210px] rounded-[1.2rem] border border-white/12 bg-[#07111f]/28 px-3 py-2.5 text-xs text-slate-300 shadow-[0_16px_40px_rgba(0,0,0,0.2)] backdrop-blur-md">
              <div className="tracking-[0.18em] text-[0.68rem] text-slate-400 uppercase">
                Earth LOD
              </div>
              <div className="mt-1 text-sm font-medium text-cyan-100">
                {earthLodDebug}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-row items-end gap-3">
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
