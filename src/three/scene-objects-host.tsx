import { EarthObjectsHost } from "./objects/earth/earth-objects-host";
import type { SceneObjects } from "./objects";

type MissionSceneObjectsHostProps = {
  objects: SceneObjects;
};

export function MissionSceneObjectsHost({
  objects,
}: MissionSceneObjectsHostProps) {
  return (
    <primitive object={objects.system} dispose={null}>
      <EarthObjectsHost objects={objects} />
      <primitive object={objects.moon} dispose={null} />
      <primitive object={objects.rocket} dispose={null} />
      <primitive object={objects.launchRing} dispose={null} />
      <primitive object={objects.launchAimArrow} dispose={null} />
      <primitive object={objects.moonOrbit} dispose={null} />
      <primitive object={objects.trailLine} dispose={null} />
      <primitive object={objects.predictionLine} dispose={null} />
    </primitive>
  );
}
