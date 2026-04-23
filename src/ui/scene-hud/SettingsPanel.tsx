import { memo, useState } from "react";
import {
  CompactCheckbox,
  CompactSlider,
  formatTimeStepLabel,
} from "./shared";
import type { SettingsPanelProps } from "./types";

export const SettingsPanel = memo(function SettingsPanel({
  launchSpeed,
  launchAngleDeg,
  launchAzimuthDeg,
  dt,
  showTrail,
  showThrustDirectionArrow,
  onLaunchSpeedChange,
  onLaunchAngleChange,
  onLaunchAzimuthChange,
  onDtChange,
  onShowTrailChange,
  onToggleThrustDirectionArrow,
}: SettingsPanelProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
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
