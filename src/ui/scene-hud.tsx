import { memo, useState } from "react";
import { formatDt } from "../mission";
import type { CameraTarget } from "../mission";
import type { MissionControlKey } from "../use-mission-simulation";
import { HoverHelp } from "./hover-help";
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
  pressedControls: Record<MissionControlKey, boolean>;
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
  onMissionControlPress: (control: MissionControlKey) => void;
  onMissionControlRelease: (control: MissionControlKey) => void;
};

type ControlPadProps = Pick<
  SceneHudProps,
  | "running"
  | "pressedControls"
  | "onToggleRunning"
  | "onReset"
  | "onMissionControlPress"
  | "onMissionControlRelease"
>;

type SettingsPanelProps = Pick<
  SceneHudProps,
  | "launchSpeed"
  | "launchAngleDeg"
  | "launchAzimuthDeg"
  | "dt"
  | "showTrail"
  | "showThrustDirectionArrow"
  | "onLaunchSpeedChange"
  | "onLaunchAngleChange"
  | "onLaunchAzimuthChange"
  | "onDtChange"
  | "onShowTrailChange"
  | "onToggleThrustDirectionArrow"
>;

type CameraSelectionPanelProps = Pick<
  SceneHudProps,
  | "isOverviewActive"
  | "currentLockTarget"
  | "currentLookTarget"
  | "onOverview"
  | "onLockTarget"
  | "onLookAtTarget"
>;

type KeyboardKeyConfig = {
  control: MissionControlKey;
  label: string;
  caption: string;
  wide?: boolean;
};

type KeyboardClusterConfig = {
  label: string;
  description?: string;
  className?: string;
  rows: KeyboardKeyConfig[][];
};

const baseButtonClassName =
  "rounded-xl border px-3 py-2 text-sm font-medium backdrop-blur transition-colors";

const defaultButtonClassName =
  "border-white/35 bg-white/8 text-white/90 hover:bg-white/12";

const selectedButtonClassName =
  "border-cyan-100/75 bg-cyan-300/20 text-cyan-50 shadow-[0_0_0_1px_rgba(207,250,254,0.18)_inset]";

const CAMERA_TARGETS: CameraTarget[] = ["earth", "moon", "rocket", "sun"];

const CAMERA_CONTROL_PANEL_CLASS_NAME =
  "pointer-events-auto flex items-end gap-3 rounded-[1.4rem] border border-white/12 bg-[#07111f]/35 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-md";

const ARROW_CLUSTER: KeyboardClusterConfig = {
  label: "Arrow keys",
  description: "Left and Right rotate the ship. Up applies thrust while you hold it.",
  className: "min-w-[176px]",
  rows: [
    [{ control: "ArrowUp", label: "↑", caption: "Thrust" }],
    [
      { control: "ArrowLeft", label: "←", caption: "Left" },
      { control: "ArrowRight", label: "→", caption: "Right" },
    ],
  ],
};

const WASD_CLUSTER: KeyboardClusterConfig = {
  label: "WASD",
  description:
    "W multiplies delta t by 10, S divides it by 10, A trims it down by 2%, and D increases it by 2%.",
  className: "min-w-[232px]",
  rows: [
    [{ control: "KeyW", label: "W", caption: "x10" }],
    [
      { control: "KeyA", label: "A", caption: "-2%" },
      { control: "KeyS", label: "S", caption: "/10" },
      { control: "KeyD", label: "D", caption: "+2%" },
    ],
  ],
};

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

      <div className="absolute top-20 right-5 flex flex-col items-end gap-3">
        <SoundtrackPanel />
      </div>

      <div className="absolute bottom-5 left-5 flex flex-col gap-3">
        <CameraDebugPanel cameraDebug={cameraDebug} />
        <CameraSelectionPanel
          isOverviewActive={isOverviewActive}
          currentLockTarget={currentLockTarget}
          currentLookTarget={currentLookTarget}
          onOverview={onOverview}
          onLockTarget={onLockTarget}
          onLookAtTarget={onLookAtTarget}
        />
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

      <div className="absolute inset-x-5 bottom-5 flex justify-center">
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

