import * as THREE from 'three'
import { moonPositionMeters, R_EARTH, R_MOON } from './bodies'
import type { SimulationState } from './bodies'
import { gravitationalAccelerationMeters } from './gravity'

export function stepSimulation(
  state: SimulationState,
  dt: number,
): SimulationState {
  if (state.hit) return state

  const next: SimulationState = {
    t: state.t,
    rocket: {
      position: state.rocket.position.clone(),
      velocity: state.rocket.velocity.clone(),
      acceleration: state.rocket.acceleration.clone(),
    },
    hit: state.hit,
  }

  const moonPos = moonPositionMeters(next.t)
  const initialAcceleration = gravitationalAccelerationMeters(
    next.rocket.position,
    moonPos,
  )

  next.rocket.position
    .add(next.rocket.velocity.clone().multiplyScalar(dt))
    .add(initialAcceleration.clone().multiplyScalar(0.5 * dt * dt))

  const nextTime = next.t + dt
  const nextMoonPos = moonPositionMeters(nextTime)
  const nextAcceleration = gravitationalAccelerationMeters(
    next.rocket.position,
    nextMoonPos,
  )

  next.rocket.velocity.add(
    initialAcceleration.add(nextAcceleration).multiplyScalar(0.5 * dt),
  )
  next.rocket.acceleration.copy(nextAcceleration)
  next.t = nextTime

  const earthDistance = next.rocket.position.length()
  const moonDistance = next.rocket.position.clone().sub(nextMoonPos).length()

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
