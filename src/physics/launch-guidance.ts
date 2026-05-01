import * as THREE from "three";

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const CURRENT_HEADING = new THREE.Vector3();
const TARGET_HEADING = new THREE.Vector3();
const CROSS_VECTOR = new THREE.Vector3();

export function rotateHeadingTowardTargetInPlane(
  heading: THREE.Vector3,
  targetDirection: THREE.Vector3,
  maxTurnDeg: number,
): THREE.Vector3 {
  CURRENT_HEADING.copy(heading).setY(0);
  TARGET_HEADING.copy(targetDirection).setY(0);

  if (CURRENT_HEADING.lengthSq() <= 1e-9) {
    CURRENT_HEADING.copy(TARGET_HEADING);
  } else {
    CURRENT_HEADING.normalize();
  }

  if (TARGET_HEADING.lengthSq() <= 1e-9) {
    return CURRENT_HEADING.clone();
  }
  TARGET_HEADING.normalize();

  const angleToTarget = CURRENT_HEADING.angleTo(TARGET_HEADING);
  if (angleToTarget <= 1e-9) {
    return TARGET_HEADING.clone();
  }

  const turnStepRad = Math.min(
    angleToTarget,
    THREE.MathUtils.degToRad(Math.max(maxTurnDeg, 0)),
  );
  const turnSign =
    CROSS_VECTOR.crossVectors(CURRENT_HEADING, TARGET_HEADING).y >= 0 ? 1 : -1;

  return CURRENT_HEADING
    .clone()
    .applyAxisAngle(WORLD_UP, turnSign * turnStepRad)
    .normalize();
}
