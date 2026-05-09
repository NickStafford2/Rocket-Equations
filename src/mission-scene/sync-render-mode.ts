import type { ThreeSceneBundle } from "../three/scene";
import type { FrameState } from "./frame-state";

export function syncRenderMode(
  bundle: ThreeSceneBundle,
  frame: FrameState,
  {
    showMoonLandingArrow,
  }: {
    showMoonLandingArrow: boolean;
  },
) {
  const { objects } = bundle;
  const isEarthLocal = frame.renderSpace.mode === "earth-local";
  const isMoonLocal = frame.renderSpace.mode === "moon-local";
  const isDeepSpace = frame.renderSpace.mode === "deep-space";

  objects.earthRenderers.nearAtmosphere.root.visible = isEarthLocal;
  objects.earthRenderers.far.root.visible = !isEarthLocal;
  objects.earthCloudsFrame.visible = isEarthLocal;
  objects.earthAtmosphere.visible = isEarthLocal;
  objects.earthFresnel.visible = isEarthLocal;
  objects.earthLaunchSite.visible = isEarthLocal;
  objects.launchCloudField.root.visible = isEarthLocal;
  objects.moonOrbit.visible = isDeepSpace;
  objects.moonLandingSiteArrow.visible = showMoonLandingArrow && isMoonLocal;
}
