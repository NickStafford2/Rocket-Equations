import * as THREE from 'three'
import { G, M_EARTH, M_MOON, MOON_SOI_RADIUS } from './bodies'

export function gravitationalAccelerationMeters(
  rocketPosition: THREE.Vector3,
  moonPosition: THREE.Vector3,
): THREE.Vector3 {
  const rEarth = rocketPosition.clone()
  const rMoon = rocketPosition.clone().sub(moonPosition)

  const earthDistance = Math.max(rEarth.length(), 1)
  const moonDistance = Math.max(rMoon.length(), 1)

  const aEarth = rEarth
    .clone()
    .multiplyScalar((-G * M_EARTH) / Math.pow(earthDistance, 3))

  const aMoon = rMoon
    .clone()
    .multiplyScalar((-G * M_MOON) / Math.pow(moonDistance, 3))

  return aEarth.add(aMoon)
}

export function patchedConicAccelerationMeters(
  rocketPosition: THREE.Vector3,
  moonPosition: THREE.Vector3,
): THREE.Vector3 {
  const toMoon = moonPosition.clone().sub(rocketPosition)
  const moonDistance = Math.max(toMoon.length(), 1)

  if (moonDistance <= MOON_SOI_RADIUS) {
    return toMoon.multiplyScalar((G * M_MOON) / Math.pow(moonDistance, 3))
  }

  const earthDistance = Math.max(rocketPosition.length(), 1)
  return rocketPosition
    .clone()
    .multiplyScalar((-G * M_EARTH) / Math.pow(earthDistance, 3))
}