const SoundtrackPanel = memo(function SoundtrackPanel() {
  const [soundtrackOpen, setSoundtrackOpen] = useState(false);
  const [soundtrackEnabled, setSoundtrackEnabled] = useState(false);
  const [soundtrackNonce, setSoundtrackNonce] = useState(0);
  const soundtrackPlaylistId = "PLAikqLA5ubJ5lr05z7kcKE5za7T8n1sG3";
  const soundtrackEmbedSrc = `https://www.youtube.com/embed?listType=playlist&list=${soundtrackPlaylistId}&autoplay=1&loop=1&controls=1&rel=0&playsinline=1&origin=${encodeURIComponent(window.location.origin)}&nonce=${soundtrackNonce}`;

  return (
    <div className="pointer-events-auto w-[min(320px,calc(100vw-2.5rem))] rounded-[1.4rem] border border-white/12 bg-[#07111f]/35 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-md">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/6 px-3 py-2 text-left text-sm font-medium text-slate-100 transition-colors hover:bg-white/10"
        onClick={() => setSoundtrackOpen((current) => !current)}
      >
        <span className="tracking-[0.18em] uppercase text-slate-300">
          Soundtrack
        </span>
        <span className="text-xs text-amber-100">
          {soundtrackOpen ? "Hide" : "Show"}
        </span>
      </button>

      {soundtrackOpen ? (
        <div className="mt-3 space-y-3">
          <button
            type="button"
            className="w-full rounded-xl border border-amber-200/25 bg-amber-300/14 px-4 py-2.5 text-sm font-medium text-amber-50 transition-colors hover:bg-amber-300/22"
            onClick={() => {
              setSoundtrackEnabled(true);
              setSoundtrackNonce((current) => current + 1);
            }}
          >
            {soundtrackEnabled
              ? "Restart soundtrack loop"
              : "Play soundtrack loop"}
          </button>

          {soundtrackEnabled ? (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/35">
              <div className="aspect-video">
                <iframe
                  className="h-full w-full"
                  src={soundtrackEmbedSrc}
                  title="Mission soundtrack"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-4 text-sm leading-6 text-slate-400">
              The player loads after you click the button so playback can start
              immediately.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
});

const CameraDebugPanel = memo(function CameraDebugPanel({
  cameraDebug,
}: {
  cameraDebug: CameraDebugProps;
}) {
  return (
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
  );
});

const CameraSelectionPanel = memo(function CameraSelectionPanel({
  isOverviewActive,
  currentLockTarget,
  currentLookTarget,
  onOverview,
  onLockTarget,
  onLookAtTarget,
}: CameraSelectionPanelProps) {
  return (
    <div className={CAMERA_CONTROL_PANEL_CLASS_NAME}>
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

      <CameraTargetColumn
        title="Lock On"
        selectedTarget={currentLockTarget}
        onSelect={onLockTarget}
      />

      <CameraTargetColumn
        title="Look At"
        selectedTarget={currentLookTarget}
        onSelect={onLookAtTarget}
      />
    </div>
  );
});

const SettingsPanel = memo(function SettingsPanel({
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
            onChange={onToggleThrustDirectionArrow}
          />
        </div>
      ) : null}
    </div>
  );
});

const ControlPad = memo(function ControlPad({
  running,
  pressedControls,
  onToggleRunning,
  onReset,
  onMissionControlPress,
  onMissionControlRelease,
}: ControlPadProps) {
  const missionCluster: KeyboardClusterConfig = {
    label: "Mission keys",
    className: "min-w-[176px]",
    rows: [
      [
        {
          control: "Space",
          label: "Space",
          caption: running ? "Pause" : "Start",
          wide: true,
        },
      ],
      [{ control: "KeyR", label: "R", caption: "Restart" }],
    ],
  };

  return (
    <div className="pointer-events-auto flex flex-wrap items-end justify-center gap-3 rounded-[1.4rem] border border-white/12 bg-[#07111f]/35 px-4 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-md">
      <KeyboardCluster
        cluster={ARROW_CLUSTER}
        pressedControls={pressedControls}
        onPress={onMissionControlPress}
        onRelease={onMissionControlRelease}
      />
      <KeyboardCluster
        cluster={WASD_CLUSTER}
        pressedControls={pressedControls}
        onPress={onMissionControlPress}
        onRelease={onMissionControlRelease}
      />
      <MissionControls
        running={running}
        onToggleRunning={onToggleRunning}
        onReset={onReset}
      />
      <KeyboardCluster
        cluster={missionCluster}
        pressedControls={pressedControls}
        onPress={onMissionControlPress}
        onRelease={onMissionControlRelease}
      />
    </div>
  );
});

const MissionControls = memo(function MissionControls({
  running,
  onToggleRunning,
  onReset,
}: Pick<ControlPadProps, "running" | "onToggleRunning" | "onReset">) {
  return (
    <div className="flex min-w-[168px] flex-col items-center gap-2 self-stretch">
      <div className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
        Mission
      </div>
      <div className="flex flex-col gap-2">
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
          Restart
        </button>
      </div>
    </div>
  );
});

function CameraTargetColumn({
  title,
  selectedTarget,
  onSelect,
}: {
  title: string;
  selectedTarget: CameraTarget | null;
  onSelect: (target: CameraTarget) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="px-1 text-[0.65rem] font-semibold tracking-[0.2em] text-slate-300 uppercase">
        {title}
      </div>
      {CAMERA_TARGETS.map((target) => (
        <button
          key={target}
          type="button"
          className={getButtonClassName(selectedTarget === target)}
          onClick={() => onSelect(target)}
        >
          {target[0].toUpperCase()}
          {target.slice(1)}
        </button>
      ))}
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

function KeyboardCluster({
  cluster,
  pressedControls,
  onPress,
  onRelease,
}: {
  cluster: KeyboardClusterConfig;
  pressedControls: Record<MissionControlKey, boolean>;
  onPress: (control: MissionControlKey) => void;
  onRelease: (control: MissionControlKey) => void;
}) {
  return (
    <div className={`flex flex-col items-center gap-2 ${cluster.className ?? ""}`}>
      <div className="flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
        <span>{cluster.label}</span>
        {cluster.description ? <HoverHelp description={cluster.description} /> : null}
      </div>
      {cluster.rows.map((row, rowIndex) => (
        <div key={`${cluster.label}-${rowIndex}`} className="flex items-center justify-center gap-2">
          {row.map((keyConfig) => (
            <KeyboardKeyButton
              key={keyConfig.control}
              label={keyConfig.label}
              caption={keyConfig.caption}
              control={keyConfig.control}
              pressed={pressedControls[keyConfig.control]}
              onPress={onPress}
              onRelease={onRelease}
              wide={keyConfig.wide}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

type KeyboardKeyButtonProps = {
  label: string;
  caption: string;
  control: MissionControlKey;
  pressed: boolean;
  onPress: (control: MissionControlKey) => void;
  onRelease: (control: MissionControlKey) => void;
  wide?: boolean;
};

function KeyboardKeyButton({
  label,
  caption,
  control,
  pressed,
  onPress,
  onRelease,
  wide = false,
}: KeyboardKeyButtonProps) {
  const className = pressed
    ? "border-white/95 bg-white text-slate-950 shadow-[0_0_0_1px_rgba(255,255,255,0.5)_inset,0_10px_22px_rgba(255,255,255,0.18)]"
    : "border-white/20 bg-[linear-gradient(180deg,rgba(248,250,252,0.18),rgba(148,163,184,0.08))] text-slate-100 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_12px_24px_rgba(2,6,23,0.35)] hover:border-white/30 hover:bg-[linear-gradient(180deg,rgba(248,250,252,0.24),rgba(148,163,184,0.12))]";

  return (
    <button
      type="button"
      aria-label={`${label} control`}
      className={`flex h-14 ${wide ? "min-w-[7.5rem]" : "min-w-14"} select-none touch-none flex-col items-center justify-center rounded-[1rem] border px-3 transition-colors ${className}`}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        onPress(control);
      }}
      onPointerUp={(event) => {
        event.preventDefault();
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        onRelease(control);
      }}
      onPointerLeave={() => onRelease(control)}
      onPointerCancel={() => onRelease(control)}
    >
      <span className="text-base font-semibold uppercase tracking-[0.08em]">
        {label}
      </span>
      <span className="mt-0.5 text-[0.58rem] font-medium uppercase tracking-[0.16em] opacity-70">
        {caption}
      </span>
    </button>
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
