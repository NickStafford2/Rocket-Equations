import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EARTH_ROTATION_PERIOD, G } from "../../../../physics/bodies";
import dracoDecoderJsUrl from "three/examples/jsm/libs/draco/gltf/draco_decoder.js?url";
import lowPolySatelliteModelUrl from "../../../../assets/satellites/satellite_generic_lod1.glb?url";
import { ORBIT_METERS_TO_SCENE_UNITS } from "../../constants";
import {
  orbitalRadiusMeters,
  geosynchronousOrbitRadiusMeters,
  SATELLITE_TARGET_SIZE_SCENE_UNITS,
  type SatelliteDefinition,
} from "./catalog";
import { SUN_POSITION } from "../../../sun";

const MODEL_SIZE = new THREE.Vector3();
const ORBIT_POSITION = new THREE.Vector3();
const ORBIT_X_AXIS = new THREE.Vector3(1, 0, 0);
const ORBIT_Y_AXIS = new THREE.Vector3(0, 1, 0);
const RANDOM_FORWARD = new THREE.Vector3(0, 0, 1);
const RANDOM_TARGET = new THREE.Vector3();
const SUN_DIRECTION = SUN_POSITION.clone().normalize();
const ANTI_SUN_DIRECTION = SUN_DIRECTION.clone().multiplyScalar(-1);
const DRACO_DECODER_PATH = dracoDecoderJsUrl.replace(
  /draco_decoder\.js(?:\?.*)?$/,
  "",
);

type SatelliteSystemBody = {
  radiusMeters: number;
  renderRadiusSceneUnits: number;
  primaryMassKg: number;
  defaultOrbitPeriodSeconds?: number;
  targetSizeSceneUnits?: number;
};

type CreateSatelliteSystemOptions = {
  name?: string;
  body: SatelliteSystemBody;
  definitions: SatelliteDefinition[];
};

const SATELLITE_LOW_DETAIL_MIN_DISTANCE = 12;
const SATELLITE_LOW_DETAIL_DISTANCE_MULTIPLIER = 64;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderConfig({ type: "js" });
dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
const sceneCache = new Map<string, Promise<THREE.Group>>();

export function createSatelliteSystem({
  name = "satellite-system",
  body,
  definitions,
}: CreateSatelliteSystemOptions) {
  const satelliteSystem = new THREE.Group();
  satelliteSystem.name = name;
  satelliteSystem.userData.satelliteBody = body;

  for (const definition of definitions) {
    satelliteSystem.add(createSatellite(definition, body));
  }

  return {
    satelliteSystem,
  };
}

export function syncSatelliteSystem(
  satelliteSystem: THREE.Group,
  timeSeconds: number,
) {
  for (const child of satelliteSystem.children) {
    const satellite = child as THREE.Group;
    const definition = satellite.userData.satelliteDefinition as
      | SatelliteDefinition
      | undefined;

    if (!definition) {
      continue;
    }

    const body = satelliteSystem.userData.satelliteBody as
      | SatelliteSystemBody
      | undefined;

    if (!body) {
      continue;
    }

    satellite.position.copy(resolveSatellitePosition(definition, body, timeSeconds));
  }
}

function createSatellite(
  definition: SatelliteDefinition,
  body: SatelliteSystemBody,
): THREE.Group {
  const satellite = new THREE.Group();
  satellite.name = definition.id;
  satellite.userData.focusLabel = definition.label;
  satellite.userData.satelliteDefinition = definition;
  satellite.position.copy(resolveSatellitePosition(definition, body, 0));

  const modelRoot = new THREE.Group();
  modelRoot.quaternion.copy(createDeterministicSatelliteQuaternion(definition.id));
  satellite.add(modelRoot);
  loadSatelliteModel(modelRoot, definition, body);

  // const label = createBodyLabelSprite(definition.label, {
  //   borderColor: "rgba(125, 211, 252, 0.9)",
  // });
  // label.position.set(0, SATELLITE_TARGET_SIZE_SCENE_UNITS * 2.4, 0);
  // label.scale.set(4.5, 1.7, 1);
  // label.visible = true;
  // satellite.add(label);

  return satellite;
}

