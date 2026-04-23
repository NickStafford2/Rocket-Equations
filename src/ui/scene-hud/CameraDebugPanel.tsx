import { memo } from "react";
import type { CameraDebugProps } from "./types";

export const CameraDebugPanel = memo(function CameraDebugPanel({
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
