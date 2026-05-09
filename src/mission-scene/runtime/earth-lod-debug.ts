import type { ThreeSceneBundle } from "../../three/scene";

export function getEarthLodDebug(bundle: ThreeSceneBundle): string {
  if (bundle.objects.earthRenderers.nearAtmosphere.root.visible) {
    return "Near Atmosphere Renderer";
  }

  const earth = bundle.objects.earth;
  const levelIndex = earth.getCurrentLevel();
  const detail = levelIndex === 0 ? "8K" : "2K";
  const range = levelIndex === 0 ? "near" : levelIndex === 1 ? "mid" : "far";

  return `LOD ${levelIndex} · ${detail} · ${range}`;
}
