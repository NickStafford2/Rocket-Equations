import * as THREE from "three";
import { EARTH_DRAW_RADIUS, ROCKET_DRAW_RADIUS } from "./constants";

export function createRocketObjects() {
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

  const thrustDirectionArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(),
    ROCKET_DRAW_RADIUS * 10,
    0x7dffb2,
    ROCKET_DRAW_RADIUS * 2.8,
    ROCKET_DRAW_RADIUS * 1.4,
  );

  const launchLocationArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(),
    EARTH_DRAW_RADIUS + ROCKET_DRAW_RADIUS * 1.6,
    0xf472b6,
    6,
    3,
  );

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

  const launchTangentArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(EARTH_DRAW_RADIUS + ROCKET_DRAW_RADIUS * 1.6, 0, 0),
    16,
    0x000,
    4,
    2,
  );

  const launchAimArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(EARTH_DRAW_RADIUS + ROCKET_DRAW_RADIUS * 1.6, 0, 0),
    18,
    0xff8d5c,
    5,
    2.5,
  );

  return {
    rocket,
    enginePlume,
    thrustDirectionArrow,
    launchLocationArrow,
    launchRing,
    launchTangentArrow,
    launchAimArrow,
  };
}
