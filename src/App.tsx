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
import { useMissionSimulation } from "./use-mission-simulation";
import { Controls } from "./ui/controls";
import { MissionKeyboardHelp, MissionOverview } from "./ui/mission-panels";
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

  const currentAltitudeEarth = Math.max(telemetry.altitudeEarth, 0);
  const currentAltitudeMoon = Math.max(telemetry.altitudeMoon, 0);
  const lunarTransferGap = Math.max(
    EARTH_MOON_DISTANCE - R_EARTH - R_MOON - currentAltitudeEarth,
    0,
  );

  return (
    <div className="min-h-screen overflow-hidden bg-[#02060d] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(79,172,255,0.18),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(255,185,107,0.14),_transparent_28%),linear-gradient(180deg,_rgba(2,6,13,0.94),_rgba(3,9,18,0.98))]" />
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:72px_72px] opacity-40" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-4 py-4 md:px-6 lg:px-8 lg:py-6">
        <MissionOverview
          lunarTransferGap={formatDistance(lunarTransferGap)}
          landingTargetSpeed={formatRelativeSpeed(SOFT_LANDING_SPEED)}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="space-y-5">
            <Controls
              launchSpeed={launchSpeed}
              launchAngleDeg={launchAngleDeg}
              launchAzimuthDeg={launchAzimuthDeg}
              dt={dt}
              showTrail={showTrail}
              onLaunchSpeedChange={setLaunchSpeed}
              onLaunchAngleChange={setLaunchAngleDeg}
              onLaunchAzimuthChange={setLaunchAzimuthDeg}
              onDtChange={setDt}
              onShowTrailChange={setShowTrail}
            />

            <MissionKeyboardHelp />
          </div>

          <div className="relative h-fit overflow-hidden rounded-[2.25rem] border border-red-400 bg-[#030914]/78 shadow-[0_40px_100px_rgba(0,0,0,0.45)]">
            <SceneHud
              isOverviewActive={isOverviewActive}
              currentLockTarget={currentLockTarget}
              currentLookTarget={currentLookTarget}
              cameraDebug={cameraDebug}
              running={running}
              elapsedMissionTime={formatElapsed(telemetry.hours)}
              currentSpeed={formatSpeed(telemetry.speed)}
              moonRelativeSpeed={formatRelativeSpeed(
                telemetry.relativeMoonSpeed,
              )}
              earthAltitude={formatDistance(currentAltitudeEarth)}
              moonAltitude={formatDistance(currentAltitudeMoon)}
              status={status}
              showThrustDirectionArrow={showThrustDirectionArrow}
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
              onToggleThrustDirectionArrow={() => {
                setShowThrustDirectionArrow((current) => !current);
                focusScene();
              }}
            />

            <div
              ref={mountRef}
              tabIndex={0}
              className="h-[min(78vh,860px)] min-h-[620px] w-full focus:outline-none"
            />
          </div>
        </div>

        <div className="inset-x-0 top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 bg-gradient-to-b from-[#040b16]/95 to-transparent px-5 py-4 text-xs tracking-[0.22em] text-slate-300 uppercase">
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-cyan-100">
              Scene View
            </span>
            <span>Orbit view with Y-up orbital plane</span>
          </div>
          <div className="flex flex-wrap gap-2 text-[0.68rem]">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Drag to rotate
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Wheel to zoom
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Right-drag to pan
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Up/Space thrust
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              WASD time warp
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
