import * as THREE from 'three'
import { moonPositionMeters, R_EARTH, R_MOON } from './bodies'
import type { SimulationState } from './bodies'
import { gravitationalAccelerationMeters } from './gravity'

export function stepSimulation(
  state: SimulationState,
  dt: number,
): SimulationState {
  if (state.hit) return state

  const next = {
    t: state.t,
    rocket: {
      position: state.rocket.position.clone(),
      velocity: state.rocket.velocity.clone(),
      acceleration: state.rocket.acceleration.clone(),
    },
    hit: state.hit,
  } satisfies SimulationState

  const moonPos = moonPositionMeters(next.t)
  next.rocket.acceleration = gravitationalAccelerationMeters(
    next.rocket.position,
    moonPos,
  )

  // Semi-implicit Euler
  next.rocket.velocity.add(next.rocket.acceleration.clone().multiplyScalar(dt))
  next.rocket.position.add(next.rocket.velocity.clone().multiplyScalar(dt))
  next.t += dt

  const earthDistance = next.rocket.position.length()
  const moonDistance = next.rocket.position.clone().sub(moonPos).length()

  if (earthDistance <= R_EARTH) {
    next.hit = 'earth'
  } else if (moonDistance <= R_MOON) {
    next.hit = 'moon'
  }

  return next
}

export function altitudeAboveEarth(position: THREE.Vector3, earthRadius: number): number {
  return position.length() - earthRadius
}

export function altitudeAboveMoon(
  rocketPosition: THREE.Vector3,
  moonPosition: THREE.Vector3,
  moonRadius: number,
): number {
  return rocketPosition.clone().sub(moonPosition).length() - moonRadius
}
