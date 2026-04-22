import * as THREE from 'three'
import {
  DEFAULT_THRUST_ACCELERATION,
  DEFAULT_TURN_RATE_DEG,
  moonPositionMeters,
  moonVelocityMeters,
  R_EARTH,
  R_MOON,
  SOFT_LANDING_SPEED,
} from './bodies'
import type { ManeuverInput } from './bodies'
import type { SimulationState } from './bodies'
import { gravitationalAccelerationMeters } from './gravity'

function rotateHeading(
  heading: THREE.Vector3,
  turn: ManeuverInput['turn'],
  dt: number,
  turnRateDeg: number,
): THREE.Vector3 {
  const planarHeading = heading.clone().setY(0)
  if (planarHeading.lengthSq() <= 1e-9) {
    planarHeading.set(1, 0, 0)
  } else {
    planarHeading.normalize()
  }

  if (turn === 0) return planarHeading

  return planarHeading
    .applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      THREE.MathUtils.degToRad(turn * turnRateDeg * dt),
    )
    .normalize()
}

export function stepSimulation(
  state: SimulationState,
  dt: number,
  input: ManeuverInput,
  thrustAcceleration: number = DEFAULT_THRUST_ACCELERATION,
  turnRateDeg: number = DEFAULT_TURN_RATE_DEG,
): SimulationState {
  if (state.impact) return state

  const heading = rotateHeading(state.rocket.heading, input.turn, dt, turnRateDeg)
  const thrustVector = input.thrusting
    ? heading.clone().multiplyScalar(thrustAcceleration)
    : new THREE.Vector3()

  const next: SimulationState = {
    t: state.t,
    rocket: {
      position: state.rocket.position.clone(),
      velocity: state.rocket.velocity.clone(),
      acceleration: state.rocket.acceleration.clone(),
      heading,
    },
    impact: state.impact,
  }

  const moonPos = moonPositionMeters(next.t)
  const initialAcceleration = gravitationalAccelerationMeters(
    next.rocket.position,
    moonPos,
  ).add(thrustVector.clone())

  next.rocket.position
    .add(next.rocket.velocity.clone().multiplyScalar(dt))
    .add(initialAcceleration.clone().multiplyScalar(0.5 * dt * dt))

  const nextTime = next.t + dt
  const nextMoonPos = moonPositionMeters(nextTime)
  const nextAcceleration = gravitationalAccelerationMeters(
    next.rocket.position,
    nextMoonPos,
  ).add(thrustVector)

  next.rocket.velocity.add(
    initialAcceleration.add(nextAcceleration).multiplyScalar(0.5 * dt),
  )
  next.rocket.acceleration.copy(nextAcceleration)
  next.t = nextTime

  const earthDistance = next.rocket.position.length()
  const moonDistance = next.rocket.position.clone().sub(nextMoonPos).length()
  const moonRelativeVelocity = next.rocket.velocity
    .clone()
    .sub(moonVelocityMeters(nextTime))
  const moonRelativeSpeed = moonRelativeVelocity.length()

  if (earthDistance <= R_EARTH) {
    next.impact = {
      target: 'earth',
      speed: next.rocket.velocity.length(),
      relativeSpeed: next.rocket.velocity.length(),
      softLanding: false,
    }
  } else if (moonDistance <= R_MOON) {
    next.impact = {
      target: 'moon',
      speed: next.rocket.velocity.length(),
      relativeSpeed: moonRelativeSpeed,
      softLanding: moonRelativeSpeed <= SOFT_LANDING_SPEED,
    }
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
