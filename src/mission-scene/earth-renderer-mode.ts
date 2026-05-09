import type { RenderSpaceMode } from "../render-space/frame";

export type EarthRendererOverride =
  | "auto"
  | "near-atmosphere"
  | "takram-near"
  | "far";
export type EarthRendererMode = Exclude<EarthRendererOverride, "auto">;

export function resolveEarthRendererMode(
  renderSpaceMode: RenderSpaceMode,
  override: EarthRendererOverride,
): EarthRendererMode {
  if (override !== "auto") {
    return override;
  }

  return renderSpaceMode === "earth-local" ? "near-atmosphere" : "far";
}