function loadSatelliteModel(
  modelRoot: THREE.Group,
  definition: SatelliteDefinition,
  body: SatelliteSystemBody,
) {
  Promise.all([
    loadGltfScene(definition.modelUrl),
    loadGltfScene(lowPolySatelliteModelUrl),
  ]).then(
    ([highDetailSource, lowDetailSource]) => {
      const lod = new THREE.LOD();
      lod.autoUpdate = true;
      lod.addLevel(prepareSatelliteModel(highDetailSource, body), 0);
      lod.addLevel(
        prepareSatelliteModel(lowDetailSource, body),
        getSatelliteLodDistance(body),
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

function loadGltfScene(url: string): Promise<THREE.Group> {
  let scenePromise = sceneCache.get(url);

  if (!scenePromise) {
    scenePromise = new Promise<THREE.Group>((resolve, reject) => {
      gltfLoader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
    });
    sceneCache.set(url, scenePromise);
  }

  return scenePromise.then((scene) => scene.clone(true));
}

function prepareSatelliteModel(
  source: THREE.Group,
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
  const targetSize = body.targetSizeSceneUnits ?? SATELLITE_TARGET_SIZE_SCENE_UNITS;
  const scale = targetSize / maxDimension;

  satelliteModel.scale.setScalar(scale);
  satelliteModel.rotation.x = Math.PI * 0.5;
  satelliteModel.rotation.z = Math.PI;

  return satelliteModel;
}

function getSatelliteLodDistance(body: SatelliteSystemBody) {
  const targetSize = body.targetSizeSceneUnits ?? SATELLITE_TARGET_SIZE_SCENE_UNITS;

  return Math.max(
    SATELLITE_LOW_DETAIL_MIN_DISTANCE,
    targetSize * SATELLITE_LOW_DETAIL_DISTANCE_MULTIPLIER,
  );
}

function createDeterministicSatelliteQuaternion(id: string) {
  const baseSeed = hashString(id);
  const x = pseudoRandomSigned(baseSeed + 1);
  const y = pseudoRandomSigned(baseSeed + 2);
  const z = pseudoRandomSigned(baseSeed + 3);
  const roll = pseudoRandom01(baseSeed + 4) * Math.PI * 2;
  const direction = RANDOM_TARGET.set(x, y, z).normalize();

  if (direction.lengthSq() < 1e-6) {
    direction.set(0, 1, 0);
  }

  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    RANDOM_FORWARD,
    direction,
  );

  return quaternion.multiply(
    new THREE.Quaternion().setFromAxisAngle(direction, roll),
  );
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function pseudoRandom01(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return value - Math.floor(value);
}

function pseudoRandomSigned(seed: number) {
  return pseudoRandom01(seed) * 2 - 1;
}

function resolveSatellitePosition(
  definition: SatelliteDefinition,
  body: SatelliteSystemBody,
  timeSeconds: number,
): THREE.Vector3 {
  const { orbit } = definition;

  if (orbit.type === "earth-l2") {
    const distanceSceneUnits =
      orbitalDistanceToSceneUnits(
        orbit.distanceMeters ?? 1_500_000_000,
        body,
      );

    return ANTI_SUN_DIRECTION.clone().multiplyScalar(distanceSceneUnits);
  }

  if (orbit.type === "deep-space") {
    const distanceSceneUnits =
      orbitalDistanceToSceneUnits(
        orbit.distanceMeters ??
          geosynchronousOrbitRadiusMeters(
            body.primaryMassKg,
            body.defaultOrbitPeriodSeconds ?? EARTH_ROTATION_PERIOD,
          ),
        body,
      );
    const longitudeRad = THREE.MathUtils.degToRad(orbit.longitudeDeg ?? 0);
    const inclinationRad = THREE.MathUtils.degToRad(orbit.inclinationDeg ?? 0);
    const phaseRad = THREE.MathUtils.degToRad(orbit.phaseDeg ?? 0);
    const driftSpeed =
      orbit.driftPeriodSeconds && orbit.driftPeriodSeconds > 0
        ? (2 * Math.PI) / orbit.driftPeriodSeconds
        : 0;
    const angle = phaseRad + driftSpeed * timeSeconds;

    return ORBIT_POSITION.set(
      distanceSceneUnits * Math.cos(angle),
      0,
      distanceSceneUnits * Math.sin(angle),
    )
      .applyAxisAngle(ORBIT_X_AXIS, inclinationRad)
      .applyAxisAngle(ORBIT_Y_AXIS, longitudeRad)
      .clone();
  }

  const radiusSceneUnits =
    orbitalDistanceToSceneUnits(
      orbitalRadiusMeters(
        orbit,
        body.radiusMeters,
        body.primaryMassKg,
        body.defaultOrbitPeriodSeconds,
      ),
      body,
    );
  const inclinationRad = THREE.MathUtils.degToRad(orbit.inclinationDeg ?? 0);
  const ascendingNodeRad = THREE.MathUtils.degToRad(
    orbit.ascendingNodeDeg ?? 0,
  );
  const direction = orbit.direction ?? 1;
  const orbitRadius = orbitalRadiusMeters(
    orbit,
    body.radiusMeters,
    body.primaryMassKg,
    body.defaultOrbitPeriodSeconds,
  );
  let angularSpeed = 0;

  if (orbit.type === "geosynchronous") {
    angularSpeed =
      (2 * Math.PI) /
      (orbit.periodSeconds ??
        body.defaultOrbitPeriodSeconds ??
        EARTH_ROTATION_PERIOD);
  } else {
    const periodSeconds =
      orbit.periodSeconds ??
      2 *
        Math.PI *
        Math.sqrt(Math.pow(orbitRadius, 3) / (G * body.primaryMassKg));
    angularSpeed = (2 * Math.PI) / periodSeconds;
  }

  const phaseBaseDeg =
    orbit.type === "geosynchronous"
      ? (orbit.longitudeDeg ?? 0)
      : (orbit.phaseDeg ?? 0);
  const angle =
    THREE.MathUtils.degToRad(phaseBaseDeg) +
    direction * angularSpeed * timeSeconds;

  return ORBIT_POSITION.set(
    radiusSceneUnits * Math.cos(angle),
    0,
    radiusSceneUnits * Math.sin(angle),
  )
    .applyAxisAngle(ORBIT_X_AXIS, inclinationRad)
    .applyAxisAngle(ORBIT_Y_AXIS, ascendingNodeRad)
    .clone();
}

function orbitalDistanceToSceneUnits(
  orbitalDistanceMeters: number,
  body: SatelliteSystemBody,
) {
  return (
    body.renderRadiusSceneUnits +
    (orbitalDistanceMeters - body.radiusMeters) * ORBIT_METERS_TO_SCENE_UNITS
  );
}
