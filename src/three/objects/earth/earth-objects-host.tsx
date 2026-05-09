import type { SceneObjects } from "../index";

type EarthObjectsHostProps = {
  objects: SceneObjects;
};

export function EarthObjectsHost({ objects }: EarthObjectsHostProps) {
  return (
    <primitive object={objects.earthGroup} dispose={null}>
      <primitive object={objects.earthRotatingFrame} dispose={null}>
        <primitive
          object={objects.earthRenderers.far.root}
          dispose={null}
        />
        <primitive
          object={objects.earthRenderers.nearAtmosphere.root}
          dispose={null}
        />
      </primitive>
      <primitive object={objects.earthLabel} dispose={null} />
      <primitive object={objects.satelliteSystem} dispose={null} />
    </primitive>
  );
}
