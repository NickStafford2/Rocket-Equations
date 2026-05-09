import type { EarthRendererOverride } from "../earth-renderer-mode";
import type { ThreeSceneBundle } from "../../three/scene";

export function getEarthLodDebug(
  bundle: ThreeSceneBundle,
  earthRendererOverride: EarthRendererOverride,
): string {
  const prefix = earthRendererOverride === "auto" ? "Auto" : "Forced";

  if (bundle.objects.earthRenderers.takramNear.root.visible) {
    return `${prefix} · Takram Near · Fallback Visuals`;
  }

  if (bundle.objects.earthRenderers.nearAtmosphere.root.visible) {
    return `${prefix} · Near Atmosphere`;
  }

  const earth = bundle.objects.earth;
  const levelIndex = earth.getCurrentLevel();
  const detail = levelIndex === 0 ? "8K" : "2K";
  const range = levelIndex === 0 ? "near" : levelIndex === 1 ? "mid" : "far";

  return `${prefix} · Far · LOD ${levelIndex} · ${detail} · ${range}`;
}
