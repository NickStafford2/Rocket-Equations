import { useRef } from "react";
import {
  EARTH_MOON_DISTANCE,
  R_EARTH,
  R_MOON,
  SOFT_LANDING_SPEED,
} from "./physics/bodies";
import {
  formatDistance,
  formatElapsed,
  formatRelativeSpeed,
  formatSpeed,
} from "./mission";
import { useMissionScene } from "./use-mission-scene";
import {
  type MissionControlKey,
  useMissionSimulation,
} from "./use-mission-simulation";
import { MissionOverview } from "./ui/scene-hud/MissionOverview";
import { SceneHud } from "./ui/scene-hud";

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const {
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
  } = useMissionSimulation();
  const {
    isOverviewActive,
    currentLockTarget,
    currentLookTarget,
    cameraDebug,
    applyOverviewCamera,
    applyLockTarget,
    applyLookAtTarget,
  } = useMissionScene({
    mountRef,
    simulation,
    setRunning,
    setStatus,
    setTelemetry,
    runningRef,
    maneuverInputRef,
    launchSpeedRef,
    launchAngleRef,
    launchAzimuthRef,
    showTrail,
    showThrustDirectionArrow,
  });

  function focusScene() {
    mountRef.current?.focus({ preventScroll: true });
  }

  function handleMissionControlPress(control: MissionControlKey) {
    pressMissionControl(control);
    focusScene();
  }

  function handleMissionControlRelease(control: MissionControlKey) {
    releaseMissionControl(control);
  }

  const currentAltitudeEarth = Math.max(telemetry.altitudeEarth, 0);
  const currentAltitudeMoon = Math.max(telemetry.altitudeMoon, 0);
  const lunarTransferGap = Math.max(
    EARTH_MOON_DISTANCE - R_EARTH - R_MOON - currentAltitudeEarth,
    0,
  );

  return (
    <div className="min-h-screen overflow-hidden bg-[#02060d] text-slate-100">
      <div className="relative mx-auto max-w-[1600px] px-4 pb-4 md:px-6 lg:px-8 lg:py-6">
        <MissionOverview
          landingTargetSpeed={formatRelativeSpeed(SOFT_LANDING_SPEED)}
        />

        <div className="relative h-fit overflow-hidden rounded-[2.25rem] border border-red-400 bg-[#030914]/78 shadow-[0_40px_100px_rgba(0,0,0,0.45)]">
          <SceneHud
            isOverviewActive={isOverviewActive}
            currentLockTarget={currentLockTarget}
            currentLookTarget={currentLookTarget}
            cameraDebug={cameraDebug}
            running={running}
            elapsedMissionTime={formatElapsed(telemetry.hours)}
            currentSpeed={formatSpeed(telemetry.speed)}
            moonRelativeSpeed={formatRelativeSpeed(telemetry.relativeMoonSpeed)}
            earthAltitude={formatDistance(currentAltitudeEarth)}
            moonAltitude={formatDistance(currentAltitudeMoon)}
            status={status}
            launchSpeed={launchSpeed}
            launchAngleDeg={launchAngleDeg}
            launchAzimuthDeg={launchAzimuthDeg}
            dt={dt}
            showTrail={showTrail}
            showThrustDirectionArrow={showThrustDirectionArrow}
            pressedControls={pressedControls}
            onOverview={() => {
              applyOverviewCamera();
              focusScene();
            }}
            onLockTarget={(target) => {
              applyLockTarget(target);
              focusScene();
            }}
            onLookAtTarget={(target) => {
              applyLookAtTarget(target);
              focusScene();
            }}
            onToggleRunning={() => {
              toggleRunning();
              focusScene();
            }}
            onReset={() => {
              resetSimulation();
              focusScene();
            }}
            onLaunchSpeedChange={setLaunchSpeed}
            onLaunchAngleChange={setLaunchAngleDeg}
            onLaunchAzimuthChange={setLaunchAzimuthDeg}
            onDtChange={setDt}
            onShowTrailChange={setShowTrail}
            onToggleThrustDirectionArrow={() => {
              setShowThrustDirectionArrow((current) => !current);
              focusScene();
            }}
            onMissionControlPress={handleMissionControlPress}
            onMissionControlRelease={handleMissionControlRelease}
          />

          <div
            ref={mountRef}
            tabIndex={0}
            className="h-[min(78vh,860px)] min-h-[620px] w-full focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
