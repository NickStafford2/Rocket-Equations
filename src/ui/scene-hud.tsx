import { useState } from "react";
import { formatDt } from "../mission";
import type { CameraTarget } from "../mission";
import { MissionTelemetryPanel } from "./mission-panels";

type CameraDebugProps = {
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

type SceneHudProps = {
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
};

const baseButtonClassName =
  "rounded-xl border px-3 py-2 text-sm font-medium backdrop-blur transition-colors";

const defaultButtonClassName =
  "border-white/35 bg-white/8 text-white/90 hover:bg-white/12";

const selectedButtonClassName =
  "border-cyan-100/75 bg-cyan-300/20 text-cyan-50 shadow-[0_0_0_1px_rgba(207,250,254,0.18)_inset]";

function getButtonClassName(isSelected: boolean): string {
  return `${baseButtonClassName} ${
    isSelected ? selectedButtonClassName : defaultButtonClassName
  }`;
}

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
}: SceneHudProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="pointer-events-auto absolute inset-x-5 overflow-x-auto">
        <MissionTelemetryPanel
          elapsedMissionTime={elapsedMissionTime}
          currentSpeed={currentSpeed}
          moonRelativeSpeed={moonRelativeSpeed}
          earthAltitude={earthAltitude}
          moonAltitude={moonAltitude}
          status={status}
        />
      </div>

      <div className="absolute bottom-5 left-5 flex flex-col gap-3">
        <div className="pointer-events-none min-w-[210px] rounded-2xl border border-white/12 bg-[#07111f]/55 px-3 py-2 text-[0.68rem] tracking-[0.08em] text-slate-200 shadow-[0_18px_44px_rgba(0,0,0,0.28)] backdrop-blur-md">
          <div className="text-[0.6rem] font-semibold uppercase text-slate-400">
            Camera
          </div>
          <div className="mt-1 font-medium text-cyan-100">{cameraDebug.mode}</div>
          <div className="mt-1 font-mono text-slate-300">
            cam {cameraDebug.position.x}, {cameraDebug.position.y},{" "}
            {cameraDebug.position.z}
          </div>
          <div className="mt-1 font-mono text-slate-400">
            tgt {cameraDebug.target.x}, {cameraDebug.target.y},{" "}
            {cameraDebug.target.z}
          </div>
        </div>

        <div className="pointer-events-auto flex items-end gap-3 rounded-[1.4rem] border border-white/12 bg-[#07111f]/35 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-md">
          <div className="flex flex-col gap-2">
            <div className="px-1 text-[0.65rem] font-semibold tracking-[0.2em] text-slate-300 uppercase">
              Camera
            </div>
            <button
              type="button"
              className={getButtonClassName(isOverviewActive)}
              onClick={onOverview}
            >
              Overview
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="px-1 text-[0.65rem] font-semibold tracking-[0.2em] text-slate-300 uppercase">
              Lock On
            </div>
            <button
              type="button"
              className={getButtonClassName(currentLockTarget === "earth")}
              onClick={() => onLockTarget("earth")}
            >
              Earth
            </button>
            <button
              type="button"
              className={getButtonClassName(currentLockTarget === "moon")}
              onClick={() => onLockTarget("moon")}
            >
              Moon
            </button>
            <button
              type="button"
              className={getButtonClassName(currentLockTarget === "rocket")}
              onClick={() => onLockTarget("rocket")}
            >
              Rocket
            </button>
            <button
              type="button"
              className={getButtonClassName(currentLockTarget === "sun")}
              onClick={() => onLockTarget("sun")}
            >
              Sun
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="px-1 text-[0.65rem] font-semibold tracking-[0.2em] text-slate-300 uppercase">
              Look At
            </div>
            <button
              type="button"
              className={getButtonClassName(currentLookTarget === "earth")}
              onClick={() => onLookAtTarget("earth")}
            >
              Earth
            </button>
            <button
              type="button"
              className={getButtonClassName(currentLookTarget === "moon")}
              onClick={() => onLookAtTarget("moon")}
            >
              Moon
            </button>
            <button
              type="button"
              className={getButtonClassName(currentLookTarget === "rocket")}
              onClick={() => onLookAtTarget("rocket")}
            >
              Rocket
            </button>
            <button
              type="button"
              className={getButtonClassName(currentLookTarget === "sun")}
              onClick={() => onLookAtTarget("sun")}
            >
              Sun
            </button>
          </div>
        </div>

        <div className="pointer-events-auto min-w-[210px] rounded-[1.4rem] border border-white/12 bg-[#07111f]/35 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-md">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/6 px-3 py-2 text-left text-sm font-medium text-slate-100 transition-colors hover:bg-white/10"
            onClick={() => setSettingsOpen((current) => !current)}
          >
            <span className="tracking-[0.18em] uppercase text-slate-300">
              Settings
            </span>
            <span className="text-xs text-cyan-100">
              {settingsOpen ? "Hide" : "Show"}
            </span>
          </button>

          {settingsOpen ? (
            <div className="mt-3 max-h-[55vh] min-w-[280px] space-y-3 overflow-y-auto pr-1">
              <CompactSlider
                label="Launch speed"
                description="Initial launch impulse at staging."
                valueLabel={`${launchSpeed.toLocaleString()} m/s`}
                min={8800}
                max={12100}
                step={5}
                value={launchSpeed}
                onChange={onLaunchSpeedChange}
              />
              <CompactSlider
                label="Launch azimuth"
                description="Rotates the launch point around Earth's equator."
                valueLabel={`${launchAzimuthDeg.toFixed(0)}°`}
                min={0}
                max={360}
                step={1}
                value={launchAzimuthDeg}
                onChange={onLaunchAzimuthChange}
              />
              <CompactSlider
                label="Flight path angle"
                description="0 degrees follows the local tangent, 90 points away from Earth, and 180 reverses along the tangent."
                valueLabel={`${launchAngleDeg.toFixed(1)}°`}
                min={0}
                max={180}
                step={1}
                value={launchAngleDeg}
                onChange={onLaunchAngleChange}
              />
              <CompactSlider
                label="Time step"
                description="Smaller steps improve control precision; larger steps speed up long coasts."
                valueLabel={`${formatDt(dt)} s`}
                min={0.1}
                max={1000}
                step={0.1}
                value={dt}
                onChange={onDtChange}
              />
              <CompactCheckbox
                label="Show trail"
                description="Keeps the rocket path visible."
                checked={showTrail}
                onChange={onShowTrailChange}
              />
              <CompactCheckbox
                label="Show thrust arrow"
                description="Displays the rocket heading vector in the scene."
                checked={showThrustDirectionArrow}
                onChange={() => onToggleThrustDirectionArrow()}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="absolute inset-x-5 bottom-5 flex justify-center">
        <div className="pointer-events-auto flex items-center justify-center gap-2 rounded-[1.4rem] border border-white/12 bg-[#07111f]/35 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-md">
          <button
            type="button"
            className={getButtonClassName(running)}
            onClick={onToggleRunning}
          >
            {running ? "Pause" : "Start"}
          </button>
          <button
            type="button"
            className={getButtonClassName(false)}
            onClick={onReset}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

type CompactSliderProps = {
  label: string;
  description: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
};

function CompactSlider({
  label,
  description,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
}: CompactSliderProps) {
  return (
    <label className="block rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-3 text-[0.72rem] text-slate-200">
        <SettingLabel label={label} description={description} />
        <span className="text-cyan-100">{valueLabel}</span>
      </div>
      <input
        className="block w-full accent-cyan-300"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

type CompactCheckboxProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

function CompactCheckbox({
  label,
  description,
  checked,
  onChange,
}: CompactCheckboxProps) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-slate-200">
      <SettingLabel label={label} description={description} />
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

type SettingLabelProps = {
  label: string;
  description: string;
};

function SettingLabel({ label, description }: SettingLabelProps) {
  return (
    <span className="flex items-center gap-2">
      <span>{label}</span>
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/12 bg-white/8 text-[0.6rem] font-semibold text-slate-300"
        title={description}
        aria-label={description}
      >
        ?
      </span>
    </span>
  );
}
