import type { SceneObjects } from "../index";
import { EarthNearAtmosphereHost } from "./earth-near-atmosphere-host";
import { EarthTakramNearHost } from "./earth-takram-near-host";

type EarthObjectsHostProps = {
  objects: SceneObjects;
};

export function EarthObjectsHost({ objects }: EarthObjectsHostProps) {
  return (
    <primitive object={objects.earthGroup} dispose={null}>
      <primitive object={objects.earthRotatingFrame} dispose={null}>
        <primitive object={objects.earthRenderers.far.root} dispose={null} />
        <EarthNearAtmosphereHost renderer={objects.earthRenderers.nearAtmosphere} />
        <EarthTakramNearHost renderer={objects.earthRenderers.takramNear} />
      </primitive>
      <primitive object={objects.earthLabel} dispose={null} />
      <primitive object={objects.satelliteSystem} dispose={null} />
    </primitive>
  );
}
