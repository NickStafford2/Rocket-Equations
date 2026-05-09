import * as THREE from "three";
import lowPolySatelliteModelUrl from "../../../../assets/satellites/satellite_generic_lod1.glb?url";
import type { SatelliteDefinition } from "./catalog";
import { loadGltfScene } from "./modelCache";
import {
  compileSatelliteOrbit,
  createDeterministicSatelliteQuaternion,
  getSatelliteTargetSize,
  resolveCompiledSatellitePosition,
  type CompiledSatelliteOrbit,
  type SatelliteSystemBody,
} from "./orbit";

const MODEL_SIZE = new THREE.Vector3();

const SATELLITE_LOW_DETAIL_MIN_DISTANCE = 12;
const SATELLITE_LOW_DETAIL_DISTANCE_MULTIPLIER = 64;

type HeroSatelliteUserData = {
  satelliteDefinition: SatelliteDefinition;
  compiledSatelliteOrbit: CompiledSatelliteOrbit;
};

export function createHeroSatellite(
  definition: SatelliteDefinition,
  body: SatelliteSystemBody,
): THREE.Group {
  const satellite = new THREE.Group();
  const compiledOrbit = compileSatelliteOrbit(definition, body);

  satellite.name = definition.id;
  satellite.userData.focusLabel = definition.label;
  satellite.userData.satelliteDefinition = definition;
  satellite.userData.compiledSatelliteOrbit =
    compiledOrbit satisfies CompiledSatelliteOrbit;

  resolveCompiledSatellitePosition(compiledOrbit, 0, satellite.position);

  const modelRoot = new THREE.Group();
  modelRoot.quaternion.copy(
    createDeterministicSatelliteQuaternion(definition.id),
  );
  satellite.add(modelRoot);

  loadHeroSatelliteModel(modelRoot, definition, body);

  return satellite;
}

export function syncHeroSatellites(
  heroGroup: THREE.Group,
  timeSeconds: number,
): void {
  for (const child of heroGroup.children) {
    const satellite = child as THREE.Group;
    const userData = satellite.userData as Partial<HeroSatelliteUserData>;

    if (!userData.compiledSatelliteOrbit) {
      continue;
    }

    resolveCompiledSatellitePosition(
      userData.compiledSatelliteOrbit,
      timeSeconds,
      satellite.position,
    );
  }
}

function loadHeroSatelliteModel(
  modelRoot: THREE.Group,
  definition: SatelliteDefinition,
  body: SatelliteSystemBody,
) {
  if (!definition.modelUrl) {
    return;
  }

  Promise.all([
    loadGltfScene(definition.modelUrl),
    loadGltfScene(lowPolySatelliteModelUrl),
  ]).then(
    ([highDetailSource, lowDetailSource]) => {
      const lod = new THREE.LOD();
      lod.autoUpdate = true;

      lod.addLevel(
        prepareSatelliteModel(highDetailSource, definition, body),
        0,
      );
      lod.addLevel(
        prepareSatelliteModel(lowDetailSource, definition, body),
        getSatelliteLodDistance(definition, body),
      );

      modelRoot.clear();
      modelRoot.add(lod);
    },
    (error) => {
      console.error(
        `Failed to load satellite model "${definition.label}".`,
        error,
      );
    },
  );
}

function prepareSatelliteModel(
  source: THREE.Group,
  definition: SatelliteDefinition,
  body: SatelliteSystemBody,
): THREE.Group {
  const satelliteModel = source.clone(true);

  satelliteModel.traverse((object) => {
    const mesh = object as THREE.Mesh;

    if (!mesh.isMesh) {
      return;
    }

    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });

  const bounds = new THREE.Box3().setFromObject(satelliteModel);
  const size = bounds.getSize(MODEL_SIZE);
  const maxDimension = Math.max(size.x, size.y, size.z, 1e-6);
  const targetSize = getSatelliteTargetSize(definition, body);
  const scale = targetSize / maxDimension;

  satelliteModel.scale.setScalar(scale);
  satelliteModel.rotation.x = Math.PI * 0.5;
  satelliteModel.rotation.z = Math.PI;

  return satelliteModel;
}

function getSatelliteLodDistance(
  definition: SatelliteDefinition,
  body: SatelliteSystemBody,
) {
  const targetSize = getSatelliteTargetSize(definition, body);

  return Math.max(
    SATELLITE_LOW_DETAIL_MIN_DISTANCE,
    targetSize * SATELLITE_LOW_DETAIL_DISTANCE_MULTIPLIER,
  );
}
