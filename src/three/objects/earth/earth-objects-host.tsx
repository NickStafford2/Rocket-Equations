import type { SceneObjects } from "../index";
import { EarthNearAtmosphereHost } from "./earth-near-atmosphere-host";

type EarthObjectsHostProps = {
  objects: SceneObjects;
};

export function EarthObjectsHost({ objects }: EarthObjectsHostProps) {
  return (
    <primitive object={objects.earthGroup} dispose={null}>
      <primitive object={objects.earthRotatingFrame} dispose={null}>
        <primitive object={objects.earthRenderers.far.root} dispose={null} />
        <EarthNearAtmosphereHost renderer={objects.earthRenderers.nearAtmosphere} />
      </primitive>
      <primitive object={objects.earthLabel} dispose={null} />
      <primitive object={objects.satelliteSystem} dispose={null} />
    </primitive>
  );
}
