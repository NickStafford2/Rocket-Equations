import * as THREE from "three";
import { PREDICTION_POINT_CAPACITY } from "../../sim/prediction";
import { TRAIL_POINT_CAPACITY } from "../../sim/trail";

export function createTrailLine() {
  const trailGeometry = new THREE.BufferGeometry();
  trailGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      new Float32Array(TRAIL_POINT_CAPACITY * 3),
      3,
    ).setUsage(THREE.DynamicDrawUsage),
  );
  trailGeometry.setDrawRange(0, 0);

  const trailLine = new THREE.Line(
    trailGeometry,
    new THREE.LineBasicMaterial({
      color: 0xffc857,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    }),
  );
  trailLine.frustumCulled = false;
  trailLine.renderOrder = 2;

  return trailLine;
}

export function createPredictionLine() {
  const predictionGeometry = new THREE.BufferGeometry();
  predictionGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      new Float32Array(PREDICTION_POINT_CAPACITY * 3),
      3,
    ).setUsage(THREE.DynamicDrawUsage),
  );
  predictionGeometry.setDrawRange(0, 0);

  const predictionLine = new THREE.Line(
    predictionGeometry,
    new THREE.LineBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    }),
  );
  predictionLine.frustumCulled = false;
  predictionLine.renderOrder = 1;

  return predictionLine;
}
