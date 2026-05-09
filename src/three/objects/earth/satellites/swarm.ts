import * as THREE from "three";
import type { SatelliteDefinition } from "./catalog";
import {
  compileSatelliteOrbit,
  createDeterministicSatelliteQuaternion,
  getSatelliteTargetSize,
  resolveCompiledSatellitePosition,
  type CompiledSatelliteOrbit,
  type SatelliteSystemBody,
} from "./orbit";

const POSITION = new THREE.Vector3();
const SCALE = new THREE.Vector3();
const INSTANCE_MATRIX = new THREE.Matrix4();
const BODY_MATRIX = new THREE.Matrix4();
const LEFT_PANEL_MATRIX = new THREE.Matrix4();
const RIGHT_PANEL_MATRIX = new THREE.Matrix4();

const BODY_LOCAL_MATRIX = new THREE.Matrix4();
const LEFT_PANEL_LOCAL_MATRIX = new THREE.Matrix4().makeTranslation(
  -0.88,
  0,
  0,
);
const RIGHT_PANEL_LOCAL_MATRIX = new THREE.Matrix4().makeTranslation(
  0.88,
  0,
  0,
);

type SatelliteSwarmRecord = {
  definition: SatelliteDefinition;
  orbit: CompiledSatelliteOrbit;
  quaternion: THREE.Quaternion;
  targetSize: number;
};

type SatelliteSwarmUserData = {
  records: SatelliteSwarmRecord[];
  bodyMesh: THREE.InstancedMesh;
  leftPanelMesh: THREE.InstancedMesh;
  rightPanelMesh: THREE.InstancedMesh;
};

export function createSatelliteSwarm(
  definitions: SatelliteDefinition[],
  body: SatelliteSystemBody,
): THREE.Group {
  const swarmGroup = new THREE.Group();
  swarmGroup.name = "satellite-swarm";

  const count = definitions.length;

  if (count === 0) {
    swarmGroup.visible = false;
    return swarmGroup;
  }

  const records = definitions.map((definition) => ({
    definition,
    orbit: compileSatelliteOrbit(definition, body),
    quaternion: createDeterministicSatelliteQuaternion(definition.id),
    targetSize: getSatelliteTargetSize(definition, body),
  }));

  const bodyMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 0.45, 0.45),
    new THREE.MeshStandardMaterial({
      roughness: 0.7,
      metalness: 0.45,
    }),
    count,
  );

  const leftPanelMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.7, 0.035, 0.42),
    new THREE.MeshStandardMaterial({
      roughness: 0.55,
      metalness: 0.2,
    }),
    count,
  );

  const rightPanelMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.7, 0.035, 0.42),
    new THREE.MeshStandardMaterial({
      roughness: 0.55,
      metalness: 0.2,
    }),
    count,
  );

  for (const mesh of [bodyMesh, leftPanelMesh, rightPanelMesh]) {
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.frustumCulled = false;
  }

  swarmGroup.add(bodyMesh, leftPanelMesh, rightPanelMesh);

  swarmGroup.userData.records = records satisfies SatelliteSwarmRecord[];
  swarmGroup.userData.bodyMesh = bodyMesh;
  swarmGroup.userData.leftPanelMesh = leftPanelMesh;
  swarmGroup.userData.rightPanelMesh = rightPanelMesh;

  syncSatelliteSwarm(swarmGroup, 0);

  return swarmGroup;
}

export function syncSatelliteSwarm(
  swarmGroup: THREE.Group,
  timeSeconds: number,
): void {
  const userData = swarmGroup.userData as Partial<SatelliteSwarmUserData>;

  if (
    !userData.records ||
    !userData.bodyMesh ||
    !userData.leftPanelMesh ||
    !userData.rightPanelMesh
  ) {
    return;
  }

  for (let index = 0; index < userData.records.length; index += 1) {
    const record = userData.records[index];

    resolveCompiledSatellitePosition(record.orbit, timeSeconds, POSITION);
    SCALE.setScalar(record.targetSize);

    INSTANCE_MATRIX.compose(POSITION, record.quaternion, SCALE);

    BODY_MATRIX.multiplyMatrices(INSTANCE_MATRIX, BODY_LOCAL_MATRIX);
    LEFT_PANEL_MATRIX.multiplyMatrices(
      INSTANCE_MATRIX,
      LEFT_PANEL_LOCAL_MATRIX,
    );
    RIGHT_PANEL_MATRIX.multiplyMatrices(
      INSTANCE_MATRIX,
      RIGHT_PANEL_LOCAL_MATRIX,
    );

    userData.bodyMesh.setMatrixAt(index, BODY_MATRIX);
    userData.leftPanelMesh.setMatrixAt(index, LEFT_PANEL_MATRIX);
    userData.rightPanelMesh.setMatrixAt(index, RIGHT_PANEL_MATRIX);
  }

  userData.bodyMesh.instanceMatrix.needsUpdate = true;
  userData.leftPanelMesh.instanceMatrix.needsUpdate = true;
  userData.rightPanelMesh.instanceMatrix.needsUpdate = true;
}
