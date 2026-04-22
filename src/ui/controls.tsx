import { useState } from "react";
import { formatDt } from "../mission";

type ControlsProps = {
  launchSpeed: number;
  launchAngleDeg: number;
  launchAzimuthDeg: number;
  dt: number;
  showTrail: boolean;
  showVectors: boolean;
  onLaunchSpeedChange: (value: number) => void;
  onLaunchAngleChange: (value: number) => void;
  onLaunchAzimuthChange: (value: number) => void;
  onDtChange: (value: number) => void;
  onShowTrailChange: (value: boolean) => void;
  onShowVectorsChange: (value: boolean) => void;
};

export function Controls({
  launchSpeed,
  launchAngleDeg,
  launchAzimuthDeg,
  dt,
  showTrail,
  showVectors,
  onLaunchSpeedChange,
  onLaunchAngleChange,
  onLaunchAzimuthChange,
  onDtChange,
  onShowTrailChange,
  onShowVectorsChange,
}: ControlsProps) {
  const soundtrackPlaylistId = "PLAikqLA5ubJ5lr05z7kcKE5za7T8n1sG3";
  const [soundtrackEnabled, setSoundtrackEnabled] = useState(false);
  const [soundtrackNonce, setSoundtrackNonce] = useState(0);

  const soundtrackEmbedSrc = `https://www.youtube.com/embed?listType=playlist&list=${soundtrackPlaylistId}&autoplay=1&loop=1&controls=1&rel=0&playsinline=1&origin=${encodeURIComponent(window.location.origin)}&nonce=${soundtrackNonce}`;

  return (
    <div className="space-y-5 rounded-[2rem] border border-white/10 bg-[#07111f]/85 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.4)] backdrop-blur">
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Lunar Landing</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            The rocket begins on Earth&apos;s surface with a launch impulse, and
            then you can steer and burn to set up a soft lunar touchdown.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-300/12 bg-cyan-300/8 px-4 py-3 text-xs leading-5 text-slate-200">
          Arrow keys are live during flight: Left/Right rotate the ship, and Up
          or Space fires thrust along the nose. WASD adjusts delta t: W x10, S
          /10, A -2%, D +2%. Changing launch inputs immediately restages the
          rocket at t = 0.
        </div>
      </div>

      <div className="space-y-4 rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
        <label className="block space-y-2">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-200">Launch speed</span>
            <span className="text-cyan-100">
              {launchSpeed.toLocaleString()} m/s
            </span>
          </div>
          <input
            className="w-full"
            type="range"
            min={8800}
            max={12100}
            step={5}
            value={launchSpeed}
            onChange={(e) => onLaunchSpeedChange(Number(e.target.value))}
          />
        </label>

        <label className="block space-y-2">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-200">Launch location around Earth</span>
            <span className="text-cyan-100">
              {launchAzimuthDeg.toFixed(0)}°
            </span>
          </div>
          <input
            className="w-full"
            type="range"
            min={0}
            max={360}
            step={1}
            value={launchAzimuthDeg}
            onChange={(e) => onLaunchAzimuthChange(Number(e.target.value))}
          />
          <div className="text-xs leading-5 text-slate-400">
            Rotates the launch point around Earth&apos;s equator.
          </div>
        </label>

        <label className="block space-y-2">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-200">
              Flight path angle above local tangent
            </span>
            <span className="text-cyan-100">{launchAngleDeg.toFixed(1)}°</span>
          </div>
          <input
            className="w-full"
            type="range"
            min={0}
            max={180}
            step={1}
            value={launchAngleDeg}
            onChange={(e) => onLaunchAngleChange(Number(e.target.value))}
          />
          <div className="text-xs leading-5 text-slate-400">
            The preview is planar: 0° follows the local tangent, 90° points
            straight away from Earth, and 180° reverses along the tangent.
          </div>
        </label>

        <label className="block space-y-2">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-200">Integration time step</span>
            <span className="text-cyan-100">{formatDt(dt)} s</span>
          </div>
          <input
            className="w-full"
            type="range"
            min={0.1}
            max={1000}
            step={0.1}
            value={dt}
            onChange={(e) => onDtChange(Number(e.target.value))}
          />
          <div className="text-xs leading-5 text-slate-400">
            Smaller steps improve control precision and landing accuracy, while
            larger steps speed up long coasts but make manual burns coarser.
          </div>
        </label>
      </div>

      <div className="space-y-3 rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
        <div className="text-[0.72rem] font-semibold tracking-[0.24em] text-slate-400 uppercase">
          View Options
        </div>
        <label className="inline-flex items-center gap-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={showTrail}
            onChange={(e) => onShowTrailChange(e.target.checked)}
          />
          Show trail
        </label>
        <label className="inline-flex items-center gap-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={showVectors}
            onChange={(e) => onShowVectorsChange(e.target.checked)}
          />
          Show velocity and acceleration vectors
        </label>
      </div>

      <div className="space-y-4 rounded-[1.5rem] border border-amber-200/10 bg-amber-100/5 p-4">
        <div className="space-y-2">
          <div className="text-[0.72rem] font-semibold tracking-[0.24em] text-amber-100/70 uppercase">
            Mission Soundtrack
          </div>
          <p className="text-sm leading-6 text-slate-300">
            Plays your embedded YouTube playlist and loops the full track list
            for background music.
          </p>
        </div>

        <button
          type="button"
          className="w-full rounded-2xl border border-amber-200/25 bg-amber-300/14 px-4 py-3 text-sm font-medium text-amber-50 transition-colors hover:bg-amber-300/22"
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
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/35">
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
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-5 text-sm leading-6 text-slate-400">
            The player loads after you click the button so the browser will
            allow playback to start immediately.
          </div>
        )}
      </div>
    </div>
  );
}
