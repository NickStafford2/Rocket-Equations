import * as THREE from "three";
import { REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS } from "../constants";
import whitePuffSpriteUrl from "../../../assets/Sprites/whitePuff00.png";

const SMOKE_POINT_CAPACITY = 8192;
const SMOKE_POINTS_PER_SAMPLE = 3;
const SMOKE_POINT_SIZE = REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 9;
const SMOKE_SAMPLE_SPACING = REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 0.6;
const SMOKE_SAMPLE_RADIUS = REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 0.35;
const SMOKE_COLOR = new THREE.Color(0xe6eaed);
const SMOKE_TEXTURE = new THREE.TextureLoader().load(whitePuffSpriteUrl);

type SmokeState = {
  count: number;
  lastSimTime: number;
  nextIndex: number;
  points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  positions: Float32Array;
  lastEmissionPosition: THREE.Vector3 | null;
};

type SmokeTrailGroup = THREE.Group & {
  userData: SmokeState;
};

const SAMPLE_POSITION = new THREE.Vector3();
const SEGMENT_VECTOR = new THREE.Vector3();
const JITTER_VECTOR = new THREE.Vector3();

function randomSigned(amount: number) {
  return (Math.random() - 0.5) * 2 * amount;
}

function clearSmokeTrail(smoke: SmokeTrailGroup) {
  smoke.userData.count = 0;
  smoke.userData.nextIndex = 0;
  smoke.userData.lastEmissionPosition = null;
  smoke.userData.points.geometry.setDrawRange(0, 0);
}

function appendSmokeSample(
  smoke: SmokeTrailGroup,
  position: THREE.Vector3,
) {
  for (let index = 0; index < SMOKE_POINTS_PER_SAMPLE; index += 1) {
    const offset = smoke.userData.nextIndex * 3;
    JITTER_VECTOR.set(
      randomSigned(SMOKE_SAMPLE_RADIUS),
      randomSigned(SMOKE_SAMPLE_RADIUS),
      randomSigned(SMOKE_SAMPLE_RADIUS),
    );
    smoke.userData.positions[offset] = position.x + JITTER_VECTOR.x;
    smoke.userData.positions[offset + 1] = position.y + JITTER_VECTOR.y;
    smoke.userData.positions[offset + 2] = position.z + JITTER_VECTOR.z;
    smoke.userData.nextIndex =
      (smoke.userData.nextIndex + 1) % SMOKE_POINT_CAPACITY;
    smoke.userData.count = Math.min(
      smoke.userData.count + 1,
      SMOKE_POINT_CAPACITY,
    );
  }

  smoke.userData.points.geometry.setDrawRange(0, smoke.userData.count);
  smoke.userData.points.geometry.getAttribute("position").needsUpdate = true;
}

export function createSmokeTrail(): THREE.Group {
  const smokeGroup = new THREE.Group() as SmokeTrailGroup;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(SMOKE_POINT_CAPACITY * 3);
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setDrawRange(0, 0);

  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: SMOKE_COLOR,
      map: SMOKE_TEXTURE,
      size: SMOKE_POINT_SIZE,
      transparent: true,
      opacity: 0.26,
      alphaTest: 0.05,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  points.frustumCulled = false;
  points.renderOrder = 1;

  smokeGroup.userData = {
    count: 0,
    lastSimTime: Number.NEGATIVE_INFINITY,
    nextIndex: 0,
    points,
    positions,
    lastEmissionPosition: null,
  };
  smokeGroup.add(points);

  return smokeGroup;
}

export function updateSmokeTrail(
  smoke: THREE.Group,
  exhaustPosition: THREE.Vector3,
  simTime: number,
  emitting: boolean,
): boolean {
  const smokeGroup = smoke as SmokeTrailGroup;

  if (simTime < smokeGroup.userData.lastSimTime) {
    clearSmokeTrail(smokeGroup);
  }
  smokeGroup.userData.lastSimTime = simTime;

  if (!emitting) {
    return smokeGroup.userData.count > 0;
  }

  if (smokeGroup.userData.lastEmissionPosition == null) {
    appendSmokeSample(smokeGroup, exhaustPosition);
    smokeGroup.userData.lastEmissionPosition = exhaustPosition.clone();
    return true;
  }

  SEGMENT_VECTOR
    .copy(exhaustPosition)
    .sub(smokeGroup.userData.lastEmissionPosition);
  const distance = SEGMENT_VECTOR.length();

  if (distance < SMOKE_SAMPLE_SPACING) {
    return smokeGroup.userData.count > 0;
  }

  const samples = Math.min(Math.ceil(distance / SMOKE_SAMPLE_SPACING), 64);

  for (let index = 1; index <= samples; index += 1) {
    SAMPLE_POSITION
      .copy(smokeGroup.userData.lastEmissionPosition)
      .lerp(exhaustPosition, index / samples);
    appendSmokeSample(smokeGroup, SAMPLE_POSITION);
  }

  smokeGroup.userData.lastEmissionPosition.copy(exhaustPosition);
  return true;
}
