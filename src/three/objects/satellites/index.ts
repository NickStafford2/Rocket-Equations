import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DISTANCE_SCALE } from "../constants";
import { createBodyLabelSprite } from "../labels";
import {
  geosynchronousOrbitRadiusMeters,
  SATELLITE_DEFINITIONS,
  type SatelliteDefinition,
} from "./catalog";

const MODEL_SIZE = new THREE.Vector3();

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

function createSatellite(definition: SatelliteDefinition): THREE.Group {
  const satellite = new THREE.Group();
  satellite.name = definition.id;
  satellite.userData.focusLabel = definition.label;

  const orbitRadiusMeters =
    definition.orbit.type === "geosynchronous"
      ? geosynchronousOrbitRadiusMeters(definition.orbit.periodSeconds)
      : geosynchronousOrbitRadiusMeters();
  const orbitRadiusSceneUnits = orbitRadiusMeters * DISTANCE_SCALE;
  const longitudeRad = THREE.MathUtils.degToRad(definition.orbit.longitudeDeg);

  satellite.position.set(
    orbitRadiusSceneUnits * Math.cos(longitudeRad),
    0,
    orbitRadiusSceneUnits * Math.sin(longitudeRad),
  );

  const modelRoot = new THREE.Group();
  satellite.add(modelRoot);
  loadSatelliteModel(modelRoot, definition);

  const label = createBodyLabelSprite(definition.label, {
    borderColor: "rgba(125, 211, 252, 0.9)",
  });
  label.position.set(0, definition.targetSizeSceneUnits * 2.4, 0);
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
      const scale = definition.targetSizeSceneUnits / maxDimension;
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
