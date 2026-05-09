import * as THREE from "three";
import {
  DEFAULT_THRUST_ACCELERATION,
  DEFAULT_TURN_RATE_DEG,
  MIN_NEAR_EARTH_ORBIT_SPEED_METERS_PER_SECOND,
  moonPositionMeters,
  moonVelocityMeters,
  R_EARTH,
  R_MOON,
  SOFT_LANDING_SPEED,
} from "./bodies";
import type { ManeuverInput } from "./bodies";
import type { SimulationState } from "./bodies";
import { gravitationalAccelerationMeters } from "./gravity";
import { resolveRocketHeading } from "./heading-control";

const GUIDANCE_ANGLE_TOLERANCE_DEG = 0.75;
const GUIDANCE_SPEED_TOLERANCE_METERS_PER_SECOND = 10;

export function stepSimulation(
  state: SimulationState,
  timeStepSeconds: number,
  input: ManeuverInput,
  targetSpeed: number,
  thrustAcceleration: number = DEFAULT_THRUST_ACCELERATION,
  turnRateDeg: number = DEFAULT_TURN_RATE_DEG,
  surfaceContactOffsetMeters: number = 0,
  controlTimeWarp: number = 1,
): SimulationState {
  if (state.impact) return state;

  const requiredGuidanceSpeed = Math.max(
    targetSpeed,
    MIN_NEAR_EARTH_ORBIT_SPEED_METERS_PER_SECOND,
  );
  const { heading, autopilotActive } = resolveRocketHeading({
    state,
    input,
    turnRateDeg,
    timeStepSeconds,
    controlTimeWarp,
  });
  const directionReached =
    THREE.MathUtils.radToDeg(heading.angleTo(state.targetDirection)) <=
    GUIDANCE_ANGLE_TOLERANCE_DEG;
  const speedReached =
    state.rocket.velocity.length() + GUIDANCE_SPEED_TOLERANCE_METERS_PER_SECOND >=
    requiredGuidanceSpeed;
  const guidanceComplete = state.guidanceComplete || (directionReached && speedReached);
  const thrusting = autopilotActive ? !guidanceComplete : input.thrusting;
  const thrustVector = thrusting
    ? heading.clone().multiplyScalar(thrustAcceleration)
    : new THREE.Vector3();

  const next: SimulationState = {
    t: state.t,
    rocket: {
      position: state.rocket.position.clone(),
      velocity: state.rocket.velocity.clone(),
      acceleration: state.rocket.acceleration.clone(),
      heading,
    },
    targetDirection: state.targetDirection.clone(),
    thrusting,
    guidanceComplete,
    impact: state.impact,
  };

  const moonPos = moonPositionMeters(next.t);
  const initialAcceleration = gravitationalAccelerationMeters(
    next.rocket.position,
    moonPos,
  ).add(thrustVector.clone());

  next.rocket.position
    .add(next.rocket.velocity.clone().multiplyScalar(timeStepSeconds))
    .add(
      initialAcceleration
        .clone()
        .multiplyScalar(0.5 * timeStepSeconds * timeStepSeconds),
    );

  const nextTime = next.t + timeStepSeconds;
  const nextMoonPos = moonPositionMeters(nextTime);
  const nextAcceleration = gravitationalAccelerationMeters(
    next.rocket.position,
    nextMoonPos,
  ).add(thrustVector);

  next.rocket.velocity.add(
    initialAcceleration
      .add(nextAcceleration)
      .multiplyScalar(0.5 * timeStepSeconds),
  );
  next.rocket.acceleration.copy(nextAcceleration);
  next.t = nextTime;
  next.guidanceComplete =
    next.guidanceComplete ||
    (THREE.MathUtils.radToDeg(next.rocket.heading.angleTo(next.targetDirection)) <=
      GUIDANCE_ANGLE_TOLERANCE_DEG &&
      next.rocket.velocity.length() +
        GUIDANCE_SPEED_TOLERANCE_METERS_PER_SECOND >=
        requiredGuidanceSpeed);
  next.thrusting = autopilotActive ? !next.guidanceComplete : input.thrusting;

  const earthDistance = next.rocket.position.length();
  const moonDistance = next.rocket.position.clone().sub(nextMoonPos).length();
  const moonRelativeVelocity = next.rocket.velocity
    .clone()
    .sub(moonVelocityMeters(nextTime));
  const moonRelativeSpeed = moonRelativeVelocity.length();

  if (earthDistance <= R_EARTH + surfaceContactOffsetMeters) {
    next.impact = {
      target: "earth",
      speed: next.rocket.velocity.length(),
      relativeSpeed: next.rocket.velocity.length(),
      softLanding: false,
    };
  } else if (moonDistance <= R_MOON + surfaceContactOffsetMeters) {
    next.impact = {
      target: "moon",
      speed: next.rocket.velocity.length(),
      relativeSpeed: moonRelativeSpeed,
      softLanding: moonRelativeSpeed <= SOFT_LANDING_SPEED,
    };
  }

  return next;
}

export function altitudeAboveEarth(
  position: THREE.Vector3,
  earthRadius: number,
): number {
  return position.length() - earthRadius;
}

export function altitudeAboveMoon(
  rocketPosition: THREE.Vector3,
  moonPosition: THREE.Vector3,
  moonRadius: number,
): number {
  return rocketPosition.clone().sub(moonPosition).length() - moonRadius;
}
