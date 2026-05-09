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
  const isTakramNear = earthRendererMode === "takram-near";
  const showLegacyAtmosphereShells = isNearAtmosphere;
  const isMoonLocal = frame.renderSpace.mode === "moon-local";
  const isDeepSpace = frame.renderSpace.mode === "deep-space";

  objects.earthRenderers.nearAtmosphere.root.visible =
    isNearAtmosphere || isTakramNear;
  objects.earthRenderers.takramNear.root.visible = isTakramNear;
  objects.earthRenderers.far.root.visible = !isNearAtmosphere && !isTakramNear;
  objects.earthCloudsFrame.visible = showLegacyAtmosphereShells;
  objects.earthAtmosphere.visible = showLegacyAtmosphereShells;
  objects.earthFresnel.visible = showLegacyAtmosphereShells;
  objects.earthLaunchSite.visible = isNearAtmosphere || isTakramNear;
  objects.launchCloudField.root.visible = isNearAtmosphere || isTakramNear;
  objects.moonOrbit.visible = isDeepSpace;
  objects.moonLandingSiteArrow.visible = showMoonLandingArrow && isMoonLocal;
}
