import { memo, useState } from "react";
import { formatDt } from "../../mission";
import { HoverHelp } from "../hover-help";
import type { SceneHudProps } from "./types";

type SettingsPanelProps = Pick<
  SceneHudProps,
  | "launchSpeed"
  | "launchAngleDeg"
  | "launchAzimuthDeg"
  | "dt"
  | "showTrail"
  | "showPrediction"
  | "showThrustDirectionArrow"
  | "onLaunchSpeedChange"
  | "onLaunchAngleChange"
  | "onLaunchAzimuthChange"
  | "onDtChange"
  | "onShowTrailChange"
  | "onShowPredictionChange"
  | "onToggleThrustDirectionArrow"
>;

export const SettingsPanel = memo(function SettingsPanel({
  launchSpeed,
  launchAngleDeg,
  launchAzimuthDeg,
  dt,
  showTrail,
  showPrediction,
  showThrustDirectionArrow,
  onLaunchSpeedChange,
  onLaunchAngleChange,
  onLaunchAzimuthChange,
  onDtChange,
  onShowTrailChange,
  onShowPredictionChange,
  onToggleThrustDirectionArrow,
}: SettingsPanelProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="pointer-events-auto min-w-[210px] max-w-[320px] overflow-hidden rounded-[1.4rem] border border-white/12 bg-[#07111f]/35 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-md">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/6 px-3 py-2 text-left text-sm font-medium text-slate-100 transition-colors hover:bg-white/10"
        onClick={() => setSettingsOpen((current) => !current)}
      >
        <span className="tracking-[0.18em] text-slate-300 uppercase">
          Settings
        </span>
        <span className="text-xs text-cyan-100">
          {settingsOpen ? "Hide" : "Show"}
        </span>
      </button>

      {settingsOpen ? (
        <div className="mt-3 max-h-[40vh] min-w-0 space-y-3 overflow-y-auto pr-1">
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
            valueLabel={formatTimeStepLabel(dt)}
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
            label="Show prediction"
            description="Displays the projected coasting path using Earth and Moon patched conics."
            checked={showPrediction}
            onChange={onShowPredictionChange}
          />
          <CompactCheckbox
            label="Show thrust arrow"
            description="Displays the rocket heading vector in the scene."
            checked={showThrustDirectionArrow}
            onChange={onToggleThrustDirectionArrow}
          />
        </div>
      ) : null}
    </div>
  );
});

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
        <LabelWithHelp label={label} description={description} />
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
      <LabelWithHelp label={label} description={description} />
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function LabelWithHelp({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <span>{label}</span>
      <HoverHelp description={description} />
    </span>
  );
}

function formatTimeStepLabel(dt: number) {
  return `${formatDt(dt)} s`;
}
