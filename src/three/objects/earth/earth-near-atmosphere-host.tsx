import type { EarthNearAtmosphereRendererBundle } from "./near-atmosphere-renderer";

type EarthNearAtmosphereHostProps = {
  renderer: EarthNearAtmosphereRendererBundle;
};

export function EarthNearAtmosphereHost({
  renderer,
}: EarthNearAtmosphereHostProps) {
  return (
    <primitive object={renderer.root} dispose={null}>
      <primitive object={renderer.globe} dispose={null} />
      <primitive object={renderer.cloudsFrame} dispose={null} />
      <primitive object={renderer.atmosphere} dispose={null} />
      <primitive object={renderer.fresnel} dispose={null} />
      <primitive object={renderer.launchSite} dispose={null}>
        <primitive object={renderer.localOcean} dispose={null} />
      </primitive>
    </primitive>
  );
}
