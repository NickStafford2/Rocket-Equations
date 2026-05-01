import * as THREE from "three";
import { REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS } from "../constants";

const SMOKE_PARTICLE_COUNT = 48;
const CUBE_SIZE = REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 0.35;
const SMOKE_COLOR = new THREE.Color(0x808080);
const SMOKE_BASE_OPACITY = 0.28;
const SMOKE_FADE_STEP = 0.006;
const SMOKE_SPEED = REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 0.16;
const SMOKE_JITTER = REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 0.05;
const SMOKE_SPAWN_SPREAD = REFERENCE_ROCKET_RENDER_RADIUS_SCENE_UNITS * 0.08;

type SmokeParticleData = {
  life: number;
  velocity: THREE.Vector3;
};

type SmokeParticle = THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial> & {
  userData: SmokeParticleData;
};

type SmokeGroup = THREE.Group & {
  userData: {
    nextParticleIndex: number;
  };
};

const SPAWN_OFFSET = new THREE.Vector3();
const VELOCITY_OFFSET = new THREE.Vector3();

function randomSigned(amount: number) {
  return (Math.random() - 0.5) * 2 * amount;
}

function resetParticle(
  particle: SmokeParticle,
  exhaustPosition: THREE.Vector3,
  heading: THREE.Vector3,
) {
  particle.position.copy(exhaustPosition);
  particle.position.add(
    SPAWN_OFFSET.set(
      randomSigned(SMOKE_SPAWN_SPREAD),
      randomSigned(SMOKE_SPAWN_SPREAD),
      randomSigned(SMOKE_SPAWN_SPREAD),
    ),
  );
  particle.userData.velocity.copy(heading).multiplyScalar(-SMOKE_SPEED);
  particle.userData.velocity.add(
    VELOCITY_OFFSET.set(
      randomSigned(SMOKE_JITTER),
      randomSigned(SMOKE_JITTER),
      randomSigned(SMOKE_JITTER),
    ),
  );
  particle.userData.life = 1;
  particle.material.opacity = SMOKE_BASE_OPACITY;
  particle.visible = true;
}

export function createSmokeTrail(): THREE.Group {
  const smokeGroup = new THREE.Group() as SmokeGroup;
  smokeGroup.userData.nextParticleIndex = 0;

  for (let i = 0; i < SMOKE_PARTICLE_COUNT; i += 1) {
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE),
      new THREE.MeshBasicMaterial({
        color: SMOKE_COLOR,
        transparent: true,
        opacity: 0,
      }),
    ) as SmokeParticle;

    cube.visible = false;
    cube.userData = {
      life: 0,
      velocity: new THREE.Vector3(),
    };

    smokeGroup.add(cube);
  }

  return smokeGroup;
}

export function updateSmokeTrail(
  smoke: THREE.Group,
  exhaustPosition: THREE.Vector3,
  heading: THREE.Vector3,
  emitting: boolean,
): boolean {
  const smokeGroup = smoke as SmokeGroup;
  let hasVisibleParticles = false;

  for (const child of smoke.children) {
    const cube = child as SmokeParticle;

    if (!cube.visible) {
      continue;
    }

    cube.position.add(cube.userData.velocity);
    cube.userData.life -= SMOKE_FADE_STEP;
    cube.material.opacity = Math.max(cube.userData.life, 0) * SMOKE_BASE_OPACITY;

    if (cube.userData.life <= 0) {
      cube.visible = false;
      cube.material.opacity = 0;
      continue;
    }

    hasVisibleParticles = true;
  }

  if (emitting && smoke.children.length > 0) {
    const cube = smoke.children[
      smokeGroup.userData.nextParticleIndex % smoke.children.length
    ] as SmokeParticle;
    resetParticle(cube, exhaustPosition, heading);
    smokeGroup.userData.nextParticleIndex += 1;
    hasVisibleParticles = true;
  }

  return hasVisibleParticles;
}
