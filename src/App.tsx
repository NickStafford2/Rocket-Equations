import { useRef, useState } from "react";
import {
  formatDistance,
  formatElapsed,
  formatRelativeSpeed,
  formatSpeed,
} from "./mission";
import type { ThreeSceneBundle } from "./three/scene";
import { MissionSceneCanvas } from "./three/scene-host";
import { useMissionScene } from "./use-mission-scene";
import {
  type MissionControlKey,
  useMissionSimulation,
} from "./use-mission-simulation";
import { SceneHud } from "./ui/scene-hud";
import { TakramAtmospherePrototype } from "./three/takram/TakramAtmospherePrototyp3";

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [sceneBundle, setSceneBundle] = useState<ThreeSceneBundle | null>(null);
  const [sceneMode, setSceneMode] = useState<"mission" | "takram">("mission");
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
    timeWarp: timeWarp,
    setTimeWarp: setTimeWarp,
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
  } = useMissionSimulation();
  const {
    isOverviewActive,
    currentLockTarget,
    currentLookTarget,
    cameraDebug,
    earthLodDebug,
    applyOverviewCamera,
    applyLockTarget,
    applyLookAtTarget,
    requestSceneRender,
  } = useMissionScene({
    mountRef,
    bundle: sceneBundle,
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
    showPrediction,
    showThrustDirectionArrow,
    showMoonLandingArrow,
    preventMoonCameraIntersection,
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
    <div className="relative h-screen w-screen overflow-hidden bg-[#02060d] text-slate-100">
      <div
        ref={mountRef}
        tabIndex={0}
        className="h-full w-full focus:outline-none"
      >
        {sceneMode === "mission" ? (
          <MissionSceneCanvas
            className="h-full w-full"
            onBundleChange={setSceneBundle}
          />
        ) : (
          <TakramAtmospherePrototype className="h-full w-full" />
        )}
      </div>
      <div className="absolute top-4 left-4 z-30 flex gap-2">
        <button
          type="button"
          className="rounded bg-slate-900/80 px-3 py-2 text-sm text-white"
          onClick={() =>
            setSceneMode((current) =>
              current === "mission" ? "takram" : "mission",
            )
          }
        >
          {sceneMode === "mission" ? "Test Takram" : "Back to Mission"}
        </button>
      </div>
      {sceneMode === "mission" && (
        <SceneHud
          isOverviewActive={isOverviewActive}
          currentLockTarget={currentLockTarget}
          currentLookTarget={currentLookTarget}
          cameraDebug={cameraDebug}
          earthLodDebug={earthLodDebug}
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
          timeWarp={timeWarp}
          showTrail={showTrail}
          showPrediction={showPrediction}
          showThrustDirectionArrow={showThrustDirectionArrow}
          showMoonLandingArrow={showMoonLandingArrow}
          preventMoonCameraIntersection={preventMoonCameraIntersection}
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
          onTimeWarpChange={setTimeWarp}
          onShowTrailChange={setShowTrail}
          onShowPredictionChange={setShowPrediction}
          onShowMoonLandingArrowChange={setShowMoonLandingArrow}
          onPreventMoonCameraIntersectionChange={
            setPreventMoonCameraIntersection
          }
          onToggleThrustDirectionArrow={() => {
            setShowThrustDirectionArrow((current) => !current);
            focusScene();
          }}
          onMissionControlPress={handleMissionControlPress}
          onMissionControlRelease={handleMissionControlRelease}
        />
      )}
    </div>
  );
}
