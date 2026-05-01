import * as THREE from "three";
import { moonPositionMeters, R_EARTH, R_MOON } from "../physics/bodies";
import { patchedConicAccelerationMeters } from "../physics/gravity";

export const PREDICTION_POINT_CAPACITY = 3200;
export const PREDICTION_STEP_DT_SECONDS = 90;
export const PREDICTION_REFRESH_INTERVAL_MS = 200;

export type TrajectoryPredictionState = {
  t: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
};

type TrajectoryDerivative = {
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
};

export function predictTrajectory(
  initialState: TrajectoryPredictionState,
  maxSteps: number = PREDICTION_POINT_CAPACITY,
  stepDtSeconds: number = PREDICTION_STEP_DT_SECONDS,
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  let state = clonePredictionState(initialState);

  for (let step = 0; step < maxSteps; step += 1) {
    points.push(state.position.clone());

    if (
      isImpactingEarth(state.position) ||
      isImpactingMoon(state.position, state.t)
    ) {
      break;
    }

    state = integratePredictionState(state, stepDtSeconds);
  }

  return points;
}

function integratePredictionState(
  state: TrajectoryPredictionState,
  stepDtSeconds: number,
): TrajectoryPredictionState {
  const k1 = derivativeAt(state);
  const k2 = derivativeAt(offsetState(state, k1, stepDtSeconds * 0.5));
  const k3 = derivativeAt(offsetState(state, k2, stepDtSeconds * 0.5));
  const k4 = derivativeAt(offsetState(state, k3, stepDtSeconds));

  return {
    t: state.t + stepDtSeconds,
    position: state.position
      .clone()
      .addScaledVector(k1.velocity, stepDtSeconds / 6)
      .addScaledVector(k2.velocity, stepDtSeconds / 3)
      .addScaledVector(k3.velocity, stepDtSeconds / 3)
      .addScaledVector(k4.velocity, stepDtSeconds / 6),
    velocity: state.velocity
      .clone()
      .addScaledVector(k1.acceleration, stepDtSeconds / 6)
      .addScaledVector(k2.acceleration, stepDtSeconds / 3)
      .addScaledVector(k3.acceleration, stepDtSeconds / 3)
      .addScaledVector(k4.acceleration, stepDtSeconds / 6),
  };
}

function derivativeAt(state: TrajectoryPredictionState): TrajectoryDerivative {
  const moonPosition = moonPositionMeters(state.t);

  return {
    velocity: state.velocity.clone(),
    acceleration: patchedConicAccelerationMeters(state.position, moonPosition),
  };
}

function offsetState(
  state: TrajectoryPredictionState,
  derivative: TrajectoryDerivative,
  stepDtSeconds: number,
): TrajectoryPredictionState {
  return {
    t: state.t + stepDtSeconds,
    position: state.position
      .clone()
      .addScaledVector(derivative.velocity, stepDtSeconds),
    velocity: state.velocity
      .clone()
      .addScaledVector(derivative.acceleration, stepDtSeconds),
  };
}

function clonePredictionState(
  state: TrajectoryPredictionState,
): TrajectoryPredictionState {
  return {
    t: state.t,
    position: state.position.clone(),
    velocity: state.velocity.clone(),
  };
}

function isImpactingEarth(position: THREE.Vector3): boolean {
  return position.length() <= R_EARTH;
}

function isImpactingMoon(position: THREE.Vector3, t: number): boolean {
  const moonPosition = moonPositionMeters(t);
  return position.distanceTo(moonPosition) <= R_MOON;
}
