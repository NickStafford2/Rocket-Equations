import * as THREE from "three";
import type { SatelliteDefinition } from "./catalog";
import { createHeroSatellite, syncHeroSatellites } from "./heroSatellites";
import { createSatelliteSwarm, syncSatelliteSwarm } from "./swarm";
import type { SatelliteSystemBody } from "./orbit";

type CreateSatelliteSystemOptions = {
  name?: string;
  body: SatelliteSystemBody;
  definitions: SatelliteDefinition[];
};

type SatelliteSystemUserData = {
  satelliteBody: SatelliteSystemBody;
  heroGroup: THREE.Group;
  swarmGroup: THREE.Group;
};

export function createSatelliteSystem({
  name = "satellite-system",
  body,
  definitions,
}: CreateSatelliteSystemOptions) {
  const satelliteSystem = new THREE.Group();
  satelliteSystem.name = name;
  satelliteSystem.userData.satelliteBody = body;

  const heroDefinitions = definitions.filter(
    (definition) => (definition.visualKind ?? "hero") === "hero",
  );

  const swarmDefinitions = definitions.filter(
    (definition) => definition.visualKind === "swarm",
  );

  const heroGroup = new THREE.Group();
  heroGroup.name = "hero-satellites";

  for (const definition of heroDefinitions) {
    heroGroup.add(createHeroSatellite(definition, body));
  }

  const swarmGroup = createSatelliteSwarm(swarmDefinitions, body);

  satelliteSystem.add(heroGroup, swarmGroup);

  satelliteSystem.userData.heroGroup = heroGroup;
  satelliteSystem.userData.swarmGroup = swarmGroup;

  return {
    satelliteSystem,
  };
}

export function syncSatelliteSystem(
  satelliteSystem: THREE.Group,
  timeSeconds: number,
) {
  const userData = satelliteSystem.userData as Partial<SatelliteSystemUserData>;

  if (userData.heroGroup) {
    syncHeroSatellites(userData.heroGroup, timeSeconds);
  }

  if (userData.swarmGroup) {
    syncSatelliteSwarm(userData.swarmGroup, timeSeconds);
  }
}

export type { SatelliteSystemBody };
