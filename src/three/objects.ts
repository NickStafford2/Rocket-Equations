import * as THREE from "three";
import { EARTH_MOON_DISTANCE, R_EARTH, R_MOON } from "../physics/bodies";
import earthTextureUrl from "../assets/textures/earth.jpg";
import moonTextureUrl from "../assets/textures/mercury.jpg";

export const DISTANCE_SCALE = 1 / 2_000_000;
const _SCALE = 1;

export const EARTH_DRAW_RADIUS = R_EARTH * DISTANCE_SCALE * _SCALE;
export const MOON_DRAW_RADIUS = R_MOON * DISTANCE_SCALE * _SCALE;
export const ROCKET_DRAW_RADIUS = (R_EARTH * DISTANCE_SCALE * _SCALE) / 100;

export type SceneObjects = {
  system: THREE.Group;
  earthGroup: THREE.Group;
  earth: THREE.Mesh;
  moon: THREE.Mesh;
  rocket: THREE.Group;
  enginePlume: THREE.Mesh;
  launchLocationArrow: THREE.ArrowHelper;
  launchRing: THREE.Mesh;
  launchTangentArrow: THREE.ArrowHelper;
  launchNormalArrow: THREE.ArrowHelper;
  launchAimArrow: THREE.ArrowHelper;
  moonOrbit: THREE.Line;
  trailLine: THREE.Line;
  velocityArrow: THREE.ArrowHelper;
  accelerationArrow: THREE.ArrowHelper;
};

