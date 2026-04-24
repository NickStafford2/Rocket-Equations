import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EARTH_ROTATION_PERIOD, G, M_EARTH } from "../../../physics/bodies";
import dracoDecoderJsUrl from "three/examples/jsm/libs/draco/gltf/draco_decoder.js?url";
import { DISTANCE_SCALE } from "../constants";
import { createBodyLabelSprite } from "../labels";
import {
  orbitalRadiusMeters,
  geosynchronousOrbitRadiusMeters,
  SATELLITE_TARGET_SIZE_SCENE_UNITS,
  SATELLITE_DEFINITIONS,
  type SatelliteDefinition,
} from "./catalog";
import { SUN_POSITION } from "../../sun";

const MODEL_SIZE = new THREE.Vector3();
const ORBIT_POSITION = new THREE.Vector3();
const ORBIT_X_AXIS = new THREE.Vector3(1, 0, 0);
const ORBIT_Y_AXIS = new THREE.Vector3(0, 1, 0);
const SUN_DIRECTION = SUN_POSITION.clone().normalize();
const ANTI_SUN_DIRECTION = SUN_DIRECTION.clone().multiplyScalar(-1);
const DRACO_DECODER_PATH = dracoDecoderJsUrl.replace(/draco_decoder\.js(?:\?.*)?$/, "");

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderConfig({ type: "js" });
dracoLoader.setDecoderPath(DRACO_DECODER_PATH);

export function createSatelliteSystem() {
  const satelliteSystem = new THREE.Group();
  satelliteSystem.name = "satellite-system";

  for (const definition of SATELLITE_DEFINITIONS) {
    satelliteSystem.add(createSatellite(definition));
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

    satellite.position.copy(resolveSatellitePosition(definition, timeSeconds));
  }
}

function createSatellite(definition: SatelliteDefinition): THREE.Group {
  const satellite = new THREE.Group();
  satellite.name = definition.id;
  satellite.userData.focusLabel = definition.label;
  satellite.userData.satelliteDefinition = definition;
  satellite.position.copy(resolveSatellitePosition(definition, 0));

  const modelRoot = new THREE.Group();
  satellite.add(modelRoot);
  loadSatelliteModel(modelRoot, definition);

  const label = createBodyLabelSprite(definition.label, {
    borderColor: "rgba(125, 211, 252, 0.9)",
  });
  label.position.set(0, SATELLITE_TARGET_SIZE_SCENE_UNITS * 2.4, 0);
  label.scale.set(4.5, 1.7, 1);
  label.visible = true;
  satellite.add(label);

  return satellite;
}

function loadSatelliteModel(
  modelRoot: THREE.Group,
  definition: SatelliteDefinition,
) {
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  loader.load(
    definition.modelUrl,
    (gltf) => {
      const satelliteModel = gltf.scene;

      satelliteModel.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) {
          return;
        }

        mesh.castShadow = true;
        mesh.receiveShadow = true;
      });

      modelRoot.clear();
      modelRoot.add(satelliteModel);

      modelRoot.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(modelRoot);
      const size = bounds.getSize(MODEL_SIZE);
      const maxDimension = Math.max(size.x, size.y, size.z, 1e-6);
      const scale = SATELLITE_TARGET_SIZE_SCENE_UNITS / maxDimension;
      modelRoot.scale.setScalar(scale);

      modelRoot.rotation.x = Math.PI * 0.5;
      modelRoot.rotation.z = Math.PI;
    },
    undefined,
    (error) => {
      console.error(`Failed to load satellite model "${definition.label}".`, error);
    },
  );
}

function resolveSatellitePosition(
  definition: SatelliteDefinition,
  timeSeconds: number,
): THREE.Vector3 {
  const { orbit } = definition;

  if (orbit.type === "earth-l2") {
    const distanceSceneUnits =
      (orbit.distanceMeters ?? 1_500_000_000) * DISTANCE_SCALE;

    return ANTI_SUN_DIRECTION.clone().multiplyScalar(distanceSceneUnits);
  }

  if (orbit.type === "deep-space") {
    const distanceSceneUnits =
      (orbit.distanceMeters ?? geosynchronousOrbitRadiusMeters()) * DISTANCE_SCALE;
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

  const radiusSceneUnits = orbitalRadiusMeters(orbit) * DISTANCE_SCALE;
  const inclinationRad = THREE.MathUtils.degToRad(orbit.inclinationDeg ?? 0);
  const ascendingNodeRad = THREE.MathUtils.degToRad(orbit.ascendingNodeDeg ?? 0);
  const direction = orbit.direction ?? 1;
  const orbitRadius = orbitalRadiusMeters(orbit);
  let angularSpeed = 0;

  if (orbit.type === "geosynchronous") {
    angularSpeed = (2 * Math.PI) / (orbit.periodSeconds ?? EARTH_ROTATION_PERIOD);
  } else {
    const periodSeconds =
      orbit.periodSeconds ??
      (2 * Math.PI * Math.sqrt(Math.pow(orbitRadius, 3) / (G * M_EARTH)));
    angularSpeed = (2 * Math.PI) / periodSeconds;
  }

  const phaseBaseDeg =
    orbit.type === "geosynchronous"
      ? orbit.longitudeDeg ?? 0
      : orbit.phaseDeg ?? 0;
  const angle = THREE.MathUtils.degToRad(phaseBaseDeg) + direction * angularSpeed * timeSeconds;

  return ORBIT_POSITION.set(
    radiusSceneUnits * Math.cos(angle),
    0,
    radiusSceneUnits * Math.sin(angle),
  )
    .applyAxisAngle(ORBIT_X_AXIS, inclinationRad)
    .applyAxisAngle(ORBIT_Y_AXIS, ascendingNodeRad)
    .clone();
}
