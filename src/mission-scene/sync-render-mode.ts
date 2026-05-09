import type { EarthRendererOverride } from "./earth-renderer-mode";
import { resolveEarthRendererMode } from "./earth-renderer-mode";
import type { ThreeSceneBundle } from "../three/scene";
import type { FrameState } from "./frame-state";

export function syncRenderMode(
  bundle: ThreeSceneBundle,
  frame: FrameState,
  {
    earthRendererOverride,
    showMoonLandingArrow,
  }: {
    earthRendererOverride: EarthRendererOverride;
    showMoonLandingArrow: boolean;
  },
) {
  const { objects } = bundle;
  const earthRendererMode = resolveEarthRendererMode(
    frame.renderSpace.mode,
    earthRendererOverride,
  );
  const isNearAtmosphere = earthRendererMode === "near-atmosphere";
  const isMoonLocal = frame.renderSpace.mode === "moon-local";
  const isDeepSpace = frame.renderSpace.mode === "deep-space";

  objects.earthRenderers.nearAtmosphere.root.visible = isNearAtmosphere;
  objects.earthRenderers.far.root.visible = !isNearAtmosphere;
  objects.earthCloudsFrame.visible = isNearAtmosphere;
  objects.earthAtmosphere.visible = isNearAtmosphere;
  objects.earthFresnel.visible = isNearAtmosphere;
  objects.earthLaunchSite.visible = isNearAtmosphere;
  objects.launchCloudField.root.visible = isNearAtmosphere;
  objects.moonOrbit.visible = isDeepSpace;
  objects.moonLandingSiteArrow.visible = showMoonLandingArrow && isMoonLocal;
}
