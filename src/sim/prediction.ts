import * as THREE from 'three'
import { moonPositionMeters, R_EARTH, R_MOON } from '../physics/bodies'
import { patchedConicAccelerationMeters } from '../physics/gravity'

export const PREDICTION_POINT_CAPACITY = 3200
export const PREDICTION_DT = 90
export const PREDICTION_REFRESH_INTERVAL_MS = 200

export type TrajectoryPredictionState = {
  t: number
  position: THREE.Vector3
  velocity: THREE.Vector3
}

type TrajectoryDerivative = {
  velocity: THREE.Vector3
  acceleration: THREE.Vector3
}

export function predictTrajectory(
  initialState: TrajectoryPredictionState,
  maxSteps: number = PREDICTION_POINT_CAPACITY,
  dt: number = PREDICTION_DT,
): THREE.Vector3[] {
  const points: THREE.Vector3[] = []
  let state = clonePredictionState(initialState)

  for (let step = 0; step < maxSteps; step += 1) {
    points.push(state.position.clone())

    if (isImpactingEarth(state.position) || isImpactingMoon(state.position, state.t)) {
      break
    }

    state = integratePredictionState(state, dt)
  }

  return points
}

function integratePredictionState(
  state: TrajectoryPredictionState,
  dt: number,
): TrajectoryPredictionState {
  const k1 = derivativeAt(state)
  const k2 = derivativeAt(offsetState(state, k1, dt * 0.5))
  const k3 = derivativeAt(offsetState(state, k2, dt * 0.5))
  const k4 = derivativeAt(offsetState(state, k3, dt))

  return {
    t: state.t + dt,
    position: state.position
      .clone()
      .addScaledVector(k1.velocity, dt / 6)
      .addScaledVector(k2.velocity, dt / 3)
      .addScaledVector(k3.velocity, dt / 3)
      .addScaledVector(k4.velocity, dt / 6),
    velocity: state.velocity
      .clone()
      .addScaledVector(k1.acceleration, dt / 6)
      .addScaledVector(k2.acceleration, dt / 3)
      .addScaledVector(k3.acceleration, dt / 3)
      .addScaledVector(k4.acceleration, dt / 6),
  }
}

function derivativeAt(state: TrajectoryPredictionState): TrajectoryDerivative {
  const moonPosition = moonPositionMeters(state.t)

  return {
    velocity: state.velocity.clone(),
    acceleration: patchedConicAccelerationMeters(state.position, moonPosition),
  }
}

function offsetState(
  state: TrajectoryPredictionState,
  derivative: TrajectoryDerivative,
  dt: number,
): TrajectoryPredictionState {
  return {
    t: state.t + dt,
    position: state.position.clone().addScaledVector(derivative.velocity, dt),
    velocity: state.velocity
      .clone()
      .addScaledVector(derivative.acceleration, dt),
  }
}

function clonePredictionState(
  state: TrajectoryPredictionState,
): TrajectoryPredictionState {
  return {
    t: state.t,
    position: state.position.clone(),
    velocity: state.velocity.clone(),
  }
}

function isImpactingEarth(position: THREE.Vector3): boolean {
  return position.length() <= R_EARTH
}

function isImpactingMoon(position: THREE.Vector3, t: number): boolean {
  const moonPosition = moonPositionMeters(t)
  return position.distanceTo(moonPosition) <= R_MOON
}