export function createSceneObjects(scene: THREE.Scene): SceneObjects {
  const system = new THREE.Group();
  scene.add(system);

  const loader = new THREE.TextureLoader();
  const earthTexture = loader.load(earthTextureUrl);
  earthTexture.colorSpace = THREE.SRGBColorSpace;
  const moonTexture = loader.load(moonTextureUrl);
  moonTexture.colorSpace = THREE.SRGBColorSpace;

  const earthGroup = new THREE.Group();
  earthGroup.userData.focusLabel = "Earth";
  earthGroup.userData.focusRadius = EARTH_DRAW_RADIUS;
  system.add(earthGroup);

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_DRAW_RADIUS, 64, 64),
    new THREE.MeshStandardMaterial({
      map: earthTexture,
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.01,
      emissive: new THREE.Color(0, 0, 0),
    }),
  );
  earth.castShadow = true;
  earth.receiveShadow = true;
  earth.rotation.y = Math.PI * 1.15;
  earthGroup.add(earth);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(MOON_DRAW_RADIUS, 48, 48),
    new THREE.MeshStandardMaterial({
      map: moonTexture,
      color: new THREE.Color(0xc8c8c8),
      roughness: 0.85,
      metalness: 0.05,
      emissive: new THREE.Color(0, 0, 0),
    }),
  );
  moon.castShadow = true;
  moon.receiveShadow = true;
  moon.rotation.y = Math.PI * 0.35;
  moon.userData.focusLabel = "Moon";
  moon.userData.focusRadius = MOON_DRAW_RADIUS;
  system.add(moon);

  const rocket = new THREE.Group();
  rocket.userData.focusLabel = "Rocket";
  const rocketMaterial = new THREE.MeshStandardMaterial({
    color: 0xe9eef7,
    roughness: 0.35,
    metalness: 0.35,
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0xff8d5c,
    roughness: 0.5,
    metalness: 0.12,
  });
  const finMaterial = new THREE.MeshStandardMaterial({
    color: 0x5dc7ff,
    roughness: 0.42,
    metalness: 0.18,
    emissive: 0x102f4f,
    emissiveIntensity: 0.45,
  });
  const bodyRadius = ROCKET_DRAW_RADIUS * 0.42;
  const bodyLength = ROCKET_DRAW_RADIUS * 5.5;
  rocket.userData.focusRadius = bodyLength * 0.9;

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyLength, 18),
    rocketMaterial,
  );
  rocket.add(body);

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(bodyRadius * 1.15, ROCKET_DRAW_RADIUS * 1.8, 18),
    accentMaterial,
  );
  nose.position.y = bodyLength / 2 + (ROCKET_DRAW_RADIUS * 1.8) / 2;
  rocket.add(nose);

  const engine = new THREE.Mesh(
    new THREE.CylinderGeometry(
      bodyRadius * 0.72,
      bodyRadius * 0.9,
      ROCKET_DRAW_RADIUS,
      18,
    ),
    accentMaterial,
  );
  engine.position.y = -bodyLength / 2 - ROCKET_DRAW_RADIUS * 0.15;
  rocket.add(engine);

  const enginePlume = new THREE.Mesh(
    new THREE.ConeGeometry(bodyRadius * 0.82, ROCKET_DRAW_RADIUS * 2.8, 18),
    new THREE.MeshBasicMaterial({
      color: 0xffc857,
      transparent: true,
      opacity: 0.85,
    }),
  );
  enginePlume.rotation.z = Math.PI;
  enginePlume.position.y = -bodyLength / 2 - ROCKET_DRAW_RADIUS * 1.6;
  enginePlume.visible = false;
  rocket.add(enginePlume);

  for (const side of [-1, 1] as const) {
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(
        ROCKET_DRAW_RADIUS * 0.18,
        ROCKET_DRAW_RADIUS * 1.2,
        ROCKET_DRAW_RADIUS * 0.9,
      ),
      finMaterial,
    );
    fin.position.set(
      side * bodyRadius * 0.95,
      -bodyLength / 2 + ROCKET_DRAW_RADIUS * 0.25,
      0,
    );
    rocket.add(fin);
  }

  system.add(rocket);

  const launchLocationArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(),
    EARTH_DRAW_RADIUS + ROCKET_DRAW_RADIUS * 1.6,
    0xf472b6,
    6,
    3,
  );
  system.add(launchLocationArrow);

  const launchRing = new THREE.Mesh(
    new THREE.TorusGeometry(
      ROCKET_DRAW_RADIUS * 3.4,
      ROCKET_DRAW_RADIUS * 0.16,
      12,
      42,
    ),
    new THREE.MeshBasicMaterial({
      color: 0xffc857,
      transparent: true,
      opacity: 0.9,
    }),
  );
  launchRing.position.set(EARTH_DRAW_RADIUS + ROCKET_DRAW_RADIUS * 0.4, 0, 0);
  system.add(launchRing);

  const launchTangentArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(EARTH_DRAW_RADIUS + ROCKET_DRAW_RADIUS * 1.6, 0, 0),
    16,
    0x000,
    4,
    2,
  );
  system.add(launchTangentArrow);

  const launchNormalArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(EARTH_DRAW_RADIUS + ROCKET_DRAW_RADIUS * 1.6, 0, 0),
    16,
    0x7dffb2,
    4,
    2,
  );
  system.add(launchNormalArrow);

  const launchAimArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(EARTH_DRAW_RADIUS + ROCKET_DRAW_RADIUS * 1.6, 0, 0),
    18,
    0xff8d5c,
    5,
    2.5,
  );
  system.add(launchAimArrow);

  const moonOrbitPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 512; i += 1) {
    const theta = (i / 512) * Math.PI * 2;
    moonOrbitPoints.push(
      new THREE.Vector3(
        EARTH_MOON_DISTANCE * Math.cos(theta) * DISTANCE_SCALE,
        0,
        EARTH_MOON_DISTANCE * Math.sin(theta) * DISTANCE_SCALE,
      ),
    );
  }

  const moonOrbit = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(moonOrbitPoints),
    new THREE.LineBasicMaterial({
      color: 0x4b5f82,
      transparent: true,
      opacity: 0.7,
    }),
  );
  system.add(moonOrbit);

  const trailLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([]),
    new THREE.LineBasicMaterial({
      color: 0xffc857,
      transparent: true,
      opacity: 0.95,
    }),
  );
  system.add(trailLine);

  const velocityArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(),
    0,
    0x4dd0ff,
    4,
    2,
  );
  system.add(velocityArrow);

  const accelerationArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(),
    0,
    0xffdf6e,
    4,
    2,
  );
  system.add(accelerationArrow);

  return {
    system,
    earthGroup,
    earth,
    moon,
    rocket,
    enginePlume,
    launchLocationArrow,
    launchRing,
    launchTangentArrow,
    launchNormalArrow,
    launchAimArrow,
    moonOrbit,
    trailLine,
    velocityArrow,
    accelerationArrow,
  };
}

export function metersToScene(v: THREE.Vector3): THREE.Vector3 {
  return v.clone().multiplyScalar(DISTANCE_SCALE);
}
