import * as THREE from 'three'
import { EARTH_MOON_DISTANCE, R_EARTH, R_MOON } from '../physics/bodies'

export const DISTANCE_SCALE = 1 / 2_000_000
const _SCALE = 1

export const EARTH_DRAW_RADIUS = R_EARTH * DISTANCE_SCALE * _SCALE
export const MOON_DRAW_RADIUS = R_MOON * DISTANCE_SCALE * _SCALE
export const ROCKET_DRAW_RADIUS = R_EARTH * DISTANCE_SCALE * _SCALE / 100

export type SceneObjects = {
  earth: THREE.Mesh
  earthAtmosphere: THREE.Mesh
  moon: THREE.Mesh
  rocket: THREE.Group
  launchRing: THREE.Mesh
  moonOrbit: THREE.Line
  trailLine: THREE.Line
  velocityArrow: THREE.ArrowHelper
  accelerationArrow: THREE.ArrowHelper
}

export function createSceneObjects(scene: THREE.Scene): SceneObjects {
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_DRAW_RADIUS, 64, 64),
    new THREE.MeshStandardMaterial({
      color: 0x2f7cff,
      roughness: 0.92,
      metalness: 0.02,
      emissive: 0x061c42,
      emissiveIntensity: 0.55,
    }),
  )
  scene.add(earth)

  const earthAtmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_DRAW_RADIUS * 1.08, 64, 64),
    new THREE.MeshBasicMaterial({
      color: 0x79d8ff,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    }),
  )
  scene.add(earthAtmosphere)

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(MOON_DRAW_RADIUS, 48, 48),
    new THREE.MeshStandardMaterial({
      color: 0xd5d4d0,
      roughness: 0.98,
      metalness: 0.01,
      emissive: 0x191919,
      emissiveIntensity: 0.15,
    }),
  )
  scene.add(moon)

  const rocket = new THREE.Group()
  const rocketMaterial = new THREE.MeshStandardMaterial({
    color: 0xe9eef7,
    roughness: 0.35,
    metalness: 0.35,
  })
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0xff8d5c,
    roughness: 0.5,
    metalness: 0.12,
  })
  const finMaterial = new THREE.MeshStandardMaterial({
    color: 0x5dc7ff,
    roughness: 0.42,
    metalness: 0.18,
    emissive: 0x102f4f,
    emissiveIntensity: 0.45,
  })
  const bodyRadius = ROCKET_DRAW_RADIUS * 0.42
  const bodyLength = ROCKET_DRAW_RADIUS * 5.5

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyLength, 18),
    rocketMaterial,
  )
  rocket.add(body)

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(bodyRadius * 1.15, ROCKET_DRAW_RADIUS * 1.8, 18),
    accentMaterial,
  )
  nose.position.y = bodyLength / 2 + (ROCKET_DRAW_RADIUS * 1.8) / 2
  rocket.add(nose)

  const engine = new THREE.Mesh(
    new THREE.CylinderGeometry(bodyRadius * 0.72, bodyRadius * 0.9, ROCKET_DRAW_RADIUS, 18),
    accentMaterial,
  )
  engine.position.y = -bodyLength / 2 - ROCKET_DRAW_RADIUS * 0.15
  rocket.add(engine)

  for (const side of [-1, 1] as const) {
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(
        ROCKET_DRAW_RADIUS * 0.18,
        ROCKET_DRAW_RADIUS * 1.2,
        ROCKET_DRAW_RADIUS * 0.9,
      ),
      finMaterial,
    )
    fin.position.set(
      side * bodyRadius * 0.95,
      -bodyLength / 2 + ROCKET_DRAW_RADIUS * 0.25,
      0,
    )
    rocket.add(fin)
  }

  scene.add(rocket)

  const launchRing = new THREE.Mesh(
    new THREE.TorusGeometry(ROCKET_DRAW_RADIUS * 3.4, ROCKET_DRAW_RADIUS * 0.16, 12, 42),
    new THREE.MeshBasicMaterial({
      color: 0xffc857,
      transparent: true,
      opacity: 0.9,
    }),
  )
  launchRing.position.set(0, EARTH_DRAW_RADIUS + ROCKET_DRAW_RADIUS * 0.4, 0)
  launchRing.rotation.x = Math.PI / 2
  scene.add(launchRing)

  const moonOrbitPoints: THREE.Vector3[] = []
  for (let i = 0; i <= 512; i += 1) {
    const theta = (i / 512) * Math.PI * 2
    moonOrbitPoints.push(
      new THREE.Vector3(
        EARTH_MOON_DISTANCE * Math.cos(theta) * DISTANCE_SCALE,
        EARTH_MOON_DISTANCE * Math.sin(theta) * DISTANCE_SCALE,
        0,
      ),
    )
  }

  const moonOrbit = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(moonOrbitPoints),
    new THREE.LineBasicMaterial({
      color: 0x4b5f82,
      transparent: true,
      opacity: 0.7,
    }),
  )
  scene.add(moonOrbit)

  const trailLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([]),
    new THREE.LineBasicMaterial({
      color: 0xffc857,
      transparent: true,
      opacity: 0.95,
    }),
  )
  scene.add(trailLine)

  const velocityArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(),
    0,
    0x4dd0ff,
    4,
    2,
  )
  scene.add(velocityArrow)

  const accelerationArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(),
    0,
    0xffdf6e,
    4,
    2,
  )
  scene.add(accelerationArrow)

  return {
    earth,
    earthAtmosphere,
    moon,
    rocket,
    launchRing,
    moonOrbit,
    trailLine,
    velocityArrow,
    accelerationArrow,
  }
}

export function metersToScene(v: THREE.Vector3): THREE.Vector3 {
  return v.clone().multiplyScalar(DISTANCE_SCALE)
}
