import { memo } from "react";
import type { EarthRendererOverride } from "../../mission-scene/earth-renderer-mode";
import type { CameraDebugProps } from "./types";

export const CameraDebugPanel = memo(function CameraDebugPanel({
  cameraDebug,
  earthLodDebug,
  earthRendererOverride,
  onEarthRendererOverrideChange,
}: {
  cameraDebug: CameraDebugProps;
  earthLodDebug: string;
  earthRendererOverride: EarthRendererOverride;
  onEarthRendererOverrideChange: (value: EarthRendererOverride) => void;
}) {
  return (
    <div className="min-w-[210px] rounded-2xl border border-white/12 bg-[#07111f]/55 px-3 py-2 text-[0.68rem] tracking-[0.08em] text-slate-200 shadow-[0_18px_44px_rgba(0,0,0,0.28)] backdrop-blur-md">
      <div className="text-[0.6rem] font-semibold uppercase text-slate-400">
        Camera
      </div>
      <div className="mt-1 font-medium text-cyan-100">{cameraDebug.mode}</div>
      <div className="mt-1 text-[0.62rem] font-medium uppercase tracking-[0.14em] text-amber-200">
        {cameraDebug.renderSpaceMode} · {cameraDebug.renderSpaceAnchor}
      </div>
      <div className="mt-1 text-[0.6rem] uppercase tracking-[0.12em] text-violet-200">
        {cameraDebug.renderSpaceProjection}
      </div>
      <div className="mt-1 font-mono text-slate-300">
        cam {cameraDebug.position.x}, {cameraDebug.position.y},{" "}
        {cameraDebug.position.z}
      </div>
      <div className="mt-1 font-mono text-slate-400">
        tgt {cameraDebug.target.x}, {cameraDebug.target.y},{" "}
        {cameraDebug.target.z}
      </div>
      <div className="mt-1 font-mono text-slate-500">
        org {cameraDebug.renderOrigin.x}, {cameraDebug.renderOrigin.y},{" "}
        {cameraDebug.renderOrigin.z}
      </div>
      <div className="mt-2 text-[0.6rem] font-semibold uppercase text-slate-400">
        Earth Renderer
      </div>
      <div className="mt-1 text-[0.68rem] font-medium text-cyan-100">
        {earthLodDebug}
      </div>
      <div className="mt-2 flex gap-1">
        {EARTH_RENDERER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={getButtonClassName(earthRendererOverride === option.value)}
            onClick={() => onEarthRendererOverrideChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
});

const EARTH_RENDERER_OPTIONS: Array<{
  value: EarthRendererOverride;
  label: string;
}> = [
  { value: "auto", label: "Auto" },
  { value: "near-atmosphere", label: "Near" },
  { value: "far", label: "Far" },
];

function getButtonClassName(isSelected: boolean): string {
  return [
    "pointer-events-auto rounded-lg border px-2 py-1 text-[0.6rem] font-medium transition-colors",
    isSelected
      ? "border-cyan-100/75 bg-cyan-300/20 text-cyan-50"
      : "border-white/20 bg-white/5 text-slate-300 hover:bg-white/10",
  ].join(" ");
}
