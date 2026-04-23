import { useRef } from "react";
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
    requestSceneRender,
  } = useMissionScene({
    mountRef,
    simulation,
    running,
    setRunning,
    setStatus,
    setTelemetry,
    runningRef,
    maneuverInputRef,
    launchSpeed,
    launchAngleDeg,
    launchAzimuthDeg,
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

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#02060d] text-slate-100">
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
          requestSceneRender();
          focusScene();
        }}
        onReset={() => {
          resetSimulation();
          requestSceneRender();
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
        className="h-full w-full focus:outline-none"
      />
    </div>
  );
}
