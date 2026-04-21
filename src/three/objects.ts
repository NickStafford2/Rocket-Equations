import * as THREE from 'three'
import { EARTH_MOON_DISTANCE, R_EARTH, R_MOON } from '../physics/bodies'

export const DISTANCE_SCALE = 1 / 2_000_000

export const EARTH_DRAW_RADIUS = R_EARTH * DISTANCE_SCALE * 8
export const MOON_DRAW_RADIUS = R_MOON * DISTANCE_SCALE * 20
export const ROCKET_DRAW_RADIUS = R_EARTH * DISTANCE_SCALE * 2.2

export type SceneObjects = {
  earth: THREE.Mesh
  moon: THREE.Mesh
  rocket: THREE.Mesh
  moonOrbit: THREE.Line
  trailLine: THREE.Line
  velocityArrow: THREE.ArrowHelper
  accelerationArrow: THREE.ArrowHelper
}

export function createSceneObjects(scene: THREE.Scene): SceneObjects {
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_DRAW_RADIUS, 64, 64),
    new THREE.MeshPhongMaterial({ color: 0x2d7dff, shininess: 25 }),
  )
  scene.add(earth)

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(MOON_DRAW_RADIUS, 48, 48),
    new THREE.MeshPhongMaterial({ color: 0xd8d8d8, shininess: 10 }),
  )
  scene.add(moon)

  const rocket = new THREE.Mesh(
    new THREE.SphereGeometry(ROCKET_DRAW_RADIUS, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xff5e57 }),
  )
  scene.add(rocket)

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
    new THREE.LineBasicMaterial({ color: 0x44536a }),
  )
  scene.add(moonOrbit)

  const trailLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([]),
    new THREE.LineBasicMaterial({ color: 0xffc857 }),
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
    moon,
    rocket,
    moonOrbit,
    trailLine,
    velocityArrow,
    accelerationArrow,
  }
}

export function metersToScene(v: THREE.Vector3): THREE.Vector3 {
  return v.clone().multiplyScalar(DISTANCE_SCALE)
}
